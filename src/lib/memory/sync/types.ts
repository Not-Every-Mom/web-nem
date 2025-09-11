// Encrypted Snapshot System Types
// Provides type definitions for secure backup/restore functionality

export interface EncryptedSnapshotHeader {
  version: string;
  created_at: string;
  user_id: string;
  device_id: string;
  memory_count: number;
  ann_indexed: number;
  encryption_meta: {
    algorithm: 'AES-GCM';
    key_derivation: 'pbkdf2' | 'session';
    iterations?: number;
    salt: ArrayBuffer;
    iv: ArrayBuffer;
  };
}

export interface EncryptedSnapshotPayload {
  memories: ArrayBuffer; // Encrypted memory items
  ann_index: ArrayBuffer | null; // Encrypted ANN index data
  ann_metadata: ArrayBuffer | null; // Encrypted ANN mappings
  wrapped_dek: ArrayBuffer; // Wrapped data encryption key
  timestamp: string;
  integrity_hash: ArrayBuffer; // SHA-256 hash for verification
}

export interface EncryptedSnapshot {
  header: EncryptedSnapshotHeader;
  payload: EncryptedSnapshotPayload;
  signature: ArrayBuffer; // HMAC signature for authenticity
}

export interface ParsedSnapshotResult {
  header: EncryptedSnapshotHeader;
  memories: ArrayBuffer;
  annIndex: ArrayBuffer | null;
  annMetadata: ArrayBuffer | null;
  wrappedDEK: ArrayBuffer;
}