import { WorkflowConfig, OutputType, PagesConfig } from '../types';

export const generateYaml = (config: WorkflowConfig): string => {
  const isOciLocal = config.outputType === OutputType.OCI_LOCAL;

  const platformsString = config.platforms.join(',');

  const header = `name: Docker Build
on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

env:
  REGISTRY: ${config.registry}
  IMAGE_NAME: ${config.imageName}

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Required for git history (timestamps/commits)
`;

  const dynamicEnvSteps = config.buildArgs.filter(arg => arg.isDynamic).map(arg => `
      - name: Set dynamic build arg ${arg.key}
        run: echo "${arg.key}=${arg.value}" >> $GITHUB_ENV
`).join('');

  const qemuStep = `
      - name: Set up QEMU
        uses: docker/setup-qemu-action@v3
`;

  const buildxStep = `
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
`;

  const loginStep = !isOciLocal ? `
      - name: Log into registry \${{ env.REGISTRY }}
        if: github.event_name != 'pull_request'
        uses: docker/login-action@v3
        with:
          registry: \${{ env.REGISTRY }}
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}
` : '';

  // Construct tags
  const tags = isOciLocal 
    ? `${config.imageName}:${config.tags}`
    : `\${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}:${config.tags}`;

  // Mapping output type
  // If OCI Local: we act like 'nerdctl build -o type=oci' by using the 'outputs' input
  // If Registry: we use 'push: true'
  
  let outputConfig = '';
  if (isOciLocal) {
    outputConfig = `outputs: type=oci,dest=/tmp/oci-image.tar`;
  } else {
    outputConfig = `push: \${{ github.event_name != 'pull_request' }}`;
  }

  // Construct build args reference (some might be env vars now)
  const buildArgsRef = config.buildArgs.map(arg => {
    if (arg.isDynamic) return `${arg.key}=\${{ env.${arg.key} }}`;
    return `${arg.key}=${arg.value}`;
  }).join('\n            ');

  const buildStep = `
      - name: Build and ${isOciLocal ? 'Export' : 'Push'}
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ${config.dockerfilePath}
          platforms: ${platformsString}
          tags: ${tags}
          ${outputConfig}
          provenance: ${config.provenance}
          ${config.rewriteTimestamp ? `build-args: |
            SOURCE_DATE_EPOCH=\${{ env.SOURCE_DATE_EPOCH }}
            ${buildArgsRef}` : `build-args: |
            ${buildArgsRef}`}
          cache-from: type=gha
          cache-to: type=gha,mode=max
`;

  const uploadStep = isOciLocal ? `
      - name: Upload OCI Artifact
        uses: actions/upload-artifact@v4
        with:
          name: oci-image
          path: /tmp/oci-image.tar
          retention-days: 1
` : '';

  return `${header}${dynamicEnvSteps}${qemuStep}${buildxStep}${loginStep}${buildStep}${uploadStep}`;
};

export const generatePagesYaml = (config: PagesConfig): string => {
  const cacheStep = config.useCache ? `
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "${config.nodeVersion}"
          cache: 'npm'` : `
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "${config.nodeVersion}"`;

  return `name: Deploy to GitHub Pages

on:
  push:
    branches: ["${config.branch}"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      ${cacheStep}
          
      - name: Install dependencies
        run: ${config.installCommand}
        
      - name: Build
        run: ${config.buildCommand}
        
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ${config.outputDir}

  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
`;
};
