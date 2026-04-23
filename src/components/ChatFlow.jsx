import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Trash2, CheckCircle2, Loader2, MessageSquare, Wand2, Sparkles } from 'lucide-react';
import { useTelegram } from '../hooks/useTelegram';

const STATUS_LABELS = {
  thinking: 'Продумываю сценарий...',
  generating: 'Генерирую...',
  generating_image: 'Создаю изображение...',
  animating: 'Оживляю сцену (SiliconFlow)...',
  voiceover: 'Записываю озвучку...',
  queued: 'В очереди...',
  error: '⚠ Ошибка генерации',
};

const ChatFlow = ({ generations, onSelectVideo, onDeleteVideo, onUpdateVideo, onRunGeneration, onClearDrafts }) => {
  const bottomRef = useRef(null);
  const { showHaptic } = useTelegram();

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    const t = setTimeout(scrollToBottom, 300);
    return () => clearTimeout(t);
  }, [generations.length, generations[generations.length - 1]?.status]);

  // Handle window/container resize for better scrolling
  useEffect(() => {
    const observer = new ResizeObserver(() => scrollToBottom());
    const container = document.querySelector('.chat-bg-premium');
    if (container) observer.observe(container);
    return () => observer.disconnect();
  }, []);

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
      style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '12px 0',
        position: 'relative',
      }}
      className="custom-scrollbar chat-bg-premium"
    >
      {/* Animated Mesh Gradient Background */}
      <div className="mesh-gradient" />
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
            {gen.prompt && (gen.status === 'thinking' || (gen.status !== 'draft' && !gen.parentPrompt)) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="tg-bubble tg-bubble-out"
                style={{ marginBottom: gen.status === 'thinking' ? 4 : 0 }}
              >
                <p style={{ margin: 0, paddingRight: 48, fontSize: 16, fontWeight: 400, color: '#fff' }}>{gen.prompt}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3, marginTop: 1 }}>
                  <span style={{ fontSize: 11, opacity: 0.6, fontWeight: 500, color: '#fff' }}>
                    {new Date(gen.id).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <CheckCircle2 size={12} style={{ opacity: 0.6, color: '#fff' }} />
                </div>
              </motion.div>
            )}

            {/* Special case: If it's the first draft of a set, show the parent prompt above it */}
            {gen.status === 'draft' && gen.parentPrompt && (idx === 0 || generations[idx-1].parentPrompt !== gen.parentPrompt) && (
               <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="tg-bubble tg-bubble-out"
                style={{ marginBottom: 4 }}
              >
                <p style={{ margin: 0, paddingRight: 48, fontSize: 16, fontWeight: 400, color: '#fff' }}>{gen.parentPrompt}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3, marginTop: 1 }}>
                  <span style={{ fontSize: 11, opacity: 0.6, fontWeight: 500, color: '#fff' }}>
                    {new Date(gen.id).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <CheckCircle2 size={12} style={{ opacity: 0.6, color: '#fff' }} />
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
                      crossOrigin="anonymous"
                      style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <video
                      src={gen.videoUrl}
                      className="hover-zoom"
                      crossOrigin="anonymous"
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
                      {gen.isMotion ? 'КАДР' : 'ВИДЕО'}
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

              {/* Draft: premium editable card */}
              {gen.status === 'draft' && (
                <div className="tg-bubble-draft" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ 
                        width: 32, height: 32, borderRadius: 10, 
                        background: 'linear-gradient(135deg, var(--tg-accent) 0%, #00c6ff 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,122,255,0.3)'
                      }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>{idx + 1}</span>
                      </div>
                      <span style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>
                        {gen.sceneName || `Кадр ${idx + 1}`}
                      </span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteVideo(idx); showHaptic('warning'); }}
                      className="ios-btn"
                      style={{ 
                        width: 32, height: 32, borderRadius: '50%', 
                        background: 'rgba(255,59,48,0.1)', border: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff3b30' 
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 12, border: '0.5px solid rgba(255,255,255,0.05)' }}>
                      <label style={{ display: 'block', fontSize: 11, color: 'var(--tg-hint)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8, letterSpacing: 0.5 }}>Визуальный промпт</label>
                      <textarea
                        value={gen.prompt || ''}
                        onChange={(e) => onUpdateVideo?.(gen.id, { prompt: e.target.value })}
                        rows={2}
                        style={{
                          width: '100%', background: 'none', border: 'none',
                          color: 'white', fontSize: 15, outline: 'none',
                          resize: 'none', fontFamily: 'inherit', lineHeight: 1.5, padding: 0
                        }}
                      />
                    </div>
                    
                    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 12, border: '0.5px solid rgba(255,255,255,0.05)' }}>
                      <label style={{ display: 'block', fontSize: 11, color: 'var(--tg-hint)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8, letterSpacing: 0.5 }}>Текст диктора</label>
                      <textarea
                        value={gen.voiceText || ''}
                        onChange={(e) => onUpdateVideo?.(gen.id, { voiceText: e.target.value })}
                        rows={2}
                        style={{
                          width: '100%', background: 'none', border: 'none',
                          color: 'white', fontSize: 15, outline: 'none',
                          resize: 'none', fontFamily: 'inherit', lineHeight: 1.5, padding: 0
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Loading/Processing/Thinking state */}
              {!['ready', 'draft'].includes(gen.status) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 4px' }}>
                  {gen.status === 'error' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,59,48,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <Trash2 size={18} color="#ff3b30" />
                      </div>
                      <div>
                        <div style={{ fontSize: 15, color: '#ff453a', fontWeight: 700 }}>{STATUS_LABELS.error}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,69,58,0.8)' }}>{gen.error || 'Проверьте API ключ SiliconFlow'}</div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ position: 'relative' }}>
                        <Loader2 size={32} color="var(--tg-accent)" className="animate-spin" />
                      </div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.3, color: 'white' }}>
                          {STATUS_LABELS[gen.status] || 'Обработка...'}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--tg-hint)', fontWeight: 500, marginTop: 2 }}>
                          {gen.status === 'thinking' ? 'Создаю структуру видео...' : 
                           gen.status === 'animating' ? 'Работает SiliconFlow AI ( Wan-AI )...' : 
                           'Пожалуйста, подождите...'}
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
      
      {/* Scenario confirmation area — only show if NOT using Telegram MainButton or as a backup */}
      {generations.some(g => g.status === 'draft') && !useTelegram().tg?.MainButton?.isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            margin: '20px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 24,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 40, height: 40, borderRadius: 12, 
              background: 'linear-gradient(135deg, var(--tg-accent) 0%, #a5b4fc 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(36,129,204,0.3)'
            }}>
              <Sparkles size={20} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'white', letterSpacing: -0.3 }}>Сценарий готов</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Проверьте кадры и начните магию</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => onRunGeneration?.()}
              className="ios-btn"
              style={{
                flex: 1,
                background: 'var(--tg-accent)',
                color: 'white',
                border: 'none',
                borderRadius: 14,
                height: 48,
                fontSize: 16,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                boxShadow: '0 8px 24px rgba(0,122,255,0.25)',
              }}
            >
              <Play size={18} fill="currentColor" />
              Начать генерацию
            </button>
            <button
              onClick={() => onClearDrafts?.()}
              className="ios-btn"
              style={{
                width: 48,
                height: 48,
                background: 'rgba(255,59,48,0.1)',
                border: 'none',
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ff3b30'
              }}
              title="Отклонить сценарий"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </motion.div>
      )}


      {/* Scroll Anchor */}
      <div ref={bottomRef} style={{ height: 1, marginTop: -1 }} />

      {/* Bottom padding */}
      <div style={{ height: 80 }} />

      <style>{`
        .chat-bg-premium {
          background: #090e14;
          position: relative;
        }
        .mesh-gradient {
          position: absolute;
          inset: 0;
          z-index: -1;
          opacity: 0.7;
          background: 
            radial-gradient(at 0% 0%, hsla(220,100%,20%,1) 0, transparent 50%), 
            radial-gradient(at 100% 0%, hsla(270,100%,15%,1) 0, transparent 50%),
            radial-gradient(at 100% 100%, hsla(210,100%,15%,1) 0, transparent 50%),
            radial-gradient(at 0% 100%, hsla(250,100%,20%,1) 0, transparent 50%);
          filter: blur(80px);
          animation: mesh-float 25s ease-in-out infinite alternate;
        }
        @keyframes mesh-float {
          0% { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.1) translate(20px, 20px); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ChatFlow;
