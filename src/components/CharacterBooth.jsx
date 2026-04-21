import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';

const CharacterBooth = ({ onStart, initialValue }) => {
  const [prompt, setPrompt] = useState(initialValue);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      className="flex flex-col items-center justify-center min-h-[70dvh] text-center p-6"
    >
      <div className="w-24 h-24 bg-tg-button/20 rounded-[2rem] flex items-center justify-center mb-10 liquid-glass shadow-glow active:scale-95 transition-transform cursor-pointer">
        <Sparkles className="text-tg-button filter drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" size={48} />
      </div>
      
      <h2 className="text-4xl font-black mb-4 tracking-tighter uppercase text-white">Персонаж</h2>
      <p className="text-tg-hint mb-10 max-w-xs mx-auto text-sm font-medium leading-relaxed opacity-70">
        Опишите главного героя или стиль вашего видео. Начните магию с ярких деталей.
      </p>

      <div className="w-full max-w-sm space-y-8">
        <div className="relative group">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Кто главный герой?..."
            className="w-full p-6 rounded-[2rem] min-h-[160px] text-lg font-bold leading-relaxed liquid-glass border-none focus:ring-4 focus:ring-tg-button/20 transition-all resize-none shadow-2xl"
          />
          <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-tg-button/5 to-white/5 pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity" />
        </div>

        <button
          onClick={() => onStart(prompt)}
          disabled={!prompt.trim()}
          className="w-full py-5 btn-primary flex items-center justify-center gap-3 disabled:opacity-20 disabled:grayscale transition-all group shadow-2xl shadow-tg-button/30 active:scale-[0.98]"
        >
          <span className="font-black uppercase tracking-[0.2em] text-sm">Продолжить</span>
          <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform duration-300" />
        </button>
      </div>
    </motion.div>
  );
};

export default CharacterBooth;
