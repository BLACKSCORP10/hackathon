'use client';

import React from 'react';
import { useCall } from '@/context/CallContext';

export const IncomingCallModal: React.FC = () => {
  const { incomingCall, acceptCall, declineCall } = useCall();

  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-fade-in">
      <div className="relative w-full max-w-sm bg-surface-container rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-between text-center gap-6 border border-primary/40 min-h-[460px]">
        {/* Top Tag */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-error animate-ping" />
            <span className="text-xs uppercase tracking-widest text-primary font-mono font-bold">
              {incomingCall.type === 'video' ? 'Incoming Video Call' : 'Incoming Audio Call'}
            </span>
          </div>
          <span className="text-[11px] text-on-surface-variant font-mono">End-to-End Encrypted Peer Signal</span>
        </div>

        {/* Caller Avatar & Glow */}
        <div className="relative flex flex-col items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
            <img
              alt={incomingCall.callerName}
              className="w-28 h-28 rounded-full object-cover ring-4 ring-primary/60 relative z-10 shadow-2xl"
              src={
                incomingCall.callerAvatar ||
                'https://lh3.googleusercontent.com/aida-public/AB6AXuBDmyBN5eU3P6Db79C6OvqxLwjGYPnL_j1bLCf1PSowDZQzYUqnMS9hLlcRJa-jSqVB0IMKREmx2xvZBUbo6-1KJv-4LAqHQC8kn9do6g4hwhkQVY-E7tSRb0ipQV1O1P5nhK872-Ir4eAWtch96NIhKmwh9byJj8aTF5uwIRIHFBol8cWq9bfpaYYQmWOgcT0sIeKOINsdtQstUSG_8Z8KP-VcryFeKFt-d7-e1n4Smya4lt3HFPevoA'
              }
            />
          </div>
          <h3 className="text-xl font-bold text-on-surface">{incomingCall.callerName}</h3>
          <span className="px-3 py-1 rounded-full bg-surface-container-high text-tertiary font-mono text-xs border border-surface-container-highest">
            Cross-Network WebRTC Mesh
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-8 w-full">
          {/* Decline Button */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={declineCall}
              className="w-16 h-16 rounded-full bg-error text-white flex items-center justify-center shadow-xl active:scale-95 hover:bg-error/90 transition-transform"
              title="Decline Call"
            >
              <span className="material-symbols-outlined text-3xl">call_end</span>
            </button>
            <span className="text-xs text-on-surface-variant font-medium">Decline</span>
          </div>

          {/* Accept Button */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={acceptCall}
              className="w-16 h-16 rounded-full bg-tertiary text-black flex items-center justify-center shadow-xl active:scale-95 hover:brightness-110 transition-transform animate-bounce"
              title="Accept Call"
            >
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                {incomingCall.type === 'video' ? 'videocam' : 'call'}
              </span>
            </button>
            <span className="text-xs text-tertiary font-semibold">Accept</span>
          </div>
        </div>
      </div>
    </div>
  );
};
