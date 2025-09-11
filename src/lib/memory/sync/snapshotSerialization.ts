import { EncryptedSnapshot, EncryptedSnapshotHeader, EncryptedSnapshotPayload } from './encryptedSnapshot';

const MAGIC_BYTES = new Uint8Array([0x4B, 0x4D, 0x45, 0x4D]); // "KMEM"

export class SnapshotSerializer {
  static serialize(snapshot: EncryptedSnapshot): ArrayBuffer {
    // Simple binary serialization format
    // [MAGIC][HEADER_SIZE][HEADER][PAYLOAD][SIGNATURE]
    const headerJson = JSON.stringify(snapshot.header);
    const headerBytes = new TextEncoder().encode(headerJson);
    const headerSize = headerBytes.length;

    const payloadJson = JSON.stringify({
      memories: Array.from(new Uint8Array(snapshot.payload.memories)),
      ann_index: snapshot.payload.ann_index ? Array.from(new Uint8Array(snapshot.payload.ann_index)) : null,
      ann_metadata: snapshot.payload.ann_metadata ? Array.from(new Uint8Array(snapshot.payload.ann_metadata)) : null,
      wrapped_dek: Array.from(new Uint8Array(snapshot.payload.wrapped_dek)),
      timestamp: snapshot.payload.timestamp,
      integrity_hash: Array.from(new Uint8Array(snapshot.payload.integrity_hash))
    });
    const payloadBytes = new TextEncoder().encode(payloadJson);
    const payloadSize = payloadBytes.length;

    // Combine all parts
    const result = new Uint8Array(
      MAGIC_BYTES.length + 
      4 + headerBytes.length + 
      4 + payloadBytes.length + 
      snapshot.signature.byteLength
    );

    let offset = 0;
    result.set(MAGIC_BYTES, offset); offset += MAGIC_BYTES.length;
    result.set(new Uint8Array(new Uint32Array([headerSize]).buffer), offset); offset += 4;
    result.set(headerBytes, offset); offset += headerBytes.length;
    result.set(new Uint8Array(new Uint32Array([payloadSize]).buffer), offset); offset += 4;
    result.set(payloadBytes, offset); offset += payloadBytes.length;
    result.set(new Uint8Array(snapshot.signature), offset);

    return result.buffer;
  }

  static deserialize(data: ArrayBuffer): EncryptedSnapshot {
    const view = new Uint8Array(data);
    let offset = 0;

    // Verify magic bytes
    const magic = view.slice(offset, offset + MAGIC_BYTES.length);
    if (!SnapshotSerializer.compareUint8Arrays(magic, MAGIC_BYTES)) {
      throw new Error('Invalid snapshot format: magic bytes mismatch');
    }
    offset += MAGIC_BYTES.length;

    // Read header
    const headerSize = new DataView(view.buffer, offset, 4).getUint32(0, true);
    offset += 4;
    const headerBytes = view.slice(offset, offset + headerSize);
    const header = JSON.parse(new TextDecoder().decode(headerBytes));
    offset += headerSize;

    // Read payload
    const payloadSize = new DataView(view.buffer, offset, 4).getUint32(0, true);
    offset += 4;
    const payloadBytes = view.slice(offset, offset + payloadSize);
    const payloadData = JSON.parse(new TextDecoder().decode(payloadBytes));
    offset += payloadSize;

    // Convert arrays back to ArrayBuffers
    const payload: EncryptedSnapshotPayload = {
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