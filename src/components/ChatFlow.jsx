import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Trash2, CheckCircle2, Loader2, MessageSquare, Wand2 } from 'lucide-react';
import { useTelegram } from '../hooks/useTelegram';

const STATUS_LABELS = {
  generating: 'Генерирую...',
  generating_image: 'Рисую изображение...',
  animating: 'Оживляю сцену...',
  voiceover: 'Записываю озвучку...',
  queued: 'В очереди...',
  error: '⚠ Ошибка генерации',
};

const ChatFlow = ({ generations, onSelectVideo, onDeleteVideo, onUpdateVideo }) => {
  const scrollRef = useRef(null);
  const { showHaptic } = useTelegram();

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollToBottom = () => el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    scrollToBottom();
    const t = setTimeout(scrollToBottom, 150);
    return () => clearTimeout(t);
  }, [generations.length, generations[generations.length - 1]?.status]);

  if (generations.length === 0) {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 32, textAlign: 'center', opacity: 0.5, userSelect: 'none'
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(0,122,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 24,
          boxShadow: '0 8px 32px rgba(0,122,255,0.1)'
        }}>
          <Wand2 size={40} color="var(--tg-accent)" />
        </div>
        <h2 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 700, color: 'white' }}>Создайте видео</h2>
        <p style={{ margin: 0, fontSize: 16, color: 'var(--tg-hint)', lineHeight: 1.5, maxWidth: 280 }}>
          Опишите сцену, которую хотите сгенерировать, или создайте полноценный сценарий.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '12px 0',
      }}
      className="custom-scrollbar chat-bg-pattern"
    >
      {/* Date divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 20px 8px' }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
        <span style={{ fontSize: 11, color: 'var(--tg-hint)', opacity: 0.5 }}>Сегодня</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
      </div>

      <AnimatePresence initial={false}>
        {generations.map((gen, idx) => (
          <div key={gen.id || idx} style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 10px', marginBottom: 6 }}>

            {/* Outgoing user bubble (the prompt) */}
            {gen.status !== 'draft' && gen.prompt && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="tg-bubble tg-bubble-out"
              >
                <p style={{ margin: 0, paddingRight: 48, fontSize: 15, fontWeight: 400 }}>{gen.prompt}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3, marginTop: 1 }}>
                  <span style={{ fontSize: 11, opacity: 0.5, fontWeight: 500 }}>
                    {new Date(gen.id).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <CheckCircle2 size={12} style={{ opacity: 0.5 }} />
                </div>
              </motion.div>
            )}

            {/* Incoming bot bubble (status / media / draft) */}
            <motion.div
              layout
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className={`tg-bubble ${gen.status === 'ready' ? 'tg-bubble-media' : 'tg-bubble-in'}`}
              style={{
                maxWidth: gen.status === 'ready' ? '88%' : '80%',
              }}
            >
              {/* Ready: video/image */}
              {gen.status === 'ready' && (
                <div
                  className="group relative"
                  style={{
                    position: 'relative', cursor: 'pointer',
                    borderRadius: 14, overflow: 'hidden', background: '#000',
                  }}
                  onClick={() => { onSelectVideo(gen); showHaptic('light'); }}
                >
                  {gen.isMotion ? (
                    <img
                      src={gen.videoUrl}
                      alt="Generated frame"
                      className="hover-zoom"
                      style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <video
                      src={gen.videoUrl}
                      className="hover-zoom"
                      style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }}
                      muted loop playsInline autoPlay
                    />
                  )}
                  {/* Play overlay */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.15)',
                    opacity: gen.isMotion ? 1 : 0,
                    transition: 'opacity 0.3s'
                  }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(12px)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '1.5px solid rgba(255,255,255,0.4)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    }}>
                      <Play color="white" fill="white" size={20} style={{ transform: 'translateX(2px)' }} />
                    </div>
                  </div>
                  {/* Type overlay */}
                  <div style={{
                    position: 'absolute', top: 8, left: 8,
                    background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
                    borderRadius: 8, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4
                  }}>
                    <span style={{ fontSize: 10, color: 'white', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {gen.isMotion ? 'Frame' : 'Video'}
                    </span>
                  </div>
                  {/* Timestamp overlay */}
                  <div style={{
                    position: 'absolute', bottom: 6, right: 6,
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)',
                    borderRadius: 12, padding: '2px 8px',
                  }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.95)', fontWeight: 600 }}>
                      {new Date(gen.id).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              )}

              {/* Draft: editable scene card */}
              {gen.status === 'draft' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '4px 2px' }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    paddingBottom: 8, borderBottom: '0.5px solid rgba(255,255,255,0.1)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--tg-accent)' }} />
                      <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--tg-accent)', textTransform: 'uppercase', letterSpacing: 1 }}>
                        {gen.sceneName || `Сцена ${idx + 1}`}
                      </span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteVideo(idx); showHaptic('warning'); }}
                      className="ios-btn"
                      style={{ background: 'rgba(255,59,48,0.1)', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff3b30' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ position: 'relative' }}>
                      <label style={{ display: 'block', fontSize: 10, color: 'var(--tg-hint)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6, letterSpacing: 0.5, opacity: 0.8 }}>Визуальное описание</label>
                      <textarea
                        value={gen.prompt || ''}
                        onChange={(e) => onUpdateVideo?.(gen.id, { prompt: e.target.value })}
                        rows={2}
                        placeholder="Опишите, что происходит в кадре..."
                        style={{
                          width: '100%', background: 'rgba(0,0,0,0.2)',
                          border: '0.5px solid rgba(255,255,255,0.1)',
                          borderRadius: 12, padding: '10px 12px',
                          color: 'white', fontSize: 14, outline: 'none',
                          resize: 'none', fontFamily: 'inherit', lineHeight: 1.4
                        }}
                        onFocus={(e) => e.target.parentElement.style.borderColor = 'var(--tg-accent)'}
                      />
                    </div>
                    {gen.voiceText !== undefined && (
                      <div style={{ position: 'relative' }}>
                        <label style={{ display: 'block', fontSize: 10, color: 'var(--tg-hint)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4, letterSpacing: 0.5 }}>Текст озвучки</label>
                        <textarea
                          value={gen.voiceText || ''}
                          onChange={(e) => onUpdateVideo?.(gen.id, { voiceText: e.target.value })}
                          rows={2}
                          style={{
                            width: '100%', background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
                            padding: '10px 12px', color: 'white', fontSize: 14, resize: 'none',
                            lineHeight: '1.4', outline: 'none'
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Loading/Processing state */}
              {!['ready', 'draft'].includes(gen.status) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '4px 2px' }}>
                  {gen.status === 'error' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,59,48,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <Trash2 size={16} color="#ff3b30" />
                      </div>
                      <span style={{ fontSize: 14, color: '#ff453a', fontWeight: 600 }}>{STATUS_LABELS.error}</span>
                    </div>
                  ) : (
                    <>
                      <div style={{ position: 'relative' }}>
                        <Loader2 size={28} color="var(--tg-accent)" className="animate-spin" />
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--tg-accent)' }} />
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.3, color: 'white' }}>
                          {STATUS_LABELS[gen.status] || 'Обработка...'}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--tg-hint)', fontWeight: 500, marginTop: 1 }}>
                          {gen.status === 'animating' ? 'Работает SiliconFlow AI...' : 'Это займет немного времени'}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        ))}
      </AnimatePresence>

      {/* Bottom padding */}
      <div style={{ height: 8 }} />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ChatFlow;
