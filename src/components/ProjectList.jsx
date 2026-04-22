import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MessageCircle, Trash2, User, Settings } from 'lucide-react';

const ProjectList = ({ projects, onSelectProject, onDeleteProject, activeProjectId, isEditMode }) => {
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
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return date.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'вчера';
    if (diffDays < 7) return date.toLocaleDateString('ru', { weekday: 'short' });
    return date.toLocaleDateString('ru', { day: 'numeric', month: 'short' });
  };

  const FILTERS = [
    { id: 'all', label: 'Все' },
    { id: 'draft', label: 'Черновики' },
    { id: 'ready', label: 'Готовые' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--tg-bg)', overflow: 'hidden' }}>

      {/* Search Bar */}
      <div style={{ padding: '8px 12px 4px', flexShrink: 0 }}>
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 12,
          display: 'flex', alignItems: 'center',
          padding: '7px 12px', gap: 8
        }}>
          <Search size={15} color="var(--tg-hint)" style={{ flexShrink: 0 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Поиск по проектам"
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              color: 'white', fontSize: 15, flex: 1,
            }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ color: 'var(--tg-hint)', fontSize: 18, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>×</button>
          )}
        </div>
      </div>

      {/* Filter Pills */}
      <div style={{
        display: 'flex', gap: 8, padding: '6px 12px',
        overflowX: 'auto', flexShrink: 0,
        borderBottom: '0.5px solid rgba(255,255,255,0.06)'
      }}>
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            style={{
              flexShrink: 0,
              padding: '5px 14px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              background: activeFilter === f.id ? 'var(--tg-accent)' : 'rgba(255,255,255,0.08)',
              color: activeFilter === f.id ? 'white' : 'var(--tg-hint)',
              transition: 'all 0.2s',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Project Items */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }} className="custom-scrollbar">
        {filteredProjects.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '60%',
            opacity: 0.3, textAlign: 'center', padding: '0 32px', gap: 12
          }}>
            <MessageCircle size={52} strokeWidth={1} />
            <p style={{ fontWeight: 500, margin: 0 }}>
              {searchQuery ? 'Ничего не найдено' : 'Список проектов пуст'}
            </p>
            {!searchQuery && (
              <p style={{ fontSize: 14, color: 'var(--tg-hint)', margin: 0 }}>
                Нажмите + в шапке, чтобы создать первый проект
              </p>
            )}
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {filteredProjects.map((project) => {
              const isActive = activeProjectId === project.id;
              const lastGen = project.generations?.[project.generations.length - 1];
              const draftCount = project.generations?.filter(g => g.status === 'draft').length || 0;
              const avatarColor = ['#4d80c8', '#5856d6', '#34c759', '#ff9500', '#ff3b30', '#af52de'];
              const colorIdx = project.name.charCodeAt(0) % avatarColor.length;

              return (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                  transition={{ duration: 0.2 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    borderBottom: '0.5px solid rgba(255,255,255,0.04)',
                    background: isActive ? 'rgba(255,255,255,0.04)' : 'transparent',
                    cursor: 'pointer',
                  }}
                  onClick={() => !isEditMode && onSelectProject(project.id)}
                >
                  {/* Edit Mode: Delete button (red minus, iOS-style) */}
                  <AnimatePresence>
                    {isEditMode && (
                      <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 56, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden', flexShrink: 0, display: 'flex', justifyContent: 'center' }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Удалить проект "${project.name}"?`)) {
                              onDeleteProject(project.id);
                            }
                          }}
                          style={{
                            width: 28, height: 28, borderRadius: '50%',
                            background: '#ff3b30', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          <Trash2 size={13} color="white" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Project Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px 10px 14px', flex: 1, minWidth: 0 }}>
                    {/* Avatar */}
                    <div style={{
                      width: 52, height: 52, borderRadius: '50%',
                      background: `linear-gradient(135deg, ${avatarColor[colorIdx]}, ${avatarColor[(colorIdx + 1) % avatarColor.length]})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 700, fontSize: 20,
                      flexShrink: 0, userSelect: 'none',
                      position: 'relative'
                    }}>
                      {project.name?.[0]?.toUpperCase() || 'П'}
                      {draftCount > 0 && (
                        <div style={{
                          position: 'absolute', bottom: 0, right: 0,
                          width: 14, height: 14, borderRadius: '50%',
                          background: 'var(--tg-accent)', border: '2px solid var(--tg-bg)'
                        }} />
                      )}
                    </div>

                    {/* Text info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 8 }}>
                          {project.name}
                        </h3>
                        <span style={{ fontSize: 12, color: 'var(--tg-hint)', flexShrink: 0 }}>
                          {formatTime(project.lastUpdate)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{
                          margin: 0, fontSize: 14, color: 'var(--tg-hint)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          flex: 1, lineHeight: '18px'
                        }}>
                          {lastGen
                            ? (lastGen.prompt?.slice(0, 45) || lastGen.sceneName || 'Нет описания')
                            : 'Нет кадров'}
                        </p>
                        {draftCount > 0 && (
                          <div style={{
                            background: 'var(--tg-accent)', color: 'white',
                            fontSize: 11, fontWeight: 700,
                            padding: '2px 7px', borderRadius: 10,
                            minWidth: 20, textAlign: 'center',
                            marginLeft: 8, flexShrink: 0
                          }}>
                            {draftCount}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="glass-nav" style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 72, display: 'flex', alignItems: 'center',
        justifyContent: 'space-around',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        zIndex: 20
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, opacity: 0.35, cursor: 'not-allowed' }}>
          <User size={23} strokeWidth={1.5} />
          <span style={{ fontSize: 10, fontWeight: 500 }}>Контакты</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, color: 'var(--tg-accent)', position: 'relative' }}>
          <MessageCircle size={23} strokeWidth={2} fill="currentColor" />
          <span style={{ fontSize: 10, fontWeight: 500 }}>Проекты</span>
          {projects.length > 0 && (
            <div style={{
              position: 'absolute', top: -4, right: -8,
              background: '#ff3b30', color: 'white',
              fontSize: 10, fontWeight: 700,
              padding: '1px 5px', borderRadius: 10,
              border: '2px solid var(--tg-bg)',
              minWidth: 18, textAlign: 'center', lineHeight: '14px'
            }}>
              {projects.length}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, opacity: 0.35, cursor: 'not-allowed' }}>
          <Settings size={23} strokeWidth={1.5} />
          <span style={{ fontSize: 10, fontWeight: 500 }}>Настройки</span>
        </div>
      </div>
    </div>
  );
};

export default ProjectList;
