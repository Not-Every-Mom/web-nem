import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface DemoContextType {
  isDemoMode: boolean;
  toggleDemoMode: () => void;
  exitDemoMode: () => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const useDemo = (): DemoContextType => {
  const context = useContext(DemoContext);

  if (context === undefined) {
    return {
      isDemoMode: false,
      toggleDemoMode: () => {},
      exitDemoMode: () => {},
    };
  }

  return context;
};

interface DemoProviderProps {
  children: ReactNode;
}

export const DemoProvider = ({ children }: DemoProviderProps) => {
  // Initialize from localStorage (default false)
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem('isDemoMode');
      if (raw === null) return false;
      return raw === 'true';
    } catch (e) {
      return false;
    }
  });

  const { user } = useAuth();

  // Persist changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('isDemoMode', String(isDemoMode));
    } catch (e) {
      // ignore storage errors
    }
  }, [isDemoMode]);

  // Auto-exit demo mode when a real user session appears
  useEffect(() => {
    if (user && isDemoMode) {
      setIsDemoMode(false);
      try {
        localStorage.setItem('isDemoMode', 'false');
      } catch (e) {
        // ignore
      }
    }
    // Only react to user changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const toggleDemoMode = () => {
    setIsDemoMode((prev) => !prev);
  };

  const exitDemoMode = () => {
    setIsDemoMode(false);
  };

  const value: DemoContextType = {
    isDemoMode,
    toggleDemoMode,
    exitDemoMode,
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
};
