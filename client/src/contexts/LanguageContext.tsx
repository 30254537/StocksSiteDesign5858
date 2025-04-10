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
    // 首先通过 getTranslation 尝试获取翻译
    const translation = getTranslation(key, language);
    
    // 添加详细调试日志
    console.log(`翻译请求 - 键: ${key}, 语言: ${language}, 结果: ${translation}`);
    
    // 如果翻译与键相同（说明翻译不存在），则返回回退值或键本身
    if (translation === key) {
      return fallback || key;
    }
    
    return translation;
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
