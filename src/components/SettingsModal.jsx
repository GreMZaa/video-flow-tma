import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, ShieldCheck, Type, Palette, Monitor, Users, Volume2 } from 'lucide-react';

const SettingsModal = ({ 
  apiKey, setApiKey, 
  onClose,
  projectName, setProjectName,
  characterPrompt, setCharacterPrompt,
  personCount, setPersonCount,
  aspectRatio, setAspectRatio,
  selectedVoice, setSelectedVoice,
  voiceOptions
}) => {
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
          className="relative w-full max-w-lg bg-[#1c1c1d] rounded-[2rem] shadow-2xl z-10 border border-white/10 flex flex-col max-h-[90vh]"
        >
          {/* Fixed Header */}
          <div className="p-6 flex justify-between items-center border-b border-white/5">
            <h3 className="text-xl font-bold flex items-center gap-3">
              Настройки проекта
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-tg-hint">
              <X size={24} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            
            {/* General Settings */}
            <div className="space-y-6">
              <SectionTitle icon={<Type size={16}/>} title="Общие" />
              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-xs text-tg-hint ml-1">Название проекта</label>
                    <input 
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="Имя проекта..."
                      className="w-full bg-white/5 border border-white/5 px-4 py-3 rounded-xl text-sm"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs text-tg-hint ml-1 flex items-center gap-2">
                      <Palette size={14}/> Глобальный стиль (Character Prompt)
                    </label>
                    <textarea 
                      value={characterPrompt}
                      onChange={(e) => setCharacterPrompt(e.target.value)}
                      placeholder="Напр: Pushkin in claymation style..."
                      className="w-full bg-white/5 border border-white/5 px-4 py-3 rounded-xl text-sm min-h-[80px]"
                    />
                 </div>
              </div>
            </div>

            {/* Production Settings */}
            <div className="space-y-6">
              <SectionTitle icon={<Monitor size={16}/>} title="Производство" />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-tg-hint ml-1 flex items-center gap-2"><Monitor size={12}/> Формат</label>
                  <select 
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 px-4 py-3 rounded-xl text-sm appearance-none"
                  >
                    <option value="16:9">Горизонтальный (16:9)</option>
                    <option value="9:16">Вертикальный (9:16)</option>
                    <option value="1:1">Квадратный (1:1)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-tg-hint ml-1 flex items-center gap-2"><Users size={12}/> Персонажи</label>
                  <input 
                    type="number"
                    value={personCount}
                    onChange={(e) => setPersonCount(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 px-4 py-3 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-tg-hint ml-1 flex items-center gap-2"><Volume2 size={12}/> Голос (TTS)</label>
                <select 
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 px-4 py-3 rounded-xl text-sm"
                >
                  {voiceOptions.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Advanced / Keys */}
            <div className="space-y-6">
              <SectionTitle icon={<Key size={16}/>} title="Дополнительно" />
              <div className="space-y-3">
                <label className="text-xs text-tg-hint ml-1">Премиум API ключ (SiliconFlow)</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full p-4 rounded-xl bg-white/5 border border-white/10 font-mono text-xs"
                />
                <p className="text-[10px] text-tg-hint flex items-center gap-1.5 opacity-60">
                  <ShieldCheck size={12} className="text-emerald-500" />
                  Ключ хранится только локально на вашем устройстве
                </p>
              </div>
            </div>

          </div>

          {/* Fixed Footer */}
          <div className="p-6 border-t border-white/5">
            <button
              onClick={onClose}
              className="w-full py-4 bg-tg-accent text-white rounded-2xl font-bold active:scale-95 transition-transform"
            >
              Применить настройки
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const SectionTitle = ({ icon, title }) => (
  <div className="flex items-center gap-2 opacity-80">
    <div className="text-tg-accent">{icon}</div>
    <span className="text-[10px] font-bold uppercase tracking-widest">{title}</span>
  </div>
);

export default SettingsModal;
