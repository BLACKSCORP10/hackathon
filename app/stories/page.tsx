'use client';

import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FirestoreStory } from '@/lib/db';
import { TopHeader } from '@/components/navigation/TopHeader';
import { BottomNav } from '@/components/navigation/BottomNav';
import { useAuth } from '@/context/AuthContext';

export default function StoriesMomentsPage() {
  const { user } = useAuth();
  const [stories, setStories] = useState<FirestoreStory[]>([]);
  const [selectedStory, setSelectedStory] = useState<FirestoreStory | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [newCaption, setNewCaption] = useState('');
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

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

  const handlePostStory = async () => {
    if (!user || !newMediaUrl.trim()) return;
    setIsPosting(true);
    try {
      await addDoc(collection(db, 'stories'), {
        userId: user.uid,
        userName: user.name || user.username || 'Nexus Operative',
        userAvatar: user.avatarUrl,
        mediaUrl: newMediaUrl.trim(),
        caption: newCaption.trim() || 'Encrypted moment transmission',
        timestamp: serverTimestamp(),
      });
      setShowAddModal(false);
      setNewCaption('');
      setNewMediaUrl('');
    } catch (e) {
      console.error('Error posting moment:', e);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <TopHeader title="NexusChat" subtitle="Moments" />

      <main className="flex-1 flex flex-col pt-16 pb-24 max-w-4xl mx-auto w-full px-4 py-4 gap-5">
        {/* User Story Card */}
        <section className="bg-surface-container rounded-2xl p-4 flex items-center justify-between shadow-md border border-surface-container-highest/40">
          <div className="flex items-center gap-3">
            <div className="relative w-14 h-14 rounded-full p-0.5 border-2 border-dashed border-primary flex items-center justify-center">
              <img
                alt="My Status"
                className="w-full h-full rounded-full object-cover"
                src={
                  user?.avatarUrl ||
                  'https://lh3.googleusercontent.com/aida-public/AB6AXuBtBpKB_hileIlifX6sIEN1CejCdWChfud93K51ft6qbVAZGnNhgqOzEmRgRNKiXYmea02Rm_mfRlL4AHI_ItdqoN6YZVbkjMGEFJn9rFTi8f2qZhei2yeMgZeHtgQV5yXQF7YUXf2O0NJKF6vcI9YUi-j1j92Vl1KXD3HYPvXIr69s-RcPPJwDTsL8y-iPl1Q0X1ZzKzt1-ZLCey8Dhh2LghufDcKrM1SDMHbrLm8ClBwd0My832aNZQ'
                }
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold shadow-md">
                +
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-md text-sm font-semibold text-on-surface">My Status</span>
              <span className="text-xs text-on-surface-variant">Tap to broadcast 24h encrypted moment to Firestore</span>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary active:scale-95 shadow-sm hover:bg-surface-bright"
          >
            <span className="material-symbols-outlined text-[20px]">photo_camera</span>
          </button>
        </section>

        {/* Recent Updates Grid */}
        <section className="flex flex-col gap-3">
          <span className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider px-1">
            Live Ephemeral Updates ({stories.length})
          </span>

          {stories.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-outline bg-surface-container-low/40 rounded-2xl p-6 border border-surface-container-highest/30 text-center">
              <span className="material-symbols-outlined text-3xl">auto_stories</span>
              <p className="text-xs">No ephemeral moments uploaded yet. Click the camera icon above to share!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {stories.map((story) => (
                <div
                  key={story.id}
                  onClick={() => setSelectedStory(story)}
                  className="relative h-60 rounded-2xl overflow-hidden shadow-lg border border-surface-container-highest/40 group cursor-pointer"
                >
                  <img
                    alt={story.caption}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    src={story.mediaUrl}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                  {/* Sender Avatar badge */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-2 z-10">
                    <div className="w-8 h-8 rounded-full p-0.5 bg-gradient-to-tr from-primary to-secondary shadow-md">
                      <img alt={story.userName} className="w-full h-full rounded-full object-cover" src={story.userAvatar} />
                    </div>
                    <span className="text-xs text-white font-medium drop-shadow">{story.userName}</span>
                  </div>

                  {/* Caption */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10">
                    <p className="text-xs text-white/90 line-clamp-2 drop-shadow font-medium">{story.caption}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Add Story Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-sm bg-surface-container rounded-3xl p-6 shadow-2xl flex flex-col gap-4 border border-surface-container-highest">
            <div className="flex items-center justify-between border-b border-surface-container-highest/60 pb-2">
              <h3 className="text-sm font-semibold text-on-surface">Upload 24h Moment</h3>
              <button onClick={() => setShowAddModal(false)} className="text-outline hover:text-on-surface">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-on-surface-variant">Image URL</label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={newMediaUrl}
                onChange={(e) => setNewMediaUrl(e.target.value)}
                className="w-full bg-surface-container-low text-xs text-on-surface p-2.5 rounded-xl border border-surface-container-highest focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-on-surface-variant">Caption</label>
              <input
                type="text"
                placeholder="What's happening?"
                value={newCaption}
                onChange={(e) => setNewCaption(e.target.value)}
                className="w-full bg-surface-container-low text-xs text-on-surface p-2.5 rounded-xl border border-surface-container-highest focus:outline-none focus:border-primary"
              />
            </div>
            <button
              disabled={isPosting || !newMediaUrl.trim()}
              onClick={handlePostStory}
              className="w-full py-2.5 rounded-xl bg-primary-container text-on-primary-container font-semibold text-xs disabled:opacity-50"
            >
              {isPosting ? 'Uploading...' : 'Publish Moment'}
            </button>
          </div>
        </div>
      )}

      {/* Story Viewer Modal */}
      {selectedStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-fade-in">
          <div className="relative w-full max-w-sm h-[580px] bg-surface-container rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between p-4 border border-surface-container-highest">
            <div className="relative z-10 flex flex-col gap-2">
              <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full animate-[progress_5s_linear_forwards]" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    alt={selectedStory.userName}
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-white/50"
                    src={selectedStory.userAvatar}
                  />
                  <div className="flex flex-col">
                    <span className="font-label-md text-white text-xs font-semibold">{selectedStory.userName}</span>
                    <span className="text-[10px] text-white/70">24h Ephemeral Moment</span>
                  </div>
                </div>
                <button onClick={() => setSelectedStory(null)} className="text-white hover:text-white/80 p-1 rounded-full">
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
            </div>

            <img alt="Story media" className="absolute inset-0 w-full h-full object-cover" src={selectedStory.mediaUrl} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

            <div className="relative z-10 flex flex-col gap-3">
              <p className="text-white text-sm font-medium drop-shadow-md">{selectedStory.caption}</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Send a reply..."
                  className="flex-1 bg-white/20 backdrop-blur-md text-white placeholder:text-white/60 text-xs px-3 py-2 rounded-full border border-white/30 focus:outline-none"
                />
                <button
                  onClick={() => setSelectedStory(null)}
                  className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg active:scale-95"
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
