import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getCurrentLanguage, getTranslations } from './translations';
import { getSectionFromPath } from './settingsSection';

/**
 * Reactive UI labels for English / Swahili (scoped to current portal).
 */
export function useTranslation() {
  const location = useLocation();
  const section = getSectionFromPath(location.pathname);
  const [lang, setLang] = useState(() => getCurrentLanguage(section));

  useEffect(() => {
    setLang(getCurrentLanguage(section));
  }, [section, location.pathname]);

  useEffect(() => {
    const refresh = (event) => {
      const eventSection = event?.detail?.section;
      if (!eventSection || eventSection === section) {
        setLang(getCurrentLanguage(section));
      }
    };
    window.addEventListener('languageChanged', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('languageChanged', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [section]);

  const t = useMemo(() => getTranslations(lang), [lang]);
  return { t, lang };
}
