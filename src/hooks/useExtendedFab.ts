import { useState, useEffect, useRef } from 'react';

interface UseExtendedFabReturn {
  extended: boolean;
  visible: boolean;
}

/**
 * Hook to manage Extended FAB behavior on scroll
 * - Collapses to icon-only after scrolling down
 * - Hides when scrolling down, shows when scrolling up
 * - Always extended when at the top of the page
 */
export function useExtendedFab(threshold = 50): UseExtendedFabReturn {
  const [extended, setExtended] = useState(true);
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Hide on scroll down, show on scroll up
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setVisible(false);
      } else {
        setVisible(true);
      }

      // Collapse after scrolling past threshold
      setExtended(currentScrollY < threshold);

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return { extended, visible };
}
