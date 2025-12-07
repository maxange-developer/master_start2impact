/**
 * Language Selector Component
 *
 * Dropdown menu for switching application language with country flags.
 * Supports two visual variants for different UI contexts.
 *
 * Props:
 * @param {Object} props
 * @param {'navbar'|'auth'} props.variant - Display variant (default: 'navbar')
 *
 * Variants:
 * - 'navbar': Compact icon with hover dropdown (for top navigation)
 * - 'auth': Inline dropdown for login/register pages
 *
 * Features:
 * - Country flags via react-country-flag
 * - Hover-activated dropdown (navbar variant)
 * - Persistent language selection (localStorage)
 * - Current language highlighting
 *
 * Languages:
 * - IT (Italian) - Italy flag
 * - ES (Spanish) - Spain flag
 * - EN (English) - UK flag
 *
 * Technical Notes:
 * - Uses group-hover for dropdown animation
 * - Z-index 50 ensures dropdown above content
 * - Tailwind transitions for smooth UX
 */

import React from "react";
import { useLanguage } from "./LanguageContext";
import ReactCountryFlag from "react-country-flag";

const LanguageSelector = ({ variant = "navbar" }) => {
  const { language, changeLanguage } = useLanguage();

  const languages = [
    { code: "it", name: "Italiano", countryCode: "IT" },
    { code: "es", name: "Español", countryCode: "ES" },
    { code: "en", name: "English", countryCode: "GB" },
  ];

  const currentLang = languages.find((l) => l.code === language);

  if (variant === "navbar") {
    return (
      <div className="relative group">
        <button className="p-2.5 rounded-full text-gray-400 hover:bg-gray-800 transition-colors flex items-center justify-center">
          <ReactCountryFlag
            countryCode={currentLang?.countryCode}
            svg
            style={{
              width: "1.5em",
              height: "1.5em",
            }}
          />
        </button>
        <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
          <div className="p-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-100 rounded-xl transition-colors ${
                  language === lang.code ? "bg-gray-100" : ""
                }`}
              >
                <ReactCountryFlag
                  countryCode={lang.countryCode}
                  svg
                  style={{
                    width: "1.5em",
                    height: "1.5em",
                  }}
                />
                <span className="text-black font-medium">{lang.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === "auth") {
    return (
      <div className="relative group">
        <button className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-colors">
          <ReactCountryFlag
            countryCode={currentLang?.countryCode}
            svg
            style={{
              width: "1.5em",
              height: "1.5em",
            }}
          />
          <span className="text-xs text-white">
            {currentLang?.code.toUpperCase()}
          </span>
        </button>
        <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                language === lang.code ? "bg-gray-100" : ""
              }`}
            >
              <ReactCountryFlag
                countryCode={lang.countryCode}
                svg
                style={{
                  width: "1.5em",
                  height: "1.5em",
                }}
              />
              <span className="text-gray-800">{lang.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "landing") {
    return (
      <div className="relative group">
        <button className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-colors border border-white/20">
          <ReactCountryFlag
            countryCode={currentLang?.countryCode}
            svg
            style={{
              width: "1.5em",
              height: "1.5em",
            }}
          />
          <span className="text-sm text-white font-medium">
            {currentLang?.name}
          </span>
        </button>
        <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl transition-colors ${
                language === lang.code ? "bg-gray-100" : ""
              }`}
            >
              <ReactCountryFlag
                countryCode={lang.countryCode}
                svg
                style={{
                  width: "1.5em",
                  height: "1.5em",
                }}
              />
              <span className="text-gray-800 font-medium">{lang.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

export default LanguageSelector;
