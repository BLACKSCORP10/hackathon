'use client';

import React, { useState, useRef, useEffect } from 'react';
import { compressImage } from '@/lib/imageUtils';

interface ChatInputBarProps {
  onSendMessage: (
    text: string,
    type?: 'text' | 'image' | 'voice' | 'code' | 'file' | 'ai',
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

  // Microphone Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<any>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImg = file.type.startsWith('image/');

    if (isImg) {
      try {
        const compressed = await compressImage(file, 800, 0.6);
        setAttachment({
          file,
          dataUrl: compressed.dataUrl,
          name: file.name,
          sizeFormatted: compressed.sizeFormatted,
          type: 'image',
        });
      } catch (err) {
        console.warn('Image compression fallback:', err);
        const reader = new FileReader();
        reader.onload = () => {
          setAttachment({
            file,
            dataUrl: reader.result as string,
            name: file.name,
            sizeFormatted: formatFileSize(file.size),
            type: 'image',
          });
        };
        reader.readAsDataURL(file);
      }
    } else {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds the 10MB transmission limit.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setAttachment({
          file,
          dataUrl: reader.result as string,
          name: file.name,
          sizeFormatted: formatFileSize(file.size),
          type: 'file',
        });
      };
      reader.readAsDataURL(file);
    }

    e.target.value = '';
  };

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

  const stopAndSendRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    const recorder = mediaRecorderRef.current;
    recorder.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: recorder.mimeType || 'audio/webm',
      });

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
    <div className="sticky bottom-0 z-30 bg-slate-950/85 backdrop-blur-2xl border-t border-white/10 px-3 py-2.5 pb-safe max-w-4xl mx-auto w-full shadow-2xl">
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
        <div className="mb-2.5 p-2.5 rounded-2xl bg-slate-900/90 border border-indigo-500/30 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2 shadow-xl backdrop-blur-xl">
          <div className="flex items-center gap-3 min-w-0">
            {attachment.type === 'image' ? (
              <img
                src={attachment.dataUrl}
                alt="Upload preview"
                className="w-12 h-12 rounded-xl object-cover ring-2 ring-indigo-500/40 flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400 flex-shrink-0">
                <span className="material-symbols-outlined text-2xl">description</span>
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-xs text-white truncate font-semibold">
                {attachment.name}
              </span>
              <span className="font-mono text-[11px] text-emerald-400">
                {attachment.sizeFormatted} · Base64 Ready
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAttachment(null)}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors flex-shrink-0"
            title="Remove attachment"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}

      {/* Quick Emoji Drawer */}
      {showEmojiPicker && (
        <div className="mb-2 p-2 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-white/15 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar animate-in slide-in-from-bottom-2 shadow-2xl">
          {['👋', '👍', '❤️', '🔥', '🚀', '😂', '🎉', '⚡', '✨', '💻', '💡', '🔒', '💯', '👏'].map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                setText((prev) => prev + emoji);
              }}
              className="p-2 hover:bg-slate-800 rounded-xl text-lg transition-transform active:scale-125"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Active Microphone Recording Banner */}
      {isRecording ? (
        <div className="flex items-center justify-between gap-3 bg-slate-900/95 p-2.5 rounded-2xl border border-red-500/40 animate-in fade-in shadow-xl">
          <div className="flex items-center gap-3 pl-2">
            <span className="w-3.5 h-3.5 rounded-full bg-red-500 animate-ping" />
            <span className="font-mono text-sm font-semibold text-red-400 tracking-wider">
              REC {formatTime(recordingSeconds)}
            </span>
            <div className="flex items-center gap-1">
              {[12, 24, 36, 18, 28, 40, 20, 32].map((h, idx) => (
                <div
                  key={idx}
                  style={{ height: `${h * 0.6}px` }}
                  className="w-1 bg-red-500/70 rounded-full animate-pulse"
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cancelRecording}
              className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
              Cancel
            </button>
            <button
              type="button"
              onClick={stopAndSendRecording}
              className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
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
            aria-label="Add attachment"
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-900 transition-colors active:scale-95 shrink-0"
            title="Attach Photo or File"
          >
            <span className="material-symbols-outlined text-[22px]">attach_file</span>
          </button>

          {/* Quick Gemini Action Pill */}
          <button
            type="button"
            onClick={() => {
              if (text.startsWith('@gemini ')) {
                setText('@gemini summarize');
              } else {
                setText('@gemini ');
              }
            }}
            className="px-2.5 py-1 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 font-mono text-xs flex items-center gap-1 transition-all active:scale-95 shrink-0"
            title="Ask Gemini AI"
          >
            <img
              src="https://cdn.worldvectorlogo.com/logos/google-gemini-icon.svg"
              alt="Gemini"
              className="w-3.5 h-3.5 object-contain"
            />
            <span className="hidden sm:inline font-semibold">@gemini</span>
          </button>

          {/* Emoji Button */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            aria-label="Open emoji drawer"
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors active:scale-95 shrink-0 ${
              showEmojiPicker
                ? 'text-cyan-400 bg-slate-900'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">mood</span>
          </button>

          {/* Text Input Field */}
          <div className="flex-1 relative flex items-center">
            <input
              type="text"
              className="w-full h-11 bg-slate-900/80 text-white placeholder:text-slate-500 text-sm pl-4 pr-4 rounded-2xl border border-white/10 focus:outline-none focus:border-indigo-500 focus:bg-slate-900 transition-all shadow-inner"
              placeholder={
                attachment
                  ? 'Add a caption...'
                  : 'Type a message or @gemini...'
              }
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
              className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform shrink-0"
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
              className="w-11 h-11 rounded-2xl bg-slate-900 hover:bg-slate-800 text-cyan-400 flex items-center justify-center shadow-lg active:scale-95 transition-all shrink-0 border border-white/10"
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
