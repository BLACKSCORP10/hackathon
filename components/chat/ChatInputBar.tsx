'use client';

import React, { useState } from 'react';

interface ChatInputBarProps {
  onSendMessage: (text: string, type?: 'text' | 'image' | 'voice' | 'code' | 'file', mediaUrl?: string, mediaMeta?: any) => void;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({ onSendMessage }) => {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const handleSend = () => {
    if (!text.trim()) return;
    onSendMessage(text.trim(), 'text');
    setText('');
    setShowEmojiPicker(false);
  };

  const handleSendMockVoice = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      onSendMessage('Voice note transmission', 'voice', undefined, {
        duration: '0:34',
        waveform: [20, 40, 60, 80, 50, 70, 90, 40, 30, 60, 80, 70, 50, 30, 40],
      });
    }, 1500);
  };

  const handleAttachMockImage = () => {
    onSendMessage('Photo attachment', 'image', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQoqqGEVNNIoEUtVPn9CkBxp5bQdpyrhqv9JeIQaOYY90l3PQiengRMfeNgypd2Ii2ShZ38r95t0TgEjbvI85Ko_ObRH9iNbWMyfbmQZDXw_GRM2Fyk5a2zETw2rc1cDOqMFCwfWJ_IQxpqtcHE7mTmdeIBRXPD5szk8xpwRFTlIBprihpu_hsEdO_TXNDL8wz7rkkHcQjU6SPPAXFlYU1HkB-J-S-t7ksHjstS9Nc0wRz3agCLy8uzg', {
      name: 'webrtc-stream-metrics.png',
      size: 'HD 2.1 MB',
    });
  };

  return (
    <div className="sticky bottom-0 z-30 bg-surface/90 backdrop-blur-xl border-t border-surface-container-highest/40 px-3 py-2 pb-safe max-w-4xl mx-auto w-full">
      {/* Quick Emoji Drawer */}
      {showEmojiPicker && (
        <div className="mb-2 p-2 rounded-2xl bg-surface-container-high/95 backdrop-blur-md border border-surface-bright flex items-center justify-between gap-1 overflow-x-auto no-scrollbar animate-in slide-in-from-bottom-2">
          {['👋', '👍', '❤️', '🔥', '🚀', '😂', '🎉', '⚡', '✨', '💻', '💡', '🔒'].map(emoji => (
            <button
              key={emoji}
              onClick={() => {
                setText(prev => prev + emoji);
              }}
              className="p-2 hover:bg-surface-bright rounded-xl text-lg transition-transform active:scale-125"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Attachment Options */}
        <button
          onClick={handleAttachMockImage}
          aria-label="Add attachment"
          className="w-10 h-10 rounded-full flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container transition-colors active:scale-95 shrink-0"
          title="Attach Image"
        >
          <span className="material-symbols-outlined text-[22px]">add_circle</span>
        </button>

        {/* Emoji Button */}
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          aria-label="Open emoji drawer"
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors active:scale-95 shrink-0 ${
            showEmojiPicker ? 'text-primary bg-surface-container' : 'text-outline hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">mood</span>
        </button>

        {/* Input Field */}
        <div className="flex-1 relative flex items-center">
          <input
            type="text"
            className="w-full h-11 bg-surface-container-low text-on-surface placeholder:text-outline text-body-md pl-4 pr-10 rounded-2xl border border-surface-container-highest/60 focus:outline-none focus:border-primary-container focus:bg-surface-container transition-colors"
            placeholder={isRecording ? 'Transmitting encrypted audio...' : 'Quantum encrypted message...'}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
        </div>

        {/* Voice Note / Send Button */}
        {text.trim() ? (
          <button
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
            onClick={handleSendMockVoice}
            disabled={isRecording}
            aria-label="Record voice note"
            className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all shrink-0 ${
              isRecording
                ? 'bg-error text-white animate-pulse'
                : 'bg-surface-container text-primary hover:bg-surface-container-high'
            }`}
            title="Record Voice Note"
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              mic
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
