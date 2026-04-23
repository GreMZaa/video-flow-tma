import { useState } from 'react';
import { generateImage, generateVideoSegment, generateScenario, generateTTS, stitchVideos } from '../services/api';

export const useVideoFlow = (activeProject, updateActiveProject, showHaptic, showAlert, apiKey = null) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const handleCreateScenario = async (actionPrompt, personCount) => {
    if (!activeProject) return;
    
    // Immediately add a 'thinking' placeholder to show user prompt and bot typing
    const tempId = Date.now();
    updateActiveProject(p => ({
      generations: [...p.generations, {
        id: tempId,
        prompt: actionPrompt,
        status: 'thinking',
        timestamp: new Date().toISOString()
      }]
    }));

    setIsLoading(true);
    console.log('useVideoFlow: Starting scenario generation for:', actionPrompt);
    try {
      const scenes = await generateScenario(actionPrompt, activeProject.characterPrompt, personCount);
      console.log('useVideoFlow: Received scenes:', scenes?.length);
      
      if (!scenes || scenes.length === 0) {
        throw new Error('Не удалось сгенерировать сцены. Попробуйте другой запрос.');
      }

      const newScenes = scenes.map((s, idx) => ({
        id: Date.now() + idx + 1,
        prompt: s.image_prompt || 'cinematic view',
        voiceText: s.voice_text || '',
        sceneName: s.scene_name || `Сцена ${idx + 1}`,
        style: activeProject.characterPrompt,
        status: 'draft',
        parentPrompt: actionPrompt // Keep track of the original prompt
      }));
      
      console.log('useVideoFlow: Replacing thinking with drafts');
      // Replace the 'thinking' item with actual drafts
      updateActiveProject(p => ({
        generations: [
          ...p.generations.filter(g => g.id !== tempId),
          ...newScenes
        ]
      }));
      return true;
    } catch (err) {
      console.error('useVideoFlow: Scenario error:', err);
      // Set the placeholder to error status
      updateActiveProject(p => ({
        generations: p.generations.map(g => g.id === tempId ? { ...g, status: 'error', error: err.message } : g)
      }));
      showAlert(`Ошибка: ${err.message}`);
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

        // Step 1: Generating Image
        setStatus(item.id, 'generating_image');
        const imageUrl = await generateImage(`${item.style}, ${item.prompt}`, apiKey);
        
        // Step 2: Animating (passing apiKey)
        setStatus(item.id, 'animating', { imageUrl });
        // Use a more descriptive prompt for animation
        const animationPrompt = `${item.style}. ${item.prompt}. Cinematic movement, high detail.`;
        const { url, isMotion } = await generateVideoSegment(imageUrl, animationPrompt, apiKey);
        
        // Step 3: Voiceover
        setStatus(item.id, 'voiceover', { videoUrl: url, isMotion });
        if (item.voiceText) {
          try {
            await generateTTS(item.voiceText, selectedVoice, apiKey);
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
      .filter(g => (g.videoUrl || g.imageUrl) && (g.status === 'ready' || g.status === 'generating_video'))
      .map(g => ({ 
        url: g.videoUrl || g.imageUrl, 
        isMotion: g.isMotion ?? (!g.videoUrl && !!g.imageUrl) 
      }));

    if (readyVideos.length === 0) {
      showAlert('Нет готовых кадров для экспорта');
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
      console.error('Export Error:', err);
      showAlert(`Ошибка экспорта: ${err.message || 'неизвестная ошибка'}`);
      showHaptic('error');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
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

    updateActiveProject(p => ({ generations: [...p.generations, newGen] }));

    try {
      const { url, isMotion } = await generateVideoSegment(null, `${activeProject.characterPrompt}, ${actionPrompt}`, apiKey);
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
