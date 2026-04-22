import React, { useState, useEffect } from 'react';
import { useTelegram } from './hooks/useTelegram';
import SettingsModal from './components/SettingsModal';
import ProjectList from './components/ProjectList';
import ChatFlow from './components/ChatFlow';
import NativeInput from './components/NativeInput';
import { Settings, Share2, Menu, Sparkles, Trash2, Layers } from 'lucide-react';
import { generateImage, generateVideoSegment, generateScenario, generateTTS, VOICE_OPTIONS, stitchVideos } from './services/api';

function App() {
  const { tg, showHaptic, showAlert, showMainButton, hideMainButton, setMainButtonLoading } = useTelegram();

  // ── Multi-Project State ────────────────────────────────────────────────
  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem('vf_projects');
    if (saved) return JSON.parse(saved);
    
    const oldName = localStorage.getItem('projectName');
    if (oldName) {
      return [{
        id: 'legacy-project',
        name: oldName,
        characterPrompt: localStorage.getItem('characterStyle') || 'Pushkin in claymation style',
        generations: [],
        lastUpdate: new Date().toISOString()
      }];
    }
    return [{
      id: 'first-project',
      name: 'Новый проект',
      characterPrompt: 'Cinematic studio animation style, high quality',
      generations: [],
      lastUpdate: new Date().toISOString()
    }];
  });

  const [activeProjectId, setActiveProjectId] = useState(
    localStorage.getItem('vf_activeProjectId') || (projects[0]?.id || null)
  );

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];

  const [apiKey, setApiKey] = useState(localStorage.getItem('SILICON_FLOW_KEY') || '');
  const [actionPrompt, setActionPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [view, setView] = useState(activeProjectId ? 'chat' : 'list');
  const [projectMode, setProjectMode] = useState('creative'); // 'creative' or 'workflow'
  const [personCount, setPersonCount] = useState(1);
  const [selectedVoice, setSelectedVoice] = useState(VOICE_OPTIONS[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeVideo, setActiveVideo] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('vf_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    if (activeProjectId) localStorage.setItem('vf_activeProjectId', activeProjectId);
  }, [activeProjectId]);

  useEffect(() => {
    localStorage.setItem('SILICON_FLOW_KEY', apiKey);
  }, [apiKey]);

  // Project Helper
  const updateActiveProject = (updates) => {
    setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, ...updates, lastUpdate: new Date().toISOString() } : p));
  };

  const handleCreateScenario = async () => {
    if (!activeProject) return;
    setIsLoading(true);
    try {
      const scenes = await generateScenario(actionPrompt, activeProject.characterPrompt, personCount);
      const newScenes = scenes.map((s, idx) => ({
        id: Date.now() + idx,
        prompt: s.image_prompt,
        voiceText: s.voice_text,
        sceneName: s.scene_name || `Сцена ${idx + 1}`,
        style: activeProject.characterPrompt,
        status: 'draft',
        aspectRatio: aspectRatio
      }));
      updateActiveProject({ generations: [...newScenes, ...activeProject.generations] });
      setActionPrompt('');
    } catch (err) {
      showAlert(`Ошибка сценария: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutomateProject = async () => {
    if (!activeProject) return;
    const drafts = activeProject.generations.filter(g => g.status === 'draft');
    if (drafts.length === 0) return;

    setIsLoading(true);
    showHaptic('medium');

    const updatedGens = [...activeProject.generations];
    for (const item of drafts) {
      try {
        const setStatus = (id, status, fields = {}) => {
          const idx = updatedGens.findIndex(g => g.id === id);
          if (idx !== -1) {
            updatedGens[idx] = { ...updatedGens[idx], status, ...fields };
            updateActiveProject({ generations: [...updatedGens] });
          }
        };

        setStatus(item.id, 'generating');
        const imageUrl = generateImage(`${item.style}, ${item.prompt}`);
        generateTTS(item.voiceText, selectedVoice).catch(console.error);
        setStatus(item.id, 'generating_video', { imageUrl });

        const { url, isMotion } = await generateVideoSegment(imageUrl, item.prompt);
        setStatus(item.id, 'ready', { videoUrl: url, isMotion });
      } catch (err) {
        console.error('Automation error', err);
      }
    }
    setIsLoading(false);
    showHaptic('success');
  };

  const handleExportProject = async () => {
    if (!activeProject) return;
    const readyVideos = activeProject.generations
      .filter(g => g.videoUrl && g.status === 'ready')
      .reverse() 
      .map(g => ({ url: g.videoUrl, isMotion: g.isMotion }));

    if (readyVideos.length === 0) {
      showAlert('Нет готовых видео');
      return;
    }

    setIsExporting(true);
    try {
      const finalUrl = await stitchVideos(readyVideos, (msg, prog) => setExportProgress(prog));
      const a = document.createElement('a');
      a.href = finalUrl;
      a.download = `${activeProject.name}.mp4`;
      a.click();
    } catch (err) {
      showAlert('Ошибка экспорта');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCreate = async () => {
    if (!activeProject) return;
    if (projectMode === 'workflow') {
      handleCreateScenario();
      return;
    }
    if (!actionPrompt) return;

    setIsLoading(true);
    showHaptic('medium');

    const newGen = {
      id: Date.now(),
      prompt: actionPrompt,
      style: activeProject.characterPrompt,
      aspectRatio,
      status: 'generating',
      timestamp: new Date().toISOString()
    };

    const updatedGens = [newGen, ...activeProject.generations];
    updateActiveProject({ generations: updatedGens });
    const currentPrompt = actionPrompt;
    setActionPrompt('');

    try {
      const { url, isMotion } = await generateVideoSegment(null, `${activeProject.characterPrompt}, ${currentPrompt}`);
      updateActiveProject({ 
        generations: updatedGens.map(g => g.id === newGen.id ? { ...g, videoUrl: url, isMotion, status: 'ready' } : g)
      });
    } catch (err) {
      showAlert(`Ошибка: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (index) => {
    if (!activeProject) return;
    updateActiveProject({ generations: activeProject.generations.filter((_, i) => i !== index) });
    showHaptic('light');
  };

  const handleCreateProject = () => {
    const newId = Date.now().toString();
    const newProject = {
      id: newId,
      name: `Проект ${projects.length + 1}`,
      characterPrompt: 'Cinematic studio animation style',
      generations: [],
      lastUpdate: new Date().toISOString()
    };
    setProjects([newProject, ...projects]);
    setActiveProjectId(newId);
    setView('chat');
    showHaptic('medium');
  };

  const handleSelectProject = (id) => {
    setActiveProjectId(id);
    setView('chat');
    showHaptic('light');
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
      <div className="h-14 shrink-0 flex items-center justify-between px-4 bg-[#1c1c1d] border-b border-white/5 z-30">
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
          {view === 'chat' && (
            <button onClick={handleExportProject} className="p-2 hover:bg-white/5 rounded-full text-tg-accent">
              <Share2 size={20} />
            </button>
          )}
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
            onSelectProject={handleSelectProject}
            onCreateProject={handleCreateProject}
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
                  activeProjectId={activeProjectId}
                />
                <NativeInput 
                  value={actionPrompt}
                  onChange={setActionPrompt}
                  onSend={handleCreate}
                  onAutomate={handleAutomateProject}
                  isLoading={isLoading}
                  mode={projectMode}
                  setMode={setProjectMode}
                  hasDrafts={activeProject.generations.some(g => g.status === 'draft')}
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

      {isExporting && (
        <div className="fixed inset-x-4 top-16 z-[60] bg-tg-accent p-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-slide-in">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Layers className="text-white animate-pulse" size={20} />
          </div>
          <div className="flex-1">
            <div className="text-white text-xs font-bold uppercase tracking-widest mb-1">Экспорт видео</div>
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
