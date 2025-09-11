import type { MemoryItem, LocalMemoryItem } from '../types';
import { CryptoWorkerModule } from './CryptoWorkerModule';

export interface MemoryCandidate {
  id: string;
  content: string;
  embedding?: Float32Array;
}

export interface UsageStats {
  count: number;
}

export interface EncryptionMeta {
  encrypted: boolean;
  contentIv?: ArrayBuffer;
  embeddingIv?: ArrayBuffer;
  version: number; // for future crypto upgrades
}

export interface LocalMemoryItemExtended extends MemoryItem {
  embedding?: Float32Array;
  deleted_at?: string;
  local_rev?: string;
  encryption_meta?: EncryptionMeta;
  // For encrypted storage
  encrypted_content?: ArrayBuffer;
  encrypted_embedding?: ArrayBuffer;
}

export class StorageWorkerModule {
  private memoryStore: Map<string, LocalMemoryItemExtended> = new Map();
  private cryptoModule: CryptoWorkerModule;

  constructor(cryptoModule: CryptoWorkerModule) {
    this.cryptoModule = cryptoModule;
  }

  async init(): Promise<void> {
    console.log('StorageWorkerModule: Initializing in-memory storage...');
    this.memoryStore = new Map();
  }

  async addMemory(data: LocalMemoryItemExtended): Promise<void> {
    if (!data.id) {
      data.id = 'mem-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    const now = new Date().toISOString();
    const memoryItem: LocalMemoryItemExtended = {
      ...data,
      created_at: data.created_at || now,
      updated_at: now,
      usage_count: data.usage_count || 0,
      last_used_at: data.last_used_at || null,
      cooldown_until: data.cooldown_until || null,
    };

    // Handle encryption if crypto is available and unlocked
    const cryptoState = this.cryptoModule.getState();
    if (!cryptoState.isLocked && cryptoState.dataEncryptionKey) {
      try {
        await this.encryptMemoryItem(memoryItem);
      } catch (error) {
        console.warn('Failed to encrypt memory item, storing unencrypted:', error);
      }
    }

    this.memoryStore.set(memoryItem.id, memoryItem);
    console.log(`Memory item added: ${memoryItem.id}`);
  }

  async getCandidates(
    query: string, 
    opts: { limit?: number; offset?: number; queryEmbedding?: Float32Array }
  ): Promise<MemoryCandidate[]> {
    const candidates: MemoryCandidate[] = [];
    const limit = opts.limit || 10;
    const offset = opts.offset || 0;

    const cryptoState = this.cryptoModule.getState();
    const canDecrypt = !cryptoState.isLocked && cryptoState.dataEncryptionKey;

    let processed = 0;
    let skipped = 0;

    for (const [id, item] of this.memoryStore.entries()) {
      if (skipped < offset) {
        skipped++;
        continue;
      }
      if (processed >= limit) break;

      // Skip deleted items
      if (item.deleted_at) continue;

      try {
        let content = item.content;
        let embedding = item.embedding;

        // Decrypt if needed and possible
        if (item.encryption_meta?.encrypted && canDecrypt) {
          if (item.encrypted_content && item.encryption_meta.contentIv) {
            content = await this.decryptContent(item.encrypted_content, item.encryption_meta.contentIv);
          }
          if (item.encrypted_embedding && item.encryption_meta.embeddingIv) {
            embedding = await this.decryptEmbedding(item.encrypted_embedding, item.encryption_meta.embeddingIv);
          }
        } else if (item.encryption_meta?.encrypted && !canDecrypt) {
          // Skip encrypted items when locked
          continue;
        }

        // Simple text matching for now (will be enhanced with ANN later)
        if (query && content.toLowerCase().includes(query.toLowerCase())) {
          candidates.push({
            id,
            content,
            embedding
          });
          processed++;
        } else if (!query) {
          // Return all if no query
          candidates.push({
            id,
            content,
            embedding
          });
          processed++;
        }
      } catch (error) {
        console.warn(`Failed to process memory item ${id}:`, error);
      }
    }

    return candidates;
  }

  async updateUsage(id: string, usage: UsageStats): Promise<void> {
    const item = this.memoryStore.get(id);
    if (!item) {
      throw new Error(`Memory item not found: ${id}`);
    }

    item.usage_count = (item.usage_count || 0) + usage.count;
    item.last_used_at = new Date().toISOString();
    item.updated_at = new Date().toISOString();

    this.memoryStore.set(id, item);
    console.log(`Usage updated for memory item: ${id}`);
  }

  async exportData(): Promise<ArrayBuffer> {
    const exportData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      memories: Array.from(this.memoryStore.entries()).map(([id, item]) => ({
        id,
        ...item,
        // Convert Float32Array to regular array for JSON serialization
        embedding: item.embedding ? Array.from(item.embedding) : undefined
      }))
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    return new TextEncoder().encode(jsonString).buffer;
  }

  async importData(data: ArrayBuffer): Promise<void> {
    const jsonString = new TextDecoder().decode(data);
    const importData = JSON.parse(jsonString);

    if (!importData.memories || !Array.isArray(importData.memories)) {
      throw new Error('Invalid import data format');
    }

    // Clear existing data
    this.memoryStore.clear();

    // Import memories
    for (const memoryData of importData.memories) {
      const { id, embedding, ...rest } = memoryData;
      const item: LocalMemoryItemExtended = {
        ...rest,
        id,
        embedding: embedding ? new Float32Array(embedding) : undefined
      };
      this.memoryStore.set(id, item);
    }

    console.log(`Imported ${importData.memories.length} memory items`);
  }

  getStats(): { node_count: number } {
    const activeItems = Array.from(this.memoryStore.values()).filter(item => !item.deleted_at);
    return {
      node_count: activeItems.length
    };
  }

  private async encryptMemoryItem(item: LocalMemoryItemExtended): Promise<void> {
    try {
      const cryptoState = this.cryptoModule.getState();
      if (cryptoState.isLocked || !cryptoState.dataEncryptionKey) {
        return; // Skip encryption if locked
      }

      // Encrypt content
      if (item.content) {
        const encoder = new TextEncoder();
        const contentBuffer = encoder.encode(item.content).buffer;
        const { encrypted, iv } = await this.cryptoModule.encrypt(contentBuffer, cryptoState.dataEncryptionKey);
        
        item.encrypted_content = encrypted;
        item.content = ''; // Clear plaintext
        
        item.encryption_meta = {
          encrypted: true,
          contentIv: iv,
          version: 1
        };
      }

      // Encrypt embedding if present
      if (item.embedding) {
        const embeddingBuffer = item.embedding.buffer.slice(
          item.embedding.byteOffset,
          item.embedding.byteOffset + item.embedding.byteLength
        ) as ArrayBuffer;
        const { encrypted, iv } = await this.cryptoModule.encrypt(embeddingBuffer, cryptoState.dataEncryptionKey);
        
        item.encrypted_embedding = encrypted;
        item.embedding = undefined; // Clear plaintext
        
        if (item.encryption_meta) {
          item.encryption_meta.embeddingIv = iv;
        } else {
          item.encryption_meta = {
            encrypted: true,
            embeddingIv: iv,
            version: 1
          };
        }
      }
    } catch (error) {
      console.error('Failed to encrypt memory item:', error);
      throw error;
    }
  }

  private async decryptContent(encryptedContent: ArrayBuffer, iv: ArrayBuffer): Promise<string> {
    const cryptoState = this.cryptoModule.getState();
    if (cryptoState.isLocked || !cryptoState.dataEncryptionKey) {
      throw new Error('Cannot decrypt: crypto module is locked');
    }

    const decryptedBuffer = await this.cryptoModule.decrypt(encryptedContent, cryptoState.dataEncryptionKey, iv);
    return new TextDecoder().decode(decryptedBuffer);
  }

  private async decryptEmbedding(encryptedEmbedding: ArrayBuffer, iv: ArrayBuffer): Promise<Float32Array> {
    const cryptoState = this.cryptoModule.getState();
    if (cryptoState.isLocked || !cryptoState.dataEncryptionKey) {
      throw new Error('Cannot decrypt: crypto module is locked');
    }

    const decryptedBuffer = await this.cryptoModule.decrypt(encryptedEmbedding, cryptoState.dataEncryptionKey, iv);
    return new Float32Array(decryptedBuffer);
  }
}