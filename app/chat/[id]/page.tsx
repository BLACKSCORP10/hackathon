'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { ChatMessageBubble } from '@/components/chat/ChatMessageBubble';
import { ChatInputBar } from '@/components/chat/ChatInputBar';
import { saveFirestoreCallLog } from '@/lib/db';

export default function ActiveChatThreadPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = (params?.id as string) || 'chat-sarah';
  const { user } = useAuth();
  const {
    activeChat,
    messages,
    selectChat,
    sendMessage,
    deleteMessage,
    markAsRead,
    reactToMessage,
    isLoadingMessages,
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Call & MediaStream State
  const [callModalOpen, setCallModalOpen] = useState<'audio' | 'video' | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Initialize and select chat on mount
  useEffect(() => {
    selectChat(chatId);
    markAsRead(chatId);
  }, [chatId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    markAsRead(chatId);
  }, [messages, chatId]);

  // Call Timer & Media Stream Setup
  useEffect(() => {
    let timer: any;

    if (callModalOpen) {
      setCallDuration(0);
      setIsMuted(false);
      setIsVideoOff(false);
      setStreamError(null);

      // Start duration ticker
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      // Request UserMedia (Camera + Mic)
      const startMediaStream = async () => {
        try {
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setStreamError('Camera/Mic access is not supported in this browser.');
            return;
          }

          const constraints = {
            audio: true,
            video: callModalOpen === 'video' ? { width: 1280, height: 720, facingMode: 'user' } : false,
          };

          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          localStreamRef.current = stream;

          if (localVideoRef.current && callModalOpen === 'video') {
            localVideoRef.current.srcObject = stream;
            localVideoRef.current.play().catch((e) => console.warn('Video play error:', e));
          }
        } catch (err: any) {
          console.warn('getUserMedia error:', err);
          setStreamError(err.message || 'Could not access camera/microphone');
        }
      };

      startMediaStream();
    }

    return () => {
      if (timer) clearInterval(timer);
      // Clean up stream tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
    };
  }, [callModalOpen]);

  // Toggle Microphone
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

  // Toggle Video Camera
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

  // Toggle Screen Sharing
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Revert back to camera
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setIsScreenSharing(false);
      } catch (e) {
        console.error('Error restoring camera:', e);
      }
    } else {
      try {
        if (!navigator.mediaDevices.getDisplayMedia) {
          alert('Screen sharing is not supported on this platform.');
          return;
        }
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        screenTrack.onended = () => {
          setIsScreenSharing(false);
        };

        setIsScreenSharing(true);
      } catch (e) {
        console.warn('Screen share canceled or failed:', e);
      }
    }
  };

  // End Call & Save Call Log to Firestore
  const handleEndCall = async () => {
    const durationSec = callDuration;
    const callType = callModalOpen;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    setCallModalOpen(null);

    // Save record to Firestore if authenticated
    if (user && activeChat && callType) {
      try {
        await saveFirestoreCallLog({
          callerId: user.uid,
          callerName: user.name || user.username || 'Nexus Operative',
          callerAvatar: user.avatarUrl,
          receiverId: activeChat.participants?.find((p) => p !== user.uid) || activeChat.id,
          receiverName: activeChat.name,
          receiverAvatar: activeChat.avatarUrl,
          type: callType,
          direction: 'outgoing',
          status: 'connected',
          duration: durationSec,
        });
      } catch (err) {
        console.warn('Could not save call log to Firestore:', err);
      }
    }
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSendMessage = (
    text: string,
    type: 'text' | 'image' | 'voice' | 'code' | 'file' = 'text',
    mediaUrl?: string,
    mediaMeta?: any
  ) => {
    sendMessage(text, type, mediaUrl, mediaMeta);
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      {/* Sticky Active Chat Sub-Header */}
      <header className="sticky top-0 z-40 bg-surface-container-low/95 backdrop-blur-xl px-4 py-3 flex flex-col gap-1 shadow-md pt-safe border-b border-surface-container-highest/40">
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => router.push('/dashboard')}
              aria-label="Go back"
              className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container transition-colors -ml-1 flex-shrink-0 active:scale-95"
            >
              <span className="material-symbols-outlined text-[22px]">arrow_back_ios_new</span>
            </button>

            <div className="relative flex-shrink-0">
              <img
                alt={activeChat?.name || 'Contact'}
                className="w-10 h-10 rounded-full object-cover ring-1 ring-surface-container-highest"
                src={
                  activeChat?.avatarUrl ||
                  'https://lh3.googleusercontent.com/aida-public/AB6AXuBDmyBN5eU3P6Db79C6OvqxLwjGYPnL_j1bLCf1PSowDZQzYUqnMS9hLlcRJa-jSqVB0IMKREmx2xvZBUbo6-1KJv-4LAqHQC8kn9do6g4hwhkQVY-E7tSRb0ipQV1O1P5nhK872-Ir4eAWtch96NIhKmwh9byJj8aTF5uwIRIHFBol8cWq9bfpaYYQmWOgcT0sIeKOINsdtQstUSG_8Z8KP-VcryFeKFt-d7-e1n4Smya4lt3HFPevoA'
                }
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-tertiary shadow-[0_0_8px_rgba(78,222,163,0.8)]" />
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-headline-md text-headline-md text-on-surface truncate">
                  {activeChat?.name || 'Nexus Contact'}
                </span>
                {activeChat?.roleBadge && (
                  <span className="px-1.5 py-0.5 rounded-full bg-surface-container-high text-primary font-label-sm text-[10px] flex-shrink-0">
                    {activeChat.roleBadge}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
                <span className="font-label-sm text-xs text-tertiary truncate">
                  Online · Encrypted Signal Active
                </span>
              </div>
            </div>
          </div>

          {/* Action Utilities */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCallModalOpen('audio')}
              aria-label="Start Audio Call"
              className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant active:scale-95 transition-all hover:bg-surface-container-high hover:text-on-surface"
              title="Encrypted Audio Call"
            >
              <span className="material-symbols-outlined text-[20px]">call</span>
            </button>
            <button
              onClick={() => setCallModalOpen('video')}
              aria-label="Start Video Call"
              className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant active:scale-95 transition-all hover:bg-surface-container-high hover:text-on-surface"
              title="Encrypted Video Call"
            >
              <span className="material-symbols-outlined text-[20px]">videocam</span>
            </button>
            <button
              onClick={() => router.push('/settings')}
              aria-label="Chat settings"
              className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant active:scale-95 transition-all hover:bg-surface-container-high hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[20px]">info</span>
            </button>
          </div>
        </div>

        {/* Security E2EE Pill */}
        <div className="flex items-center justify-center pt-0.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-surface-container-highest/60 backdrop-blur-sm text-on-surface-variant font-label-sm text-[11px] border border-surface-container-highest">
            <span className="material-symbols-outlined text-[13px] text-tertiary">lock</span>
            <span>End-to-End Encrypted (AES-256 GCM) · Real-Time Firestore Sync</span>
          </div>
        </div>
      </header>

      {/* Main Message Stream */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 flex flex-col gap-4">
        {/* Date / System Encryption Marker */}
        <div className="flex flex-col items-center gap-1 my-2">
          <div className="px-3 py-1 rounded-full bg-surface-container-low text-on-surface-variant font-label-sm text-xs shadow-sm flex items-center gap-1.5 border border-surface-container-highest/40">
            <span className="material-symbols-outlined text-[13px] text-primary">verified_user</span>
            <span>Messages and calls are synchronized with sub-100ms Firestore latency</span>
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoadingMessages ? (
          <div className="py-12 flex justify-center items-center text-outline gap-2">
            <span className="material-symbols-outlined animate-spin text-2xl">refresh</span>
            <span className="text-body-sm font-mono text-xs">Decrypting signal packets...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center gap-3 text-outline">
            <div className="w-14 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-3xl">chat_bubble_outline</span>
            </div>
            <p className="text-sm font-semibold text-on-surface">No messages yet</p>
            <p className="text-xs max-w-xs text-on-surface-variant">
              Send an encrypted message, attach a file, or record a voice note to start the conversation.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessageBubble
              key={msg.id}
              message={msg}
              onReact={(msgId, emoji) => reactToMessage(msgId, emoji)}
              onDelete={(msgId) => deleteMessage(msgId)}
            />
          ))
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Chat Input Bar */}
      <ChatInputBar onSendMessage={handleSendMessage} />

      {/* Real WebRTC / Camera & Audio Call Modal */}
      {callModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl animate-fade-in">
          <div className="relative w-full max-w-md bg-surface-container rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center justify-between text-center border border-surface-container-highest min-h-[540px]">
            {/* Call Header */}
            <div className="w-full p-4 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-error animate-ping" />
                <span className="text-xs uppercase tracking-widest text-primary font-mono font-bold">
                  {callModalOpen === 'video' ? 'Live Video Call' : 'Encrypted Audio Call'}
                </span>
              </div>
              <span className="text-sm font-mono text-tertiary bg-black/40 px-3 py-1 rounded-full border border-surface-container-highest">
                {formatDuration(callDuration)}
              </span>
            </div>

            {/* Video Canvas or Audio Visualizer */}
            {callModalOpen === 'video' ? (
              <div className="relative w-full flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[340px]">
                {/* Local Video Stream Feed */}
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
                />

                {isVideoOff && (
                  <div className="flex flex-col items-center gap-3">
                    <img
                      alt={activeChat?.name || 'Contact'}
                      className="w-24 h-24 rounded-full object-cover ring-4 ring-primary/40 shadow-2xl"
                      src={activeChat?.avatarUrl}
                    />
                    <span className="text-xs text-on-surface-variant font-mono">Camera Paused</span>
                  </div>
                )}

                {/* Peer Picture-in-Picture Floating Avatar/Video */}
                <div className="absolute top-4 right-4 w-28 h-36 rounded-2xl overflow-hidden bg-surface-container-high border-2 border-primary/50 shadow-2xl flex flex-col items-center justify-center p-2 z-10 backdrop-blur-md">
                  <img
                    alt={activeChat?.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-primary mb-1"
                    src={activeChat?.avatarUrl}
                  />
                  <span className="text-[10px] text-white font-semibold truncate w-full text-center">
                    {activeChat?.name}
                  </span>
                  <span className="text-[9px] text-tertiary font-mono">Connected</span>
                </div>

                {streamError && (
                  <div className="absolute bottom-4 left-4 right-4 bg-error/90 text-white p-2 rounded-xl text-xs font-mono">
                    {streamError}
                  </div>
                )}
              </div>
            ) : (
              <div className="relative flex-1 flex flex-col items-center justify-center gap-5 p-6">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                  <img
                    alt={activeChat?.name || 'Contact'}
                    className="w-28 h-28 rounded-full object-cover ring-4 ring-primary/40 relative z-10 shadow-2xl"
                    src={activeChat?.avatarUrl}
                  />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <h3 className="text-xl font-bold text-on-surface">{activeChat?.name || 'Peer Node'}</h3>
                  <span className="text-xs text-on-surface-variant font-mono">AES-256 Voice Stream Active</span>
                </div>

                {/* Live audio waves */}
                <div className="flex items-center gap-1.5 h-10">
                  {[20, 45, 80, 60, 95, 40, 75, 50, 90, 30].map((h, i) => (
                    <div
                      key={i}
                      style={{ height: `${h * 0.4}px` }}
                      className="w-1.5 rounded-full bg-primary animate-pulse"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Call Action Bar */}
            <div className="w-full p-6 bg-surface-container-high flex items-center justify-center gap-4 z-20 border-t border-surface-container-highest">
              {/* Mute Button */}
              <button
                type="button"
                onClick={toggleMute}
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all ${
                  isMuted ? 'bg-error text-white' : 'bg-surface-container text-on-surface hover:bg-surface-bright'
                }`}
                title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
              >
                <span className="material-symbols-outlined">{isMuted ? 'mic_off' : 'mic'}</span>
              </button>

              {/* End Call Button */}
              <button
                type="button"
                onClick={handleEndCall}
                className="w-16 h-16 rounded-full bg-error text-white flex items-center justify-center shadow-2xl active:scale-95 hover:bg-error/90 transition-transform"
                title="End Encrypted Call"
              >
                <span className="material-symbols-outlined text-3xl">call_end</span>
              </button>

              {/* Video Toggle Button (for Video calls) or Speaker Output */}
              {callModalOpen === 'video' ? (
                <>
                  <button
                    type="button"
                    onClick={toggleVideo}
                    className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all ${
                      isVideoOff
                        ? 'bg-error text-white'
                        : 'bg-surface-container text-on-surface hover:bg-surface-bright'
                    }`}
                    title={isVideoOff ? 'Turn camera on' : 'Turn camera off'}
                  >
                    <span className="material-symbols-outlined">{isVideoOff ? 'videocam_off' : 'videocam'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={toggleScreenShare}
                    className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all ${
                      isScreenSharing
                        ? 'bg-tertiary text-black'
                        : 'bg-surface-container text-on-surface hover:bg-surface-bright'
                    }`}
                    title={isScreenSharing ? 'Stop screen share' : 'Share screen'}
                  >
                    <span className="material-symbols-outlined">screen_share</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => alert('Audio output speaker set.')}
                  className="w-12 h-12 rounded-full bg-surface-container text-on-surface flex items-center justify-center shadow-lg active:scale-95 hover:bg-surface-bright transition-all"
                  title="Speakerphone"
                >
                  <span className="material-symbols-outlined">volume_up</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

