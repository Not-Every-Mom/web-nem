// Local Memory Engine Test Suite
// Re-exports from modular test files

// Import all test functions from modular files
export { testLocalEngine, testLegacyAPI, generateTestEmbedding } from './tests/BasicTests';
export {
  testEncryptionSetup,
  testLockUnlock,
  testEncryptedMemoryOperations,
  testSessionEncryption
} from './tests/EncryptionTests';
export {
  testKeyRotation,
  testLegacyAPIWithEncryption
} from './tests/AdvancedEncryptionTests';
export {
  testFullIntegration,
  testFullEncryption,
  testEverything
} from './tests/TestRunner';

// Legacy compatibility - maintain the same window exports
if (typeof window !== 'undefined') {
  import('./tests/TestRunner').then(({ testFullIntegration, testFullEncryption, testEverything }) => {
    import('./tests/BasicTests').then(({ testLocalEngine, testLegacyAPI }) => {
      import('./tests/EncryptionTests').then(({
        testEncryptionSetup,
        testLockUnlock,
        testEncryptedMemoryOperations,
        testSessionEncryption
      }) => {
        import('./tests/AdvancedEncryptionTests').then(({
          testKeyRotation,
          testLegacyAPIWithEncryption
        }) => {
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
        });
      });
    });
  });
}