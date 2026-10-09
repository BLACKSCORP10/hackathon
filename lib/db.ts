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
  bio?: string;
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
  type: 'text' | 'image' | 'voice' | 'code' | 'file' | 'ai';
  mediaUrl?: string;
  mediaType?: string;
  mediaMeta?: {
    name?: string;
    size?: string;
    duration?: string;
    waveform?: number[];
    mimeType?: string;
  };
  status?: 'sent' | 'delivered' | 'read';
  reactions?: Record<string, number>;
  replyTo?: {
    id: string;
    senderName: string;
    content: string;
  };
  timestamp?: any;
  createdAt?: any;
  isSelf?: boolean;
  isAi?: boolean;
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
  mediaType?: 'image' | 'video' | 'text';
  caption: string;
  timestamp?: any;
  createdAt?: any;
  expiresAt?: any;
  viewed?: boolean;
}

export interface FirestoreCall {
  id: string;
  callerId: string;
  callerName: string;
  callerAvatar: string;
  receiverId: string;
  receiverName: string;
  receiverAvatar: string;
  type: 'audio' | 'video';
  status: 'pending' | 'connected' | 'rejected' | 'ended';
  roomUrl?: string;
  offer?: {
    sdp?: string;
    type?: 'offer' | 'answer' | 'pranswer' | 'rollback';
  };
  answer?: {
    sdp?: string;
    type?: 'offer' | 'answer' | 'pranswer' | 'rollback';
  };
  createdAt?: any;
  connectedAt?: any;
  endedAt?: any;
  duration?: number; // in seconds
}

export interface FirestoreCallLog {
  id: string;
  callerId: string;
  callerName: string;
  callerAvatar: string;
  receiverId: string;
  receiverName: string;
  receiverAvatar: string;
  type: 'audio' | 'video';
  direction: 'incoming' | 'outgoing' | 'missed';
  status: 'connected' | 'missed' | 'rejected';
  duration: number; // in seconds
  timestamp?: any;
  createdAt?: any;
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

// Generate Deterministic 1-on-1 Direct Chat ID: [userA, userB].sort().join("_")
export function getDirectChatId(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join('_');
}

// Chat Operations
export async function createOrGetDirectChat(currentUser: FirestoreUser, targetUser: FirestoreUser): Promise<FirestoreChat> {
  const chatId = getDirectChatId(currentUser.uid, targetUser.uid);
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

// Send Message to Firestore Sub-Collection with createdAt serverTimestamp()
export async function sendFirestoreMessage(
  chatId: string,
  message: {
    senderId: string;
    senderName: string;
    senderAvatar: string;
    receiverId?: string;
    content: string;
    type?: 'text' | 'image' | 'voice' | 'code' | 'file' | 'ai';
    mediaUrl?: string;
    mediaMeta?: any;
    replyTo?: any;
    status?: 'sent' | 'delivered' | 'read';
  }
): Promise<string> {
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const nowTimestamp = serverTimestamp();

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
    status: message.status || 'delivered',
    reactions: {},
    createdAt: nowTimestamp,
    timestamp: nowTimestamp,
  });

  // Update parent chat snippet in real time
  const chatDocRef = doc(db, 'chats', chatId);
  let snippet = message.content;
  if (message.type === 'image') snippet = '📷 Photo attachment';
  else if (message.type === 'voice') snippet = '🎙️ Voice note';
  else if (message.type === 'file') snippet = `📎 ${message.mediaMeta?.name || 'File attachment'}`;

  const parts = chatId.split('_');
  const chatParticipants =
    parts.length === 2
      ? parts
      : [message.senderId, message.receiverId || ''].filter(Boolean);

  await setDoc(
    chatDocRef,
    {
      id: chatId,
      lastMessage: snippet,
      lastMessageTime: nowTimestamp,
      lastSenderId: message.senderId,
      participants: chatParticipants,
      updatedAt: nowTimestamp,
    },
    { merge: true }
  );

  return docRef.id;
}

// Delete Message from Firestore Sub-Collection
export async function deleteFirestoreMessage(chatId: string, messageId: string): Promise<void> {
  const msgDocRef = doc(db, 'chats', chatId, 'messages', messageId);
  await deleteDoc(msgDocRef);

  // Update lastMessage snippet in chat if needed
  try {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(1));
    const latestSnap = await getDocs(q);
    const chatDocRef = doc(db, 'chats', chatId);

    if (!latestSnap.empty) {
      const lastMsg = latestSnap.docs[0].data();
      let snippet = lastMsg.content || lastMsg.text;
      if (lastMsg.type === 'image') snippet = '📷 Photo attachment';
      else if (lastMsg.type === 'voice') snippet = '🎙️ Voice note';
      else if (lastMsg.type === 'file') snippet = '📎 File attachment';

      await updateDoc(chatDocRef, {
        lastMessage: snippet,
        lastMessageTime: lastMsg.createdAt || lastMsg.timestamp || serverTimestamp(),
        lastSenderId: lastMsg.senderId,
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(chatDocRef, {
        lastMessage: 'Message history cleared',
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    console.warn('Could not update parent chat snippet on delete:', err);
  }
}

// Mark all incoming messages in a chat as 'read'
export async function markFirestoreMessagesAsRead(chatId: string, currentUserId: string): Promise<void> {
  try {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, where('receiverId', '==', currentUserId));
    const snap = await getDocs(q);

    const updatePromises = snap.docs
      .filter((d) => d.data().status !== 'read')
      .map((d) => updateDoc(d.ref, { status: 'read' }));

    await Promise.all(updatePromises);
  } catch (error) {
    console.warn('Error marking messages as read:', error);
  }
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

export async function updateFirestoreUserProfile(
  userId: string,
  profile: { name?: string; bio?: string; statusText?: string; avatarUrl?: string; username?: string; phone?: string }
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    const updates: any = { ...profile, lastSeen: serverTimestamp() };
    if (profile.bio && !profile.statusText) updates.statusText = profile.bio;
    await updateDoc(userRef, updates);
  } catch (error) {
    console.error('Error updating user profile in Firestore:', error);
    throw error;
  }
}

// Story Operations
export async function createFirestoreStory(story: {
  userId: string;
  userName: string;
  userAvatar: string;
  mediaUrl: string;
  mediaType?: 'image' | 'video' | 'text';
  caption: string;
}): Promise<string> {
  const storiesRef = collection(db, 'stories');
  const now = serverTimestamp();
  const expiresAtMs = Date.now() + 24 * 60 * 60 * 1000; // 24 hours from now
  const expiresAt = Timestamp.fromMillis(expiresAtMs);

  const docRef = await addDoc(storiesRef, {
    ...story,
    mediaType: story.mediaType || 'image',
    createdAt: now,
    timestamp: now,
    expiresAt,
  });
  return docRef.id;
}

export async function deleteFirestoreStory(storyId: string): Promise<void> {
  const storyRef = doc(db, 'stories', storyId);
  await deleteDoc(storyRef);
}

// Call Log Operations
export async function saveFirestoreCallLog(callLog: Omit<FirestoreCallLog, 'id' | 'timestamp'>): Promise<string> {
  const callsRef = collection(db, 'calls');
  const now = serverTimestamp();
  const docRef = await addDoc(callsRef, {
    ...callLog,
    createdAt: now,
    timestamp: now,
  });
  return docRef.id;
}
