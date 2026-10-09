'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously,
  signOut,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, githubProvider } from '@/lib/firebase';
import { FirestoreUser, syncFirestoreUser, updateFirestoreUserStatus } from '@/lib/db';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: FirestoreUser | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (data: {
    name: string;
    username: string;
    email: string;
    password: string;
    phone?: string;
    avatarUrl?: string;
  }) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  loginAnonymously: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfileData: (updates: Partial<FirestoreUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<FirestoreUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Listen to Firebase Auth state changes
  useEffect(() => {
    let unsubscribeFirestoreDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentFirebaseUser) => {
      setFirebaseUser(currentFirebaseUser);

      if (currentFirebaseUser) {
        // Set cookie for Next.js middleware & SSR support
        document.cookie = `nexus_auth_token=${currentFirebaseUser.uid}; path=/; max-age=604800; SameSite=Lax`;

        // Sync initial profile to Firestore users collection
        const synced = await syncFirestoreUser({
          uid: currentFirebaseUser.uid,
          email: currentFirebaseUser.email || '',
          name: currentFirebaseUser.displayName || currentFirebaseUser.email?.split('@')[0] || 'Nexus Operative',
          avatarUrl: currentFirebaseUser.photoURL || undefined,
        });
        setUser(synced);

        // Real-time listener for user profile document
        const userDocRef = doc(db, 'users', currentFirebaseUser.uid);
        unsubscribeFirestoreDoc = onSnapshot(userDocRef, (snap) => {
          if (snap.exists()) {
            setUser({ id: snap.id, ...snap.data() } as FirestoreUser);
          }
        });
      } else {
        // Clear cookie
        document.cookie = 'nexus_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
        setUser(null);
        if (unsubscribeFirestoreDoc) {
          unsubscribeFirestoreDoc();
        }
      }
      setIsLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestoreDoc) unsubscribeFirestoreDoc();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      await updateFirestoreUserStatus(userCredential.user.uid, true);
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: {
    name: string;
    username: string;
    email: string;
    password: string;
    phone?: string;
    avatarUrl?: string;
  }) => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const createdFirebaseUser = userCredential.user;

      // Update Firebase Auth profile
      await updateProfile(createdFirebaseUser, {
        displayName: data.name,
        photoURL: data.avatarUrl || undefined,
      });

      // Save directly to Firestore users collection
      const synced = await syncFirestoreUser({
        uid: createdFirebaseUser.uid,
        name: data.name,
        username: data.username,
        email: data.email,
        phone: data.phone,
        avatarUrl: data.avatarUrl,
        statusText: 'Available · Connected via NexusChat',
        statusEmoji: '💬',
        role: 'Nexus Operative',
      });
      setUser(synced);
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const googleUser = result.user;

      // Ensure user profile document exists in Firestore
      const synced = await syncFirestoreUser({
        uid: googleUser.uid,
        name: googleUser.displayName || 'Nexus Operative',
        username: googleUser.email?.split('@')[0] || `user_${googleUser.uid.slice(0, 6)}`,
        email: googleUser.email || '',
        avatarUrl: googleUser.photoURL || undefined,
        phone: googleUser.phoneNumber || undefined,
        statusText: 'Connected via Google Node',
        statusEmoji: '🌐',
        role: 'Verified Google Operative',
      });
      setUser(synced);
      router.push('/dashboard');
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGithub = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, githubProvider);
      const githubUser = result.user;

      const synced = await syncFirestoreUser({
        uid: githubUser.uid,
        name: githubUser.displayName || 'GitHub Operative',
        username: githubUser.email?.split('@')[0] || `gh_${githubUser.uid.slice(0, 6)}`,
        email: githubUser.email || '',
        avatarUrl: githubUser.photoURL || undefined,
        phone: githubUser.phoneNumber || undefined,
        statusText: 'Connected via GitHub Node',
        statusEmoji: '💻',
        role: 'Verified Developer Operative',
      });
      setUser(synced);
      router.push('/dashboard');
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginAnonymously = async () => {
    setIsLoading(true);
    try {
      const result = await signInAnonymously(auth);
      const anonUser = result.user;

      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const synced = await syncFirestoreUser({
        uid: anonUser.uid,
        name: `Guest Operative ${randomNum}`,
        username: `guest_${randomNum}`,
        email: `guest_${anonUser.uid.slice(0, 6)}@nexus.internal`,
        statusText: 'Guest node session active',
        statusEmoji: '⚡',
        role: 'Guest Operative',
      });
      setUser(synced);
      router.push('/dashboard');
    } catch (err) {
      console.error('Anonymous sign in error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (user?.uid) {
        await updateFirestoreUserStatus(user.uid, false);
      }
      await signOut(auth);
      document.cookie = 'nexus_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      setUser(null);
      setFirebaseUser(null);
      router.push('/login');
    } catch (err) {
      router.push('/login');
    }
  };

  const updateProfileData = async (updates: Partial<FirestoreUser>) => {
    if (!user?.uid) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { ...updates, updatedAt: serverTimestamp() }, { merge: true });
    } catch (e) {
      console.error('Error updating profile data:', e);
      throw e;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isLoading,
        isAuthenticated: !!user || !!firebaseUser,
        login,
        register,
        loginWithGoogle,
        loginWithGithub,
        loginAnonymously,
        logout,
        updateProfileData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
