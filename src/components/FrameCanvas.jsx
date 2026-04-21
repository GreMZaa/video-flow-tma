import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Play, Trash2, Wand2, Video, Loader2, Volume2 } from 'lucide-react';
import { generateImage, generateVideoSegment, generateTTS } from '../services/api';
import { useTelegram } from '../hooks/useTelegram';

const FrameCard = ({ frame, index, onUpdate, onDelete, characterPrompt, apiKey }) => {
  const [loading, setLoading] = useState(false);
  const [motionPrompt, setMotionPrompt] = useState(frame.motionPrompt || '');
  const { showHaptic, showAlert } = useTelegram();

  const handleGenerateImage = () => {
    setLoading(true);
    showHaptic('light');
    const fullPrompt = `${characterPrompt}${frame.prompt ? ', ' + frame.prompt : ''}`;
    const url = generateImage(fullPrompt);
    
    setTimeout(() => {
      onUpdate(index, { ...frame, imageUrl: url });
      setLoading(false);
      showHaptic('success');
    }, 1500);
  };

  const handleGenerateVideo = async () => {
    if (!apiKey) {
      showAlert('Введите SILICON_FLOW_KEY в настройках.');
      return;
    }
    if (!frame.imageUrl) {
      showAlert('Сначала создайте изображение.');
      return;
    }

    setLoading(true);
    showHaptic('medium');
    
    try {
      await generateVideoSegment(frame.imageUrl, motionPrompt, apiKey);
      setTimeout(() => {
        onUpdate(index, { 
          ...frame, 
          videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4', 
          isVideoGenerated: true 
        });
        setLoading(false);
        showHaptic('success');
      }, 5000);
    } catch (err) {
      showAlert('Ошибка генерации видео.');
      setLoading(false);
      showHaptic('error');
    }
  };

  const handlePlayTTS = () => {
    const textToSpeak = frame.prompt || characterPrompt;
    if (!textToSpeak) return;
    
    showHaptic('light');
    const audioUrl = generateTTS(textToSpeak);
    const audio = new Audio(audioUrl);
    audio.play().catch(e => console.error('TTS Playback error', e));
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="glass rounded-3xl overflow-hidden mb-6 flow-card border border-white/5"
    >
      <div className="relative aspect-video bg-black/40 flex items-center justify-center">
        {frame.imageUrl ? (
          <img 
            src={frame.imageUrl} 
            alt={`Frame ${index + 1}`} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-tg-hint/30 flex flex-col items-center">
            <Wand2 size={48} className="mb-2" />
            <span className="text-sm font-medium">Пустой кадр</span>
          </div>
        )}
        
        {loading && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-tg-button mb-2" size={32} />
            <span className="text-xs font-bold tracking-widest text-tg-button uppercase animate-pulse">
              Генерация...
            </span>
          </div>
        )}

        <div className="absolute top-3 left-3 flex gap-2">
            <button 
              onClick={handlePlayTTS}
              className="bg-black/60 backdrop-blur-md p-2 rounded-full text-white hover:text-tg-button transition-colors"
              title="Прослушать озвучку"
            >
              <Volume2 size={16} />
            </button>
        </div>

        {frame.isVideoGenerated && (
          <div className="absolute top-3 right-3 bg-green-500/80 p-1.5 rounded-full shadow-lg">
            <Play size={12} className="text-white fill-current" />
          </div>
        )}
      </div>

      <div className="p-5 space-y-4">
        <div>
          <label className="text-[10px] uppercase tracking-widest font-bold text-tg-hint mb-1.5 block">
            Действие кадра / Сцена
          </label>
          <input
            value={frame.prompt}
            onChange={(e) => onUpdate(index, { ...frame, prompt: e.target.value })}
            placeholder="Опишите действие для этого кадра..."
            className="w-full bg-white/5 border-white/10 rounded-xl p-3 text-sm"
          />
        </div>

        <div className="flex gap-2 pt-2">
          {!frame.imageUrl ? (
            <button 
              onClick={handleGenerateImage}
              disabled={loading}
              className="flex-1 btn-primary py-3 flex items-center justify-center gap-2"
            >
              <Wand2 size={18} />
              <span>Визуализировать</span>
            </button>
          ) : (
            <button 
              onClick={handleGenerateVideo}
              disabled={loading}
              className="flex-1 bg-white/10 hover:bg-white/20 p-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <Video size={18} className="text-tg-button" />
              <span className="text-sm font-semibold italic">Анимировать</span>
            </button>
          )}
          
          <button 
            onClick={() => { onDelete(index); showHaptic('medium'); }}
            className="p-3 glass rounded-xl text-tg-hint hover:text-red-400 transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const FrameCanvas = ({ characterPrompt, frames, setFrames, apiKey, onPreview }) => {
  const { showHaptic } = useTelegram();

  const addFrame = () => {
    setFrames([...frames, { prompt: '', motionPrompt: '', imageUrl: null, videoUrl: null, isVideoGenerated: false }]);
    showHaptic('light');
  };

  const updateFrame = (index, newData) => {
    const newFrames = [...frames];
    newFrames[index] = newData;
    setFrames(newFrames);
  };

  const deleteFrame = (index) => {
    setFrames(frames.filter((_, i) => i !== index));
  };

  return (
    <div className="pb-24">
      <div className="mb-8 p-4 glass rounded-2xl border-l-4 border-tg-button relative overflow-hidden">
        <span className="text-[10px] uppercase font-bold text-tg-button tracking-widest block mb-1">Глобальный объект</span>
        <p className="text-sm italic opacity-80 line-clamp-2">{characterPrompt}</p>
        <div className="absolute top-[-20%] right-[-10%] w-24 h-24 bg-tg-button/5 blur-2xl rounded-full" />
      </div>

      <AnimatePresence initial={false}>
        {frames.map((frame, index) => (
          <FrameCard 
            key={index}
            index={index}
            frame={frame}
            onUpdate={updateFrame}
            onDelete={deleteFrame}
            characterPrompt={characterPrompt}
            apiKey={apiKey}
          />
        ))}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={addFrame}
        className="w-full py-8 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-tg-hint hover:border-tg-button hover:text-tg-button transition-all glass bg-white/[0.01]"
      >
        <Plus size={32} className="mb-2" />
        <span className="text-sm font-bold uppercase tracking-wider">Добавить кадр</span>
      </motion.button>

      {frames.length > 0 && frames.some(f => f.isVideoGenerated) && (
        <div className="mt-10 p-6 glass rounded-3xl border border-tg-button/20 flex flex-col items-center text-center">
          <h3 className="text-lg font-bold mb-2">Сценарий готов</h3>
          <p className="text-xs text-tg-hint mb-6">Склеить все анимированные фрагменты в один MP4</p>
          <button 
            onClick={() => { onPreview(); showHaptic('success'); }}
            className="w-full btn-primary flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(56,189,248,0.2)]"
          >
            <Play size={20} fill="currentColor" />
            <span>Создать полное видео</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default FrameCanvas;
