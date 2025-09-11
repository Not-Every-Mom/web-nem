import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useChatHeader } from "@/hooks/useChatHeader";
import { usePersonaTheme } from "@/hooks/usePersonaTheme";
import { useEffect } from "react";
import { useEmbeddings } from "@/hooks/useEmbeddings";
import { Progress } from "@/components/ui/progress";

const ChatHeader = () => {
  const { visible, config } = useChatHeader();
  const theme = usePersonaTheme(config?.personaId);
  const { isLoading, isReady, error, progress, etaSeconds, device, ensureReady, retry } = useEmbeddings();

  useEffect(() => {
    if (!isReady && !isLoading) ensureReady();
  }, [isReady, isLoading]);

  if (!visible || !config) return null;

  const headerStyle = theme ? {
    borderColor: `${theme.primary}30`, // 30% opacity
    backgroundColor: `${theme.muted}40`, // 40% opacity
  } : {};

  const avatarStyle = theme ? {
    background: theme.gradient,
  } : {};

  return (
    <header 
      className="fixed top-0 left-1/2 transform -translate-x-1/2 w-full max-w-[414px] z-10 backdrop-blur-sm border-b px-4 py-3 transition-all duration-300"
      style={headerStyle}
    >
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={config.onBack}
          className="text-muted-foreground hover:bg-white/10"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <div 
          className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm transition-all duration-300"
          style={avatarStyle}
        >
          {theme?.icon ? (
            <theme.icon className="w-4 h-4 text-white" />
          ) : (
            <div className="w-4 h-4 bg-white rounded-full" />
          )}
        </div>

        <div className="min-w-0 w-full">
          <h1 
            className={`${theme?.textStyle || 'font-heading'} text-base truncate transition-colors duration-300`}
            style={{ color: theme?.primary || 'hsl(var(--deep-green))' }}
          >
            {config.title}
          </h1>
          {config.subtitle && (
            <p className="font-body text-xs text-muted-foreground">
              {config.subtitle}
            </p>
          )}

          {(isLoading && !isReady) && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Warming up embeddings{device ? ` • ${device}` : ''}</span>
                <span>{Math.round(progress ?? 0)}%{typeof etaSeconds === 'number' ? ` • ~${etaSeconds}s` : ''}</span>
              </div>
              <Progress value={progress ?? 0} className="h-1 mt-1" />
            </div>
          )}

          {!isLoading && !isReady && error && (
            <div className="mt-2 flex items-center gap-2">
              <p className="text-[11px] text-muted-foreground truncate">Failed to warm up embeddings.</p>
              <Button size="sm" variant="secondary" className="h-6 px-2" onClick={retry}>Retry</Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default ChatHeader;
