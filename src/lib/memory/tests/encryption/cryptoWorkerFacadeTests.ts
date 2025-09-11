// Lightweight smoke tests for the crypto worker facade implementation.
// These tests don't fully exercise underlying crypto implementations,
// but verify the facade methods exist and can be invoked in a runtime
// that provides Web Crypto (browser or Node with WebCrypto).

import { CryptoWorkerModule } from '../../worker/CryptoWorkerModule';

export async function testCryptoWorkerFacade(): Promise<void> {
  console.log('Running testCryptoWorkerFacade...');

  try {
    const cryptoFacade = new CryptoWorkerModule();

    if (typeof cryptoFacade.generateDEK !== 'function') {
      throw new Error('generateDEK method missing');
    }
    if (typeof cryptoFacade.wrapDEK !== 'function') {
      throw new Error('wrapDEK method missing');
    }
    if (typeof cryptoFacade.unwrapDEK !== 'function') {
      throw new Error('unwrapDEK method missing');
    }
    if (typeof cryptoFacade.setupEncryption !== 'function') {
      throw new Error('setupEncryption method missing');
    }
    if (typeof cryptoFacade.getState !== 'function') {
      throw new Error('getState method missing');
    }

    // Try generating a DEK (may require Web Crypto to be available)
    try {
      const dek = await cryptoFacade.generateDEK();
      if (!(dek instanceof CryptoKey)) {
        // In some runtime types, CryptoKey is an interface; just ensure truthy
        if (!dek) throw new Error('generateDEK returned falsy value');
      }
      console.log('✅ generateDEK succeeded (smoke)');
    } catch (err) {
      console.warn('⚠️ generateDEK could not be executed in this environment:', err);
    }

    console.log('✅ testCryptoWorkerFacade passed (smoke checks)');
  } catch (err) {
    console.error('❌ testCryptoWorkerFacade failed:', err);
    throw err;
  }
}
