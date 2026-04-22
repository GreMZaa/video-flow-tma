import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Trash2, Video, Volume2, Sparkles, Clock, ExternalLink } from 'lucide-react';

const VideoCard = ({ item, onDelete, onPlay }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ 
        type: "spring", 
        stiffness: 100, 
        damping: 15,
        mass: 1
      }}
      className="group relative liquid-glass rounded-[2rem] overflow-hidden hover:border-tg-button/40 transition-all duration-500"
    >
      {/* Thumbnail Area */}
      <div className="relative aspect-video bg-black/40 overflow-hidden cursor-pointer" onClick={onPlay}>
        {item.imageUrl && (
          <img 
            src={item.imageUrl} 
            alt={item.prompt} 
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-90 group-hover:opacity-100"
          />
        )}
        
        {/* Hover Overlays */}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-500" />
        
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
          <div className="w-16 h-16 rounded-full bg-tg-button/95 flex items-center justify-center shadow-2xl shadow-tg-button/40 transition-transform duration-300 hover:scale-110 active:scale-95">
            <Play size={28} className="text-white fill-current ml-1" />
          </div>
        </div>

        {/* Status Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          <div className="liquid-glass px-2.5 py-1 rounded-xl flex items-center gap-1.5 backdrop-blur-3xl border-white/10 shrink-0">
            <Clock size={10} className="text-tg-button" />
            <span className="text-[10px] font-black text-white tracking-widest">5S</span>
          </div>
          {item.style && (
            <div className="hidden lg:flex liquid-glass px-2.5 py-1 rounded-xl items-center gap-1.5 backdrop-blur-3xl border-white/10">
              <Sparkles size={10} className="text-amber-400" />
              <span className="text-[10px] font-black text-white/80 truncate max-w-[100px] uppercase tracking-tighter">{item.style}</span>
            </div>
          )}
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute top-4 right-4 p-2.5 bg-black/40 hover:bg-red-500 rounded-xl text-white/40 hover:text-white transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Info Area */}
      <div className="p-6 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-white/95 line-clamp-1 group-hover:text-tg-button transition-colors tracking-tighter">
            {item.sceneName || item.prompt || 'Без названия'}
          </p>
          {item.status === 'draft' && (
            <span className="text-[9px] px-2 py-0.5 rounded-lg bg-white/5 text-tg-hint border border-white/5 font-black tracking-widest">DRAFT</span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-black text-tg-hint tracking-[0.1em] opacity-40 truncate max-w-[80%]">
            {item.status === 'generating' ? 'Инициализация...' : 
             item.status === 'generating_video' ? 'Магия видео...' : 
             (item.prompt || 'Universal Free Engine')}
          </span>
          <div className="flex gap-1.5">
             <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${item.imageUrl ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-white/10'}`} title="Image" />
             <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${item.videoUrl ? 'bg-tg-button shadow-[0_0_8px_rgba(56,189,248,0.5)]' : 'bg-white/10'}`} title="Video" />
             <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${item.audioUrl ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-white/10'}`} title="Audio" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const MainGrid = ({ generations, onDelete, onPlay }) => {
  if (generations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] xl:min-h-[60vh] text-center px-6 py-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center mb-6"
        >
          <Video size={36} className="text-tg-hint/20" />
        </motion.div>
        <h3 className="text-xl font-bold text-white/50 mb-2">Здесь пока ничего нет</h3>
        <p className="text-sm text-tg-hint/40 max-w-xs uppercase tracking-widest text-[9px] md:text-[10px] font-bold leading-relaxed">
          Используйте панель генерации, чтобы создать ваше первое видео
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
      <AnimatePresence mode="popLayout">
        {generations.map((gen, idx) => (
          <VideoCard 
            key={gen.id || idx} 
            item={gen} 
            onDelete={() => onDelete(idx)}
            onPlay={() => onPlay(gen)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default MainGrid;
