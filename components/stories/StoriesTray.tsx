'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FirestoreStory, deleteFirestoreStory } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface StoryGroup {
  userId: string;
  userName: string;
  userAvatar: string;
  stories: FirestoreStory[];
}

export const StoriesTray: React.FC = () => {
  const { user } = useAuth();
  const [stories, setStories] = useState<FirestoreStory[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<StoryGroup | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [slideProgress, setSlideProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const SLIDE_DURATION_MS = 5000; // 5 seconds per story slide

  // 1. Listen for 24h stories in real-time
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
      () => {
        setStories([]);
      }
    );
    return () => unsubscribe();
  }, []);

  // 2. Group stories by user (aggregate multiple stories into a single story bubble)
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

  // 3. User's own active stories
  const myGroup = useMemo(() => {
    return storyGroups.find((g) => g.userId === user?.uid);
  }, [storyGroups, user?.uid]);

  // 4. Timed segment auto-advancing logic (5s per slide)
  useEffect(() => {
    if (!selectedGroup) return;

    setSlideProgress(0);
    const intervalTime = 50; // update every 50ms
    const step = (intervalTime / SLIDE_DURATION_MS) * 100;

    const timer = setInterval(() => {
      if (isPaused) return;

      setSlideProgress((prev) => {
        if (prev >= 100) {
          // Advance to next story slide or next group
          if (currentSlideIndex < selectedGroup.stories.length - 1) {
            setCurrentSlideIndex((curr) => curr + 1);
            return 0;
          } else {
            // Find next story group if available
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
      // Go to previous group if available
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
      // Go to next group or close
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

  const currentStory = selectedGroup?.stories[currentSlideIndex];

  return (
    <>
      <section className="w-full px-4 py-2 overflow-x-auto no-scrollbar flex items-center gap-3.5">
        {/* User Story Bubble */}
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                if (myGroup && myGroup.stories.length > 0) {
                  handleOpenGroup(myGroup);
                }
              }}
              className="relative w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-md flex items-center justify-center hover:scale-105 transition-all group focus:outline-none"
            >
              <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 ring-2 ring-slate-950">
                <img
                  alt="My Story"
                  className="w-full h-full object-cover"
                  src={
                    user?.avatarUrl ||
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuBtBpKB_hileIlifX6sIEN1CejCdWChfud93K51ft6qbVAZGnNhgqOzEmRgRNKiXYmea02Rm_mfRlL4AHI_ItdqoN6YZVbkjMGEFJn9rFTi8f2qZhei2yeMgZeHtgQV5yXQF7YUXf2O0NJKF6vcI9YUi-j1j92Vl1KXD3HYPvXIr69s-RcPPJwDTsL8y-iPl1Q0X1ZzKzt1-ZLCey8Dhh2LghufDcKrM1SDMHbrLm8ClBwd0My832aNZQ'
                  }
                />
              </div>
            </button>

            {/* Quick Upload Action + Button */}
            <Link
              href="/stories"
              className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 text-white flex items-center justify-center text-xs font-bold shadow-lg shadow-indigo-600/50 hover:scale-110 active:scale-95 transition-transform"
              title="Add New Moment"
            >
              +
            </Link>
          </div>
          <span className="font-sans text-[11px] text-slate-300 font-medium truncate max-w-[64px]">
            Your Story
          </span>
        </div>

        {/* Grouped Stories from Contacts (One Avatar Node per User) */}
        {storyGroups
          .filter((group) => group.userId !== user?.uid)
          .map((group) => (
            <button
              key={group.userId}
              type="button"
              onClick={() => handleOpenGroup(group)}
              className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer focus:outline-none"
            >
              <div className="relative w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-cyan-400 via-indigo-500 to-pink-500 shadow-md group-hover:scale-105 transition-transform duration-300">
                <div className="w-full h-full rounded-full overflow-hidden bg-slate-950 ring-2 ring-slate-950">
                  <img
                    alt={group.userName}
                    className="w-full h-full object-cover"
                    src={group.userAvatar}
                  />
                </div>
                {/* Multi-story count badge */}
                {group.stories.length > 1 && (
                  <div className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-indigo-600 text-white font-mono text-[9px] font-bold ring-2 ring-slate-950 shadow-md">
                    {group.stories.length}
                  </div>
                )}
              </div>
              <span className="font-sans text-[11px] text-slate-300 truncate max-w-[64px] group-hover:text-white transition-colors">
                {group.userName?.split(' ')[0] || 'Operative'}
              </span>
            </button>
          ))}
      </section>

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
    </>
  );
};
