'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface AvatarPreviewData {
  name: string;
  avatarUrl: string;
  displayName?: string;
  photoURL?: string;
  username?: string;
  phone?: string;
  phoneNumber?: string;
  email?: string;
  bio?: string;
  role?: string;
  statusText?: string;
  isOnline?: boolean;
}

interface AvatarPreviewContextType {
  previewData: AvatarPreviewData | null;
  isOpen: boolean;
  openAvatarPreview: (data: AvatarPreviewData) => void;
  closeAvatarPreview: () => void;
}

const AvatarPreviewContext = createContext<AvatarPreviewContextType | undefined>(undefined);

export const AvatarPreviewProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [previewData, setPreviewData] = useState<AvatarPreviewData | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openAvatarPreview = (data: AvatarPreviewData) => {
    setPreviewData(data);
    setIsOpen(true);
  };

  const closeAvatarPreview = () => {
    setIsOpen(false);
  };

  return (
    <AvatarPreviewContext.Provider
      value={{
        previewData,
        isOpen,
        openAvatarPreview,
        closeAvatarPreview,
      }}
    >
      {children}
    </AvatarPreviewContext.Provider>
  );
};

export const useAvatarPreview = () => {
  const ctx = useContext(AvatarPreviewContext);
  if (!ctx) {
    throw new Error('useAvatarPreview must be used within an AvatarPreviewProvider');
  }
  return ctx;
};
