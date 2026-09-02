import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initPageTranslate, syncPageLanguageForPath } from '../utils/pageTranslate';
import { syncThemeForPath } from '../utils/theme';
import { getSectionFromPath } from '../utils/settingsSection';
import './pageTranslate.css';

/**
 * Boots hidden Google Translate and keeps theme/language scoped to the
 * current portal (admin / boma / geita).
 */
export default function PageTranslateBoot() {
  const location = useLocation();
  const section = getSectionFromPath(location.pathname);

  useEffect(() => {
    initPageTranslate(section);
  }, []);

  useEffect(() => {
    syncThemeForPath(location.pathname);
    syncPageLanguageForPath(location.pathname);
  }, [section, location.pathname]);

  return null;
}
