import React, { useState, useEffect } from 'react';
import { useTelegram } from './hooks/useTelegram';
import CharacterBooth from './components/CharacterBooth';
import FrameCanvas from './components/FrameCanvas';
import SettingsModal from './components/SettingsModal';
import VideoPreview from './components/VideoPreview';
import { Settings, RefreshCw, Layers, Sparkles } from 'lucide-react';

function App() {
  const { tg, showHaptic } = useTelegram();
  
  // States from LocalStorage
  const [characterPrompt, setCharacterPrompt] = useState(
    localStorage.getItem('globalCharacterPrompt') || ''
  );
  const [apiKey, setApiKey] = useState(
    localStorage.getItem('SILICON_FLOW_KEY') || ''
  );
  
  // App state
  const [frames, setFrames] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [view, setView] = useState(characterPrompt ? 'canvas' : 'booth');

  // Persistence
  useEffect(() => {
    localStorage.setItem('globalCharacterPrompt', characterPrompt);
  }, [characterPrompt]);

  useEffect(() => {
    localStorage.setItem('SILICON_FLOW_KEY', apiKey);
  }, [apiKey]);

  const handleStart = (prompt) => {
    setCharacterPrompt(prompt);
    setView('canvas');
    showHaptic('success');
  };

  const handleReset = () => {
    if (window.confirm('Reset all progress and starting prompt?')) {
      setCharacterPrompt('');
      localStorage.removeItem('globalCharacterPrompt');
      setFrames([]);
      setView('booth');
      showHaptic('medium');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-tg-bg text-tg-text p-4 pb-24 font-sans select-none overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-gradient-to-b from-transparent to-black/20" />
      <div className="fixed top-[-10%] right-[-10%] w-[300px] h-[300px] bg-tg-button/10 blur-[100px] rounded-full pointer-events-none -z-10 animate-pulse" />

      {/* Modern Header */}
      <header className="flex items-center justify-between mb-8 sticky top-0 bg-tg-bg/60 backdrop-blur-xl z-20 py-3 -mx-4 px-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-tg-button/20 flex items-center justify-center border border-tg-button/30 shadow-[0_0_15px_rgba(56,189,248,0.15)]">
             <Layers className="text-tg-button" size={20} />
          </div>
          <div>
            <h1 className="font-bold tracking-tight text-lg leading-tight">Video Flow</h1>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
              <span className="text-[10px] text-tg-hint uppercase font-bold tracking-wider">AI Engine Online</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2.5">
          {view === 'canvas' && (
            <button 
              onClick={handleReset}
              className="p-2.5 rounded-xl glass hover:bg-red-500/10 hover:text-red-400 transition-all border border-white/5"
            >
              <RefreshCw size={20} />
            </button>
          )}
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 rounded-xl glass hover:bg-tg-button/10 hover:text-tg-button transition-all border border-white/5"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-lg mx-auto z-10">
        {view === 'booth' ? (
          <CharacterBooth onStart={handleStart} initialValue={characterPrompt} />
        ) : (
          <FrameCanvas 
            characterPrompt={characterPrompt} 
            frames={frames} 
            setFrames={setFrames}
            apiKey={apiKey}
            onPreview={() => setIsPreviewOpen(true)}
          />
        )}
      </main>

      {/* Modals & Overlays */}
      {isSettingsOpen && (
        <SettingsModal 
          apiKey={apiKey} 
          setApiKey={setApiKey} 
          onClose={() => setIsSettingsOpen(false)} 
        />
      )}

      {isPreviewOpen && (
        <VideoPreview 
          isOpen={isPreviewOpen} 
          onClose={() => setIsPreviewOpen(false)} 
          frames={frames} 
        />
      )}

      {/* Flow Indicator (Floating Status) */}
      {view === 'canvas' && frames.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 glass px-4 py-2 rounded-full border border-tg-button/20 shadow-lg flex items-center gap-2 z-30 pointer-events-none">
          <Sparkles size={14} className="text-tg-button" />
          <span className="text-[10px] uppercase font-bold tracking-widest text-tg-button">
            {frames.length} Segments Active
          </span>
        </div>
      )}
    </div>
  );
}

export default App;
