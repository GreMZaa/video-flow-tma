import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Wand2, Smile, Mic, Play, Download, Loader2 } from 'lucide-react';

/**
 * NativeInput — fixed-position input bar that always stays above the keyboard.
 *
 * Strategy: use `position: fixed` anchored to the VISUAL viewport bottom.
 * We listen to `window.visualViewport.resize` and shift `bottom` so the bar
 * rides up together with the keyboard on iOS Telegram Mini App.
 */
const NativeInput = ({
  value,
  onChange,
  onSend,
  isLoading,
  mode,
  setMode,
  onRunGeneration,
  onExport,
  hasDrafts,
  hasReadyVideos,
  isExporting,
  // Height callback so parent (ChatFlow) can add matching padding-bottom
  onHeightChange,
}) => {
  const textareaRef = useRef(null);
  const barRef = useRef(null);
  const [bottomOffset, setBottomOffset] = useState(0);

  // ── Visual-viewport keyboard tracking ──────────────────────────────────────
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      // How far the bottom of the visual viewport is from the layout bottom
      const offsetFromBottom = window.innerHeight - (vv.offsetTop + vv.height);
      setBottomOffset(Math.max(0, Math.round(offsetFromBottom)));
    };

    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  // Notify parent of bar height so ChatFlow adds padding-bottom
  useEffect(() => {
    if (!barRef.current || !onHeightChange) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        onHeightChange(entry.contentRect.height + bottomOffset);
      }
    });
    ro.observe(barRef.current);
    return () => ro.disconnect();
  }, [bottomOffset, onHeightChange]);

  // ── Textarea auto-height ────────────────────────────────────────────────────
  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };
  useEffect(() => { adjustHeight(); }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading) onSend();
    }
  };

  const canSend = value.trim().length > 0 && !isLoading;
  const showRunButton = hasDrafts && !value.trim() && !isLoading && !isExporting;
  const showExportButton = hasReadyVideos && !hasDrafts && !value.trim() && !isExporting;

  return (
    <div
      ref={barRef}
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: bottomOffset,
        zIndex: 200,
        background: 'rgba(14, 22, 33, 0.97)',
        backdropFilter: 'blur(30px) saturate(180%)',
        WebkitBackdropFilter: 'blur(30px) saturate(180%)',
        borderTop: '0.5px solid rgba(255, 255, 255, 0.08)',
        paddingBottom: bottomOffset > 0 ? 8 : 'env(safe-area-inset-bottom, 8px)',
        paddingTop: 8,
        transition: 'bottom 0.08s linear',
      }}
    >
      {/* Mode Indicator & Action Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px 10px' }}>
        <div
          onClick={() => setMode(mode === 'creative' ? 'workflow' : 'creative')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
            padding: '4px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.05)',
            border: '0.5px solid rgba(255,255,255,0.1)',
          }}
        >
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: mode === 'workflow' ? '#50a2e9' : '#ff9500',
            boxShadow: `0 0 8px ${mode === 'workflow' ? '#50a2e9' : '#ff9500'}`,
          }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'white', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {mode === 'workflow' ? 'Сценарий' : 'Кадр'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {showRunButton && (
            <motion.button
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={onRunGeneration}
              disabled={isLoading}
              className="ios-btn"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 14, border: 'none',
                background: 'var(--tg-accent)', color: 'white', fontSize: 12, fontWeight: 700,
                boxShadow: '0 4px 12px rgba(0,122,255,0.3)',
              }}
            >
              <Play size={12} fill="currentColor" /> Начать генерацию
            </motion.button>
          )}
          {showExportButton && (
            <motion.button
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={onExport}
              disabled={isExporting}
              className="ios-btn"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 14, border: 'none',
                background: '#34c759', color: 'white', fontSize: 12, fontWeight: 700,
                boxShadow: '0 4px 12px rgba(52,199,89,0.3)',
              }}
            >
              {isExporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
              Экспорт
            </motion.button>
          )}
        </div>
      </div>

      {/* Input Row */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, padding: '0 8px' }}>
        <button
          onClick={() => setMode(mode === 'creative' ? 'workflow' : 'creative')}
          style={{
            padding: '8px 8px',
            color: mode === 'workflow' ? 'var(--tg-accent)' : 'var(--tg-hint)',
            background: 'none', border: 'none', cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <Wand2 size={24} strokeWidth={2.5} />
        </button>

        <div style={{
          flex: 1,
          background: 'rgba(255,255,255,0.07)',
          borderRadius: 22,
          padding: '6px 12px',
          display: 'flex', alignItems: 'flex-end', gap: 6,
          border: '0.5px solid rgba(255,255,255,0.08)',
          minHeight: 40,
        }}>
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={mode === 'workflow' ? 'Опишите идею для видео...' : 'Опишите кадр...'}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: 'white', fontSize: 17, lineHeight: '22px',
              padding: '6px 0', resize: 'none', maxHeight: 160,
              fontFamily: 'inherit',
              WebkitAppearance: 'none',
            }}
          />
          <button
            style={{ marginBottom: 4, background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--tg-hint)', flexShrink: 0 }}
          >
            <Smile size={22} strokeWidth={2} />
          </button>
        </div>

        <div style={{ padding: '0 2px', flexShrink: 0 }}>
          <button
            onClick={onSend}
            disabled={!canSend}
            className="ios-btn"
            style={{
              width: 38, height: 38, borderRadius: '50%',
              background: canSend ? 'var(--tg-accent)' : 'rgba(255,255,255,0.05)',
              border: 'none', cursor: canSend ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: canSend ? 'white' : 'rgba(255,255,255,0.2)',
              transition: 'all 0.2s',
            }}
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : canSend ? (
              <Send size={18} strokeWidth={2.5} style={{ transform: 'translateX(1px)' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mic size={22} strokeWidth={2} />
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NativeInput;
