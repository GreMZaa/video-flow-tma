import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';

const CharacterBooth = ({ onStart, initialValue }) => {
  const [prompt, setPrompt] = useState(initialValue);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center"
    >
      <div className="w-20 h-20 bg-tg-button/20 rounded-3xl flex items-center justify-center mb-8 glass">
        <Sparkles className="text-tg-button" size={40} />
      </div>
      
      <h2 className="text-3xl font-bold mb-4 tracking-tight">Создайте персонажа</h2>
      <p className="text-tg-hint mb-10 max-w-xs mx-auto">
        Опишите человека, персонажа или объект, который вы хотите анимировать. 
        Пример: "Александр Пушкин в кабинете XIX века"
      </p>

      <div className="w-full max-w-sm space-y-6">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Кто главный герой?..."
          className="w-full p-4 rounded-2xl min-h-[120px] text-lg leading-relaxed glass resize-none"
        />

        <button
          onClick={() => onStart(prompt)}
          disabled={!prompt.trim()}
          className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed group"
        >
          <span>Продолжить</span>
          <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
};

export default CharacterBooth;
