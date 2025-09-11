// Session Encryption Tests
// Tests for session-based encryption and key derivation

import { localEngineClient } from '../../localEngineClient';
import type { MemoryItem } from '../../types';
import { generateTestEmbedding } from '../BasicTests';

export async function testSessionEncryption(): Promise<void> {
  console.log('Testing session encryption...');
  
  try {
    await testSessionEncryptionFlow();
    await testSessionDecryptionFlow();
    
    console.log('🎉 Session encryption test passed!');
  } catch (error) {
    console.error('❌ Session encryption test failed:', error);
    throw error;
  }
}

async function testSessionEncryptionFlow(): Promise<void> {
  const testPassphrase = 'test-passphrase-456';
  
  await localEngineClient.init();
  await localEngineClient.setupEncryption(testPassphrase);
  
  const testMemory: MemoryItem = {
    id: 'session-test-1',
    user_id: 'test-user',
    memory_type: 'semantic',
    content: 'This memory uses session encryption',
    salience: 0.8,
    sensitive: true,
    usage_count: 0,
    last_used_at: null,
    cooldown_until: null,
    topic_tags: ['session', 'encryption'],
    source: 'session-test',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  const testEmbedding = generateTestEmbedding();
  await localEngineClient.addMemory(testMemory, testEmbedding);
  
  console.log('✅ Memory added with session encryption');
}

async function testSessionDecryptionFlow(): Promise<void> {
  const candidates = await localEngineClient.getCandidates('session', { limit: 5 });
  const foundMemory = candidates.find(c => c.id === 'session-test-1');
  
  if (!foundMemory) {
    throw new Error('Session encrypted memory not found');
  }
  
  if (foundMemory.content !== 'This memory uses session encryption') {
    throw new Error('Session encrypted content does not match');
  }
  
  console.log('✅ Session encrypted memory retrieved and decrypted');
}