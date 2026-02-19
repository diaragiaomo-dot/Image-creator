
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit3, 
  Image as ImageIcon, 
  History, 
  Download, 
  Trash2, 
  Zap, 
  Sparkles, 
  Loader2,
  AlertCircle,
  ExternalLink,
  Github,
  Cloud
} from 'lucide-react';
import { GeneratedImage, AppMode, MODELS, AspectRatio, ImageSize } from './types';
import { generateImage, editImage, fileToBase64 } from './services/geminiService';

declare global {
  interface Window {
    aistudio: AIStudio;
  }
}

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.GENERATE);
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [imageSize, setImageSize] = useState<ImageSize>("1K");
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [sourceMimeType, setSourceMimeType] = useState<string>('image/png');

  useEffect(() => {
    const saved = localStorage.getItem('vision-studio-history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('vision-studio-history', JSON.stringify(history));
  }, [history]);

  const handleApiKeyCheck = async (modelId: string) => {
    if (modelId === 'gemini-3-pro-image-preview') {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
      }
    }
  };

  const onGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await handleApiKeyCheck(selectedModel.id);
      const { url, groundingChunks } = await generateImage(prompt, selectedModel.id, { aspectRatio, imageSize });
      const newImage: GeneratedImage = {
        id: crypto.randomUUID(),
        url,
        prompt,
        timestamp: Date.now(),
        model: selectedModel.name,
        groundingChunks
      };
      setHistory(prev => [newImage, ...prev]);
    } catch (err: any) {
      if (err.message?.includes("Requested entity was not found")) {
        await window.aistudio.openSelectKey();
      } else {
        setError(err.message || "Failed to generate image.");
      }
    } finally {
      setLoading(false);
    }
  };

  const onEdit = async () => {
    if (!prompt.trim() || !sourceImage) return;
    setLoading(true);
    setError(null);
    try {
      await handleApiKeyCheck(selectedModel.id);
      const url = await editImage(prompt, sourceImage, sourceMimeType, selectedModel.id);
      const newImage: GeneratedImage = {
        id: crypto.randomUUID(),
        url,
        prompt: `Edit: ${prompt}`,
        timestamp: Date.now(),
        model: selectedModel.name
      };
      setHistory(prev => [newImage, ...prev]);
    } catch (err: any) {
      if (err.message?.includes("Requested entity was not found")) {
        await window.aistudio.openSelectKey();
      } else {
        setError(err.message || "Failed to edit image.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSourceMimeType(file.type);
      const base64 = await fileToBase64(file);
      setSourceImage(base64);
    }
  };

  const deleteFromHistory = (id: string) => {
    setHistory(prev => prev.filter(img => img.id !== id));
  };

  const downloadImage = (url: string, name: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name.substring(0, 20)}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar - History & Deployment Info */}
      <aside className="w-full md:w-80 glass border-r border-white/10 flex flex-col h-auto md:h-screen">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-400" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Vision Studio
            </h1>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
          <div className="flex items-center gap-2 mb-4 text-slate-400 px-2">
            <History className="w-4 h-4" />
            <span className="text-sm font-medium">Recent Works</span>
          </div>
          
          <div className="space-y-4 mb-8">
            {history.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">
                No history yet.
              </div>
            ) : (
              history.map(img => (
                <div key={img.id} className="group relative rounded-lg overflow-hidden border border-white/5 hover:border-blue-500/50 transition-all">
                  <img src={img.url} alt={img.prompt} className="w-full aspect-square object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                    <p className="text-[10px] text-white line-clamp-2 mb-2 italic">"{img.prompt}"</p>
                    <div className="flex justify-between items-center">
                      <button 
                        onClick={() => downloadImage(img.url, img.prompt)}
                        className="p-1.5 bg-white/10 hover:bg-white/20 rounded-md transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => deleteFromHistory(img.id)}
                        className="p-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-md transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Deployment Guide Section */}
          <div className="mt-auto p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
              <Cloud className="w-3 h-3" />
              Deployment Ready
            </h3>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Puoi caricare questa cartella su GitHub e Vercel. I file di configurazione sono già inclusi.
            </p>
            <div className="flex flex-col gap-2">
              <a 
                href="https://vercel.com/new" 
                target="_blank" 
                className="flex items-center justify-between px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-medium transition-colors border border-white/5"
              >
                <span>Deploy su Vercel</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <a 
                href="https://github.com/new" 
                target="_blank" 
                className="flex items-center justify-between px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-medium transition-colors border border-white/5"
              >
                <div className="flex items-center gap-1.5">
                  <Github className="w-2.5 h-2.5" />
                  <span>Push su GitHub</span>
                </div>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        <nav className="sticky top-0 z-10 glass border-b border-white/10 px-6 py-4 flex flex-wrap gap-6 items-center justify-between">
          <div className="flex gap-1 p-1 bg-black/30 rounded-lg">
            <button 
              onClick={() => setMode(AppMode.GENERATE)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${mode === AppMode.GENERATE ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:text-white'}`}
            >
              <Plus className="w-4 h-4" />
              Generate
            </button>
            <button 
              onClick={() => setMode(AppMode.EDIT)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${mode === AppMode.EDIT ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:text-white'}`}
            >
              <Edit3 className="w-4 h-4" />
              Edit Existing
            </button>
          </div>

          <div className="flex gap-4 items-center">
             <div className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
               Model:
             </div>
             <div className="flex gap-2">
               {MODELS.map(m => (
                 <button
                   key={m.id}
                   onClick={() => setSelectedModel(m)}
                   className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                     selectedModel.id === m.id 
                     ? 'bg-purple-500/20 border-purple-500/50 text-purple-200' 
                     : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10'
                   }`}
                 >
                   {m.isPro ? <Sparkles className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                   {m.name}
                 </button>
               ))}
             </div>
          </div>
        </nav>

        <div className="flex-1 p-6 md:p-12 max-w-5xl mx-auto w-full">
          {error && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-200 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-8">
            <div className="glass rounded-2xl p-6 md:p-8 space-y-6">
              {mode === AppMode.EDIT && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-300">Source Image</label>
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl p-8 hover:border-blue-500/40 transition-colors group relative overflow-hidden bg-black/20">
                    {sourceImage ? (
                      <div className="relative group/img max-w-sm">
                         <img src={sourceImage} alt="Source" className="rounded-lg max-h-64 shadow-2xl" />
                         <button 
                            onClick={() => setSourceImage(null)}
                            className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity"
                          >
                           <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="w-10 h-10 text-slate-500 mb-3 group-hover:text-blue-400 transition-colors" />
                        <p className="text-sm text-slate-400 mb-1">Upload the image you want to modify</p>
                        <p className="text-xs text-slate-600 mb-4">PNG, JPG or WebP</p>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleFileUpload} 
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <div className="px-4 py-2 bg-white/5 text-xs font-semibold rounded-md border border-white/10 pointer-events-none group-hover:bg-blue-600 group-hover:border-blue-500 transition-all">
                          Select File
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-300">
                  {mode === AppMode.GENERATE ? "What should the image look like?" : "How do you want to change it?"}
                </label>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={mode === AppMode.GENERATE ? "e.g. A futuristic cyberpunk city in neon rain..." : "e.g. Add a red sports car in the background..."}
                  className="w-full h-32 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none placeholder:text-slate-600"
                />
              </div>

              <div className="flex flex-wrap gap-8 items-end">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-300">Aspect Ratio</label>
                  <div className="flex gap-2">
                    {["1:1", "3:4", "4:3", "9:16", "16:9"].map((r) => (
                      <button
                        key={r}
                        onClick={() => setAspectRatio(r as AspectRatio)}
                        className={`w-12 h-10 flex items-center justify-center rounded-lg border text-xs transition-all ${
                          aspectRatio === r 
                          ? 'bg-blue-600 border-blue-500 text-white' 
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedModel.isPro && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-300">Resolution</label>
                    <div className="flex gap-2">
                      {["1K", "2K", "4K"].map((s) => (
                        <button
                          key={s}
                          onClick={() => setImageSize(s as ImageSize)}
                          className={`px-3 h-10 flex items-center justify-center rounded-lg border text-xs font-bold transition-all ${
                            imageSize === s 
                            ? 'bg-purple-600 border-purple-500 text-white' 
                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button 
                  onClick={mode === AppMode.GENERATE ? onGenerate : onEdit}
                  disabled={loading || !prompt.trim() || (mode === AppMode.EDIT && !sourceImage)}
                  className={`flex-1 min-w-[200px] h-12 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-xl shadow-blue-900/10 ${
                    loading || !prompt.trim() || (mode === AppMode.EDIT && !sourceImage)
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {mode === AppMode.GENERATE ? 'Generating Magic...' : 'Enhancing...'}
                    </>
                  ) : (
                    <>
                      {mode === AppMode.GENERATE ? <Sparkles className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
                      {mode === AppMode.GENERATE ? 'Generate Image' : 'Apply Changes'}
                    </>
                  )}
                </button>
              </div>
            </div>

            {history.length > 0 && !loading && (
               <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-200">Latest Creation</h2>
                    <span className="text-xs text-slate-500">{new Date(history[0].timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="group relative rounded-3xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10 bg-slate-900">
                    <img 
                      src={history[0].url} 
                      alt={history[0].prompt} 
                      className="w-full max-h-[60vh] object-contain mx-auto"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-8 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity">
                       <div className="flex-1 pr-12">
                         <p className="text-sm font-medium text-white mb-1 line-clamp-2">"{history[0].prompt}"</p>
                         <p className="text-xs text-slate-400">Created with {history[0].model}</p>
                       </div>
                       <button 
                        onClick={() => downloadImage(history[0].url, history[0].prompt)}
                        className="p-3 bg-white text-black rounded-full hover:scale-110 active:scale-95 transition-all"
                       >
                         <Download className="w-6 h-6" />
                       </button>
                    </div>
                  </div>

                  {history[0].groundingChunks && history[0].groundingChunks.length > 0 && (
                    <div className="mt-4 p-4 glass rounded-xl border border-white/5 space-y-3">
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <ExternalLink className="w-3 h-3" />
                        Search Sources
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {history[0].groundingChunks.map((chunk, idx) => chunk.web && (
                          <a 
                            key={idx} 
                            href={chunk.web.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-xs rounded-lg border border-blue-500/20 transition-colors flex items-center gap-2"
                          >
                            {chunk.web.title || 'Source'}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
               </div>
            )}

            {history.length === 0 && !loading && (
              <div className="py-20 flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                  <ImageIcon className="w-10 h-10 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-300">Ready to create something amazing?</h2>
                <p className="text-slate-500 max-w-md mx-auto">
                  Describe the image you want to see, or upload one to make changes with natural language.
                </p>
              </div>
            )}

            {loading && (
              <div className="glass rounded-3xl overflow-hidden aspect-video flex flex-col items-center justify-center space-y-6 animate-pulse border-blue-500/20">
                <div className="relative">
                  <div className="absolute inset-0 blur-2xl bg-blue-500/30 rounded-full animate-pulse"></div>
                  <Loader2 className="w-16 h-16 text-blue-500 animate-spin relative" />
                </div>
                <div className="space-y-2 text-center">
                  <p className="text-xl font-medium text-blue-200">Bringing your vision to life...</p>
                  <p className="text-sm text-slate-500">Google Gemini is processing your creative request</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="mt-auto p-8 border-t border-white/5 text-center text-slate-600 text-xs">
          <p>Powered by Google Gemini • Built for Deployment on GitHub & Vercel</p>
        </footer>
      </main>
    </div>
  );
};

export default App;
