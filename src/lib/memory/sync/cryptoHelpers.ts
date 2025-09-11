// Crypto Helper Functions for Encrypted Snapshot System
// Provides cryptographic operations for snapshot encryption/decryption

import { EncryptedSnapshot, EncryptedSnapshotPayload } from './types';

export class SnapshotCryptoHelpers {
  static async encryptData(data: ArrayBuffer, key: CryptoKey, iv: Uint8Array): Promise<ArrayBuffer> {
    return await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      key,
      data
    );
  }

  static async decryptData(encryptedData: ArrayBuffer, key: CryptoKey, iv: Uint8Array): Promise<ArrayBuffer> {
    return await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      key,
      encryptedData
    );
  }

  static async deriveSignatureKey(encryptionKey: CryptoKey, salt: Uint8Array): Promise<CryptoKey> {
    const keyMaterial = await crypto.subtle.exportKey('raw', encryptionKey);
    const importedKey = await crypto.subtle.importKey(
      'raw',
      keyMaterial,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as BufferSource,
        iterations: 10000,
        hash: 'SHA-256'
      },
      importedKey,
      {
        name: 'HMAC',
        hash: 'SHA-256'
      },
      false,
      ['sign', 'verify']
    );
  }

  static async calculateIntegrityHash(
    memoryData: ArrayBuffer,
    annIndexData: ArrayBuffer | null,
    annMetadata: ArrayBuffer | null,
    wrappedDEK: ArrayBuffer
  ): Promise<ArrayBuffer> {
    const integrityData = new Uint8Array([
      ...new Uint8Array(memoryData),
      ...(annIndexData ? new Uint8Array(annIndexData) : []),
      ...(annMetadata ? new Uint8Array(annMetadata) : []),
      ...new Uint8Array(wrappedDEK)
    ]);
    return await crypto.subtle.digest('SHA-256', integrityData);
  }

  static async verifyIntegrity(
    decryptedPayload: { memories: ArrayBuffer; annIndex: ArrayBuffer | null; annMetadata: ArrayBuffer | null },
    payload: EncryptedSnapshotPayload
  ): Promise<void> {
    const integrityData = new Uint8Array([
      ...new Uint8Array(decryptedPayload.memories),
      ...(decryptedPayload.annIndex ? new Uint8Array(decryptedPayload.annIndex) : []),
      ...(decryptedPayload.annMetadata ? new Uint8Array(decryptedPayload.annMetadata) : []),
      ...new Uint8Array(payload.wrapped_dek)
    ]);
    const calculatedHash = await crypto.subtle.digest('SHA-256', integrityData);

    if (!this.compareArrayBuffers(calculatedHash, payload.integrity_hash)) {
      throw new Error('Snapshot integrity verification failed');
    }
  }

  static async signSnapshot(
    snapshot: EncryptedSnapshot,
    encryptionKey: CryptoKey,
    salt: Uint8Array
  ): Promise<void> {
    const signatureKey = await this.deriveSignatureKey(encryptionKey, salt);
    const snapshotForSigning = this.serializeForSigning(snapshot);
    const signature = await crypto.subtle.sign('HMAC', signatureKey, snapshotForSigning);
    snapshot.signature = signature;
  }

  static async verifySignature(
    snapshot: EncryptedSnapshot,
    decryptionKey: CryptoKey,
    salt: Uint8Array
  ): Promise<boolean> {
    const signatureKey = await this.deriveSignatureKey(decryptionKey, salt);
    const snapshotForSigning = this.serializeForSigning(snapshot);
    return await crypto.subtle.verify('HMAC', signatureKey, snapshot.signature, snapshotForSigning);
  }

  private static serializeForSigning(snapshot: EncryptedSnapshot): ArrayBuffer {
    const data = {
      header: snapshot.header,
      payload: {
        ...snapshot.payload,
        memories: Array.from(new Uint8Array(snapshot.payload.memories)),
        ann_index: snapshot.payload.ann_index ? Array.from(new Uint8Array(snapshot.payload.ann_index)) : null,
        ann_metadata: snapshot.payload.ann_metadata ? Array.from(new Uint8Array(snapshot.payload.ann_metadata)) : null,
        wrapped_dek: Array.from(new Uint8Array(snapshot.payload.wrapped_dek)),
        integrity_hash: Array.from(new Uint8Array(snapshot.payload.integrity_hash))
      }
    };
    return new TextEncoder().encode(JSON.stringify(data)).buffer;
  }

  private static compareArrayBuffers(a: ArrayBuffer, b: ArrayBuffer): boolean {
    if (a.byteLength !== b.byteLength) return false;
    const viewA = new Uint8Array(a);
    const viewB = new Uint8Array(b);
    for (let i = 0; i < viewA.length; i++) {
      if (viewA[i] !== viewB[i]) return false;
    }
    return true;
  }
}