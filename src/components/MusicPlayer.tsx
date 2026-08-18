import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Music, X } from 'lucide-react';

interface MusicPlayerProps {
  currentTrackName?: string;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({
  currentTrackName = "Modern Arabic Poetry - An-Nabighah Recitation (Course-405)",
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(42);
  const [isMuted, setIsMuted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = (currentTime / duration) * 100;

  if (!isVisible) return null;

  return (
    <div
      id="music-player"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed bottom-4 left-4 z-40 max-w-sm w-[calc(100%-2rem)] sm:w-80 bg-gray-900/95 backdrop-blur-md border border-emerald-500/40 rounded-2xl p-3.5 shadow-2xl transition-all duration-300 no-print"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Music className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="text-xs font-semibold text-white truncate">
              {currentTrackName}
            </div>
            <div className="text-[10px] text-emerald-400 font-mono">
              Academic Audio Guide
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white p-1"
          title="Dismiss player"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Scrubber */}
      <div className="relative w-full bg-gray-800 rounded-full h-1.5 overflow-hidden mb-2 cursor-pointer">
        <div
          className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
        <span>{formatTime(currentTime)}</span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-7 h-7 rounded-full bg-emerald-500 hover:bg-emerald-600 active:scale-90 text-white flex items-center justify-center transition shadow-md shadow-emerald-500/30"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className="text-gray-400 hover:text-emerald-400 transition"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
};
