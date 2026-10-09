'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { FirestoreUser } from '@/lib/db';

export const ChatList: React.FC = () => {
  const router = useRouter();
  const { user: currentUser } = useAuth();
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

  // Other registered users excluding current authenticated user
  const otherUsers = users.filter((u) => u.uid !== currentUser?.uid);

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
      <section className="w-full px-space-md mt-1 flex flex-col gap-2.5">
        <div className="relative w-full flex items-center">
          <span className="material-symbols-outlined absolute left-3.5 text-outline text-[20px] pointer-events-none">
            search
          </span>
          <input
            className="w-full h-11 pl-11 pr-10 rounded-xl bg-surface-container-low text-on-surface placeholder:text-outline font-body-md text-body-md shadow-sm focus:outline-none focus:bg-surface-container border border-surface-container-highest/40 transition-all"
            placeholder="Search Firestore chats, messages, handles..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery ? (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 text-outline hover:text-on-surface p-1">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          ) : (
            <button
              aria-label="Voice Search"
              className="absolute right-3 text-outline hover:text-on-surface transition-colors p-1 flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[18px]">mic</span>
            </button>
          )}
        </div>

        {/* Filter Pills & Start Chat Button */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-1">
          <div className="flex items-center gap-2">
            {filterTabs.map((tab) => {
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-full font-label-md text-label-md flex-shrink-0 transition-all flex items-center gap-1 shadow-sm ${
                    isActive
                      ? 'bg-primary-container text-on-primary-container shadow-md scale-100'
                      : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  {tab.icon && <span className="material-symbols-outlined text-[14px]">{tab.icon}</span>}
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={`ml-1 px-1.5 py-0.2 rounded-full font-label-sm text-label-sm ${
                        isActive ? 'bg-on-primary-container/20 text-on-primary-container' : 'bg-primary/20 text-primary'
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
            className="px-3 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-bright text-primary text-xs font-semibold flex items-center gap-1.5 shrink-0 border border-primary/30 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-sm">add_comment</span>
            <span>New Chat</span>
          </button>
        </div>
      </section>

      {/* Direct Peer Nodes Online Tray */}
      {otherUsers.length > 0 && (
        <section className="w-full px-space-md">
          <div className="bg-surface-container-low/60 rounded-xl p-3 border border-surface-container-highest/30 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-on-surface-variant font-medium">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
                Live Network Nodes ({otherUsers.length})
              </span>
              <span className="text-[10px] text-outline">Tap node to open direct chat</span>
            </div>
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
              {otherUsers.map((u) => (
                <button
                  key={u.uid}
                  onClick={() => handleStartChat(u)}
                  className="flex flex-col items-center gap-1 shrink-0 group focus:outline-none"
                >
                  <div className="relative w-11 h-11 rounded-full p-0.5 ring-2 ring-surface-container-highest group-hover:ring-primary transition-all">
                    <img
                      alt={u.name}
                      className="w-full h-full rounded-full object-cover"
                      src={
                        u.avatarUrl ||
                        'https://lh3.googleusercontent.com/aida-public/AB6AXuBfpDzwR2xsNv-nsDiy8QJclKg9hzaA5jd1kdt99vR7jPAQs7lZv5vgSDaWYMhGBFv8Ei5ezRYpDb_wAr3lxlYpw8f1qiS29oJ2P6AuVne7dMFwLILfdkLxBonarXmqdT-fgwxrcciUyl8XN29J9Qzkg1NNk2FlFeMbplyopjX2HVtWSHqczvwBI-yU2C6Lqtz9vj-edQeNxEaj3poxvGbhIAuyi2eO9XjNTiCQFGtefBCjPKttKXgFsA'
                      }
                    />
                    {u.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-tertiary ring-2 ring-surface" />
                    )}
                  </div>
                  <span className="text-[11px] text-on-surface font-medium max-w-[60px] truncate">{u.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Conversation Feeds List */}
      <section className="w-full px-space-md flex flex-col gap-1.5 pb-24">
        {isLoadingChats ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-outline">
            <span className="material-symbols-outlined text-3xl animate-spin">refresh</span>
            <span className="text-body-sm font-mono text-xs">Listening to Firestore real-time channel snapshots...</span>
          </div>
        ) : chats.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-center bg-surface-container-low/40 rounded-2xl p-6 border border-surface-container-highest/30">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-2xl">forum</span>
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="font-headline-md text-sm font-semibold text-on-surface">No active conversations yet</h4>
              <p className="text-xs text-on-surface-variant max-w-xs">
                Start a direct conversation with a live node above, or click New Chat to initialize an encrypted thread.
              </p>
            </div>
            <button
              onClick={() => setNewChatModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-primary-container text-on-primary-container text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              Start Conversation
            </button>
          </div>
        ) : (
          chats.map((chat) => {
            const isGroup = chat.type === 'group';
            return (
              <Link
                key={chat.id}
                href={`/chat/${chat.id}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all cursor-pointer group shadow-sm border border-transparent hover:border-surface-container-highest/60"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <img
                    alt={chat.name}
                    className="w-12 h-12 rounded-full object-cover ring-1 ring-surface-container-highest"
                    src={
                      chat.avatarUrl ||
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuCxCD8sPJkUytj0srEpy1ECOBUonoJ3PqNZPSrXiWTxt6SpkHPejcnHm16ly4E-Q9QOMFTrJjX5pZrRtke9jamOI5jlojAk9WXPez2DTqbG902Vab6czWQ0rvL4ODMXAkXx_7YA9LpEb11NHxeGQhNhfGSl7UEJ7bjFv-i1zD8IwwUjVQIBPo2zISSTTcMZzb3vl0XnarT7nys0q6dw16LInipxkxwCv-gFBMT1pl76pDOLgBj8Z_mkCw'
                    }
                  />
                  {chat.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-tertiary ring-2 ring-surface-container-low" />
                  )}
                </div>

                {/* Details */}
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-headline-md text-headline-md text-on-surface truncate">{chat.name}</span>
                      {chat.isVerified && (
                        <span
                          className="material-symbols-outlined text-primary text-[17px] flex-shrink-0"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          verified
                        </span>
                      )}
                      {chat.tag && (
                        <span className="px-1.5 py-0.2 rounded bg-surface-container text-on-surface-variant font-mono text-xs flex-shrink-0">
                          {chat.tag}
                        </span>
                      )}
                    </div>
                    <span className="font-label-sm text-label-sm flex-shrink-0 text-outline">{chat.lastMessageTime}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className="font-body-sm text-body-sm truncate text-on-surface-variant">
                      {chat.lastMessage || 'Encrypted signal initialized'}
                    </p>

                    {(chat.unreadCount || 0) > 0 ? (
                      <span className="w-5 h-5 rounded-full bg-primary-container text-on-primary-container font-label-sm text-xs flex items-center justify-center font-bold flex-shrink-0 shadow-sm">
                        {chat.unreadCount}
                      </span>
                    ) : (
                      <span className="material-symbols-outlined text-[17px] text-outline flex-shrink-0">done_all</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-surface-container rounded-3xl p-6 shadow-2xl flex flex-col gap-4 border border-surface-container-highest max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-surface-container-highest/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">contacts</span>
                <h3 className="font-headline-md text-on-surface font-semibold">Start Direct Conversation</h3>
              </div>
              <button onClick={() => setNewChatModalOpen(false)} className="text-outline hover:text-on-surface p-1">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <p className="text-xs text-on-surface-variant">
              Select a peer node registered in Firestore to start a real-time AES-256 encrypted chat thread.
            </p>

            <div className="flex flex-col gap-2 overflow-y-auto max-h-[360px] pr-1">
              {otherUsers.length === 0 ? (
                <div className="py-8 text-center text-outline text-xs">
                  No other users registered in Firestore yet. Open another tab or browser to create a second account!
                </div>
              ) : (
                otherUsers.map((u) => (
                  <div
                    key={u.uid}
                    onClick={() => handleStartChat(u)}
                    className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors cursor-pointer border border-surface-container-highest/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          alt={u.name}
                          className="w-10 h-10 rounded-full object-cover"
                          src={
                            u.avatarUrl ||
                            'https://lh3.googleusercontent.com/aida-public/AB6AXuBfpDzwR2xsNv-nsDiy8QJclKg9hzaA5jd1kdt99vR7jPAQs7lZv5vgSDaWYMhGBFv8Ei5ezRYpDb_wAr3lxlYpw8f1qiS29oJ2P6AuVne7dMFwLILfdkLxBonarXmqdT-fgwxrcciUyl8XN29J9Qzkg1NNk2FlFeMbplyopjX2HVtWSHqczvwBI-yU2C6Lqtz9vj-edQeNxEaj3poxvGbhIAuyi2eO9XjNTiCQFGtefBCjPKttKXgFsA'
                          }
                        />
                        {u.isOnline && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-tertiary ring-1 ring-surface" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-on-surface">{u.name}</span>
                        <span className="text-xs text-on-surface-variant font-mono">@{u.username}</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-primary text-lg">chat</span>
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
