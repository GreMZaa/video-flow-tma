import { useState, useEffect } from 'react';

export const useProjectManager = () => {
  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem('vf_projects');
    if (saved) return JSON.parse(saved);
    
    // Legacy migration
    const oldName = localStorage.getItem('projectName');
    if (oldName) {
      return [{
        id: 'legacy-project',
        name: oldName,
        characterPrompt: localStorage.getItem('characterStyle') || 'Pushkin in claymation style',
        generations: [],
        lastUpdate: new Date().toISOString()
      }];
    }

    return [{
      id: 'first-project',
      name: 'Новый проект',
      characterPrompt: 'Cinematic studio animation style, high quality',
      generations: [],
      lastUpdate: new Date().toISOString()
    }];
  });

  const [activeProjectId, setActiveProjectId] = useState(
    localStorage.getItem('vf_activeProjectId') || (projects[0]?.id || null)
  );

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('vf_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    if (activeProjectId) localStorage.setItem('vf_activeProjectId', activeProjectId);
  }, [activeProjectId]);

  const updateActiveProject = (updates, moveToTop = false) => {
    setProjects(prev => {
      const activeProject = prev.find(p => p.id === activeProjectId);
      if (!activeProject) return prev;

      const newFields = typeof updates === 'function' ? updates(activeProject) : updates;
      const updatedProject = { ...activeProject, ...newFields, lastUpdate: new Date().toISOString() };
      
      if (moveToTop) {
        // Move updated project to top (for major changes like new generations or selection)
        const filtered = prev.filter(p => p.id !== activeProjectId);
        return [updatedProject, ...filtered];
      } else {
        // Keep current order (for simple edits like renaming)
        return prev.map(p => p.id === activeProjectId ? updatedProject : p);
      }
    });
  };

  const createProject = () => {
    const newId = Date.now().toString();
    const newProject = {
      id: newId,
      name: `Проект ${projects.length + 1}`,
      characterPrompt: 'Cinematic studio animation style',
      generations: [],
      lastUpdate: new Date().toISOString()
    };
    setProjects([newProject, ...projects]);
    setActiveProjectId(newId);
    return newId;
  };

  const deleteProject = (id) => {
    const newProjects = projects.filter(p => p.id !== id);
    setProjects(newProjects);
    if (activeProjectId === id) {
      setActiveProjectId(newProjects[0]?.id || null);
    }
  };

  const selectProject = (id) => {
    setActiveProjectId(id);
  };

  const renameProject = (id, name) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, name } : p));
  };

  return {
    projects,
    activeProject,
    activeProjectId,
    updateActiveProject,
    createProject,
    deleteProject,
    selectProject,
    renameProject
  };
};
