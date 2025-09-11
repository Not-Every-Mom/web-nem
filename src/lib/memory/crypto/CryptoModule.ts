// Main CryptoModule class with high-level encryption management

import { WrappedDEK, CryptoState } from './types';
import { CoreCrypto } from './core';
import { DataEncryption } from './dataUtils';

export class CryptoModule {
  private state: CryptoState = {
    isLocked: true,
    hasWrappedDEK: false,
    keyDerivation: null,
    dataEncryptionKey: null
  };
  
  private wrappedDEK: WrappedDEK | null = null;

  // Delegate core crypto operations
  async generateDEK(): Promise<CryptoKey> {
    return CoreCrypto.generateDEK();
  }

  async deriveKEKFromPassphrase(passphrase: string, salt?: ArrayBuffer): Promise<{ kek: CryptoKey; salt: ArrayBuffer }> {
    return CoreCrypto.deriveKEKFromPassphrase(passphrase, salt);
  }

  async deriveKEKFromSession(sessionData: string, salt?: ArrayBuffer): Promise<{ kek: CryptoKey; salt: ArrayBuffer }> {
    return CoreCrypto.deriveKEKFromSession(sessionData, salt);
  }

  async wrapDEK(dek: CryptoKey, kek: CryptoKey): Promise<{ wrappedKey: ArrayBuffer; iv: ArrayBuffer }> {
    return CoreCrypto.wrapDEK(dek, kek);
  }

  async unwrapDEK(wrappedKey: ArrayBuffer, kek: CryptoKey, iv: ArrayBuffer): Promise<CryptoKey> {
    return CoreCrypto.unwrapDEK(wrappedKey, kek, iv);
  }

  async encrypt(data: ArrayBuffer, key: CryptoKey): Promise<{ encrypted: ArrayBuffer; iv: ArrayBuffer }> {
    return CoreCrypto.encrypt(data, key);
  }

  async decrypt(encryptedData: ArrayBuffer, key: CryptoKey, iv: ArrayBuffer): Promise<ArrayBuffer> {
    return CoreCrypto.decrypt(encryptedData, key, iv);
  }

  // High-level API methods
  async setupEncryption(passphrase: string): Promise<void> {
    try {
      const dek = await this.generateDEK();
      const { kek, salt } = await this.deriveKEKFromPassphrase(passphrase);
      const { wrappedKey, iv } = await this.wrapDEK(dek, kek);
      
      this.wrappedDEK = {
        wrappedKey,
        salt,
        iv,
        keyDerivation: 'pbkdf2',
        iterations: 100000
      };
      
      this.updateStateAfterSetup(dek, 'pbkdf2');
      console.log('Encryption setup complete with passphrase-derived KEK');
    } catch (error) {
      console.error('Failed to setup encryption:', error);
      throw new Error('Failed to setup encryption: ' + (error as Error).message);
    }
  }

  async setupSessionEncryption(sessionData: string): Promise<void> {
    try {
      const dek = await this.generateDEK();
      const { kek, salt } = await this.deriveKEKFromSession(sessionData);
      const { wrappedKey, iv } = await this.wrapDEK(dek, kek);
      
      this.wrappedDEK = {
        wrappedKey,
        salt,
        iv,
        keyDerivation: 'session',
        iterations: 10000
      };
      
      this.updateStateAfterSetup(dek, 'session');
      console.log('Encryption setup complete with session-derived KEK');
    } catch (error) {
      console.error('Failed to setup session encryption:', error);
      throw new Error('Failed to setup session encryption: ' + (error as Error).message);
    }
  }

  async unlock(passphrase: string): Promise<void> {
    if (!this.wrappedDEK) {
      throw new Error('No wrapped DEK found. Setup encryption first.');
    }
    
    try {
      const kek = await this.deriveKEK(passphrase);
      const dek = await this.unwrapDEK(this.wrappedDEK.wrappedKey, kek, this.wrappedDEK.iv);
      this.state.dataEncryptionKey = dek;
      this.state.isLocked = false;
      console.log('CryptoModule unlocked.');
    } catch (error) {
      console.error('Failed to unlock CryptoModule:', error);
      this.state.dataEncryptionKey = null;
      this.state.isLocked = true;
      throw new Error('Failed to unlock: ' + (error as Error).message);
    }
  }

  lock(): void {
    this.state.isLocked = true;
    this.state.dataEncryptionKey = null;
    console.log('CryptoModule locked.');
  }

  async rotateKey(newPassphrase: string): Promise<void> {
    if (this.state.isLocked || !this.state.dataEncryptionKey) {
      throw new Error('CryptoModule is locked. Unlock first to rotate key.');
    }
    
    try {
      const { kek: newKek, salt: newSalt } = await this.deriveKEKFromPassphrase(newPassphrase);
      const { wrappedKey: newWrappedKey, iv: newIv } = await this.wrapDEK(this.state.dataEncryptionKey, newKek);
      
      this.wrappedDEK = {
        wrappedKey: newWrappedKey,
        salt: newSalt,
        iv: newIv,
        keyDerivation: 'pbkdf2',
        iterations: 100000
      };
      
      console.log('Encryption key rotated successfully.');
    } catch (error) {
      console.error('Failed to rotate key:', error);
      throw new Error('Failed to rotate key: ' + (error as Error).message);
    }
  }

  async encryptContent(content: string): Promise<{ encrypted: ArrayBuffer; iv: ArrayBuffer }> {
    this.ensureUnlocked('Cannot encrypt content.');
    return DataEncryption.encryptContent(content, this.state.dataEncryptionKey!);
  }

  async decryptContent(encryptedData: ArrayBuffer, iv: ArrayBuffer): Promise<string> {
    this.ensureUnlocked('Cannot decrypt content.');
    return DataEncryption.decryptContent(encryptedData, this.state.dataEncryptionKey!, iv);
  }

  async encryptEmbedding(embedding: Float32Array): Promise<{ encrypted: ArrayBuffer; iv: ArrayBuffer }> {
    this.ensureUnlocked('Cannot encrypt embedding.');
    return DataEncryption.encryptEmbedding(embedding, this.state.dataEncryptionKey!);
  }

  async decryptEmbedding(encryptedData: ArrayBuffer, iv: ArrayBuffer): Promise<Float32Array> {
    this.ensureUnlocked('Cannot decrypt embedding.');
    return DataEncryption.decryptEmbedding(encryptedData, this.state.dataEncryptionKey!, iv);
  }

  loadWrappedDEK(wrappedDEK: WrappedDEK): void {
    this.wrappedDEK = wrappedDEK;
    this.state.hasWrappedDEK = true;
    this.state.keyDerivation = wrappedDEK.keyDerivation;
    this.state.isLocked = true; // Always load as locked, requires explicit unlock
    console.log('Wrapped DEK loaded. CryptoModule is now locked, awaiting unlock.');
  }

  getState(): CryptoState {
    return { ...this.state };
  }

  // Private helper methods
  private updateStateAfterSetup(dek: CryptoKey, keyDerivation: 'pbkdf2' | 'session'): void {
    this.state.dataEncryptionKey = dek;
    this.state.hasWrappedDEK = true;
    this.state.keyDerivation = keyDerivation;
    this.state.isLocked = false;
  }

  private async deriveKEK(passphrase: string): Promise<CryptoKey> {
    if (!this.wrappedDEK) {
      throw new Error('No wrapped DEK available');
    }

    if (this.wrappedDEK.keyDerivation === 'pbkdf2') {
      const { kek } = await this.deriveKEKFromPassphrase(passphrase, this.wrappedDEK.salt);
      return kek;
    } else if (this.wrappedDEK.keyDerivation === 'session') {
      const { kek } = await this.deriveKEKFromSession(passphrase, this.wrappedDEK.salt);
      return kek;
    } else {
      throw new Error('Unknown key derivation method.');
    }
  }

  private ensureUnlocked(errorMsg: string): void {
    if (this.state.isLocked || !this.state.dataEncryptionKey) {
      throw new Error(`CryptoModule is locked. ${errorMsg}`);
    }
  }
}