import React, { useRef, useEffect } from 'react';
import { Sparkles, Layout, X, ChevronRight } from 'lucide-react';

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
  onClose
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
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Header (only for mobile drawer) */}
      {isMobile && (
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h3 className="text-xl font-bold">Настройки генерации</h3>
          <button onClick={onClose} className="p-2 glass rounded-full ring-1 ring-white/10">
            <X size={20} />
          </button>
        </div>
      )}

      <div className="p-6 space-y-8">
        {/* Character/Style Input */}
        <div className="space-y-3">
          <label className="text-[10px] uppercase font-bold text-tg-hint tracking-[0.2em] px-1">Персонаж и Стиль</label>
          <input
            type="text"
            value={characterPrompt}
            onChange={(e) => setCharacterPrompt(e.target.value)}
            placeholder="Напр: Пушкин в стиле Claymation..."
            className="w-full p-4 rounded-2xl text-sm transition-all focus:ring-1 focus:ring-tg-button/30"
          />
        </div>

        {/* Action Prompt Input */}
        <div className="space-y-3">
          <label className="text-[10px] uppercase font-bold text-tg-hint tracking-[0.2em] px-1">Действие (Action)</label>
          <textarea
            ref={textareaRef}
            value={actionPrompt}
            onChange={(e) => setActionPrompt(e.target.value)}
            placeholder="Что происходит в кадре?..."
            rows={4}
            className="w-full p-4 rounded-2xl text-sm resize-none transition-all focus:ring-1 focus:ring-tg-button/30 min-h-[120px]"
          />
        </div>

        {/* Aspect Ratio Selector */}
        <div className="space-y-3">
          <label className="text-[10px] uppercase font-bold text-tg-hint tracking-[0.2em] px-1">Формат (Aspect Ratio)</label>
          <div className="grid grid-cols-3 gap-2">
            {ratios.map((r) => (
              <button
                key={r.value}
                onClick={() => setAspectRatio(r.value)}
                className={`py-3 rounded-xl border text-xs font-bold transition-all ${
                  aspectRatio === r.value 
                    ? 'bg-tg-button border-tg-button text-white shadow-lg shadow-tg-button/20' 
                    : 'border-white/5 bg-white/5 text-tg-hint hover:bg-white/10'
                }`}
              >
                <Layout size={14} className="mx-auto mb-1 opacity-50" />
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Create Button */}
        <button
          onClick={onCreate}
          disabled={isLoading || !actionPrompt}
          className="w-full py-5 btn-primary flex items-center justify-center gap-3 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[0%] transition-transform duration-500 skew-x-12" />
          <Sparkles size={20} className={isLoading ? 'animate-pulse' : ''} />
          <span className="font-bold uppercase tracking-widest text-sm">
            {isLoading ? 'Генерация...' : 'Создать видео'}
          </span>
          {!isLoading && <ChevronRight size={18} className="opacity-50 group-hover:translate-x-1 transition-transform" />}
        </button>

        {/* Tips */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
          <p className="text-[10px] text-tg-hint leading-relaxed uppercase tracking-tight opacity-60">
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40" 
            onClick={onClose}
          />
        )}
        {/* Drawer */}
        <div className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out frosted-glass rounded-t-[32px] drawer-shadow ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-3 mb-1" onClick={onClose} />
          {panelContent}
        </div>
      </>
    );
  }

  return (
    <aside className="w-[350px] fixed top-16 right-0 bottom-0 frosted-glass border-l border-white/5 z-20">
      {panelContent}
    </aside>
  );
};

export default RightPanel;
