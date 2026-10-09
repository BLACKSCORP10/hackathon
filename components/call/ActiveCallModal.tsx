'use client';

import React, { useEffect, useRef } from 'react';
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
    endCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  // Attach local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch((e) => console.warn('Local video play warning:', e));
    }
  }, [localStream, isVideoOff]);

  // Attach remote stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch((e) => console.warn('Remote video play warning:', e));
    }
  }, [remoteStream]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl animate-fade-in">
      <div className="relative w-full max-w-lg bg-surface-container rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center justify-between text-center border border-surface-container-highest min-h-[580px] max-h-[90vh]">
        {/* Call Header */}
        <div className="w-full p-4 flex items-center justify-between z-20 bg-gradient-to-b from-black/90 to-transparent">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isConnecting ? 'bg-amber-400 animate-ping' : 'bg-tertiary animate-pulse'
              }`}
            />
            <span className="text-xs uppercase tracking-widest text-primary font-mono font-bold">
              {isVideo ? 'WebRTC HD Video' : 'WebRTC Encrypted Audio'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-tertiary bg-black/50 px-3 py-1 rounded-full border border-surface-container-highest">
              {isConnecting ? 'Ringing / Connecting...' : formatDuration(callDuration)}
            </span>
          </div>
        </div>

        {/* Call Stage (Video Grid or Audio Waves) */}
        {isVideo ? (
          <div className="relative w-full flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[380px]">
            {/* Remote Video Stream (Main Window) */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

            {/* If Remote Stream not arrived yet, show connecting avatar */}
            {isConnecting && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80 z-10">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                  <img
                    alt={peerName}
                    className="w-24 h-24 rounded-full object-cover ring-4 ring-primary/40 shadow-2xl"
                    src={peerAvatar}
                  />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <h3 className="text-lg font-bold text-white">{peerName}</h3>
                  <span className="text-xs text-primary font-mono animate-pulse">
                    Connecting Open Relay TURN/STUN Peer...
                  </span>
                </div>
              </div>
            )}

            {/* Local Video Stream (Picture-in-Picture) */}
            <div className="absolute top-4 right-4 w-32 h-44 rounded-2xl overflow-hidden bg-surface-container-high border-2 border-primary/60 shadow-2xl z-20 backdrop-blur-md flex items-center justify-center">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
              />
              {isVideoOff && (
                <div className="flex flex-col items-center justify-center gap-1 p-2">
                  <span className="material-symbols-outlined text-outline text-2xl">videocam_off</span>
                  <span className="text-[10px] text-on-surface-variant font-mono">Camera Off</span>
                </div>
              )}
              <span className="absolute bottom-1 left-2 text-[9px] font-mono text-white/80 bg-black/50 px-1 rounded">
                You
              </span>
            </div>

            {streamError && (
              <div className="absolute bottom-4 left-4 right-4 bg-error/90 text-white p-2.5 rounded-xl text-xs font-mono z-30">
                {streamError}
              </div>
            )}
          </div>
        ) : (
          <div className="relative flex-1 flex flex-col items-center justify-center gap-6 p-6 w-full">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/25 animate-ping" />
              <img
                alt={peerName}
                className="w-32 h-32 rounded-full object-cover ring-4 ring-primary/50 relative z-10 shadow-2xl"
                src={peerAvatar}
              />
            </div>

            <div className="flex flex-col items-center gap-1">
              <h3 className="text-2xl font-bold text-on-surface">{peerName}</h3>
              <span className="text-xs text-on-surface-variant font-mono">
                {isConnecting ? 'Ringing peer node...' : 'Open Relay Encrypted Mesh Connected'}
              </span>
            </div>

            {/* Live Audio Visualizer Bars */}
            <div className="flex items-center gap-1.5 h-12">
              {[25, 50, 85, 45, 100, 60, 90, 35, 75, 50, 80, 40].map((h, i) => (
                <div
                  key={i}
                  style={{ height: isConnecting ? '10px' : `${h * 0.45}px` }}
                  className={`w-1.5 rounded-full ${
                    isConnecting ? 'bg-outline/50' : 'bg-primary animate-pulse'
                  } transition-all duration-200`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Action Controls Bar */}
        <div className="w-full p-5 bg-surface-container-high flex items-center justify-center gap-4 z-20 border-t border-surface-container-highest">
          {/* Mute Button */}
          <button
            type="button"
            onClick={toggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all ${
              isMuted
                ? 'bg-error text-white'
                : 'bg-surface-container text-on-surface hover:bg-surface-bright'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            <span className="material-symbols-outlined">{isMuted ? 'mic_off' : 'mic'}</span>
          </button>

          {/* End Call Button */}
          <button
            type="button"
            onClick={endCall}
            className="w-16 h-16 rounded-full bg-error text-white flex items-center justify-center shadow-2xl active:scale-95 hover:bg-error/90 transition-transform"
            title="End Encrypted Call"
          >
            <span className="material-symbols-outlined text-3xl">call_end</span>
          </button>

          {/* Video Controls */}
          {isVideo ? (
            <>
              <button
                type="button"
                onClick={toggleVideo}
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all ${
                  isVideoOff
                    ? 'bg-error text-white'
                    : 'bg-surface-container text-on-surface hover:bg-surface-bright'
                }`}
                title={isVideoOff ? 'Turn camera on' : 'Turn camera off'}
              >
                <span className="material-symbols-outlined">
                  {isVideoOff ? 'videocam_off' : 'videocam'}
                </span>
              </button>
              <button
                type="button"
                onClick={toggleScreenShare}
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all ${
                  isScreenSharing
                    ? 'bg-tertiary text-black'
                    : 'bg-surface-container text-on-surface hover:bg-surface-bright'
                }`}
                title={isScreenSharing ? 'Stop screen share' : 'Share screen'}
              >
                <span className="material-symbols-outlined">screen_share</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => alert('Audio output routing active.')}
              className="w-12 h-12 rounded-full bg-surface-container text-on-surface flex items-center justify-center shadow-lg active:scale-95 hover:bg-surface-bright transition-all"
              title="Speakerphone"
            >
              <span className="material-symbols-outlined">volume_up</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
