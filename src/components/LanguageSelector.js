import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FaGlobe } from 'react-icons/fa';
import { getCurrentLanguage, setCurrentLanguage } from '../utils/translations';
import { applyPageLanguage } from '../utils/pageTranslate';
import { getSectionFromPath } from '../utils/settingsSection';
import './LanguageSelector.css';

const LANGUAGES = {
  en: 'English',
  sw: 'Swahili',
};

/**
 * English / Swahili — preference is saved per portal (admin / boma / geita).
 */
const LanguageSelector = () => {
  const location = useLocation();
  const section = getSectionFromPath(location.pathname);
  const [currentLang, setCurrentLang] = useState(() => getCurrentLanguage(section));
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setCurrentLang(getCurrentLanguage(section));
  }, [section, location.pathname]);

  useEffect(() => {
    const refresh = (event) => {
      const eventSection = event?.detail?.section;
      if (!eventSection || eventSection === section) {
        setCurrentLang(getCurrentLanguage(section));
      }
    };
    window.addEventListener('languageChanged', refresh);
    return () => window.removeEventListener('languageChanged', refresh);
  }, [section]);

  const handleLanguageChange = (lang) => {
    if (lang === currentLang) {
      setIsOpen(false);
      return;
    }
    const next = setCurrentLanguage(lang, section);
    setCurrentLang(next);
    setIsOpen(false);
    applyPageLanguage(next, { reload: true, section });
  };

  return (
    <div className="language-selector notranslate">
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
