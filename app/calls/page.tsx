'use client';

import React, { useState } from 'react';
import { TopHeader } from '@/components/navigation/TopHeader';
import { BottomNav } from '@/components/navigation/BottomNav';

export default function CallLogsPage() {
  const [filter, setFilter] = useState<'all' | 'missed'>('all');
  const [dialerOpen, setDialerOpen] = useState(false);

  const callLogs = [
    {
      id: 'c1',
      name: 'Sarah Chen',
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBDmyBN5eU3P6Db79C6OvqxLwjGYPnL_j1bLCf1PSowDZQzYUqnMS9hLlcRJa-jSqVB0IMKREmx2xvZBUbo6-1KJv-4LAqHQC8kn9do6g4hwhkQVY-E7tSRb0ipQV1O1P5nhK872-Ir4eAWtch96NIhKmwh9byJj8aTF5uwIRIHFBol8cWq9bfpaYYQmWOgcT0sIeKOINsdtQstUSG_8Z8KP-VcryFeKFt-d7-e1n4Smya4lt3HFPevoA',
      type: 'video',
      direction: 'incoming',
      time: 'Today, 10:42 AM',
      duration: '14m 20s',
      status: 'connected',
    },
    {
      id: 'c2',
      name: 'Marcus Brody (Lead Arch)',
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuATLtKtpLjWUaQgne0FgWsnraj0JAi5pVEhRBAb7SIJwayS10JYxX-ulrVNWiK0hzS_yfwf7UM2pmvILbuHiSeZcSPP_lEzTu1XitSRn9rLR9ShfgPWm3NMTBXOhfLVQgUm5pfN5Qz7zEdcg8KuSSZcr9-KbhbXnop6p4sxeXrldcKtIygcdm-w3H__rD-MzwAxvvtDc0HI9W1Vy5UKbsg-tubf43cPb2PkUVAsOeSu8ZN-qFMkATvg0w',
      type: 'audio',
      direction: 'outgoing',
      time: 'Yesterday, 06:15 PM',
      duration: '8m 45s',
      status: 'connected',
    },
    {
      id: 'c3',
      name: 'Elena Rostova',
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCfICtjI920h80Hqhf0migfeu5gq_CgUCGKlGqutAsVX1VW6LoJP4MbYh2fIql3PalkzUj7rtSlWvTsWBIfO8QP_xwziI0gF-f7-9w0TpP8ttt9p2iBDYmk7K_XtNR9BNyzuq8zjQhIhh3lb7EQCFNzplNDbcaJBMaOtIOJXAd54U0yWo_ox--RAJNVC8gfkoGVua0bfFp_pjYvHhTLGdTDWJ76b_pGtG4UQ0-5X8Fq8BjAntEtwxd-tA',
      type: 'audio',
      direction: 'missed',
      time: 'Oct 23, 04:10 PM',
      duration: '0s',
      status: 'missed',
    }
  ];

  const filteredLogs = filter === 'missed' ? callLogs.filter(c => c.status === 'missed') : callLogs;

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <TopHeader title="NexusChat" subtitle="Encrypted Calls" />

      <main className="flex-1 flex flex-col pt-16 pb-24 max-w-4xl mx-auto w-full px-4 py-4 gap-4">
        {/* Filter Switcher */}
        <div className="w-full p-1 bg-surface-container-lowest rounded-xl flex items-center shadow-inner border border-surface-container-highest/40">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-1.5 text-center font-label-md text-xs rounded-lg transition-all ${
              filter === 'all'
                ? 'bg-primary-container text-on-primary-container shadow-md font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            All Calls ({callLogs.length})
          </button>
          <button
            onClick={() => setFilter('missed')}
            className={`flex-1 py-1.5 text-center font-label-md text-xs rounded-lg transition-all ${
              filter === 'missed'
                ? 'bg-primary-container text-on-primary-container shadow-md font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Missed (1)
          </button>
        </div>

        {/* Call Logs Feed */}
        <section className="flex flex-col gap-2">
          {filteredLogs.map(log => {
            const isMissed = log.status === 'missed';
            return (
              <div
                key={log.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors border border-surface-container-highest/30 shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      alt={log.name}
                      className="w-11 h-11 rounded-full object-cover ring-1 ring-surface-container-highest"
                      src={log.avatarUrl}
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className={`font-headline-md text-sm font-semibold truncate ${
                      isMissed ? 'text-error' : 'text-on-surface'
                    }`}>
                      {log.name}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-on-surface-variant mt-0.5">
                      <span className={`material-symbols-outlined text-[14px] ${
                        isMissed ? 'text-error' : 'text-tertiary'
                      }`}>
                        {log.direction === 'incoming'
                          ? 'call_received'
                          : log.direction === 'outgoing'
                          ? 'call_made'
                          : 'call_missed'}
                      </span>
                      <span>{log.time}</span>
                      {log.duration !== '0s' && (
                        <span className="font-mono text-[10px] bg-surface-container px-1.5 py-0.2 rounded">
                          {log.duration}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => alert(`Starting encrypted call with ${log.name}`)}
                    className="w-9 h-9 rounded-full bg-surface-container-high hover:bg-surface-bright flex items-center justify-center text-primary active:scale-95 transition-all"
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
        onClick={() => setDialerOpen(true)}
        className="fixed right-6 bottom-20 z-40 w-14 h-14 rounded-2xl bg-gradient-to-tr from-secondary-container to-primary-container text-on-primary flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
      >
        <span className="material-symbols-outlined text-2xl">add_call</span>
      </button>

      {/* Quick Dialer Modal */}
      {dialerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-xs bg-surface-container rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-center border border-surface-container-highest">
            <button
              onClick={() => setDialerOpen(false)}
              className="absolute top-4 right-4 text-outline hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            <h3 className="font-headline-md text-on-surface font-semibold">Start Secure Call</h3>
            <p className="text-xs text-on-surface-variant">Enter handle or select node</p>

            <input
              type="text"
              placeholder="@handle or phone..."
              className="w-full bg-surface-container-low text-on-surface text-center font-mono text-sm py-2.5 rounded-xl border border-surface-container-highest focus:outline-none focus:border-primary"
            />

            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={() => { setDialerOpen(false); alert('Connecting encrypted audio mesh...'); }}
                className="py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-bright text-primary font-label-md text-xs font-semibold flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">call</span>
                Audio
              </button>
              <button
                onClick={() => { setDialerOpen(false); alert('Connecting encrypted video stream...'); }}
                className="py-2.5 rounded-xl bg-primary-container text-on-primary-container font-label-md text-xs font-semibold flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">videocam</span>
                Video
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
