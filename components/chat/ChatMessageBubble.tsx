'use client';

import React, { useState } from 'react';
import { FirestoreMessage } from '@/lib/db';
import { VoiceNotePlayer } from './VoiceNotePlayer';
import { useAvatarPreview } from '@/context/AvatarPreviewContext';

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
  const { openAvatarPreview } = useAvatarPreview();
  const [showPicker, setShowPicker] = useState(false);
  const [imageExpanded, setImageExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  const isSelf = message.isSelf;
  const isAi = message.isAi || message.senderId === 'gemini-ai' || message.type === 'ai';
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

  const copyContent = () => {
    navigator.clipboard.writeText(message.content || message.text || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Render Status Checkmark for Sender
  const renderReadStatus = () => {
    if (!isSelf || isAi) return null;

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
          className="material-symbols-outlined text-[15px] text-slate-300/80"
          style={{ fontVariationSettings: "'FILL' 1" }}
          title="Delivered to device"
        >
          done_all
        </span>
      );
    }

    return (
      <span
        className="material-symbols-outlined text-[15px] text-slate-300/70"
        title="Sent"
      >
        check
      </span>
    );
  };

  // Special Inline AI Message Bubble
  if (isAi) {
    return (
      <div className="flex flex-col gap-1.5 self-start items-start max-w-[92%] sm:max-w-[85%] animate-fade-in my-1 group">
        <div className="relative rounded-3xl p-4 bg-gradient-to-b from-slate-900/90 via-slate-900/80 to-slate-950/90 backdrop-blur-xl border border-indigo-500/30 shadow-[0_8px_30px_rgba(99,102,241,0.15)] rounded-tl-sm flex flex-col gap-2.5">
          {/* AI Header */}
          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2">
            <button
              type="button"
              onClick={() =>
                openAvatarPreview({
                  name: 'Nexus Gemini 2.5 Flash',
                  avatarUrl: 'https://cdn.worldvectorlogo.com/logos/google-gemini-icon.svg',
                  username: 'gemini_flash_ai',
                  bio: 'Google DeepMind High-Speed Multi-Modal AI Assistant with Real-Time Synthesis.',
                  statusText: 'AI Real-Time Engine Active',
                  isOnline: true,
                })
              }
              className="flex items-center gap-2 group/ai cursor-pointer focus:outline-none"
              title="View Gemini AI Profile"
            >
              <div className="w-6 h-6 rounded-lg bg-indigo-500/20 p-0.5 border border-indigo-500/40 flex items-center justify-center group-hover/ai:ring-2 ring-indigo-400/50 transition-all">
                <img
                  src="https://cdn.worldvectorlogo.com/logos/google-gemini-icon.svg"
                  alt="Gemini"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-cyan-300 to-purple-300 font-mono group-hover/ai:underline">
                Nexus Gemini 2.5 Flash
              </span>
            </button>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={copyContent}
                className="px-2 py-0.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[11px] text-slate-300 flex items-center gap-1 transition-colors"
                title="Copy AI Response"
              >
                <span className="material-symbols-outlined text-[13px]">
                  {copied ? 'check' : 'content_copy'}
                </span>
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* AI Content */}
          <div className="text-sm leading-relaxed text-slate-200 font-sans whitespace-pre-wrap selection:bg-indigo-500/30">
            {message.content || message.text}
          </div>

          {/* AI Footer */}
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-white/5">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Real-Time AI Synthesis
            </span>
            <span>{message.timestamp}</span>
          </div>
        </div>
      </div>
    );
  }

  const defaultPeerAvatar =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBfpDzwR2xsNv-nsDiy8QJclKg9hzaA5jd1kdt99vR7jPAQs7lZv5vgSDaWYMhGBFv8Ei5ezRYpDb_wAr3lxlYpw8f1qiS29oJ2P6AuVne7dMFwLILfdkLxBonarXmqdT-fgwxrcciUyl8XN29J9Qzkg1NNk2FlFeMbplyopjX2HVtWSHqczvwBI-yU2C6Lqtz9vj-edQeNxEaj3poxvGbhIAuyi2eO9XjNTiCQFGtefBCjPKttKXgFsA';

  const handlePeerAvatarClick = () => {
    openAvatarPreview({
      name: message.senderName || 'Nexus Operative',
      avatarUrl: message.senderAvatar || defaultPeerAvatar,
      username: message.senderName ? message.senderName.toLowerCase().replace(/\s+/g, '_') : 'operative',
      bio: 'Connected via encrypted Firestore signal channel with AES-256 E2EE.',
      statusText: 'Verified Network Operative',
      isOnline: true,
    });
  };

  return (
    <>
      <div
        className={`flex gap-2 group relative max-w-[88%] sm:max-w-[78%] animate-fade-in ${
          isSelf ? 'self-end justify-end' : 'self-start justify-start items-end'
        }`}
      >
        {!isSelf && (
          <button
            type="button"
            onClick={handlePeerAvatarClick}
            className="w-7 h-7 rounded-full overflow-hidden shrink-0 mb-1 ring-1 ring-white/20 hover:ring-2 hover:ring-indigo-400 focus:outline-none transition-all cursor-pointer shadow-md active:scale-95"
            title={`View ${message.senderName || 'Operative'}'s profile picture`}
          >
            <img
              src={message.senderAvatar || defaultPeerAvatar}
              alt={message.senderName || 'Operative'}
              className="w-full h-full object-cover bg-slate-800"
            />
          </button>
        )}

        <div className={`flex flex-col gap-1 ${isSelf ? 'items-end' : 'items-start'}`}>
          {/* Floating Quick Actions Bar (Reactions & Delete) */}
          <div
            className={`z-10 flex items-center gap-1 p-0.5 rounded-full bg-slate-900/90 backdrop-blur-md shadow-lg border border-white/10 transition-opacity opacity-0 group-hover:opacity-100 ${
              Object.keys(reactions).length > 0 ? 'opacity-100' : ''
            } ${isSelf ? '-mb-2 mr-2' : '-mb-2 ml-2'}`}
          >
          {/* Reaction Pills */}
          {Object.entries(reactions).map(([emoji, count]) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleEmojiClick(emoji)}
              className="px-2 py-0.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1 transition-transform active:scale-125 border border-white/5"
            >
              <span>{emoji}</span>
              <span className="text-slate-400 text-[10px] font-bold">{count}</span>
            </button>
          ))}

          {/* Emoji Picker Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPicker(!showPicker)}
              className="w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white active:scale-110 transition-colors"
              title="Add reaction"
            >
              <span className="material-symbols-outlined text-[14px]">add_reaction</span>
            </button>

            {showPicker && (
              <div className="absolute bottom-8 left-0 z-50 flex items-center gap-1 p-1.5 rounded-2xl bg-slate-900 shadow-2xl border border-white/15 animate-in fade-in zoom-in-95">
                {['❤️', '🔥', '👍', '😂', '🚀', '🎉', '⚡'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleEmojiClick(emoji)}
                    className="p-1.5 hover:bg-slate-800 rounded-xl text-base transition-transform active:scale-125"
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
                className="w-6 h-6 rounded-full bg-slate-800 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center text-slate-400 active:scale-110 transition-colors"
                title="Delete message from Firestore"
              >
                <span className="material-symbols-outlined text-[14px]">delete_outline</span>
              </button>

              {showDeleteConfirm && (
                <div
                  className={`absolute bottom-8 z-50 p-2.5 rounded-2xl bg-slate-900 shadow-2xl border border-red-500/40 flex flex-col gap-2 min-w-[170px] animate-in fade-in ${
                    isSelf ? 'right-0' : 'left-0'
                  }`}
                >
                  <span className="text-xs text-white font-semibold">Delete message?</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={handleDelete}
                      className="flex-1 py-1 rounded-lg bg-red-500 text-white text-[11px] font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px] hover:bg-slate-700 transition-colors"
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
            className={`p-3.5 rounded-3xl shadow-lg leading-relaxed text-sm backdrop-blur-lg border transition-all ${
              isSelf
                ? 'bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white rounded-tr-sm border-indigo-400/30 shadow-indigo-500/10'
                : 'bg-slate-900/80 text-slate-100 rounded-tl-sm border-white/10 shadow-black/20'
            }`}
          >
            <p className="whitespace-pre-wrap leading-relaxed">{message.content || message.text}</p>
            <div className="flex items-center justify-end gap-1.5 mt-1.5 pt-0.5">
              <span
                className={`font-mono text-[10px] ${
                  isSelf ? 'text-indigo-200' : 'text-slate-400'
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
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl rounded-tl-sm overflow-hidden shadow-xl w-full border border-white/10 max-w-sm">
            <div
              className="relative group cursor-pointer overflow-hidden bg-black/60"
              onClick={() => setImageExpanded(true)}
            >
              <img
                alt="Attachment preview"
                className="w-full max-h-72 object-cover transition-transform duration-300 group-hover:scale-105"
                src={message.mediaUrl}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-cyan-400 font-mono text-xs flex items-center gap-1 border border-white/10">
                  <span className="material-symbols-outlined text-[13px]">high_density</span>
                  {message.mediaMeta?.size || 'Encrypted Photo'}
                </span>
              </div>
              <div className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-full bg-black/70 backdrop-blur-md text-white flex items-center justify-center border border-white/15">
                <span className="material-symbols-outlined text-[18px]">open_in_full</span>
              </div>
            </div>

            <div className="p-3 flex items-center justify-between">
              <div className="flex flex-col min-w-0 pr-2">
                <span className="text-xs text-white truncate font-semibold">
                  {message.mediaMeta?.name || 'photo_attachment.jpg'}
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="font-mono text-[10px] text-slate-400">{message.timestamp}</span>
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
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-cyan-400 transition-colors flex-shrink-0 border border-white/5"
                title="Download attachment"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
              </button>
            </div>
          </div>
        )}

        {/* File Attachment Card */}
        {message.type === 'file' && (
          <div className="bg-slate-900/80 backdrop-blur-xl p-3.5 rounded-3xl rounded-tl-sm border border-white/10 shadow-xl w-full max-w-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-2xl">description</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-white truncate font-semibold">
                  {message.mediaMeta?.name || 'document.pdf'}
                </span>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
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
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-cyan-400 transition-colors flex-shrink-0 border border-white/5"
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
              <span className="font-mono text-slate-400 text-[10px]">{message.timestamp}</span>
              {renderReadStatus()}
            </div>
          </div>
        )}

        {/* Code Snippet Message */}
        {message.type === 'code' && (
          <div className="bg-slate-950 p-4 rounded-3xl rounded-tl-sm border border-white/10 shadow-xl w-full font-mono">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs text-slate-400">
              <span className="text-cyan-400 font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">terminal</span>
                Code Payload
              </span>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(message.content)}
                className="flex items-center gap-1 hover:text-white"
              >
                <span className="material-symbols-outlined text-xs">content_copy</span>
                Copy
              </button>
            </div>
            <pre className="text-xs text-slate-200 overflow-x-auto p-2.5 bg-slate-900/90 rounded-xl border border-white/5">
              <code>{message.content}</code>
            </pre>
            <div className="flex items-center justify-end gap-1 mt-1.5">
              <span className="font-mono text-slate-400 text-[10px]">{message.timestamp}</span>
              {renderReadStatus()}
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Expanded Image Modal */}
      {imageExpanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl animate-fade-in"
          onClick={() => setImageExpanded(false)}
        >
          <div className="relative max-w-3xl max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <img
              alt="Expanded preview"
              className="w-full h-full object-contain rounded-3xl shadow-2xl border border-white/15"
              src={message.mediaUrl}
            />
            <button
              type="button"
              onClick={() => setImageExpanded(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-900/80 text-white flex items-center justify-center backdrop-blur-md hover:bg-slate-800 transition-colors border border-white/10"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
