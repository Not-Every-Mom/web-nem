import type { LocalMemoryItem } from './types';

// ANN Index Management
export interface ANNIndexConfig {
  dimension: number;
  maxElements: number;
  efConstruction: number;
  M: number;
  randomSeed: number;
}

export interface ANNIndexStats {
  currentElements: number;
  maxElements: number;
  dimension: number;
  isIndexed: boolean;
  lastRebuild?: string;
}

interface HNSWSearchResult {
  neighbors: number[];
  distances: number[];
}

interface HNSWIndex {
  initIndex(maxElements: number, efConstruction: number, M: number, randomSeed: number): void;
  addPoint(vector: Float32Array, label: number): void;
  searchKnn(vector: Float32Array, k: number): HNSWSearchResult;
  serialize(): ArrayBuffer;
  deserialize(data: ArrayBuffer): void;
}

export class ANNIndex {
  private index: HNSWIndex | null = null;
  private config: ANNIndexConfig;
  private itemIdMap: Map<number, string> = new Map(); // index -> item.id
  private idItemMap: Map<string, number> = new Map(); // item.id -> index
  private currentElements = 0;
  private isInitialized = false;
  private hnswClass: new (space: string, dimension: number) => HNSWIndex | null = null;

  constructor(config: ANNIndexConfig) {
    this.config = config;
  }

  private async loadHNSW(): Promise<void> {
    if (this.hnswClass) return;
    
    try {
      // Dynamic import to handle module loading
      const hnswModule = await import('hnswlib-wasm');
      // Try different export patterns for hnswlib-wasm
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const moduleAny = hnswModule as unknown as Record<string, any>;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.hnswClass = moduleAny.HierarchicalNSW || moduleAny.default || hnswModule as any;
      console.log('HNSW module loaded successfully');
    } catch (error) {
      console.error('Failed to load hnswlib-wasm:', error);
      throw new Error('Failed to load hnswlib-wasm: ' + (error as Error).message);
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      await this.loadHNSW();
      
      // Initialize hnswlib index
      this.index = new this.hnswClass!('cosine', this.config.dimension);
      this.index!.initIndex(this.config.maxElements, this.config.efConstruction, this.config.M, this.config.randomSeed);
      this.isInitialized = true;
      console.log('ANN index initialized with config:', this.config);
    } catch (error) {
      console.error('Failed to initialize ANN index:', error);
      throw new Error('Failed to initialize ANN index: ' + (error as Error).message);
    }
  }

  async addVector(itemId: string, embedding: Float32Array): Promise<void> {
    if (!this.isInitialized || !this.index) {
      await this.initialize();
    }

    if (this.currentElements >= this.config.maxElements) {
      console.warn('ANN index at capacity, skipping item:', itemId);
      return;
    }

    try {
      const indexId = this.currentElements;
      
      // Add to index
      this.index!.addPoint(embedding, indexId);
      
      // Update mappings
      this.itemIdMap.set(indexId, itemId);
      this.idItemMap.set(itemId, indexId);
      this.currentElements++;
      
      console.log(`Added vector for item ${itemId} at index ${indexId}`);
    } catch (error) {
      console.error('Failed to add vector to ANN index:', error);
      throw new Error('Failed to add vector: ' + (error as Error).message);
    }
  }

  async searchKNN(queryEmbedding: Float32Array, k: number): Promise<Array<{ itemId: string; distance: number }>> {
    if (!this.isInitialized || this.currentElements === 0 || !this.index) {
      return [];
    }

    try {
      const result = this.index.searchKnn(queryEmbedding, Math.min(k, this.currentElements));
      
      return result.neighbors.map((indexId: number, i: number) => ({
        itemId: this.itemIdMap.get(indexId) || '',
        distance: result.distances[i]
      })).filter((item: { itemId: string; distance: number }) => item.itemId !== '');
    } catch (error) {
      console.error('Failed to search ANN index:', error);
      return [];
    }
  }

  async removeVector(itemId: string): Promise<void> {
    // Note: hnswlib doesn't support efficient deletion
    // For now, we mark as deleted and rebuild periodically
    const indexId = this.idItemMap.get(itemId);
    if (indexId !== undefined) {
      this.itemIdMap.delete(indexId);
      this.idItemMap.delete(itemId);
      console.log(`Marked item ${itemId} for removal from ANN index`);
    }
  }

  async rebuildIndex(items: Map<string, LocalMemoryItem>): Promise<void> {
    console.log('Rebuilding ANN index...');
    
    // Reset mappings
    this.itemIdMap.clear();
    this.idItemMap.clear();
    this.currentElements = 0;
    
    // Re-initialize index
    if (this.isInitialized && this.hnswClass) {
      this.index = new this.hnswClass('cosine', this.config.dimension);
      this.index!.initIndex(this.config.maxElements, this.config.efConstruction, this.config.M, this.config.randomSeed);
    }
    
    // Add all valid embeddings
    for (const [itemId, item] of items.entries()) {
      if (item.embedding && item.embedding.length === this.config.dimension) {
        await this.addVector(itemId, item.embedding);
      }
    }
    
    console.log(`ANN index rebuilt with ${this.currentElements} vectors`);
  }

  getStats(): ANNIndexStats {
    return {
      currentElements: this.currentElements,
      maxElements: this.config.maxElements,
      dimension: this.config.dimension,
      isIndexed: this.isInitialized && this.currentElements > 0
    };
  }

  async saveToOPFS(fileName: string): Promise<void> {
    if (!this.isInitialized || this.currentElements === 0 || !this.index) {
      return;
    }

    try {
      // Get OPFS root
      const opfsRoot = await navigator.storage.getDirectory();
      
      // Serialize index data
      const indexData = this.index.serialize();
      const mappingData = {
        itemIdMap: Array.from(this.itemIdMap.entries()),
        idItemMap: Array.from(this.idItemMap.entries()),
        currentElements: this.currentElements,
        config: this.config
      };
      
      // Save index file
      const indexFile = await opfsRoot.getFileHandle(`${fileName}.idx`, { create: true });
      const indexWriter = await indexFile.createWritable();
      await indexWriter.write(indexData);
      await indexWriter.close();
      
      // Save mapping file
      const mappingFile = await opfsRoot.getFileHandle(`${fileName}.meta`, { create: true });
      const mappingWriter = await mappingFile.createWritable();
      await mappingWriter.write(new TextEncoder().encode(JSON.stringify(mappingData)));
      await mappingWriter.close();
      
      console.log('ANN index saved to OPFS:', fileName);
    } catch (error) {
      console.error('Failed to save ANN index to OPFS:', error);
      throw new Error('Failed to save ANN index: ' + (error as Error).message);
    }
  }

  async loadFromOPFS(fileName: string): Promise<boolean> {
    try {
      // Get OPFS root
      const opfsRoot = await navigator.storage.getDirectory();
      
      // Load index file
      const indexFile = await opfsRoot.getFileHandle(`${fileName}.idx`);
      const indexFileContent = await indexFile.getFile();
      const indexData = await indexFileContent.arrayBuffer();
      
      // Load mapping file
      const mappingFile = await opfsRoot.getFileHandle(`${fileName}.meta`);
      const mappingFileContent = await mappingFile.getFile();
      const mappingText = await mappingFileContent.text();
      const mappingData = JSON.parse(mappingText);
      
      // Restore configuration
      this.config = mappingData.config;
      this.currentElements = mappingData.currentElements;
      
      // Initialize and deserialize index
      await this.loadHNSW();
      this.index = new this.hnswClass!('cosine', this.config.dimension);
      this.index!.deserialize(indexData);
      this.isInitialized = true;
      
      // Restore mappings
      this.itemIdMap.clear();
      this.idItemMap.clear();
      for (const [key, value] of mappingData.itemIdMap) {
        this.itemIdMap.set(key, value);
      }
      for (const [key, value] of mappingData.idItemMap) {
        this.idItemMap.set(key, value);
      }
      
      console.log('ANN index loaded from OPFS:', fileName);
      return true;
    } catch (error) {
      console.log('No existing ANN index found in OPFS:', fileName);
      return false;
    }
  }
}