export enum OutputType {
  REGISTRY = 'REGISTRY',
  OCI_LOCAL = 'OCI_LOCAL'
}

export type AppMode = 'DOCKER' | 'PAGES';

export interface BuildArg {
  id: string;
  key: string;
  value: string;
  isDynamic: boolean; // if true, uses shell command
}

export interface WorkflowConfig {
  imageName: string;
  tags: string;
  platforms: string[];
  outputType: OutputType;
  dockerfilePath: string;
  provenance: boolean;
  rewriteTimestamp: boolean;
  buildArgs: BuildArg[];
  registry: string;
}

export interface PagesConfig {
  branch: string;
  nodeVersion: string;
  installCommand: string;
  buildCommand: string;
  outputDir: string;
  useCache: boolean; // If true, requires package-lock.json and uses npm ci
}

export const DEFAULT_CONFIG: WorkflowConfig = {
  imageName: 'my-org/my-app',
  tags: 'latest',
  platforms: ['linux/amd64', 'linux/arm64'],
  outputType: OutputType.REGISTRY,
  dockerfilePath: './Dockerfile',
  provenance: false,
  rewriteTimestamp: true,
  registry: 'docker.io',
  buildArgs: [
    { id: '1', key: 'GOPRIVATE', value: 'gopkg.openfuyao.cn', isDynamic: false },
    { id: '2', key: 'VERSION', value: '0.0.0-latest', isDynamic: false },
    { id: '3', key: 'COMMIT', value: '$(git rev-parse HEAD)', isDynamic: true },
    { id: '4', key: 'SOURCE_DATE_EPOCH', value: '$(git log -1 --pretty=%ct)', isDynamic: true },
  ]
};

export const DEFAULT_PAGES_CONFIG: PagesConfig = {
  branch: 'main',
  nodeVersion: '20',
  installCommand: 'npm install',
  buildCommand: 'npm run build',
  outputDir: './dist',
  useCache: false
};