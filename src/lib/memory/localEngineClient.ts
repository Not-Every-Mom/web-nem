import * as Comlink from 'comlink';
import SharedWorkerURL from '../../workers/memoryWorker.ts?sharedworker';
import WorkerURL from '../../workers/memoryWorker.ts?worker';
import type { MemoryItem } from '../memory/types';

// Sync stats interface
interface SyncStats {
  total_operations: number;
  active_devices: number;
  latest_operation?: string;
  earliest_operation?: string;
  add_operations: number;
  update_operations: number;
  delete_operations: number;
  pending_upload: number;
  last_sync?: string;
}

// Encryption metadata for stored items
interface EncryptionMeta {
  encrypted: boolean;
  contentIv?: ArrayBuffer;
  embeddingIv?: ArrayBuffer;
  version: number; // for future crypto upgrades
}

// Crypto state interface
interface CryptoState {
  isLocked: boolean;
  hasWrappedDEK: boolean;
  keyDerivation: 'pbkdf2' | 'session' | null;
  dataEncryptionKey: CryptoKey | null;
}

// Wrapped DEK interface
interface WrappedDEK {
  wrappedKey: ArrayBuffer;
  salt: ArrayBuffer;
  iv: ArrayBuffer;
  keyDerivation: 'pbkdf2' | 'session';
  iterations?: number;
}

// ANN Index Stats interface
interface ANNIndexStats {
  currentElements: number;
  maxElements: number;
  dimension: number;
  isIndexed: boolean;
  lastRebuild?: string;
}

// Extended MemoryItem for local storage with additional fields
interface LocalMemoryItem extends MemoryItem {
  embedding?: Float32Array;
  deleted_at?: string;
  local_rev?: string;
  encryption_meta?: EncryptionMeta;
  // For encrypted storage
  encrypted_content?: ArrayBuffer;
  encrypted_embedding?: ArrayBuffer;
}

interface MemoryCandidate {
  id: string;
  content: string;
  embedding?: Float32Array;
}

interface UsageStats {
  count: number;
}

class LocalEngineClient {
  private worker: Worker | SharedWorker | null = null;
  private api: Comlink.Remote<any> | null = null;
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Try to create a SharedWorker first, fallback to regular Worker
      let workerPort: MessagePort | Worker;
      
      if (typeof SharedWorker !== 'undefined') {
        console.log('Creating SharedWorker...');
        const SharedCtor = SharedWorkerURL as unknown as new () => SharedWorker;
        this.worker = new SharedCtor();
        workerPort = (this.worker as SharedWorker).port;
        (this.worker as SharedWorker).port.start();
      } else {
        console.log('SharedWorker not available, falling back to Worker...');
        const WorkerCtor = WorkerURL as unknown as new () => Worker;
        this.worker = new WorkerCtor();
        workerPort = this.worker as Worker;
      }

      // Wrap the worker with Comlink
      this.api = Comlink.wrap<any>(workerPort);

      // Initialize the worker
      await this.api.init();
      this.initialized = true;
      
      console.log('LocalEngineClient initialized successfully');
    } catch (error) {
      console.error('Failed to initialize LocalEngineClient:', error);
      throw error;
    }
  }

  async addMemory(data: MemoryItem, embedding?: Float32Array): Promise<void> {
    if (!this.api) {
      throw new Error('LocalEngineClient not initialized');
    }
    
    // Convert MemoryItem to LocalMemoryItem with proper embedding
    const localMemoryItem: LocalMemoryItem = {
      ...data,
      embedding: embedding
    };
    
    return this.api.addMemory(localMemoryItem);
  }

  async getCandidates(query: string, opts: { limit?: number; offset?: number; queryEmbedding?: Float32Array } = {}): Promise<MemoryCandidate[]> {
    if (!this.api) {
      throw new Error('LocalEngineClient not initialized');
    }
    return this.api.getCandidates(query, opts);
  }

  async updateUsage(id: string, usage: UsageStats): Promise<void> {
    if (!this.api) {
      throw new Error('LocalEngineClient not initialized');
    }
    return this.api.updateUsage(id, usage);
  }

  async exportData(): Promise<ArrayBuffer> {
    if (!this.api) {
      throw new Error('LocalEngineClient not initialized');
    }
    return this.api.exportData();
  }

  async importData(data: ArrayBuffer): Promise<void> {
    if (!this.api) {
      throw new Error('LocalEngineClient not initialized');
    }
    return this.api.importData(data);
  }

  async getStats(): Promise<{ node_count: number; crypto_state?: CryptoState; ann_stats?: ANNIndexStats; sync_stats?: SyncStats }> {
    if (!this.api) {
      throw new Error('LocalEngineClient not initialized');
    }
    return this.api.getStats();
  }

  // Encryption methods
  async setupEncryption(passphrase: string): Promise<void> {
    if (!this.api) {
      throw new Error('LocalEngineClient not initialized');
    }
    return this.api.setupEncryption(passphrase);
  }

  async setupSessionEncryption(sessionData: string): Promise<void> {
    if (!this.api) {
      throw new Error('LocalEngineClient not initialized');
    }
    return this.api.setupSessionEncryption(sessionData);
  }

  async unlock(passphrase: string): Promise<void> {
    if (!this.api) {
      throw new Error('LocalEngineClient not initialized');
    }
    return this.api.unlock(passphrase);
  }

  async lock(): Promise<void> {
    if (!this.api) {
      throw new Error('LocalEngineClient not initialized');
    }
    return this.api.lock();
  }

  async rotateKey(newPassphrase: string): Promise<void> {
    if (!this.api) {
      throw new Error('LocalEngineClient not initialized');
    }
    return this.api.rotateKey(newPassphrase);
  }

  async getCryptoState(): Promise<CryptoState> {
    if (!this.api) {
      throw new Error('LocalEngineClient not initialized');
    }
    return this.api.getCryptoState();
  }

  async getWrappedDEK(): Promise<WrappedDEK | null> {
    if (!this.api) {
      throw new Error('LocalEngineClient not initialized');
    }
    return this.api.getWrappedDEK();
  }

  async loadWrappedDEK(wrappedDEK: WrappedDEK): Promise<void> {
    if (!this.api) {
      throw new Error('LocalEngineClient not initialized');
    }
    return this.api.loadWrappedDEK(wrappedDEK);
  }

  // Utility methods for encryption status
  async isEncrypted(): Promise<boolean> {
    const cryptoState = await this.getCryptoState();
    return cryptoState.hasWrappedDEK;
  }

  async isLocked(): Promise<boolean> {
    const cryptoState = await this.getCryptoState();
    return cryptoState.isLocked;
  }

  // ANN Index methods
  async rebuildANNIndex(): Promise<void> {
    if (!this.api) {
      throw new Error('LocalEngineClient not initialized');
    }
    return this.api.rebuildANNIndex();
  }

  async getANNStats(): Promise<ANNIndexStats> {
    if (!this.api) {
      throw new Error('LocalEngineClient not initialized');
    }
    return this.api.getANNStats();
  }

  // Sync methods
  async enableSync(supabaseUrl: string, supabaseKey: string, userId: string): Promise<void> {
    if (!this.api) {
      throw new Error('LocalEngineClient not initialized');
    }
    return this.api.enableSync(supabaseUrl, supabaseKey, userId);
  }

  async disableSync(): Promise<void> {
    if (!this.api) {
      throw new Error('LocalEngineClient not initialized');
    }
    return this.api.disableSync();
  }

  async triggerSync(): Promise<void> {
    if (!this.api) {
      throw new Error('LocalEngineClient not initialized');
    }
    return this.api.triggerSync();
  }

  async getSyncStats(): Promise<SyncStats> {
    if (!this.api) {
      throw new Error('LocalEngineClient not initialized');
    }
    return this.api.getSyncStats();
  }

  async setSyncEnabled(enabled: boolean): Promise<void> {
    if (!this.api) {
      throw new Error('LocalEngineClient not initialized');
    }
    return this.api.setSyncEnabled(enabled);
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      if (this.worker instanceof SharedWorker) {
        this.worker.port.close();
      } else {
        this.worker.terminate();
      }
      this.worker = null;
      this.api = null;
      this.initialized = false;
    }
  }
}

// Create a singleton instance
export const localEngineClient = new LocalEngineClient();

// Legacy API adapter for existing ChatInterface
export interface AddMemoryItem {
  memory_type: string;
  content: string;
  salience: number;
  sensitive: boolean;
  topic_tags: string[];
  source: string;
  embedding?: Float32Array;
  embedFromText?: boolean;
}

export const LocalMemoryEngine = {
  async init(kek?: string): Promise<{ encrypted: boolean }> {
    await localEngineClient.init();
    
    // Check if encryption is already set up
    const isEncrypted = await localEngineClient.isEncrypted();
    
    // If a KEK (session data) is provided and encryption isn't set up, set up session encryption
    if (kek && !isEncrypted) {
      try {
        await localEngineClient.setupSessionEncryption(kek);
        return { encrypted: true };
      } catch (error) {
        console.error('Failed to setup session encryption:', error);
        return { encrypted: false };
      }
    }
    
    // If encryption is set up but locked, try to unlock with KEK
    if (isEncrypted && kek && await localEngineClient.isLocked()) {
      try {
        await localEngineClient.unlock(kek);
        return { encrypted: true };
      } catch (error) {
        console.error('Failed to unlock encryption:', error);
        return { encrypted: true }; // Still encrypted, just locked
      }
    }
    
    return { encrypted: isEncrypted };
  },

  async addMemory(item: AddMemoryItem): Promise<void> {
    let embedding = item.embedding;
    if (!embedding && item.embedFromText) {
      // Generate embedding using the existing embeddings infrastructure
      const { embedText } = await import('@/lib/embeddings');
      const embeddingArray = await embedText(item.content);
      embedding = new Float32Array(embeddingArray);
    }

    // Convert AddMemoryItem to MemoryItem format
    const memoryItem: MemoryItem = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      user_id: 'current-user', // TODO: Get actual user ID
      memory_type: item.memory_type as MemoryItem['memory_type'],
      content: item.content,
      salience: item.salience,
      sensitive: item.sensitive,
      usage_count: 0,
      last_used_at: null,
      cooldown_until: null,
      topic_tags: item.topic_tags,
      source: item.source,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await localEngineClient.addMemory(memoryItem, embedding);
  },

  async searchByEmbedding(embedding: Float32Array, maxResults: number = 5): Promise<{ results: Array<{ content: string; id: string; embedding?: Float32Array }> }> {
    // For now, we'll use a simple text search since our current implementation doesn't support embedding search
    // TODO: Implement proper embedding-based search
    const candidates = await localEngineClient.getCandidates('', { limit: maxResults });
    
    return {
      results: candidates.map(candidate => ({
        content: candidate.content,
        id: candidate.id,
        embedding: candidate.embedding
      }))
    };
  },

  async persist(): Promise<void> {
    // For now, this is a no-op since we're using in-memory storage
    // TODO: Implement persistence when we add SQLite
    console.log('LocalMemoryEngine.persist() called - no-op for in-memory storage');
  },

  async clear(): Promise<void> {
    // TODO: Implement clear functionality
    console.log('LocalMemoryEngine.clear() called - not yet implemented');
  }
};

export type {
  MemoryItem,
  MemoryCandidate,
  UsageStats,
  CryptoState,
  WrappedDEK,
  EncryptionMeta,
  LocalMemoryItem,
  ANNIndexStats
};
