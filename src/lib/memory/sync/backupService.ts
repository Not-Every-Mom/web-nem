// Backup/Restore Service for Encrypted Memory Snapshots
// Provides secure cloud backup functionality using Supabase Storage

import { supabase } from "@/integrations/supabase/client";
import { BackupCreator } from "./BackupCreator";
import { BackupRestorer } from "./BackupRestorer";

// Note: The database tables need to be created by running the migration:
// supabase/migrations/20240108000000_create_memory_backups_storage.sql

export interface BackupMetadata {
  id: string;
  user_id: string;
  file_path: string;
  device_id: string;
  backup_name?: string;
  memory_count: number;
  ann_indexed: number;
  file_size_bytes: number;
  encryption_method: string;
  created_at: string;
  updated_at: string;
}

export interface BackupOptions {
  name?: string;
  description?: string;
  includeANNIndex?: boolean;
}

export interface RestoreOptions {
  replaceExisting?: boolean;
  rebuildANNIndex?: boolean;
}

export class BackupService {
  private static readonly BUCKET_NAME = 'memory-backups';
  
  /**
   * Create an encrypted backup of local memory data
   */
  static async createBackup(
    userId: string,
    encryptionKey: CryptoKey,
    options: BackupOptions = {}
  ): Promise<BackupMetadata> {
    return BackupCreator.createBackup(userId, encryptionKey, options);
  }

  /**
   * Restore from an encrypted backup
   */
  static async restoreBackup(
    backupId: string,
    decryptionKey: CryptoKey,
    options: RestoreOptions = {}
  ): Promise<void> {
    return BackupRestorer.restoreBackup(backupId, decryptionKey, options);
  }

  /**
   * List all backups for the current user
   */
  static async listBackups(): Promise<BackupMetadata[]> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('memory_backup_metadata')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to list backups: ${error.message}`);
      }

      return (data || []) as BackupMetadata[];
    } catch (error) {
      console.error('Failed to list backups:', error);
      return [];
    }
  }

  /**
   * Delete a backup
   */
  static async deleteBackup(backupId: string): Promise<void> {
    try {
      // Get backup metadata
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: metadata, error: metaError } = await (supabase as any)
        .from('memory_backup_metadata')
        .select('file_path')
        .eq('id', backupId)
        .single();

      if (metaError || !metadata) {
        throw new Error('Backup not found or access denied');
      }

      const backupMeta = metadata as { file_path: string };

      // Delete file from storage
      const { error: deleteError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([backupMeta.file_path]);

      if (deleteError) {
        console.warn('Failed to delete backup file:', deleteError);
        // Continue with metadata deletion even if file deletion fails
      }

      // Delete metadata
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: metaDeleteError } = await (supabase as any)
        .from('memory_backup_metadata')
        .delete()
        .eq('id', backupId);

      if (metaDeleteError) {
        throw new Error(`Failed to delete backup metadata: ${metaDeleteError.message}`);
      }

      console.log('Backup deleted successfully');
    } catch (error) {
      console.error('Backup deletion failed:', error);
      throw new Error(`Delete failed: ${(error as Error).message}`);
    }
  }

  /**
   * Get backup summary statistics
   */
  static async getBackupSummary(): Promise<{
    totalBackups: number;
    totalSizeBytes: number;
    latestBackup?: string;
    deviceCount: number;
  }> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('memory_backup_summary')
        .select('*')
        .single();

      if (error || !data) {
        return {
          totalBackups: 0,
          totalSizeBytes: 0,
          deviceCount: 0
        };
      }

      const summary = data as {
        total_backups: number;
        total_size_bytes: number;
        latest_backup?: string;
        device_count: number;
      };

      return {
        totalBackups: summary.total_backups,
        totalSizeBytes: summary.total_size_bytes,
        latestBackup: summary.latest_backup,
        deviceCount: summary.device_count
      };
    } catch (error) {
      console.error('Failed to get backup summary:', error);
      return {
        totalBackups: 0,
        totalSizeBytes: 0,
        deviceCount: 0
      };
    }
  }

  // Helper methods
  private static async getDeviceId(): Promise<string> {
    try {
      // Try to get existing device ID from localStorage
      const stored = localStorage.getItem('kmem.device_id');
      if (stored) return stored;
    } catch (e) {
      // localStorage not available
    }

    // Generate new device ID
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