// Types for Crypto Worker Module

export interface WrappedDEK {
  wrappedKey: ArrayBuffer;
  salt: ArrayBuffer;
  iv: ArrayBuffer;
  keyDerivation: 'pbkdf2' | 'session';
  iterations?: number;
}

export interface CryptoState {
  isLocked: boolean;
  hasWrappedDEK: boolean;
  keyDerivation: 'pbkdf2' | 'session' | null;
  dataEncryptionKey: CryptoKey | null;
}

export interface KeyDerivationResult {
  kek: CryptoKey;
  salt: ArrayBuffer;
}

export interface EncryptionResult {
  encrypted: ArrayBuffer;
  iv: ArrayBuffer;
}

export interface WrapResult {
  wrappedKey: ArrayBuffer;
  iv: ArrayBuffer;
}