import { supabase } from "@/integrations/supabase/client";
import { EncryptedSnapshotManager } from "./encryptedSnapshot";
import { localEngineClient } from "../localEngineClient";
import type { BackupMetadata, BackupOptions } from "./backupService";

interface MemoryStats {
  node_count: number;
  ann_stats?: {
    isIndexed: boolean;
    currentElements: number;
  };
}

export class BackupCreator {
  private static readonly BUCKET_NAME = 'memory-backups';

  static async createBackup(
    userId: string,
    encryptionKey: CryptoKey,
    options: BackupOptions = {}
  ): Promise<BackupMetadata> {
    try {
      const memoryData = await this.prepareMemoryData();
      const { annIndexData, annMetadata } = await this.prepareANNData(memoryData.stats, options);
      const wrappedDEKBuffer = await this.prepareEncryptionKey();
      const deviceId = await this.getDeviceId();
      
      const snapshotData = await this.createEncryptedSnapshot(
        memoryData.exportedData,
        annIndexData,
        annMetadata,
        wrappedDEKBuffer,
        userId,
        deviceId,
        encryptionKey
      );

      const uploadResult = await this.uploadSnapshot(snapshotData, userId, options);
      const metadata = await this.storeMetadata(
        uploadResult,
        memoryData.stats,
        snapshotData,
        deviceId
      );

      console.log(`Backup created successfully: ${uploadResult.backupName} (${this.formatBytes(snapshotData.byteLength)})`);
      return metadata;
    } catch (error) {
      console.error('Backup creation failed:', error);
      throw new Error(`Backup failed: ${(error as Error).message}`);
    }
  }

  private static async prepareMemoryData() {
    await localEngineClient.init();
    
    const stats = await localEngineClient.getStats();
    if (stats.node_count === 0) {
      throw new Error('No memories to backup');
    }

    const exportedData = await localEngineClient.exportData();
    return { stats, exportedData };
  }

  private static async prepareANNData(stats: MemoryStats, options: BackupOptions) {
    let annIndexData: ArrayBuffer | null = null;
    let annMetadata: ArrayBuffer | null = null;
    
    if (options.includeANNIndex !== false && stats.ann_stats?.isIndexed) {
      try {
        const opfsRoot = await navigator.storage.getDirectory();
        
        try {
          const indexFile = await opfsRoot.getFileHandle('memory_ann_index.idx');
          const indexFileContent = await indexFile.getFile();
          annIndexData = await indexFileContent.arrayBuffer();
        } catch (e) {
          console.log('No ANN index file found');
        }
        
        try {
          const metaFile = await opfsRoot.getFileHandle('memory_ann_index.meta');
          const metaFileContent = await metaFile.getFile();
          annMetadata = await metaFileContent.arrayBuffer();
        } catch (e) {
          console.log('No ANN metadata file found');
        }
      } catch (error) {
        console.warn('Failed to include ANN index in backup:', error);
      }
    }

    return { annIndexData, annMetadata };
  }

  private static async prepareEncryptionKey(): Promise<ArrayBuffer> {
    const wrappedDEK = await localEngineClient.getWrappedDEK();
    if (!wrappedDEK) {
      throw new Error('No encryption key available for backup');
    }
    return new TextEncoder().encode(JSON.stringify(wrappedDEK)).buffer;
  }

  private static async createEncryptedSnapshot(
    memoryData: ArrayBuffer,
    annIndexData: ArrayBuffer | null,
    annMetadata: ArrayBuffer | null,
    wrappedDEKBuffer: ArrayBuffer,
    userId: string,
    deviceId: string,
    encryptionKey: CryptoKey
  ) {
    return await EncryptedSnapshotManager.createSnapshot(
      memoryData,
      annIndexData,
      annMetadata,
      wrappedDEKBuffer,
      { user_id: userId, device_id: deviceId },
      encryptionKey
    );
  }

  private static async uploadSnapshot(
    snapshotData: ArrayBuffer,
    userId: string,
    options: BackupOptions
  ) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = options.name || `backup-${timestamp}`;
    const fileName = `${backupName}.kmem`;
    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(this.BUCKET_NAME)
      .upload(filePath, snapshotData, {
        contentType: 'application/x-kmem',
        duplex: 'half'
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    return { backupName, fileName, filePath };
  }

  private static async storeMetadata(
    uploadResult: { backupName: string; filePath: string },
    stats: MemoryStats & { user_id?: string },
    snapshotData: ArrayBuffer,
    deviceId: string
  ): Promise<BackupMetadata> {
    // Using any type since memory_backup_metadata table may not be in generated types
    const { data: metadata, error: metaError } = await (supabase as any)
      .from('memory_backup_metadata')
      .insert({
        user_id: stats.user_id,
        file_path: uploadResult.filePath,
        device_id: deviceId,
        backup_name: uploadResult.backupName,
        memory_count: stats.node_count,
        ann_indexed: stats.ann_stats?.currentElements || 0,
        file_size_bytes: snapshotData.byteLength,
        encryption_method: 'AES-GCM'
      })
      .select()
      .single();

    if (metaError) {
      // Try to cleanup uploaded file
      await supabase.storage.from(this.BUCKET_NAME).remove([uploadResult.filePath]);
      throw new Error(`Metadata storage failed: ${metaError.message}`);
    }

    return metadata as BackupMetadata;
  }

  private static async getDeviceId(): Promise<string> {
    try {
      const stored = localStorage.getItem('kmem.device_id');
      if (stored) return stored;
    } catch (e) {
      // localStorage not available
    }

    const randomBytes = crypto.getRandomValues(new Uint8Array(8));
    const deviceId = Array.from(randomBytes, b => b.toString(16).padStart(2, '0')).join('');
    
    try {
      localStorage.setItem('kmem.device_id', deviceId);
    } catch (e) {
      // localStorage not available, that's ok
    }
    
    return deviceId;
  }

  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}