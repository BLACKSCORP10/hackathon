'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeMode = 'dark' | 'light';

export interface ChatBackgroundOption {
  id: string;
  name: string;
  type: 'preset' | 'image';
  style: React.CSSProperties;
  preview: string;
  description: string;
}

export const CHAT_BG_PRESETS: ChatBackgroundOption[] = [
  {
    id: 'default',
    name: 'Default Glass',
    type: 'preset',
    style: {
      background: 'radial-gradient(ellipse at top, #0f172a 0%, #020617 100%)',
    },
    preview: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)',
    description: 'Dynamic Quantum Slate Glass',
  },
  {
    id: 'midnight',
    name: 'Deep Midnight',
    type: 'preset',
    style: {
      backgroundColor: '#050814',
      backgroundImage: 'radial-gradient(rgba(99, 102, 241, 0.08) 1px, transparent 0)',
      backgroundSize: '24px 24px',
    },
    preview: 'linear-gradient(135deg, #050814 0%, #1e1b4b 100%)',
    description: 'Deep Obsidian Space Mesh',
  },
  {
    id: 'emerald',
    name: 'Emerald Vault',
    type: 'preset',
    style: {
      backgroundColor: '#041c14',
      backgroundImage: 'radial-gradient(rgba(52, 211, 153, 0.08) 1px, transparent 0)',
      backgroundSize: '24px 24px',
    },
    preview: 'linear-gradient(135deg, #041c14 0%, #064e3b 100%)',
    description: 'Matrix Quantum Forest',
  },
  {
    id: 'rose',
    name: 'Crimson Velvet',
    type: 'preset',
    style: {
      backgroundColor: '#1a0812',
      backgroundImage: 'radial-gradient(rgba(244, 63, 94, 0.08) 1px, transparent 0)',
      backgroundSize: '24px 24px',
    },
    preview: 'linear-gradient(135deg, #1a0812 0%, #4c0519 100%)',
    description: 'Velvet Nebula Rose',
  },
  {
    id: 'blue',
    name: 'Royal Sapphire',
    type: 'preset',
    style: {
      backgroundColor: '#08132b',
      backgroundImage: 'radial-gradient(rgba(56, 189, 248, 0.08) 1px, transparent 0)',
      backgroundSize: '24px 24px',
    },
    preview: 'linear-gradient(135deg, #08132b 0%, #1e3a8a 100%)',
    description: 'Deep Sapphire Ocean',
  },
  {
    id: 'amber',
    name: 'Warm Amber',
    type: 'preset',
    style: {
      backgroundColor: '#1c1206',
      backgroundImage: 'radial-gradient(rgba(245, 158, 11, 0.08) 1px, transparent 0)',
      backgroundSize: '24px 24px',
    },
    preview: 'linear-gradient(135deg, #1c1206 0%, #78350f 100%)',
    description: 'Warm Twilight Sunset',
  },
];

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  chatBackground: string;
  customChatImage: string | null;
  setChatBackground: (bgId: string) => void;
  setCustomChatImage: (dataUrl: string | null) => void;
  resetChatBackground: () => void;
  getChatBackgroundStyle: () => React.CSSProperties;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>('dark');
  const [chatBackground, setChatBackgroundState] = useState<string>('default');
  const [customChatImage, setCustomChatImageState] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedTheme = (localStorage.getItem('nexus_theme') as ThemeMode) || 'dark';
      const savedChatBg = localStorage.getItem('nexus_chat_bg') || 'default';
      const savedCustomImg = localStorage.getItem('nexus_chat_custom_img') || null;

      setThemeState(savedTheme);
      setChatBackgroundState(savedChatBg);
      setCustomChatImageState(savedCustomImg);

      applyThemeToDom(savedTheme);
    } catch (e) {
      console.warn('Theme preference storage error:', e);
    }
  }, []);

  const applyThemeToDom = (mode: ThemeMode) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  };

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    applyThemeToDom(mode);
    try {
      localStorage.setItem('nexus_theme', mode);
    } catch (e) {}
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  const setChatBackground = (bgId: string) => {
    setChatBackgroundState(bgId);
    try {
      localStorage.setItem('nexus_chat_bg', bgId);
    } catch (e) {}
  };

  const setCustomChatImage = (dataUrl: string | null) => {
    setCustomChatImageState(dataUrl);
    try {
      if (dataUrl) {
        localStorage.setItem('nexus_chat_custom_img', dataUrl);
        setChatBackgroundState('custom');
        localStorage.setItem('nexus_chat_bg', 'custom');
      } else {
        localStorage.removeItem('nexus_chat_custom_img');
        if (chatBackground === 'custom') {
          setChatBackground('default');
        }
      }
    } catch (e) {
      console.warn('Custom background image save warning:', e);
    }
  };

  const resetChatBackground = () => {
    setChatBackground('default');
    setCustomChatImage(null);
  };

  const getChatBackgroundStyle = (): React.CSSProperties => {
    if (chatBackground === 'custom' && customChatImage) {
      return {
        backgroundImage: `url(${customChatImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
    }

    const preset = CHAT_BG_PRESETS.find((p) => p.id === chatBackground);
    if (preset) {
      return preset.style;
    }

    return {
      background: 'radial-gradient(ellipse at top, #0f172a 0%, #020617 100%)',
    };
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme,
        chatBackground,
        customChatImage,
        setChatBackground,
        setCustomChatImage,
        resetChatBackground,
        getChatBackgroundStyle,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
};
