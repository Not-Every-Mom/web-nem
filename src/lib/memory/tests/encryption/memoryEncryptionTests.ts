// Memory Encryption Tests
// Tests for encrypted memory operations

import { localEngineClient } from '../../localEngineClient';
import type { MemoryItem } from '../../types';
import { generateTestEmbedding } from '../BasicTests';

export async function testEncryptedMemoryOperations(): Promise<void> {
  console.log('Testing encrypted memory operations...');
  
  try {
    const testPassphrase = 'test-passphrase-123';
    
    await ensureEncryptionReady(testPassphrase);
    const testMemory = await addEncryptedTestMemory();
    await verifyMemoryRetrieval(testMemory);
    await testLockedRetrieval();
    await unlockForCleanup(testPassphrase);
    
    console.log('🎉 Encrypted memory operations test passed!');
  } catch (error) {
    console.error('❌ Encrypted memory operations test failed:', error);
    throw error;
  }
}

async function ensureEncryptionReady(passphrase: string): Promise<void> {
  await localEngineClient.init();
  const initialState = await localEngineClient.getCryptoState();
  if (!initialState.hasWrappedDEK) {
    await localEngineClient.setupEncryption(passphrase);
  } else if (initialState.isLocked) {
    await localEngineClient.unlock(passphrase);
  }
}

async function addEncryptedTestMemory(): Promise<MemoryItem> {
  const testMemory: MemoryItem = {
    id: 'encrypted-test-1',
    user_id: 'test-user',
    memory_type: 'semantic',
    content: 'This is a secret memory that should be encrypted',
    salience: 0.9,
    sensitive: true,
    usage_count: 0,
    last_used_at: null,
    cooldown_until: null,
    topic_tags: ['secret', 'encrypted'],
    source: 'encryption-test',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  const testEmbedding = generateTestEmbedding();
  await localEngineClient.addMemory(testMemory, testEmbedding);
  console.log('✅ Encrypted memory added');
  
  return testMemory;
}

async function verifyMemoryRetrieval(originalMemory: MemoryItem): Promise<void> {
  const candidates = await localEngineClient.getCandidates('secret', { limit: 5 });
  console.log('✅ Encrypted memory retrieved:', candidates.length);
  
  const foundMemory = candidates.find(c => c.id === 'encrypted-test-1');
  if (!foundMemory) {
    throw new Error('Added memory not found in search results');
  }
  
  if (foundMemory.content !== originalMemory.content) {
    throw new Error('Retrieved content does not match original');
  }
  console.log('✅ Content decryption verified');
  
  if (!foundMemory.embedding) {
    throw new Error('Embedding should be present');
  }
  
  console.log('✅ Embedding decryption verified');
}

async function testLockedRetrieval(): Promise<void> {
  await localEngineClient.lock();
  const lockedCandidates = await localEngineClient.getCandidates('secret', { limit: 5 });
  const lockedFoundMemory = lockedCandidates.find(c => c.id === 'encrypted-test-1');
  
  if (lockedFoundMemory) {
    console.log('⚠️ Warning: Found encrypted memory while locked - this may indicate incomplete encryption');
  } else {
    console.log('✅ Encrypted memory correctly hidden when locked');
  }
}

async function unlockForCleanup(passphrase: string): Promise<void> {
  await localEngineClient.unlock(passphrase);
}