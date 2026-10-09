import '@/styles/globals.css';
import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/context/AuthContext';
import { ChatProvider } from '@/context/ChatContext';
import { CallProvider } from '@/context/CallContext';
import { IncomingCallModal } from '@/components/call/IncomingCallModal';
import { ActiveCallModal } from '@/components/call/ActiveCallModal';
import { SplashScreen } from '@/components/ui/SplashScreen';

export const metadata: Metadata = {
  title: 'NexusChat - Quantum-Grade Encrypted Messaging',
  description:
    'NexusChat delivers next-generation, quantum-grade real-time messaging protected by AES-256 zero-knowledge encryption.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#020617',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body className="bg-slate-950 font-sans text-slate-100 flex flex-col min-h-screen selection:bg-indigo-500/30 selection:text-indigo-200">
        <SplashScreen />
        <AuthProvider>
          <ChatProvider>
            <CallProvider>
              {children}
              <IncomingCallModal />
              <ActiveCallModal />
            </CallProvider>
          </ChatProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
