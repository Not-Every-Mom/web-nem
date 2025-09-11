// Helper module: payloadEncrypter.ts
// Responsible for encrypting and decrypting the payload portions of an EncryptedSnapshot

import { EncryptedSnapshot } from './types';
import { SnapshotCryptoHelpers } from './cryptoHelpers';

export interface EncryptedPayload {
  memoryEncrypted: ArrayBuffer;
  annIndexEncrypted: ArrayBuffer | null;
  annMetaEncrypted: ArrayBuffer | null;
}

export interface DecryptedPayload {
  memories: ArrayBuffer;
  annIndex: ArrayBuffer | null;
  annMetadata: ArrayBuffer | null;
}

export async function encryptPayload(
  memoryData: ArrayBuffer,
  annIndexData: ArrayBuffer | null,
  annMetadata: ArrayBuffer | null,
  encryptionKey: CryptoKey,
  iv: Uint8Array
): Promise<EncryptedPayload> {
  const memoryEncrypted = await SnapshotCryptoHelpers.encryptData(memoryData, encryptionKey, iv);
  const annIndexEncrypted = annIndexData
    ? await SnapshotCryptoHelpers.encryptData(annIndexData, encryptionKey, iv)
    : null;
  const annMetaEncrypted = annMetadata
    ? await SnapshotCryptoHelpers.encryptData(annMetadata, encryptionKey, iv)
    : null;

  return { memoryEncrypted, annIndexEncrypted, annMetaEncrypted };
}

export async function decryptPayload(
  snapshot: EncryptedSnapshot,
  decryptionKey: CryptoKey
): Promise<DecryptedPayload> {
  const iv = new Uint8Array(snapshot.header.encryption_meta.iv);
  const memories = await SnapshotCryptoHelpers.decryptData(snapshot.payload.memories, decryptionKey, iv);
  const annIndex = snapshot.payload.ann_index
    ? await SnapshotCryptoHelpers.decryptData(snapshot.payload.ann_index, decryptionKey, iv)
    : null;
  const annMetadata = snapshot.payload.ann_metadata
    ? await SnapshotCryptoHelpers.decryptData(snapshot.payload.ann_metadata, decryptionKey, iv)
    : null;

  return { memories, annIndex, annMetadata };
}
