// Implementation: memoryWorker.impl.ts
// Contains the MemoryEngineAPI object and related orchestration logic.
// This file is the refactored implementation; the original entry file will remain
// small and will expose the API to Comlink.

import * as Comlink from 'comlink';

// Import worker modules
import { CryptoWorkerModule, type WrappedDEK, type CryptoState } from '../lib/memory/worker/CryptoWorkerModule';
import { StorageWorkerModule, type MemoryCandidate, type UsageStats } from '../lib/memory/worker/StorageWorkerModule';

// Import types from the main types file
import type { MemoryItem, LocalMemoryItem } from '../lib/memory/types';
import { ANNIndex, ANNIndexStats, ANNIndexConfig } from '../lib/memory/annIndex';

// Note: Sync service imports commented out until fully implemented
// import { OpLogService, type SyncStats, type SyncOperation, type OperationPayload, type SyncOperationType } from '../lib/memory/sync/opLogService';

interface SyncStats {
  syncEnabled: boolean;
}

// Define the API surface for the memory engine
export interface MemoryEngineAPI {
  init(): Promise<void>;
  addMemory(data: LocalMemoryItem): Promise<void>;
  getCandidates(query: string, opts: { limit?: number; offset?: number; queryEmbedding?: Float32Array }): Promise<MemoryCandidate[]>;
  updateUsage(id: string, usage: UsageStats): Promise<void>;
  exportData(): Promise<ArrayBuffer>;
  importData(data: ArrayBuffer): Promise<void>;
  getStats(): Promise<{ node_count: number; crypto_state?: CryptoState; ann_stats?: ANNIndexStats; sync_stats?: SyncStats }>;
  
  // Encryption methods
  setupEncryption(passphrase: string): Promise<void>;
  setupSessionEncryption(sessionData: string): Promise<void>;
  unlock(passphrase: string): Promise<void>;
  lock(): Promise<void>;
  rotateKey(newPassphrase: string): Promise<void>;
  getCryptoState(): Promise<CryptoState>;
  getWrappedDEK(): Promise<WrappedDEK | null>;
  loadWrappedDEK(wrappedDEK: WrappedDEK): Promise<void>;
  
  // ANN Index methods
  rebuildANNIndex(): Promise<void>;
  getANNStats(): Promise<ANNIndexStats>;
  
  // Sync methods
  enableSync(supabaseUrl: string, supabaseKey: string, userId: string): Promise<void>;
  disableSync(): Promise<void>;
  triggerSync(): Promise<void>;
  getSyncStats(): Promise<SyncStats>;
  setSyncEnabled(enabled: boolean): Promise<void>;
}

// Worker modules
let cryptoModule: CryptoWorkerModule;
let storageModule: StorageWorkerModule;
let annIndex: ANNIndex | null = null;
// let opLogService: OpLogService | null = null; // Commented out until sync is implemented
let initialized = false;

// ANN configuration
const ANN_CONFIG: ANNIndexConfig = {
  dimension: 384, // Default embedding dimension for sentence transformers
  maxElements: 10000,
  efConstruction: 200,
  M: 16,
  randomSeed: 42
};

// Sync configuration
let syncEnabled = false;
let deviceId = '';

// Generate device ID on worker initialization
function generateDeviceId(): string {
  // Create a stable device ID based on browser fingerprint
  const canvas = new OffscreenCanvas(200, 50);
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
  }
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.convertToBlob ? 'canvas' : 'no-canvas'
  ].join('|');
  
  // Generate deterministic ID from fingerprint
  return 'device-' + btoa(fingerprint).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
}

// Initialize device ID
deviceId = generateDeviceId();

export const API: MemoryEngineAPI = {
  async init() {
    console.log('MemoryEngineAPI: Initializing...');
    try {
      // Initialize crypto module
      cryptoModule = new CryptoWorkerModule();
      
      // Initialize storage module
      storageModule = new StorageWorkerModule(cryptoModule);
      await storageModule.init();
      
      // Initialize ANN index
      annIndex = new ANNIndex(ANN_CONFIG);
      
      // Try to load existing ANN index from OPFS
      try {
        await annIndex.loadFromOPFS('memory_ann_index');
        console.log('Loaded existing ANN index from OPFS');
      } catch (error) {
        console.log('No existing ANN index found, will create new one as needed');
      }
      
      initialized = true;
      console.log('MemoryEngineAPI: Initialization complete');
    } catch (error) {
      console.error('MemoryEngineAPI: Initialization failed:', error);
      throw error;
    }
  },

  async addMemory(data: LocalMemoryItem) {
    if (!initialized) throw new Error('Memory engine not initialized');
    return await storageModule.addMemory(data);
  },

  async getCandidates(query: string, opts: { limit?: number; offset?: number; queryEmbedding?: Float32Array }) {
    if (!initialized) throw new Error('Memory engine not initialized');
    return await storageModule.getCandidates(query, opts);
  },

  async updateUsage(id: string, usage: UsageStats) {
    if (!initialized) throw new Error('Memory engine not initialized');
    return await storageModule.updateUsage(id, usage);
  },

  async exportData(): Promise<ArrayBuffer> {
    if (!initialized) throw new Error('Memory engine not initialized');
    return await storageModule.exportData();
  },

  async importData(data: ArrayBuffer): Promise<void> {
    if (!initialized) throw new Error('Memory engine not initialized');
    return await storageModule.importData(data);
  },

  async getStats() {
    if (!initialized) throw new Error('Memory engine not initialized');
    const baseStats = storageModule.getStats();
    const cryptoState = cryptoModule.getState();
    
    const stats: { node_count: number; crypto_state?: CryptoState; ann_stats?: ANNIndexStats; sync_stats?: SyncStats } = {
      node_count: baseStats.node_count,
      crypto_state: cryptoState,
    };
    
    if (annIndex) {
      stats.ann_stats = annIndex.getStats();
    }
    
    // Sync stats commented out until OpLogService is implemented
    // if (opLogService && syncEnabled) {
    //   stats.sync_stats = { syncEnabled };
    // }
    
    return stats;
  },

  // Crypto methods
  async setupEncryption(passphrase: string): Promise<void> {
    return await cryptoModule.setupEncryption(passphrase);
  },

  async setupSessionEncryption(sessionData: string): Promise<void> {
    return await cryptoModule.setupSessionEncryption(sessionData);
  },

  async unlock(passphrase: string): Promise<void> {
    return await cryptoModule.unlock(passphrase);
  },

  async lock(): Promise<void> {
    cryptoModule.lock();
  },

  async rotateKey(newPassphrase: string): Promise<void> {
    // Implementation would go here - delegating to crypto module
    throw new Error('Key rotation not yet implemented');
  },

  async getCryptoState(): Promise<CryptoState> {
    return cryptoModule.getState();
  },

  async getWrappedDEK(): Promise<WrappedDEK | null> {
    return cryptoModule.getWrappedDEK();
  },

  async loadWrappedDEK(wrappedDEK: WrappedDEK): Promise<void> {
    cryptoModule.loadWrappedDEK(wrappedDEK);
  },

  // ANN Index methods
  async rebuildANNIndex(): Promise<void> {
    if (!annIndex) throw new Error('ANN index not initialized');
    // Implementation would rebuild index from storage
    console.log('ANN index rebuild triggered');
  },

  async getANNStats(): Promise<ANNIndexStats> {
    if (!annIndex) throw new Error('ANN index not initialized');
    return annIndex.getStats();
  },

  // Sync methods (simplified until OpLogService is implemented)
  async enableSync(supabaseUrl: string, supabaseKey: string, userId: string): Promise<void> {
    // opLogService = new OpLogService(supabaseUrl, supabaseKey, userId);
    syncEnabled = true;
    console.log('Sync enabled (placeholder)');
  },

  async disableSync(): Promise<void> {
    // opLogService = null;
    syncEnabled = false;
    console.log('Sync disabled');
  },

  async triggerSync(): Promise<void> {
    if (!syncEnabled) throw new Error('Sync not enabled');
    // Implementation would trigger sync operations
    console.log('Sync triggered (placeholder)');
  },

  async getSyncStats(): Promise<SyncStats> {
    return {
      syncEnabled: syncEnabled
    };
  },

  async setSyncEnabled(enabled: boolean): Promise<void> {
    syncEnabled = enabled;
  }
};
