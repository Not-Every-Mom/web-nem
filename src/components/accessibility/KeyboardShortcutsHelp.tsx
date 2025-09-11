import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { HelpCircle, Keyboard } from "lucide-react";
import { useLocation } from "react-router-dom";

interface KeyboardShortcutsHelpProps {
  trigger?: React.ReactNode;
}

export function KeyboardShortcutsHelp({ trigger }: KeyboardShortcutsHelpProps) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const getShortcutsForPage = () => {
    const pathname = location.pathname;
    
    const globalShortcuts = [
      { keys: ['Shift', '?'], description: 'Show this help dialog' },
      { keys: ['/', 'Escape'], description: 'Focus search / Close dialogs' },
      { keys: ['Tab'], description: 'Navigate between interactive elements' },
      { keys: ['Enter', 'Space'], description: 'Activate buttons and links' },
    ];

    if (pathname.startsWith('/admin')) {
      return [
        ...globalShortcuts,
        { keys: ['Alt', '1-5'], description: 'Quick navigation to admin sections' },
        { keys: ['Alt', 'H'], description: 'Go to Dashboard' },
      ];
    }

    if (pathname.includes('/onboarding')) {
      return [
        ...globalShortcuts,
        { keys: ['→', 'Space'], description: 'Next step' },
        { keys: ['←'], description: 'Previous step' },
        { keys: ['Escape'], description: 'Exit onboarding' },
      ];
    }

    if (pathname.includes('/chat')) {
      return [
        ...globalShortcuts,
        { keys: ['Enter'], description: 'Send message (in chat input)' },
        { keys: ['Shift', 'Enter'], description: 'New line in message' },
      ];
    }

    return globalShortcuts;
  };

  const shortcuts = getShortcutsForPage();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-2"
            aria-label="Show keyboard shortcuts"
          >
            <Keyboard className="w-4 h-4" />
            Shortcuts
          </Button>
        )}
      </DialogTrigger>
      <DialogContent 
        className="max-w-md"
        id="keyboard-shortcuts-help"
        aria-describedby="shortcuts-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        
        <div id="shortcuts-description" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Use these keyboard shortcuts to navigate more efficiently.
          </p>
          
          <div className="space-y-3">
            {shortcuts.map((shortcut, index) => (
              <div key={index}>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">{shortcut.description}</span>
                  <div className="flex gap-1">
                    {shortcut.keys.map((key, keyIndex) => (
                      <Badge 
                        key={keyIndex} 
                        variant="secondary" 
                        className="text-xs px-2 py-1"
                      >
                        {key}
                      </Badge>
                    ))}
                  </div>
                </div>
                {index < shortcuts.length - 1 && <Separator />}
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <HelpCircle className="w-3 h-3 inline mr-1" />
              Press <Badge variant="secondary" className="text-xs mx-1">Shift + ?</Badge> 
              anytime to show this help.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}