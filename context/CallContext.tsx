'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
  useCallback,
} from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import DailyIframe, { DailyCall, DailyEventObject } from '@daily-co/daily-js';
import { db } from '@/lib/firebase';
import { FirestoreCall, saveFirestoreCallLog } from '@/lib/db';
import { useAuth } from './AuthContext';

interface CallContextType {
  activeCall: FirestoreCall | null;
  incomingCall: FirestoreCall | null;
  callFrame: DailyCall | null;
  callDuration: number;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  streamError: string | null;
  mountCallFrame: (container: HTMLElement) => Promise<DailyCall | null>;
  startCall: (
    targetUser: { uid: string; name: string; avatarUrl: string },
    type: 'audio' | 'video'
  ) => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => Promise<void>;
  endCall: () => Promise<void>;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => Promise<void>;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

// Web Audio API Ringtone Synthesizer
class RingtonePlayer {
  private audioCtx: AudioContext | null = null;
  private intervalId: any = null;

  start() {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      this.audioCtx = new AudioCtxClass();

      const playChime = () => {
        if (!this.audioCtx) return;
        const now = this.audioCtx.currentTime;

        const osc1 = this.audioCtx.createOscillator();
        const osc2 = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(440, now);
        osc2.frequency.setValueAtTime(480, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.2);
        osc2.stop(now + 1.2);
      };

      playChime();
      this.intervalId = setInterval(playChime, 2500);
    } catch (e) {
      console.warn('Ringtone playback not permitted yet:', e);
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
  }
}

const ringtone = new RingtonePlayer();

export function CallProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [activeCall, setActiveCall] = useState<FirestoreCall | null>(null);
  const [incomingCall, setIncomingCall] = useState<FirestoreCall | null>(null);
  const [callFrame, setCallFrame] = useState<DailyCall | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  const callFrameRef = useRef<DailyCall | null>(null);
  const activeCallUnsubRef = useRef<(() => void) | null>(null);
  const durationTimerRef = useRef<any>(null);

  // 1. Real-Time Listener for Incoming Calls (receiverId == currentUserId && status == 'pending')
  useEffect(() => {
    if (!user?.uid) {
      setIncomingCall(null);
      return;
    }

    const callsRef = collection(db, 'calls');
    const q = query(
      callsRef,
      where('receiverId', '==', user.uid),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const docData = snapshot.docs[0];
          const callData = { id: docData.id, ...docData.data() } as FirestoreCall;
          // Only pop up incoming notification if not already in an active call
          if (!activeCall) {
            setIncomingCall(callData);
            ringtone.start();
          }
        } else {
          setIncomingCall(null);
          ringtone.stop();
        }
      },
      (err) => {
        console.warn('Calls snapshot listener notice:', err);
      }
    );

    return () => {
      unsubscribe();
      ringtone.stop();
    };
  }, [user?.uid, activeCall]);

  // Duration Timer
  useEffect(() => {
    if (activeCall?.status === 'connected') {
      setCallDuration(0);
      durationTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
    }
    return () => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
    };
  }, [activeCall?.status]);

  // Cleanup helper
  const cleanUpCallResources = useCallback(() => {
    ringtone.stop();

    if (activeCallUnsubRef.current) {
      activeCallUnsubRef.current();
      activeCallUnsubRef.current = null;
    }

    if (callFrameRef.current) {
      try {
        callFrameRef.current.leave().catch(() => {});
        callFrameRef.current.destroy().catch(() => {});
      } catch (e) {
        console.warn('Daily frame destroy notice:', e);
      }
      callFrameRef.current = null;
    }
    setCallFrame(null);

    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    setActiveCall(null);
    setIncomingCall(null);
    setIsMuted(false);
    setIsVideoOff(false);
    setIsScreenSharing(false);
    setStreamError(null);
  }, []);

  // 2. Start Call (Caller Creates Daily room & Firestore Call document)
  const startCall = async (
    targetUser: { uid: string; name: string; avatarUrl: string },
    type: 'audio' | 'video'
  ) => {
    if (!user) throw new Error('Must be authenticated to make calls');
    cleanUpCallResources();

    try {
      const callDocRef = doc(collection(db, 'calls'));
      const callId = callDocRef.id;
      const roomName = `nexus-${callId.slice(0, 10).toLowerCase()}`;

      // Request or construct Daily room URL
      let roomUrl =
        process.env.NEXT_PUBLIC_DAILY_ROOM_URL ||
        `https://${process.env.NEXT_PUBLIC_DAILY_DOMAIN || 'nexuschat'}.daily.co/${roomName}`;

      try {
        const roomRes = await fetch('/api/daily/room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomName, isVideo: type === 'video' }),
        });
        if (roomRes.ok) {
          const roomData = await roomRes.json();
          if (roomData?.url) {
            roomUrl = roomData.url;
          }
        }
      } catch (err) {
        console.warn('Daily room initialization notice, using standard room URL:', err);
      }

      const initialCallData: FirestoreCall = {
        id: callId,
        callerId: user.uid,
        callerName: user.name || user.username || 'Nexus Operative',
        callerAvatar: user.avatarUrl,
        receiverId: targetUser.uid,
        receiverName: targetUser.name,
        receiverAvatar: targetUser.avatarUrl,
        type,
        status: 'pending',
        roomUrl,
        createdAt: serverTimestamp(),
      };

      await setDoc(callDocRef, initialCallData);
      setActiveCall(initialCallData);

      // Listen for updates on the Call Document (acceptance, rejection, end)
      activeCallUnsubRef.current = onSnapshot(callDocRef, (snap) => {
        if (!snap.exists()) {
          cleanUpCallResources();
          return;
        }

        const data = snap.data() as FirestoreCall;
        const updatedCall = { ...data, id: snap.id };
        setActiveCall(updatedCall);

        if (updatedCall.status === 'rejected' || updatedCall.status === 'ended') {
          cleanUpCallResources();
        }
      });
    } catch (err: any) {
      console.error('Error starting Daily call:', err);
      setStreamError(err.message || 'Could not initiate secure call');
      cleanUpCallResources();
    }
  };

  // 3. Accept Call (Receiver accepts & updates Firestore status to 'connected')
  const acceptCall = async () => {
    if (!incomingCall || !user) return;
    ringtone.stop();

    const callDocData = incomingCall;
    setIncomingCall(null);

    try {
      const callDocRef = doc(db, 'calls', callDocData.id);

      await updateDoc(callDocRef, {
        status: 'connected',
        connectedAt: serverTimestamp(),
      });

      const updatedCall: FirestoreCall = {
        ...callDocData,
        status: 'connected',
      };
      setActiveCall(updatedCall);

      // Listen for call termination
      activeCallUnsubRef.current = onSnapshot(callDocRef, (snap) => {
        if (!snap.exists()) {
          cleanUpCallResources();
          return;
        }
        const data = snap.data() as FirestoreCall;
        if (data.status === 'ended' || data.status === 'rejected') {
          cleanUpCallResources();
        }
      });
    } catch (err: any) {
      console.error('Error accepting Daily call:', err);
      setStreamError(err.message || 'Error connecting to call');
      cleanUpCallResources();
    }
  };

  // 4. Mount & Join DailyIframe into container element (Embedded UI Modal)
  const mountCallFrame = async (container: HTMLElement): Promise<DailyCall | null> => {
    if (!activeCall || !activeCall.roomUrl) return null;

    try {
      // If frame already exists, destroy previous
      if (callFrameRef.current) {
        try {
          await callFrameRef.current.leave();
          await callFrameRef.current.destroy();
        } catch (e) {
          console.warn('Frame destroy error:', e);
        }
      }

      // Create Daily Call Frame embedded into container
      const frame = DailyIframe.createFrame(container, {
        iframeStyle: {
          width: '100%',
          height: '100%',
          border: '0',
          borderRadius: '1.5rem',
          backgroundColor: '#0b0e14',
        },
        showLeaveButton: true,
        showFullscreenButton: true,
        showUserNameChangeUI: false,
        theme: {
          colors: {
            accent: '#38bdf8',
            accentText: '#080c14',
            background: '#0b0e14',
            backgroundAccent: '#171d2b',
            baseText: '#f1f5f9',
            border: '#2a3447',
            mainAreaBg: '#080c14',
            mainAreaBgAccent: '#101726',
            mainAreaText: '#f1f5f9',
            supportiveText: '#94a3b8',
          },
        },
      });

      callFrameRef.current = frame;
      setCallFrame(frame);

      // Daily Event Listeners
      frame.on('joined-meeting', () => {
        setIsVideoOff(activeCall.type === 'audio');
        setIsMuted(false);
      });

      frame.on('left-meeting', () => {
        endCall();
      });

      frame.on('error', (event: DailyEventObject | undefined) => {
        console.warn('Daily error event:', event);
        if (event && (event as any).errorMsg) {
          setStreamError((event as any).errorMsg);
        }
      });

      frame.on('camera-error', (event: DailyEventObject | undefined) => {
        console.warn('Daily camera error:', event);
        setStreamError('Camera or microphone permissions denied or unavailable');
      });

      // Join the Daily Room
      await frame.join({
        url: activeCall.roomUrl,
        userName: user?.name || user?.username || 'Nexus Operative',
        videoSource: activeCall.type === 'video',
        audioSource: true,
      });

      return frame;
    } catch (err: any) {
      console.error('Error mounting Daily frame:', err);
      setStreamError(err.message || 'Failed to initialize Daily video call');
      return null;
    }
  };

  // 5. Decline Call
  const declineCall = async () => {
    ringtone.stop();
    if (incomingCall) {
      try {
        const callRef = doc(db, 'calls', incomingCall.id);
        await updateDoc(callRef, {
          status: 'rejected',
          endedAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn('Error updating decline status in Firestore:', e);
      }
    }
    setIncomingCall(null);
  };

  // 6. End Call
  const endCall = async () => {
    const duration = callDuration;
    const currentCall = activeCall;

    if (callFrameRef.current) {
      try {
        await callFrameRef.current.leave();
      } catch (e) {
        console.warn('Daily frame leave notice:', e);
      }
    }

    if (currentCall) {
      try {
        const callRef = doc(db, 'calls', currentCall.id);
        await updateDoc(callRef, {
          status: 'ended',
          endedAt: serverTimestamp(),
          duration,
        });

        // Save call log record
        if (user) {
          await saveFirestoreCallLog({
            callerId: currentCall.callerId,
            callerName: currentCall.callerName,
            callerAvatar: currentCall.callerAvatar,
            receiverId: currentCall.receiverId,
            receiverName: currentCall.receiverName,
            receiverAvatar: currentCall.receiverAvatar,
            type: currentCall.type,
            direction: currentCall.callerId === user.uid ? 'outgoing' : 'incoming',
            status: 'connected',
            duration,
          });
        }
      } catch (e) {
        console.warn('Error recording call log:', e);
      }
    }

    cleanUpCallResources();
  };

  // 7. SDK Media Controls
  const toggleMute = () => {
    if (callFrameRef.current) {
      const nextState = !isMuted;
      callFrameRef.current.setLocalAudio(!nextState);
      setIsMuted(nextState);
    } else {
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (callFrameRef.current) {
      const nextState = !isVideoOff;
      callFrameRef.current.setLocalVideo(!nextState);
      setIsVideoOff(nextState);
    } else {
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleScreenShare = async () => {
    if (!callFrameRef.current) return;
    try {
      if (isScreenSharing) {
        callFrameRef.current.stopScreenShare();
        setIsScreenSharing(false);
      } else {
        callFrameRef.current.startScreenShare();
        setIsScreenSharing(true);
      }
    } catch (e) {
      console.warn('Screen share toggle error:', e);
    }
  };

  return (
    <CallContext.Provider
      value={{
        activeCall,
        incomingCall,
        callFrame,
        callDuration,
        isMuted,
        isVideoOff,
        isScreenSharing,
        streamError,
        mountCallFrame,
        startCall,
        acceptCall,
        declineCall,
        endCall,
        toggleMute,
        toggleVideo,
        toggleScreenShare,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
}
