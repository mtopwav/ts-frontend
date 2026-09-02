import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FaMoon, FaSun } from 'react-icons/fa';
import { toggleTheme, getTheme, applyTheme } from '../utils/theme';
import { getSectionFromPath } from '../utils/settingsSection';

const ThemeToggle = () => {
  const location = useLocation();
  const section = getSectionFromPath(location.pathname);

  const [currentTheme, setCurrentTheme] = useState(() => getTheme(section));

  useEffect(() => {
    // Keep document theme in sync when switching portals
    applyTheme(getTheme(section), section);
    setCurrentTheme(getTheme(section));
  }, [section, location.pathname]);

  useEffect(() => {
    const handleThemeChange = (event) => {
      const eventSection = event?.detail?.section;
      if (!eventSection || eventSection === section) {
        setCurrentTheme(getTheme(section));
      }
    };
    window.addEventListener('themeChanged', handleThemeChange);
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, [section]);

  const handleToggle = () => {
    const newTheme = toggleTheme(section);
    setCurrentTheme(newTheme);
  };

  // Determine if currently in dark mode
  const isDarkMode = () => currentTheme === 'dark';

  return (
    <button 
      className="theme-toggle-btn" 
      onClick={handleToggle}
      title={isDarkMode() ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      style={{
        padding: '8px 12px',
        background: 'transparent',
        border: '1px solid #ddd',
        borderRadius: '6px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        color: '#666',
        transition: 'all 0.3s',
        fontSize: '14px'
      }}
    >
      {isDarkMode() ? <FaSun /> : <FaMoon />}
    </button>
  );
};

export default ThemeToggle;
