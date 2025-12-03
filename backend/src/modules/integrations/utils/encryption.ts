// 🔐 Sistema de Encriptación para Credenciales
import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

// Obtener la clave de encriptación desde variables de entorno
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error('ENCRYPTION_KEY no está configurada en las variables de entorno');
  }
  
  // Si la clave es hex, convertirla a Buffer
  if (key.length === 64) {
    return Buffer.from(key, 'hex');
  }
  
  // Si no, usar hash SHA-256 para obtener 32 bytes
  return crypto.createHash('sha256').update(key).digest();
}

/**
 * Encripta un texto usando AES-256-CBC
 * @param text Texto a encriptar
 * @returns Texto encriptado en formato "iv:encrypted"
 */
export function encrypt(text: string): string {
  if (!text) return text;
  
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  } catch (error: any) {
    console.error('Error al encriptar:', error.message);
    throw new Error('Error al encriptar datos sensibles');
  }
}

/**
 * Desencripta un texto encriptado con AES-256-CBC
 * Si el texto no está encriptado (no tiene formato iv:encrypted), lo retorna tal cual
 * @param text Texto encriptado en formato "iv:encrypted" o texto plano
 * @returns Texto desencriptado o texto plano
 */
export function decrypt(text: string): string {
  if (!text) return text;
  
  try {
    // Verificar si ENCRYPTION_KEY está configurada
    if (!process.env.ENCRYPTION_KEY) {
      console.warn('⚠️ ENCRYPTION_KEY no configurada, usando texto plano');
      return text;
    }
    
    const key = getEncryptionKey();
    const parts = text.split(':');
    
    // Si no tiene el formato iv:encrypted, asumir que es texto plano
    if (parts.length !== 2) {
      console.warn('⚠️ Texto no encriptado detectado, usando como texto plano');
      return text;
    }
    
    // Verificar que ambas partes sean hexadecimales válidos
    const ivHex = parts[0];
    const encryptedHex = parts[1];
    
    if (!/^[0-9a-f]+$/i.test(ivHex) || !/^[0-9a-f]+$/i.test(encryptedHex)) {
      console.warn('⚠️ Formato no válido para desencriptación, usando como texto plano');
      return text;
    }
    
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = encryptedHex;
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error: any) {
    console.error('Error al desencriptar:', error.message);
    console.warn('⚠️ Fallback: usando texto como plano');
    // Fallback: si falla la desencriptación, retornar el texto original
    return text;
  }
}

/**
 * Encripta un objeto, encriptando solo los campos especificados
 * @param obj Objeto a encriptar
 * @param fields Campos a encriptar
 * @returns Objeto con campos encriptados
 */
export function encryptObject<T extends Record<string, any>>(
  obj: T, 
  fields: string[]
): T {
  const result: any = { ...obj };
  
  for (const field of fields) {
    if (result[field] && typeof result[field] === 'string') {
      result[field] = encrypt(result[field]);
    }
  }
  
  return result as T;
}

/**
 * Desencripta un objeto, desencriptando solo los campos especificados
 * @param obj Objeto a desencriptar
 * @param fields Campos a desencriptar
 * @returns Objeto con campos desencriptados
 */
export function decryptObject<T extends Record<string, any>>(
  obj: T, 
  fields: string[]
): T {
  const result: any = { ...obj };
  
  for (const field of fields) {
    if (result[field] && typeof result[field] === 'string') {
      try {
        result[field] = decrypt(result[field]);
      } catch (error) {
        // Si falla la desencriptación, mantener el valor original
        console.warn(`No se pudo desencriptar el campo ${field}`);
      }
    }
  }
  
  return result as T;
}

/**
 * Genera una clave de encriptación aleatoria de 32 bytes (256 bits)
 * @returns Clave en formato hexadecimal
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hashea un texto usando SHA-256
 * @param text Texto a hashear
 * @returns Hash en formato hexadecimal
 */
export function hash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Verifica si un texto coincide con un hash
 * @param text Texto a verificar
 * @param hashedText Hash a comparar
 * @returns true si coinciden
 */
export function verifyHash(text: string, hashedText: string): boolean {
  return hash(text) === hashedText;
}

/**
 * Genera un token aleatorio seguro
 * @param length Longitud del token en bytes (default: 32)
 * @returns Token en formato hexadecimal
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Genera una firma HMAC para validación de webhooks
 * @param payload Payload a firmar
 * @param secret Secreto compartido
 * @param algorithm Algoritmo (default: sha256)
 * @returns Firma en formato hexadecimal
 */
export function generateSignature(
  payload: string, 
  secret: string,
  algorithm: 'sha256' | 'sha1' | 'md5' = 'sha256'
): string {
  return crypto
    .createHmac(algorithm, secret)
    .update(payload)
    .digest('hex');
}

/**
 * Verifica una firma HMAC
 * @param payload Payload recibido
 * @param signature Firma recibida
 * @param secret Secreto compartido
 * @param algorithm Algoritmo usado
 * @returns true si la firma es válida
 */
export function verifySignature(
  payload: string,
  signature: string,
  secret: string,
  algorithm: 'sha256' | 'sha1' | 'md5' = 'sha256'
): boolean {
  const expectedSignature = generateSignature(payload, secret, algorithm);
  
  // Usar timingSafeEqual para prevenir timing attacks
  try {
    const bufferExpected = Buffer.from(expectedSignature, 'hex');
    const bufferReceived = Buffer.from(signature, 'hex');
    
    if (bufferExpected.length !== bufferReceived.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(bufferExpected, bufferReceived);
  } catch {
    return false;
  }
}
