// 🔐 Servicio de Autenticación AFIP (WSAA)
import * as soap from 'soap';
import forge from 'node-forge';
import { afipConfig } from '../config.js';
import { AFIPSeller } from '../models/AFIPSeller.js';

/**
 * Crea un TRA (Ticket de Requerimiento de Acceso)
 */
function crearTRA(servicio: string = 'wsfe'): string {
  const now = new Date();
  const generationTime = new Date(now.getTime() - 10 * 60 * 1000);
  const expirationTime = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 horas
  const uniqueId = Math.floor(now.getTime() / 1000);

  return `<?xml version="1.0" encoding="UTF-8"?>
<loginTicketRequest version="1.0">
  <header>
    <uniqueId>${uniqueId}</uniqueId>
    <generationTime>${generationTime.toISOString()}</generationTime>
    <expirationTime>${expirationTime.toISOString()}</expirationTime>
  </header>
  <service>${servicio}</service>
</loginTicketRequest>`;
}

/**
 * Crea un CMS (mensaje PKCS#7 firmado)
 */
function crearCMS(tra: string, certPem: string, keyPem: string): string {
  try {
    // Convertir a objetos forge
    const cert = forge.pki.certificateFromPem(certPem);
    const privateKey = forge.pki.privateKeyFromPem(keyPem);

    // Crear mensaje PKCS#7
    const p7 = forge.pkcs7.createSignedData();
    p7.content = forge.util.createBuffer(tra, 'utf8');
    
    // Agregar certificado
    p7.addCertificate(cert);
    
    // Firmar
    p7.addSigner({
      key: privateKey,
      certificate: cert,
      digestAlgorithm: forge.pki.oids.sha256,
      authenticatedAttributes: [
        {
          type: forge.pki.oids.contentType,
          value: forge.pki.oids.data
        },
        {
          type: forge.pki.oids.messageDigest
        },
        {
          type: forge.pki.oids.signingTime,
          value: new Date()
        }
      ]
    });

    // Generar firma
    p7.sign();

    // Convertir a DER y luego a base64
    const der = forge.asn1.toDer(p7.toAsn1()).getBytes();
    const cms = forge.util.encode64(der);

    return cms;
  } catch (error: any) {
    console.error('❌ [AFIP Auth] Error al crear CMS:', error.message);
    throw new Error(`Error al crear firma PKCS#7: ${error.message}`);
  }
}

/**
 * Autentica con WSAA y obtiene token y sign
 */
export async function autenticarWSAA(
  certPem: string,
  keyPem: string,
  environment: 'testing' | 'production',
  servicio: string = 'wsfe'
): Promise<{ token: string; sign: string; expirationTime: Date }> {
  try {
    console.log(`🔐 [AFIP Auth] Autenticando con WSAA (${environment})...`);
    
    // 1. Crear TRA
    const tra = crearTRA(servicio);
    
    // 2. Crear CMS (firma PKCS#7)
    const cms = crearCMS(tra, certPem, keyPem);
    
    // 3. Determinar URL según ambiente
    const wsaaUrl = environment === 'production'
      ? 'https://wsaa.afip.gov.ar/ws/services/LoginCms'
      : 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms';
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔐 [AFIP] AUTENTICANDO CON WSAA');
    console.log(`   🌐 URL WSAA: ${wsaaUrl}`);
    console.log(`   🔧 Ambiente: ${environment.toUpperCase()}`);
    console.log(`   📋 Servicio: ${servicio}`);
    console.log('═══════════════════════════════════════════════════════════');
    
    // 4. Conectar a WSAA con opciones SSL
    const client = await soap.createClientAsync(wsaaUrl + '?WSDL', {
      wsdl_options: {
        rejectUnauthorized: false,
        strictSSL: false
      }
    } as any);
    
    // 5. Llamar a loginCms
    const result = await client.loginCmsAsync({ in0: cms });
    
    // 6. Parsear respuesta
    const loginCmsReturn = result[0].loginCmsReturn;
    
    // Extraer token y sign
    const tokenMatch = loginCmsReturn.match(/<token>([^<]+)<\/token>/);
    const signMatch = loginCmsReturn.match(/<sign>([^<]+)<\/sign>/);
    const expirationMatch = loginCmsReturn.match(/<expirationTime>([^<]+)<\/expirationTime>/);
    
    if (!tokenMatch || !signMatch) {
      throw new Error('No se pudo extraer token o sign de la respuesta');
    }
    
    const token = tokenMatch[1];
    const sign = signMatch[1];
    const expirationTime = expirationMatch ? new Date(expirationMatch[1]) : new Date(Date.now() + 12 * 60 * 60 * 1000);
    
    console.log('✅ [AFIP Auth] Autenticación exitosa');
    console.log(`   Token válido hasta: ${expirationTime.toLocaleString()}`);
    
    return { token, sign, expirationTime };
    
  } catch (error: any) {
    console.error('❌ [AFIP Auth] Error en autenticación:', error.message);
    throw new Error(`Error al autenticar con WSAA: ${error.message}`);
  }
}

/**
 * Obtiene credenciales válidas para un seller (renueva si es necesario)
 */
export async function obtenerCredenciales(sellerId: string): Promise<{ token: string; sign: string; cuit: string }> {
  try {
    const seller = await AFIPSeller.findById(sellerId);
    
    if (!seller) {
      throw new Error('Seller AFIP no encontrado');
    }
    
    if (!seller.activo) {
      throw new Error('Seller AFIP no está activo');
    }
    
    // Verificar si el token es válido
    const now = new Date();
    const needsRenewal = !seller.token || !seller.sign || !seller.tokenExpiration || seller.tokenExpiration <= now;
    
    if (needsRenewal) {
      console.log('🔄 [AFIP Auth] Token expirado o inexistente, renovando...');
      
      // Autenticar con WSAA usando el ambiente del seller
      const { token, sign, expirationTime } = await autenticarWSAA(
        seller.certificado,
        seller.clavePrivada,
        seller.environment
      );
      
      // Guardar credenciales
      seller.token = token;
      seller.sign = sign;
      seller.tokenExpiration = expirationTime;
      await seller.save();
      
      console.log('✅ [AFIP Auth] Token renovado exitosamente');
    }
    
    return {
      token: seller.token!,
      sign: seller.sign!,
      cuit: seller.cuit
    };
    
  } catch (error: any) {
    console.error('❌ [AFIP Auth] Error obteniendo credenciales:', error.message);
    throw error;
  }
}

export default {
  autenticarWSAA,
  obtenerCredenciales
};
