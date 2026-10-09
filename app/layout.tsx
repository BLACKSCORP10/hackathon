import '@/styles/globals.css';
import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/context/AuthContext';
import { ChatProvider } from '@/context/ChatContext';
import { CallProvider } from '@/context/CallContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AvatarPreviewProvider } from '@/context/AvatarPreviewContext';
import { IncomingCallModal } from '@/components/call/IncomingCallModal';
import { ActiveCallModal } from '@/components/call/ActiveCallModal';
import { AvatarPreviewModal } from '@/components/profile/AvatarPreviewModal';
import { SplashScreen } from '@/components/ui/SplashScreen';
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister';

export const metadata: Metadata = {
  title: 'NexusChat - Modern Encrypted Messaging Platform',
  description:
    'NexusChat delivers next-generation real-time messaging protected by AES-256 zero-knowledge encryption.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NEXUS CHAT',
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    shortcut: '/icons/icon-192x192.png',
    apple: '/apple-touch-icon.png',
  },
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
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#020617" />
      </head>
      <body className="bg-slate-950 dark:bg-slate-950 light:bg-slate-50 font-sans text-slate-100 dark:text-slate-100 light:text-slate-900 flex flex-col min-h-screen selection:bg-indigo-500/30 selection:text-indigo-200 transition-colors duration-300">
        <ServiceWorkerRegister />
        <SplashScreen />
        <ThemeProvider>
          <AuthProvider>
            <ChatProvider>
              <CallProvider>
                <AvatarPreviewProvider>
                  {children}
                  <IncomingCallModal />
                  <ActiveCallModal />
                  <AvatarPreviewModal />
                </AvatarPreviewProvider>
              </CallProvider>
            </ChatProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

