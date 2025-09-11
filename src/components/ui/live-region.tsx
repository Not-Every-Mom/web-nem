import * as React from "react";
import { cn } from "@/lib/utils";

interface LiveRegionProps extends React.HTMLAttributes<HTMLDivElement> {
  level?: 'polite' | 'assertive';
  atomic?: boolean;
}

/**
 * Accessible live region for announcing dynamic content changes
 */
const LiveRegion = React.forwardRef<HTMLDivElement, LiveRegionProps>(
  ({ className, level = 'polite', atomic = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("sr-only", className)}
        aria-live={level}
        aria-atomic={atomic}
        role="status"
        {...props}
      >
        {children}
      </div>
    );
  }
);
LiveRegion.displayName = "LiveRegion";

/**
 * Hook to announce messages to screen readers
 */
export function useAnnounce() {
  const announceRef = React.useRef<HTMLDivElement>(null);

  const announce = React.useCallback((message: string, level: 'polite' | 'assertive' = 'polite') => {
    if (!announceRef.current) return;
    
    // Clear previous message
    announceRef.current.textContent = '';
    
    // Set new message after a brief delay to ensure it's announced
    setTimeout(() => {
      if (announceRef.current) {
        announceRef.current.textContent = message;
        announceRef.current.setAttribute('aria-live', level);
      }
    }, 100);
  }, []);

  const AnnouncerComponent = React.useCallback(() => (
    <LiveRegion ref={announceRef} />
  ), []);

  return { announce, AnnouncerComponent };
}

export { LiveRegion };