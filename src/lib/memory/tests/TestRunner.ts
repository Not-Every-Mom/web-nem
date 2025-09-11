import { testLocalEngine, testLegacyAPI } from './BasicTests';
import { 
  testEncryptionSetup, 
  testLockUnlock, 
  testEncryptedMemoryOperations, 
  testSessionEncryption 
} from './EncryptionTests';
import { 
  testKeyRotation, 
  testLegacyAPIWithEncryption 
} from './AdvancedEncryptionTests';

// Combined test function
export async function testFullIntegration(): Promise<void> {
  console.log('🚀 Starting full integration test...');
  
  await testLocalEngine();
  await testLegacyAPI();
  
  console.log('🎊 Full integration test completed successfully!');
}

// Combined encryption test function
export async function testFullEncryption(): Promise<void> {
  console.log('🔐 Starting full encryption test suite...');
  
  try {
    await testEncryptionSetup();
    await testLockUnlock();
    await testEncryptedMemoryOperations();
    await testSessionEncryption();
    await testKeyRotation();
    await testLegacyAPIWithEncryption();
    
    console.log('🎊🔐 Full encryption test suite completed successfully!');
  } catch (error) {
    console.error('❌ Encryption test suite failed:', error);
    throw error;
  }
}

// Test everything
export async function testEverything(): Promise<void> {
  console.log('🚀🔐 Starting complete test suite...');
  
  await testFullIntegration();
  await testFullEncryption();
  
  console.log('🎊🎉 Complete test suite finished successfully!');
}

// Export for easy testing in browser console
if (typeof window !== 'undefined') {
  const w = window as unknown as {
    testLocalEngine: typeof testLocalEngine;
    testLegacyAPI: typeof testLegacyAPI;
    testFullIntegration: typeof testFullIntegration;
    testEncryptionSetup: typeof testEncryptionSetup;
    testLockUnlock: typeof testLockUnlock;
    testEncryptedMemoryOperations: typeof testEncryptedMemoryOperations;
    testSessionEncryption: typeof testSessionEncryption;
    testKeyRotation: typeof testKeyRotation;
    testLegacyAPIWithEncryption: typeof testLegacyAPIWithEncryption;
    testFullEncryption: typeof testFullEncryption;
    testEverything: typeof testEverything;
  };
  w.testLocalEngine = testLocalEngine;
  w.testLegacyAPI = testLegacyAPI;
  w.testFullIntegration = testFullIntegration;
  w.testEncryptionSetup = testEncryptionSetup;
  w.testLockUnlock = testLockUnlock;
  w.testEncryptedMemoryOperations = testEncryptedMemoryOperations;
  w.testSessionEncryption = testSessionEncryption;
  w.testKeyRotation = testKeyRotation;
  w.testLegacyAPIWithEncryption = testLegacyAPIWithEncryption;
  w.testFullEncryption = testFullEncryption;
  w.testEverything = testEverything;
}