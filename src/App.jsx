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
  const { tg, showHaptic, showAlert } = useTelegram();
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
  } = useVideoFlow(activeProject, updateActiveProject, showHaptic, showAlert);

  const [apiKey, setApiKey] = useState(localStorage.getItem('SILICON_FLOW_KEY') || '');
  const [actionPrompt, setActionPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [view, setView] = useState('list'); // 'list' | 'chat'
  const [projectMode, setProjectMode] = useState('creative');
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
    if (success) setActionPrompt('');
  };

  const handleDeleteFrame = (index) => {
    if (!activeProject) return;
    updateActiveProject({ generations: activeProject.generations.filter((_, i) => i !== index) });
    showHaptic('light');
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

      {/* ── Single App Header ──────────────────────────────────────────────────── */}
      <div
        className="glass-header shrink-0 z-30"
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          paddingLeft: 16,
          paddingRight: 16,
          paddingBottom: 10,
          paddingTop: isMobile ? 'env(safe-area-inset-top, 44px)' : 12,
          minHeight: isMobile ? 90 : 56,
          position: 'relative',
        }}
      >
        {/* MOBILE: Chat view header */}
        {isMobile && view === 'chat' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
            <button
              onClick={handleBackToList}
              style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--tg-accent)', padding: '4px 4px 4px 0' }}
            >
              <ChevronLeft size={28} strokeWidth={2.5} />
              <span style={{ fontSize: 17, fontWeight: 500 }}>Проекты</span>
            </button>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, marginLeft: 4 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg, #50a2e9, #2b5278)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 700, fontSize: 16, flexShrink: 0
              }}>
                {activeProject?.name?.[0]?.toUpperCase() || 'П'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 700, fontSize: 17, lineHeight: 1.2 }}>
                  {activeProject?.name || 'Проект'}
                </span>
                <span style={{ fontSize: 12, color: 'var(--tg-hint)' }}>
                  {activeProject?.generations?.length || 0} кадров
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsSettingsOpen(true)}
              style={{ color: 'var(--tg-accent)', padding: 8 }}
            >
              <Settings size={22} />
            </button>
          </div>
        ) : (
          /* MOBILE: List header | DESKTOP: unified header */
          <div style={{ display: 'flex', alignItems: 'center', width: '100%', position: 'relative' }}>
            <button
              onClick={() => setIsEditMode(prev => !prev)}
              style={{
                color: isEditMode ? '#ff3b30' : 'var(--tg-accent)',
                fontSize: 17, fontWeight: 500, minWidth: 60
              }}
            >
              {isEditMode ? 'Готово' : 'Изм.'}
            </button>

            <span style={{
              position: 'absolute', left: '50%', transform: 'translateX(-50%)',
              fontWeight: 700, fontSize: 17, pointerEvents: 'none'
            }}>
              Проекты
            </span>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
              {isDesktop && (
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  style={{ color: 'var(--tg-hint)', padding: 6 }}
                >
                  <Settings size={22} />
                </button>
              )}
              <button
                onClick={handleCreateProject}
                style={{ color: 'var(--tg-accent)', padding: 4 }}
              >
                <Plus size={26} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}
      </div>

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
              onSelectProject={handleSelectProject}
              onDeleteProject={handleDeleteProject}
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
              <img src={activeVideo.videoUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="frame" />
            ) : (
              <video src={activeVideo.videoUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} controls autoPlay />
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
