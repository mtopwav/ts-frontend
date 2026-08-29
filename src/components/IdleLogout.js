import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/** Auto-logout after this many ms of no mouse/keyboard/touch activity */
const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

const ACTIVITY_EVENTS = [
  'mousemove',
  'mousedown',
  'keydown',
  'scroll',
  'touchstart',
  'click',
  'wheel',
];

function isLoggedIn() {
  try {
    return Boolean(
      localStorage.getItem('user') || sessionStorage.getItem('user')
    );
  } catch {
    return false;
  }
}

function clearSession() {
  try {
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
  } catch {
    /* ignore */
  }
}

/**
 * Logs the user out after 10 minutes of inactivity while on authenticated routes.
 */
export default function IdleLogout() {
  const navigate = useNavigate();
  const location = useLocation();
  const timerRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  useEffect(() => {
    const path = location.pathname || '';
    const onPublicPage =
      path === '/' ||
      path === '/login' ||
      path.startsWith('/login');

    if (onPublicPage || !isLoggedIn()) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return undefined;
    }

    const logout = () => {
      clearSession();
      navigate('/login', {
        replace: true,
        state: { idleLogout: true },
      });
    };

    const resetTimer = () => {
      lastActivityRef.current = Date.now();
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (!isLoggedIn()) return;
        // Confirm still idle (tab may have been backgrounded)
        if (Date.now() - lastActivityRef.current >= IDLE_TIMEOUT_MS) {
          logout();
        }
      }, IDLE_TIMEOUT_MS);
    };

    // Throttle mousemove so we don't reset constantly every pixel
    let throttleUntil = 0;
    const onActivity = () => {
      const now = Date.now();
      if (now < throttleUntil) return;
      throttleUntil = now + 1000;
      resetTimer();
    };

    resetTimer();
    ACTIVITY_EVENTS.forEach((evt) => {
      window.addEventListener(evt, onActivity, { passive: true });
    });
    document.addEventListener('visibilitychange', onActivity);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((evt) => {
        window.removeEventListener(evt, onActivity);
      });
      document.removeEventListener('visibilitychange', onActivity);
    };
  }, [location.pathname, navigate]);

  return null;
}
