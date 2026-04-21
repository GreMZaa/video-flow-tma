import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Download, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { stitchVideos } from '../services/api';
import { useTelegram } from '../hooks/useTelegram';

const VideoPreview = ({ isOpen, onClose, frames }) => {
  const [isStitching, setIsStitching] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressVal, setProgressVal] = useState(0);
  const [finalVideoUrl, setFinalVideoUrl] = useState(null);
  const { showHaptic, showAlert } = useTelegram();

  const generatedFrames = frames.filter(f => f.videoUrl);

  const handleStitch = async () => {
    if (generatedFrames.length === 0) {
      showAlert('No animated segments found to stitch.');
      return;
    }

    setIsStitching(true);
    showHaptic('heavy');
    
    try {
      const videoUrls = generatedFrames.map(f => f.videoUrl);
      const outputUrl = await stitchVideos(videoUrls, (msg, val) => {
        setProgressMsg(msg);
        setProgressVal(val);
      });
      
      setFinalVideoUrl(outputUrl);
      showHaptic('success');
    } catch (err) {
      console.error(err);
      showAlert('Failed to stitch videos. Ensure COOP/COEP headers are set.');
    } finally {
      setIsStitching(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex flex-col bg-tg-bg"
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between glass border-b border-white/5 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-tg-button" />
            <h3 className="font-bold tracking-tight">Final Sequence</h3>
          </div>
          <button onClick={onClose} className="p-2 glass rounded-full hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Player Area */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
          <div className="w-full max-w-lg space-y-8">
            
            {/* Visualizer / Final Video */}
            <div className="w-full aspect-video glass rounded-3xl overflow-hidden shadow-2xl relative bg-black/20 group">
              {finalVideoUrl ? (
                <video 
                  controls 
                  autoPlay
                  className="w-full h-full object-contain"
                >
                  <source src={finalVideoUrl} type="video/mp4" />
                </video>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                  {isStitching ? (
                    <div className="w-full max-w-xs space-y-4">
                      <div className="relative h-1 w-full bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          className="absolute inset-y-0 left-0 bg-tg-button"
                          initial={{ width: 0 }}
                          animate={{ width: `${progressVal}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="animate-spin text-tg-button" size={24} />
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-tg-button">
                          {progressMsg}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 opacity-40">
                      <Play size={48} className="mx-auto" />
                      <p className="text-sm font-medium">Ready to Assemble {generatedFrames.length} Segments</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="space-y-6">
              {!finalVideoUrl ? (
                <button 
                  onClick={handleStitch}
                  disabled={isStitching || generatedFrames.length === 0}
                  className="w-full btn-primary py-4 flex items-center justify-center gap-3 shadow-xl disabled:opacity-50"
                >
                  {isStitching ? <Loader2 className="animate-spin" /> : <Download size={20} />}
                  <span className="font-bold uppercase tracking-wider">
                    {isStitching ? 'Assembling...' : 'Export Final MP4'}
                  </span>
                </button>
              ) : (
                <div className="space-y-3">
                  <a 
                    href={finalVideoUrl} 
                    download="video-flow-export.mp4"
                    className="w-full btn-primary py-4 flex items-center justify-center gap-3 bg-green-600 border-none"
                  >
                    <Download size={20} />
                    <span className="font-bold tracking-wide">Download Result</span>
                  </a>
                  <button 
                    onClick={() => { setFinalVideoUrl(null); showHaptic('light'); }}
                    className="w-full py-3 glass rounded-2xl text-sm font-medium opacity-60 hover:opacity-100 transition-opacity"
                  >
                    Edit & Re-stitch
                  </button>
                </div>
              )}

              {/* Segment Breakdown */}
              <div className="glass rounded-3xl p-5 border border-white/5 bg-white/[0.02]">
                  <h4 className="text-[10px] uppercase font-bold text-tg-hint tracking-[0.2em] mb-4">Sequence Layout</h4>
                  <div className="space-y-4">
                    {generatedFrames.map((frame, i) => (
                      <div key={i} className="flex items-center gap-4 group">
                        <div className="relative">
                          <img src={frame.imageUrl} className="w-16 h-10 rounded-lg object-cover ring-1 ring-white/10" alt="" />
                          <div className="absolute -top-2 -left-2 w-5 h-5 bg-tg-button rounded-md flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
                            {i + 1}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate group-hover:text-tg-button transition-colors">
                            {frame.prompt || 'Animated Segment'}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                             <CheckCircle2 size={10} className="text-green-500" />
                             <span className="text-[10px] text-tg-hint uppercase font-bold tracking-tight">CogVideo 5B Optimized</span>
                          </div>
                        </div>
                        <ExternalLink size={14} className="text-tg-hint/30" />
                      </div>
                    ))}
                  </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VideoPreview;
