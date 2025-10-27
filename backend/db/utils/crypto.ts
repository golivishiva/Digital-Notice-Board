// Crypto utilities for Workers environment (Web Crypto API)

/**
 * Generate a random salt as hex string
 */
export function generateSalt(bytes = 16): string {
  const array = new Uint8Array(bytes)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Hash a password using PBKDF2 with SHA-256
 */
export async function hashPassword(password: string, saltHex: string): Promise<string> {
  const encoder = new TextEncoder()
  const passwordData = encoder.encode(password)
  const saltData = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
  
  const key = await crypto.subtle.importKey(
    'raw',
    passwordData,
    'PBKDF2',
    false,
    ['deriveBits']
  )
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltData,
      iterations: 100_000,
      hash: 'SHA-256'
    },
    key,
    256
  )
  
  const hashArray = new Uint8Array(derivedBits)
  return Array.from(hashArray, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Verify a password against a stored hash
 */
export async function verifyPassword(
  password: string,
  saltHex: string,
  hashHex: string
): Promise<boolean> {
  const computedHash = await hashPassword(password, saltHex)
  return computedHash === hashHex
}

/**
 * Generate a random ID with prefix
 */
export function randomId(prefix: string): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
  return `${prefix}_${hex}`
}

/**
 * Generate a random token
 */
export function generateToken(bytes = 32): string {
  const array = new Uint8Array(bytes)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}
