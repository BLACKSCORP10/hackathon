'use client';

import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FirestoreCallLog } from '@/lib/db';
import { TopHeader } from '@/components/navigation/TopHeader';
import { BottomNav } from '@/components/navigation/BottomNav';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { useCall } from '@/context/CallContext';

export default function CallLogsPage() {
  const { user } = useAuth();
  const { users } = useChat();
  const { startCall } = useCall();
  const [filter, setFilter] = useState<'all' | 'missed'>('all');
  const [dialerOpen, setDialerOpen] = useState(false);
  const [dialTarget, setDialTarget] = useState('');
  const [callLogs, setCallLogs] = useState<FirestoreCallLog[]>([]);

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

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Fallback logs when database is initially empty
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
    startCall(
      {
        uid: id,
        name,
        avatarUrl,
      },
      type
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <TopHeader title="NexusChat" subtitle="Encrypted Calls" />

      <main className="flex-1 flex flex-col pt-16 pb-24 max-w-4xl mx-auto w-full px-4 py-4 gap-4">
        {/* Filter Switcher */}
        <div className="w-full p-1 bg-slate-900/80 backdrop-blur-xl rounded-2xl flex items-center shadow-inner border border-white/10">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`flex-1 py-2 text-center font-sans text-xs rounded-xl transition-all ${
              filter === 'all'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-semibold border border-indigo-400/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Calls ({displayLogs.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('missed')}
            className={`flex-1 py-2 text-center font-sans text-xs rounded-xl transition-all ${
              filter === 'missed'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-semibold border border-indigo-400/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Missed (0)
          </button>
        </div>

        {/* Call Logs Feed */}
        <section className="flex flex-col gap-2.5">
          {filteredLogs.map((log) => {
            const isMissed = log.status === 'missed';
            const targetName = log.callerId === user?.uid ? log.receiverName : log.callerName;
            const targetAvatar = log.callerId === user?.uid ? log.receiverAvatar : log.callerAvatar;
            const targetId = log.callerId === user?.uid ? log.receiverId : log.callerId;

            return (
              <div
                key={log.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 backdrop-blur-xl transition-all duration-200 border border-white/5 hover:border-indigo-500/30 shadow-lg"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      alt={targetName}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-white/10 bg-slate-800"
                      src={
                        targetAvatar ||
                        'https://lh3.googleusercontent.com/aida-public/AB6AXuBDmyBN5eU3P6Db79C6OvqxLwjGYPnL_j1bLCf1PSowDZQzYUqnMS9hLlcRJa-jSqVB0IMKREmx2xvZBUbo6-1KJv-4LAqHQC8kn9do6g4hwhkQVY-E7tSRb0ipQV1O1P5nhK872-Ir4eAWtch96NIhKmwh9byJj8aTF5uwIRIHFBol8cWq9bfpaYYQmWOgcT0sIeKOINsdtQstUSG_8Z8KP-VcryFeKFt-d7-e1n4Smya4lt3HFPevoA'
                      }
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span
                      className={`text-sm font-bold truncate ${
                        isMissed ? 'text-rose-400' : 'text-slate-100'
                      }`}
                    >
                      {targetName}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                      <span
                        className={`material-symbols-outlined text-[15px] ${
                          isMissed ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {log.direction === 'incoming'
                          ? 'call_received'
                          : log.direction === 'outgoing'
                          ? 'call_made'
                          : 'call_missed'}
                      </span>
                      <span className="font-mono text-[11px]">Open Relay TURN</span>
                      {log.duration > 0 && (
                        <span className="font-mono text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-emerald-400 border border-white/5">
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
                    className="w-10 h-10 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white flex items-center justify-center active:scale-95 transition-all shadow-md border border-indigo-500/30"
                    title={`Start ${log.type} call`}
                  >
                    <span className="material-symbols-outlined text-[19px]">
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
        className="fixed right-6 bottom-20 z-40 w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-600/50 active:scale-95 transition-transform"
      >
        <span className="material-symbols-outlined text-2xl">add_call</span>
      </button>

      {/* Quick Dialer Modal */}
      {dialerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
          <div className="relative w-full max-w-sm bg-slate-900/90 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-center border border-white/10">
            <button
              type="button"
              onClick={() => setDialerOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            <h3 className="text-base font-bold text-slate-100">Start WebRTC Call</h3>
            <p className="text-xs text-slate-400">Select an active node or contact</p>

            <input
              type="text"
              placeholder="@handle or name..."
              value={dialTarget}
              onChange={(e) => setDialTarget(e.target.value)}
              className="w-full bg-slate-950/70 text-slate-100 text-center font-mono text-sm py-2.5 rounded-2xl border border-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />

            {/* Online Contacts Selector */}
            <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto no-scrollbar">
              {users
                .filter((u) => u.uid !== user?.uid)
                .slice(0, 4)
                .map((u) => (
                  <div
                    key={u.id}
                    onClick={() => {
                      setDialTarget(u.name);
                    }}
                    className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-800/60 hover:bg-slate-800 cursor-pointer transition-colors text-left border border-white/5"
                  >
                    <img alt={u.name} src={u.avatarUrl} className="w-8 h-8 rounded-full object-cover bg-slate-700" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-slate-200 truncate">{u.name}</span>
                      <span className="text-[10px] text-emerald-400 font-mono">Online</span>
                    </div>
                  </div>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                type="button"
                onClick={() => {
                  const targetUser = users.find((u) => u.name === dialTarget || u.username === dialTarget);
                  const targetUid = targetUser?.uid || 'peer-id';
                  const targetName = targetUser?.name || dialTarget || 'Operative';
                  const targetAvatar = targetUser?.avatarUrl || '';

                  setDialerOpen(false);
                  handleStartCall(targetName, targetAvatar, targetUid, 'audio');
                }}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 font-semibold text-xs flex items-center justify-center gap-1 shadow-sm border border-white/5"
              >
                <span className="material-symbols-outlined text-sm">call</span>
                Audio Call
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetUser = users.find((u) => u.name === dialTarget || u.username === dialTarget);
                  const targetUid = targetUser?.uid || 'peer-id';
                  const targetName = targetUser?.name || dialTarget || 'Operative';
                  const targetAvatar = targetUser?.avatarUrl || '';

                  setDialerOpen(false);
                  handleStartCall(targetName, targetAvatar, targetUid, 'video');
                }}
                className="py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs flex items-center justify-center gap-1 shadow-lg shadow-indigo-600/30"
              >
                <span className="material-symbols-outlined text-sm">videocam</span>
                Video Call
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
