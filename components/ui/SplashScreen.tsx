'use client';

import React, { useState, useEffect } from 'react';

export const SplashScreen: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem('nexus_splash_seen');
    if (hasSeenSplash) {
      setIsVisible(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsFading(true);
      setTimeout(() => {
        setIsVisible(false);
        sessionStorage.setItem('nexus_splash_seen', 'true');
      }, 700);
    }, 2400);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 text-white select-none transition-opacity duration-700 ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Animated Gradient Mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(99,102,241,0.18),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_65%,rgba(56,189,248,0.12),transparent_55%)] pointer-events-none" />

      {/* Main Container */}
      <div className="relative flex flex-col items-center gap-6 px-6 text-center animate-in fade-in zoom-in-95 duration-700">
        {/* Title */}
        <div className="flex flex-col items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-indigo-500/30 text-indigo-400 text-xs font-mono tracking-widest uppercase mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Quantum Encrypted Signals</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-indigo-300 drop-shadow-[0_0_35px_rgba(99,102,241,0.5)]">
            NEXUS CHAT
          </h1>

          <p className="text-xs sm:text-sm font-mono text-slate-400 tracking-wider font-medium">
            developed by <span className="text-cyan-400 font-semibold underline decoration-cyan-500/50">quantum noob</span>
          </p>
        </div>

        {/* Application Logo */}
        <div className="relative mt-2">
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-indigo-600/40 via-cyan-500/30 to-purple-600/40 blur-xl animate-pulse" />
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-slate-900/90 border-2 border-indigo-500/40 flex items-center justify-center shadow-2xl backdrop-blur-xl">
            {/* Hexagon & Quantum Icon */}
            <div className="relative flex items-center justify-center">
              <span className="material-symbols-outlined text-5xl sm:text-6xl text-transparent bg-clip-text bg-gradient-to-tr from-cyan-400 via-indigo-300 to-purple-400">
                hub
              </span>
              <span className="absolute w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)] animate-ping" />
            </div>
          </div>
        </div>

        {/* Progress Bar Indicator */}
        <div className="w-48 sm:w-60 h-1 rounded-full bg-slate-900 overflow-hidden border border-white/10 mt-4">
          <div className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 rounded-full animate-[pulse_1.5s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
};
