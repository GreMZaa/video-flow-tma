import React, { useState, useEffect } from 'react';
import { useTelegram, useMainButton } from './hooks/useTelegram';
import { useProjectManager } from './hooks/useProjectManager';
import { useVideoFlow } from './hooks/useVideoFlow';
import SettingsModal from './components/SettingsModal';
import ProjectList from './components/ProjectList';
import ChatFlow from './components/ChatFlow';
import NativeInput from './components/NativeInput';
import { Settings, Sparkles, Layers, ChevronLeft, Plus, Edit3 } from 'lucide-react';
import { VOICE_OPTIONS } from './services/api';

function App() {
  const { tg, showHaptic, showAlert, showConfirm } = useTelegram();
  const [apiKey, setApiKey] = useState(localStorage.getItem('SILICON_FLOW_KEY') || '');
  const [actionPrompt, setActionPrompt] = useState('');

  const {
    projects,
    activeProject,
    activeProjectId,
    updateActiveProject,
    createProject,
    deleteProject,
    selectProject,
    renameProject
  } = useProjectManager();

  const {
    isLoading,
    isExporting,
    exportProgress,
    handleCreateScenario,
    handleAutomateProject,
    handleExportProject,
    handleSingleCreate
  } = useVideoFlow(activeProject, updateActiveProject, showHaptic, showAlert, apiKey);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [view, setView] = useState('list'); // 'list' | 'chat'
  const [projectMode, setProjectMode] = useState('workflow');
  const [personCount, setPersonCount] = useState(1);
  const [selectedVoice, setSelectedVoice] = useState(VOICE_OPTIONS[0].id);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeVideo, setActiveVideo] = useState(null);

  // Detect mobile vs desktop
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    localStorage.setItem('SILICON_FLOW_KEY', apiKey);
  }, [apiKey]);

  // ─── MainButton ───────────────────────────────────────────────────────────────
  const hasDrafts = activeProject?.generations?.some(g => g.status === 'draft');
  const hasReadyVideos = activeProject?.generations?.some(g => g.status === 'ready');
  const mainButtonText = isExporting
    ? `Экспорт ${exportProgress}%`
    : hasDrafts ? 'Запустить генерацию' : 'Экспорт видео';
  const mainButtonAction = () => {
    if (isExporting) return;
    hasDrafts ? handleAutomateProject(selectedVoice) : handleExportProject();
  };
  const isMainButtonVisible = view === 'chat' && (hasDrafts || hasReadyVideos || isExporting);
  useMainButton(mainButtonText, mainButtonAction, isMainButtonVisible, isLoading || isExporting);

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!actionPrompt.trim() || isLoading) return;
    
    const success = projectMode === 'workflow'
      ? await handleCreateScenario(actionPrompt, personCount)
      : await handleSingleCreate(actionPrompt, aspectRatio);
      
    if (success) {
      setActionPrompt('');
    }
  };

  const handleDeleteFrame = (index) => {
    if (!activeProject) return;
    updateActiveProject({ generations: activeProject.generations.filter((_, i) => i !== index) });
    showHaptic('light');
  };

  const handleClearDrafts = () => {
    if (!activeProject) return;
    updateActiveProject({ generations: activeProject.generations.filter(g => g.status !== 'draft') });
    showHaptic('warning');
  };

  const handleUpdateVideo = (id, updates) => {
    updateActiveProject({
      generations: activeProject.generations.map(g => g.id === id ? { ...g, ...updates } : g)
    });
  };

  const handleSelectProject = (id) => {
    selectProject(id);
    setView('chat');
    setIsEditMode(false);
    showHaptic('light');
    // Move selected project to top
    updateActiveProject({}, true);
  };

  const handleCreateProject = () => {
    createProject();
    setView('chat');
    setIsEditMode(false);
    showHaptic('medium');
  };

  const handleDeleteProject = (id) => {
    deleteProject(id);
    showHaptic('warning');
    if (id === activeProjectId) setView('list');
  };

  const handleBackToList = () => {
    setView('list');
    setIsEditMode(false);
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  // On desktop: show both panels side-by-side
  // On mobile:  show only the current view
  const showListPanel = !isMobile || view === 'list';
  const showChatPanel = !isMobile || view === 'chat';

  // On desktop, the header is shared and shows "Проекты" always.
  // On mobile, it's context-sensitive.
  const isDesktop = !isMobile;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', background: 'var(--tg-bg)', color: 'var(--tg-text)' }}>

      {/* Header logic: List view header is managed by ProjectList component */}
      {view === 'chat' && (
        <div
          className="glass-header shrink-0 z-30"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingLeft: 8,
            paddingRight: 8,
            paddingBottom: 6,
            paddingTop: isMobile ? 'env(safe-area-inset-top, 44px)' : 8,
            minHeight: isMobile ? 88 : 60,
            position: 'relative',
          }}
        >
        {/* Left Side: Back or Edit */}
        <div style={{ width: 80, display: 'flex', alignItems: 'center' }}>
          {view === 'chat' ? (
            <button
              onClick={handleBackToList}
              className="ios-btn"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2, 
                color: 'var(--tg-accent)', 
                marginLeft: -8, 
                background: 'none', 
                border: 'none',
                padding: '8px 12px'
              }}
            >
              <ChevronLeft size={32} strokeWidth={2.5} />
              <span style={{ fontSize: 17, fontWeight: 400, marginLeft: -4 }}>Назад</span>
            </button>
          ) : (
            <button
              onClick={() => setIsEditMode(prev => !prev)}
              className="ios-btn"
              style={{
                color: isEditMode ? '#ff3b30' : 'var(--tg-accent)',
                fontSize: 17, fontWeight: 400,
                background: 'none', border: 'none',
                padding: '8px 16px'
              }}
            >
              {isEditMode ? 'Готово' : 'Изм.'}
            </button>
          )}
        </div>

        {/* Center: Title / Project Info */}
        <div 
          onClick={() => view === 'chat' && setIsSettingsOpen(true)}
          style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            cursor: view === 'chat' ? 'pointer' : 'default',
            textAlign: 'center'
          }}
        >
          {view === 'chat' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: 17, lineHeight: 1.2 }}>
                {activeProject?.name || 'Проект'}
              </span>
              <span style={{ fontSize: 13, color: 'var(--tg-hint)', lineHeight: 1.1, display: 'flex', alignItems: 'center', gap: 4 }}>
                {isLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 2, color: 'var(--tg-accent)' }}>
                    печатает
                    <span className="typing-container">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </span>
                  </span>
                ) : `${activeProject?.generations?.length || 0} кадров`}
              </span>
            </div>
          ) : (
            <span style={{ fontWeight: 600, fontSize: 17 }}>
              {isDesktop ? 'Video Flow' : 'Чаты'}
            </span>
          )}
        </div>

        {/* Right Side: Settings or New Project */}
        <div style={{ width: 80, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
          {view === 'list' ? (
            <button
              onClick={handleCreateProject}
              className="ios-btn"
              style={{ color: 'var(--tg-accent)', background: 'none', border: 'none', padding: 4 }}
            >
              <Plus size={30} strokeWidth={2} />
            </button>
          ) : (
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="ios-btn"
              style={{ color: 'var(--tg-accent)', background: 'none', border: 'none', padding: 4 }}
            >
              <Settings size={22} />
            </button>
          )}
        </div>
      </div>
      )}

      {/* ── Main Content ────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'row', background: 'var(--tg-bg)' }}>

        {/* Project List Panel */}
        {showListPanel && (
          <div style={{
            width: isMobile ? '100%' : 320,
            minWidth: isMobile ? '100%' : 280,
            maxWidth: isMobile ? '100%' : 360,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            borderRight: isMobile ? 'none' : '0.5px solid rgba(255,255,255,0.07)',
            flexShrink: 0,
          }}>
            <ProjectList
              projects={projects}
              activeProjectId={activeProjectId}
              isEditMode={isEditMode}
              setIsEditMode={setIsEditMode}
              onSelectProject={handleSelectProject}
              onDeleteProject={handleDeleteProject}
              onNewProject={handleCreateProject}
              showConfirm={showConfirm}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onShowContacts={() => showAlert('Разработчик: @ssharonovv\nВерсия: 1.2.0 Production')}
            />
          </div>
        )}

        {/* Chat Panel */}
        {showChatPanel && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {activeProject ? (
              <>
                <ChatFlow
                  generations={activeProject.generations}
                  onSelectVideo={setActiveVideo}
                  onDeleteVideo={handleDeleteFrame}
                  onUpdateVideo={handleUpdateVideo}
                  onRunGeneration={() => handleAutomateProject(selectedVoice)}
                  onClearDrafts={handleClearDrafts}
                />
                <NativeInput
                  value={actionPrompt}
                  onChange={setActionPrompt}
                  onSend={handleSend}
                  isLoading={isLoading}
                  mode={projectMode}
                  setMode={setProjectMode}
                  onRunGeneration={() => handleAutomateProject(selectedVoice)}
                  onExport={handleExportProject}
                  hasDrafts={hasDrafts}
                  hasReadyVideos={hasReadyVideos}
                  isExporting={isExporting}
                />
              </>
            ) : (
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                opacity: 0.15, userSelect: 'none'
              }}>
                <Sparkles size={72} strokeWidth={1} />
                <p style={{ marginTop: 16, fontSize: 17, fontWeight: 500 }}>
                  Выберите или создайте проект
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Settings Modal ─────────────────────────────────────────────────────── */}
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

      {/* ── Video Lightbox ─────────────────────────────────────────────────────── */}
      {activeVideo && (
        <div
          onClick={() => setActiveVideo(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)', padding: 16
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 900,
              aspectRatio: '16/9', borderRadius: 24,
              overflow: 'hidden', position: 'relative', background: '#000'
            }}
          >
            {activeVideo.isMotion ? (
              <img src={activeVideo.videoUrl} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="frame" />
            ) : (
              <video src={activeVideo.videoUrl} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'contain' }} controls autoPlay />
            )}
            <button
              onClick={() => setActiveVideo(null)}
              style={{
                position: 'absolute', top: 12, right: 12,
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                color: 'white', fontSize: 22, lineHeight: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', cursor: 'pointer'
              }}
            >×</button>
          </div>
        </div>
      )}

      {/* ── Export Progress ────────────────────────────────────────────────────── */}
      {isExporting && (
        <div style={{
          position: 'fixed', left: 16, right: 16, top: 100, zIndex: 60,
          background: 'var(--tg-accent)', borderRadius: 20, padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 8px 32px rgba(0,122,255,0.4)'
        }}>
          <Layers className="text-white animate-pulse" size={22} />
          <div style={{ flex: 1 }}>
            <div style={{ color: 'white', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
              Сборка видео
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.25)', borderRadius: 2 }}>
              <div style={{ height: '100%', background: 'white', width: `${exportProgress}%`, borderRadius: 2, transition: 'width 0.3s' }} />
            </div>
          </div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>{exportProgress}%</span>
        </div>
      )}
    </div>
  );
}

export default App;
