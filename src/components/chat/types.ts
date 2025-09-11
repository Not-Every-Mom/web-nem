export interface Message {
  id: string;
  content: string;
  sender_type: 'user' | 'persona';
  created_at: string;
}

export interface PersonaProfile {
  communication?: {
    samplePhrases?: string[];
    tone?: string;
  };
  [key: string]: unknown;
}

export interface Persona {
  id: string;
  name: string;
  display_name?: string;
  description: string;
  personality?: string;
  color_theme?: string;
  specialty?: string;
  profile?: PersonaProfile;
}

export interface Conversation {
  id: string;
  title: string;
}

export interface MemorySearchResult {
  results?: Array<{
    id: string;
    content: string;
    embedding?: Float32Array;
  }>;
}

export interface LocalMemoryEngine {
  isReady: boolean;
  encrypted: boolean;
  workerType: "SharedWorker" | "Worker";
  enabled: boolean;
  search: (query: string, limit: number) => Promise<unknown[] | { results: { content: string; id: string; embedding?: Float32Array; }[]; }>;
  addMemory: (item: Record<string, unknown> & { embedFromText?: boolean }) => Promise<void>;
  getStats: () => Promise<unknown>;
  exportData: () => Promise<ArrayBuffer>;
  importData: (data: ArrayBuffer) => Promise<void>;
  setupEncryption: (passphrase: string) => Promise<void>;
  unlock: (passphrase: string) => Promise<void>;
  lock: () => Promise<void>;
  getCryptoState: () => Promise<unknown>;
  getANNStats: () => Promise<unknown>;
}
