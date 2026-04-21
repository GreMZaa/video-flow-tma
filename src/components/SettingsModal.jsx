import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, ShieldCheck } from 'lucide-react';

const SettingsModal = ({ apiKey, setApiKey, onClose }) => {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Content */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-sm liquid-glass rounded-[2rem] p-8 shadow-2xl z-10 border-white/20"
        >
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-black flex items-center gap-3 tracking-tighter">
              <Key size={24} className="text-tg-button shadow-glow" />
              Настройки
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="block text-[10px] font-black uppercase text-tg-hint tracking-[0.2em] ml-1 opacity-60">
                SILICON_FLOW_KEY
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 font-mono text-xs tracking-[0.3em] focus:ring-2 focus:ring-tg-button/20 transition-all"
              />
              <p className="text-[9px] font-bold text-tg-hint mt-2 ml-1 flex items-center gap-1.5 uppercase tracking-wider opacity-50">
                <ShieldCheck size={12} className="text-emerald-500" />
                Хранится локально на вашем устройстве
              </p>
            </div>

            <div className="bg-tg-button/5 p-5 rounded-2xl border border-tg-button/10">
              <p className="text-[11px] leading-relaxed text-tg-button font-medium">
                Вы можете получить бесплатный API-ключ на сайте <a href="https://siliconflow.cn" target="_blank" rel="noreferrer" className="underline font-black">siliconflow.cn</a>. Это активирует логику CogVideo.
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-4 btn-primary rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-tg-button/20 active:scale-95 transition-transform"
            >
              Сохранить
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SettingsModal;
