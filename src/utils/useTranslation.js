import { useEffect, useMemo, useState } from 'react';
import { getCurrentLanguage, getTranslations } from './translations';

/**
 * Reactive UI labels for English / Swahili.
 */
export function useTranslation() {
  const [lang, setLang] = useState(() => getCurrentLanguage());

  useEffect(() => {
    const refresh = () => setLang(getCurrentLanguage());
    window.addEventListener('languageChanged', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('languageChanged', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const t = useMemo(() => getTranslations(lang), [lang]);
  return { t, lang };
}
