'use client';

import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FirestoreStory, createFirestoreStory, deleteFirestoreStory } from '@/lib/db';
import { TopHeader } from '@/components/navigation/TopHeader';
import { BottomNav } from '@/components/navigation/BottomNav';
import { useAuth } from '@/context/AuthContext';

export default function StoriesMomentsPage() {
  const { user } = useAuth();
  const [stories, setStories] = useState<FirestoreStory[]>([]);
  const [selectedStory, setSelectedStory] = useState<FirestoreStory | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [newCaption, setNewCaption] = useState('');
  const [newMediaDataUrl, setNewMediaDataUrl] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [storyProgress, setStoryProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 1. Real-Time Firestore Stories Listener
  useEffect(() => {
    const storiesRef = collection(db, 'stories');
    const q = query(storiesRef, orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as FirestoreStory[];
        setStories(loaded);
      },
      () => setStories([])
    );
    return () => unsubscribe();
  }, []);

  // 2. Story Viewer Progress Timer
  useEffect(() => {
    let timer: any;
    if (selectedStory) {
      setStoryProgress(0);
      timer = setInterval(() => {
        setStoryProgress((prev) => {
          if (prev >= 100) {
            setSelectedStory(null);
            return 0;
          }
          return prev + 2;
        });
      }, 100);
    }
    return () => clearInterval(timer);
  }, [selectedStory]);

  // Handle Real File Selection for Story
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Photo exceeds 10MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setNewMediaDataUrl(reader.result as string);
      setShowAddModal(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handlePostStory = async () => {
    if (!user || !newMediaDataUrl.trim()) return;
    setIsPosting(true);
    try {
      await createFirestoreStory({
        userId: user.uid,
        userName: user.name || user.username || 'Nexus Operative',
        userAvatar: user.avatarUrl,
        mediaUrl: newMediaDataUrl.trim(),
        caption: newCaption.trim() || 'Encrypted moment transmission',
      });
      setShowAddModal(false);
      setNewCaption('');
      setNewMediaDataUrl('');
    } catch (e) {
      console.error('Error posting moment to Firestore:', e);
      alert('Could not publish moment. Please verify connection.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeleteStory = async (storyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this moment permanently?')) return;
    try {
      await deleteFirestoreStory(storyId);
      if (selectedStory?.id === storyId) {
        setSelectedStory(null);
      }
    } catch (err) {
      console.error('Error deleting story:', err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <TopHeader title="NexusChat" subtitle="Moments" />

      {/* Hidden File Input for Story Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*,video/*"
        className="hidden"
      />

      <main className="flex-1 flex flex-col pt-16 pb-24 max-w-4xl mx-auto w-full px-4 py-4 gap-5">
        {/* User Story Broadcast Card */}
        <section className="bg-slate-900/60 backdrop-blur-xl rounded-3xl p-4 flex items-center justify-between shadow-xl border border-white/10">
          <div className="flex items-center gap-3.5">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-14 h-14 rounded-full p-0.5 border-2 border-dashed border-indigo-500 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
            >
              <img
                alt="My Status"
                className="w-full h-full rounded-full object-cover bg-slate-800"
                src={
                  user?.avatarUrl ||
                  'https://lh3.googleusercontent.com/aida-public/AB6AXuBtBpKB_hileIlifX6sIEN1CejCdWChfud93K51ft6qbVAZGnNhgqOzEmRgRNKiXYmea02Rm_mfRlL4AHI_ItdqoN6YZVbkjMGEFJn9rFTi8f2qZhei2yeMgZeHtgQV5yXQF7YUXf2O0NJKF6vcI9YUi-j1j92Vl1KXD3HYPvXIr69s-RcPPJwDTsL8y-iPl1Q0X1ZzKzt1-ZLCey8Dhh2LghufDcKrM1SDMHbrLm8ClBwd0My832aNZQ'
                }
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white flex items-center justify-center text-xs font-bold shadow-lg shadow-indigo-500/50">
                +
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-100">My Status</span>
              <span className="text-xs text-slate-400">Tap + or camera to share 24h photo moment</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 flex items-center justify-center text-indigo-300 active:scale-95 shadow-md border border-indigo-500/30 transition-all"
            title="Upload Photo / Camera"
          >
            <span className="material-symbols-outlined text-[20px]">photo_camera</span>
          </button>
        </section>

        {/* Live Ephemeral Updates Feed */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <span className="font-mono text-xs text-slate-400 uppercase tracking-wider">
              Live Ephemeral Updates ({stories.length})
            </span>
            <span className="text-[11px] text-emerald-400 font-mono">24h Auto-Expiry</span>
          </div>

          {stories.length === 0 ? (
            <div className="py-14 flex flex-col items-center justify-center gap-3 text-slate-500 bg-slate-900/40 backdrop-blur-xl rounded-3xl p-6 border border-white/10 text-center shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <span className="material-symbols-outlined text-3xl">auto_stories</span>
              </div>
              <p className="text-sm font-bold text-slate-100">No moments uploaded yet</p>
              <p className="text-xs max-w-xs text-slate-400 leading-relaxed">
                Upload a camera snapshot or image to broadcast a 24-hour ephemeral moment to your network.
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 active:scale-95 flex items-center gap-1.5 transition-all"
              >
                <span className="material-symbols-outlined text-base">add_a_photo</span>
                Create Moment
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {stories.map((story) => {
                const isOwn = story.userId === user?.uid;
                return (
                  <div
                    key={story.id}
                    onClick={() => setSelectedStory(story)}
                    className="relative h-64 rounded-3xl overflow-hidden shadow-xl border border-white/10 group cursor-pointer bg-slate-900"
                  >
                    <img
                      alt={story.caption}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      src={story.mediaUrl}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/50 pointer-events-none" />

                    {/* Sender Avatar & Name */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-full p-0.5 bg-gradient-to-tr from-indigo-500 to-pink-500 shadow-md flex-shrink-0">
                          <img
                            alt={story.userName}
                            className="w-full h-full rounded-full object-cover bg-slate-800"
                            src={story.userAvatar}
                          />
                        </div>
                        <span className="text-xs text-white font-medium drop-shadow truncate">{story.userName}</span>
                      </div>

                      {/* Delete option for own stories */}
                      {isOwn && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteStory(story.id, e)}
                          className="w-7 h-7 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center transition-colors shadow-md"
                          title="Delete my story"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      )}
                    </div>

                    {/* Caption */}
                    <div className="absolute bottom-3 left-3 right-3 z-10">
                      <p className="text-xs text-white/95 line-clamp-2 drop-shadow-md font-medium leading-snug">
                        {story.caption}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Story Upload Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-fade-in">
          <div className="relative w-full max-w-sm bg-slate-900/90 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl flex flex-col gap-4 border border-white/10">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-slate-100">Publish 24h Moment</h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setNewMediaDataUrl('');
                }}
                className="text-slate-400 hover:text-white p-1 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Media Preview */}
            <div className="relative w-full h-56 rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-white/10">
              {newMediaDataUrl ? (
                <img src={newMediaDataUrl} alt="Moment preview" className="w-full h-full object-cover" />
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-indigo-400 text-xs flex flex-col items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-3xl">add_photo_alternate</span>
                  Select Photo
                </button>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-300 font-medium">Add a caption</label>
              <input
                type="text"
                placeholder="What's happening in your node?"
                value={newCaption}
                onChange={(e) => setNewCaption(e.target.value)}
                className="w-full bg-slate-950/70 text-xs text-slate-100 p-3 rounded-2xl border border-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-2.5 px-3.5 rounded-2xl bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-700 flex items-center gap-1 border border-white/5"
              >
                <span className="material-symbols-outlined text-sm">swap_horiz</span>
                Change
              </button>
              <button
                type="button"
                disabled={isPosting || !newMediaDataUrl.trim()}
                onClick={handlePostStory}
                className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs disabled:opacity-50 shadow-lg shadow-indigo-600/30 active:scale-95 transition-transform"
              >
                {isPosting ? 'Broadcasting...' : 'Broadcast Moment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Story Viewer Modal */}
      {selectedStory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-fade-in"
          onClick={() => setSelectedStory(null)}
        >
          <div
            className="relative w-full max-w-sm h-[580px] bg-slate-900/90 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between p-4 border border-white/10 backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Status Progress Bar */}
            <div className="relative z-10 flex flex-col gap-2">
              <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                <div
                  style={{ width: `${storyProgress}%` }}
                  className="h-full bg-gradient-to-r from-indigo-400 to-violet-400 rounded-full transition-all duration-100 ease-linear shadow-[0_0_8px_rgba(129,140,248,0.8)]"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    alt={selectedStory.userName}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-400 bg-slate-800"
                    src={selectedStory.userAvatar}
                  />
                  <div className="flex flex-col">
                    <span className="font-label-md text-white text-xs font-semibold drop-shadow">
                      {selectedStory.userName}
                    </span>
                    <span className="text-[10px] text-indigo-200 drop-shadow font-mono">24h Ephemeral Moment</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedStory.userId === user?.uid && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteStory(selectedStory.id, e)}
                      className="text-white hover:text-rose-400 p-1.5 rounded-full bg-black/50 backdrop-blur-md transition-colors"
                      title="Delete story"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedStory(null)}
                    className="text-white hover:text-white/80 p-1.5 rounded-full bg-black/50 backdrop-blur-md transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Media Image Content */}
            <img
              alt="Story media"
              className="absolute inset-0 w-full h-full object-cover"
              src={selectedStory.mediaUrl}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/50 pointer-events-none" />

            {/* Caption & Quick Reaction Bar */}
            <div className="relative z-10 flex flex-col gap-3">
              <p className="text-white text-sm font-medium drop-shadow-lg px-1 leading-snug">{selectedStory.caption}</p>

              {/* Quick Emojis */}
              <div className="flex items-center justify-around bg-black/50 backdrop-blur-md rounded-2xl p-1.5 border border-white/10">
                {['❤️', '🔥', '👏', '⚡', '🚀', '😍'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => alert(`Reacted with ${emoji}`)}
                    className="text-lg hover:scale-125 transition-transform active:scale-95"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Send a private reply..."
                  className="flex-1 bg-white/15 backdrop-blur-md text-white placeholder:text-white/70 text-xs px-3.5 py-2.5 rounded-full border border-white/20 focus:outline-none focus:border-indigo-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    alert('Reply transmitted.');
                    setSelectedStory(null);
                  }}
                  className="w-9 h-9 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/50 active:scale-95 flex-shrink-0 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
