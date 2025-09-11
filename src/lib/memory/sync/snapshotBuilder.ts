// Helper module: snapshotBuilder.ts
// Responsible for constructing EncryptedSnapshot objects from inputs.

import { EncryptedSnapshot } from './types';
import { SnapshotUtils } from './serialization';

export function buildSnapshot(
  userInfo: { user_id: string; device_id: string },
  deviceId: string,
  timestamp: string,
  encryptionContext: { salt: Uint8Array; iv: Uint8Array },
  encryptedPayload: { memoryEncrypted: ArrayBuffer; annIndexEncrypted: ArrayBuffer | null; annMetaEncrypted: ArrayBuffer | null },
  wrappedDEK: ArrayBuffer,
  integrityHash: ArrayBuffer
): EncryptedSnapshot {
  return {
    header: {
      version: '1.0.0',
      created_at: timestamp,
      user_id: userInfo.user_id,
      device_id: deviceId,
      memory_count: 0,
      ann_indexed: 0,
      encryption_meta: {
        algorithm: 'AES-GCM',
        key_derivation: 'pbkdf2',
        salt: encryptionContext.salt.buffer as ArrayBuffer,
        iv: encryptionContext.iv.buffer as ArrayBuffer
      }
    },
    payload: {
      memories: encryptedPayload.memoryEncrypted,
      ann_index: encryptedPayload.annIndexEncrypted,
      ann_metadata: encryptedPayload.annMetaEncrypted,
      wrapped_dek: wrappedDEK,
      timestamp,
      integrity_hash: integrityHash
    },
    signature: new ArrayBuffer(0)
  };
}
