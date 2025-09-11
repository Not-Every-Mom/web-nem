// Implementation: encryptedSnapshotManager.impl.ts
// Orchestrates snapshot creation and parsing while delegating work to helpers.

import { EncryptedSnapshot, ParsedSnapshotResult } from './types';
import { SnapshotCryptoHelpers } from './cryptoHelpers';
import { SnapshotSerializer, SnapshotUtils } from './serialization';
import { encryptPayload, decryptPayload } from './payloadEncrypter';
import { buildSnapshot } from './snapshotBuilder';

export class EncryptedSnapshotManager {
  private static readonly VERSION = '1.0.0';

  /**
   * Create an encrypted snapshot of the local memory engine
   */
  static async createSnapshot(
    memoryData: ArrayBuffer,
    annIndexData: ArrayBuffer | null,
    annMetadata: ArrayBuffer | null,
    wrappedDEK: ArrayBuffer,
    userInfo: { user_id: string; device_id: string },
    encryptionKey: CryptoKey
  ): Promise<ArrayBuffer> {
    try {
      const timestamp = new Date().toISOString();
      const deviceId = userInfo.device_id || await SnapshotUtils.generateDeviceId();

      const encryptionContext = SnapshotUtils.generateEncryptionContext();
      const encryptedPayload = await encryptPayload(
        memoryData, annIndexData, annMetadata, encryptionKey, encryptionContext.iv
      );

      const integrityHash = await SnapshotCryptoHelpers.calculateIntegrityHash(
        memoryData, annIndexData, annMetadata, wrappedDEK
      );

      const snapshot = buildSnapshot(
        userInfo, deviceId, timestamp, encryptionContext,
        encryptedPayload, wrappedDEK, integrityHash
      );

      await SnapshotCryptoHelpers.signSnapshot(snapshot, encryptionKey, encryptionContext.salt);
      return SnapshotSerializer.serialize(snapshot);
    } catch (error) {
      console.error('Failed to create encrypted snapshot:', error);
      throw new Error('Snapshot creation failed: ' + (error as Error).message);
    }
  }

  /**
   * Parse and decrypt an encrypted snapshot
   */
  static async parseSnapshot(
    snapshotData: ArrayBuffer,
    decryptionKey: CryptoKey
  ): Promise<ParsedSnapshotResult> {
    try {
      const snapshot = SnapshotSerializer.deserialize(snapshotData);

      const salt = new Uint8Array(snapshot.header.encryption_meta.salt);
      const isValid = await SnapshotCryptoHelpers.verifySignature(snapshot, decryptionKey, salt);

      if (!isValid) {
        throw new Error('Snapshot signature verification failed');
      }

      const decryptedPayload = await decryptPayload(snapshot, decryptionKey);
      await SnapshotCryptoHelpers.verifyIntegrity(decryptedPayload, snapshot.payload);

      return {
        header: snapshot.header,
        memories: decryptedPayload.memories,
        annIndex: decryptedPayload.annIndex,
        annMetadata: decryptedPayload.annMetadata,
        wrappedDEK: snapshot.payload.wrapped_dek
      };
    } catch (error) {
      console.error('Failed to parse encrypted snapshot:', error);
      throw new Error('Snapshot parsing failed: ' + (error as Error).message);
    }
  }
}
