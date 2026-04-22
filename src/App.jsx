import React, { useState, useEffect } from 'react';
import { useTelegram, useMainButton } from './hooks/useTelegram';
import { useProjectManager } from './hooks/useProjectManager';
import { useVideoFlow } from './hooks/useVideoFlow';
import SettingsModal from './components/SettingsModal';
import ProjectList from './components/ProjectList';
import ChatFlow from './components/ChatFlow';
import NativeInput from './components/NativeInput';
import { Settings, Share2, Menu, Sparkles, Trash2, Layers } from 'lucide-react';
import { VOICE_OPTIONS } from './services/api';

function App() {
  const { tg, showHaptic, showAlert } = useTelegram();
  const { 
    projects, 
    activeProject, 
    activeProjectId, 
    updateActiveProject, 
    createProject, 
    selectProject 
  } = useProjectManager();

  const {
    isLoading,
    isExporting,
    exportProgress,
    handleCreateScenario,
    handleAutomateProject,
    handleExportProject,
    handleSingleCreate
  } = useVideoFlow(activeProject, updateActiveProject, showHaptic, showAlert);

  const [apiKey, setApiKey] = useState(localStorage.getItem('SILICON_FLOW_KEY') || '');
  const [actionPrompt, setActionPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [view, setView] = useState(activeProjectId ? 'chat' : 'list');
  const [projectMode, setProjectMode] = useState('creative'); // 'creative' or 'workflow'
  const [personCount, setPersonCount] = useState(1);
  const [selectedVoice, setSelectedVoice] = useState(VOICE_OPTIONS[0].id);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeVideo, setActiveVideo] = useState(null);

  useEffect(() => {
    localStorage.setItem('SILICON_FLOW_KEY', apiKey);
  }, [apiKey]);

  // ─── Native MainButton Integration ──────────────────────────────────────────

  const hasDrafts = activeProject?.generations?.some(g => g.status === 'draft');
  const hasReadyVideos = activeProject?.generations?.some(g => g.status === 'ready');

  // Logic for MainButton text and action
  const mainButtonText = isExporting 
    ? `Экспорт ${exportProgress}%` 
    : hasDrafts 
      ? 'Запустить генерацию' 
      : 'Экспорт видео';

  const mainButtonAction = () => {
    if (isExporting) return;
    if (hasDrafts) {
      handleAutomateProject(selectedVoice);
    } else {
      handleExportProject();
    }
  };

  const isMainButtonVisible = view === 'chat' && (hasDrafts || hasReadyVideos || isExporting);

  useMainButton(mainButtonText, mainButtonAction, isMainButtonVisible, isLoading || isExporting);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleSend = async () => {
    if (projectMode === 'workflow') {
      const success = await handleCreateScenario(actionPrompt, personCount);
      if (success) setActionPrompt('');
    } else {
      const success = await handleSingleCreate(actionPrompt, aspectRatio);
      if (success) setActionPrompt('');
    }
  };

  const handleDelete = (index) => {
    if (!activeProject) return;
    updateActiveProject({ 
      generations: activeProject.generations.filter((_, i) => i !== index) 
    });
    showHaptic('light');
  };

  const handleUpdateVideo = (id, updates) => {
    updateActiveProject({
      generations: activeProject.generations.map(g => g.id === id ? { ...g, ...updates } : g)
    });
  };

  // Responsiveness
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden text-tg-text">
      {/* Header */}
      <div className="h-14 shrink-0 flex items-center justify-between px-4 bg-tg-header border-b border-white/5 z-30">
        <div className="flex items-center gap-3">
          {view === 'chat' && (
            <button onClick={() => setView('list')} className="p-1 -ml-1 text-tg-accent active:scale-95 transition-transform">
              <Menu size={24} />
            </button>
          )}
          <div className="flex flex-col">
            <span className="font-bold text-sm">
              {view === 'list' ? 'Чаты' : (activeProject?.name || 'Проект')}
            </span>
            <span className="text-[10px] text-tg-hint -mt-1 font-medium italic">
              {view === 'list' ? 'Video Flow Engine' : 'видео-проект'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsSettingsOpen(true)} className="p-2 hover:bg-white/5 rounded-full text-tg-hint">
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <main className="flex-1 overflow-hidden relative flex">
        {(view === 'list' || !isMobile) && (
          <ProjectList 
            projects={projects}
            activeProjectId={activeProjectId}
            onSelectProject={(id) => { selectProject(id); setView('chat'); showHaptic('light'); }}
            onCreateProject={() => { createProject(); setView('chat'); showHaptic('medium'); }}
          />
        )}

        {(view === 'chat' || !isMobile) && (
          <div className="flex-1 flex flex-col h-full relative overflow-hidden">
            {activeProject ? (
              <>
                <ChatFlow 
                  generations={activeProject.generations}
                  onSelectVideo={setActiveVideo}
                  onDeleteVideo={handleDelete}
                  onUpdateVideo={handleUpdateVideo}
                  activeProjectId={activeProjectId}
                />
                <NativeInput 
                  value={actionPrompt}
                  onChange={setActionPrompt}
                  onSend={handleSend}
                  isLoading={isLoading}
                  mode={projectMode}
                  setMode={setProjectMode}
                />
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 opacity-20 select-none">
                <Sparkles size={80} strokeWidth={1} />
                <p className="mt-4 font-medium text-lg text-center">Выберите или создайте проект</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      {isSettingsOpen && (
        <SettingsModal 
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          projectName={activeProject?.name || ''}
          setProjectName={(name) => updateActiveProject({ name })}
          characterPrompt={activeProject?.characterPrompt || ''}
          setCharacterPrompt={(cp) => updateActiveProject({ characterPrompt: cp })}
          personCount={personCount}
          setPersonCount={setPersonCount}
          aspectRatio={aspectRatio}
          setAspectRatio={setAspectRatio}
          apiKey={apiKey}
          setApiKey={setApiKey}
          selectedVoice={selectedVoice}
          setSelectedVoice={setSelectedVoice}
          voiceOptions={VOICE_OPTIONS}
        />
      )}

      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4" onClick={() => setActiveVideo(null)}>
          <div className="w-full max-w-4xl aspect-video rounded-3xl overflow-hidden glass shadow-2xl relative" onClick={e => e.stopPropagation()}>
            {activeVideo.isMotion ? (
               <img src={activeVideo.videoUrl} className="w-full h-full object-contain animate-ken-burns scale-110" />
            ) : (
               <video src={activeVideo.videoUrl} className="w-full h-full object-contain" controls autoPlay />
            )}
            <button className="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white" onClick={() => setActiveVideo(null)}>
              <Trash2 size={24} className="rotate-45" />
            </button>
          </div>
        </div>
      )}

      {/* Export progress indicator (in addition to MainButton for visibility) */}
      {isExporting && (
        <div className="fixed inset-x-4 top-16 z-[60] bg-tg-accent p-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-slide-in">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Layers className="text-white animate-pulse" size={20} />
          </div>
          <div className="flex-1">
            <div className="text-white text-xs font-bold uppercase tracking-widest mb-1">Сборка видео</div>
            <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white transition-all duration-300" style={{ width: `${exportProgress}%` }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
