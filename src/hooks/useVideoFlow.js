import { useState } from 'react';
import { generateImage, generateVideoSegment, generateScenario, generateTTS, stitchVideos } from '../services/api';

export const useVideoFlow = (activeProject, updateActiveProject, showHaptic, showAlert) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const handleCreateScenario = async (actionPrompt, personCount) => {
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
        status: 'draft'
      }));
      updateActiveProject({ generations: [...newScenes, ...activeProject.generations] });
      return true;
    } catch (err) {
      showAlert(`Ошибка сценария: ${err.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutomateProject = async (selectedVoice) => {
    if (!activeProject) return;
    const drafts = activeProject.generations.filter(g => g.status === 'draft');
    if (drafts.length === 0) return;

    setIsLoading(true);
    showHaptic('medium');

    updateActiveProject(p => ({
      generations: p.generations.map(g => g.status === 'draft' ? { ...g, status: 'queued' } : g)
    }));

    for (const item of drafts) {
      try {
        const setStatus = (id, status, fields = {}) => {
          updateActiveProject(p => ({
            generations: p.generations.map(g => g.id === id ? { ...g, status, ...fields } : g)
          }));
        };

        // Step 3.1: Generate Image
        setStatus(item.id, 'generating_image');
        const imageUrl = generateImage(`${item.style}, ${item.prompt}`);
        // We set the image immediately so user sees the "Visual" is ready
        setStatus(item.id, 'animating', { imageUrl });

        // Step 3.2: Generate Video (Animate)
        const { url, isMotion } = await generateVideoSegment(imageUrl, item.prompt);
        setStatus(item.id, 'voiceover', { videoUrl: url, isMotion });

        // Step 3.3: TTS (Voiceover)
        if (item.voiceText) {
          try {
            await generateTTS(item.voiceText, selectedVoice);
          } catch (ttsErr) {
            console.warn('TTS Failed but continuing...', ttsErr);
          }
        }
        
        setStatus(item.id, 'ready');
      } catch (err) {
        console.error('Automation error', err);
        updateActiveProject(p => ({
          generations: p.generations.map(g => g.id === item.id ? { ...g, status: 'error' } : g)
        }));
      }
    }
    setIsLoading(false);
    showHaptic('success');
  };

  const handleExportProject = async () => {
    if (!activeProject) return;
    const readyVideos = activeProject.generations
      .filter(g => g.videoUrl && (g.status === 'ready' || g.status === 'generating_video')) // include generating_video if it's just image
      .reverse() 
      .map(g => ({ url: g.videoUrl || g.imageUrl, isMotion: g.isMotion || true }));

    if (readyVideos.length === 0) {
      showAlert('Нет готовых видео');
      return;
    }

    setIsExporting(true);
    showHaptic('medium');
    try {
      const finalUrl = await stitchVideos(readyVideos, (msg, prog) => setExportProgress(prog));
      const a = document.createElement('a');
      a.href = finalUrl;
      a.download = `${activeProject.name}.mp4`;
      a.click();
      showHaptic('success');
    } catch (err) {
      showAlert('Ошибка экспорта');
      showHaptic('error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSingleCreate = async (actionPrompt, aspectRatio) => {
    if (!activeProject || !actionPrompt) return;

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

    updateActiveProject(p => ({ generations: [newGen, ...p.generations] }));

    try {
      const { url, isMotion } = await generateVideoSegment(null, `${activeProject.characterPrompt}, ${actionPrompt}`);
      updateActiveProject(p => ({ 
        generations: p.generations.map(g => g.id === newGen.id ? { ...g, videoUrl: url, isMotion, status: 'ready' } : g)
      }));
      showHaptic('success');
      return true;
    } catch (err) {
      showAlert(`Ошибка: ${err.message}`);
      showHaptic('error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    isExporting,
    exportProgress,
    handleCreateScenario,
    handleAutomateProject,
    handleExportProject,
    handleSingleCreate
  };
};
