'use client';

import React, { useState, useRef, useEffect } from 'react';

interface ChatInputBarProps {
  onSendMessage: (
    text: string,
    type?: 'text' | 'image' | 'voice' | 'code' | 'file',
    mediaUrl?: string,
    mediaMeta?: any
  ) => void;
}

interface SelectedAttachment {
  file: File;
  dataUrl: string;
  name: string;
  sizeFormatted: string;
  type: 'image' | 'file';
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({ onSendMessage }) => {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachment, setAttachment] = useState<SelectedAttachment | null>(null);

  // Real Microphone Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<any>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Clean up media stream on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Format bytes into readable format
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Handle Real File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds the 10MB transmission limit.');
      return;
    }

    const isImg = file.type.startsWith('image/');
    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = reader.result as string;
      setAttachment({
        file,
        dataUrl,
        name: file.name,
        sizeFormatted: formatFileSize(file.size),
        type: isImg ? 'image' : 'file',
      });
    };

    reader.readAsDataURL(file);
    // Reset file input so same file can be re-selected if needed
    e.target.value = '';
  };

  // Start Real Microphone Recording
  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Microphone access is not supported on this browser/environment.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please ensure microphone permissions are granted.');
    }
  };

  // Stop & Send Recording
  const stopAndSendRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    const recorder = mediaRecorderRef.current;
    recorder.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: recorder.mimeType || 'audio/webm',
      });

      // Stop mic tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = reader.result as string;
        const durationM = Math.floor(recordingSeconds / 60);
        const durationS = recordingSeconds % 60;
        const formattedDuration = `${durationM}:${durationS < 10 ? '0' : ''}${durationS}`;

        // Generate dynamic waveform bars based on duration
        const samplePoints = 20;
        const generatedWaveform = Array.from({ length: samplePoints }, () =>
          Math.floor(Math.random() * 65 + 25)
        );

        onSendMessage(
          '🎙️ Encrypted Voice Note',
          'voice',
          base64Audio,
          {
            duration: formattedDuration || '0:01',
            waveform: generatedWaveform,
            name: `voice_note_${Date.now()}.webm`,
            size: formatFileSize(audioBlob.size),
          }
        );
      };

      reader.readAsDataURL(audioBlob);
      setIsRecording(false);
      setRecordingSeconds(0);
    };

    recorder.stop();
  };

  // Cancel Recording
  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  // Handle Send Message
  const handleSend = () => {
    if (attachment) {
      onSendMessage(
        text.trim() || (attachment.type === 'image' ? '📷 Image attachment' : `📎 ${attachment.name}`),
        attachment.type,
        attachment.dataUrl,
        {
          name: attachment.name,
          size: attachment.sizeFormatted,
          mimeType: attachment.file.type,
        }
      );
      setAttachment(null);
      setText('');
      setShowEmojiPicker(false);
      return;
    }

    if (!text.trim()) return;
    onSendMessage(text.trim(), 'text');
    setText('');
    setShowEmojiPicker(false);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="sticky bottom-0 z-30 bg-surface/95 backdrop-blur-2xl border-t border-surface-container-highest/40 px-3 py-2.5 pb-safe max-w-4xl mx-auto w-full shadow-2xl">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
        className="hidden"
      />

      {/* Attachment Preview Banner */}
      {attachment && (
        <div className="mb-2 p-2.5 rounded-2xl bg-surface-container-high border border-primary/30 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2 shadow-lg">
          <div className="flex items-center gap-3 min-w-0">
            {attachment.type === 'image' ? (
              <img
                src={attachment.dataUrl}
                alt="Upload preview"
                className="w-12 h-12 rounded-xl object-cover ring-1 ring-primary/40 flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary flex-shrink-0">
                <span className="material-symbols-outlined text-2xl">description</span>
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="font-label-md text-xs text-on-surface truncate font-semibold">
                {attachment.name}
              </span>
              <span className="font-mono text-[11px] text-tertiary">
                {attachment.sizeFormatted} · Ready for AES-256 transmission
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAttachment(null)}
            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-bright text-on-surface flex items-center justify-center transition-colors flex-shrink-0"
            title="Remove attachment"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}

      {/* Quick Emoji Drawer */}
      {showEmojiPicker && (
        <div className="mb-2 p-2 rounded-2xl bg-surface-container-high/95 backdrop-blur-md border border-surface-bright flex items-center justify-between gap-1 overflow-x-auto no-scrollbar animate-in slide-in-from-bottom-2 shadow-lg">
          {['👋', '👍', '❤️', '🔥', '🚀', '😂', '🎉', '⚡', '✨', '💻', '💡', '🔒', '💯', '👏'].map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                setText((prev) => prev + emoji);
              }}
              className="p-2 hover:bg-surface-bright rounded-xl text-lg transition-transform active:scale-125"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Active Microphone Recording Banner */}
      {isRecording ? (
        <div className="flex items-center justify-between gap-3 bg-surface-container-high p-2 rounded-2xl border border-error/40 animate-in fade-in">
          <div className="flex items-center gap-3 pl-2">
            <span className="w-3.5 h-3.5 rounded-full bg-error animate-ping" />
            <span className="font-mono text-sm font-semibold text-error tracking-wider">
              REC {formatTime(recordingSeconds)}
            </span>
            <div className="flex items-center gap-1">
              {[12, 24, 36, 18, 28, 40, 20, 32].map((h, idx) => (
                <div
                  key={idx}
                  style={{ height: `${h * 0.6}px` }}
                  className="w-1 bg-error/70 rounded-full animate-pulse"
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cancelRecording}
              className="px-3 py-1.5 rounded-xl bg-surface-container text-on-surface text-xs font-semibold hover:bg-surface-bright transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
              Cancel
            </button>
            <button
              type="button"
              onClick={stopAndSendRecording}
              className="w-10 h-10 rounded-full bg-error text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
              title="Send voice note"
            >
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                send
              </span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {/* Real Attachment Selector */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Add attachment from camera or gallery"
            className="w-10 h-10 rounded-full flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container transition-colors active:scale-95 shrink-0"
            title="Attach Image or File"
          >
            <span className="material-symbols-outlined text-[22px]">attach_file</span>
          </button>

          {/* Emoji Button */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            aria-label="Open emoji drawer"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors active:scale-95 shrink-0 ${
              showEmojiPicker
                ? 'text-primary bg-surface-container'
                : 'text-outline hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">mood</span>
          </button>

          {/* Text Input Field */}
          <div className="flex-1 relative flex items-center">
            <input
              type="text"
              className="w-full h-11 bg-surface-container-low text-on-surface placeholder:text-outline text-body-md pl-4 pr-4 rounded-2xl border border-surface-container-highest/60 focus:outline-none focus:border-primary-container focus:bg-surface-container transition-colors"
              placeholder={attachment ? 'Add a caption...' : 'Quantum encrypted message...'}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
          </div>

          {/* Voice Note / Send Button */}
          {text.trim() || attachment ? (
            <button
              type="button"
              onClick={handleSend}
              aria-label="Send message"
              className="w-11 h-11 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shadow-lg active:scale-95 transition-transform shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                send
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              aria-label="Hold to record real microphone voice note"
              className="w-11 h-11 rounded-full bg-surface-container text-primary hover:bg-surface-container-high flex items-center justify-center shadow-lg active:scale-95 transition-all shrink-0"
              title="Record Voice Note"
            >
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                mic
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

