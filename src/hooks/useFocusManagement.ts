import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook to manage focus for route changes and modal states
 */
export function useFocusManagement() {
  const location = useLocation();
  const previousLocation = useRef(location.pathname);

  useEffect(() => {
    // Only handle focus on route change, not initial load
    if (previousLocation.current !== location.pathname) {
      // Focus the main content area after route change
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        mainContent.focus();
        // Also scroll to top for better UX
        window.scrollTo(0, 0);
      }
      
      // Announce route change to screen readers
      announceRouteChange(location.pathname);
    }
    
    previousLocation.current = location.pathname;
  }, [location.pathname]);
}

/**
 * Hook for focus trap in modals and dialogs
 */
export function useFocusTrap(isOpen: boolean, containerRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Focus first element when opened
    firstFocusable?.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTab);
    
    return () => {
      container.removeEventListener('keydown', handleTab);
    };
  }, [isOpen, containerRef]);
}

/**
 * Announce route changes to screen readers
 */
function announceRouteChange(pathname: string) {
  const announcer = document.getElementById('route-announcer');
  if (!announcer) return;

  const pageNames: Record<string, string> = {
    '/': 'Home page',
    '/app': 'Application home',
    '/app/chat': 'Chat page',
    '/app/community': 'Community page',
    '/app/resources': 'Resources page',
    '/app/settings': 'Settings page',
    '/app/history': 'Chat history page',
    '/auth': 'Sign in page',
    '/onboarding': 'Onboarding page',
  };

  const pageName = pageNames[pathname] || 'Page';
  announcer.textContent = `Navigated to ${pageName}`;
}