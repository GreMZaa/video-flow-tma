import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Download, Loader2, Sparkles, CheckCircle2, Play } from 'lucide-react';
import { stitchVideos } from '../services/api';
import { useTelegram } from '../hooks/useTelegram';

const VideoPreview = ({ isOpen, onClose, frames }) => {
  const [isStitching, setIsStitching] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressVal, setProgressVal] = useState(0);
  const [finalVideoUrl, setFinalVideoUrl] = useState(null);
  const { showHaptic, showAlert } = useTelegram();

  const generatedFrames = frames.filter(f => f.videoUrl);

  const handleStitch = async () => {
    if (generatedFrames.length === 0) {
      showAlert('Не найдено анимированных фрагментов для склейки.');
      return;
    }

    setIsStitching(true);
    showHaptic('heavy');
    
    try {
      const videoUrls = generatedFrames.map(f => f.videoUrl);
      const outputUrl = await stitchVideos(videoUrls, (msg, val) => {
        setProgressMsg(msg);
        setProgressVal(val);
      });
      
      setFinalVideoUrl(outputUrl);
      showHaptic('success');
    } catch (err) {
      console.error(err);
      showAlert('Не удалось склеить видео. Проверьте заголовки COOP/COEP.');
    } finally {
      setIsStitching(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex flex-col bg-tg-bg"
      >
        {/* Header */}
        <div className="p-6 flex items-center justify-between liquid-glass border-b border-white/5 sticky top-0 z-10 backdrop-blur-3xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-tg-button/20 rounded-xl shadow-glow">
              <Sparkles size={18} className="text-tg-button" />
            </div>
            <h3 className="text-xl font-black tracking-tighter uppercase">Экспорт Видео</h3>
          </div>
          <button onClick={onClose} className="p-2 liquid-glass rounded-full hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Player Area */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center custom-scrollbar" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 2rem)' }}>
          <div className="w-full max-w-lg space-y-10">
            
            {/* Visualizer / Final Video Container */}
            <div className="w-full aspect-video liquid-glass rounded-[2.5rem] overflow-hidden shadow-2xl relative bg-black/40 group border-white/20">
              {finalVideoUrl ? (
                <video 
                  controls 
                  autoPlay
                  className="w-full h-full object-contain"
                >
                  <source src={finalVideoUrl} type="video/mp4" />
                </video>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center">
                  {isStitching ? (
                    <div className="w-full max-w-xs space-y-6">
                      <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden shadow-inner">
                        <motion.div 
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-tg-button via-white to-tg-button bg-[length:200%_100%]"
                          initial={{ width: 0 }}
                          animate={{ 
                            width: `${progressVal}%`,
                            backgroundPosition: ['0% 0%', '200% 0%']
                          }}
                          transition={{ 
                            width: { duration: 0.5 },
                            backgroundPosition: { duration: 2, repeat: Infinity, ease: 'linear' }
                          }}
                        />
                      </div>
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-3 bg-white/5 rounded-full animate-pulse">
                          <Loader2 className="animate-spin text-tg-button" size={24} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-tg-button shadow-glow">
                          {progressMsg}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 opacity-30 group-hover:opacity-50 transition-opacity duration-500">
                      <div className="p-6 bg-white/5 rounded-full inline-block">
                        <Play size={48} className="mx-auto text-tg-hint" />
                      </div>
                      <p className="text-xs font-black uppercase tracking-widest leading-relaxed">
                        Готов к сборке<br/>
                        <span className="text-lg text-white">{generatedFrames.length} фрагментов</span>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="space-y-8">
              {!finalVideoUrl ? (
                <button 
                  onClick={handleStitch}
                  disabled={isStitching || generatedFrames.length === 0}
                  className="w-full btn-primary py-5 flex items-center justify-center gap-4 shadow-2xl shadow-tg-button/30 disabled:opacity-50 active:scale-[0.98] transition-transform"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full hover:animate-shimmer" />
                  {isStitching ? <Loader2 className="animate-spin" size={24} /> : <Download size={24} />}
                  <span className="font-black uppercase tracking-[0.2em] text-sm">
                    {isStitching ? 'МАГИЯ СКЛЕЙКИ...' : 'СГЕНЕРИРОВАТЬ MP4'}
                  </span>
                </button>
              ) : (
                <div className="space-y-4">
                  <a 
                    href={finalVideoUrl} 
                    download="video-flow-export.mp4"
                    className="w-full btn-primary py-5 flex items-center justify-center gap-4 bg-emerald-500 border-none shadow-2xl shadow-emerald-500/30 ring-1 ring-white/20"
                  >
                    <Download size={24} />
                    <span className="font-black uppercase tracking-[0.15em]">Скачать Результат</span>
                  </a>
                  <button 
                    onClick={() => { setFinalVideoUrl(null); showHaptic('light'); }}
                    className="w-full py-4 liquid-glass rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] opacity-60 hover:opacity-100 transition-all active:scale-[0.98]"
                  >
                    Редактировать Фрагменты
                  </button>
                </div>
              )}

              {/* Segment Breakdown */}
              <div className="liquid-glass rounded-[2rem] p-6 border-white/10 shadow-2xl">
                  <h4 className="text-[10px] uppercase font-black text-tg-hint tracking-[0.3em] mb-6 opacity-60 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-tg-button rounded-full animate-pulse" />
                    Структура Проекта
                  </h4>
                  <div className="space-y-6">
                    {generatedFrames.map((frame, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i} 
                        className="flex items-center gap-5 group"
                      >
                        <div className="relative flex-shrink-0">
                          <div className="overflow-hidden rounded-2xl ring-2 ring-white/5 group-hover:ring-tg-button/50 transition-all duration-500">
                            <img src={frame.imageUrl} className="w-20 h-14 object-cover scale-110 group-hover:scale-100 transition-transform duration-700" alt="" />
                          </div>
                          <div className="absolute -top-3 -left-3 w-7 h-7 bg-white text-black rounded-xl flex items-center justify-center text-[11px] font-black shadow-2xl ring-1 ring-black/5">
                            {i + 1}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-black uppercase tracking-tight truncate group-hover:text-tg-button transition-colors duration-300">
                            {frame.prompt || 'Анимированный фрагмент'}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1 opacity-50">
                             <CheckCircle2 size={10} className="text-emerald-500" />
                             <span className="text-[9px] text-tg-hint uppercase font-black tracking-widest">Optimized for AI</span>
                          </div>
                        </div>
                        <div className="p-2 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink size={14} className="text-white" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VideoPreview;
