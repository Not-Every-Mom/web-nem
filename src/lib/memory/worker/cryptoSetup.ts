// High-level crypto setup and management
// Provides setup, unlock, and state management functionality

import { CryptoOperations } from './cryptoOperations';
import { CryptoState, WrappedDEK } from './types';

export class CryptoSetup {
  private state: CryptoState = {
    isLocked: true,
    hasWrappedDEK: false,
    keyDerivation: null,
    dataEncryptionKey: null
  };
  
  private wrappedDEK: WrappedDEK | null = null;

  async setupEncryption(passphrase: string): Promise<void> {
    try {
      const dek = await CryptoOperations.generateDEK();
      const { kek, salt } = await CryptoOperations.deriveKEKFromPassphrase(passphrase);
      const { wrappedKey, iv } = await CryptoOperations.wrapDEK(dek, kek);
      
      this.wrappedDEK = {
        wrappedKey,
        salt,
        iv,
        keyDerivation: 'pbkdf2',
        iterations: 100000
      };
      
      this.state.dataEncryptionKey = dek;
      this.state.hasWrappedDEK = true;
      this.state.keyDerivation = 'pbkdf2';
      this.state.isLocked = false;
      
      console.log('Encryption setup complete with passphrase-derived KEK');
    } catch (error) {
      console.error('Failed to setup encryption:', error);
      throw new Error('Failed to setup encryption: ' + (error as Error).message);
    }
  }

  async setupSessionEncryption(sessionData: string): Promise<void> {
    try {
      const dek = await CryptoOperations.generateDEK();
      const { kek, salt } = await CryptoOperations.deriveKEKFromSession(sessionData);
      const { wrappedKey, iv } = await CryptoOperations.wrapDEK(dek, kek);
      
      this.wrappedDEK = {
        wrappedKey,
        salt,
        iv,
        keyDerivation: 'session',
        iterations: 10000
      };
      
      this.state.dataEncryptionKey = dek;
      this.state.hasWrappedDEK = true;
      this.state.keyDerivation = 'session';
      this.state.isLocked = false;
      
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
      let kek: CryptoKey;
      
      if (this.wrappedDEK.keyDerivation === 'pbkdf2') {
        const result = await CryptoOperations.deriveKEKFromPassphrase(
          passphrase, 
          this.wrappedDEK.salt
        );
        kek = result.kek;
      } else if (this.wrappedDEK.keyDerivation === 'session') {
        const result = await CryptoOperations.deriveKEKFromSession(
          passphrase, 
          this.wrappedDEK.salt
        );
        kek = result.kek;
      } else {
        throw new Error('Unknown key derivation method');
      }
      
      const dek = await CryptoOperations.unwrapDEK(
        this.wrappedDEK.wrappedKey, 
        kek, 
        this.wrappedDEK.iv
      );
      
      this.state.dataEncryptionKey = dek;
      this.state.isLocked = false;
      
      console.log('Successfully unlocked encryption');
    } catch (error) {
      console.error('Failed to unlock:', error);
      throw new Error('Invalid passphrase or corrupted key data');
    }
  }

  lock(): void {
    this.state.dataEncryptionKey = null;
    this.state.isLocked = true;
    console.log('Encryption locked');
  }

  getState(): CryptoState {
    return { ...this.state };
  }

  getWrappedDEK(): WrappedDEK | null {
    return this.wrappedDEK ? { ...this.wrappedDEK } : null;
  }

  loadWrappedDEK(wrappedDEK: WrappedDEK): void {
    this.wrappedDEK = { ...wrappedDEK };
    this.state.hasWrappedDEK = true;
    this.state.keyDerivation = wrappedDEK.keyDerivation;
    this.state.isLocked = true;
    this.state.dataEncryptionKey = null;
  }
}