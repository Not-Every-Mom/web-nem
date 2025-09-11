import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from "react";

interface HeaderConfig {
  title: string;
  subtitle?: string;
  personaId?: string;
  onBack?: () => void;
}

interface ChatHeaderContextType {
  visible: boolean;
  config: HeaderConfig | null;
  show: (config: HeaderConfig) => void;
  update: (partial: Partial<HeaderConfig>) => void;
  hide: () => void;
}

const ChatHeaderContext = createContext<ChatHeaderContextType | undefined>(undefined);

export const ChatHeaderProvider = ({ children }: { children: ReactNode }) => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<HeaderConfig | null>(null);

  const show = useCallback((cfg: HeaderConfig) => {
    setConfig(cfg);
    setVisible(true);
  }, []);

  const update = useCallback((partial: Partial<HeaderConfig>) => {
    setConfig((prev) => (prev ? { ...prev, ...partial } : prev));
  }, []);

  const hide = useCallback(() => {
    setVisible(false);
    setConfig(null);
  }, []);

  const value = useMemo(() => ({ visible, config, show, update, hide }), [visible, config, show, update, hide]);

  return (
    <ChatHeaderContext.Provider value={value}>
      {children}
    </ChatHeaderContext.Provider>
  );
};

export const useChatHeader = () => {
  const ctx = useContext(ChatHeaderContext);
  if (!ctx) throw new Error("useChatHeader must be used within ChatHeaderProvider");
  return ctx;
};
