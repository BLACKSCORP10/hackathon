'use client';

import React, { useState, useEffect } from 'react';

interface VoiceNotePlayerProps {
  duration?: string;
  waveform?: number[];
}

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({
  duration = '0:42',
  waveform = [30, 50, 70, 40, 60, 80, 50, 30, 60, 70, 50, 80, 40, 60, 30, 50, 70, 40, 20],
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(6);
  const [speed, setSpeed] = useState<number>(1.5);

  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentProgress(prev => {
          if (prev >= waveform.length) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 400 / speed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, speed, waveform.length]);

  const toggleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (speed === 1) setSpeed(1.5);
    else if (speed === 1.5) setSpeed(2);
    else setSpeed(1);
  };

  return (
    <div className="bg-surface-container p-3 rounded-2xl rounded-tl-sm shadow-md w-full flex flex-col gap-2 border border-surface-container-highest/40">
      <div className="flex items-center gap-3">
        {/* Play / Pause Toggle */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          aria-label={isPlaying ? 'Pause voice message' : 'Play voice message'}
          className="w-11 h-11 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg active:scale-95 transition-transform flex-shrink-0"
        >
          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            {isPlaying ? 'pause' : 'play_arrow'}
          </span>
        </button>

        {/* Audio Bars & Scrubber */}
        <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
          <div
            className="h-8 flex items-center gap-[3px] py-1 cursor-pointer overflow-hidden"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const ratio = Math.max(0, Math.min(1, clickX / rect.width));
              setCurrentProgress(Math.floor(ratio * waveform.length));
            }}
          >
            {waveform.map((height, i) => {
              const isPast = i <= currentProgress;
              return (
                <div
                  key={i}
                  style={{ height: `${Math.max(12, height * 0.32)}px` }}
                  className={`w-1 rounded-full transition-colors duration-150 ${
                    isPast ? 'bg-primary' : 'bg-outline-variant/60'
                  }`}
                />
              );
            })}
          </div>

          {/* Time & Speed Metadata */}
          <div className="flex items-center justify-between text-on-surface-variant font-mono text-xs">
            <span>
              {isPlaying
                ? `0:${Math.min(42, Math.floor(currentProgress * 2.2)).toString().padStart(2, '0')} / ${duration}`
                : `0:14 / ${duration}`}
            </span>
            <button
              onClick={toggleSpeed}
              className="px-2 py-0.5 rounded-full bg-surface-container-high text-primary hover:bg-surface-bright font-label-sm text-xs transition-colors"
            >
              {speed}x
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
