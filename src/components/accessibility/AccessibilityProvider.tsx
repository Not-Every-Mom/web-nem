import React, { createContext, useContext, ReactNode } from 'react';
import { useAnnounce } from '@/components/ui/live-region';
import { useFocusManagement } from '@/hooks/useFocusManagement';

interface AccessibilityContextType {
  announce: (message: string, level?: 'polite' | 'assertive') => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
}

interface AccessibilityProviderProps {
  children: ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const { announce, AnnouncerComponent } = useAnnounce();
  
  // Set up focus management for route changes
  useFocusManagement();

  return (
    <AccessibilityContext.Provider value={{ announce }}>
      {children}
      <AnnouncerComponent />
      {/* Hidden announcer for route changes */}
      <div id="route-announcer" className="sr-only" aria-live="polite" role="status" />
    </AccessibilityContext.Provider>
  );
}