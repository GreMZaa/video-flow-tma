import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MessageCircle, Trash2, User, Settings, CheckCircle2, ChevronRight, MoreVertical, Clock, Plus, Edit3, Filter } from 'lucide-react';

const ProjectList = ({ 
  projects, onSelectProject, onDeleteProject, onNewProject,
  activeProjectId, isEditMode, setIsEditMode, showConfirm,
  onOpenSettings, onShowContacts
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  // Sort by most recently updated
  const sortedProjects = [...projects].sort((a, b) =>
    new Date(b.lastUpdate) - new Date(a.lastUpdate)
  );

  const filteredProjects = sortedProjects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) return date.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'вчера';
    
    if (now - date < 7 * 24 * 60 * 60 * 1000) return date.toLocaleDateString('ru', { weekday: 'short' });
    return date.toLocaleDateString('ru', { day: 'numeric', month: 'short' });
  };

  const FILTERS = [
    { id: 'all', label: 'Все' },
    { id: 'drafts', label: 'Черновики' },
    { id: 'ready', label: 'Готовые' },
  ];

  const AVATAR_GRADIENTS = [
    'linear-gradient(180deg, #ff885e 0%, #ff516a 100%)', // Red
    'linear-gradient(180deg, #ffcd00 0%, #ffae00 100%)', // Orange
    'linear-gradient(180deg, #3ef033 0%, #22c423 100%)', // Green
    'linear-gradient(180deg, #55eaff 0%, #00a7ff 100%)', // Blue
    'linear-gradient(180deg, #a288ff 0%, #7245ff 100%)', // Purple
    'linear-gradient(180deg, #ff8ae2 0%, #ff52be 100%)', // Pink
  ];

  const getAvatarGradient = (name) => {
    const code = (name || 'P').charCodeAt(0);
    return AVATAR_GRADIENTS[code % AVATAR_GRADIENTS.length];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--tg-bg)', overflow: 'hidden', position: 'relative' }}>
      
      {/* Telegram Style Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px', paddingTop: 'env(safe-area-inset-top, 12px)',
        height: 60, flexShrink: 0
      }}>
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className="ios-btn"
          style={{
            color: isEditMode ? '#ff3b30' : 'var(--tg-accent)',
            fontSize: 17, fontWeight: 400,
            background: 'none', border: 'none', padding: 0
          }}
        >
          {isEditMode ? 'Готово' : 'Изм.'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', position: 'relative', width: 34, height: 24 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#444', border: '2px solid black', position: 'absolute', left: 0, zIndex: 3 }} />
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#666', border: '2px solid black', position: 'absolute', left: 10, zIndex: 2 }} />
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#888', border: '2px solid black', position: 'absolute', left: 20, zIndex: 1 }} />
          </div>
          <span style={{ fontWeight: 600, fontSize: 17, color: 'white' }}>Чаты</span>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <button 
            onClick={onNewProject}
            style={{ background: 'none', border: 'none', color: 'var(--tg-accent)', padding: 0, cursor: 'pointer' }}
          >
            <Plus size={24} />
          </button>
          <button 
            onClick={() => setIsEditMode(!isEditMode)}
            style={{ background: 'none', border: 'none', color: 'var(--tg-accent)', padding: 0, cursor: 'pointer' }}
          >
            <Edit3 size={22} />
          </button>
        </div>
      </div>

      {/* Search Bar (iOS Style) */}
      {!isEditMode && (
        <div style={{ padding: '4px 12px 10px', flexShrink: 0 }}>
          <div style={{
            background: '#242426',
            borderRadius: 12,
            display: 'flex', alignItems: 'center',
            padding: '8px 12px', gap: 8,
            boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.05)'
          }}>
            <Search size={18} color="#8e8e93" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Поиск сообщений"
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                color: 'white', fontSize: 17, flex: 1,
                padding: 0,
                letterSpacing: '-0.4px',
                fontFamily: 'inherit'
              }}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')} 
                style={{ 
                  color: '#8e8e93', 
                  background: 'rgba(255,255,255,0.15)', 
                  border: 'none', borderRadius: '50%',
                  width: 18, height: 18, fontSize: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: 0, marginRight: -2
                }}
              >×</button>
            )}
          </div>
        </div>
      )}

      {/* Filter Tabs (Telegram Style) */}
      {!isEditMode && (
        <div style={{
          display: 'flex', 
          padding: '0 8px',
          overflowX: 'auto',
          background: 'var(--tg-bg)',
          zIndex: 10
        }} className="no-scrollbar">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              style={{
                padding: '8px 12px',
                fontSize: 14,
                fontWeight: 600,
                border: 'none',
                background: activeFilter === f.id ? 'rgba(255,255,255,0.1)' : 'none',
                color: activeFilter === f.id ? 'white' : 'var(--tg-hint)',
                borderRadius: 10,
                margin: '4px 4px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
            >
              {f.label}
              {f.id === 'ready' && projects.filter(p => p.generations?.some(g => g.status === 'ready')).length > 0 && (
                <span style={{ 
                  background: 'var(--tg-accent)', color: 'white', 
                  fontSize: 10, borderRadius: 10, padding: '0 6px', height: 16,
                  display: 'flex', alignItems: 'center'
                }}>
                  {projects.filter(p => p.generations?.some(g => g.status === 'ready')).length}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Project Items */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }} className="custom-scrollbar">
        {filteredProjects.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '60%',
            opacity: 0.3, textAlign: 'center', padding: '0 40px', gap: 16
          }}>
            <div style={{ 
              width: 100, height: 100, borderRadius: '50%', 
              background: 'rgba(255,255,255,0.03)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>
              <MessageCircle size={48} strokeWidth={1} />
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: 18, margin: '0 0 4px' }}>
                {searchQuery ? 'Ничего не найдено' : 'Нет чатов'}
              </p>
              <p style={{ fontSize: 14, color: 'var(--tg-hint)', margin: 0, lineHeight: 1.4 }}>
                {searchQuery ? 'Попробуйте изменить запрос' : 'Создайте новый проект кнопкой + вверху'}
              </p>
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {filteredProjects.map((project, idx) => {
              const isActive = activeProjectId === project.id;
              const lastGen = project.generations?.[project.generations.length - 1];
              const draftCount = project.generations?.filter(g => g.status === 'draft').length || 0;
              const isProcessing = project.generations?.some(g => !['ready', 'draft', 'error'].includes(g.status));
              
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: isActive && !isEditMode ? 'rgba(80, 162, 233, 0.12)' : 'transparent',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onClick={() => !isEditMode && onSelectProject(project.id)}
                >
                  <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%',
                      padding: '10px 16px',
                      position: 'relative'
                    }}>
                    
                    {/* Delete Icon (Edit Mode) */}
                    <AnimatePresence>
                      {isEditMode && (
                        <motion.div
                          initial={{ width: 0, opacity: 0, marginRight: 0 }}
                          animate={{ width: 36, opacity: 1, marginRight: 12 }}
                          exit={{ width: 0, opacity: 0, marginRight: 0 }}
                          style={{ overflow: 'hidden', flexShrink: 0 }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              showConfirm(`Удалить проект "${project.name}"?`, (ok) => {
                                if (ok) onDeleteProject(project.id);
                              });
                            }}
                            style={{
                              width: 24, height: 24, borderRadius: '50%',
                              background: '#FF3B30', border: 'none', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              padding: 0
                            }}
                          >
                            <div style={{ width: 12, height: 2, background: 'white', borderRadius: 1 }} />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Avatar */}
                    <div style={{
                      width: 54, height: 54, borderRadius: '50%',
                      background: getAvatarGradient(project.name),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 600, fontSize: 20,
                      flexShrink: 0, userSelect: 'none',
                      boxShadow: 'inset 0 0 1px rgba(255,255,255,0.2)'
                    }}>
                      {project.name?.[0]?.toUpperCase() || 'П'}
                    </div>

                    {/* Content */}
                    <div style={{
                      flex: 1,
                      minWidth: 0,
                      marginLeft: 12,
                      paddingRight: 14,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      height: 54,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                        <span style={{ 
                          fontSize: 16, fontWeight: 600, color: 'white',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          letterSpacing: '-0.3px'
                        }}>
                          {project.name}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                          {!isEditMode && lastGen?.status === 'ready' && (
                            <div style={{ display: 'flex', color: 'var(--tg-accent)' }}>
                              <CheckCircle2 size={15} style={{ strokeWidth: 2.5 }} />
                            </div>
                          )}
                          <span style={{ fontSize: 14, color: '#8e8e93', fontWeight: 400 }}>
                            {formatTime(project.lastUpdate)}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {isProcessing ? (
                            <span style={{ fontSize: 15, color: 'var(--tg-accent)', display: 'flex', alignItems: 'center', gap: 4 }}>
                              генерирует
                              <span className="typing-container">
                                <span className="typing-dot" />
                                <span className="typing-dot" />
                                <span className="typing-dot" />
                              </span>
                            </span>
                          ) : (
                            <p style={{
                              margin: 0, fontSize: 15, color: '#8e8e93',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              lineHeight: '1.2', letterSpacing: '-0.2px'
                            }}>
                              {lastGen
                                ? (lastGen.status === 'ready' ? `🎬 ${lastGen.prompt}` : `📝 ${lastGen.sceneName || 'Черновик'}`)
                                : 'Нет сообщений'}
                            </p>
                          )}
                        </div>
                        
                        {draftCount > 0 && !isEditMode && (
                          <div style={{
                            background: '#3390ec', color: 'white',
                            fontSize: 13, fontWeight: 600,
                            height: 20, minWidth: 20, padding: '0 7px',
                            borderRadius: 10, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', marginLeft: 8, flexShrink: 0
                          }}>
                            {draftCount}
                          </div>
                        )}

                        {isEditMode && (
                          <div style={{ color: '#8e8e93', marginLeft: 8 }}>
                            <Filter size={18} />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Bottom Border */}
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      left: 82, // Alignment with text
                      height: 0.5,
                      background: 'rgba(255,255,255,0.08)'
                    }} />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Bottom Bar (Telegram Native Style) */}
      <div className="glass-nav" style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 84, display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-around',
        paddingTop: 6,
        paddingBottom: 'env(safe-area-inset-bottom, 8px)',
        zIndex: 100
      }}>
        <div 
          onClick={onShowContacts}
          className="ios-btn"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: 72 }}
        >
          <User size={28} strokeWidth={1.5} style={{ opacity: 0.6 }} />
          <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.6 }}>Контакты</span>
        </div>
        <div 
          onClick={() => !isEditMode && onSelectProject(activeProjectId)}
          className="ios-btn"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, color: 'var(--tg-accent)', width: 72 }}
        >
          <div style={{ position: 'relative' }}>
            <MessageCircle size={28} strokeWidth={1.5} fill="currentColor" />
            {projects.length > 0 && (
              <div style={{
                position: 'absolute', top: -2, right: -10,
                background: '#ff3b30', color: 'white',
                fontSize: 10, fontWeight: 700,
                padding: '0px 5px', borderRadius: 10,
                border: '2px solid black',
                minWidth: 18, textAlign: 'center'
              }}>
                {projects.length}
              </div>
            )}
          </div>
          <span style={{ fontSize: 10, fontWeight: 500 }}>Чаты</span>
        </div>
        <div 
          onClick={onOpenSettings}
          className="ios-btn"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: 72 }}
        >
          <Settings size={28} strokeWidth={1.5} style={{ opacity: 0.6 }} />
          <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.6 }}>Настройки</span>
        </div>
      </div>
    </div>
  );
};

export default ProjectList;
