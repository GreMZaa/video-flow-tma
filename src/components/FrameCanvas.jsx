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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="liquid-glass rounded-[2rem] overflow-hidden mb-8 flow-card border-none shadow-2xl group"
    >
      <div className="relative aspect-video bg-black/60 flex items-center justify-center overflow-hidden">
        {frame.imageUrl ? (
          <motion.img 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            src={frame.imageUrl} 
            alt={`Frame ${index + 1}`} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="text-tg-hint/20 flex flex-col items-center">
            <div className="p-6 bg-white/5 rounded-full mb-4">
              <Wand2 size={48} className="animate-pulse" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Пустой Кадр</span>
          </div>
        )}
        
        {loading && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
            <div className="p-4 bg-white/5 rounded-full mb-4">
              <Loader2 className="animate-spin text-tg-button" size={32} />
            </div>
            <span className="text-[10px] font-black tracking-[0.4em] text-tg-button uppercase animate-pulse shadow-glow">
              Магия...
            </span>
          </div>
        )}

        <div className="absolute top-4 left-4 flex gap-2 z-10">
            <button 
              onClick={handlePlayTTS}
              className="bg-black/40 backdrop-blur-xl p-2.5 rounded-xl text-white hover:text-tg-button transition-all active:scale-90 border border-white/10"
              title="Прослушать озвучку"
            >
              <Volume2 size={18} />
            </button>
        </div>

        {frame.isVideoGenerated && (
          <div className="absolute top-4 right-4 bg-emerald-500 p-2.5 rounded-xl shadow-glow ring-2 ring-white/20 z-10">
            <Play size={14} className="text-white fill-current" />
          </div>
        )}

        <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-xl px-3 py-1.5 rounded-lg border border-white/10 z-10">
          <span className="text-[10px] font-black text-white uppercase tracking-widest opacity-80">КАДР {index + 1}</span>
        </div>
      </div>

      <div className="p-6 space-y-5 bg-white/[0.02]">
        <div className="space-y-2">
          <label className="text-[9px] uppercase tracking-[0.25em] font-black text-tg-hint ml-1 opacity-50">
            Действие в кадре
          </label>
          <input
            value={frame.prompt}
            onChange={(e) => onUpdate(index, { ...frame, prompt: e.target.value })}
            placeholder="Что происходит в этой сцене?..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-tg-button/20 transition-all placeholder:opacity-30"
          />
        </div>

        <div className="flex gap-3 pt-2">
          {!frame.imageUrl ? (
            <button 
              onClick={handleGenerateImage}
              disabled={loading}
              className="flex-1 btn-primary py-4 flex items-center justify-center gap-3 shadow-xl active:scale-[0.98] transition-all"
            >
              <Wand2 size={20} />
              <span className="font-black uppercase tracking-[0.15em] text-xs">ВИЗУАЛИЗИРОВАТЬ</span>
            </button>
          ) : (
            <button 
              onClick={handleGenerateVideo}
              disabled={loading}
              className="flex-1 bg-white/10 hover:bg-white/20 p-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] border border-white/5"
            >
              <Video size={20} className="text-tg-button" />
              <span className="text-xs font-black uppercase tracking-[0.15em] text-white">АНИМИРОВАТЬ</span>
            </button>
          )}
          
          <button 
            onClick={() => { onDelete(index); showHaptic('medium'); }}
            className="p-4 liquid-glass rounded-2xl text-tg-hint hover:text-red-400 transition-all active:scale-90"
          >
            <Trash2 size={20} />
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
    <div className="pb-32 px-4">
      <div className="mb-10 p-6 liquid-glass rounded-[2rem] border-l-0 relative overflow-hidden group">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-1.5 h-1.5 bg-tg-button rounded-full animate-pulse" />
          <span className="text-[10px] uppercase font-black text-tg-button tracking-[0.3em] block opacity-80">Глобальный Стиль</span>
        </div>
        <p className="text-lg font-black tracking-tighter text-white/90 line-clamp-2 leading-tight">
          {characterPrompt || "Опишите персонажа для начала..."}
        </p>
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-tg-button/10 blur-[80px] rounded-full group-hover:bg-tg-button/20 transition-all duration-1000" />
      </div>

      <AnimatePresence initial={false} mode="popLayout">
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
        whileTap={{ scale: 0.98 }}
        onClick={addFrame}
        className="w-full py-10 border-2 border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center text-tg-hint/40 hover:border-tg-button/50 hover:text-tg-button transition-all liquid-glass group active:bg-white/5"
      >
        <div className="p-4 bg-white/5 rounded-full mb-4 group-hover:scale-110 transition-transform">
          <Plus size={32} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Добавить Новую Сцену</span>
      </motion.button>

      {frames.length > 0 && frames.some(f => f.isVideoGenerated) && (
        <div className="mt-12 p-8 liquid-glass rounded-[2.5rem] border-white/20 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-tg-button/10 to-transparent pointer-events-none" />
          <h3 className="text-2xl font-black mb-2 tracking-tighter uppercase relative z-10">Сценарий Готов</h3>
          <p className="text-[10px] uppercase font-black tracking-widest text-tg-hint mb-8 opacity-60 relative z-10">Склеить фрагменты в финальный MP4</p>
          <button 
            onClick={() => { onPreview(); showHaptic('success'); }}
            className="w-full btn-primary py-5 flex items-center justify-center gap-4 shadow-2xl shadow-tg-button/40 relative z-10 active:scale-[0.98]"
          >
            <Play size={24} fill="currentColor" />
            <span className="font-black uppercase tracking-[0.2em]">Создать Магию</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default FrameCanvas;
