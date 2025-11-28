import React, { useState, useEffect } from 'react';
import { generateYaml, generatePagesYaml } from './utils/yamlGenerator';
import { generateDockerfile } from './services/geminiService';
import { WorkflowConfig, DEFAULT_CONFIG, OutputType, BuildArg, AppMode, PagesConfig, DEFAULT_PAGES_CONFIG } from './types';
import { Icons } from './components/Icon';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('DOCKER');
  
  // Docker State
  const [config, setConfig] = useState<WorkflowConfig>(DEFAULT_CONFIG);
  
  // Pages State
  const [pagesConfig, setPagesConfig] = useState<PagesConfig>(DEFAULT_PAGES_CONFIG);

  // Common State
  const [generatedYaml, setGeneratedYaml] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [dockerfileContent, setDockerfileContent] = useState('');
  const [activeTab, setActiveTab] = useState<'yaml' | 'dockerfile'>('yaml');

  useEffect(() => {
    if (mode === 'DOCKER') {
      setGeneratedYaml(generateYaml(config));
    } else {
      setGeneratedYaml(generatePagesYaml(pagesConfig));
    }
  }, [config, pagesConfig, mode]);

  const handleAiGenerate = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    try {
      const content = await generateDockerfile(aiPrompt);
      setDockerfileContent(content);
      if (mode === 'DOCKER') setActiveTab('dockerfile');
    } catch (e) {
      alert("Failed to generate Dockerfile. Ensure API Key is valid.");
    } finally {
      setIsGenerating(false);
    }
  };

  const updateConfig = (key: keyof WorkflowConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const updatePagesConfig = (key: keyof PagesConfig, value: any) => {
    setPagesConfig(prev => {
      // Auto-switch install command based on cache preference
      if (key === 'useCache') {
        return { 
          ...prev, 
          useCache: value,
          installCommand: value ? 'npm ci' : 'npm install'
        };
      }
      return { ...prev, [key]: value };
    });
  };

  const togglePlatform = (platform: string) => {
    setConfig(prev => {
      const platforms = prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform];
      return { ...prev, platforms };
    });
  };

  const addBuildArg = () => {
    const newArg: BuildArg = {
      id: Date.now().toString(),
      key: 'NEW_ARG',
      value: 'value',
      isDynamic: false
    };
    setConfig(prev => ({ ...prev, buildArgs: [...prev.buildArgs, newArg] }));
  };

  const removeBuildArg = (id: string) => {
    setConfig(prev => ({
      ...prev,
      buildArgs: prev.buildArgs.filter(arg => arg.id !== id)
    }));
  };

  const updateBuildArg = (id: string, field: keyof BuildArg, value: any) => {
    setConfig(prev => ({
      ...prev,
      buildArgs: prev.buildArgs.map(arg => 
        arg.id === id ? { ...arg, [field]: value } : arg
      )
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Icons.Box className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              ActionForge
            </h1>
            
            <div className="h-6 w-px bg-slate-700 mx-2"></div>
            
            <div className="flex bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
              <button
                onClick={() => setMode('DOCKER')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${mode === 'DOCKER' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                Docker Build
              </button>
              <button
                onClick={() => setMode('PAGES')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${mode === 'PAGES' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                Pages Deploy
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <a href="#" className="hover:text-white transition-colors">Documentation</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Configuration */}
        <div className="space-y-6">
          
          {/* DOCKER MODE CONFIGURATION */}
          {mode === 'DOCKER' && (
            <>
              {/* AI Assistance Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-indigo-400">
                  <Icons.Wand2 className="w-5 h-5" />
                  <h2 className="font-semibold text-white">AI Dockerfile Assistant</h2>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Describe your app (e.g., 'Go generic server using 1.22')" 
                    className="flex-1 bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-500"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                  />
                  <button 
                    onClick={handleAiGenerate}
                    disabled={isGenerating || !aiPrompt}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    {isGenerating ? 'Thinking...' : 'Generate'}
                  </button>
                </div>
              </div>

              {/* General Settings */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-slate-300 border-b border-slate-800 pb-3">
                  <Icons.Settings className="w-5 h-5" />
                  <h2 className="font-semibold">General Configuration</h2>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400 uppercase">Registry</label>
                    <input 
                      type="text" 
                      value={config.registry}
                      onChange={(e) => updateConfig('registry', e.target.value)}
                      className="w-full bg-slate-800 border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400 uppercase">Image Name</label>
                    <input 
                      type="text" 
                      value={config.imageName}
                      onChange={(e) => updateConfig('imageName', e.target.value)}
                      className="w-full bg-slate-800 border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400 uppercase">Docker File Path</label>
                  <div className="relative">
                    <Icons.FileText className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      value={config.dockerfilePath}
                      onChange={(e) => updateConfig('dockerfilePath', e.target.value)}
                      className="w-full bg-slate-800 border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Platforms & Output */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-slate-300 border-b border-slate-800 pb-3">
                  <Icons.Cpu className="w-5 h-5" />
                  <h2 className="font-semibold">Target Platforms & Output</h2>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase">Platforms</label>
                  <div className="flex flex-wrap gap-2">
                    {['linux/amd64', 'linux/arm64', 'linux/arm/v7', 'linux/riscv64'].map(p => (
                      <button
                        key={p}
                        onClick={() => togglePlatform(p)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          config.platforms.includes(p)
                            ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div 
                    onClick={() => updateConfig('outputType', OutputType.REGISTRY)}
                    className={`cursor-pointer p-4 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                      config.outputType === OutputType.REGISTRY
                      ? 'bg-indigo-500/10 border-indigo-500 text-indigo-200'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <Icons.UploadCloud className="w-6 h-6" />
                    <span className="text-sm font-medium">Push to Registry</span>
                  </div>
                  
                  <div 
                    onClick={() => updateConfig('outputType', OutputType.OCI_LOCAL)}
                    className={`cursor-pointer p-4 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                      config.outputType === OutputType.OCI_LOCAL
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-200'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <Icons.Download className="w-6 h-6" />
                    <span className="text-sm font-medium">Export OCI Tarball</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${config.rewriteTimestamp ? 'bg-indigo-600 border-indigo-600' : 'border-slate-600'}`}>
                        {config.rewriteTimestamp && <Icons.PlayCircle className="w-3 h-3 text-white" />}
                      </div>
                      <input type="checkbox" className="hidden" checked={config.rewriteTimestamp} onChange={e => updateConfig('rewriteTimestamp', e.target.checked)} />
                      <span className="text-sm text-slate-400 group-hover:text-slate-200">Rewrite Timestamps</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${config.provenance ? 'bg-indigo-600 border-indigo-600' : 'border-slate-600'}`}>
                        {config.provenance && <Icons.PlayCircle className="w-3 h-3 text-white" />}
                      </div>
                      <input type="checkbox" className="hidden" checked={config.provenance} onChange={e => updateConfig('provenance', e.target.checked)} />
                      <span className="text-sm text-slate-400 group-hover:text-slate-200">Generate Provenance</span>
                    </label>
                </div>
              </div>

              {/* Build Args */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Icons.Layers className="w-5 h-5" />
                    <h2 className="font-semibold">Build Arguments</h2>
                  </div>
                  <button onClick={addBuildArg} className="text-xs flex items-center gap-1 text-indigo-400 hover:text-indigo-300">
                    <Icons.Plus className="w-3 h-3" /> Add Arg
                  </button>
                </div>

                <div className="space-y-3">
                  {config.buildArgs.map(arg => (
                    <div key={arg.id} className="flex gap-2 items-start group">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <input 
                          className="bg-slate-800 border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none"
                          placeholder="KEY"
                          value={arg.key}
                          onChange={e => updateBuildArg(arg.id, 'key', e.target.value)}
                        />
                        <input 
                          className="bg-slate-800 border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                          placeholder="VALUE"
                          value={arg.value}
                          onChange={e => updateBuildArg(arg.id, 'value', e.target.value)}
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-1.5">
                        <button 
                          title="Is Dynamic? (Shell execution)"
                          onClick={() => updateBuildArg(arg.id, 'isDynamic', !arg.isDynamic)}
                          className={`p-1 rounded ${arg.isDynamic ? 'text-amber-400 bg-amber-400/10' : 'text-slate-600 hover:text-slate-400'}`}
                        >
                          <Icons.Code className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => removeBuildArg(arg.id)}
                          className="p-1 text-slate-600 hover:text-red-400 transition-colors"
                        >
                          <Icons.Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* PAGES MODE CONFIGURATION */}
          {mode === 'PAGES' && (
             <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
               <div className="flex items-center gap-2 text-slate-300 border-b border-slate-800 pb-3">
                 <Icons.Globe className="w-5 h-5 text-indigo-400" />
                 <h2 className="font-semibold">GitHub Pages Configuration</h2>
               </div>
               
               <div className="space-y-4">
                 <div className="space-y-1">
                   <label className="text-xs font-medium text-slate-400 uppercase">Target Branch</label>
                   <input 
                     type="text" 
                     value={pagesConfig.branch}
                     onChange={(e) => updatePagesConfig('branch', e.target.value)}
                     className="w-full bg-slate-800 border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                   />
                 </div>

                 <div className="space-y-1">
                   <label className="text-xs font-medium text-slate-400 uppercase">Output Directory (Artifact Path)</label>
                   <input 
                     type="text" 
                     value={pagesConfig.outputDir}
                     onChange={(e) => updatePagesConfig('outputDir', e.target.value)}
                     className="w-full bg-slate-800 border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                     placeholder="./dist"
                   />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-400 uppercase">Node Version</label>
                      <input 
                        type="text" 
                        value={pagesConfig.nodeVersion}
                        onChange={(e) => updatePagesConfig('nodeVersion', e.target.value)}
                        className="w-full bg-slate-800 border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-400 uppercase">Use Lockfile / Cache</label>
                      <div 
                         onClick={() => updatePagesConfig('useCache', !pagesConfig.useCache)}
                         className={`w-full cursor-pointer h-[38px] rounded-lg border px-3 flex items-center gap-2 transition-all ${pagesConfig.useCache ? 'bg-emerald-500/10 border-emerald-500 text-emerald-200' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                      >
                         <div className={`w-3 h-3 rounded-full ${pagesConfig.useCache ? 'bg-emerald-400' : 'bg-slate-600'}`}></div>
                         <span className="text-sm select-none">{pagesConfig.useCache ? 'Enabled (Requires package-lock.json)' : 'Disabled (Safe for no lockfile)'}</span>
                      </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                     <label className="text-xs font-medium text-slate-400 uppercase">Install Command</label>
                     <input 
                       type="text" 
                       value={pagesConfig.installCommand}
                       onChange={(e) => updatePagesConfig('installCommand', e.target.value)}
                       className="w-full bg-slate-800 border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                     />
                   </div>
                   <div className="space-y-1">
                     <label className="text-xs font-medium text-slate-400 uppercase">Build Command</label>
                     <input 
                       type="text" 
                       value={pagesConfig.buildCommand}
                       onChange={(e) => updatePagesConfig('buildCommand', e.target.value)}
                       className="w-full bg-slate-800 border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                     />
                   </div>
                 </div>

                 {!pagesConfig.useCache && (
                    <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-3 text-xs text-indigo-200/80">
                      <strong>Note:</strong> Caching is disabled. This fixes the "Lock file not found" error but may slow down builds slightly.
                    </div>
                 )}
               </div>
             </div>
          )}

        </div>

        {/* Right Column: Preview */}
        <div className="flex flex-col h-full sticky top-24 max-h-[calc(100vh-8rem)]">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-slate-800">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setActiveTab('yaml')}
                  className={`text-sm font-medium pb-0.5 border-b-2 transition-colors ${activeTab === 'yaml' ? 'text-indigo-400 border-indigo-400' : 'text-slate-400 border-transparent hover:text-slate-300'}`}
                >
                  {mode === 'DOCKER' ? 'main.yml' : 'deploy-pages.yml'}
                </button>
                {mode === 'DOCKER' && (
                  <button 
                    onClick={() => setActiveTab('dockerfile')}
                    className={`text-sm font-medium pb-0.5 border-b-2 transition-colors ${activeTab === 'dockerfile' ? 'text-indigo-400 border-indigo-400' : 'text-slate-400 border-transparent hover:text-slate-300'}`}
                  >
                    Dockerfile
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                 <button 
                  onClick={() => navigator.clipboard.writeText(activeTab === 'yaml' ? generatedYaml : dockerfileContent)}
                  className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-md transition-all flex items-center gap-2"
                >
                   <Icons.Code className="w-3 h-3" /> Copy
                 </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto bg-[#0d1117] p-4 custom-scrollbar">
              <pre className="text-sm font-mono leading-relaxed">
                {activeTab === 'yaml' ? (
                  <code className="language-yaml text-emerald-400/90 whitespace-pre-wrap">
                    {generatedYaml}
                  </code>
                ) : (
                  <code className="language-dockerfile text-blue-300/90 whitespace-pre-wrap">
                    {dockerfileContent || '# Use the AI Assistant on the left to generate a Dockerfile...'}
                  </code>
                )}
              </pre>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-lg text-indigo-300 text-sm">
            <p className="flex gap-2">
              <Icons.Box className="w-5 h-5 flex-shrink-0" />
              <span>
                <strong>Tip:</strong> 
                {mode === 'DOCKER' 
                  ? (config.outputType === OutputType.OCI_LOCAL 
                      ? ' You selected OCI Local Export. The workflow will save the image as a GitHub Artifact.'
                      : ' You are pushing to a Registry. Configure your secrets (DOCKER_USERNAME, DOCKER_PASSWORD) in GitHub settings.')
                  : ' Go to Repository Settings -> Pages -> Build and deployment, and ensure "Source" is set to "GitHub Actions".'
                }
              </span>
            </p>
          </div>
        </div>

      </main>
    </div>
  );
};

export default App;