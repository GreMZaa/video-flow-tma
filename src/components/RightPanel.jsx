import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Layout, X, ChevronRight, User, Users, Music, Download, Wand2 } from 'lucide-react';
import { VOICE_OPTIONS } from '../services/api';

const RightPanel = ({ 
  characterPrompt, 
  setCharacterPrompt, 
  actionPrompt, 
  setActionPrompt, 
  aspectRatio, 
  setAspectRatio, 
  onCreate, 
  isLoading,
  isMobile,
  isOpen,
  onClose,
  projectMode,
  setProjectMode,
  selectedVoice,
  setSelectedVoice,
  personCount,
  setPersonCount,
  onAutomate,
  onExport,
  isExporting,
  exportProgress
}) => {
  const textareaRef = useRef(null);

  // Auto-expand action prompt
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [actionPrompt]);

  const ratios = [
    { label: '16:9', value: '16:9' },
    { label: '9:16', value: '9:16' },
    { label: '1:1', value: '1:1' }
  ];

  const panelContent = (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 2rem)' }}>
      {/* Header (only for mobile drawer) */}
      {isMobile && (
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h3 className="text-xl font-bold tracking-tighter">Настройки генерации</h3>
          <button onClick={onClose} className="p-2 liquid-glass rounded-full">
            <X size={20} />
          </button>
        </div>
      )}

      <div className="p-6 space-y-8">
        {/* Project Mode Toggle */}
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 shadow-inner">
          <button 
            onClick={() => setProjectMode('quick')}
            className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all tracking-widest ${projectMode === 'quick' ? 'bg-white/10 text-white shadow-lg' : 'text-tg-hint hover:text-white/60'}`}
          >
            БЫСТРО
          </button>
          <button 
            onClick={() => setProjectMode('workflow')}
            className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all tracking-widest ${projectMode === 'workflow' ? 'bg-tg-button text-white shadow-xl shadow-tg-button/30' : 'text-tg-hint hover:text-white/60'}`}
          >
            СЦЕНАРИЙ
          </button>
        </div>

        {/* Character/Style Input */}
        <div className="space-y-3">
          <label className="text-[10px] uppercase font-black text-tg-hint tracking-[0.25em] px-1 opacity-70">Персонаж и Стиль</label>
          <input
            type="text"
            value={characterPrompt}
            onChange={(e) => setCharacterPrompt(e.target.value)}
            placeholder="Напр: Пушкин в стиле Claymation..."
            className="w-full p-4 rounded-2xl text-sm liquid-glass border-none focus:ring-2 focus:ring-tg-button/20"
          />
        </div>

        {/* Main Idea Input */}
        <div className="space-y-3">
          <label className="text-[10px] uppercase font-black text-tg-hint tracking-[0.25em] px-1 opacity-70">
            {projectMode === 'workflow' ? 'Идея проекта (сюжет)' : 'Действие (Action)'}
          </label>
          <textarea
            ref={textareaRef}
            value={actionPrompt}
            onChange={(e) => setActionPrompt(e.target.value)}
            placeholder={projectMode === 'workflow' ? "Напишите краткую идею..." : "Что происходит в кадре?..."}
            rows={projectMode === 'workflow' ? 3 : 4}
            className="w-full p-4 rounded-2xl text-sm resize-none liquid-glass border-none focus:ring-2 focus:ring-tg-button/20 min-h-[100px]"
          />
        </div>

        {/* Additional Project Settings */}
        {projectMode === 'workflow' && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-6 overflow-hidden"
          >
            {/* Person Count */}
            <div className="space-y-3">
              <label className="text-[10px] uppercase font-black text-tg-hint tracking-[0.25em] px-1 opacity-70">Людей в кадре</label>
              <div className="flex gap-2">
                {[
                  { id: '1', icon: <User size={12} />, label: 'Один' },
                  { id: '2', icon: <Users size={12} />, label: 'Двое' },
                  { id: 'group', icon: <Users size={12} />, label: 'Группа' }
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => setPersonCount(p.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-tighter transition-all ${
                      personCount === p.id ? 'bg-white/10 border-white/20 text-white shadow-lg' : 'border-white/5 text-tg-hint bg-transparent'
                    }`}
                  >
                    {p.icon} {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Selector */}
            <div className="space-y-3">
              <label className="text-[10px] uppercase font-black text-tg-hint tracking-[0.25em] px-1 opacity-70">Голос озвучки</label>
              <div className="grid grid-cols-2 gap-2">
                {VOICE_OPTIONS.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVoice(v.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-[9px] font-black uppercase tracking-tight transition-all ${
                      selectedVoice === v.id ? 'bg-white/10 border-white/20 text-white shadow-lg' : 'border-white/5 text-tg-hint'
                    }`}
                  >
                    <div className={`p-1.5 rounded-md ${selectedVoice === v.id ? 'bg-tg-button/20 text-tg-button' : 'bg-white/5'}`}>
                      <Music size={12} />
                    </div>
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Aspect Ratio Selector */}
        <div className="space-y-3">
          <label className="text-[10px] uppercase font-black text-tg-hint tracking-[0.25em] px-1 opacity-70">Формат видео</label>
          <div className="grid grid-cols-3 gap-2">
            {ratios.map((r) => (
              <button
                key={r.value}
                onClick={() => setAspectRatio(r.value)}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-[10px] font-black transition-all ${
                  aspectRatio === r.value 
                    ? 'bg-white/10 border-white/20 text-white shadow-lg' 
                    : 'border-white/5 bg-white/5 text-tg-hint hover:bg-white/10'
                }`}
              >
                <Layout size={12} className="opacity-50" />
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Actions (Hidden on mobile if using MainButton) */}
        {!isMobile && (
          <div className="pt-4 space-y-3">
            <button
              onClick={onCreate}
              disabled={isLoading || !actionPrompt}
              className="w-full py-4 btn-primary flex items-center justify-center gap-3 relative overflow-hidden group disabled:opacity-50 shadow-2xl shadow-tg-button/30"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" /> : <Wand2 size={20} />}
              <span className="font-black uppercase tracking-[0.2em] text-[13px]">
                {projectMode === 'workflow' ? '1. Сценарий' : 'Сгенерировать магию'}
              </span>
            </button>

            {projectMode === 'workflow' && (
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={onAutomate} 
                  disabled={isLoading}
                  className="py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl flex flex-col items-center gap-1.5 border border-white/5 transition-all group disabled:opacity-50 shadow-lg shadow-black/20"
                >
                  <Sparkles size={18} className="text-amber-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-black uppercase tracking-[0.15em]">2. ГЕНЕРАЦИЯ</span>
                </button>
                <button 
                  onClick={onExport} 
                  disabled={isLoading || isExporting}
                  className="py-4 bg-white/5 hover:bg-tg-button/20 text-white rounded-2xl flex flex-col items-center gap-1.5 border border-white/5 transition-all group disabled:opacity-50 relative overflow-hidden shadow-lg shadow-black/20"
                >
                  {isExporting ? (
                    <div className="absolute inset-x-0 bottom-0 top-0 bg-tg-button/20 transition-all duration-300" style={{ width: `${exportProgress}%` }} />
                  ) : (
                    <Download size={18} className="text-tg-button group-hover:scale-110 transition-transform" />
                  )}
                  <span className="text-[9px] font-black uppercase tracking-[0.15em] relative z-10">
                    {isExporting ? `ЭКСПОРТ ${exportProgress}%` : '3. СКЛЕИТЬ'}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tips */}
        <div className="p-5 rounded-2xl liquid-glass">
          <p className="text-[10px] text-tg-hint leading-relaxed uppercase tracking-widest opacity-40 font-bold">
            Совет: Опишите не только объект, но и динамику движения. Модель CogVideoX-5B лучше всего справляется с плавными жестами.
          </p>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-40" 
            onClick={onClose}
          />
        )}
        {/* Drawer */}
        <div className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) bg-tg-bg rounded-t-[3rem] border-t border-white/10 shadow-2xl ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="w-16 h-1.5 bg-white/10 rounded-full mx-auto mt-4 mb-2" onClick={onClose} />
          {panelContent}
        </div>
      </>
    );
  }

  return (
    <aside className="w-[350px] fixed top-16 right-0 bottom-0 liquid-glass border-l-none z-20">
      {panelContent}
    </aside>
  );
};

export default RightPanel;
