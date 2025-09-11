// Implementation: cryptoWorkerFacade.impl.ts
// Thin implementation that delegates to existing cryptoOperations and cryptoSetup modules.
// Keeps the same public class shape so consumers don't need to change imports.

import { CryptoOperations } from './cryptoOperations';
import { CryptoSetup } from './cryptoSetup';
import type { CryptoState, WrappedDEK } from './types';

export class CryptoWorkerModule {
  private cryptoSetup = new CryptoSetup();

  // Crypto operations
  async generateDEK(): Promise<CryptoKey> {
    return CryptoOperations.generateDEK();
  }

  async wrapDEK(dek: CryptoKey, kek: CryptoKey) {
    return CryptoOperations.wrapDEK(dek, kek);
  }

  async unwrapDEK(wrappedKey: ArrayBuffer, kek: CryptoKey, iv: ArrayBuffer) {
    return CryptoOperations.unwrapDEK(wrappedKey, kek, iv);
  }

  async encrypt(data: ArrayBuffer, key: CryptoKey) {
    return CryptoOperations.encrypt(data, key);
  }

  async decrypt(encryptedData: ArrayBuffer, key: CryptoKey, iv: ArrayBuffer) {
    return CryptoOperations.decrypt(encryptedData, key, iv);
  }

  // Setup delegation
  async setupEncryption(passphrase: string): Promise<void> {
    return this.cryptoSetup.setupEncryption(passphrase);
  }

  async setupSessionEncryption(sessionData: string): Promise<void> {
    return this.cryptoSetup.setupSessionEncryption(sessionData);
  }

  async unlock(passphrase: string): Promise<void> {
    return this.cryptoSetup.unlock(passphrase);
  }

  lock(): void {
    this.cryptoSetup.lock();
  }

  getState(): CryptoState {
    return this.cryptoSetup.getState();
  }

  getWrappedDEK(): WrappedDEK | null {
    return this.cryptoSetup.getWrappedDEK();
  }

  loadWrappedDEK(wrappedDEK: WrappedDEK): void {
    this.cryptoSetup.loadWrappedDEK(wrappedDEK);
  }
}

export * from './types';
