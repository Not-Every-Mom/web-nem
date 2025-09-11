import { supabase } from "@/integrations/supabase/client";
import { EncryptedSnapshotManager } from "./encryptedSnapshot";
import { localEngineClient } from "../localEngineClient";
import type { BackupMetadata, RestoreOptions } from "./backupService";

export class BackupRestorer {
  private static readonly BUCKET_NAME = 'memory-backups';

  static async restoreBackup(
    backupId: string,
    decryptionKey: CryptoKey,
    options: RestoreOptions = {}
  ): Promise<void> {
    try {
      const backupMetadata = await this.getBackupMetadata(backupId);
      const snapshotData = await this.downloadBackupFile(backupMetadata);
      const decryptedSnapshot = await this.decryptSnapshot(snapshotData, decryptionKey);
      
      await this.initializeLocalEngine();
      await this.clearExistingDataIfRequested(options);
      await this.importMemoryData(decryptedSnapshot);
      await this.restoreANNIndex(decryptedSnapshot, options);
      await this.restoreEncryptionKey(decryptedSnapshot);

      console.log(`Backup restored successfully: ${backupMetadata.backup_name} (${backupMetadata.memory_count} memories)`);
    } catch (error) {
      console.error('Backup restore failed:', error);
      throw new Error(`Restore failed: ${(error as Error).message}`);
    }
  }

  private static async getBackupMetadata(backupId: string): Promise<BackupMetadata> {
    // Using any type since memory_backup_metadata table may not be in generated types
    const { data: metadata, error: metaError } = await (supabase as any)
      .from('memory_backup_metadata')
      .select('*')
      .eq('id', backupId)
      .single();

    if (metaError || !metadata) {
      throw new Error('Backup not found or access denied');
    }

    return metadata as BackupMetadata;
  }

  private static async downloadBackupFile(metadata: BackupMetadata): Promise<ArrayBuffer> {
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(this.BUCKET_NAME)
      .download(metadata.file_path);

    if (downloadError || !fileData) {
      throw new Error(`Download failed: ${downloadError?.message || 'File not found'}`);
    }

    return await fileData.arrayBuffer();
  }

  private static async decryptSnapshot(
    snapshotData: ArrayBuffer,
    decryptionKey: CryptoKey
  ) {
    return await EncryptedSnapshotManager.parseSnapshot(snapshotData, decryptionKey);
  }

  private static async initializeLocalEngine(): Promise<void> {
    await localEngineClient.init();
  }

  private static async clearExistingDataIfRequested(options: RestoreOptions): Promise<void> {
    if (options.replaceExisting !== false) {
      // TODO: Add clearData method to local engine client
      console.log('Replacing existing local memory data');
    }
  }

  private static async importMemoryData(decryptedSnapshot: any): Promise<void> {
    await localEngineClient.importData(decryptedSnapshot.memories);
  }

  private static async restoreANNIndex(
    decryptedSnapshot: any,
    options: RestoreOptions
  ): Promise<void> {
    if (!decryptedSnapshot.annIndex || !decryptedSnapshot.annMetadata) {
      return;
    }

    try {
      const opfsRoot = await navigator.storage.getDirectory();
      
      await this.saveANNIndexFile(opfsRoot, decryptedSnapshot.annIndex);
      await this.saveANNMetadataFile(opfsRoot, decryptedSnapshot.annMetadata);
      
      console.log('ANN index data restored');
      
      if (options.rebuildANNIndex) {
        await this.rebuildANNIndex();
      }
    } catch (error) {
      console.warn('Failed to restore ANN index:', error);
    }
  }

  private static async saveANNIndexFile(
    opfsRoot: FileSystemDirectoryHandle,
    annIndexData: ArrayBuffer
  ): Promise<void> {
    const indexFile = await opfsRoot.getFileHandle('memory_ann_index.idx', { create: true });
    const indexWriter = await indexFile.createWritable();
    await indexWriter.write(annIndexData);
    await indexWriter.close();
  }

  private static async saveANNMetadataFile(
    opfsRoot: FileSystemDirectoryHandle,
    annMetadata: ArrayBuffer
  ): Promise<void> {
    const metaFile = await opfsRoot.getFileHandle('memory_ann_index.meta', { create: true });
    const metaWriter = await metaFile.createWritable();
    await metaWriter.write(annMetadata);
    await metaWriter.close();
  }

  private static async rebuildANNIndex(): Promise<void> {
    await localEngineClient.rebuildANNIndex();
    console.log('ANN index rebuilt');
  }

  private static async restoreEncryptionKey(decryptedSnapshot: any): Promise<void> {
    try {
      const wrappedDEKJson = new TextDecoder().decode(decryptedSnapshot.wrappedDEK);
      const wrappedDEK = JSON.parse(wrappedDEKJson);
      await localEngineClient.loadWrappedDEK(wrappedDEK);
      console.log('Encryption key restored');
    } catch (error) {
      console.warn('Failed to restore encryption key:', error);
    }
  }
}