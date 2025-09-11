// Unit tests for snapshotBuilder helper
// Lightweight checks that the built snapshot has the expected structure.

import { buildSnapshot } from '../../sync/snapshotBuilder';

export async function testSnapshotBuilder(): Promise<void> {
  console.log('Running testSnapshotBuilder...');

  try {
    const userInfo = { user_id: 'test-user', device_id: '' };
    const deviceId = 'device-1234';
    const timestamp = new Date().toISOString();
    const encryptionContext = {
      salt: crypto.getRandomValues(new Uint8Array(16)),
      iv: crypto.getRandomValues(new Uint8Array(12))
    };
    const memoryBuffer = new TextEncoder().encode('memory-bytes').buffer;
    const annIndexBuffer = new TextEncoder().encode('ann-bytes').buffer;
    const annMetaBuffer = new TextEncoder().encode('ann-meta').buffer;
    const encryptedPayload = {
      memoryEncrypted: memoryBuffer,
      annIndexEncrypted: annIndexBuffer,
      annMetaEncrypted: annMetaBuffer
    };
    const wrappedDEK = new Uint8Array([1,2,3,4]).buffer;
    const integrityHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('hash').buffer);

    const snapshot = buildSnapshot(
      userInfo,
      deviceId,
      timestamp,
      encryptionContext,
      encryptedPayload,
      wrappedDEK,
      integrityHash
    );

    if (!snapshot.header) throw new Error('Missing header');
    if (!snapshot.payload) throw new Error('Missing payload');

    if (snapshot.header.user_id !== userInfo.user_id) {
      throw new Error('user_id mismatch in header');
    }
    if (snapshot.header.device_id !== deviceId) {
      throw new Error('device_id mismatch in header');
    }
    if (snapshot.payload.memories.byteLength === 0) {
      throw new Error('memories payload empty');
    }
    if (!(snapshot.payload.wrapped_dek instanceof ArrayBuffer)) {
      throw new Error('wrapped_dek not ArrayBuffer');
    }

    console.log('✅ testSnapshotBuilder passed');
  } catch (err) {
    console.error('❌ testSnapshotBuilder failed:', err);
    throw err;
  }
}
