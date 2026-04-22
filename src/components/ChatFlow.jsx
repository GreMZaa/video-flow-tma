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
        padding: 32, textAlign: 'center', opacity: 0.3, userSelect: 'none'
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'rgba(0,122,255,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20
        }}>
          <MessageSquare size={36} color="var(--tg-accent)" />
        </div>
        <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>Новый проект</h2>
        <p style={{ margin: 0, fontSize: 15, color: 'var(--tg-hint)', lineHeight: 1.5, maxWidth: 260 }}>
          Напишите описание сцены или сценария, чтобы начать генерацию.
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
        background: 'var(--tg-bg)',
      }}
      className="custom-scrollbar"
    >
      {/* Date divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 20px 8px' }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
        <span style={{ fontSize: 11, color: 'var(--tg-hint)', opacity: 0.5 }}>Сегодня</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
      </div>

      <AnimatePresence initial={false}>
        {generations.map((gen, idx) => (
          <div key={gen.id || idx} style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 10px' }}>

            {/* Outgoing user bubble (the prompt) */}
            {gen.status !== 'draft' && gen.prompt && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                style={{
                  alignSelf: 'flex-end',
                  maxWidth: '82%',
                  background: 'var(--tg-bubble-out)',
                  color: 'var(--tg-bubble-out-text)',
                  borderRadius: 18,
                  borderBottomRightRadius: 4,
                  padding: '8px 12px',
                  fontSize: 15,
                  lineHeight: '21px',
                  wordBreak: 'break-word',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                  position: 'relative',
                }}
              >
                <p style={{ margin: 0, paddingRight: 52 }}>{gen.prompt}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3, marginTop: 2 }}>
                  <span style={{ fontSize: 11, opacity: 0.6 }}>
                    {new Date(gen.id).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <CheckCircle2 size={11} style={{ opacity: 0.6 }} />
                </div>
              </motion.div>
            )}

            {/* Incoming bot bubble (status / media / draft) */}
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2, delay: 0.04 }}
              style={{
                alignSelf: 'flex-start',
                maxWidth: gen.status === 'ready' ? '82%' : '75%',
                minWidth: 180,
                background: gen.status === 'ready' ? 'transparent' : 'var(--tg-bubble-in)',
                color: 'var(--tg-bubble-in-text)',
                borderRadius: 18,
                borderBottomLeftRadius: 4,
                padding: gen.status === 'ready' ? 0 : '10px 12px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                overflow: 'hidden',
              }}
            >
              {/* Ready: video/image */}
              {gen.status === 'ready' && (
                <div
                  style={{
                    position: 'relative', cursor: 'pointer',
                    borderRadius: 18, borderBottomLeftRadius: 4,
                    overflow: 'hidden', background: '#111',
                  }}
                  onClick={() => { onSelectVideo(gen); showHaptic('light'); }}
                >
                  {gen.isMotion ? (
                    <img
                      src={gen.videoUrl}
                      alt="Generated frame"
                      style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <video
                      src={gen.videoUrl}
                      style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }}
                      muted loop playsInline
                    />
                  )}
                  {/* Play overlay */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.1)',
                  }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '1px solid rgba(255,255,255,0.3)',
                    }}>
                      <Play color="white" fill="white" size={20} style={{ transform: 'translateX(1px)' }} />
                    </div>
                  </div>
                  {/* Timestamp overlay */}
                  <div style={{
                    position: 'absolute', bottom: 8, right: 8,
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                    borderRadius: 20, padding: '2px 8px',
                  }}>
                    <span style={{ fontSize: 10, color: 'white', fontWeight: 500 }}>
                      {new Date(gen.id).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              )}

              {/* Draft: editable scene card */}
              {gen.status === 'draft' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    paddingBottom: 8, borderBottom: '0.5px solid rgba(255,255,255,0.08)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Wand2 size={12} color="var(--tg-accent)" />
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--tg-accent)', textTransform: 'uppercase', letterSpacing: 1 }}>
                        {gen.sceneName || `Сцена ${idx + 1}`}
                      </span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteVideo(idx); showHaptic('warning'); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'rgba(255,59,48,0.5)' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div>
                      <label style={{ fontSize: 9, color: 'var(--tg-hint)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1, opacity: 0.5 }}>Визуал</label>
                      <textarea
                        value={gen.prompt || ''}
                        onChange={(e) => onUpdateVideo?.(gen.id, { prompt: e.target.value })}
                        rows={2}
                        style={{
                          width: '100%', background: 'rgba(255,255,255,0.06)',
                          border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 10,
                          padding: '8px 10px', color: 'white', fontSize: 13, resize: 'none',
                          outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    {gen.voiceText !== undefined && (
                      <div>
                        <label style={{ fontSize: 9, color: 'var(--tg-hint)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1, opacity: 0.5 }}>Озвучка</label>
                        <textarea
                          value={gen.voiceText || ''}
                          onChange={(e) => onUpdateVideo?.(gen.id, { voiceText: e.target.value })}
                          rows={2}
                          style={{
                            width: '100%', background: 'rgba(255,255,255,0.06)',
                            border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 10,
                            padding: '8px 10px', color: 'white', fontSize: 13, resize: 'none',
                            outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Loading/Processing state */}
              {!['ready', 'draft'].includes(gen.status) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {gen.status === 'error' ? (
                    <span style={{ fontSize: 14, color: '#ff3b30' }}>{STATUS_LABELS.error}</span>
                  ) : (
                    <>
                      <Loader2 size={18} color="var(--tg-accent)" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>
                          {STATUS_LABELS[gen.status] || 'Обрабатываю...'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--tg-hint)', opacity: 0.6, marginTop: 1 }}>
                          пожалуйста, подождите
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
