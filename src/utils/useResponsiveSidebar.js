import { useState, useEffect, useCallback } from 'react';

export const MOBILE_BREAKPOINT = 768;

export function useResponsiveSidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth > MOBILE_BREAKPOINT;
  });
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= MOBILE_BREAKPOINT;
  });

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const handleChange = (event) => {
      const mobile = event.matches;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };

    handleChange(mq);
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (!isMobile || !sidebarOpen) {
      document.body.style.overflow = '';
      return undefined;
    }
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, sidebarOpen]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((open) => !open);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  return {
    sidebarOpen,
    setSidebarOpen,
    isMobile,
    toggleSidebar,
    closeSidebar,
  };
}
