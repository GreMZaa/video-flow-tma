import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, ShieldCheck, Type, Palette, Monitor, Users, Volume2, ChevronDown, Sparkles } from 'lucide-react';

const SettingsModal = ({
  apiKey, setApiKey,
  onClose,
  projectName, setProjectName,
  characterPrompt, setCharacterPrompt,
  personCount, setPersonCount,
  aspectRatio, setAspectRatio,
  selectedVoice, setSelectedVoice,
  voiceOptions,
}) => {
  return (
    <AnimatePresence>
      {/* Overlay Container */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 300,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}>
        {/* Backdrop with extreme blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        />

        {/* Premium Glass Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="vibrant-glass-modal"
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 500,
            maxHeight: '92dvh',
            borderRadius: '32px 32px 0 0',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 10,
          }}
        >
          {/* Internal Mesh Background */}
          <div className="vibrant-mesh" />

          {/* Drag handle */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 14, paddingBottom: 6 }}>
            <div style={{ width: 40, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.2)' }} />
          </div>

          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 24px 20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--tg-accent) 0%, #a5b4fc 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(36, 129, 204, 0.3)'
              }}>
                <Sparkles size={18} color="white" />
              </div>
              <span className="premium-gradient-text" style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>
                Настройки
              </span>
            </div>
            <button
              onClick={onClose}
              className="ios-btn"
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: 'white',
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Scrollable body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 32px' }} className="custom-scrollbar">

            {/* ── Section: Основное ─────────────────────────────────────────── */}
            <SectionHeader icon={<Type size={16} />} title="Концепция проекта" />
            
            <div className="glass-card">
              <label style={labelStyle}>Название проекта</label>
              <input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Напр: Приключения в лесу"
                className="glass-input"
                style={{ width: '100%' }}
              />
            </div>

            <div className="glass-card">
              <label style={labelStyle}>Визуальный стиль (Prompt)</label>
              <textarea
                value={characterPrompt}
                onChange={(e) => setCharacterPrompt(e.target.value)}
                placeholder="Опишите стиль: claymation, cinematic, 3D render..."
                rows={3}
                className="glass-input"
                style={{ width: '100%', resize: 'none', lineHeight: 1.5, fontSize: 14 }}
              />
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 8, lineHeight: 1.4 }}>
                Этот промпт будет добавляться к каждой сцене для соблюдения единого стиля.
              </p>
            </div>

            {/* ── Section: Параметры ──────────────────────────────────── */}
            <SectionHeader icon={<Monitor size={16} />} title="Параметры видео" />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="glass-card" style={{ margin: 0 }}>
                <label style={labelStyle}>Формат</label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="glass-input"
                    style={{ appearance: 'none', WebkitAppearance: 'none', paddingRight: 32, fontSize: 14 }}
                  >
                    <option value="16:9">16:9 (HD)</option>
                    <option value="9:16">9:16 (Shorts)</option>
                    <option value="1:1">1:1 (Post)</option>
                  </select>
                  <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', pointerEvents: 'none' }} />
                </div>
              </div>

              <div className="glass-card" style={{ margin: 0 }}>
                <label style={labelStyle}>Персонажи</label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
                  <button
                    className="ios-btn"
                    onClick={() => setPersonCount(Math.max(1, parseInt(personCount) - 1))}
                    style={{ flex: 1, height: 44, background: 'none', border: 'none', color: 'white', fontSize: 20 }}
                  >−</button>
                  <span style={{ width: 30, textAlign: 'center', fontSize: 16, fontWeight: 700 }}>{personCount}</span>
                  <button
                    className="ios-btn"
                    onClick={() => setPersonCount(Math.min(10, parseInt(personCount) + 1))}
                    style={{ flex: 1, height: 44, background: 'none', border: 'none', color: 'white', fontSize: 20 }}
                  >+</button>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ marginTop: 12 }}>
              <label style={labelStyle}>Голос озвучки</label>
              <div style={{ position: 'relative' }}>
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="glass-input"
                  style={{ width: '100%', appearance: 'none', WebkitAppearance: 'none', paddingRight: 40 }}
                >
                  {voiceOptions.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
                <ChevronDown size={18} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', pointerEvents: 'none' }} />
              </div>
            </div>

            {/* ── Section: API ───────────────────────────────────────────── */}
            <SectionHeader icon={<Key size={16} />} title="Интеграция" />
            
            <div className="glass-card">
              <label style={labelStyle}>SiliconFlow API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="glass-input"
                style={{ width: '100%', fontFamily: 'monospace', fontSize: 14 }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, opacity: 0.6 }}>
                <ShieldCheck size={14} color="#4ade80" />
                <span style={{ fontSize: 12, color: 'white' }}>
                  Хранится безопасно в памяти устройства
                </span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div style={{
            padding: '20px 24px',
            paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
            background: 'rgba(0,0,0,0.2)',
            backdropFilter: 'blur(10px)',
            display: 'flex', gap: 12
          }}>
            <button
              onClick={onClose}
              className="ios-btn"
              style={{
                flex: 1,
                height: 54,
                background: 'linear-gradient(135deg, var(--tg-accent) 0%, #1e40af 100%)',
                color: 'white',
                border: 'none',
                borderRadius: 18,
                fontSize: 17,
                fontWeight: 700,
                boxShadow: '0 10px 25px -5px rgba(36, 129, 204, 0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}
            >
              Сохранить изменения
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// ── Internal Helpers ──────────────────────────────────────────────────────────

const SectionHeader = ({ icon, title }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '24px 4px 12px',
  }}>
    <span style={{ color: 'var(--tg-accent)', display: 'flex' }}>{icon}</span>
    <span style={{ fontSize: 13, fontWeight: 800, color: 'white', textTransform: 'uppercase', letterSpacing: 1, opacity: 0.9 }}>
      {title}
    </span>
  </div>
);

const labelStyle = {
  display: 'block',
  fontSize: 12,
  fontWeight: 700,
  color: 'rgba(255,255,255,0.4)',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  marginBottom: 10,
};

export default SettingsModal;
