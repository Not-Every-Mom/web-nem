// Serialization and Deserialization Utilities for Encrypted Snapshots
// Provides binary serialization format for encrypted snapshots

import { EncryptedSnapshot } from './types';

export class SnapshotSerializer {
  private static readonly MAGIC_BYTES = new Uint8Array([0x4B, 0x4D, 0x45, 0x4D]); // "KMEM"

  static serialize(snapshot: EncryptedSnapshot): ArrayBuffer {
    const headerJson = JSON.stringify(snapshot.header);
    const headerBytes = new TextEncoder().encode(headerJson);
    const headerSize = new Uint32Array([headerBytes.length]);

    const payloadJson = JSON.stringify({
      memories: Array.from(new Uint8Array(snapshot.payload.memories)),
      ann_index: snapshot.payload.ann_index ? Array.from(new Uint8Array(snapshot.payload.ann_index)) : null,
      ann_metadata: snapshot.payload.ann_metadata ? Array.from(new Uint8Array(snapshot.payload.ann_metadata)) : null,
      wrapped_dek: Array.from(new Uint8Array(snapshot.payload.wrapped_dek)),
      timestamp: snapshot.payload.timestamp,
      integrity_hash: Array.from(new Uint8Array(snapshot.payload.integrity_hash))
    });
    const payloadBytes = new TextEncoder().encode(payloadJson);
    const payloadSize = new Uint32Array([payloadBytes.length]);

    const result = new Uint8Array(
      this.MAGIC_BYTES.length + 
      4 + headerBytes.length + 
      4 + payloadBytes.length + 
      snapshot.signature.byteLength
    );

    let offset = 0;
    result.set(this.MAGIC_BYTES, offset); offset += this.MAGIC_BYTES.length;
    result.set(new Uint8Array(headerSize.buffer), offset); offset += 4;
    result.set(headerBytes, offset); offset += headerBytes.length;
    result.set(new Uint8Array(payloadSize.buffer), offset); offset += 4;
    result.set(payloadBytes, offset); offset += payloadBytes.length;
    result.set(new Uint8Array(snapshot.signature), offset);

    return result.buffer;
  }

  static deserialize(data: ArrayBuffer): EncryptedSnapshot {
    const view = new Uint8Array(data);
    let offset = 0;

    // Verify magic bytes
    const magic = view.slice(offset, offset + this.MAGIC_BYTES.length);
    if (!this.compareUint8Arrays(magic, this.MAGIC_BYTES)) {
      throw new Error('Invalid snapshot format: magic bytes mismatch');
    }
    offset += this.MAGIC_BYTES.length;

    // Read header
    const headerSize = new Uint32Array(view.buffer.slice(offset, offset + 4))[0];
    offset += 4;
    const headerBytes = view.slice(offset, offset + headerSize);
    const header = JSON.parse(new TextDecoder().decode(headerBytes));
    offset += headerSize;

    // Read payload
    const payloadSize = new Uint32Array(view.buffer.slice(offset, offset + 4))[0];
    offset += 4;
    const payloadBytes = view.slice(offset, offset + payloadSize);
    const payloadData = JSON.parse(new TextDecoder().decode(payloadBytes));
    offset += payloadSize;

    // Convert arrays back to ArrayBuffers
    const payload = {
      memories: new Uint8Array(payloadData.memories).buffer,
      ann_index: payloadData.ann_index ? new Uint8Array(payloadData.ann_index).buffer : null,
      ann_metadata: payloadData.ann_metadata ? new Uint8Array(payloadData.ann_metadata).buffer : null,
      wrapped_dek: new Uint8Array(payloadData.wrapped_dek).buffer,
      timestamp: payloadData.timestamp,
      integrity_hash: new Uint8Array(payloadData.integrity_hash).buffer
    };

    // Read signature
    const signature = view.slice(offset).buffer;

    return { header, payload, signature };
  }

  private static compareUint8Arrays(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
}

export class SnapshotUtils {
  static generateEncryptionContext(): { salt: Uint8Array; iv: Uint8Array } {
    return {
      salt: crypto.getRandomValues(new Uint8Array(16)),
      iv: crypto.getRandomValues(new Uint8Array(12))
    };
  }

  static async generateDeviceId(): Promise<string> {
    const randomBytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(randomBytes, b => b.toString(16).padStart(2, '0')).join('');
  }

  static compareUint8Arrays(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
}