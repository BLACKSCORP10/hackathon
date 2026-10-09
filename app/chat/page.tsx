'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChatIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/chat/chat-sarah');
  }, [router]);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <span className="material-symbols-outlined text-primary text-3xl animate-spin">sync</span>
    </div>
  );
}
