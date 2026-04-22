import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Trash2, Clock, CheckCircle2, AlertCircle, Loader2, MessageSquare, Sparkles, Wand2, Mic } from 'lucide-react';
import { useTelegram } from '../hooks/useTelegram';

const ChatFlow = ({ generations, onSelectVideo, onDeleteVideo, onUpdateVideo }) => {
  const scrollRef = useRef(null);
  const { showHaptic } = useTelegram();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [generations.length]);

  return (
    <div 
      className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 custom-scrollbar bg-tg-bg"
      ref={scrollRef}
    >
      <AnimatePresence initial={false}>
        {generations.map((gen, idx) => (
          <div key={gen.id} className="flex flex-col gap-2">
            {/* User Message (Prompt) */}
            {gen.status !== 'draft' && (
              <motion.div 
                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                className="tg-bubble tg-bubble-out"
              >
                <div className="flex justify-between items-start gap-4">
                  <p className="text-[15px]">{gen.prompt}</p>
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
                  className="relative group cursor-pointer overflow-hidden rounded-[1.1rem] min-w-[260px] min-h-[150px] bg-black/20 flex items-center justify-center"
                  onClick={() => { onSelectVideo(gen); showHaptic('light'); }}
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
                  <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-100 group-hover:bg-black/40 transition-all">
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 shadow-2xl">
                      <Play className="text-white fill-white ml-1" size={20} />
                    </div>
                  </div>
                  
                  {/* Delete overlay */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteVideo(idx); showHaptic('warning'); }}
                    className="absolute top-2 right-2 p-2 bg-black/60 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                </div>
              ) : gen.status === 'draft' ? (
                <div className="flex flex-col gap-3 p-1 min-w-[240px]">
                  <div className="flex justify-between items-center border-b border-white/[0.05] pb-2">
                    <span className="font-bold text-sm text-tg-accent uppercase tracking-tight">{gen.sceneName || `Сцена`}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteVideo(idx); showHaptic('warning'); }} 
                      className="p-1.5 hover:bg-white/10 rounded-lg text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-tg-hint uppercase font-bold tracking-wider opacity-60">Визуал</label>
                      <textarea 
                        value={gen.prompt}
                        onChange={(e) => onUpdateVideo?.(gen.id, { prompt: e.target.value })}
                        className="w-full bg-white/[0.03] text-[14px] p-2.5 rounded-xl border border-white/[0.05] resize-none outline-none focus:border-tg-accent/40 transition-all custom-scrollbar"
                        rows={3}
                        placeholder="Опишите кадр..."
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-tg-hint uppercase font-bold tracking-wider opacity-60">Голос</label>
                      <textarea 
                        value={gen.voiceText}
                        onChange={(e) => onUpdateVideo?.(gen.id, { voiceText: e.target.value })}
                        className="w-full bg-white/[0.03] text-[14px] p-2.5 rounded-xl border border-white/[0.05] resize-none outline-none focus:border-tg-accent/40 transition-all custom-scrollbar"
                        rows={2}
                        placeholder="Текст для озвучки..."
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-2 py-1 min-w-[180px]">
                  {gen.status === 'error' ? (
                    <>
                      <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                        <AlertCircle className="text-red-400" size={18} />
                      </div>
                      <span className="text-sm font-medium">Ошибка генерации</span>
                    </>
                  ) : gen.status === 'queued' ? (
                    <>
                      <div className="w-8 h-8 rounded-full bg-tg-hint/10 flex items-center justify-center">
                        <Clock className="text-tg-hint animate-pulse" size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">В очереди</span>
                        <span className="text-[10px] opacity-40">Ожидание GPU...</span>
                      </div>
                    </>
                  ) : gen.status === 'generating_image' ? (
                    <>
                      <div className="w-8 h-8 rounded-full bg-tg-accent/10 flex items-center justify-center">
                        <Sparkles className="animate-pulse text-tg-accent" size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">Рисую кадр</span>
                        <span className="text-[10px] opacity-60">Шаг 1 из 3...</span>
                      </div>
                    </>
                  ) : gen.status === 'animating' ? (
                    <>
                      <div className="w-8 h-8 rounded-full bg-tg-accent/10 flex items-center justify-center">
                        <Wand2 className="animate-spin text-tg-accent" size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">Оживляю фото</span>
                        <span className="text-[10px] opacity-60">Шаг 2 из 3...</span>
                      </div>
                    </>
                  ) : gen.status === 'voiceover' ? (
                    <>
                      <div className="w-8 h-8 rounded-full bg-tg-accent/10 flex items-center justify-center">
                        <Mic className="animate-bounce text-tg-accent" size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">Озвучиваю</span>
                        <span className="text-[10px] opacity-60">Шаг 3 из 3...</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full bg-tg-accent/10 flex items-center justify-center">
                        <Loader2 className="animate-spin text-tg-accent" size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">Генерирую</span>
                        <span className="text-[10px] opacity-60">Пожалуйста, подождите...</span>
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
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-20 select-none">
          <div className="w-20 h-20 bg-tg-accent/10 rounded-full flex items-center justify-center mb-6">
            <MessageSquare size={40} className="text-tg-accent" />
          </div>
          <h2 className="text-xl font-bold mb-2">Начните проект</h2>
          <p className="text-[15px] max-w-xs leading-relaxed">Отправьте описание сценария или первой сцены, чтобы запустить магию.</p>
        </div>
      )}
    </div>
  );
};

export default ChatFlow;
