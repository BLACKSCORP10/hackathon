'use client';

import React, { useState, useEffect, useRef } from 'react';

interface VoiceNotePlayerProps {
  mediaUrl?: string;
  duration?: string;
  waveform?: number[];
}

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({
  mediaUrl,
  duration = '0:15',
  waveform = [30, 50, 70, 40, 60, 80, 50, 30, 60, 70, 50, 80, 40, 60, 30, 50, 70, 40, 20],
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [speed, setSpeed] = useState<number>(1.0);
  const [currentTimeFormatted, setCurrentTimeFormatted] = useState('0:00');
  const [totalDurationFormatted, setTotalDurationFormatted] = useState(duration);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (mediaUrl) {
      const audio = new Audio(mediaUrl);
      audioRef.current = audio;

      audio.onloadedmetadata = () => {
        if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
          const m = Math.floor(audio.duration / 60);
          const s = Math.floor(audio.duration % 60);
          setTotalDurationFormatted(`${m}:${s < 10 ? '0' : ''}${s}`);
        }
      };

      audio.ontimeupdate = () => {
        if (audio.duration && !isNaN(audio.duration)) {
          const m = Math.floor(audio.currentTime / 60);
          const s = Math.floor(audio.currentTime % 60);
          setCurrentTimeFormatted(`${m}:${s < 10 ? '0' : ''}${s}`);
          const ratio = audio.currentTime / audio.duration;
          setCurrentProgress(Math.floor(ratio * waveform.length));
        }
      };

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentProgress(0);
        setCurrentTimeFormatted('0:00');
      };

      return () => {
        audio.pause();
        audio.src = '';
      };
    }
  }, [mediaUrl, waveform.length]);

  // Handle Play / Pause
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.playbackRate = speed;
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch((err) => {
          console.warn('Audio play prevented or format error:', err);
          simulatePlayback();
        });
      }
    } else {
      // Fallback if no media URL attached
      simulatePlayback();
    }
  };

  const simulatePlayback = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    let timer: any;
    if (isPlaying && !audioRef.current?.src) {
      timer = setInterval(() => {
        setCurrentProgress((prev) => {
          if (prev >= waveform.length - 1) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 300 / speed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, speed, waveform.length]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetIdx = Math.floor(ratio * waveform.length);
    setCurrentProgress(targetIdx);

    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = ratio * audioRef.current.duration;
    }
  };

  const toggleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    let newSpeed = 1.0;
    if (speed === 1.0) newSpeed = 1.5;
    else if (speed === 1.5) newSpeed = 2.0;
    else newSpeed = 1.0;

    setSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  return (
    <div className="bg-surface-container/90 backdrop-blur-md p-3 rounded-2xl rounded-tl-sm shadow-md w-full flex flex-col gap-2 border border-surface-container-highest/40">
      <div className="flex items-center gap-3">
        {/* Play / Pause Toggle */}
        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause voice message' : 'Play voice message'}
          className="w-11 h-11 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg active:scale-95 transition-transform flex-shrink-0"
        >
          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            {isPlaying ? 'pause' : 'play_arrow'}
          </span>
        </button>

        {/* Audio Bars & Scrubber */}
        <div className="flex-1 flex flex-col justify-center gap-1.5 min-w-0">
          <div
            className="h-8 flex items-center gap-[3px] py-1 cursor-pointer overflow-hidden group select-none"
            onClick={handleSeek}
            title="Click to seek audio position"
          >
            {waveform.map((height, i) => {
              const isPast = i <= currentProgress;
              return (
                <div
                  key={i}
                  style={{ height: `${Math.max(10, (height / 100) * 28)}px` }}
                  className={`w-1 rounded-full transition-all duration-100 ${
                    isPast ? 'bg-primary' : 'bg-outline-variant/60 group-hover:bg-outline-variant'
                  }`}
                />
              );
            })}
          </div>

          {/* Time & Speed Metadata */}
          <div className="flex items-center justify-between text-on-surface-variant font-mono text-[11px]">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px] text-tertiary">graphic_eq</span>
              <span>
                {isPlaying ? currentTimeFormatted : '0:00'} / {totalDurationFormatted}
              </span>
            </span>
            <button
              type="button"
              onClick={toggleSpeed}
              className="px-2 py-0.5 rounded-full bg-surface-container-high text-primary hover:bg-surface-bright font-label-sm text-[11px] font-bold transition-colors"
            >
              {speed}x
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

