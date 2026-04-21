import React, { useState, useEffect } from 'react';
import { useTelegram } from './hooks/useTelegram';
import RightPanel from './components/RightPanel';
import MainGrid from './components/MainGrid';
import SettingsModal from './components/SettingsModal';
import { Settings, Share2, Crown, Layers, Search, Menu, Sparkles } from 'lucide-react';
import { generateImage, generateVideoSegment, generateScenario, generateTTS, VOICE_OPTIONS, stitchVideos } from './services/api';

function App() {
  const { tg, showHaptic, showAlert } = useTelegram();
  
  // Persistence States
  const [projectName, setProjectName] = useState(
    localStorage.getItem('projectName') || 'Claymation Pushkin Interview'
  );
  const [characterPrompt, setCharacterPrompt] = useState(
    localStorage.getItem('characterStyle') || 'Pushkin in claymation style, stop-motion aesthetic, highly detailed'
  );
  const [apiKey, setApiKey] = useState(
    localStorage.getItem('SILICON_FLOW_KEY') || ''
  );
  
  // App states
  const [actionPrompt, setActionPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [generations, setGenerations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false); // Mobile drawer state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeVideo, setActiveVideo] = useState(null); // For preview
  const [showDebug, setShowDebug] = useState(true);
  const [debugInfo, setDebugInfo] = useState({ 
    version: '...', 
    expanded: false, 
    height: 0,
    sdk: 'pending',
    ua: navigator.userAgent.slice(0, 15) + '...'
  });

  // Debug monitoring
  useEffect(() => {
    const updateDebug = () => {
      setDebugInfo({
        version: tg?.version || 'v?',
        expanded: tg?.isExpanded || false,
        height: tg?.viewportHeight || 0,
        sdk: window.onloadStatus || '?',
        ua: navigator.userAgent.includes('Telegram') ? 'TG-APP' : 'BROWSER'
      });
    };

    if (tg) {
      updateDebug();
      tg.onEvent('viewportChanged', updateDebug);
      const timer = setTimeout(() => setShowDebug(false), 30000); // 30s
      return () => {
        tg.offEvent('viewportChanged', updateDebug);
        clearTimeout(timer);
      };
    } else {
      const itv = setInterval(updateDebug, 500);
      return () => clearInterval(itv);
    }
  }, [tg]);

  const forceExpand = () => {
    if (tg) {
      tg.expand();
      if (tg.disableVerticalSwipes) tg.disableVerticalSwipes();
      showHaptic('success');
      // Visual feedback
      setDebugInfo(prev => ({ ...prev, expanded: tg.isExpanded }));
    }
  };
  
  // Pipeline Settings
  const [projectMode, setProjectMode] = useState('workflow'); // 'quick' or 'workflow'
  const [selectedVoice, setSelectedVoice] = useState(VOICE_OPTIONS[0].id);
  const [personCount, setPersonCount] = useState('1');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Responsiveness
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Save changes
  useEffect(() => {
    localStorage.setItem('projectName', projectName);
  }, [projectName]);

  useEffect(() => {
    localStorage.setItem('characterStyle', characterPrompt);
  }, [characterPrompt]);

  useEffect(() => {
    localStorage.setItem('SILICON_FLOW_KEY', apiKey);
  }, [apiKey]);

  const handleCreateScenario = async () => {
    if (!apiKey) {
      showAlert('Введите API ключ');
      setIsSettingsOpen(true);
      return;
    }
    if (!actionPrompt) return;

    setIsLoading(true);
    showHaptic('medium');
    
    try {
      const scenes = await generateScenario(actionPrompt, characterPrompt, personCount, apiKey);
      
      const newScenes = scenes.map((s, idx) => ({
        id: Date.now() + idx,
        prompt: s.image_prompt,
        voiceText: s.voice_text,
        sceneName: s.scene_name || `Сцена ${idx + 1}`,
        style: characterPrompt,
        status: 'draft',
        aspectRatio: aspectRatio
      }));
      
      setGenerations([...newScenes, ...generations]);
      setActionPrompt('');
      if (isMobile) setIsPanelOpen(false);
    } catch (err) {
      showAlert('Ошибка создания сценария');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutomateProject = async () => {
    const drafts = generations.filter(g => g.status === 'draft');
    if (drafts.length === 0) return;

    if (!apiKey) {
      showAlert('Введите API ключ');
      setIsSettingsOpen(true);
      return;
    }

    setIsLoading(true);
    showHaptic('medium');

    for (const item of drafts) {
      try {
        // 1. Set to generating (Image + TTS)
        setGenerations(prev => prev.map(g => g.id === item.id ? { ...g, status: 'generating' } : g));
        
        // 2. Generate Assets (Sync)
        const imageUrl = generateImage(`${item.style}, ${item.prompt}`);
        const audioUrl = generateTTS(item.voiceText, selectedVoice);
        
        setGenerations(prev => prev.map(g => g.id === item.id ? { ...g, imageUrl, audioUrl } : g));

        // 3. Submit Video Task (Async)
        setGenerations(prev => prev.map(g => g.id === item.id ? { ...g, status: 'generating_video' } : g));
        const { requestId } = await generateVideoSegment(imageUrl, item.prompt, apiKey);
        
        // 4. Poll for result
        let videoUrl = null;
        let attempts = 0;
        const maxAttempts = 60; // 5 min timeout

        while (!videoUrl && attempts < maxAttempts) {
          await new Promise(r => setTimeout(r, 5000)); // Poll every 5s
          const statusResult = await getVideoStatus(requestId, apiKey);
          
          if (statusResult.status === 'Succeed') {
            videoUrl = statusResult.results.videos[0].url;
          } else if (statusResult.status === 'Failed') {
            throw new Error('Video generation failed');
          }
          attempts++;
        }

        if (!videoUrl) throw new Error('Timed out');

        // 5. Final update
        setGenerations(prev => prev.map(g => g.id === item.id ? { 
          ...g, 
          videoUrl, 
          status: 'ready' 
        } : g));
      } catch (err) {
        console.error('Automation error for', item.id, err);
        setGenerations(prev => prev.map(g => g.id === item.id ? { ...g, status: 'error' } : g));
      }
    }
    
    setIsLoading(false);
    showHaptic('success');
  };

  const handleExportProject = async () => {
    const readyVideos = generations
      .filter(g => g.videoUrl && g.status === 'ready')
      .reverse() // Keep original order if generations are unshifted
      .map(g => g.videoUrl);

    if (readyVideos.length === 0) {
      showAlert('Нет готовых видео для склейки');
      return;
    }

    setIsExporting(true);
    try {
      const finalUrl = await stitchVideos(readyVideos, (msg, prog) => {
        setExportProgress(prog);
      });
      
      const a = document.createElement('a');
      a.href = finalUrl;
      a.download = `project-${projectName}.mp4`;
      a.click();
    } catch (err) {
      showAlert('Ошибка экспорта');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCreate = async () => {
    if (projectMode === 'workflow') {
      handleCreateScenario();
      return;
    }

    if (!apiKey) {
      showAlert('Введите API ключ');
      setIsSettingsOpen(true);
      return;
    }
    if (!actionPrompt) return;

    setIsLoading(true);
    showHaptic('medium');

    const newGen = {
      id: Date.now(),
      prompt: actionPrompt,
      style: characterPrompt,
      aspectRatio,
      status: 'generating',
      timestamp: new Date().toISOString()
    };

    setGenerations([newGen, ...generations]);
    setActionPrompt('');
    if (isMobile) setIsPanelOpen(false);

    try {
      await generateVideoSegment(null, `${characterPrompt}, ${actionPrompt}`, apiKey);
      setGenerations(prev => prev.map(g => g.id === newGen.id ? { 
        ...g, 
        videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
        status: 'ready' 
      } : g));
    } catch (err) {
      showAlert('Ошибка генерации');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (index) => {
    setGenerations(generations.filter((_, i) => i !== index));
    showHaptic('light');
  };

  return (
    <div className="flex flex-col h-screen bg-tg-bg text-tg-text font-sans overflow-hidden">
      {/* Debug Banner */}
      {showDebug && (
        <div className="debug-banner z-[999] bg-red-600/90 backdrop-blur-md px-4 py-2 flex items-center justify-between border-b border-white/20">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-tighter">Debug Mode v2</span>
            <span className="text-[9px] font-mono opacity-80 leading-tight">
              API:{debugInfo.version} | EXP:{debugInfo.expanded ? 'Y' : 'N'} | H:{debugInfo.height} | SDK:{debugInfo.sdk} | {debugInfo.ua}
            </span>
          </div>
          <button 
            onClick={forceExpand}
            className="px-3 py-1 bg-white text-red-600 rounded-lg text-[10px] font-bold shadow-lg active:scale-95 transition-transform"
          >
            ФИКС ЭКРАНА
          </button>
        </div>
      )}

      {/* Header */}
      <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-white/5 bg-tg-bg/80 backdrop-blur-xl z-30 shrink-0">
        <div className="flex items-center gap-2 md:gap-4 flex-1">
          <div className="w-8 h-8 rounded-lg bg-tg-button/20 flex items-center justify-center border border-tg-button/30 shrink-0">
             <Layers className="text-tg-button" size={16} />
          </div>
          <input 
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="bg-transparent border-none p-0 font-bold text-[13px] md:text-sm tracking-tight focus:ring-0 w-full max-w-[140px] md:max-w-md truncate"
            placeholder="Untitled Project"
          />
        </div>
        
        <div className="flex items-center gap-2">
          {!isMobile && (
            <>
              <button className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-xs font-bold hover:bg-white/5 transition-all">
                <Share2 size={14} /> Поделиться
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-tg-button text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-lg shadow-tg-button/20">
                <Crown size={14} /> Подписка
              </button>
            </>
          )}
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 rounded-xl glass hover:bg-tg-button/10 hover:text-tg-button transition-all border border-white/5"
          >
            <Settings size={18} />
          </button>
          {isMobile && (
            <button 
              onClick={() => setIsPanelOpen(true)}
              className="p-2.5 rounded-xl bg-tg-button text-white shadow-lg shadow-tg-button/20 ml-2"
            >
              <Sparkles size={18} />
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden relative">
        <div className={`flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:pb-10 ${!isMobile ? 'mr-[350px]' : ''}`}>
          <div className="max-w-[1200px] mx-auto">
            {/* Board Header Info (Optional) */}
            <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-1 text-white">Рабочее пространство</h2>
                <p className="text-sm text-tg-hint font-medium uppercase tracking-[0.15em] text-[10px]">Все генерации проекта • {generations.length} элементов</p>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tg-hint/40" size={16} />
                <input placeholder="Поиск..." className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-white/[0.02]" />
              </div>
            </div>

            <MainGrid 
              generations={generations} 
              onDelete={handleDelete}
              onPlay={(vid) => setActiveVideo(vid)}
            />
          </div>
        </div>

        {/* Control Panel (Responsive) */}
        <RightPanel 
          characterPrompt={characterPrompt}
          setCharacterPrompt={setCharacterPrompt}
          actionPrompt={actionPrompt}
          setActionPrompt={setActionPrompt}
          aspectRatio={aspectRatio}
          setAspectRatio={setAspectRatio}
          projectMode={projectMode}
          setProjectMode={setProjectMode}
          selectedVoice={selectedVoice}
          setSelectedVoice={setSelectedVoice}
          personCount={personCount}
          setPersonCount={setPersonCount}
          onAutomate={handleAutomateProject}
          onExport={handleExportProject}
          isExporting={isExporting}
          exportProgress={exportProgress}
          onCreate={handleCreate}
          isLoading={isLoading}
          isMobile={isMobile}
          isOpen={isPanelOpen}
          onClose={() => setIsPanelOpen(false)}
        />
      </main>

      {/* Modals */}
      {isSettingsOpen && (
        <SettingsModal 
          apiKey={apiKey} 
          setApiKey={setApiKey} 
          onClose={() => setIsSettingsOpen(false)} 
        />
      )}

      {activeVideo && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6">
           <button 
             onClick={() => setActiveVideo(null)}
             className="absolute top-8 right-8 p-3 glass rounded-full text-white hover:bg-white/10"
           >
             <X size={24} />
           </button>
           <div className="w-full max-w-5xl aspect-video glass rounded-[40px] overflow-hidden shadow-2xl ring-1 ring-white/10">
              {activeVideo.videoUrl ? (
                <video src={activeVideo.videoUrl} controls autoPlay className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                  <div className="w-16 h-16 border-4 border-tg-button/30 border-t-tg-button rounded-full animate-spin" />
                  <p className="text-tg-button font-bold animate-pulse text-sm">ГЕНЕРАЦИЯ ВИДЕО...</p>
                </div>
              )}
           </div>
        </div>
      )}

      {/* Mobile Floating Button (if drawer closed) */}
      {isMobile && !isPanelOpen && generations.length > 0 && (
        <button 
          onClick={() => setIsPanelOpen(true)}
          className="fixed right-6 w-14 h-14 rounded-full bg-tg-button text-white shadow-2xl shadow-tg-button/40 flex items-center justify-center z-40 animate-bounce"
          style={{ bottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
        >
          <Sparkles size={24} />
        </button>
      )}
    </div>
  );
}

// Minimal X icon import for the modal
const X = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

export default App;
