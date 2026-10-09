'use client';

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  addDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FirestoreCall, FirestoreUser, saveFirestoreCallLog } from '@/lib/db';
import { useAuth } from './AuthContext';

export const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:openrelay.metered.ca:80' },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
};

interface CallContextType {
  activeCall: FirestoreCall | null;
  incomingCall: FirestoreCall | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callDuration: number;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  streamError: string | null;
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
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const activeCallUnsubRef = useRef<(() => void) | null>(null);
  const candidatesUnsubRef = useRef<(() => void) | null>(null);
  const durationTimerRef = useRef<any>(null);

  // 1. Listen for Incoming Calls in Real-Time for current user
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
          // Only trigger if not already in active call
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
        console.warn('Calls snapshot listener error:', err);
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
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    }
    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, [activeCall?.status]);

  // Cleanup helper
  const cleanUpCallResources = () => {
    ringtone.stop();

    if (activeCallUnsubRef.current) {
      activeCallUnsubRef.current();
      activeCallUnsubRef.current = null;
    }
    if (candidatesUnsubRef.current) {
      candidatesUnsubRef.current();
      candidatesUnsubRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current = null;
    }
    setRemoteStream(null);

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

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
  };

  // 2. Start Call (Caller Handshake)
  const startCall = async (
    targetUser: { uid: string; name: string; avatarUrl: string },
    type: 'audio' | 'video'
  ) => {
    if (!user) throw new Error('Must be authenticated to make calls');
    cleanUpCallResources();

    try {
      // 1. Capture Local Media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video' ? { width: 1280, height: 720, facingMode: 'user' } : false,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);

      // 2. Init RTCPeerConnection with Open Relay TURN + STUN
      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionRef.current = pc;

      // Create Remote Media Stream
      const rStream = new MediaStream();
      remoteStreamRef.current = rStream;
      setRemoteStream(rStream);

      // Add local tracks to RTCPeerConnection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle Remote Stream arrival
      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          rStream.addTrack(track);
        });
      };

      // Create Firestore Call Document
      const callDocRef = doc(collection(db, 'calls'));
      const callId = callDocRef.id;

      const callerCandidatesRef = collection(db, 'calls', callId, 'callerCandidates');
      const receiverCandidatesRef = collection(db, 'calls', callId, 'receiverCandidates');

      // ICE Candidates handling
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          addDoc(callerCandidatesRef, event.candidate.toJSON());
        }
      };

      // Create SDP Offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

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
        offer: {
          sdp: offer.sdp,
          type: offer.type,
        },
        createdAt: serverTimestamp(),
      };

      await setDoc(callDocRef, initialCallData);
      setActiveCall(initialCallData);

      // Listen for Answer on Call Document
      activeCallUnsubRef.current = onSnapshot(callDocRef, (snap) => {
        if (!snap.exists()) {
          cleanUpCallResources();
          return;
        }

        const data = snap.data() as FirestoreCall;
        setActiveCall({ ...data, id: snap.id });

        // When Answer arrives & peer connection does not have remote description
        if (data.answer?.sdp && data.answer?.type && !pc.currentRemoteDescription) {
          const answerDescription = new RTCSessionDescription({
            sdp: data.answer.sdp,
            type: data.answer.type as RTCSdpType,
          });
          pc.setRemoteDescription(answerDescription).catch((e) =>
            console.error('Error setting remote description:', e)
          );
        }

        // If rejected or ended
        if (data.status === 'rejected' || data.status === 'ended') {
          cleanUpCallResources();
        }
      });

      // Listen for Remote ICE Candidates
      candidatesUnsubRef.current = onSnapshot(receiverCandidatesRef, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const candidate = new RTCIceCandidate(change.doc.data());
            pc.addIceCandidate(candidate).catch((e) =>
              console.error('Error adding ICE candidate:', e)
            );
          }
        });
      });
    } catch (err: any) {
      console.error('Error starting WebRTC call:', err);
      setStreamError(err.message || 'Could not access camera/microphone');
      cleanUpCallResources();
    }
  };

  // 3. Accept Call (Receiver Handshake)
  const acceptCall = async () => {
    if (!incomingCall || !user) return;
    ringtone.stop();

    const callDocData = incomingCall;
    setIncomingCall(null);

    try {
      const type = callDocData.type;

      // 1. Capture Local Media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video' ? { width: 1280, height: 720, facingMode: 'user' } : false,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);

      // 2. Init RTCPeerConnection
      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionRef.current = pc;

      // Create Remote Stream
      const rStream = new MediaStream();
      remoteStreamRef.current = rStream;
      setRemoteStream(rStream);

      // Add local tracks to RTCPeerConnection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle Remote Stream arrival
      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          rStream.addTrack(track);
        });
      };

      const callDocRef = doc(db, 'calls', callDocData.id);
      const callerCandidatesRef = collection(db, 'calls', callDocData.id, 'callerCandidates');
      const receiverCandidatesRef = collection(db, 'calls', callDocData.id, 'receiverCandidates');

      // Send local ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          addDoc(receiverCandidatesRef, event.candidate.toJSON());
        }
      };

      // Set Remote Description from Caller Offer
      if (callDocData.offer?.sdp && callDocData.offer?.type) {
        await pc.setRemoteDescription(
          new RTCSessionDescription({
            sdp: callDocData.offer.sdp,
            type: callDocData.offer.type as RTCSdpType,
          })
        );
      }

      // Create SDP Answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Update Firestore Call Document with Answer & Connected Status
      await updateDoc(callDocRef, {
        status: 'connected',
        answer: {
          sdp: answer.sdp,
          type: answer.type,
        },
        connectedAt: serverTimestamp(),
      });

      setActiveCall({
        ...callDocData,
        status: 'connected',
        answer: { sdp: answer.sdp, type: answer.type },
      });

      // Listen for caller candidates
      candidatesUnsubRef.current = onSnapshot(callerCandidatesRef, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const candidate = new RTCIceCandidate(change.doc.data());
            pc.addIceCandidate(candidate).catch((e) =>
              console.error('Error adding candidate on receiver:', e)
            );
          }
        });
      });

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
      console.error('Error accepting call:', err);
      setStreamError(err.message || 'Error accepting call');
      cleanUpCallResources();
    }
  };

  // 4. Decline Call
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

  // 5. End Call
  const endCall = async () => {
    if (activeCall) {
      try {
        const callRef = doc(db, 'calls', activeCall.id);
        await updateDoc(callRef, {
          status: 'ended',
          endedAt: serverTimestamp(),
          duration: callDuration,
        });

        // Save call log record
        if (user) {
          await saveFirestoreCallLog({
            callerId: activeCall.callerId,
            callerName: activeCall.callerName,
            callerAvatar: activeCall.callerAvatar,
            receiverId: activeCall.receiverId,
            receiverName: activeCall.receiverName,
            receiverAvatar: activeCall.receiverAvatar,
            type: activeCall.type,
            direction: activeCall.callerId === user.uid ? 'outgoing' : 'incoming',
            status: 'connected',
            duration: callDuration,
          });
        }
      } catch (e) {
        console.warn('Error updating call end status:', e);
      }
    }
    cleanUpCallResources();
  };

  // 6. Media Controls
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    } else {
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    } else {
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Revert to camera
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStreamRef.current = stream;
        setLocalStream(stream);

        // Replace track in RTCPeerConnection
        if (peerConnectionRef.current) {
          const videoSender = peerConnectionRef.current
            .getSenders()
            .find((s) => s.track?.kind === 'video');
          if (videoSender) {
            videoSender.replaceTrack(stream.getVideoTracks()[0]);
          }
        }
        setIsScreenSharing(false);
      } catch (e) {
        console.error('Error reverting camera:', e);
      }
    } else {
      try {
        if (!navigator.mediaDevices.getDisplayMedia) {
          alert('Screen sharing is not supported in this browser.');
          return;
        }
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenVideoTrack = screenStream.getVideoTracks()[0];

        if (peerConnectionRef.current) {
          const videoSender = peerConnectionRef.current
            .getSenders()
            .find((s) => s.track?.kind === 'video');
          if (videoSender) {
            videoSender.replaceTrack(screenVideoTrack);
          }
        }

        screenVideoTrack.onended = () => {
          toggleScreenShare();
        };

        setIsScreenSharing(true);
      } catch (e) {
        console.warn('Screen share canceled:', e);
      }
    }
  };

  return (
    <CallContext.Provider
      value={{
        activeCall,
        incomingCall,
        localStream,
        remoteStream,
        callDuration,
        isMuted,
        isVideoOff,
        isScreenSharing,
        streamError,
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
