import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, AlertCircle, RotateCcw } from "lucide-react";
import { useChatComposer } from "@/hooks/useChatComposer";
import { useEmbeddings } from "@/hooks/useEmbeddings";
import { Progress } from "@/components/ui/progress";
import { useAccessibility } from "@/components/accessibility/AccessibilityProvider";
import { useEffect } from "react";

const ChatComposer = () => {
  const { visible, config } = useChatComposer();
  const { isLoading, isReady, progress, etaSeconds, error, retry } = useEmbeddings();
  const { announce } = useAccessibility();

  if (!visible || !config) return null;

  const { value, onChange, onSubmit, disabled, placeholder, inputDisabled } = config;

  const blocked = isLoading || !isReady;
  const sendDisabled = disabled || blocked;
  const inputIsDisabled = Boolean(inputDisabled) || blocked;

  // Announce loading state changes
  useEffect(() => {
    if (isLoading && !isReady) {
      announce("AI model is loading, please wait", "polite");
    } else if (isReady) {
      announce("AI model is ready", "polite");
    } else if (error) {
      announce("AI model failed to load, please try again", "assertive");
    }
  }, [isLoading, isReady, error, announce]);

  return (
    <div className="fixed inset-x-0 bottom-[64px] z-60 pointer-events-none">
      <div className="max-w-[414px] mx-auto px-4">
        <div className="bg-card/60 backdrop-blur-sm border border-powder-blue/20 rounded-2xl shadow-lg p-3 pointer-events-auto">
          {(isLoading && !isReady) && (
            <div 
              className="mb-2"
              role="status"
              aria-live="polite"
              aria-describedby="loading-description"
            >
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span id="loading-description">Warming up</span>
                <span>{Math.round(progress ?? 0)}%{typeof etaSeconds === 'number' ? ` • ~${etaSeconds}s` : ''}</span>
              </div>
              <Progress value={progress ?? 0} className="h-1 mt-1" aria-label="AI model loading progress" />
            </div>
          )}
          {!isLoading && !isReady && error && (
            <div 
              className="mb-2 flex items-center gap-2"
              role="alert"
              aria-describedby="error-description"
            >
              <AlertCircle className="w-3 h-3 text-destructive" aria-hidden="true" />
              <p id="error-description" className="text-[11px] text-muted-foreground truncate">Model init failed.</p>
              <Button 
                variant="secondary" 
                size="sm" 
                className="h-6 px-2" 
                onClick={retry}
                aria-describedby="retry-help"
              >
                <RotateCcw className="w-3 h-3 mr-1" aria-hidden="true" />
                Retry
              </Button>
              <div id="retry-help" className="sr-only">
                Retry loading the AI model
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-full bg-muted px-3 py-2 transition-all duration-200 focus-within:bg-background focus-within:ring-2 focus-within:ring-powder-blue focus-within:ring-offset-0 focus-within:shadow-md focus-within:scale-[1.01]">
              <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSubmit();
                  }
                }}
                placeholder={placeholder}
                className="h-9 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none shadow-none placeholder:text-muted-foreground"
                disabled={inputIsDisabled}
                aria-label="Message input"
                aria-describedby={blocked ? "composer-status" : undefined}
              />
              {blocked && (
                <div id="composer-status" className="sr-only">
                  Chat input is disabled while AI model is loading
                </div>
              )}
            </div>
            <Button
              onClick={onSubmit}
              disabled={sendDisabled}
              className="h-10 w-10 rounded-full bg-gradient-primary text-white hover:opacity-90 active:opacity-95"
              aria-label="Send message"
              aria-describedby={sendDisabled ? "send-disabled-help" : undefined}
            >
              <Send className="w-4 h-4" aria-hidden="true" />
            </Button>
            {sendDisabled && (
              <div id="send-disabled-help" className="sr-only">
                Send button is disabled. {blocked ? "Please wait for AI model to load." : "Enter a message to send."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatComposer;
