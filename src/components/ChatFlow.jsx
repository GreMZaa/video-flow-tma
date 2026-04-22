import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Trash2, Clock, CheckCircle2, AlertCircle, Loader2, MessageSquare } from 'lucide-react';

const ChatFlow = ({ generations, onSelectVideo, onDeleteVideo, onUpdateVideo, activeProjectId }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [generations.length]);

  return (
    <div 
      className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 custom-scrollbar bg-[#0e1621]"
      ref={scrollRef}
      style={{ 
        backgroundImage: 'url("https://www.transparenttextures.com/patterns/cartographer.png")',
        backgroundOpacity: 0.05
      }}
    >
      <AnimatePresence initial={false}>
        {generations.map((gen, idx) => (
          <div key={gen.id} className="flex flex-col gap-2">
            {/* User Message (Prompt) - Hidden for drafts to keep chat clean */}
            {gen.status !== 'draft' && (
              <motion.div 
                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                className="tg-bubble tg-bubble-out"
              >
                <div className="flex justify-between items-start gap-4">
                  <p className="text-sm">{gen.prompt}</p>
                  <div className="flex items-center gap-1 opacity-50 text-[10px] self-end mt-1">
                    <span>{new Date(gen.id).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <CheckCircle2 size={10} />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Bot Response (Media/Status/Draft) */}
            <motion.div 
              initial={{ opacity: 0, x: -20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              className={`tg-bubble tg-bubble-in max-w-[90%] md:max-w-[75%] ${gen.status === 'ready' ? 'tg-bubble-media' : 'py-3'}`}
            >
              {gen.status === 'ready' ? (
                <div 
                  className="relative group cursor-pointer overflow-hidden rounded-[1rem] min-w-[260px] min-h-[150px] bg-black/20 flex items-center justify-center"
                  onClick={() => onSelectVideo(gen)}
                >
                  {gen.isMotion ? (
                    <img 
                      src={gen.videoUrl} 
                      className="w-full aspect-video object-cover animate-ken-burns scale-110"
                      alt="Segment"
                    />
                  ) : (
                    <video 
                      src={gen.videoUrl} 
                      className="w-full aspect-video object-cover"
                      muted
                      loop
                      playsInline
                      onMouseOver={e => e.target.play()}
                      onMouseOut={e => {e.target.pause(); e.target.currentTime = 0}}
                    />
                  )}
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-100 group-hover:bg-black/40 transition-all">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                      <Play className="text-white fill-white ml-1" size={16} />
                    </div>
                  </div>
                  
                  {/* Delete overlay hidden by default */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteVideo(idx); }}
                    className="absolute top-2 right-2 p-2 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                </div>
              ) : gen.status === 'draft' ? (
                <div className="flex flex-col gap-3 p-1 min-w-[240px]">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="font-bold text-sm text-tg-accent">{gen.sceneName || `Сцена`}</span>
                    <button onClick={(e) => { e.stopPropagation(); onDeleteVideo(idx); }} className="p-1 hover:bg-white/10 rounded-md text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-tg-hint uppercase font-bold tracking-wider">Кадр (Визуал)</label>
                    <textarea 
                      value={gen.prompt}
                      onChange={(e) => onUpdateVideo?.(gen.id, { prompt: e.target.value })}
                      className="w-full bg-black/20 text-sm p-2 rounded-lg border border-white/10 resize-none outline-none focus:border-tg-accent/50 transition-colors custom-scrollbar"
                      rows={3}
                      placeholder="Опишите, что должно быть в кадре..."
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-tg-hint uppercase font-bold tracking-wider">Озвучка (Голос)</label>
                    <textarea 
                      value={gen.voiceText}
                      onChange={(e) => onUpdateVideo?.(gen.id, { voiceText: e.target.value })}
                      className="w-full bg-black/20 text-sm p-2 rounded-lg border border-white/10 resize-none outline-none focus:border-tg-accent/50 transition-colors custom-scrollbar"
                      rows={2}
                      placeholder="Текст для озвучки..."
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-2">
                  {gen.status === 'error' ? (
                    <>
                      <AlertCircle className="text-red-400 shrink-0" size={18} />
                      <span className="text-sm">Ошибка генерации</span>
                    </>
                  ) : (
                    <>
                      <Loader2 className="animate-spin text-tg-accent shrink-0" size={18} />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">Генерирую...</span>
                        <span className="text-[10px] opacity-60">Пожалуйста, подождите</span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        ))}
      </AnimatePresence>

      {/* Welcome Message */}
      {generations.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-40 select-none">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
            <MessageSquare size={40} />
          </div>
          <h2 className="text-lg font-bold mb-2">Начните проект</h2>
          <p className="text-sm max-w-xs">Отправьте описание сцены, чтобы начать генерацию контента.</p>
        </div>
      )}
    </div>
  );
};

export default ChatFlow;
