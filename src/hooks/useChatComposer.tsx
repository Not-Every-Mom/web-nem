import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from "react";

interface ComposerConfig {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean; // affects send button
  inputDisabled?: boolean; // affects text input only
  placeholder?: string;
}

interface ChatComposerContextType {
  visible: boolean;
  config: ComposerConfig | null;
  show: (config: ComposerConfig) => void;
  update: (partial: Partial<ComposerConfig>) => void;
  hide: () => void;
}

const ChatComposerContext = createContext<ChatComposerContextType | undefined>(undefined);

export const ChatComposerProvider = ({ children }: { children: ReactNode }) => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<ComposerConfig | null>(null);

  const show = useCallback((cfg: ComposerConfig) => {
    setConfig(cfg);
    setVisible(true);
  }, []);

  const update = useCallback((partial: Partial<ComposerConfig>) => {
    setConfig((prev) => (prev ? { ...prev, ...partial } : prev));
  }, []);

  const hide = useCallback(() => {
    setVisible(false);
    setConfig(null);
  }, []);

  const value = useMemo(() => ({ visible, config, show, update, hide }), [visible, config, show, update, hide]);

  return (
    <ChatComposerContext.Provider value={value}>
      {children}
    </ChatComposerContext.Provider>
  );
};

export const useChatComposer = () => {
  const ctx = useContext(ChatComposerContext);
  if (!ctx) throw new Error("useChatComposer must be used within ChatComposerProvider");
  return ctx;
};
