import React, { useRef } from 'react';
import { Send, Wand2, Paperclip } from 'lucide-react';
import { motion } from 'framer-motion';

const NativeInput = ({ 
  value, 
  onChange, 
  onSend, 
  isLoading, 
  mode, 
  setMode
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

  React.useEffect(() => {
    adjustHeight();
  }, [value]);

  return (
    <div className="tg-input-bar relative px-2 pb-safe">
      <div className="max-w-4xl mx-auto flex items-end gap-2 p-1 bg-tg-bg rounded-2xl border border-white/[0.05]">
        {/* Mode Toggle Button */}
        <button 
          onClick={() => setMode(mode === 'creative' ? 'workflow' : 'creative')}
          className={`p-2.5 rounded-xl transition-all active:scale-90 ${mode === 'workflow' ? 'text-tg-accent bg-tg-accent/10' : 'text-tg-hint hover:bg-white/5'}`}
        >
          {mode === 'workflow' ? <Wand2 size={24} strokeWidth={2} /> : <Paperclip size={24} strokeWidth={2} />}
        </button>

        {/* Text Area */}
        <div className="flex-1 relative flex items-center">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={mode === 'workflow' ? "Опишите сценарий..." : "Опишите сцену..."}
            className="tg-input-field resize-none py-2.5 max-h-[120px] custom-scrollbar overflow-y-auto block bg-transparent border-none focus:ring-0 text-[15px]"
          />
        </div>

        {/* Send Button */}
        <div className="flex items-center p-1">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={onSend}
            disabled={!value.trim() || isLoading}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${!value.trim() ? 'text-tg-hint opacity-40' : 'text-tg-accent bg-tg-accent/10'}`}
          >
            <Send size={20} strokeWidth={2.5} className={isLoading ? 'animate-pulse' : ''} />
          </motion.button>
        </div>
      </div>
      
      {/* Mode Indicators */}
      <div className="flex justify-center mt-2 pb-2">
        <div className="flex gap-2">
          <div className={`h-1 rounded-full transition-all duration-300 ${mode === 'creative' ? 'w-4 bg-tg-accent' : 'w-1 bg-white/10'}`} />
          <div className={`h-1 rounded-full transition-all duration-300 ${mode === 'workflow' ? 'w-4 bg-tg-accent' : 'w-1 bg-white/10'}`} />
        </div>
      </div>
    </div>
  );
};

export default NativeInput;
