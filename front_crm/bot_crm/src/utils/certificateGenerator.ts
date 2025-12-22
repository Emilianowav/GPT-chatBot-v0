/**
 * Generador de Certificados AFIP en el Browser
 * Genera clave privada RSA y CSR en formato PKCS#10 válido
 * La clave privada NUNCA sale del browser hasta que el usuario la descarga
 */

interface CertificateData {
  cuit: string;
  razonSocial: string;
  email?: string;
}

interface GeneratedCertificate {
  privateKey: string;
  csr: string;
}

/**
 * Genera un par de claves RSA y un CSR en formato PKCS#10 para AFIP
 * El CSR generado es válido y puede subirse directamente a AFIP
 */
export async function generateAFIPCertificate(data: CertificateData): Promise<GeneratedCertificate> {
  try {
    // 1. Generar par de claves RSA 2048 bits
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'RSASSA-PKCS1-v1_5',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]), // 65537
        hash: 'SHA-256',
      },
      true, // extractable
      ['sign', 'verify']
    );

    // 2. Exportar clave privada en formato PKCS#8
    const privateKeyBuffer = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
    const privateKeyPem = bufferToPem(privateKeyBuffer, 'RSA PRIVATE KEY');

    // 3. Exportar clave pública
    const publicKeyBuffer = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
    
    // 4. Crear CSR en formato PKCS#10
    const csr = await createPKCS10CSR(publicKeyBuffer, data, keyPair.privateKey);

    return {
      privateKey: privateKeyPem,
      csr: csr,
    };
  } catch (error) {
    console.error('Error generando certificado:', error);
    throw new Error('No se pudo generar el certificado. Verifica que tu navegador soporte Web Crypto API.');
  }
}

/**
 * Convierte un ArrayBuffer a formato PEM
 */
function bufferToPem(buffer: ArrayBuffer, label: string): string {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  const lines = base64.match(/.{1,64}/g) || [];
  return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----\n`;
}

/**
 * Crea un CSR en formato PKCS#10 válido usando ASN.1
 * Este CSR puede subirse directamente a AFIP sin necesidad de OpenSSL
 */
async function createPKCS10CSR(
  publicKeyBuffer: ArrayBuffer,
  data: CertificateData,
  privateKey: CryptoKey
): Promise<string> {
  // Construir el Distinguished Name (DN) en formato ASN.1
  const dn = encodeDN({
    C: 'AR',
    CN: data.razonSocial,
    serialNumber: data.cuit,
  });

  // Construir CertificationRequestInfo
  const version = encodeInteger(0); // Version 0
  const subject = dn;
  const subjectPKInfo = new Uint8Array(publicKeyBuffer);
  const attributes = encodeAttributes(); // Atributos vacíos

  // Ensamblar CertificationRequestInfo
  const certRequestInfo = encodeSequence([
    version,
    subject,
    subjectPKInfo,
    attributes
  ]);

  // Firmar el CertificationRequestInfo
  const signature = await window.crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    certRequestInfo.buffer as ArrayBuffer
  );

  // Algoritmo de firma (SHA256withRSA)
  const signatureAlgorithm = encodeSignatureAlgorithm();

  // Ensamblar el CSR completo (CertificationRequest)
  const certRequest = encodeSequence([
    certRequestInfo,
    signatureAlgorithm,
    encodeBitString(new Uint8Array(signature))
  ]);

  // Convertir a PEM
  return bufferToPem(certRequest.buffer as ArrayBuffer, 'CERTIFICATE REQUEST');
}

/**
 * Codifica un Distinguished Name (DN) en formato ASN.1
 */
function encodeDN(attributes: Record<string, string>): Uint8Array {
  const rdns: Uint8Array[] = [];

  // Orden estándar: C, CN, serialNumber
  const order = ['C', 'CN', 'serialNumber'];
  
  for (const key of order) {
    if (attributes[key]) {
      const oid = getOID(key);
      const value = encodeUTF8String(attributes[key]);
      const attrTypeAndValue = encodeSequence([oid, value]);
      const rdn = encodeSet([attrTypeAndValue]);
      rdns.push(rdn);
    }
  }

  return encodeSequence(rdns);
}

/**
 * Obtiene el OID para un atributo DN
 */
function getOID(attribute: string): Uint8Array {
  const oids: Record<string, number[]> = {
    'C': [2, 5, 4, 6],           // countryName
    'CN': [2, 5, 4, 3],          // commonName
    'serialNumber': [2, 5, 4, 5], // serialNumber
  };

  return encodeOID(oids[attribute] || []);
}

/**
 * Codifica un OID en formato ASN.1
 */
function encodeOID(oid: number[]): Uint8Array {
  const encoded = [oid[0] * 40 + oid[1]];
  
  for (let i = 2; i < oid.length; i++) {
    let value = oid[i];
    const bytes: number[] = [];
    
    bytes.unshift(value & 0x7f);
    value >>= 7;
    
    while (value > 0) {
      bytes.unshift((value & 0x7f) | 0x80);
      value >>= 7;
    }
    
    encoded.push(...bytes);
  }

  return encodeWithTag(0x06, new Uint8Array(encoded));
}

/**
 * Codifica una cadena UTF8 en formato ASN.1
 */
function encodeUTF8String(str: string): Uint8Array {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  return encodeWithTag(0x0c, bytes); // UTF8String tag
}

/**
 * Codifica un entero en formato ASN.1
 */
function encodeInteger(value: number): Uint8Array {
  const bytes = value === 0 ? [0] : [];
  let temp = value;
  
  while (temp > 0) {
    bytes.unshift(temp & 0xff);
    temp >>= 8;
  }

  // Agregar byte de padding si el bit más alto está en 1
  if (bytes[0] & 0x80) {
    bytes.unshift(0);
  }

  return encodeWithTag(0x02, new Uint8Array(bytes));
}

/**
 * Codifica una secuencia ASN.1
 */
function encodeSequence(items: Uint8Array[]): Uint8Array {
  const content = concatenateArrays(items);
  return encodeWithTag(0x30, content);
}

/**
 * Codifica un set ASN.1
 */
function encodeSet(items: Uint8Array[]): Uint8Array {
  const content = concatenateArrays(items);
  return encodeWithTag(0x31, content);
}

/**
 * Codifica un bit string ASN.1
 */
function encodeBitString(bits: Uint8Array): Uint8Array {
  const content = new Uint8Array(bits.length + 1);
  content[0] = 0; // Unused bits
  content.set(bits, 1);
  return encodeWithTag(0x03, content);
}

/**
 * Codifica atributos vacíos (contexto específico [0])
 */
function encodeAttributes(): Uint8Array {
  return encodeWithTag(0xa0, new Uint8Array(0));
}

/**
 * Codifica el algoritmo de firma (SHA256withRSA)
 */
function encodeSignatureAlgorithm(): Uint8Array {
  // OID para sha256WithRSAEncryption: 1.2.840.113549.1.1.11
  const oid = encodeOID([1, 2, 840, 113549, 1, 1, 11]);
  const nullParam = encodeWithTag(0x05, new Uint8Array(0)); // NULL
  return encodeSequence([oid, nullParam]);
}

/**
 * Codifica datos con un tag ASN.1
 */
function encodeWithTag(tag: number, content: Uint8Array): Uint8Array {
  const length = encodeLength(content.length);
  const result = new Uint8Array(1 + length.length + content.length);
  
  result[0] = tag;
  result.set(length, 1);
  result.set(content, 1 + length.length);
  
  return result;
}

/**
 * Codifica la longitud en formato ASN.1
 */
function encodeLength(length: number): Uint8Array {
  if (length < 128) {
    return new Uint8Array([length]);
  }

  const bytes: number[] = [];
  let temp = length;
  
  while (temp > 0) {
    bytes.unshift(temp & 0xff);
    temp >>= 8;
  }

  return new Uint8Array([0x80 | bytes.length, ...bytes]);
}

/**
 * Concatena múltiples Uint8Arrays
 */
function concatenateArrays(arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  
  return result;
}

/**
 * Descarga un archivo en el navegador
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Lee un archivo como texto
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
}
