import { useEffect } from 'react';
import { initPageTranslate } from '../utils/pageTranslate';
import './pageTranslate.css';

/**
 * Boots hidden Google Translate so Swahili covers the whole UI.
 */
export default function PageTranslateBoot() {
  useEffect(() => {
    initPageTranslate();
  }, []);

  return null;
}
