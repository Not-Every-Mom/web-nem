import { localEngineClient, LocalMemoryEngine } from '../localEngineClient';
import type { MemoryItem } from '../types';
import { generateTestEmbedding } from './BasicTests';

// Test key rotation
export async function testKeyRotation(): Promise<void> {
  console.log('Testing key rotation...');
  
  try {
    const oldPassphrase = 'old-passphrase-123';
    const newPassphrase = 'new-passphrase-456';
    
    await prepareForKeyRotation(oldPassphrase);
    const testMemory = await addPreRotationTestData();
    await performKeyRotation(newPassphrase);
    await verifyDataAccessAfterRotation(testMemory);
    await verifyNewPassphraseWorks(newPassphrase);
    await verifyOldPassphraseRejected(oldPassphrase, newPassphrase);
    
    console.log('🎉 Key rotation test passed!');
  } catch (error) {
    console.error('❌ Key rotation test failed:', error);
    throw error;
  }
}

async function prepareForKeyRotation(passphrase: string): Promise<void> {
  await localEngineClient.init();
  const initialState = await localEngineClient.getCryptoState();
  if (!initialState.hasWrappedDEK) {
    await localEngineClient.setupEncryption(passphrase);
  } else if (initialState.isLocked) {
    await localEngineClient.unlock(passphrase);
  }
}

async function addPreRotationTestData(): Promise<MemoryItem> {
  const testMemory: MemoryItem = {
    id: 'rotation-test-1',
    user_id: 'test-user',
    memory_type: 'semantic',
    content: 'Data before key rotation',
    salience: 0.8,
    sensitive: false,
    usage_count: 0,
    last_used_at: null,
    cooldown_until: null,
    topic_tags: ['rotation'],
    source: 'rotation-test',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  await localEngineClient.addMemory(testMemory);
  console.log('✅ Test data added before rotation');
  return testMemory;
}

async function performKeyRotation(newPassphrase: string): Promise<void> {
  await localEngineClient.rotateKey(newPassphrase);
  console.log('✅ Key rotation completed');
}

async function verifyDataAccessAfterRotation(originalMemory: MemoryItem): Promise<void> {
  const candidates = await localEngineClient.getCandidates('rotation', { limit: 5 });
  const found = candidates.find(c => c.id === 'rotation-test-1');
  if (!found || found.content !== originalMemory.content) {
    throw new Error('Data not accessible after key rotation');
  }
  console.log('✅ Data accessible after rotation');
}

async function verifyNewPassphraseWorks(newPassphrase: string): Promise<void> {
  await localEngineClient.lock();
  await localEngineClient.unlock(newPassphrase);
  console.log('✅ New passphrase works');
}

async function verifyOldPassphraseRejected(oldPassphrase: string, newPassphrase: string): Promise<void> {
  await localEngineClient.lock();
  try {
    await localEngineClient.unlock(oldPassphrase);
    throw new Error('Old passphrase should no longer work');
  } catch (error) {
    if ((error as Error).message.includes('Invalid passphrase')) {
      console.log('✅ Old passphrase correctly rejected');
    } else {
      throw error;
    }
  }
  
  // Unlock with new passphrase for cleanup
  await localEngineClient.unlock(newPassphrase);
}

// Test encryption with legacy API
export async function testLegacyAPIWithEncryption(): Promise<void> {
  console.log('Testing legacy API with encryption...');
  
  try {
    await initializeLegacyEncryption();
    await addLegacyEncryptedMemory();
    await verifyLegacyEncryptedSearch();
    
    console.log('🎉 Legacy API encryption test passed!');
  } catch (error) {
    console.error('❌ Legacy API encryption test failed:', error);
    throw error;
  }
}

async function initializeLegacyEncryption(): Promise<void> {
  const sessionData = 'legacy-session-token';
  const initResult = await LocalMemoryEngine.init(sessionData);
  console.log('✅ Legacy init with encryption:', initResult);
}

async function addLegacyEncryptedMemory(): Promise<void> {
  await LocalMemoryEngine.addMemory({
    memory_type: 'semantic',
    content: 'Legacy API encrypted content',
    salience: 0.6,
    sensitive: true,
    topic_tags: ['legacy', 'encrypted'],
    source: 'legacy-test',
    embedFromText: false
  });
  console.log('✅ Legacy encrypted memory added');
}

async function verifyLegacyEncryptedSearch(): Promise<void> {
  const dummyEmbedding = generateTestEmbedding();
  const searchResults = await LocalMemoryEngine.searchByEmbedding(dummyEmbedding, 5);
  console.log('✅ Legacy search with encryption completed:', searchResults.results.length);
  
  // Verify we can find the added content
  const foundContent = searchResults.results.find(r => r.content.includes('Legacy API encrypted'));
  if (foundContent) {
    console.log('✅ Legacy encrypted content found in search');
  } else {
    console.log('⚠️ Warning: Legacy encrypted content not found in search results');
  }
}