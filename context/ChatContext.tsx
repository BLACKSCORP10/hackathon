'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  collection,
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
  activeFilter: string;
  searchQuery: string;
  unreadTotal: number;
  setActiveFilter: (filter: string) => void;
  setSearchQuery: (query: string) => void;
  selectChat: (chatId: string) => void;
  startChatWithUser: (targetUser: FirestoreUser) => Promise<string>;
  sendMessage: (
    content: string,
    type?: 'text' | 'image' | 'voice' | 'code' | 'file',
    mediaUrl?: string,
    mediaMeta?: any
  ) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  markAsRead: (chatId?: string) => Promise<void>;
  reactToMessage: (messageId: string, emoji: string) => Promise<void>;
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

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [allChats, setAllChats] = useState<FirestoreChat[]>([]);
  const [allUsers, setAllUsers] = useState<FirestoreUser[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeChat, setActiveChat] = useState<FirestoreChat | null>(null);
  const [messages, setMessages] = useState<FirestoreMessage[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Real-Time Listener for All Active Chats in Firestore
  useEffect(() => {
    setIsLoadingChats(true);
    const chatsCollectionRef = collection(db, 'chats');
    const q = query(chatsCollectionRef, orderBy('updatedAt', 'desc'));

    const unsubscribeChats = onSnapshot(
      q,
      (snapshot) => {
        const loadedChats: FirestoreChat[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            lastMessageTime: formatFirestoreTimestamp(data.lastMessageTime || data.updatedAt),
          } as FirestoreChat;
        });

        setAllChats(loadedChats);
        setIsLoadingChats(false);
      },
      (error) => {
        console.warn('Chats listener error (collection may be initializing):', error);
        setIsLoadingChats(false);
      }
    );

    // 2. Real-Time Listener for All Users in Firestore (for direct messaging)
    const usersCollectionRef = collection(db, 'users');
    const unsubscribeUsers = onSnapshot(usersCollectionRef, (snapshot) => {
      const loadedUsers = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as FirestoreUser[];
      setAllUsers(loadedUsers);
    });

    return () => {
      unsubscribeChats();
      unsubscribeUsers();
    };
  }, []);

  // 3. Real-Time Multi-Device Listener for Selected Chat Messages
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }

    setIsLoadingMessages(true);

    // Also sync activeChat metadata
    const chatDocRef = doc(db, 'chats', activeChatId);
    const unsubscribeChatDoc = onSnapshot(chatDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setActiveChat({
          id: snap.id,
          ...data,
          lastMessageTime: formatFirestoreTimestamp(data.lastMessageTime),
        } as FirestoreChat);
      }
    });

    // Query messages sub-collection ordered by timestamp asc
    const messagesRef = collection(db, 'chats', activeChatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribeMessages = onSnapshot(
      q,
      (snapshot) => {
        const currentUid = user?.uid || '';
        let hasUnreadForMe = false;

        const loadedMsgs: FirestoreMessage[] = snapshot.docs.map((d) => {
          const data = d.data();
          const isSelf = data.senderId === currentUid;
          if (!isSelf && data.status !== 'read') {
            hasUnreadForMe = true;
          }

          return {
            id: d.id,
            chatId: activeChatId,
            senderId: data.senderId,
            senderName: data.senderName || 'Anonymous',
            senderAvatar:
              data.senderAvatar ||
              'https://lh3.googleusercontent.com/aida-public/AB6AXuBfpDzwR2xsNv-nsDiy8QJclKg9hzaA5jd1kdt99vR7jPAQs7lZv5vgSDaWYMhGBFv8Ei5ezRYpDb_wAr3lxlYpw8f1qiS29oJ2P6AuVne7dMFwLILfdkLxBonarXmqdT-fgwxrcciUyl8XN29J9Qzkg1NNk2FlFeMbplyopjX2HVtWSHqczvwBI-yU2C6Lqtz9vj-edQeNxEaj3poxvGbhIAuyi2eO9XjNTiCQFGtefBCjPKttKXgFsA',
            receiverId: data.receiverId,
            content: data.content || data.text || '',
            text: data.text || data.content || '',
            type: data.type || 'text',
            mediaUrl: data.mediaUrl,
            mediaMeta: data.mediaMeta,
            status: data.status || 'delivered',
            reactions: data.reactions || {},
            replyTo: data.replyTo,
            timestamp: formatFirestoreTimestamp(data.timestamp),
            isSelf,
          };
        });

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
  }, [activeChatId, user?.uid]);

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

  const sendMessage = async (
    content: string,
    type: 'text' | 'image' | 'voice' | 'code' | 'file' = 'text',
    mediaUrl?: string,
    mediaMeta?: any
  ) => {
    if (!activeChatId || !user) return;

    try {
      await sendFirestoreMessage(activeChatId, {
        senderId: user.uid,
        senderName: user.name || user.username || 'Nexus Operative',
        senderAvatar: user.avatarUrl,
        receiverId: activeChat?.participants?.find((p) => p !== user.uid) || '',
        content,
        type,
        mediaUrl,
        mediaMeta,
        status: 'delivered',
      });
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
    filteredChats = filteredChats.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.lastMessage && c.lastMessage.toLowerCase().includes(q)) ||
        (c.tag && c.tag.toLowerCase().includes(q))
    );
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

  const unreadTotal = allChats.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

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
