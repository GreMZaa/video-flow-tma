import { Plus, Search, CheckCircle2, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

const ProjectList = ({ projects, onSelectProject, onCreateProject, onDeleteProject, activeProjectId }) => {
  return (
    <div className="flex flex-col h-full bg-tg-header border-r border-white/5 w-full md:max-w-xs shrink-0 z-20">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-white/5">
        <h1 className="text-lg font-bold">Видео Поток</h1>
        <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <Search size={20} className="text-tg-hint" />
        </button>
      </div>

      {/* Tabs / Filter (Telegram Style) */}
      <div className="flex px-4 gap-6 border-b border-white/5 bg-tg-header">
        <button className="text-[13px] font-bold text-tg-accent border-b-[3px] border-tg-accent py-3 shrink-0 uppercase tracking-tight">Все чаты</button>
        <button className="text-[13px] font-bold text-tg-hint py-3 shrink-0 uppercase tracking-tight opacity-60">Проекты</button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-tg-bg">
        {projects.map((project) => {
          const isActive = activeProjectId === project.id;
          const lastGen = project.generations[0];
          const time = new Date(project.lastUpdate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          
          return (
            <motion.div 
              key={project.id}
              whileTap={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
              className={`group flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-white/[0.03] ${isActive ? 'bg-tg-accent/10' : ''}`}
            >
              <div 
                onClick={() => onSelectProject(project.id)}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 overflow-hidden shadow-inner relative ${isActive ? 'ring-2 ring-tg-accent ring-offset-2 ring-offset-tg-bg' : ''} bg-gradient-to-br from-tg-accent to-[#2b5278]`}
              >
                {project.name[0].toUpperCase()}
                {isActive && (
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-tg-bg rounded-full" />
                )}
              </div>
              
              <div 
                onClick={() => onSelectProject(project.id)}
                className="flex-1 min-w-0"
              >
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className={`text-[15px] font-bold truncate ${isActive ? 'text-tg-accent' : 'text-tg-text'}`}>
                    {project.name}
                  </h3>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                     {lastGen?.status === 'ready' && <CheckCircle2 size={12} className="text-tg-accent" />}
                     <span className="text-[11px] text-tg-hint font-medium">{time}</span>
                  </div>
                </div>
                <p className="text-[13px] text-tg-hint truncate leading-snug">
                  {lastGen ? (lastGen.sceneName || lastGen.prompt) : 'Пустой проект...'}
                </p>
              </div>

              {/* Delete Button - Visible on hover or active */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Удалить проект "${project.name}"?`)) {
                    onDeleteProject(project.id);
                  }
                }}
                className="opacity-0 group-hover:opacity-100 p-2 text-tg-hint hover:text-red-400 transition-all"
              >
                <Trash2 size={18} />
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* FAB - Native Telegram Style */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        onClick={onCreateProject}
        className="fixed bottom-6 right-6 md:absolute md:bottom-8 md:right-6 w-14 h-14 bg-tg-accent rounded-full shadow-[0_4px_15px_rgba(51,144,236,0.4)] flex items-center justify-center text-white z-30 transition-shadow hover:shadow-[0_6px_20px_rgba(51,144,236,0.6)]"
      >
        <Plus size={28} strokeWidth={2.5} />
      </motion.button>
    </div>
  );
};

export default ProjectList;
