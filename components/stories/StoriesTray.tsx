'use client';

import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FirestoreStory } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export const StoriesTray: React.FC = () => {
  const { user } = useAuth();
  const [stories, setStories] = useState<FirestoreStory[]>([]);
  const [selectedStory, setSelectedStory] = useState<FirestoreStory | null>(null);
  const [storyProgress, setStoryProgress] = useState(0);

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

  return (
    <>
      <section className="w-full px-4 py-2 overflow-x-auto no-scrollbar flex items-center gap-3">
        {/* User Add Story Bubble */}
        <Link href="/stories" className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer">
          <div className="relative w-14 h-14 rounded-full p-0.5 border-2 border-dashed border-indigo-500/60 flex items-center justify-center group-hover:border-indigo-400 group-hover:scale-105 transition-all">
            <div className="w-full h-full rounded-full overflow-hidden bg-slate-800 flex items-center justify-center">
              <img
                alt="My Story"
                className="w-full h-full object-cover"
                src={
                  user?.avatarUrl ||
                  'https://lh3.googleusercontent.com/aida-public/AB6AXuBtBpKB_hileIlifX6sIEN1CejCdWChfud93K51ft6qbVAZGnNhgqOzEmRgRNKiXYmea02Rm_mfRlL4AHI_ItdqoN6YZVbkjMGEFJn9rFTi8f2qZhei2yeMgZeHtgQV5yXQF7YUXf2O0NJKF6vcI9YUi-j1j92Vl1KXD3HYPvXIr69s-RcPPJwDTsL8y-iPl1Q0X1ZzKzt1-ZLCey8Dhh2LghufDcKrM1SDMHbrLm8ClBwd0My832aNZQ'
                }
              />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white flex items-center justify-center text-xs font-bold shadow-lg shadow-indigo-500/50">
              +
            </div>
          </div>
          <span className="font-label-sm text-[11px] text-slate-400 group-hover:text-slate-200 transition-colors truncate max-w-[60px]">
            Your Story
          </span>
        </Link>

        {/* Stories from Contacts */}
        {stories.map((story) => (
          <button
            key={story.id}
            type="button"
            onClick={() => setSelectedStory(story)}
            className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer focus:outline-none"
          >
            <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-md group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full rounded-full overflow-hidden bg-slate-950 ring-2 ring-slate-950">
                <img alt={story.userName} className="w-full h-full object-cover" src={story.userAvatar} />
              </div>
            </div>
            <span className="font-label-sm text-[11px] text-slate-300 truncate max-w-[64px] group-hover:text-white transition-colors">
              {story.userName?.split(' ')[0] || 'Peer'}
            </span>
          </button>
        ))}
      </section>

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
            {/* Story Top Bar */}
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
                    <span className="font-label-md text-white text-xs font-semibold drop-shadow">{selectedStory.userName}</span>
                    <span className="text-[10px] text-indigo-200 drop-shadow font-mono">24h Ephemeral Moment</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStory(null)}
                  className="text-white hover:text-white/80 p-1.5 rounded-full bg-black/50 backdrop-blur-md transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
            </div>

            {/* Background Story Image */}
            <img
              alt="Story media"
              className="absolute inset-0 w-full h-full object-cover"
              src={selectedStory.mediaUrl}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/50 pointer-events-none" />

            {/* Story Caption & Quick Reaction */}
            <div className="relative z-10 flex flex-col gap-3">
              <p className="text-white text-sm font-medium drop-shadow-md leading-snug">{selectedStory.caption}</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Send a reply..."
                  className="flex-1 bg-white/15 backdrop-blur-md text-white placeholder:text-white/60 text-xs px-3.5 py-2.5 rounded-full border border-white/20 focus:outline-none focus:border-indigo-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setSelectedStory(null)}
                  className="w-9 h-9 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/50 active:scale-95 transition-all flex-shrink-0"
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
