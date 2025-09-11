// Lock/Unlock Functionality Tests
// Tests for encryption lock/unlock operations

import { localEngineClient } from '../../localEngineClient';

export async function testLockUnlock(): Promise<void> {
  console.log('Testing lock/unlock functionality...');
  
  try {
    const testPassphrase = 'test-passphrase-123';
    
    await ensureEncryptionReady(testPassphrase);
    await testLockFunctionality();
    await testUnlockFunctionality(testPassphrase);
    await testWrongPassphrase();
    await unlockForCleanup(testPassphrase);
    
    console.log('🎉 Lock/unlock test passed!');
  } catch (error) {
    console.error('❌ Lock/unlock test failed:', error);
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

async function testLockFunctionality(): Promise<void> {
  await localEngineClient.lock();
  console.log('✅ Encryption locked');
  
  const cryptoState = await localEngineClient.getCryptoState();
  if (!cryptoState.isLocked) {
    throw new Error('Encryption should be locked');
  }
}

async function testUnlockFunctionality(passphrase: string): Promise<void> {
  await localEngineClient.unlock(passphrase);
  console.log('✅ Encryption unlocked');
  
  const cryptoState = await localEngineClient.getCryptoState();
  if (cryptoState.isLocked) {
    throw new Error('Encryption should be unlocked');
  }
}

async function testWrongPassphrase(): Promise<void> {
  await localEngineClient.lock();
  try {
    await localEngineClient.unlock('wrong-passphrase');
    throw new Error('Should have failed with wrong passphrase');
  } catch (error) {
    if ((error as Error).message.includes('Invalid passphrase')) {
      console.log('✅ Correctly rejected wrong passphrase');
    } else {
      throw error;
    }
  }
}

async function unlockForCleanup(passphrase: string): Promise<void> {
  await localEngineClient.unlock(passphrase);
}