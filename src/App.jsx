import React, { useState, useEffect } from 'react';
import { useTelegram } from './hooks/useTelegram';
import RightPanel from './components/RightPanel';
import MainGrid from './components/MainGrid';
import SettingsModal from './components/SettingsModal';
import { Settings, Share2, Crown, Layers, Search, Menu, Sparkles } from 'lucide-react';
import { generateImage, generateVideoSegment } from './services/api';

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

  const handleCreate = async () => {
    if (!apiKey) {
      showAlert('Введите API ключ в настройках');
      setIsSettingsOpen(true);
      return;
    }
    
    setIsLoading(true);
    showHaptic('medium');
    
    try {
      const fullPrompt = `${characterPrompt}, ${actionPrompt}`;
      const imageUrl = generateImage(fullPrompt);
      
      // Simulate/Trigger generation
      // In a real app, this would be a chain or a separate item in the grid that updates
      const newGenId = Date.now();
      const newGeneration = {
        id: newGenId,
        prompt: actionPrompt,
        style: characterPrompt,
        imageUrl: imageUrl,
        aspectRatio: aspectRatio,
        status: 'generating'
      };
      
      setGenerations([newGeneration, ...generations]);
      
      // Close mobile panel on success
      if (isMobile) setIsPanelOpen(false);

      // Trigger video generation logic
      await generateVideoSegment(imageUrl, actionPrompt, apiKey);
      
      // Mock update to "done"
      setTimeout(() => {
        setGenerations(prev => prev.map(g => g.id === newGenId ? {
          ...g,
          videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
          status: 'ready'
        } : g));
        showHaptic('success');
      }, 5000);

      setActionPrompt('');
    } catch (err) {
      showAlert('Ошибка генерации');
      console.error(err);
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
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-tg-bg/80 backdrop-blur-xl z-30">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-8 h-8 rounded-lg bg-tg-button/20 flex items-center justify-center border border-tg-button/30">
             <Layers className="text-tg-button" size={18} />
          </div>
          <input 
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="bg-transparent border-none p-0 font-bold text-sm tracking-tight focus:ring-0 w-full max-w-[200px] lg:max-w-md"
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
        {/* Sidebar Space placeholder for desktop */}
        {!isMobile && <div className="w-0 xl:w-[0px] order-none" />}
        
        {/* Main Canvas */}
        <div className={`flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar ${!isMobile ? 'mr-[350px]' : ''}`}>
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
          className="fixed bottom-8 right-6 w-14 h-14 rounded-full bg-tg-button text-white shadow-2xl shadow-tg-button/40 flex items-center justify-center z-40 animate-bounce"
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
