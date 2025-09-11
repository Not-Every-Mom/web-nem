import { useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
  preventDefault?: boolean;
}

/**
 * Hook for managing keyboard shortcuts with accessibility support
 */
export function useKeyboardShortcuts({ 
  shortcuts, 
  enabled = true, 
  preventDefault = true 
}: UseKeyboardShortcutsOptions) {
  
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const matchingShortcut = shortcuts.find(shortcut => {
        return (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          !!event.ctrlKey === !!shortcut.ctrlKey &&
          !!event.altKey === !!shortcut.altKey &&
          !!event.shiftKey === !!shortcut.shiftKey &&
          !!event.metaKey === !!shortcut.metaKey
        );
      });

      if (matchingShortcut) {
        if (preventDefault) {
          event.preventDefault();
        }
        matchingShortcut.action();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled, preventDefault]);

  return {
    shortcuts: shortcuts.map(s => ({
      key: s.key,
      modifiers: [
        s.ctrlKey && 'Ctrl',
        s.altKey && 'Alt', 
        s.shiftKey && 'Shift',
        s.metaKey && (navigator.platform.includes('Mac') ? 'Cmd' : 'Meta')
      ].filter(Boolean).join('+'),
      description: s.description
    }))
  };
}

/**
 * Global keyboard shortcuts for the application
 */
export function useGlobalKeyboardShortcuts() {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: '?',
      shiftKey: true,
      action: () => {
        // Show keyboard shortcuts help
        const helpElement = document.getElementById('keyboard-shortcuts-help');
        if (helpElement) {
          helpElement.focus();
        }
      },
      description: 'Show keyboard shortcuts help'
    },
    {
      key: '/',
      action: () => {
        // Focus search if available
        const searchInput = document.querySelector('[role="search"] input') as HTMLElement;
        if (searchInput) {
          searchInput.focus();
        }
      },
      description: 'Focus search'
    }
  ];

  return useKeyboardShortcuts({ shortcuts });
}