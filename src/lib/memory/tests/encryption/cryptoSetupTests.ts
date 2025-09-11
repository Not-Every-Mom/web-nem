// Encryption Setup Tests
// Tests for encryption setup and initialization

import { localEngineClient } from '../../localEngineClient';

export async function testEncryptionSetup(): Promise<void> {
  console.log('Testing encryption setup...');
  
  try {
    await localEngineClient.init();
    console.log('✅ Engine initialized');
    
    await verifyInitialCryptoState();
    await setupTestEncryption();
    await verifyPostSetupState();
    await verifyWrappedDEK();
    
    console.log('🎉 Encryption setup test passed!');
  } catch (error) {
    console.error('❌ Encryption setup test failed:', error);
    throw error;
  }
}

async function verifyInitialCryptoState(): Promise<void> {
  const cryptoState = await localEngineClient.getCryptoState();
  console.log('Initial crypto state:', cryptoState);
  if (cryptoState.hasWrappedDEK) {
    console.log('⚠️ Warning: Engine already has encryption set up');
  }
}

async function setupTestEncryption(): Promise<void> {
  const testPassphrase = 'test-passphrase-123';
  await localEngineClient.setupEncryption(testPassphrase);
  console.log('✅ Encryption setup completed');
}

async function verifyPostSetupState(): Promise<void> {
  const cryptoState = await localEngineClient.getCryptoState();
  console.log('Post-setup crypto state:', cryptoState);
  
  if (!cryptoState.hasWrappedDEK) {
    throw new Error('Wrapped DEK not found after setup');
  }
  if (cryptoState.isLocked) {
    throw new Error('Encryption should be unlocked after setup');
  }
  if (cryptoState.keyDerivation !== 'pbkdf2') {
    throw new Error('Key derivation should be pbkdf2');
  }
  
  console.log('✅ Crypto state verification passed');
}

async function verifyWrappedDEK(): Promise<void> {
  const wrappedDEK = await localEngineClient.getWrappedDEK();
  if (!wrappedDEK) {
    throw new Error('Should have wrapped DEK after setup');
  }
  console.log('✅ Wrapped DEK retrieved:', wrappedDEK.keyDerivation);
}