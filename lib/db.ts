import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
  Timestamp,
  FieldValue,
} from 'firebase/firestore';
import { db } from './firebase';

export { db };

export interface FirestoreUser {
  id: string;
  uid: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  avatarUrl: string;
  statusText?: string;
  statusEmoji?: string;
  isOnline: boolean;
  role?: string;
  createdAt?: any;
  lastSeen?: any;
}

export interface FirestoreMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  receiverId?: string;
  content: string;
  text?: string;
  type: 'text' | 'image' | 'voice' | 'code' | 'file';
  mediaUrl?: string;
  mediaMeta?: {
    name?: string;
    size?: string;
    duration?: string;
    waveform?: number[];
  };
  reactions?: Record<string, number>;
  replyTo?: {
    id: string;
    senderName: string;
    content: string;
  };
  timestamp?: any;
  isSelf?: boolean;
}

export interface FirestoreChat {
  id: string;
  type: 'direct' | 'group';
  name: string;
  avatarUrl: string;
  tag?: string;
  roleBadge?: string;
  isVerified?: boolean;
  isOnline?: boolean;
  isTyping?: boolean;
  typingText?: string;
  lastMessage?: string;
  lastMessageTime?: any;
  lastSenderId?: string;
  unreadCount?: number;
  isPinned?: boolean;
  participants: string[];
  createdAt?: any;
  updatedAt?: any;
}

export interface FirestoreStory {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  mediaUrl: string;
  caption: string;
  timestamp?: any;
  viewed?: boolean;
}

// ----------------- Dynamic Firestore Services -----------------

// User Operations
export async function getFirestoreUser(userId: string): Promise<FirestoreUser | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() } as FirestoreUser;
    }
    return null;
  } catch (error) {
    console.error('Error fetching Firestore user:', error);
    return null;
  }
}

export async function syncFirestoreUser(user: Partial<FirestoreUser> & { uid: string }): Promise<FirestoreUser> {
  const userRef = doc(db, 'users', user.uid);
  const existing = await getDoc(userRef);

  const defaultAvatar =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBfpDzwR2xsNv-nsDiy8QJclKg9hzaA5jd1kdt99vR7jPAQs7lZv5vgSDaWYMhGBFv8Ei5ezRYpDb_wAr3lxlYpw8f1qiS29oJ2P6AuVne7dMFwLILfdkLxBonarXmqdT-fgwxrcciUyl8XN29J9Qzkg1NNk2FlFeMbplyopjX2HVtWSHqczvwBI-yU2C6Lqtz9vj-edQeNxEaj3poxvGbhIAuyi2eO9XjNTiCQFGtefBCjPKttKXgFsA';

  const userData: FirestoreUser = {
    id: user.uid,
    uid: user.uid,
    name: user.name || user.email?.split('@')[0] || 'Nexus Operative',
    username: user.username || user.email?.split('@')[0] || `user_${user.uid.slice(0, 6)}`,
    email: user.email || '',
    phone: user.phone || '',
    avatarUrl: user.avatarUrl || defaultAvatar,
    statusText: user.statusText || 'Quantum nodes syncing · Standby',
    statusEmoji: user.statusEmoji || '⚡',
    isOnline: true,
    role: user.role || 'Nexus Operative',
    lastSeen: serverTimestamp(),
    createdAt: existing.exists() ? existing.data()?.createdAt : serverTimestamp(),
  };

  await setDoc(userRef, userData, { merge: true });
  return userData;
}

export async function updateFirestoreUserStatus(userId: string, isOnline: boolean, statusText?: string) {
  try {
    const userRef = doc(db, 'users', userId);
    const updates: any = { isOnline, lastSeen: serverTimestamp() };
    if (statusText !== undefined) updates.statusText = statusText;
    await updateDoc(userRef, updates);
  } catch (e) {
    console.error('Error updating user presence:', e);
  }
}

// Chat Operations
export async function createOrGetDirectChat(currentUser: FirestoreUser, targetUser: FirestoreUser): Promise<FirestoreChat> {
  const sortedIds = [currentUser.uid, targetUser.uid].sort();
  const chatId = `dm_${sortedIds[0]}_${sortedIds[1]}`;
  const chatRef = doc(db, 'chats', chatId);
  const chatSnap = await getDoc(chatRef);

  if (chatSnap.exists()) {
    return { id: chatSnap.id, ...chatSnap.data() } as FirestoreChat;
  }

  const newChat: FirestoreChat = {
    id: chatId,
    type: 'direct',
    name: targetUser.name,
    avatarUrl: targetUser.avatarUrl,
    roleBadge: targetUser.role || 'Operative',
    isVerified: true,
    isOnline: targetUser.isOnline,
    lastMessage: 'Chat initialized with AES-256 E2EE',
    lastMessageTime: serverTimestamp(),
    unreadCount: 0,
    participants: [currentUser.uid, targetUser.uid],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(chatRef, newChat);
  return newChat;
}

// Send Message to Firestore Sub-Collection
export async function sendFirestoreMessage(
  chatId: string,
  message: {
    senderId: string;
    senderName: string;
    senderAvatar: string;
    receiverId?: string;
    content: string;
    type?: 'text' | 'image' | 'voice' | 'code' | 'file';
    mediaUrl?: string;
    mediaMeta?: any;
    replyTo?: any;
  }
): Promise<string> {
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const docRef = await addDoc(messagesRef, {
    chatId,
    senderId: message.senderId,
    senderName: message.senderName,
    senderAvatar: message.senderAvatar,
    receiverId: message.receiverId || '',
    content: message.content,
    text: message.content,
    type: message.type || 'text',
    mediaUrl: message.mediaUrl || null,
    mediaMeta: message.mediaMeta || null,
    replyTo: message.replyTo || null,
    reactions: {},
    timestamp: serverTimestamp(),
  });

  // Update parent chat snippet in real time
  const chatDocRef = doc(db, 'chats', chatId);
  await setDoc(
    chatDocRef,
    {
      id: chatId,
      lastMessage: message.content || (message.type === 'image' ? '📷 Photo attachment' : '🎙️ Voice note'),
      lastMessageTime: serverTimestamp(),
      lastSenderId: message.senderId,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return docRef.id;
}

// Add Reaction to a Message
export async function addFirestoreReaction(chatId: string, messageId: string, emoji: string) {
  const msgDocRef = doc(db, 'chats', chatId, 'messages', messageId);
  const msgSnap = await getDoc(msgDocRef);
  if (!msgSnap.exists()) return;

  const currentReactions = msgSnap.data()?.reactions || {};
  const newCount = (currentReactions[emoji] || 0) + 1;

  await updateDoc(msgDocRef, {
    [`reactions.${emoji}`]: newCount,
  });
}
