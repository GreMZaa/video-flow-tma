import React from 'react';
import { Sparkles, MessageSquare, Plus, Search, MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';

const ProjectList = ({ projects, onSelectProject, onCreateProject, activeProjectId }) => {
  return (
    <div className="flex flex-col h-full bg-[#1c1c1d] border-r border-white/5 w-full md:max-w-xs shrink-0">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          Video Flow
        </h1>
        <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <Search size={20} className="text-tg-hint" />
        </button>
      </div>

      {/* Tabs / Filter */}
      <div className="flex px-4 gap-4 overflow-x-auto custom-scrollbar pb-2">
        <button className="text-sm font-medium text-tg-accent border-b-2 border-tg-accent pb-1 shrink-0">Все чаты</button>
        <button className="text-sm font-medium text-tg-hint pb-1 shrink-0">Проекты</button>
        <button className="text-sm font-medium text-tg-hint pb-1 shrink-0">Архив</button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {projects.map((project) => (
          <div 
            key={project.id}
            onClick={() => onSelectProject(project.id)}
            className={`tg-item ${activeProjectId === project.id ? 'bg-[#2b5278]' : ''}`}
          >
            <div className={`tg-avatar bg-gradient-to-br ${activeProjectId === project.id ? 'from-white/20 to-white/10' : 'from-tg-accent to-blue-600'}`}>
              {project.name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-0.5">
                <h3 className={`font-semibold truncate ${activeProjectId === project.id ? 'text-white' : 'text-tg-text'}`}>
                  {project.name}
                </h3>
                <span className="text-[10px] text-tg-hint shrink-0 ml-2">
                  {new Date(project.lastUpdate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-tg-hint truncate">
                {project.generations[0]?.prompt || 'Создайте сцену...'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onCreateProject}
        className="fixed bottom-6 right-6 md:absolute md:bottom-6 md:right-6 w-14 h-14 bg-tg-accent rounded-full shadow-lg flex items-center justify-center text-white z-20"
      >
        <Plus size={28} />
      </motion.button>
    </div>
  );
};

export default ProjectList;
