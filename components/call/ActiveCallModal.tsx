'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useCall } from '@/context/CallContext';
import { useAuth } from '@/context/AuthContext';

export const ActiveCallModal: React.FC = () => {
  const { user } = useAuth();
  const {
    activeCall,
    localStream,
    remoteStream,
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
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const [frameMounted, setFrameMounted] = useState(false);

  // Attach local media stream to local video preview element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, activeCall]);

  // Attach remote media stream to remote video and audio elements
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, activeCall]);

  // Mount Daily Call Frame into container when available
  useEffect(() => {
    let mounted = true;

    if (activeCall && dailyContainerRef.current && !frameMounted) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/95 backdrop-blur-2xl animate-fade-in">
      <div className="relative w-full max-w-4xl h-[92vh] max-h-[820px] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center justify-between border border-white/10">
        
        {/* Hidden Audio Stream Element for Voice Calls */}
        <audio ref={remoteAudioRef} autoPlay playsInline />

        {/* Top Header Bar */}
        <div className="w-full px-5 py-3.5 flex items-center justify-between z-20 bg-slate-950/90 backdrop-blur-md border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                alt={peerName}
                src={
                  peerAvatar ||
                  'https://lh3.googleusercontent.com/aida-public/AB6AXuBDmyBN5eU3P6Db79C6OvqxLwjGYPnL_j1bLCf1PSowDZQzYUqnMS9hLlcRJa-jSqVB0IMKREmx2xvZBUbo6-1KJv-4LAqHQC8kn9do6g4hwhkQVY-E7tSRb0ipQV1O1P5nhK872-Ir4eAWtch96NIhKmwh9byJj8aTF5uwIRIHFBol8cWq9bfpaYYQmWOgcT0sIeKOINsdtQstUSG_8Z8KP-VcryFeKFt-d7-e1n4Smya4lt3HFPevoA'
                }
                className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/40"
              />
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${
                  isConnecting ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 ring-2 ring-slate-950 shadow-sm'
                }`}
              />
            </div>

            <div className="flex flex-col text-left">
              <span className="text-sm font-bold text-white truncate max-w-[180px] sm:max-w-xs">
                {peerName}
              </span>
              <span className="text-[11px] font-mono text-cyan-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px] text-emerald-400">lock</span>
                {isVideo ? 'WebRTC HD Video Mesh' : 'WebRTC Encrypted Audio'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono text-emerald-400 bg-slate-800/80 px-3 py-1 rounded-full border border-white/10">
              {isConnecting ? 'Ringing...' : formatDuration(callDuration)}
            </span>
            <button
              type="button"
              onClick={endCall}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1 shadow-md active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-sm">call_end</span>
              <span className="hidden sm:inline">Leave</span>
            </button>
          </div>
        </div>

        {/* Live Call Media Canvas Stage */}
        <div className="relative w-full flex-1 bg-slate-950 flex items-center justify-center overflow-hidden">
          
          {/* 1. Video Call Mode: Live WebRTC Video Feeds */}
          {isVideo ? (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              {/* Remote Video Stream Feed */}
              {remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 text-center p-6">
                  <div className="relative">
                    <img
                      alt={peerName}
                      className="w-24 h-24 rounded-full object-cover ring-4 ring-indigo-500/50 shadow-2xl"
                      src={
                        peerAvatar ||
                        'https://lh3.googleusercontent.com/aida-public/AB6AXuBDmyBN5eU3P6Db79C6OvqxLwjGYPnL_j1bLCf1PSowDZQzYUqnMS9hLlcRJa-jSqVB0IMKREmx2xvZBUbo6-1KJv-4LAqHQC8kn9do6g4hwhkQVY-E7tSRb0ipQV1O1P5nhK872-Ir4eAWtch96NIhKmwh9byJj8aTF5uwIRIHFBol8cWq9bfpaYYQmWOgcT0sIeKOINsdtQstUSG_8Z8KP-VcryFeKFt-d7-e1n4Smya4lt3HFPevoA'
                      }
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-200">
                    {isConnecting ? 'Calling peer...' : 'Connected · Video Stream Active'}
                  </span>
                </div>
              )}

              {/* Local Self-View PiP Video Stream */}
              {localStream && !isVideoOff && (
                <div className="absolute top-4 right-4 w-28 h-40 sm:w-36 sm:h-48 rounded-2xl overflow-hidden ring-2 ring-white/20 shadow-2xl z-30 bg-slate-900">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover -scale-x-100"
                  />
                  <div className="absolute bottom-1.5 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] text-white font-mono">
                    You
                  </div>
                </div>
              )}

              {/* Embedded Daily Frame fallback if active */}
              <div
                ref={dailyContainerRef}
                className={`w-full h-full ${remoteStream ? 'hidden' : 'flex'} items-center justify-center`}
              />
            </div>
          ) : (
            /* 2. Voice Call Mode: Animated Waves & Peer Avatar */
            <div className="relative w-full h-full flex flex-col items-center justify-center gap-6 p-6 text-center bg-gradient-to-b from-slate-900 to-slate-950">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" />
                <div className="relative w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-2xl">
                  <img
                    alt={peerName}
                    className="w-full h-full rounded-full object-cover bg-slate-800"
                    src={
                      peerAvatar ||
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuBDmyBN5eU3P6Db79C6OvqxLwjGYPnL_j1bLCf1PSowDZQzYUqnMS9hLlcRJa-jSqVB0IMKREmx2xvZBUbo6-1KJv-4LAqHQC8kn9do6g4hwhkQVY-E7tSRb0ipQV1O1P5nhK872-Ir4eAWtch96NIhKmwh9byJj8aTF5uwIRIHFBol8cWq9bfpaYYQmWOgcT0sIeKOINsdtQstUSG_8Z8KP-VcryFeKFt-d7-e1n4Smya4lt3HFPevoA'
                    }
                  />
                </div>
              </div>

              <div className="flex flex-col items-center gap-1">
                <h3 className="text-2xl font-bold text-white tracking-tight">{peerName}</h3>
                <span className="text-xs text-indigo-300 font-mono">
                  {isConnecting ? 'Ringing operative...' : 'Encrypted Voice Connected · 48kHz Opus'}
                </span>
              </div>

              {/* Audio Waveform Equalizer Animation */}
              <div className="flex items-center gap-1.5 h-10 mt-2">
                {[20, 50, 80, 45, 95, 30, 70, 90, 40, 60, 85, 35, 75, 55, 65].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h * 0.4}px`, animationDelay: `${i * 0.1}s` }}
                    className="w-1.5 rounded-full bg-gradient-to-t from-indigo-500 to-cyan-400 animate-pulse"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Stream Error Notice */}
          {streamError && (
            <div className="absolute bottom-4 left-4 right-4 bg-rose-600/90 text-white p-2.5 rounded-xl text-xs font-mono z-30 shadow-xl text-center">
              {streamError}
            </div>
          )}
        </div>

        {/* Action Controls Bar */}
        <div className="w-full px-6 py-4 bg-slate-950/90 flex items-center justify-center gap-4 z-20 border-t border-white/10">
          {/* Mute Mic */}
          <button
            type="button"
            onClick={toggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all ${
              isMuted
                ? 'bg-rose-600 text-white shadow-rose-600/40'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            <span className="material-symbols-outlined text-[22px]">
              {isMuted ? 'mic_off' : 'mic'}
            </span>
          </button>

          {/* End Call Button */}
          <button
            type="button"
            onClick={endCall}
            className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-2xl shadow-rose-600/50 active:scale-95 transition-transform"
            title="End Call"
          >
            <span className="material-symbols-outlined text-3xl">call_end</span>
          </button>

          {/* Toggle Camera */}
          <button
            type="button"
            onClick={toggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all ${
              isVideoOff
                ? 'bg-rose-600 text-white shadow-rose-600/40'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
            }`}
            title={isVideoOff ? 'Turn camera on' : 'Turn camera off'}
          >
            <span className="material-symbols-outlined text-[22px]">
              {isVideoOff ? 'videocam_off' : 'videocam'}
            </span>
          </button>

          {/* Screen Share */}
          <button
            type="button"
            onClick={toggleScreenShare}
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all ${
              isScreenSharing
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-cyan-500/40'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
            }`}
            title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
          >
            <span className="material-symbols-outlined text-[22px]">screen_share</span>
          </button>
        </div>
      </div>
    </div>
  );
};
