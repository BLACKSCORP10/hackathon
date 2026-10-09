'use client';

import React, { useState } from 'react';
import { FirestoreMessage } from '@/lib/db';
import { VoiceNotePlayer } from './VoiceNotePlayer';

interface ChatMessageBubbleProps {
  message: FirestoreMessage;
  onReact: (messageId: string, emoji: string) => void;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ message, onReact }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [imageExpanded, setImageExpanded] = useState(false);

  const isSelf = message.isSelf;
  const reactions = message.reactions || {};

  const handleEmojiClick = (emoji: string) => {
    onReact(message.id, emoji);
    setShowPicker(false);
  };

  return (
    <>
      <div className={`flex flex-col gap-1 group max-w-[88%] ${isSelf ? 'self-end items-end' : 'self-start items-start'}`}>
        {/* Floating Micro-Reactions Pill Bar */}
        {(Object.keys(reactions).length > 0 || !isSelf) && (
          <div
            className={`-mb-2 z-10 flex items-center gap-1 p-1 rounded-full bg-surface-container-high/90 backdrop-blur-md shadow-md border border-surface-container-highest/40 ${
              isSelf ? 'mr-3' : 'ml-3'
            }`}
          >
            {Object.entries(reactions).map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => handleEmojiClick(emoji)}
                className="px-2 py-0.5 rounded-full bg-surface-container hover:bg-surface-bright text-label-sm font-label-sm text-on-surface flex items-center gap-1 transition-transform active:scale-125"
              >
                <span>{emoji}</span>
                <span className="text-on-surface-variant text-[10px] font-semibold">{count}</span>
              </button>
            ))}

            <div className="relative">
              <button
                onClick={() => setShowPicker(!showPicker)}
                className="w-6 h-6 rounded-full bg-surface-container hover:bg-surface-bright flex items-center justify-center text-on-surface-variant active:scale-110 transition-colors"
                title="Add reaction"
              >
                <span className="material-symbols-outlined text-[14px]">add_reaction</span>
              </button>

              {showPicker && (
                <div className="absolute bottom-8 left-0 z-50 flex items-center gap-1 p-1.5 rounded-2xl bg-surface-container-highest shadow-2xl border border-surface-bright animate-in fade-in zoom-in-95">
                  {['❤️', '🔥', '👍', '😂', '🚀', '🎉', '⚡'].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => handleEmojiClick(emoji)}
                      className="p-1.5 hover:bg-surface-bright rounded-xl text-base transition-transform active:scale-125"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Message Content Container */}
        {message.type === 'text' && (
          <div
            className={`p-3.5 rounded-2xl shadow-sm leading-relaxed text-body-md ${
              isSelf
                ? 'bg-primary-container text-on-primary-container rounded-tr-sm'
                : 'bg-surface-container text-on-surface rounded-tl-sm border border-surface-container-highest/30'
            }`}
          >
            <p className="font-body-md whitespace-pre-wrap">{message.content || message.text}</p>
            <div className="flex items-center justify-end gap-1 mt-1">
              <span
                className={`font-label-sm text-[10px] ${
                  isSelf ? 'text-on-primary-container/70' : 'text-on-surface-variant'
                }`}
              >
                {message.timestamp}
              </span>
              {isSelf && (
                <span className="material-symbols-outlined text-[14px] text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
                  done_all
                </span>
              )}
            </div>
          </div>
        )}

        {/* Image / Multimedia Card */}
        {message.type === 'image' && (
          <div className="bg-surface-container rounded-2xl rounded-tl-sm overflow-hidden shadow-md w-full border border-surface-container-highest/30">
            <div className="relative group cursor-pointer overflow-hidden" onClick={() => setImageExpanded(true)}>
              <img
                alt="Attachment preview"
                className="w-full max-h-56 object-cover transition-transform duration-300 group-hover:scale-105"
                src={message.mediaUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQoqqGEVNNIoEUtVPn9CkBxp5bQdpyrhqv9JeIQaOYY90l3PQiengRMfeNgypd2Ii2ShZ38r95t0TgEjbvI85Ko_ObRH9iNbWMyfbmQZDXw_GRM2Fyk5a2zETw2rc1cDOqMFCwfWJ_IQxpqtcHE7mTmdeIBRXPD5szk8xpwRFTlIBprihpu_hsEdO_TXNDL8wz7rkkHcQjU6SPPAXFlYU1HkB-J-S-t7ksHjstS9Nc0wRz3agCLy8uzg'}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/80 via-transparent to-transparent pointer-events-none" />
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-md bg-surface-container-lowest/80 backdrop-blur-md text-primary font-mono text-xs flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">high_density</span>
                  {message.mediaMeta?.size || 'HD Image'}
                </span>
              </div>
              <div className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-full bg-surface-container-lowest/80 backdrop-blur-md text-on-surface flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">open_in_full</span>
              </div>
            </div>

            <div className="p-3 flex items-center justify-between">
              <div className="flex flex-col min-w-0 pr-2">
                <span className="font-label-md text-xs text-on-surface truncate">
                  {message.mediaMeta?.name || 'attachment.png'}
                </span>
                <span className="font-label-sm text-[11px] text-on-surface-variant">Tap to expand and inspect payload</span>
              </div>
              <button
                onClick={() => window.open(message.mediaUrl, '_blank')}
                className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary hover:bg-surface-bright transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
              </button>
            </div>
          </div>
        )}

        {/* Voice Note Message */}
        {message.type === 'voice' && (
          <div className="w-full">
            <VoiceNotePlayer duration={message.mediaMeta?.duration} waveform={message.mediaMeta?.waveform} />
          </div>
        )}

        {/* Code Snippet Message */}
        {message.type === 'code' && (
          <div className="bg-surface-container-lowest p-3.5 rounded-2xl rounded-tl-sm border border-surface-container-highest shadow-md w-full">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-surface-container-highest/60 text-xs text-on-surface-variant">
              <span className="font-mono text-primary font-semibold">Node Signal Payload</span>
              <button
                onClick={() => navigator.clipboard.writeText(message.content)}
                className="flex items-center gap-1 hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-xs">content_copy</span>
                Copy
              </button>
            </div>
            <pre className="font-mono text-xs text-on-surface overflow-x-auto p-2 bg-surface-container rounded-lg">
              <code>{message.content}</code>
            </pre>
          </div>
        )}

        <span
          className={`font-label-sm text-on-surface-variant text-[10px] px-1 ${
            isSelf ? 'self-end' : 'self-start'
          }`}
        >
          {message.timestamp}
        </span>
      </div>

      {/* Expanded Image Modal */}
      {imageExpanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-fade-in"
          onClick={() => setImageExpanded(false)}
        >
          <div className="relative max-w-2xl max-h-[85vh]">
            <img
              alt="Expanded preview"
              className="w-full h-full object-contain rounded-2xl shadow-2xl border border-surface-container-highest"
              src={message.mediaUrl}
            />
            <button
              onClick={() => setImageExpanded(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-md"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
