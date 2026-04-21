import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Trash2, Video, Volume2, Sparkles, Clock, ExternalLink } from 'lucide-react';

const VideoCard = ({ item, onDelete, onPlay }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative glass rounded-[24px] overflow-hidden border border-white/5 bg-white/[0.02] hover:border-tg-button/50 transition-all duration-500"
    >
      {/* Thumbnail Area */}
      <div className="relative aspect-video bg-black/60 overflow-hidden cursor-pointer" onClick={onPlay}>
        {item.imageUrl && (
          <img 
            src={item.imageUrl} 
            alt={item.prompt} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
          />
        )}
        
        {/* Hover Overlays */}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
        
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-14 h-14 rounded-full bg-tg-button/90 flex items-center justify-center shadow-2xl shadow-tg-button/40 scale-90 group-hover:scale-100 transition-transform duration-300">
            <Play size={24} className="text-white fill-current ml-1" />
          </div>
        </div>

        {/* Status Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <div className="glass px-2 py-1 rounded-lg flex items-center gap-1.5 backdrop-blur-md border-white/10 shrink-0">
            <Clock size={10} className="text-tg-button" />
            <span className="text-[10px] font-bold text-white tracking-wider">5s</span>
          </div>
          {item.style && (
            <div className="hidden lg:flex glass px-2 py-1 rounded-lg items-center gap-1.5 backdrop-blur-md border-white/10">
              <Sparkles size={10} className="text-amber-400" />
              <span className="text-[10px] font-bold text-white/70 truncate max-w-[80px]">{item.style}</span>
            </div>
          )}
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-red-500/80 rounded-xl text-white/50 hover:text-white transition-all opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Info Area */}
      <div className="p-4 space-y-1">
        <p className="text-xs font-medium text-white/90 line-clamp-1 group-hover:text-tg-button transition-colors">
          {item.prompt || 'Untitled Generation'}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[9px] uppercase font-bold text-tg-hint tracking-widest opacity-60">
            {item.aspectRatio || '16:9'} • CogVideoX
          </span>
          <ExternalLink size={10} className="text-tg-hint/30" />
        </div>
      </div>
    </motion.div>
  );
};

const MainGrid = ({ generations, onDelete, onPlay }) => {
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
