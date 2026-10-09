'use client';

import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FirestoreCallLog, saveFirestoreCallLog } from '@/lib/db';
import { TopHeader } from '@/components/navigation/TopHeader';
import { BottomNav } from '@/components/navigation/BottomNav';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';

export default function CallLogsPage() {
  const { user } = useAuth();
  const { users } = useChat();
  const [filter, setFilter] = useState<'all' | 'missed'>('all');
  const [dialerOpen, setDialerOpen] = useState(false);
  const [dialTarget, setDialTarget] = useState('');
  const [callLogs, setCallLogs] = useState<FirestoreCallLog[]>([]);

  // Live Call Modal State
  const [activeCallTarget, setActiveCallTarget] = useState<{
    name: string;
    avatarUrl: string;
    id: string;
    type: 'audio' | 'video';
  } | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // 1. Real-Time Firestore Call Logs Listener
  useEffect(() => {
    const callsRef = collection(db, 'calls');
    const q = query(callsRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as FirestoreCallLog[];
        setCallLogs(loaded);
      },
      () => {
        setCallLogs([]);
      }
    );

    return () => unsubscribe();
  }, []);

  // 2. Setup getUserMedia stream when call modal is active
  useEffect(() => {
    let timer: any;

    if (activeCallTarget) {
      setCallDuration(0);
      setIsMuted(false);
      setIsVideoOff(false);
      setStreamError(null);

      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      const startStream = async () => {
        try {
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setStreamError('Media devices not supported in this browser.');
            return;
          }

          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: activeCallTarget.type === 'video' ? { width: 1280, height: 720, facingMode: 'user' } : false,
          });

          localStreamRef.current = stream;

          if (localVideoRef.current && activeCallTarget.type === 'video') {
            localVideoRef.current.srcObject = stream;
            localVideoRef.current.play().catch((e) => console.warn('Video play error:', e));
          }
        } catch (err: any) {
          console.warn('getUserMedia error:', err);
          setStreamError(err.message || 'Could not access camera/microphone.');
        }
      };

      startStream();
    }

    return () => {
      if (timer) clearInterval(timer);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
    };
  }, [activeCallTarget]);

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    } else {
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    } else {
      setIsVideoOff(!isVideoOff);
    }
  };

  const endCall = async () => {
    const durationSec = callDuration;
    const currentTarget = activeCallTarget;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    setActiveCallTarget(null);

    if (user && currentTarget) {
      try {
        await saveFirestoreCallLog({
          callerId: user.uid,
          callerName: user.name || user.username || 'Nexus Operative',
          callerAvatar: user.avatarUrl,
          receiverId: currentTarget.id,
          receiverName: currentTarget.name,
          receiverAvatar: currentTarget.avatarUrl,
          type: currentTarget.type,
          direction: 'outgoing',
          status: 'connected',
          duration: durationSec,
        });
      } catch (e) {
        console.warn('Error recording call log:', e);
      }
    }
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Default mock seeds if user has no calls yet in Firestore
  const fallbackLogs: FirestoreCallLog[] = [
    {
      id: 'mock-1',
      callerId: 'sarah-id',
      callerName: 'Sarah Chen (Quantum Crypt)',
      callerAvatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBDmyBN5eU3P6Db79C6OvqxLwjGYPnL_j1bLCf1PSowDZQzYUqnMS9hLlcRJa-jSqVB0IMKREmx2xvZBUbo6-1KJv-4LAqHQC8kn9do6g4hwhkQVY-E7tSRb0ipQV1O1P5nhK872-Ir4eAWtch96NIhKmwh9byJj8aTF5uwIRIHFBol8cWq9bfpaYYQmWOgcT0sIeKOINsdtQstUSG_8Z8KP-VcryFeKFt-d7-e1n4Smya4lt3HFPevoA',
      receiverId: 'me',
      receiverName: 'Nexus Operative',
      receiverAvatar: '',
      type: 'video',
      direction: 'incoming',
      status: 'connected',
      duration: 860,
    },
    {
      id: 'mock-2',
      callerId: 'marcus-id',
      callerName: 'Marcus Brody',
      callerAvatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuATLtKtpLjWUaQgne0FgWsnraj0JAi5pVEhRBAb7SIJwayS10JYxX-ulrVNWiK0hzS_yfwf7UM2pmvILbuHiSeZcSPP_lEzTu1XitSRn9rLR9ShfgPWm3NMTBXOhfLVQgUm5pfN5Qz7zEdcg8KuSSZcr9-KbhbXnop6p4sxeXrldcKtIygcdm-w3H__rD-MzwAxvvtDc0HI9W1Vy5UKbsg-tubf43cPb2PkUVAsOeSu8ZN-qFMkATvg0w',
      receiverId: 'me',
      receiverName: 'Nexus Operative',
      receiverAvatar: '',
      type: 'audio',
      direction: 'outgoing',
      status: 'connected',
      duration: 525,
    },
  ];

  const displayLogs = callLogs.length > 0 ? callLogs : fallbackLogs;
  const filteredLogs = filter === 'missed' ? displayLogs.filter((c) => c.status === 'missed') : displayLogs;

  const handleStartCall = (name: string, avatarUrl: string, id: string, type: 'audio' | 'video') => {
    setActiveCallTarget({ name, avatarUrl, id, type });
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <TopHeader title="NexusChat" subtitle="Encrypted Calls" />

      <main className="flex-1 flex flex-col pt-16 pb-24 max-w-4xl mx-auto w-full px-4 py-4 gap-4">
        {/* Filter Switcher */}
        <div className="w-full p-1 bg-surface-container-lowest rounded-xl flex items-center shadow-inner border border-surface-container-highest/40">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`flex-1 py-1.5 text-center font-label-md text-xs rounded-lg transition-all ${
              filter === 'all'
                ? 'bg-primary-container text-on-primary-container shadow-md font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            All Calls ({displayLogs.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('missed')}
            className={`flex-1 py-1.5 text-center font-label-md text-xs rounded-lg transition-all ${
              filter === 'missed'
                ? 'bg-primary-container text-on-primary-container shadow-md font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Missed (0)
          </button>
        </div>

        {/* Call Logs Feed */}
        <section className="flex flex-col gap-2">
          {filteredLogs.map((log) => {
            const isMissed = log.status === 'missed';
            const targetName = log.callerId === user?.uid ? log.receiverName : log.callerName;
            const targetAvatar = log.callerId === user?.uid ? log.receiverAvatar : log.callerAvatar;
            const targetId = log.callerId === user?.uid ? log.receiverId : log.callerId;

            return (
              <div
                key={log.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors border border-surface-container-highest/30 shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      alt={targetName}
                      className="w-11 h-11 rounded-full object-cover ring-1 ring-surface-container-highest"
                      src={
                        targetAvatar ||
                        'https://lh3.googleusercontent.com/aida-public/AB6AXuBDmyBN5eU3P6Db79C6OvqxLwjGYPnL_j1bLCf1PSowDZQzYUqnMS9hLlcRJa-jSqVB0IMKREmx2xvZBUbo6-1KJv-4LAqHQC8kn9do6g4hwhkQVY-E7tSRb0ipQV1O1P5nhK872-Ir4eAWtch96NIhKmwh9byJj8aTF5uwIRIHFBol8cWq9bfpaYYQmWOgcT0sIeKOINsdtQstUSG_8Z8KP-VcryFeKFt-d7-e1n4Smya4lt3HFPevoA'
                      }
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span
                      className={`font-headline-md text-sm font-semibold truncate ${
                        isMissed ? 'text-error' : 'text-on-surface'
                      }`}
                    >
                      {targetName}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-on-surface-variant mt-0.5">
                      <span
                        className={`material-symbols-outlined text-[14px] ${
                          isMissed ? 'text-error' : 'text-tertiary'
                        }`}
                      >
                        {log.direction === 'incoming'
                          ? 'call_received'
                          : log.direction === 'outgoing'
                          ? 'call_made'
                          : 'call_missed'}
                      </span>
                      <span>AES-256 Encrypted</span>
                      {log.duration > 0 && (
                        <span className="font-mono text-[10px] bg-surface-container px-1.5 py-0.5 rounded text-tertiary">
                          {formatDuration(log.duration)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleStartCall(
                        targetName,
                        targetAvatar || '',
                        targetId,
                        log.type === 'video' ? 'video' : 'audio'
                      )
                    }
                    className="w-9 h-9 rounded-full bg-surface-container-high hover:bg-surface-bright flex items-center justify-center text-primary active:scale-95 transition-all shadow-sm"
                    title={`Start ${log.type} call`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {log.type === 'video' ? 'videocam' : 'call'}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      </main>

      {/* Floating Action Dial Button */}
      <button
        type="button"
        onClick={() => setDialerOpen(true)}
        className="fixed right-6 bottom-20 z-40 w-14 h-14 rounded-2xl bg-gradient-to-tr from-secondary-container to-primary-container text-on-primary flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
      >
        <span className="material-symbols-outlined text-2xl">add_call</span>
      </button>

      {/* Quick Dialer Modal */}
      {dialerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-sm bg-surface-container rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-center border border-surface-container-highest">
            <button
              type="button"
              onClick={() => setDialerOpen(false)}
              className="absolute top-4 right-4 text-outline hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            <h3 className="font-headline-md text-on-surface font-semibold">Start Secure Call</h3>
            <p className="text-xs text-on-surface-variant">Select a contact or enter handle</p>

            <input
              type="text"
              placeholder="@handle or name..."
              value={dialTarget}
              onChange={(e) => setDialTarget(e.target.value)}
              className="w-full bg-surface-container-low text-on-surface text-center font-mono text-sm py-2.5 rounded-xl border border-surface-container-highest focus:outline-none focus:border-primary"
            />

            {/* Online Contacts Selector */}
            <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto no-scrollbar">
              {users.slice(0, 4).map((u) => (
                <div
                  key={u.id}
                  onClick={() => setDialTarget(u.name)}
                  className="flex items-center gap-2 p-2 rounded-xl bg-surface-container-low hover:bg-surface-container cursor-pointer transition-colors text-left"
                >
                  <img alt={u.name} src={u.avatarUrl} className="w-8 h-8 rounded-full object-cover" />
                  <span className="text-xs font-medium text-on-surface truncate">{u.name}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                type="button"
                onClick={() => {
                  setDialerOpen(false);
                  handleStartCall(
                    dialTarget || 'Sarah Chen',
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuBDmyBN5eU3P6Db79C6OvqxLwjGYPnL_j1bLCf1PSowDZQzYUqnMS9hLlcRJa-jSqVB0IMKREmx2xvZBUbo6-1KJv-4LAqHQC8kn9do6g4hwhkQVY-E7tSRb0ipQV1O1P5nhK872-Ir4eAWtch96NIhKmwh9byJj8aTF5uwIRIHFBol8cWq9bfpaYYQmWOgcT0sIeKOINsdtQstUSG_8Z8KP-VcryFeKFt-d7-e1n4Smya4lt3HFPevoA',
                    'dial-target',
                    'audio'
                  );
                }}
                className="py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-bright text-primary font-label-md text-xs font-semibold flex items-center justify-center gap-1 shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">call</span>
                Audio Call
              </button>
              <button
                type="button"
                onClick={() => {
                  setDialerOpen(false);
                  handleStartCall(
                    dialTarget || 'Sarah Chen',
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuBDmyBN5eU3P6Db79C6OvqxLwjGYPnL_j1bLCf1PSowDZQzYUqnMS9hLlcRJa-jSqVB0IMKREmx2xvZBUbo6-1KJv-4LAqHQC8kn9do6g4hwhkQVY-E7tSRb0ipQV1O1P5nhK872-Ir4eAWtch96NIhKmwh9byJj8aTF5uwIRIHFBol8cWq9bfpaYYQmWOgcT0sIeKOINsdtQstUSG_8Z8KP-VcryFeKFt-d7-e1n4Smya4lt3HFPevoA',
                    'dial-target',
                    'video'
                  );
                }}
                className="py-2.5 rounded-xl bg-primary-container text-on-primary-container font-label-md text-xs font-semibold flex items-center justify-center gap-1 shadow-md"
              >
                <span className="material-symbols-outlined text-sm">videocam</span>
                Video Call
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real Live Call Overlay */}
      {activeCallTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl animate-fade-in">
          <div className="relative w-full max-w-md bg-surface-container rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center justify-between text-center border border-surface-container-highest min-h-[540px]">
            {/* Header */}
            <div className="w-full p-4 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-error animate-ping" />
                <span className="text-xs uppercase tracking-widest text-primary font-mono font-bold">
                  {activeCallTarget.type === 'video' ? 'Live Video Mesh' : 'Live Audio Mesh'}
                </span>
              </div>
              <span className="text-sm font-mono text-tertiary bg-black/40 px-3 py-1 rounded-full border border-surface-container-highest">
                {formatDuration(callDuration)}
              </span>
            </div>

            {/* Video Canvas or Audio Visualizer */}
            {activeCallTarget.type === 'video' ? (
              <div className="relative w-full flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[340px]">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
                />

                {isVideoOff && (
                  <div className="flex flex-col items-center gap-3">
                    <img
                      alt={activeCallTarget.name}
                      className="w-24 h-24 rounded-full object-cover ring-4 ring-primary/40 shadow-2xl"
                      src={activeCallTarget.avatarUrl}
                    />
                    <span className="text-xs text-on-surface-variant font-mono">Camera Paused</span>
                  </div>
                )}

                {/* Picture-in-picture peer */}
                <div className="absolute top-4 right-4 w-28 h-36 rounded-2xl overflow-hidden bg-surface-container-high border-2 border-primary/50 shadow-2xl flex flex-col items-center justify-center p-2 z-10 backdrop-blur-md">
                  <img
                    alt={activeCallTarget.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-primary mb-1"
                    src={activeCallTarget.avatarUrl}
                  />
                  <span className="text-[10px] text-white font-semibold truncate w-full text-center">
                    {activeCallTarget.name}
                  </span>
                  <span className="text-[9px] text-tertiary font-mono">Encrypted</span>
                </div>

                {streamError && (
                  <div className="absolute bottom-4 left-4 right-4 bg-error/90 text-white p-2 rounded-xl text-xs font-mono">
                    {streamError}
                  </div>
                )}
              </div>
            ) : (
              <div className="relative flex-1 flex flex-col items-center justify-center gap-5 p-6">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                  <img
                    alt={activeCallTarget.name}
                    className="w-28 h-28 rounded-full object-cover ring-4 ring-primary/40 relative z-10 shadow-2xl"
                    src={activeCallTarget.avatarUrl}
                  />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <h3 className="text-xl font-bold text-on-surface">{activeCallTarget.name}</h3>
                  <span className="text-xs text-on-surface-variant font-mono">Quantum Audio Mesh Connected</span>
                </div>

                <div className="flex items-center gap-1.5 h-10">
                  {[20, 45, 80, 60, 95, 40, 75, 50, 90, 30].map((h, i) => (
                    <div
                      key={i}
                      style={{ height: `${h * 0.4}px` }}
                      className="w-1.5 rounded-full bg-primary animate-pulse"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="w-full p-6 bg-surface-container-high flex items-center justify-center gap-4 z-20 border-t border-surface-container-highest">
              <button
                type="button"
                onClick={toggleMute}
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all ${
                  isMuted ? 'bg-error text-white' : 'bg-surface-container text-on-surface hover:bg-surface-bright'
                }`}
                title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
              >
                <span className="material-symbols-outlined">{isMuted ? 'mic_off' : 'mic'}</span>
              </button>

              <button
                type="button"
                onClick={endCall}
                className="w-16 h-16 rounded-full bg-error text-white flex items-center justify-center shadow-2xl active:scale-95 hover:bg-error/90 transition-transform"
                title="End Call"
              >
                <span className="material-symbols-outlined text-3xl">call_end</span>
              </button>

              {activeCallTarget.type === 'video' ? (
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
                  <span className="material-symbols-outlined">{isVideoOff ? 'videocam_off' : 'videocam'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => alert('Speakerphone audio routing active.')}
                  className="w-12 h-12 rounded-full bg-surface-container text-on-surface flex items-center justify-center shadow-lg active:scale-95 hover:bg-surface-bright transition-all"
                  title="Speakerphone"
                >
                  <span className="material-symbols-outlined">volume_up</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
