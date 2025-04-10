import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getTranslation, defaultLanguage } from '@/lib/translations';

interface LanguageContextType {
  language: string;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState(() => {
    // Try to get the language from localStorage
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage || defaultLanguage;
  });

  // Save language to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prevLang => prevLang === 'en' ? 'zh' : 'en');
  };

  const t = (key: string, fallback?: string): string => {
    return getTranslation(key, language);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        toggleLanguage,
        t
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
