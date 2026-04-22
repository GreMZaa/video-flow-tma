import React, { useState, useRef } from 'react';
import { Send, Sparkles, Wand2, Paperclip, Mic, Settings2 } from 'lucide-react';
import { motion } from 'framer-motion';

const NativeInput = ({ 
  value, 
  onChange, 
  onSend, 
  onAutomate, 
  isLoading, 
  mode, 
  setMode,
  hasDrafts 
}) => {
  const textareaRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="tg-input-bar">
      <div className="max-w-4xl mx-auto flex items-end gap-2 px-2">
        {/* Attachment/Mode button */}
        <button 
          onClick={() => setMode(mode === 'creative' ? 'workflow' : 'creative')}
          className={`p-2 rounded-full transition-colors ${mode === 'workflow' ? 'text-tg-accent bg-tg-accent/10' : 'text-tg-hint hover:bg-white/5'}`}
          title={mode === 'workflow' ? 'Переключить в ручной режим' : 'Переключить в режим сценария'}
        >
          {mode === 'workflow' ? <Wand2 size={24} /> : <Paperclip size={24} />}
        </button>

        {/* Text Area Container */}
        <div className="flex-1 relative flex items-center">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => { onChange(e.target.value); adjustHeight(); }}
            onKeyDown={handleKeyDown}
            placeholder={mode === 'workflow' ? "Опишите сценарий (например: история о коте)..." : "Опишите сцену..."}
            className="tg-input-field resize-none py-2.5 max-h-[120px] custom-scrollbar overflow-y-auto block"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {hasDrafts && !value && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={onAutomate}
              disabled={isLoading}
              className="p-2 text-tg-accent rounded-full hover:bg-tg-accent/10 transition-colors disabled:opacity-50"
              title="Запустить автоматизацию всех черновиков"
            >
              <Sparkles size={24} />
            </motion.button>
          )}

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onSend}
            disabled={!value || isLoading}
            className={`p-2 rounded-full transition-all ${!value ? 'text-tg-hint' : 'text-tg-accent bg-tg-accent/10'}`}
          >
            <Send size={24} className={isLoading ? 'animate-pulse' : ''} />
          </motion.button>
        </div>
      </div>
      
      {/* Visual indicator for current mode */}
      <div className="flex justify-center mt-1">
        <div className="flex gap-1.5">
          <div className={`w-1 h-1 rounded-full ${mode === 'creative' ? 'bg-tg-accent' : 'bg-white/10'}`} />
          <div className={`w-1 h-1 rounded-full ${mode === 'workflow' ? 'bg-tg-accent' : 'bg-white/10'}`} />
        </div>
      </div>
    </div>
  );
};

export default NativeInput;
