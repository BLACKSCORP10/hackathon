'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  collection,
  collectionGroup,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  setDoc,
  serverTimestamp,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  FirestoreChat,
  FirestoreMessage,
  FirestoreUser,
  sendFirestoreMessage,
  deleteFirestoreMessage,
  markFirestoreMessagesAsRead,
  addFirestoreReaction,
  createOrGetDirectChat,
  getDirectChatId,
  updateFirestoreUserProfile,
} from '@/lib/db';
import { useAuth } from './AuthContext';

interface ChatContextType {
  chats: FirestoreChat[];
  users: FirestoreUser[];
  activeChat: FirestoreChat | null;
  activeChatId: string | null;
  messages: FirestoreMessage[];
  isLoadingChats: boolean;
  isLoadingMessages: boolean;
  isAiThinking: boolean;
  activeFilter: string;
  searchQuery: string;
  unreadTotal: number;
  setActiveFilter: (filter: string) => void;
  setSearchQuery: (query: string) => void;
  selectChat: (chatId: string) => void;
  startChatWithUser: (targetUser: FirestoreUser) => Promise<string>;
  sendMessage: (
    content: string,
    type?: 'text' | 'image' | 'voice' | 'code' | 'file' | 'ai',
    mediaUrl?: string,
    mediaMeta?: any
  ) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  markAsRead: (chatId?: string) => Promise<void>;
  reactToMessage: (messageId: string, emoji: string) => Promise<void>;
  updateProfile: (profile: {
    name?: string;
    bio?: string;
    statusText?: string;
    avatarUrl?: string;
    username?: string;
    phone?: string;
  }) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

function formatFirestoreTimestamp(ts: any): string {
  if (!ts) {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (ts instanceof Timestamp) {
    return ts.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (ts?.toDate) {
    return ts.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (typeof ts === 'string' || typeof ts === 'number') {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return 'Just now';
}

function parseRawTimestamp(ts: any): number {
  if (!ts) return Date.now();
  if (ts instanceof Timestamp) return ts.toMillis();
  if (ts?.toMillis) return ts.toMillis();
  if (typeof ts === 'number') return ts;
  if (typeof ts === 'string') return new Date(ts).getTime();
  return Date.now();
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [allChats, setAllChats] = useState<FirestoreChat[]>([]);
  const [allUsers, setAllUsers] = useState<FirestoreUser[]>([]);
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeChat, setActiveChat] = useState<FirestoreChat | null>(null);
  const [messages, setMessages] = useState<FirestoreMessage[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Real-Time Listener for All Active Users in Firestore
  useEffect(() => {
    const usersCollectionRef = collection(db, 'users');
    const unsubscribeUsers = onSnapshot(usersCollectionRef, (snapshot) => {
      const loadedUsers = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as FirestoreUser[];
      setAllUsers(loadedUsers);
    });

    return () => {
      unsubscribeUsers();
    };
  }, []);

  // 2. Real-Time Dynamic Unread Messages Tracker for current authenticated user
  useEffect(() => {
    if (!user?.uid) {
      setUnreadMap({});
      return;
    }

    try {
      const messagesGroupRef = collectionGroup(db, 'messages');
      const q = query(messagesGroupRef, where('receiverId', '==', user.uid));
      const unsubscribeUnread = onSnapshot(
        q,
        (snapshot) => {
          const counts: Record<string, number> = {};
          snapshot.docs.forEach((docSnap) => {
            const data = docSnap.data();
            // Dynamically count unread messages: receiverId === currentUserId && !read
            const isUnread =
              data.receiverId === user.uid &&
              !data.read &&
              data.status !== 'read';

            if (isUnread) {
              const cId = data.chatId || docSnap.ref.parent.parent?.id;
              if (cId) {
                counts[cId] = (counts[cId] || 0) + 1;
              }
            }
          });
          setUnreadMap(counts);
        },
        (err) => {
          console.warn('Unread collectionGroup note:', err);
        }
      );

      return () => {
        unsubscribeUnread();
      };
    } catch (err) {
      console.warn('collectionGroup init exception:', err);
    }
  }, [user?.uid]);

  // 3. Real-Time Listener for Private 1-on-1 Direct Chats for current user
  useEffect(() => {
    if (!user?.uid) {
      setAllChats([]);
      return;
    }

    setIsLoadingChats(true);
    const chatsCollectionRef = collection(db, 'chats');
    const q = query(
      chatsCollectionRef,
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribeChats = onSnapshot(
      q,
      (snapshot) => {
        const loadedChats: FirestoreChat[] = snapshot.docs.map((d) => {
          const data = d.data();
          const otherParticipantId = data.participants?.find((p: string) => p !== user.uid);
          const otherUser = allUsers.find((u) => u.uid === otherParticipantId);

          const chatName =
            data.type === 'group'
              ? data.name
              : otherUser?.name || otherUser?.displayName || data.name || 'Direct Message';
          const chatAvatar =
            data.type === 'group'
              ? data.avatarUrl
              : otherUser?.avatarUrl || otherUser?.photoURL || data.avatarUrl;

          const calculatedUnread =
            unreadMap[d.id] !== undefined
              ? unreadMap[d.id]
              : data.unreadCount || 0;

          return {
            id: d.id,
            ...data,
            name: chatName,
            avatarUrl: chatAvatar,
            unreadCount: calculatedUnread,
            isOnline: otherUser ? otherUser.isOnline : data.isOnline,
            lastMessageTime: formatFirestoreTimestamp(data.lastMessageTime || data.updatedAt),
          } as FirestoreChat;
        });

        // Sort descending by updated timestamp
        loadedChats.sort((a, b) => {
          const timeA = parseRawTimestamp(a.updatedAt || a.lastMessageTime);
          const timeB = parseRawTimestamp(b.updatedAt || b.lastMessageTime);
          return timeB - timeA;
        });

        setAllChats(loadedChats);
        setIsLoadingChats(false);
      },
      (error) => {
        console.warn('Chats listener error:', error);
        setIsLoadingChats(false);
      }
    );

    return () => {
      unsubscribeChats();
    };
  }, [user?.uid, allUsers, unreadMap]);

  // 3. Real-Time Multi-Device Listener for Selected 1-on-1 Chat Messages
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }

    setIsLoadingMessages(true);

    // Sync activeChat metadata
    const chatDocRef = doc(db, 'chats', activeChatId);
    const unsubscribeChatDoc = onSnapshot(chatDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const otherParticipantId = data.participants?.find((p: string) => p !== user?.uid);
        const otherUser = allUsers.find((u) => u.uid === otherParticipantId);

        setActiveChat({
          id: snap.id,
          ...data,
          name: data.type === 'group' ? data.name : otherUser?.name || data.name || 'Contact',
          avatarUrl: data.type === 'group' ? data.avatarUrl : otherUser?.avatarUrl || data.avatarUrl,
          isOnline: otherUser ? otherUser.isOnline : data.isOnline,
          lastMessageTime: formatFirestoreTimestamp(data.lastMessageTime),
        } as FirestoreChat);
      } else {
        // Chat document doesn't exist yet in Firestore; parse deterministic ID [u1, u2]
        const parts = activeChatId.split('_');
        const otherId = parts.find((p) => p !== user?.uid);
        const otherUser = allUsers.find((u) => u.uid === otherId);

        if (otherUser) {
          setActiveChat({
            id: activeChatId,
            type: 'direct',
            name: otherUser.name,
            avatarUrl: otherUser.avatarUrl,
            roleBadge: otherUser.role || 'Operative',
            isOnline: otherUser.isOnline,
            participants: [user?.uid || '', otherUser.uid],
          } as FirestoreChat);
        }
      }
    });

    // Query messages sub-collection strictly ordered by createdAt ascending
    const messagesRef = collection(db, 'chats', activeChatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribeMessages = onSnapshot(
      q,
      (snapshot) => {
        const currentUid = user?.uid || '';
        let hasUnreadForMe = false;

        const loadedMsgs: FirestoreMessage[] = snapshot.docs.map((d) => {
          const data = d.data();
          const isSelf = data.senderId === currentUid;
          const isAi = data.isAi || data.senderId === 'gemini-ai' || data.type === 'ai';

          if (!isSelf && data.status !== 'read') {
            hasUnreadForMe = true;
          }

          const msgTs = data.createdAt || data.timestamp;

          return {
            id: d.id,
            chatId: activeChatId,
            senderId: data.senderId,
            senderName: data.senderName || (isAi ? 'Gemini AI' : 'Anonymous'),
            senderAvatar:
              data.senderAvatar ||
              (isAi
                ? 'https://cdn.worldvectorlogo.com/logos/google-gemini-icon.svg'
                : 'https://lh3.googleusercontent.com/aida-public/AB6AXuBfpDzwR2xsNv-nsDiy8QJclKg9hzaA5jd1kdt99vR7jPAQs7lZv5vgSDaWYMhGBFv8Ei5ezRYpDb_wAr3lxlYpw8f1qiS29oJ2P6AuVne7dMFwLILfdkLxBonarXmqdT-fgwxrcciUyl8XN29J9Qzkg1NNk2FlFeMbplyopjX2HVtWSHqczvwBI-yU2C6Lqtz9vj-edQeNxEaj3poxvGbhIAuyi2eO9XjNTiCQFGtefBCjPKttKXgFsA'),
            receiverId: data.receiverId,
            content: data.content || data.text || '',
            text: data.text || data.content || '',
            type: data.type || (isAi ? 'ai' : 'text'),
            mediaUrl: data.mediaUrl,
            mediaType: data.mediaType,
            mediaMeta: data.mediaMeta,
            status: data.status || 'delivered',
            reactions: data.reactions || {},
            replyTo: data.replyTo,
            timestamp: formatFirestoreTimestamp(msgTs),
            createdAt: parseRawTimestamp(msgTs),
            isSelf,
            isAi,
          };
        });

        // Ensure strictly chronological sorting (oldest first, newest last)
        loadedMsgs.sort((a, b) => a.createdAt - b.createdAt);

        setMessages(loadedMsgs);
        setIsLoadingMessages(false);

        // Mark incoming messages as read automatically
        if (hasUnreadForMe && currentUid) {
          markFirestoreMessagesAsRead(activeChatId, currentUid);
        }
      },
      (error) => {
        console.warn('Messages snapshot listener error:', error);
        setIsLoadingMessages(false);
      }
    );

    return () => {
      unsubscribeChatDoc();
      unsubscribeMessages();
    };
  }, [activeChatId, user?.uid, allUsers]);

  const selectChat = (chatId: string) => {
    setActiveChatId(chatId);
    if (user?.uid) {
      markFirestoreMessagesAsRead(chatId, user.uid);
    }
  };

  const markAsRead = async (chatId?: string) => {
    const targetChatId = chatId || activeChatId;
    if (targetChatId && user?.uid) {
      await markFirestoreMessagesAsRead(targetChatId, user.uid);
    }
  };

  const startChatWithUser = async (targetUser: FirestoreUser): Promise<string> => {
    if (!user) throw new Error('Must be logged in');
    const createdChat = await createOrGetDirectChat(user, targetUser);
    setActiveChatId(createdChat.id);
    setActiveChat(createdChat);
    return createdChat.id;
  };

  const updateProfile = async (profile: {
    name?: string;
    bio?: string;
    statusText?: string;
    avatarUrl?: string;
    username?: string;
    phone?: string;
  }) => {
    if (!user) throw new Error('Must be authenticated');
    await updateFirestoreUserProfile(user.uid, profile);
  };

  const sendMessage = async (
    content: string,
    type: 'text' | 'image' | 'voice' | 'code' | 'file' | 'ai' = 'text',
    mediaUrl?: string,
    mediaMeta?: any
  ) => {
    if (!activeChatId || !user) return;

    try {
      const parts = activeChatId.split('_');
      const receiverId =
        parts.find((p) => p !== user.uid) ||
        activeChat?.participants?.find((p) => p !== user.uid) ||
        '';

      await sendFirestoreMessage(activeChatId, {
        senderId: user.uid,
        senderName: user.name || user.username || 'Nexus Operative',
        senderAvatar: user.avatarUrl,
        receiverId,
        content,
        type,
        mediaUrl,
        mediaMeta,
        status: 'delivered',
      });

      // Gemini AI Integration (@gemini)
      const trimmed = content.trim();
      const isGeminiTrigger =
        trimmed.startsWith('@gemini') ||
        trimmed.startsWith('@ai') ||
        trimmed.toLowerCase().startsWith('gemini,');

      if (isGeminiTrigger && activeChatId) {
        setIsAiThinking(true);

        // 1. Extract the text after @gemini
        const userQuery = trimmed.replace(/^@(gemini|ai)\s*/i, '').replace(/^gemini,\s*/i, '').trim();

        try {
          // 2. Send POST request to /api/gemini
          const res = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: userQuery || 'Hello',
              roomContext: messages.slice(-15),
              history: messages.slice(-15),
              roomName: activeChat?.name || 'Direct Chat',
            }),
          });

          const data = await res.json();
          const responseText = data?.text || (data?.error ? `⚠️ ${data.error}` : null);

          // 3. Save data.text directly into Firestore under Gemini AI
          if (responseText) {
            await sendFirestoreMessage(activeChatId, {
              senderId: 'gemini-ai',
              senderName: 'Gemini AI',
              senderAvatar: 'https://cdn.worldvectorlogo.com/logos/google-gemini-icon.svg',
              receiverId: user.uid,
              content: responseText,
              type: 'ai',
              status: 'delivered',
            });
          }
        } catch (err) {
          console.error('Error executing Gemini API call:', err);
        } finally {
          setIsAiThinking(false);
        }
      }
    } catch (err) {
      console.error('Error sending message to Firestore:', err);
      throw err;
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!activeChatId) return;
    try {
      await deleteFirestoreMessage(activeChatId, messageId);
    } catch (err) {
      console.error('Error deleting message from Firestore:', err);
      throw err;
    }
  };

  const reactToMessage = async (messageId: string, emoji: string) => {
    if (!activeChatId) return;
    try {
      await addFirestoreReaction(activeChatId, messageId, emoji);
    } catch (err) {
      console.error('Error reacting to message in Firestore:', err);
    }
  };

  // Filtered chats based on query & categories
  let filteredChats = allChats;

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredChats = filteredChats.filter((c) => {
      const nameMatch = (c.name || '').toLowerCase().includes(q);
      const lastMsgMatch = (c.lastMessage || '').toLowerCase().includes(q);
      const tagMatch = (c.tag || '').toLowerCase().includes(q);
      const participantMatch = allUsers.some(
        (u) =>
          c.participants?.includes(u.uid) &&
          ((u.displayName || u.name || '').toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q) ||
            (u.username || '').toLowerCase().includes(q))
      );
      return nameMatch || lastMsgMatch || tagMatch || participantMatch;
    });
  }

  if (activeFilter === 'unread') {
    filteredChats = filteredChats.filter((c) => (c.unreadCount || 0) > 0);
  } else if (activeFilter === 'direct') {
    filteredChats = filteredChats.filter((c) => c.type === 'direct');
  } else if (activeFilter === 'groups') {
    filteredChats = filteredChats.filter((c) => c.type === 'group');
  } else if (activeFilter === 'pinned') {
    filteredChats = filteredChats.filter((c) => c.isPinned);
  }

  // Calculate unread total dynamically across all chats for the current user
  const unreadTotal = Object.values(unreadMap).reduce((acc, count) => acc + count, 0);

  return (
    <ChatContext.Provider
      value={{
        chats: filteredChats,
        users: allUsers,
        activeChat,
        activeChatId,
        messages,
        isLoadingChats,
        isLoadingMessages,
        isAiThinking,
        activeFilter,
        searchQuery,
        unreadTotal,
        setActiveFilter,
        setSearchQuery,
        selectChat,
        startChatWithUser,
        sendMessage,
        deleteMessage,
        markAsRead,
        reactToMessage,
        updateProfile,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
