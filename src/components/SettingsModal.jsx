import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, ShieldCheck } from 'lucide-react';

const SettingsModal = ({ apiKey, setApiKey, onClose }) => {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Content */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-sm glass rounded-3xl p-6 shadow-2xl z-10"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Key size={20} className="text-tg-button" />
              Settings
            </h3>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-tg-hint mb-2 ml-1">
                SILICON_FLOW_KEY
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full p-4 rounded-xl font-mono text-sm tracking-widest"
              />
              <p className="text-[10px] text-tg-hint mt-2 ml-1 flex items-center gap-1">
                <ShieldCheck size={12} />
                Stored locally on your device
              </p>
            </div>

            <div className="bg-tg-button/10 p-4 rounded-2xl border border-tg-button/20">
              <p className="text-xs leading-relaxed text-tg-button/90">
                You can get your free API key at <a href="https://siliconflow.cn" target="_blank" rel="noreferrer" className="underline font-bold">siliconflow.cn</a>. This enables the CogVideo logic.
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full btn-primary mt-4"
            >
              Save & Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SettingsModal;
