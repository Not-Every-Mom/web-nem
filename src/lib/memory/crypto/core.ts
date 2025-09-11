// Core cryptographic operations

export class CoreCrypto {
  static async generateDEK(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );
  }

  static async deriveKEKFromPassphrase(passphrase: string, salt?: ArrayBuffer): Promise<{ kek: CryptoKey; salt: ArrayBuffer }> {
    const encoder = new TextEncoder();
    const passphraseBuffer = encoder.encode(passphrase);
    
    // Generate salt if not provided
    const actualSalt = salt || crypto.getRandomValues(new Uint8Array(16)).buffer;
    
    // Import passphrase as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passphraseBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    // Derive KEK using PBKDF2
    const kek = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: actualSalt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: 'AES-GCM',
        length: 256
      },
      false, // not extractable for security
      ['wrapKey', 'unwrapKey']
    );
    
    return { kek, salt: actualSalt };
  }

  static async deriveKEKFromSession(sessionData: string, salt?: ArrayBuffer): Promise<{ kek: CryptoKey; salt: ArrayBuffer }> {
    const encoder = new TextEncoder();
    const sessionBuffer = encoder.encode(sessionData);
    
    // Generate salt if not provided
    const actualSalt = salt || crypto.getRandomValues(new Uint8Array(16)).buffer;
    
    // Import session data as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      sessionBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    // Derive KEK using PBKDF2 (fewer iterations for convenience)
    const kek = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: actualSalt,
        iterations: 10000,
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: 'AES-GCM',
        length: 256
      },
      false, // not extractable
      ['wrapKey', 'unwrapKey']
    );
    
    return { kek, salt: actualSalt };
  }

  static async wrapDEK(dek: CryptoKey, kek: CryptoKey): Promise<{ wrappedKey: ArrayBuffer; iv: ArrayBuffer }> {
    const iv = crypto.getRandomValues(new Uint8Array(12)).buffer;
    
    const wrappedKey = await crypto.subtle.wrapKey(
      'raw',
      dek,
      kek,
      {
        name: 'AES-GCM',
        iv: iv
      }
    );
    
    return { wrappedKey, iv };
  }

  static async unwrapDEK(wrappedKey: ArrayBuffer, kek: CryptoKey, iv: ArrayBuffer): Promise<CryptoKey> {
    return await crypto.subtle.unwrapKey(
      'raw',
      wrappedKey,
      kek,
      {
        name: 'AES-GCM',
        iv: iv
      },
      {
        name: 'AES-GCM',
        length: 256
      },
      false, // not extractable
      ['encrypt', 'decrypt']
    );
  }

  static async encrypt(data: ArrayBuffer, key: CryptoKey): Promise<{ encrypted: ArrayBuffer; iv: ArrayBuffer }> {
    const iv = crypto.getRandomValues(new Uint8Array(12)).buffer;
    
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      data
    );
    
    return { encrypted, iv };
  }

  static async decrypt(encryptedData: ArrayBuffer, key: CryptoKey, iv: ArrayBuffer): Promise<ArrayBuffer> {
    return await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encryptedData
    );
  }
}