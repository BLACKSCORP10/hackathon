'use client';

import React, { useState } from 'react';
import { FirestoreMessage } from '@/lib/db';
import { VoiceNotePlayer } from './VoiceNotePlayer';

interface ChatMessageBubbleProps {
  message: FirestoreMessage;
  onReact: (messageId: string, emoji: string) => void;
  onDelete?: (messageId: string) => void;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  message,
  onReact,
  onDelete,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [imageExpanded, setImageExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isSelf = message.isSelf;
  const reactions = message.reactions || {};

  const handleEmojiClick = (emoji: string) => {
    onReact(message.id, emoji);
    setShowPicker(false);
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(message.id);
    } catch (e) {
      console.error('Error deleting message:', e);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Render Status Checkmark for Sender
  const renderReadStatus = () => {
    if (!isSelf) return null;

    const status = message.status || 'delivered';

    if (status === 'read') {
      return (
        <span
          className="material-symbols-outlined text-[15px] text-cyan-400 font-bold"
          style={{ fontVariationSettings: "'FILL' 1" }}
          title="Read by recipient"
        >
          done_all
        </span>
      );
    }

    if (status === 'delivered') {
      return (
        <span
          className="material-symbols-outlined text-[15px] text-on-primary-container/70"
          style={{ fontVariationSettings: "'FILL' 1" }}
          title="Delivered to device"
        >
          done_all
        </span>
      );
    }

    return (
      <span
        className="material-symbols-outlined text-[15px] text-on-primary-container/70"
        title="Sent"
      >
        check
      </span>
    );
  };

  return (
    <>
      <div
        className={`flex flex-col gap-1 group relative max-w-[88%] ${
          isSelf ? 'self-end items-end' : 'self-start items-start'
        }`}
      >
        {/* Floating Quick Actions Bar (Reactions & Delete) */}
        <div
          className={`z-10 flex items-center gap-1 p-0.5 rounded-full bg-surface-container-high/95 backdrop-blur-md shadow-md border border-surface-container-highest/50 transition-opacity opacity-0 group-hover:opacity-100 ${
            Object.keys(reactions).length > 0 ? 'opacity-100' : ''
          } ${isSelf ? '-mb-2 mr-2' : '-mb-2 ml-2'}`}
        >
          {/* Reaction Pills */}
          {Object.entries(reactions).map(([emoji, count]) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleEmojiClick(emoji)}
              className="px-2 py-0.5 rounded-full bg-surface-container hover:bg-surface-bright text-label-sm font-label-sm text-on-surface flex items-center gap-1 transition-transform active:scale-125"
            >
              <span>{emoji}</span>
              <span className="text-on-surface-variant text-[10px] font-semibold">{count}</span>
            </button>
          ))}

          {/* Emoji Picker Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPicker(!showPicker)}
              className="w-6 h-6 rounded-full bg-surface-container hover:bg-surface-bright flex items-center justify-center text-on-surface-variant active:scale-110 transition-colors"
              title="Add reaction"
            >
              <span className="material-symbols-outlined text-[14px]">add_reaction</span>
            </button>

            {showPicker && (
              <div className="absolute bottom-8 left-0 z-50 flex items-center gap-1 p-1.5 rounded-2xl bg-surface-container-highest shadow-2xl border border-surface-bright animate-in fade-in zoom-in-95">
                {['❤️', '🔥', '👍', '😂', '🚀', '🎉', '⚡'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleEmojiClick(emoji)}
                    className="p-1.5 hover:bg-surface-bright rounded-xl text-base transition-transform active:scale-125"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Delete Message Button */}
          {onDelete && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                className="w-6 h-6 rounded-full bg-surface-container hover:bg-error/20 hover:text-error flex items-center justify-center text-on-surface-variant active:scale-110 transition-colors"
                title="Delete message from Firestore"
              >
                <span className="material-symbols-outlined text-[14px]">delete_outline</span>
              </button>

              {showDeleteConfirm && (
                <div
                  className={`absolute bottom-8 z-50 p-2.5 rounded-2xl bg-surface-container-highest shadow-2xl border border-error/40 flex flex-col gap-2 min-w-[170px] animate-in fade-in ${
                    isSelf ? 'right-0' : 'left-0'
                  }`}
                >
                  <span className="text-xs text-on-surface font-semibold">Delete message?</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={handleDelete}
                      className="flex-1 py-1 rounded-lg bg-error text-white text-[11px] font-bold hover:bg-error/90 transition-colors disabled:opacity-50"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-1 rounded-lg bg-surface-container text-on-surface text-[11px] hover:bg-surface-bright transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Text Message Container */}
        {message.type === 'text' && (
          <div
            className={`p-3.5 rounded-2xl shadow-sm leading-relaxed text-body-md ${
              isSelf
                ? 'bg-primary-container text-on-primary-container rounded-tr-sm'
                : 'bg-surface-container text-on-surface rounded-tl-sm border border-surface-container-highest/30'
            }`}
          >
            <p className="font-body-md whitespace-pre-wrap">{message.content || message.text}</p>
            <div className="flex items-center justify-end gap-1.5 mt-1">
              <span
                className={`font-label-sm text-[10px] ${
                  isSelf ? 'text-on-primary-container/70' : 'text-on-surface-variant'
                }`}
              >
                {message.timestamp}
              </span>
              {renderReadStatus()}
            </div>
          </div>
        )}

        {/* Image / Multimedia Card */}
        {message.type === 'image' && (
          <div className="bg-surface-container rounded-2xl rounded-tl-sm overflow-hidden shadow-md w-full border border-surface-container-highest/30 max-w-sm">
            <div
              className="relative group cursor-pointer overflow-hidden bg-black/40"
              onClick={() => setImageExpanded(true)}
            >
              <img
                alt="Attachment preview"
                className="w-full max-h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                src={message.mediaUrl}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/80 via-transparent to-transparent pointer-events-none" />
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-md bg-surface-container-lowest/80 backdrop-blur-md text-primary font-mono text-xs flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">high_density</span>
                  {message.mediaMeta?.size || 'Encrypted Photo'}
                </span>
              </div>
              <div className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-full bg-surface-container-lowest/80 backdrop-blur-md text-on-surface flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">open_in_full</span>
              </div>
            </div>

            <div className="p-3 flex items-center justify-between">
              <div className="flex flex-col min-w-0 pr-2">
                <span className="font-label-md text-xs text-on-surface truncate font-semibold">
                  {message.mediaMeta?.name || 'photo_attachment.jpg'}
                </span>
                <div className="flex items-center gap-1">
                  <span className="font-label-sm text-[11px] text-on-surface-variant">{message.timestamp}</span>
                  {renderReadStatus()}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = message.mediaUrl || '';
                  a.download = message.mediaMeta?.name || 'attachment.jpg';
                  a.click();
                }}
                className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary hover:bg-surface-bright transition-colors flex-shrink-0"
                title="Download attachment"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
              </button>
            </div>
          </div>
        )}

        {/* File Attachment Card */}
        {message.type === 'file' && (
          <div className="bg-surface-container p-3 rounded-2xl rounded-tl-sm border border-surface-container-highest/40 shadow-md w-full max-w-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-2xl">description</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-md text-xs text-on-surface truncate font-semibold">
                  {message.mediaMeta?.name || 'file_attachment.pdf'}
                </span>
                <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant font-mono">
                  <span>{message.mediaMeta?.size || 'Encrypted File'}</span>
                  <span>·</span>
                  <span>{message.timestamp}</span>
                  {renderReadStatus()}
                </div>
              </div>
            </div>

            {message.mediaUrl && (
              <button
                type="button"
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = message.mediaUrl || '';
                  a.download = message.mediaMeta?.name || 'document';
                  a.click();
                }}
                className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary hover:bg-surface-bright transition-colors flex-shrink-0"
                title="Download file"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
              </button>
            )}
          </div>
        )}

        {/* Voice Note Message */}
        {message.type === 'voice' && (
          <div className="w-full max-w-sm">
            <VoiceNotePlayer
              mediaUrl={message.mediaUrl}
              duration={message.mediaMeta?.duration}
              waveform={message.mediaMeta?.waveform}
            />
            <div className="flex items-center justify-end gap-1 mt-1 px-1">
              <span className="font-label-sm text-on-surface-variant text-[10px]">{message.timestamp}</span>
              {renderReadStatus()}
            </div>
          </div>
        )}

        {/* Code Snippet Message */}
        {message.type === 'code' && (
          <div className="bg-surface-container-lowest p-3.5 rounded-2xl rounded-tl-sm border border-surface-container-highest shadow-md w-full">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-surface-container-highest/60 text-xs text-on-surface-variant">
              <span className="font-mono text-primary font-semibold">Node Signal Payload</span>
              <button
                type="button"
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
            <div className="flex items-center justify-end gap-1 mt-1">
              <span className="font-label-sm text-on-surface-variant text-[10px]">{message.timestamp}</span>
              {renderReadStatus()}
            </div>
          </div>
        )}
      </div>

      {/* Expanded Image Modal */}
      {imageExpanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-fade-in"
          onClick={() => setImageExpanded(false)}
        >
          <div className="relative max-w-3xl max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <img
              alt="Expanded preview"
              className="w-full h-full object-contain rounded-2xl shadow-2xl border border-surface-container-highest"
              src={message.mediaUrl}
            />
            <button
              type="button"
              onClick={() => setImageExpanded(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-md hover:bg-black/80 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

