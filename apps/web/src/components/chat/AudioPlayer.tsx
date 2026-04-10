'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, AlertCircle } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function AudioPlayer({ src }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => setDuration(audio.duration);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onEnded = () => setPlaying(false);
    const onError = () => setError(true);

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying(!playing);
  }, [playing]);

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const audio = audioRef.current;
      if (!audio || !duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      audio.currentTime = pct * duration;
      setCurrentTime(pct * duration);
    },
    [duration],
  );

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (error) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-xl">
        <AlertCircle size={16} className="text-gray-600" />
        <span className="text-xs text-gray-500">Audio unavailable</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 min-w-[200px] max-w-[280px]">
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play/Pause button */}
      <button
        onClick={togglePlay}
        className="w-9 h-9 rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center shrink-0 transition-colors"
      >
        {playing ? (
          <Pause size={14} className="text-white" />
        ) : (
          <Play size={14} className="text-white ml-0.5" />
        )}
      </button>

      {/* Track + time */}
      <div className="flex-1 min-w-0">
        {/* Progress bar */}
        <div
          className="h-1.5 bg-gray-700 rounded-full cursor-pointer relative group"
          onClick={handleSeek}
        >
          <div
            className="absolute inset-y-0 left-0 bg-purple-500 rounded-full transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `${progress}%`, marginLeft: '-6px' }}
          />
        </div>

        {/* Time labels */}
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-gray-500">
            {formatTime(currentTime)}
          </span>
          <span className="text-[10px] text-gray-500">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Volume icon */}
      <Volume2 size={14} className="text-gray-600 shrink-0" />
    </div>
  );
}
