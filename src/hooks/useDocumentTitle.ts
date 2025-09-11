import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PAGE_TITLES: Record<string, string> = {
  '/': 'M.O.M AI & Community - Not Every Mom',
  '/app': 'Home - M.O.M AI',
  '/app/chat': 'Chat - M.O.M AI',
  '/app/community': 'Community - M.O.M AI',
  '/app/resources': 'Resources - M.O.M AI',
  '/app/settings': 'Settings - M.O.M AI',
  '/app/history': 'Chat History - M.O.M AI',
  '/auth': 'Sign In - M.O.M AI',
  '/onboarding': 'Get Started - M.O.M AI',
  '/admin': 'Admin Dashboard - M.O.M AI',
};

export function useDocumentTitle(customTitle?: string) {
  const location = useLocation();

  useEffect(() => {
    const baseTitle = 'Not Every Mom - M.O.M AI & Community';
    
    if (customTitle) {
      document.title = `${customTitle} - ${baseTitle}`;
    } else {
      const pageTitle = PAGE_TITLES[location.pathname];
      document.title = pageTitle || baseTitle;
    }
  }, [location.pathname, customTitle]);
}

export function setDocumentTitle(title: string) {
  document.title = `${title} - Not Every Mom - M.O.M AI & Community`;
}