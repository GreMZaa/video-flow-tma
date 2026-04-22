import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, ShieldCheck, Type, Palette, Monitor, Users, Volume2, ChevronDown } from 'lucide-react';

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
      {/* Overlay */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 300,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        />

        {/* Sheet — slides up from bottom like native iOS */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 320 }}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 480,
            maxHeight: '90dvh',
            background: '#17212b',
            borderRadius: '20px 20px 0 0',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 -12px 60px rgba(0,0,0,0.6)',
            zIndex: 10,
          }}
        >
          {/* Drag handle */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
          </div>

          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 20px 16px',
            borderBottom: '0.5px solid rgba(255,255,255,0.06)',
          }}>
            <span style={{ fontSize: 17, fontWeight: 700, color: 'white', letterSpacing: -0.3 }}>
              Настройки проекта
            </span>
            <button
              onClick={onClose}
              className="ios-btn"
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
                border: 'none', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: 'rgba(255,255,255,0.5)',
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Scrollable body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0 24px' }} className="custom-scrollbar">

            {/* ── Section: Общие ─────────────────────────────────────────── */}
            <SectionHeader icon={<Type size={14} />} title="Общие" />
            <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <SettingsRow label="Название проекта">
                <input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Имя проекта..."
                  style={inputStyle}
                />
              </SettingsRow>
              <SettingsRow label="Стиль сцен (Character Prompt)">
                <textarea
                  value={characterPrompt}
                  onChange={(e) => setCharacterPrompt(e.target.value)}
                  placeholder="Напр: claymation style, warm lighting..."
                  rows={3}
                  style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
                />
              </SettingsRow>
            </div>

            {/* ── Section: Производство ──────────────────────────────────── */}
            <SectionHeader icon={<Monitor size={14} />} title="Производство" />
            <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <SettingsRow label="Формат видео">
                <div style={{ position: 'relative' }}>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    style={{ ...inputStyle, appearance: 'none', WebkitAppearance: 'none', paddingRight: 40, cursor: 'pointer' }}
                  >
                    <option value="16:9">Горизонтальный (16:9)</option>
                    <option value="9:16">Вертикальный (9:16)</option>
                    <option value="1:1">Квадратный (1:1)</option>
                  </select>
                  <ChevronDown size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                </div>
              </SettingsRow>

              <SettingsRow label="Количество персонажей">
                {/* Stepper */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: 'rgba(255,255,255,0.05)', borderRadius: 12, overflow: 'hidden', border: '0.5px solid rgba(255,255,255,0.08)' }}>
                  <button
                    className="ios-btn"
                    onClick={() => setPersonCount(Math.max(1, parseInt(personCount) - 1))}
                    style={{ width: 44, height: 44, background: 'none', border: 'none', color: 'var(--tg-accent)', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >−</button>
                  <span style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: 600, color: 'white' }}>{personCount}</span>
                  <button
                    className="ios-btn"
                    onClick={() => setPersonCount(Math.min(10, parseInt(personCount) + 1))}
                    style={{ width: 44, height: 44, background: 'none', border: 'none', color: 'var(--tg-accent)', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >+</button>
                </div>
              </SettingsRow>

              <SettingsRow label="Голос диктора (TTS)">
                <div style={{ position: 'relative' }}>
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    style={{ ...inputStyle, appearance: 'none', WebkitAppearance: 'none', paddingRight: 40, cursor: 'pointer' }}
                  >
                    {voiceOptions.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                </div>
              </SettingsRow>
            </div>

            {/* ── Section: API ───────────────────────────────────────────── */}
            <SectionHeader icon={<Key size={14} />} title="Дополнительно" />
            <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <SettingsRow label="API ключ SiliconFlow">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 13, letterSpacing: 0.5 }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, paddingLeft: 2 }}>
                  <ShieldCheck size={12} color="#34c759" />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 1.4 }}>
                    Ключ хранится только локально на вашем устройстве
                  </span>
                </div>
              </SettingsRow>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: '12px 16px',
            paddingBottom: 'env(safe-area-inset-bottom, 16px)',
            borderTop: '0.5px solid rgba(255,255,255,0.06)',
            background: '#17212b',
          }}>
            <button
              onClick={onClose}
              className="ios-btn"
              style={{
                width: '100%',
                height: 50,
                background: 'var(--tg-accent)',
                color: 'white',
                border: 'none',
                borderRadius: 14,
                fontSize: 16,
                fontWeight: 600,
                letterSpacing: -0.3,
                boxShadow: '0 8px 24px rgba(36,129,204,0.35)',
              }}
            >
              Применить
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const SectionHeader = ({ icon, title }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '20px 20px 8px',
  }}>
    <span style={{ color: 'var(--tg-accent)', display: 'flex' }}>{icon}</span>
    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--tg-hint)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
      {title}
    </span>
  </div>
);

const SettingsRow = ({ label, children }) => (
  <div style={{
    background: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: '12px 14px',
    border: '0.5px solid rgba(255,255,255,0.05)',
    marginBottom: 8,
  }}>
    <label style={{
      display: 'block',
      fontSize: 11,
      fontWeight: 600,
      color: 'var(--tg-hint)',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 8,
    }}>
      {label}
    </label>
    {children}
  </div>
);

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.06)',
  border: '0.5px solid rgba(255,255,255,0.08)',
  borderRadius: 10,
  padding: '10px 12px',
  color: 'white',
  fontSize: 15,
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
};

export default SettingsModal;
