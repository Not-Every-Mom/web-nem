// Data encryption utilities for content and embeddings

import { CoreCrypto } from './core';

export class DataEncryption {
  static async encryptContent(content: string, key: CryptoKey): Promise<{ encrypted: ArrayBuffer; iv: ArrayBuffer }> {
    const encoder = new TextEncoder();
    return CoreCrypto.encrypt(encoder.encode(content).buffer, key);
  }

  static async decryptContent(encryptedData: ArrayBuffer, key: CryptoKey, iv: ArrayBuffer): Promise<string> {
    const decrypted = await CoreCrypto.decrypt(encryptedData, key, iv);
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  static async encryptEmbedding(embedding: Float32Array, key: CryptoKey): Promise<{ encrypted: ArrayBuffer; iv: ArrayBuffer }> {
    return CoreCrypto.encrypt(embedding.buffer as ArrayBuffer, key);
  }

  static async decryptEmbedding(encryptedData: ArrayBuffer, key: CryptoKey, iv: ArrayBuffer): Promise<Float32Array> {
    const decrypted = await CoreCrypto.decrypt(encryptedData, key, iv);
    return new Float32Array(decrypted);
  }
}