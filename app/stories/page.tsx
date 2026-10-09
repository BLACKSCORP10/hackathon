'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FirestoreStory, createFirestoreStory, deleteFirestoreStory } from '@/lib/db';
import { TopHeader } from '@/components/navigation/TopHeader';
import { BottomNav } from '@/components/navigation/BottomNav';
import { useAuth } from '@/context/AuthContext';
import { compressImage } from '@/lib/imageUtils';

interface StoryGroup {
  userId: string;
  userName: string;
  userAvatar: string;
  stories: FirestoreStory[];
}

export default function StoriesMomentsPage() {
  const { user } = useAuth();
  const [stories, setStories] = useState<FirestoreStory[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<StoryGroup | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [slideProgress, setSlideProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const [isPosting, setIsPosting] = useState(false);
  const [newCaption, setNewCaption] = useState('');
  const [newMediaDataUrl, setNewMediaDataUrl] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const SLIDE_DURATION_MS = 5000;

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

  // 2. Aggregate / Group multiple stories by User
  const storyGroups = useMemo<StoryGroup[]>(() => {
    const groupMap = new Map<string, StoryGroup>();

    stories.forEach((story) => {
      const existing = groupMap.get(story.userId);
      if (existing) {
        existing.stories.push(story);
      } else {
        groupMap.set(story.userId, {
          userId: story.userId,
          userName: story.userName,
          userAvatar: story.userAvatar,
          stories: [story],
        });
      }
    });

    return Array.from(groupMap.values());
  }, [stories]);

  // 3. Timed segment auto-advancing logic (5s per slide)
  useEffect(() => {
    if (!selectedGroup) return;

    setSlideProgress(0);
    const intervalTime = 50;
    const step = (intervalTime / SLIDE_DURATION_MS) * 100;

    const timer = setInterval(() => {
      if (isPaused) return;

      setSlideProgress((prev) => {
        if (prev >= 100) {
          if (currentSlideIndex < selectedGroup.stories.length - 1) {
            setCurrentSlideIndex((curr) => curr + 1);
            return 0;
          } else {
            const currentGroupIndex = storyGroups.findIndex((g) => g.userId === selectedGroup.userId);
            if (currentGroupIndex >= 0 && currentGroupIndex < storyGroups.length - 1) {
              setSelectedGroup(storyGroups[currentGroupIndex + 1]);
              setCurrentSlideIndex(0);
              return 0;
            } else {
              setSelectedGroup(null);
              return 0;
            }
          }
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [selectedGroup, currentSlideIndex, isPaused, storyGroups]);

  const handleOpenGroup = (group: StoryGroup, initialIndex = 0) => {
    setSelectedGroup(group);
    setCurrentSlideIndex(initialIndex);
    setSlideProgress(0);
    setIsPaused(false);
  };

  const handlePrevSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!selectedGroup) return;

    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
      setSlideProgress(0);
    } else {
      const currentGroupIndex = storyGroups.findIndex((g) => g.userId === selectedGroup.userId);
      if (currentGroupIndex > 0) {
        const prevGroup = storyGroups[currentGroupIndex - 1];
        setSelectedGroup(prevGroup);
        setCurrentSlideIndex(prevGroup.stories.length - 1);
        setSlideProgress(0);
      }
    }
  };

  const handleNextSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!selectedGroup) return;

    if (currentSlideIndex < selectedGroup.stories.length - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
      setSlideProgress(0);
    } else {
      const currentGroupIndex = storyGroups.findIndex((g) => g.userId === selectedGroup.userId);
      if (currentGroupIndex >= 0 && currentGroupIndex < storyGroups.length - 1) {
        setSelectedGroup(storyGroups[currentGroupIndex + 1]);
        setCurrentSlideIndex(0);
        setSlideProgress(0);
      } else {
        setSelectedGroup(null);
      }
    }
  };

  // Handle Real File Selection for Story with Canvas compression
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 800, 0.6);
      setNewMediaDataUrl(compressed.dataUrl);
      setShowAddModal(true);
    } catch (err) {
      console.warn('Story image compression fallback:', err);
      const reader = new FileReader();
      reader.onload = () => {
        setNewMediaDataUrl(reader.result as string);
        setShowAddModal(true);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handlePostStory = async () => {
    if (!user || !newMediaDataUrl.trim()) return;
    setIsPosting(true);
    try {
      let finalMediaUrl = newMediaDataUrl.trim();
      if (finalMediaUrl.length > 200000) {
        try {
          const comp = await compressImage(finalMediaUrl, 800, 0.6);
          finalMediaUrl = comp.dataUrl;
        } catch (e) {}
      }

      await createFirestoreStory({
        userId: user.uid,
        userName: user.name || user.username || 'Nexus Operative',
        userAvatar: user.avatarUrl,
        mediaUrl: finalMediaUrl,
        caption: newCaption.trim() || 'Moment transmission',
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

  const currentStory = selectedGroup?.stories[currentSlideIndex];

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
              <span className="text-sm font-bold text-slate-100">Broadcast Moment</span>
              <span className="text-xs text-slate-400">Share a 24-hour photo or message to your network</span>
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

        {/* Grouped Live Moments Feed */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <span className="font-mono text-xs text-slate-400 uppercase tracking-wider">
              Active Operative Moments ({storyGroups.length} nodes · {stories.length} stories)
            </span>
            <span className="text-[11px] text-emerald-400 font-mono">24h Auto-Expiry</span>
          </div>

          {storyGroups.length === 0 ? (
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
              {storyGroups.map((group) => {
                const latestStory = group.stories[0];
                const isOwn = group.userId === user?.uid;

                return (
                  <div
                    key={group.userId}
                    onClick={() => handleOpenGroup(group)}
                    className="relative h-64 rounded-3xl overflow-hidden shadow-xl border border-white/10 group cursor-pointer bg-slate-900"
                  >
                    <img
                      alt={latestStory.caption}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      src={latestStory.mediaUrl}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/50 pointer-events-none" />

                    {/* Sender Avatar & Name */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative w-8 h-8 rounded-full p-0.5 bg-gradient-to-tr from-indigo-500 to-pink-500 shadow-md flex-shrink-0">
                          <img
                            alt={group.userName}
                            className="w-full h-full rounded-full object-cover bg-slate-800"
                            src={group.userAvatar}
                          />
                        </div>
                        <span className="text-xs text-white font-semibold drop-shadow truncate">
                          {group.userName}
                        </span>
                      </div>

                      {/* Multi-story badge count */}
                      <span className="px-2 py-0.5 rounded-full bg-indigo-600/90 text-white font-mono text-[10px] font-bold shadow-md border border-white/10">
                        {group.stories.length} {group.stories.length === 1 ? 'moment' : 'moments'}
                      </span>
                    </div>

                    {/* Caption */}
                    <div className="absolute bottom-3 left-3 right-3 z-10">
                      <p className="text-xs text-white/95 line-clamp-2 drop-shadow-md font-medium leading-snug">
                        {latestStory.caption}
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

      {/* Instagram-Style Multi-Segment Timed Story Viewer Overlay */}
      {selectedGroup && currentStory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-2xl animate-fade-in select-none"
          onClick={() => setSelectedGroup(null)}
        >
          <div
            className="relative w-full max-w-sm h-[90vh] max-h-[640px] bg-slate-950 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between p-4 border border-white/10 backdrop-blur-2xl"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          >
            {/* Top Multi-Segment Timed Progress Bars */}
            <div className="relative z-20 flex flex-col gap-2.5">
              <div className="w-full flex items-center gap-1.5">
                {selectedGroup.stories.map((_, index) => {
                  let fill = 0;
                  if (index < currentSlideIndex) fill = 100;
                  else if (index === currentSlideIndex) fill = slideProgress;
                  else fill = 0;

                  return (
                    <div
                      key={index}
                      className="flex-1 h-1 bg-white/25 rounded-full overflow-hidden"
                    >
                      <div
                        style={{ width: `${fill}%` }}
                        className="h-full bg-white rounded-full transition-all duration-75 ease-linear shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Story Author Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    alt={selectedGroup.userName}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-400 bg-slate-800 shadow-md"
                    src={selectedGroup.userAvatar}
                  />
                  <div className="flex flex-col">
                    <span className="text-white text-xs font-bold drop-shadow-md">
                      {selectedGroup.userName}
                    </span>
                    <span className="text-[10px] text-indigo-200 drop-shadow font-mono">
                      {currentSlideIndex + 1} of {selectedGroup.stories.length} · 24h Ephemeral
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {selectedGroup.userId === user?.uid && (
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm('Delete this moment permanently?')) {
                          await deleteFirestoreStory(currentStory.id);
                          if (selectedGroup.stories.length <= 1) {
                            setSelectedGroup(null);
                          } else {
                            setSelectedGroup({
                              ...selectedGroup,
                              stories: selectedGroup.stories.filter((s) => s.id !== currentStory.id),
                            });
                            setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
                          }
                        }
                      }}
                      className="text-white hover:text-rose-400 p-1.5 rounded-full bg-black/40 backdrop-blur-md transition-colors"
                      title="Delete Story"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedGroup(null)}
                    className="text-white hover:text-white/80 p-1.5 rounded-full bg-black/40 backdrop-blur-md transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Background Story Image / Media */}
            <img
              alt="Story Media"
              className="absolute inset-0 w-full h-full object-cover"
              src={currentStory.mediaUrl}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 pointer-events-none" />

            {/* Left & Right Interactive Tap Navigation Zones */}
            <div
              className="absolute inset-y-16 left-0 w-1/3 z-10 cursor-pointer"
              onClick={handlePrevSlide}
              title="Previous Story"
            />
            <div
              className="absolute inset-y-16 right-0 w-2/3 z-10 cursor-pointer"
              onClick={handleNextSlide}
              title="Next Story"
            />

            {/* Bottom Caption & Interactive Reply Bar */}
            <div className="relative z-20 flex flex-col gap-3">
              {currentStory.caption && (
                <p className="text-white text-sm font-medium drop-shadow-lg leading-snug px-1">
                  {currentStory.caption}
                </p>
              )}

              {/* Navigation controls hint */}
              <div className="flex items-center justify-between px-1 text-[11px] text-white/60 font-mono">
                <span onClick={handlePrevSlide} className="cursor-pointer hover:text-white">
                  ← Prev
                </span>
                <span>Tap right to advance</span>
                <span onClick={handleNextSlide} className="cursor-pointer hover:text-white">
                  Next →
                </span>
              </div>

              {/* Quick Emojis & Reply */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Send a reply..."
                  className="flex-1 bg-white/20 backdrop-blur-md text-white placeholder:text-white/70 text-xs px-3.5 py-2.5 rounded-full border border-white/20 focus:outline-none focus:border-indigo-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    alert('Moment reply transmitted.');
                    setSelectedGroup(null);
                  }}
                  className="w-9 h-9 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all flex-shrink-0"
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
