import React, { useEffect, useState } from 'react';
import { FaGlobe } from 'react-icons/fa';
import { getCurrentLanguage, setCurrentLanguage } from '../utils/translations';
import './LanguageSelector.css';

const LANGUAGES = {
  en: 'English',
  sw: 'Swahili',
};

/**
 * System language selector (English / Swahili).
 */
const LanguageSelector = () => {
  const [currentLang, setCurrentLang] = useState(() => getCurrentLanguage());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const refresh = () => setCurrentLang(getCurrentLanguage());
    window.addEventListener('languageChanged', refresh);
    return () => window.removeEventListener('languageChanged', refresh);
  }, []);

  const handleLanguageChange = (lang) => {
    const next = setCurrentLanguage(lang);
    setCurrentLang(next);
    setIsOpen(false);
  };

  return (
    <div className="language-selector">
      <button
        type="button"
        className="language-selector-btn"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title="Change language"
      >
        <FaGlobe />
        <span>{LANGUAGES[currentLang] || 'English'}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="language-selector-backdrop"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 998,
            }}
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="language-selector-dropdown" role="listbox">
            {Object.entries(LANGUAGES).map(([code, name]) => (
              <button
                key={code}
                type="button"
                role="option"
                aria-selected={currentLang === code}
                onClick={() => handleLanguageChange(code)}
                data-active={currentLang === code}
              >
                {name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;
