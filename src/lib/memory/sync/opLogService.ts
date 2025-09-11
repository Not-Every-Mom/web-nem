// Op-Log Synchronization Service for real-time memory sync
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { MemoryItem } from '../types';

// Extended MemoryItem for local storage with additional fields
interface LocalMemoryItem extends MemoryItem {
  embedding?: Float32Array;
  deleted_at?: string;
  local_rev?: string;
  encryption_meta?: {
    encrypted: boolean;
    contentIv?: ArrayBuffer;
    embeddingIv?: ArrayBuffer;
    version: number;
  };
  // For encrypted storage
  encrypted_content?: ArrayBuffer;
  encrypted_embedding?: ArrayBuffer;
}

// Sync operation types based on our database design
export type SyncOperationType = 'ADD' | 'UPDATE' | 'DELETE';

// Operation metadata structure
interface OperationMetadata {
  created_by: string;
  app_version: string;
  operation_source?: string;
  conflict_resolution?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface SyncOperation {
  id: string;
  user_id: string;
  device_id: string;
  sequence_number: number;
  operation_type: SyncOperationType;
  memory_id: string;
  client_timestamp: string;
  server_timestamp?: string;
  encrypted_payload: string;
  payload_iv: string;
  checksum: string;
  vector_clock: Record<string, number>;
  operation_metadata: OperationMetadata;
}

export interface OperationPayload {
  // For ADD operations
  memory_item?: LocalMemoryItem;
  embedding?: Float32Array;
  
  // For UPDATE operations
  changes?: Partial<LocalMemoryItem>;
  
  // For DELETE operations
  deletion_reason?: string;
  
  // Metadata
  client_timestamp: string;
  operation_metadata: OperationMetadata;
}

export interface SyncDevice {
  id: string;
  user_id: string;
  device_id: string;
  device_name?: string;
  last_sequence_number: number;
  last_sync_at: string;
  sync_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface SyncCursor {
  id: string;
  user_id: string;
  device_id: string;
  remote_device_id: string;
  last_seen_sequence: number;
  updated_at: string;
}

export interface SyncStats {
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

export interface PendingSyncOperation {
  operation: SyncOperation;
  retryCount: number;
  lastAttempt?: string;
}

export class OpLogService {
  private supabase: SupabaseClient;
  private deviceId: string;
  private userId: string | null = null;
  private sequenceNumber: number = 0;
  private vectorClock: Map<string, number> = new Map();
  private uploadQueue: PendingSyncOperation[] = [];
  private isOnline: boolean = navigator.onLine;
  private syncInterval: number | null = null;
  private uploadInProgress: boolean = false;

  constructor(supabaseUrl: string, supabaseKey: string, deviceId: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.deviceId = deviceId;
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.startBackgroundSync();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.stopBackgroundSync();
    });
  }

  async initialize(userId: string): Promise<void> {
    this.userId = userId;
    
    // Register/update device
    await this.registerDevice();
    
    // Load last sequence number
    await this.loadDeviceState();
    
    // Load vector clock state
    await this.loadVectorClock();
    
    // Start background sync if online
    if (this.isOnline) {
      this.startBackgroundSync();
    }
  }

  private async registerDevice(): Promise<void> {
    if (!this.userId) throw new Error('User ID not set');

    const deviceName = this.generateDeviceName();
    
    const { error } = await this.supabase
      .from('memory_sync_devices')
      .upsert({
        user_id: this.userId,
        device_id: this.deviceId,
        device_name: deviceName,
        sync_enabled: true,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to register device:', error);
      throw new Error(`Failed to register device: ${error.message}`);
    }
  }

  private async loadDeviceState(): Promise<void> {
    if (!this.userId) return;

    const { data, error } = await this.supabase
      .from('memory_sync_devices')
      .select('last_sequence_number')
      .eq('user_id', this.userId)
      .eq('device_id', this.deviceId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Failed to load device state:', error);
      return;
    }

    if (data) {
      this.sequenceNumber = data.last_sequence_number || 0;
    }
  }

  private async loadVectorClock(): Promise<void> {
    if (!this.userId) return;

    // Load vector clock from last operations
    const { data, error } = await this.supabase
      .from('memory_sync_operations')
      .select('device_id, sequence_number')
      .eq('user_id', this.userId)
      .order('server_timestamp', { ascending: false })
      .limit(100); // Get recent operations to rebuild vector clock

    if (error) {
      console.error('Failed to load vector clock:', error);
      return;
    }

    if (data) {
      // Rebuild vector clock from recent operations
      this.vectorClock.clear();
      for (const op of data) {
        const current = this.vectorClock.get(op.device_id) || 0;
        this.vectorClock.set(op.device_id, Math.max(current, op.sequence_number));
      }
    }
  }

  async createOperation(
    operationType: SyncOperationType,
    memoryId: string,
    payload: OperationPayload,
    dek: CryptoKey
  ): Promise<void> {
    if (!this.userId) throw new Error('User ID not set');

    // Increment sequence number
    this.sequenceNumber++;
    
    // Update vector clock
    this.vectorClock.set(this.deviceId, this.sequenceNumber);

    // Encrypt payload
    const { encrypted, iv, checksum } = await this.encryptPayload(payload, dek);

    const operation: SyncOperation = {
      id: crypto.randomUUID(),
      user_id: this.userId,
      device_id: this.deviceId,
      sequence_number: this.sequenceNumber,
      operation_type: operationType,
      memory_id: memoryId,
      client_timestamp: new Date().toISOString(),
      encrypted_payload: encrypted,
      payload_iv: iv,
      checksum,
      vector_clock: Object.fromEntries(this.vectorClock),
      operation_metadata: {
        created_by: this.deviceId,
        app_version: '1.0.0' // TODO: Get from build info
      }
    };

    // Add to upload queue
    this.uploadQueue.push({
      operation,
      retryCount: 0
    });

    // Trigger immediate upload if online
    if (this.isOnline && !this.uploadInProgress) {
      this.processUploadQueue();
    }
  }

  private async encryptPayload(
    payload: OperationPayload, 
    dek: CryptoKey
  ): Promise<{ encrypted: string; iv: string; checksum: string }> {
    // Serialize payload
    const payloadBytes = new TextEncoder().encode(JSON.stringify(payload, (key, value) => {
      // Handle Float32Array serialization
      if (value instanceof Float32Array) {
        return {
          __type: 'Float32Array',
          data: Array.from(value)
        };
      }
      return value;
    }));

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12)); // GCM standard IV length

    // Encrypt with AES-GCM
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      dek,
      payloadBytes
    );

    // Generate HMAC for integrity
    const hmacKey = await crypto.subtle.importKey(
      'raw',
      await crypto.subtle.exportKey('raw', dek),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      'HMAC',
      hmacKey,
      encrypted
    );

    return {
      encrypted: this.arrayBufferToBase64(encrypted),
      iv: this.arrayBufferToBase64(iv),
      checksum: this.arrayBufferToBase64(signature)
    };
  }

  private async decryptPayload(
    encrypted: string,
    iv: string,
    checksum: string,
    dek: CryptoKey
  ): Promise<OperationPayload> {
    const encryptedData = this.base64ToArrayBuffer(encrypted);
    const ivData = this.base64ToArrayBuffer(iv);
    const expectedChecksum = this.base64ToArrayBuffer(checksum);

    // Verify HMAC
    const hmacKey = await crypto.subtle.importKey(
      'raw',
      await crypto.subtle.exportKey('raw', dek),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const isValid = await crypto.subtle.verify(
      'HMAC',
      hmacKey,
      expectedChecksum,
      encryptedData
    );

    if (!isValid) {
      throw new Error('Payload integrity check failed');
    }

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivData },
      dek,
      encryptedData
    );

    const payloadText = new TextDecoder().decode(decrypted);
    const payload = JSON.parse(payloadText, (key, value) => {
      // Handle Float32Array deserialization
      if (value && typeof value === 'object' && value.__type === 'Float32Array') {
        return new Float32Array(value.data);
      }
      return value;
    });

    return payload;
  }

  async processUploadQueue(): Promise<void> {
    if (!this.isOnline || this.uploadInProgress || this.uploadQueue.length === 0) {
      return;
    }

    this.uploadInProgress = true;

    try {
      // Process operations in batches
      const batchSize = 10;
      while (this.uploadQueue.length > 0) {
        const batch = this.uploadQueue.splice(0, batchSize);
        
        try {
          // Upload batch
          const operations = batch.map(item => item.operation);
          const { error } = await this.supabase
            .from('memory_sync_operations')
            .insert(operations);

          if (error) {
            // Re-add failed operations to queue with retry count
            for (const item of batch) {
              item.retryCount++;
              item.lastAttempt = new Date().toISOString();
              
              // Only retry up to 3 times
              if (item.retryCount <= 3) {
                this.uploadQueue.push(item);
              } else {
                console.error('Operation failed permanently after 3 retries:', item.operation.id);
              }
            }
            throw error;
          }

          console.log(`Uploaded ${operations.length} sync operations`);
        } catch (error) {
          console.error('Failed to upload batch:', error);
          // Continue with next batch
        }
      }
    } finally {
      this.uploadInProgress = false;
    }
  }

  async downloadAndApplyOperations(
    onApplyOperation: (operation: SyncOperation, payload: OperationPayload) => Promise<void>,
    dek: CryptoKey,
    sinceTimestamp?: string
  ): Promise<number> {
    if (!this.userId) throw new Error('User ID not set');

    const { data, error } = await this.supabase.rpc('get_pending_sync_operations', {
      target_user_id: this.userId,
      target_device_id: this.deviceId,
      since_timestamp: sinceTimestamp || null
    });

    if (error) {
      console.error('Failed to fetch pending operations:', error);
      return 0;
    }

    let appliedCount = 0;
    
    for (const opData of data || []) {
      try {
        // Decrypt payload
        const payload = await this.decryptPayload(
          opData.encrypted_payload,
          opData.payload_iv,
          opData.checksum,
          dek
        );

        // Apply operation
        await onApplyOperation(opData, payload);
        
        // Update cursor
        await this.updateSyncCursor(opData.device_id, opData.sequence_number);
        
        // Update vector clock
        const current = this.vectorClock.get(opData.device_id) || 0;
        this.vectorClock.set(opData.device_id, Math.max(current, opData.sequence_number));
        
        appliedCount++;
      } catch (error) {
        console.error('Failed to apply operation:', opData.id, error);
        // Continue with next operation
      }
    }

    return appliedCount;
  }

  private async updateSyncCursor(remoteDeviceId: string, lastSequence: number): Promise<void> {
    if (!this.userId) return;

    const { error } = await this.supabase.rpc('update_sync_cursor', {
      target_user_id: this.userId,
      target_device_id: this.deviceId,
      remote_device_id: remoteDeviceId,
      last_sequence: lastSequence
    });

    if (error) {
      console.error('Failed to update sync cursor:', error);
    }
  }

  async getSyncStats(): Promise<SyncStats> {
    if (!this.userId) {
      return {
        total_operations: 0,
        active_devices: 0,
        add_operations: 0,
        update_operations: 0,
        delete_operations: 0,
        pending_upload: this.uploadQueue.length
      };
    }

    const { data, error } = await this.supabase
      .from('memory_sync_summary')
      .select('*')
      .eq('user_id', this.userId)
      .single();

    if (error) {
      console.error('Failed to get sync stats:', error);
      return {
        total_operations: 0,
        active_devices: 0,
        add_operations: 0,
        update_operations: 0,
        delete_operations: 0,
        pending_upload: this.uploadQueue.length
      };
    }

    return {
      total_operations: data.total_operations || 0,
      active_devices: data.active_devices || 0,
      latest_operation: data.latest_operation,
      earliest_operation: data.earliest_operation,
      add_operations: data.add_operations || 0,
      update_operations: data.update_operations || 0,
      delete_operations: data.delete_operations || 0,
      pending_upload: this.uploadQueue.length,
      last_sync: new Date().toISOString()
    };
  }

  private startBackgroundSync(): void {
    if (this.syncInterval) return;
    
    // Sync every 30 seconds
    this.syncInterval = window.setInterval(() => {
      if (this.isOnline) {
        this.processUploadQueue();
      }
    }, 30000);
  }

  private stopBackgroundSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  private generateDeviceName(): string {
    const platform = navigator.platform || 'Unknown';
    const userAgent = navigator.userAgent || '';
    
    let browser = 'Unknown Browser';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    
    return `${platform} - ${browser}`;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  async cleanup(): Promise<void> {
    this.stopBackgroundSync();
  }
}