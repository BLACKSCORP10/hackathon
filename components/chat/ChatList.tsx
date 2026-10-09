'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { useAvatarPreview } from '@/context/AvatarPreviewContext';
import { FirestoreUser } from '@/lib/db';

export const ChatList: React.FC = () => {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { openAvatarPreview } = useAvatarPreview();
  const {
    chats,
    users,
    activeFilter,
    searchQuery,
    isLoadingChats,
    setActiveFilter,
    setSearchQuery,
    startChatWithUser,
  } = useChat();

  const [newChatModalOpen, setNewChatModalOpen] = useState(false);

  const filterTabs = [
    { id: 'all', label: 'All Chats', count: chats.length },
    { id: 'unread', label: 'Unread', count: chats.filter((c) => (c.unreadCount || 0) > 0).length },
    { id: 'direct', label: 'Direct' },
    { id: 'groups', label: 'Groups' },
    { id: 'pinned', label: 'Pinned', icon: 'push_pin' },
  ];

  // Other registered users excluding current authenticated user, filtered by search query
  const otherUsers = users
    .filter((u) => u.uid !== currentUser?.uid)
    .filter((u) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const displayName = (u.displayName || u.name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const username = (u.username || '').toLowerCase();
      return displayName.includes(q) || email.includes(q) || username.includes(q);
    });

  const handleStartChat = async (targetUser: FirestoreUser) => {
    try {
      const chatId = await startChatWithUser(targetUser);
      setNewChatModalOpen(false);
      router.push(`/chat/${chatId}`);
    } catch (e) {
      console.error('Error starting direct chat:', e);
    }
  };

  return (
    <div className="flex flex-col w-full gap-3">
      {/* Search & Instant Filter Bar */}
      <section className="w-full px-4 mt-1 flex flex-col gap-2.5">
        <div className="relative w-full flex items-center">
          <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[20px] pointer-events-none">
            search
          </span>
          <input
            className="w-full h-11 pl-11 pr-10 rounded-2xl bg-slate-900/70 backdrop-blur-md text-slate-100 placeholder:text-slate-500 font-sans text-sm shadow-inner focus:outline-none focus:ring-1 focus:ring-indigo-500/50 border border-white/10 transition-all"
            placeholder="Search chats, peer nodes, encrypted messages..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-slate-400 hover:text-slate-200 p-1 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          ) : (
            <button
              aria-label="Voice Search"
              className="absolute right-3 text-slate-400 hover:text-indigo-400 transition-colors p-1 flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[18px]">mic</span>
            </button>
          )}
        </div>

        {/* Filter Pills & Start Chat Button */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-1">
          <div className="flex items-center gap-1.5">
            {filterTabs.map((tab) => {
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl font-label-md text-xs flex-shrink-0 transition-all flex items-center gap-1.5 shadow-sm ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/40 font-semibold'
                      : 'bg-slate-900/60 backdrop-blur-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-white/5'
                  }`}
                >
                  {tab.icon && <span className="material-symbols-outlined text-[14px]">{tab.icon}</span>}
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={`ml-1 px-1.5 py-0.2 rounded-full font-label-sm text-[10px] ${
                        isActive ? 'bg-white/20 text-white' : 'bg-indigo-500/20 text-indigo-400'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setNewChatModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 shadow-lg shadow-indigo-600/25 border border-indigo-400/30 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-sm">add_comment</span>
            <span>New Chat</span>
          </button>
        </div>
      </section>

      {/* Direct Peer Nodes Online Tray */}
      {otherUsers.length > 0 && (
        <section className="w-full px-4">
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-3 border border-white/10 flex flex-col gap-2 shadow-xl">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                Live Network Nodes ({otherUsers.length})
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Tap node to connect</span>
            </div>
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
              {otherUsers.map((u) => (
                <button
                  key={u.uid}
                  onClick={() => handleStartChat(u)}
                  className="flex flex-col items-center gap-1 shrink-0 group focus:outline-none"
                >
                  <div
                    className="relative w-12 h-12 rounded-full p-0.5 ring-2 ring-white/10 group-hover:ring-indigo-500 hover:ring-indigo-400 transition-all duration-300 group-hover:scale-105 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      openAvatarPreview({
                        name: u.name,
                        avatarUrl: u.avatarUrl || u.photoURL || '',
                        username: u.username,
                        phone: u.phoneNumber || u.phone,
                        phoneNumber: u.phoneNumber || u.phone,
                        bio: u.statusText || u.bio || 'Encrypted Firestore Node · AES-256 Enabled',
                        statusText: u.isOnline ? 'Online' : 'Offline',
                        isOnline: u.isOnline,
                      });
                    }}
                    title="View high-resolution profile picture"
                  >
                    <img
                      alt={u.name}
                      className="w-full h-full rounded-full object-cover bg-slate-800"
                      src={
                        u.avatarUrl ||
                        'https://lh3.googleusercontent.com/aida-public/AB6AXuBfpDzwR2xsNv-nsDiy8QJclKg9hzaA5jd1kdt99vR7jPAQs7lZv5vgSDaWYMhGBFv8Ei5ezRYpDb_wAr3lxlYpw8f1qiS29oJ2P6AuVne7dMFwLILfdkLxBonarXmqdT-fgwxrcciUyl8XN29J9Qzkg1NNk2FlFeMbplyopjX2HVtWSHqczvwBI-yU2C6Lqtz9vj-edQeNxEaj3poxvGbhIAuyi2eO9XjNTiCQFGtefBCjPKttKXgFsA'
                      }
                    />
                    {u.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-slate-950 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                    )}
                  </div>
                  <span className="text-[11px] text-slate-300 font-medium max-w-[64px] truncate group-hover:text-white transition-colors">
                    {u.name.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Conversation Feeds List */}
      <section className="w-full px-4 flex flex-col gap-2 pb-24">
        {isLoadingChats ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500">
            <span className="material-symbols-outlined text-3xl animate-spin text-indigo-400">refresh</span>
            <span className="font-mono text-xs text-slate-400">Listening to Firestore real-time snapshots...</span>
          </div>
        ) : chats.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-center bg-slate-900/50 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
              <span className="material-symbols-outlined text-3xl">forum</span>
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="text-base font-bold text-slate-100">No active conversations yet</h4>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Connect with an online peer node above, or click New Chat to start a direct message thread.
              </p>
            </div>
            <button
              onClick={() => setNewChatModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              Start Conversation
            </button>
          </div>
        ) : (
          chats.map((chat) => {
            return (
              <Link
                key={chat.id}
                href={`/chat/${chat.id}`}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 backdrop-blur-xl transition-all duration-200 cursor-pointer group shadow-lg border border-white/5 hover:border-indigo-500/30 active:scale-[0.99]"
              >
                {/* Avatar with DP Pop-up trigger */}
                <div
                  className="relative flex-shrink-0 cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openAvatarPreview({
                      name: chat.name,
                      avatarUrl:
                        chat.avatarUrl ||
                        'https://lh3.googleusercontent.com/aida-public/AB6AXuCxCD8sPJkUytj0srEpy1ECOBUonoJ3PqNZPSrXiWTxt6SpkHPejcnHm16ly4E-Q9QOMFTrJjX5pZrRtke9jamOI5jlojAk9WXPez2DTqbG902Vab6czWQ0rvL4ODMXAkXx_7YA9LpEb11NHxeGQhNhfGSl7UEJ7bjFv-i1zD8IwwUjVQIBPo2zISSTTcMZzb3vl0XnarT7nys0q6dw16LInipxkxwCv-gFBMT1pl76pDOLgBj8Z_mkCw',
                      username: chat.name.toLowerCase().replace(/\s+/g, '_'),
                      phone: chat.phoneNumber || chat.phone,
                      phoneNumber: chat.phoneNumber || chat.phone,
                      bio: chat.roleBadge ? `Role: ${chat.roleBadge} · Verified E2EE Signal Node` : 'Direct peer encrypted conversation channel.',
                      statusText: chat.isOnline ? 'Online · Signal Active' : 'Offline',
                      isOnline: chat.isOnline,
                    });
                  }}
                  title="View high-resolution profile picture"
                >
                  <img
                    alt={chat.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-white/10 group-hover:ring-indigo-400/50 hover:scale-105 transition-all bg-slate-800 shadow-md"
                    src={
                      chat.avatarUrl ||
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuCxCD8sPJkUytj0srEpy1ECOBUonoJ3PqNZPSrXiWTxt6SpkHPejcnHm16ly4E-Q9QOMFTrJjX5pZrRtke9jamOI5jlojAk9WXPez2DTqbG902Vab6czWQ0rvL4ODMXAkXx_7YA9LpEb11NHxeGQhNhfGSl7UEJ7bjFv-i1zD8IwwUjVQIBPo2zISSTTcMZzb3vl0XnarT7nys0q6dw16LInipxkxwCv-gFBMT1pl76pDOLgBj8Z_mkCw'
                    }
                  />
                  {chat.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ring-slate-950 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                  )}
                </div>

                {/* Details */}
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm font-semibold text-slate-100 truncate group-hover:text-indigo-200 transition-colors">
                        {chat.name}
                      </span>
                      {chat.isVerified && (
                        <span
                          className="material-symbols-outlined text-indigo-400 text-[16px] flex-shrink-0"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          verified
                        </span>
                      )}
                      {chat.tag && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px] flex-shrink-0 border border-white/5">
                          {chat.tag}
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[11px] flex-shrink-0 text-slate-500">{chat.lastMessageTime}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs truncate text-slate-400 group-hover:text-slate-300">
                      {chat.lastMessage || 'Encrypted signal initialized'}
                    </p>

                    {(chat.unreadCount || 0) > 0 ? (
                      <span className="w-5 h-5 rounded-full bg-indigo-500 text-white font-mono text-xs flex items-center justify-center font-bold flex-shrink-0 shadow-lg shadow-indigo-500/50">
                        {chat.unreadCount}
                      </span>
                    ) : (
                      <span className="material-symbols-outlined text-[17px] text-slate-500 flex-shrink-0">done_all</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </section>

      {/* New Chat / Directory Modal */}
      {newChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900/90 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl flex flex-col gap-4 border border-white/10 max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-400 text-xl">contacts</span>
                <h3 className="text-base font-bold text-slate-100">Start Direct Conversation</h3>
              </div>
              <button
                onClick={() => setNewChatModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Select a peer node registered in Firestore to start a real-time encrypted chat thread.
            </p>

            <div className="flex flex-col gap-2 overflow-y-auto max-h-[360px] pr-1">
              {otherUsers.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No other users registered in Firestore yet. Open another tab or browser to create a second account!
                </div>
              ) : (
                otherUsers.map((u) => (
                  <div
                    key={u.uid}
                    onClick={() => handleStartChat(u)}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 backdrop-blur-md transition-colors cursor-pointer border border-white/5 hover:border-indigo-500/30"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="relative cursor-pointer group/avatar"
                        onClick={(e) => {
                          e.stopPropagation();
                          openAvatarPreview({
                            name: u.name,
                            avatarUrl:
                              u.avatarUrl ||
                              'https://lh3.googleusercontent.com/aida-public/AB6AXuBfpDzwR2xsNv-nsDiy8QJclKg9hzaA5jd1kdt99vR7jPAQs7lZv5vgSDaWYMhGBFv8Ei5ezRYpDb_wAr3lxlYpw8f1qiS29oJ2P6AuVne7dMFwLILfdkLxBonarXmqdT-fgwxrcciUyl8XN29J9Qzkg1NNk2FlFeMbplyopjX2HVtWSHqczvwBI-yU2C6Lqtz9vj-edQeNxEaj3poxvGbhIAuyi2eO9XjNTiCQFGtefBCjPKttKXgFsA',
                            username: u.username,
                            phone: u.phoneNumber || u.phone,
                            phoneNumber: u.phoneNumber || u.phone,
                            bio: u.statusText || u.bio || 'Encrypted Firestore Node · AES-256 Enabled',
                            statusText: u.isOnline ? 'Online' : 'Offline',
                            isOnline: u.isOnline,
                          });
                        }}
                        title="View profile picture"
                      >
                        <img
                          alt={u.name}
                          className="w-10 h-10 rounded-full object-cover bg-slate-700 ring-2 ring-white/10 group-hover/avatar:ring-indigo-400 transition-all shadow-sm"
                          src={
                            u.avatarUrl ||
                            'https://lh3.googleusercontent.com/aida-public/AB6AXuBfpDzwR2xsNv-nsDiy8QJclKg9hzaA5jd1kdt99vR7jPAQs7lZv5vgSDaWYMhGBFv8Ei5ezRYpDb_wAr3lxlYpw8f1qiS29oJ2P6AuVne7dMFwLILfdkLxBonarXmqdT-fgwxrcciUyl8XN29J9Qzkg1NNk2FlFeMbplyopjX2HVtWSHqczvwBI-yU2C6Lqtz9vj-edQeNxEaj3poxvGbhIAuyi2eO9XjNTiCQFGtefBCjPKttKXgFsA'
                          }
                        />
                        {u.isOnline && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900 shadow-sm" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-100">{u.name}</span>
                        <span className="text-xs text-slate-400 font-mono">@{u.username}</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-indigo-400 text-lg">chat</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
