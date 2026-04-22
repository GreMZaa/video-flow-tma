import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Wand2, Paperclip, Smile, Mic, Play, Download } from 'lucide-react';

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
}) => {
  const textareaRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading) onSend();
    }
  };

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  React.useEffect(() => { adjustHeight(); }, [value]);

  const canSend = value.trim().length > 0 && !isLoading;
  const showRunButton = hasDrafts && !value.trim() && !isLoading && !isExporting;
  const showExportButton = hasReadyVideos && !hasDrafts && !value.trim() && !isExporting;

  return (
    <div style={{
      flexShrink: 0,
      background: 'rgba(28, 28, 29, 0.92)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '0.5px solid rgba(255,255,255,0.1)',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>

      {/* Action Buttons (Run / Export) */}
      {(showRunButton || showExportButton) && (
        <div style={{ display: 'flex', gap: 8, padding: '10px 12px 0' }}>
          {showRunButton && (
            <button
              onClick={onRunGeneration}
              disabled={isLoading}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '11px 0', borderRadius: 22, border: 'none', cursor: 'pointer',
                background: 'var(--tg-accent)', color: 'white', fontSize: 15, fontWeight: 600,
              }}
            >
              <Play size={16} fill="white" /> Запустить генерацию
            </button>
          )}
          {showExportButton && (
            <button
              onClick={onExport}
              disabled={isExporting}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '11px 0', borderRadius: 22, border: 'none', cursor: 'pointer',
                background: '#34c759', color: 'white', fontSize: 15, fontWeight: 600,
              }}
            >
              <Download size={16} /> Скачать видео
            </button>
          )}
        </div>
      )}

      {/* Input Row */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, padding: '8px 8px 8px' }}>

        {/* Mode Toggle Button */}
        <button
          onClick={() => setMode(mode === 'creative' ? 'workflow' : 'creative')}
          title={mode === 'workflow' ? 'Режим: Сценарий (нажми чтобы переключить)' : 'Режим: Кадр (нажми чтобы переключить)'}
          style={{
            padding: '8px 10px',
            color: mode === 'workflow' ? 'var(--tg-accent)' : 'var(--tg-hint)',
            background: 'none', border: 'none', cursor: 'pointer',
            flexShrink: 0, transition: 'color 0.2s',
          }}
        >
          {mode === 'workflow'
            ? <Wand2 size={26} strokeWidth={2} />
            : <Paperclip size={26} strokeWidth={2} />
          }
        </button>

        {/* Text Area Container */}
        <div style={{
          flex: 1,
          background: 'rgba(255,255,255,0.09)',
          borderRadius: 22,
          padding: '6px 12px',
          display: 'flex', alignItems: 'flex-end', gap: 6,
          border: '0.5px solid rgba(255,255,255,0.07)',
          minHeight: 44,
        }}>
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={mode === 'workflow' ? 'Опишите сценарий...' : 'Опишите кадр...'}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: 'white', fontSize: 16, lineHeight: '22px',
              padding: '2px 0', resize: 'none', maxHeight: 120,
              fontFamily: 'inherit',
            }}
          />
          <button style={{ marginBottom: 2, background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--tg-hint)', flexShrink: 0 }}>
            <Smile size={22} strokeWidth={2} />
          </button>
        </div>

        {/* Send / Mic Button */}
        <div style={{ padding: '0 4px', flexShrink: 0 }}>
          <AnimatePresence mode="wait">
            {canSend ? (
              <motion.button
                key="send"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.15 }}
                whileTap={{ scale: 0.85 }}
                onClick={onSend}
                disabled={isLoading}
                style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: 'var(--tg-accent)', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', boxShadow: '0 2px 12px rgba(0,122,255,0.4)',
                }}
              >
                <Send size={18} strokeWidth={2.5} style={{ transform: 'translateX(1px)' }} />
              </motion.button>
            ) : (
              <motion.button
                key="mic"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.15 }}
                style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--tg-hint)',
                }}
              >
                <Mic size={26} strokeWidth={2} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mode Dots Indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 5, paddingBottom: 8 }}>
        <div style={{
          height: 3, borderRadius: 3, transition: 'all 0.3s',
          width: mode === 'creative' ? 20 : 6,
          background: mode === 'creative' ? 'var(--tg-accent)' : 'rgba(255,255,255,0.15)',
        }} />
        <div style={{
          height: 3, borderRadius: 3, transition: 'all 0.3s',
          width: mode === 'workflow' ? 20 : 6,
          background: mode === 'workflow' ? 'var(--tg-accent)' : 'rgba(255,255,255,0.15)',
        }} />
      </div>
    </div>
  );
};

export default NativeInput;
