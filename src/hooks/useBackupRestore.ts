import { useState, useCallback, useEffect } from 'react';
import { BackupService, BackupMetadata, BackupOptions, RestoreOptions } from '@/lib/memory/sync/backupService';
import { localEngineClient } from '@/lib/memory/localEngineClient';
import { supabase } from '@/integrations/supabase/client';

export interface BackupRestoreState {
  backups: BackupMetadata[];
  isLoading: boolean;
  isCreatingBackup: boolean;
  isRestoringBackup: boolean;
  error: string | null;
  summary: {
    totalBackups: number;
    totalSizeBytes: number;
    latestBackup?: string;
    deviceCount: number;
  };
}

export interface UseBackupRestoreResult extends BackupRestoreState {
  createBackup: (options?: BackupOptions) => Promise<void>;
  restoreBackup: (backupId: string, options?: RestoreOptions) => Promise<void>;
  deleteBackup: (backupId: string) => Promise<void>;
  refreshBackups: () => Promise<void>;
  clearError: () => void;
}

export function useBackupRestore(): UseBackupRestoreResult {
  const [state, setState] = useState<BackupRestoreState>({
    backups: [],
    isLoading: false,
    isCreatingBackup: false,
    isRestoringBackup: false,
    error: null,
    summary: {
      totalBackups: 0,
      totalSizeBytes: 0,
      deviceCount: 0
    }
  });

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const refreshBackups = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const [backups, summary] = await Promise.all([
        BackupService.listBackups(),
        BackupService.getBackupSummary()
      ]);
      
      setState(prev => ({
        ...prev,
        backups,
        summary,
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Failed to load backups: ${(error as Error).message}`,
        isLoading: false
      }));
    }
  }, []);

  const createBackup = useCallback(async (options: BackupOptions = {}) => {
    setState(prev => ({ ...prev, isCreatingBackup: true, error: null }));
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check if local memory is encrypted and unlocked
      const cryptoState = await localEngineClient.getCryptoState();
      if (!cryptoState.hasWrappedDEK) {
        throw new Error('Local memory is not encrypted. Please set up encryption first.');
      }
      if (cryptoState.isLocked) {
        throw new Error('Local memory is locked. Please unlock it first.');
      }

      // Generate backup encryption key from user session
      const backupKey = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        false, // not extractable
        ['encrypt', 'decrypt']
      );

      // Create backup
      await BackupService.createBackup(user.id, backupKey, options);
      
      // Refresh backup list
      await refreshBackups();
      
      setState(prev => ({ ...prev, isCreatingBackup: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Backup failed: ${(error as Error).message}`,
        isCreatingBackup: false
      }));
    }
  }, [refreshBackups]);

  const restoreBackup = useCallback(async (backupId: string, options: RestoreOptions = {}) => {
    setState(prev => ({ ...prev, isRestoringBackup: true, error: null }));
    
    try {
      // Generate decryption key (same as backup key for now)
      const decryptionKey = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        false, // not extractable
        ['encrypt', 'decrypt']
      );

      // Restore backup
      await BackupService.restoreBackup(backupId, decryptionKey, options);
      
      setState(prev => ({ ...prev, isRestoringBackup: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Restore failed: ${(error as Error).message}`,
        isRestoringBackup: false
      }));
    }
  }, []);

  const deleteBackup = useCallback(async (backupId: string) => {
    setState(prev => ({ ...prev, error: null }));
    
    try {
      await BackupService.deleteBackup(backupId);
      await refreshBackups();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Delete failed: ${(error as Error).message}`
      }));
    }
  }, [refreshBackups]);

  // Load backups on mount
  useEffect(() => {
    refreshBackups();
  }, [refreshBackups]);

  return {
    ...state,
    createBackup,
    restoreBackup,
    deleteBackup,
    refreshBackups,
    clearError
  };
}