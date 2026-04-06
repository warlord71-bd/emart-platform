import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from '../i18n/en';
import bn from '../i18n/bn';

const LANG_KEY = '@emart_lang';
const translations = { en, bn };

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState('en');

  // Restore language preference on launch
  useEffect(() => {
    const restore = async () => {
      try {
        const saved = await AsyncStorage.getItem(LANG_KEY);
        if (saved && translations[saved]) setLang(saved);
      } catch (e) {
        console.log('Language restore error:', e);
      }
    };
    restore();
  }, []);

  const t = useCallback((key) => {
    return translations[lang]?.[key] || translations.en[key] || key;
  }, [lang]);

  const toggleLanguage = async () => {
    const next = lang === 'en' ? 'bn' : 'en';
    setLang(next);
    try {
      await AsyncStorage.setItem(LANG_KEY, next);
    } catch (e) {
      console.log('Language save error:', e);
    }
  };

  const setLanguage = async (code) => {
    if (translations[code]) {
      setLang(code);
      try {
        await AsyncStorage.setItem(LANG_KEY, code);
      } catch (e) {
        console.log('Language save error:', e);
      }
    }
  };

  const isEnglish = lang === 'en';
  const isBangla = lang === 'bn';
  const currentLang = lang;
  const langLabel = lang === 'en' ? 'English' : 'বাংলা';

  return (
    <LanguageContext.Provider value={{
      t,
      lang,
      currentLang,
      isEnglish,
      isBangla,
      langLabel,
      toggleLanguage,
      setLanguage,
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
