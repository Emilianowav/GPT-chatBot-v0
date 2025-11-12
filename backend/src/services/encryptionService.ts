// 🔐 Servicio de Encriptación para Credenciales OAuth
import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

/**
 * Obtiene la clave de encriptación desde variables de entorno
 * Si no existe, genera una y advierte al usuario
 */
function getEncryptionKey(): Buffer {
  let key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    console.warn('⚠️  ENCRYPTION_KEY no encontrada en .env, generando una temporal');
    console.warn('⚠️  IMPORTANTE: Agrega esta clave a tu .env para producción:');
    key = crypto.randomBytes(32).toString('hex');
    console.warn(`ENCRYPTION_KEY=${key}`);
  }
  
  // Asegurar que la clave tenga exactamente 32 bytes
  const keyBuffer = Buffer.from(key, 'hex');
  if (keyBuffer.length !== 32) {
    throw new Error('ENCRYPTION_KEY debe ser una cadena hexadecimal de 64 caracteres (32 bytes)');
  }
  
  return keyBuffer;
}

/**
 * Encripta un texto usando AES-256-CBC
 * @param text Texto a encriptar
 * @returns Texto encriptado en formato "iv:encrypted"
 */
export function encrypt(text: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Retornar IV + encrypted separados por ":"
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('❌ Error encriptando:', error);
    throw new Error('Error al encriptar datos sensibles');
  }
}

/**
 * Desencripta un texto encriptado con AES-256-CBC
 * @param encryptedText Texto encriptado en formato "iv:encrypted"
 * @returns Texto desencriptado
 */
export function decrypt(encryptedText: string): string {
  try {
    const key = getEncryptionKey();
    const parts = encryptedText.split(':');
    
    if (parts.length !== 2) {
      throw new Error('Formato de texto encriptado inválido');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = Buffer.from(parts[1], 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('❌ Error desencriptando:', error);
    throw new Error('Error al desencriptar datos sensibles');
  }
}

/**
 * Genera una clave de encriptación segura
 * Útil para generar la ENCRYPTION_KEY inicial
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Encripta las credenciales OAuth
 */
export function encryptCredentials(credentials: {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  expires_at: Date;
  scope: string;
}) {
  return {
    access_token: encrypt(credentials.access_token),
    refresh_token: encrypt(credentials.refresh_token),
    token_type: credentials.token_type || 'Bearer',
    expires_at: credentials.expires_at,
    scope: credentials.scope
  };
}

/**
 * Desencripta las credenciales OAuth
 */
export function decryptCredentials(encryptedCredentials: {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_at: Date;
  scope: string;
}) {
  return {
    access_token: decrypt(encryptedCredentials.access_token),
    refresh_token: decrypt(encryptedCredentials.refresh_token),
    token_type: encryptedCredentials.token_type,
    expires_at: encryptedCredentials.expires_at,
    scope: encryptedCredentials.scope
  };
}
