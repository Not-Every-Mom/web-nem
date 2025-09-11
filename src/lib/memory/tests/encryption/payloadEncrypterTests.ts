// Unit tests for payloadEncrypter helper
// These are lightweight functions you can call from the existing TestRunner
// or the browser console. They use the Web Crypto API; run them in an environment
// that provides crypto.subtle (browser or Node with WebCrypto).

import { encryptPayload, decryptPayload } from '../../sync/payloadEncrypter';
import { SnapshotCryptoHelpers } from '../../sync/cryptoHelpers';

export async function testPayloadEncrypter(): Promise<void> {
  console.log('Running testPayloadEncrypter...');

  try {
    // Generate an AES-GCM key for testing
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    // Create sample data
    const memoryData = new TextEncoder().encode('hello-memory').buffer;
    const annIndexData = new TextEncoder().encode('ann-index-bytes').buffer;
    const annMetadata = null;

    // Create an IV for encryptionContext
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt payload
    const encrypted = await encryptPayload(memoryData, annIndexData, annMetadata, key, iv);

    if (!encrypted.memoryEncrypted || encrypted.memoryEncrypted.byteLength === 0) {
      throw new Error('memoryEncrypted missing or empty');
    }
    if (!encrypted.annIndexEncrypted || encrypted.annIndexEncrypted.byteLength === 0) {
      throw new Error('annIndexEncrypted missing or empty');
    }

    console.log('✅ encryptPayload produced encrypted buffers');

    // Decrypt using the helper (via a minimal snapshot shape)
    const fakeSnapshot = {
      header: {
        encryption_meta: {
          iv: iv.buffer
        }
      },
      payload: {
        memories: encrypted.memoryEncrypted,
        ann_index: encrypted.annIndexEncrypted,
        ann_metadata: encrypted.annMetaEncrypted,
        wrapped_dek: new ArrayBuffer(0),
        timestamp: new Date().toISOString(),
        integrity_hash: new ArrayBuffer(0)
      },
      signature: new ArrayBuffer(0)
    } as any;

    const decrypted = await decryptPayload(fakeSnapshot, key);

    const decodedMemory = new TextDecoder().decode(new Uint8Array(decrypted.memories));
    const decodedAnn = new TextDecoder().decode(new Uint8Array(decrypted.annIndex!));

    if (decodedMemory !== 'hello-memory') {
      throw new Error(`Decrypted memory mismatch: ${decodedMemory}`);
    }
    if (decodedAnn !== 'ann-index-bytes') {
      throw new Error(`Decrypted annIndex mismatch: ${decodedAnn}`);
    }

    console.log('✅ decryptPayload verified decrypted contents');

    // Verify integration helpers: sign/verify using SnapshotCryptoHelpers (smoke)
    const integrity = await SnapshotCryptoHelpers.calculateIntegrityHash(memoryData, annIndexData, annMetadata, new ArrayBuffer(0));
    if (!integrity || integrity.byteLength === 0) {
      throw new Error('Integrity hash calculation failed');
    }

    console.log('✅ SnapshotCryptoHelpers.calculateIntegrityHash produced a hash');

    console.log('🎉 testPayloadEncrypter passed');
  } catch (err) {
    console.error('❌ testPayloadEncrypter failed:', err);
    throw err;
  }
}
