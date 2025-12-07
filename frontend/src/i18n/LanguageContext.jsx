/**
 * Language Context - Multi-language Support
 *
 * Provides internationalization (i18n) functionality with React Context.
 * Manages current language state and translation function.
 *
 * Supported Languages:
 * - 'es': Spanish (Español) - default
 * - 'en': English
 * - 'it': Italian (Italiano)
 * - 'de': German (Deutsch)
 * - 'fr': French (Français)
 *
 * Context Value:
 * - language (string): Current language code
 * - changeLanguage(lang): Switch to different language
 * - t(key): Translate key to current language
 *
 * Translation Function:
 * - Supports nested keys with dot notation: t('auth.login.title')
 * - Returns original key if translation missing
 *
 * Persistence:
 * - Saves language preference to localStorage
 * - Restores on app reload
 *
 * Usage:
 * ```jsx
 * const { language, changeLanguage, t } = useLanguage();
 * <h1>{t('landing.title')}</h1>
 * ```
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { translations } from "./translations";

const LanguageContext = createContext();

/**
 * Language Context Hook
 *
 * Access language context from any component within LanguageProvider.
 *
 * @returns {Object} Language context with language, changeLanguage, t
 * @throws {Error} If used outside LanguageProvider
 */
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};

/**
 * Language Provider Component
 *
 * Wraps app with language context, providing i18n to all children.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - App components
 * @returns {JSX.Element} Context provider
 */
export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Check localStorage first, otherwise default to Spanish
    return localStorage.getItem("language") || "es";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  /**
   * Translation function - converts key to localized text
   *
   * Supports nested object access via dot notation.
   *
   * @param {string} key - Translation key (e.g., 'auth.login.title')
   * @returns {string} Translated text or original key if not found
   *
   * @example
   * t('landing.title') // → 'Descubre Tenerife' (ES)
   * t('auth.login.button') // → 'Entrar' (ES)
   */
  const t = (key) => {
    const keys = key.split(".");
    let value = translations[language];

    for (const k of keys) {
      value = value?.[k];
    }

    return value || key;
  };

  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setLanguage(lang);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
