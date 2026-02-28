import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, MapPin, Play, Pause, RotateCcw, Loader2 } from 'lucide-react';
import { analyzePhoto } from './services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';

type AppState = 'idle' | 'analyzing' | 'result';

interface ResultData {
  imageSrc: string;
  landmark: string;
  history: string;
  audioBase64: string | null;
}

export default function App() {
  const [appState, setAppState] = useState<AppState>('idle');
  const [result, setResult] = useState<ResultData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (result?.audioBase64) {
      const audio = new Audio(`data:audio/mp3;base64,${result.audioBase64}`);
      audio.addEventListener('ended', () => setIsPlaying(false));
      audioRef.current = audio;
      // Auto play
      audio.play().then(() => setIsPlaying(true)).catch(e => console.log("Autoplay prevented", e));
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [result]);

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setAppState('analyzing');

    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        // Extract base64 data and mime type
        const match = base64String.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
        if (!match) {
          throw new Error("Invalid image format");
        }
        const mimeType = match[1];
        const base64Data = match[2];

        try {
          const analysis = await analyzePhoto(base64Data, mimeType);
          setResult({
            imageSrc: base64String,
            landmark: analysis.landmark,
            history: analysis.history,
            audioBase64: analysis.audioBase64
          });
          setAppState('result');
        } catch (err: any) {
          console.error(err);
          setError(err.message || "Failed to analyze photo");
          setAppState('idle');
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || "Failed to process image");
      setAppState('idle');
    }
  };

  const resetApp = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setResult(null);
    setAppState('idle');
    setError(null);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-black text-white overflow-hidden font-sans">
      <AnimatePresence mode="wait">
        {appState === 'idle' && (
          <motion.div 
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-zinc-950"
          >
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
               <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px]" />
               <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/20 rounded-full blur-[100px]" />
            </div>

            <div className="z-10 flex flex-col items-center text-center max-w-md">
              <div className="w-20 h-20 mb-8 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-xl shadow-2xl">
                <MapPin className="w-10 h-10 text-white/80" />
              </div>
              <h1 className="text-5xl font-serif italic mb-4 tracking-tight">cookie.io</h1>
              <p className="text-zinc-400 mb-12 text-lg font-light">
                Snap a photo of any landmark to uncover its history with an immersive audio guide.
              </p>

              {error && (
                <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm w-full">
                  {error}
                </div>
              )}

              <div className="flex flex-col w-full gap-4">
                <button 
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full py-4 px-6 bg-white text-black rounded-full font-medium flex items-center justify-center gap-3 hover:bg-zinc-200 transition-colors"
                >
                  <Camera className="w-5 h-5" />
                  Take Photo
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 px-6 bg-white/10 text-white rounded-full font-medium flex items-center justify-center gap-3 hover:bg-white/20 transition-colors border border-white/5"
                >
                  <Upload className="w-5 h-5" />
                  Upload Image
                </button>
              </div>

              <input 
                type="file" 
                accept="image/*" 
                capture="environment"
                className="hidden" 
                ref={cameraInputRef}
                onChange={handleFileSelect}
              />
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileSelect}
              />
            </div>
          </motion.div>
        )}

        {appState === 'analyzing' && (
          <motion.div 
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 z-20"
          >
            <Loader2 className="w-12 h-12 text-white/50 animate-spin mb-6" />
            <h2 className="text-2xl font-serif italic mb-2">Analyzing Landmark...</h2>
            <p className="text-zinc-500 text-sm">Identifying location and fetching history</p>
          </motion.div>
        )}

        {appState === 'result' && result && (
          <motion.div 
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col bg-black"
          >
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              <img 
                src={result.imageSrc} 
                alt="Landmark" 
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex-1 p-6 flex flex-col justify-end pb-32">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium uppercase tracking-widest mb-4">
                    <MapPin className="w-3 h-3" />
                    Location Identified
                  </div>
                  <h2 className="text-4xl md:text-5xl font-serif italic mb-6 text-shadow leading-tight">
                    {result.landmark}
                  </h2>
                  
                  <div className="prose prose-invert prose-sm max-w-none text-zinc-300 leading-relaxed max-h-[40vh] overflow-y-auto pr-4 custom-scrollbar">
                    <ReactMarkdown>{result.history}</ReactMarkdown>
                  </div>
                </motion.div>
              </div>

              {/* Bottom AR Controls */}
              <motion.div 
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="absolute bottom-0 left-0 right-0 p-6 glass-panel flex items-center justify-between gap-4"
              >
                <button 
                  onClick={resetApp}
                  className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors shrink-0"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>

                {result.audioBase64 ? (
                  <button 
                    onClick={toggleAudio}
                    className="flex-1 h-14 rounded-full bg-white text-black flex items-center justify-center gap-3 font-medium hover:bg-zinc-200 transition-colors"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    {isPlaying ? 'Pause Guide' : 'Play Audio Guide'}
                  </button>
                ) : (
                  <div className="flex-1 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 text-sm">
                    Audio unavailable
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
