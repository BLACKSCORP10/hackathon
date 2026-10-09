'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useCall } from '@/context/CallContext';
import { useAuth } from '@/context/AuthContext';

export const ActiveCallModal: React.FC = () => {
  const { user } = useAuth();
  const {
    activeCall,
    callDuration,
    isMuted,
    isVideoOff,
    isScreenSharing,
    streamError,
    mountCallFrame,
    endCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
  } = useCall();

  const dailyContainerRef = useRef<HTMLDivElement | null>(null);
  const [frameMounted, setFrameMounted] = useState(false);

  // Mount Daily Call Frame into container when call is active
  useEffect(() => {
    let mounted = true;

    if (activeCall && dailyContainerRef.current && !frameMounted) {
      // If call is pending (caller waiting for answer), we can mount early or wait for connected
      mountCallFrame(dailyContainerRef.current)
        .then(() => {
          if (mounted) setFrameMounted(true);
        })
        .catch((err) => {
          console.warn('Daily frame mount notice:', err);
        });
    }

    return () => {
      mounted = false;
    };
  }, [activeCall, mountCallFrame, frameMounted]);

  // Reset mounted state when activeCall clears
  useEffect(() => {
    if (!activeCall) {
      setFrameMounted(false);
    }
  }, [activeCall]);

  if (!activeCall) return null;

  const isCaller = activeCall.callerId === user?.uid;
  const peerName = isCaller ? activeCall.receiverName : activeCall.callerName;
  const peerAvatar = isCaller ? activeCall.receiverAvatar : activeCall.callerAvatar;
  const isVideo = activeCall.type === 'video';
  const isConnecting = activeCall.status === 'pending';

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-2xl animate-fade-in">
      <div className="relative w-full max-w-4xl h-[92vh] max-h-[820px] bg-surface-container rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center justify-between border border-surface-container-highest">
        {/* Top Header Bar */}
        <div className="w-full px-5 py-3 flex items-center justify-between z-20 bg-surface-container-low/95 backdrop-blur-md border-b border-surface-container-highest/60">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                alt={peerName}
                src={
                  peerAvatar ||
                  'https://lh3.googleusercontent.com/aida-public/AB6AXuBDmyBN5eU3P6Db79C6OvqxLwjGYPnL_j1bLCf1PSowDZQzYUqnMS9hLlcRJa-jSqVB0IMKREmx2xvZBUbo6-1KJv-4LAqHQC8kn9do6g4hwhkQVY-E7tSRb0ipQV1O1P5nhK872-Ir4eAWtch96NIhKmwh9byJj8aTF5uwIRIHFBol8cWq9bfpaYYQmWOgcT0sIeKOINsdtQstUSG_8Z8KP-VcryFeKFt-d7-e1n4Smya4lt3HFPevoA'
                }
                className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/40"
              />
              <span
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ${
                  isConnecting ? 'bg-amber-400 animate-ping' : 'bg-tertiary animate-pulse'
                }`}
              />
            </div>

            <div className="flex flex-col text-left">
              <span className="font-headline-md text-sm font-bold text-on-surface truncate max-w-[180px] sm:max-w-xs">
                {peerName}
              </span>
              <span className="text-[11px] font-mono text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px] text-tertiary">lock</span>
                {isVideo ? 'Daily.co HD Video Mesh' : 'Daily.co Encrypted Voice'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-tertiary bg-surface-container-highest/60 px-3 py-1 rounded-full border border-surface-container-highest">
              {isConnecting ? 'Ringing...' : formatDuration(callDuration)}
            </span>
            <button
              type="button"
              onClick={endCall}
              className="px-3.5 py-1.5 rounded-xl bg-error/90 hover:bg-error text-white font-label-md text-xs font-semibold flex items-center gap-1 shadow-md active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-sm">call_end</span>
              <span className="hidden sm:inline">Leave</span>
            </button>
          </div>
        </div>

        {/* Embedded Daily Frame Stage */}
        <div className="relative w-full flex-1 bg-[#080c14] flex items-center justify-center overflow-hidden">
          {/* Waiting / Ringing Overlay if recipient hasn't answered yet */}
          {isConnecting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-black/85 z-20 p-6 text-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
                <img
                  alt={peerName}
                  className="w-28 h-28 rounded-full object-cover ring-4 ring-primary/60 relative z-10 shadow-2xl"
                  src={
                    peerAvatar ||
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuBDmyBN5eU3P6Db79C6OvqxLwjGYPnL_j1bLCf1PSowDZQzYUqnMS9hLlcRJa-jSqVB0IMKREmx2xvZBUbo6-1KJv-4LAqHQC8kn9do6g4hwhkQVY-E7tSRb0ipQV1O1P5nhK872-Ir4eAWtch96NIhKmwh9byJj8aTF5uwIRIHFBol8cWq9bfpaYYQmWOgcT0sIeKOINsdtQstUSG_8Z8KP-VcryFeKFt-d7-e1n4Smya4lt3HFPevoA'
                  }
                />
              </div>
              <div className="flex flex-col items-center gap-1">
                <h3 className="text-xl font-bold text-white">{peerName}</h3>
                <span className="text-xs text-primary font-mono animate-pulse">
                  Establishing Daily.co encrypted session...
                </span>
              </div>
              <div className="flex items-center gap-1.5 h-8">
                {[20, 45, 80, 60, 95, 40, 75, 50, 90, 30].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h * 0.35}px` }}
                    className="w-1.5 rounded-full bg-primary/80 animate-pulse"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Daily Iframe Container (Auto-fills width/height and binds media streams) */}
          <div
            ref={dailyContainerRef}
            className="w-full h-full min-h-[360px] flex items-center justify-center"
          />

          {streamError && (
            <div className="absolute bottom-4 left-4 right-4 bg-error/90 text-white p-2.5 rounded-xl text-xs font-mono z-30 shadow-xl">
              {streamError}
            </div>
          )}
        </div>

        {/* Action Utility Bar */}
        <div className="w-full px-4 py-3 bg-surface-container-low flex items-center justify-center gap-3 z-20 border-t border-surface-container-highest/60">
          <button
            type="button"
            onClick={toggleMute}
            className={`w-11 h-11 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all ${
              isMuted
                ? 'bg-error text-white'
                : 'bg-surface-container-high text-on-surface hover:bg-surface-bright'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            <span className="material-symbols-outlined text-[20px]">
              {isMuted ? 'mic_off' : 'mic'}
            </span>
          </button>

          <button
            type="button"
            onClick={endCall}
            className="w-14 h-14 rounded-full bg-error text-white flex items-center justify-center shadow-2xl active:scale-95 hover:bg-error/90 transition-transform"
            title="End Call"
          >
            <span className="material-symbols-outlined text-3xl">call_end</span>
          </button>

          <button
            type="button"
            onClick={toggleVideo}
            className={`w-11 h-11 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all ${
              isVideoOff
                ? 'bg-error text-white'
                : 'bg-surface-container-high text-on-surface hover:bg-surface-bright'
            }`}
            title={isVideoOff ? 'Turn camera on' : 'Turn camera off'}
          >
            <span className="material-symbols-outlined text-[20px]">
              {isVideoOff ? 'videocam_off' : 'videocam'}
            </span>
          </button>

          <button
            type="button"
            onClick={toggleScreenShare}
            className={`w-11 h-11 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all ${
              isScreenSharing
                ? 'bg-tertiary text-black'
                : 'bg-surface-container-high text-on-surface hover:bg-surface-bright'
            }`}
            title={isScreenSharing ? 'Stop screen share' : 'Share screen'}
          >
            <span className="material-symbols-outlined text-[20px]">screen_share</span>
          </button>
        </div>
      </div>
    </div>
  );
};
