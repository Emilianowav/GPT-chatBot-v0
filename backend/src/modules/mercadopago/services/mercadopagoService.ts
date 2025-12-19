// 💳 Servicio de Mercado Pago - SDK wrapper
// @ts-ignore - SDK de MP tiene tipos incompletos
import { MercadoPagoConfig, OAuth, Preference, Payment } from 'mercadopago';
import mpConfig from '../config.js';

// Cliente principal del Marketplace (tu aplicación)
let mpClient: any = null;
let oauth: any = null;
let preference: any = null;
let payment: any = null;

function initMPClient() {
  if (!mpConfig.accessToken) {
    console.warn('⚠️ [MP] MP_ACCESS_TOKEN no configurado');
    return false;
  }
  
  mpClient = new MercadoPagoConfig({
    accessToken: mpConfig.accessToken,
    options: { timeout: 5000 }
  });
  
  oauth = new OAuth(mpClient);
  preference = new Preference(mpClient);
  payment = new Payment(mpClient);
  
  console.log('✅ [MP] Cliente de Mercado Pago inicializado');
  return true;
}

// Inicializar al cargar el módulo
initMPClient();

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  userId: string;
  publicKey?: string;
  expiresIn?: number;
  tokenType?: string;
  scope?: string;
}

export interface PaymentItem {
  id?: string;                    // Código del item (recomendado)
  title: string;                  // Nombre del item (recomendado)
  description?: string;           // Descripción del item (recomendado)
  categoryId?: string;            // Categoría del item (recomendado) - ej: "services", "electronics"
  quantity?: number;              // Cantidad (recomendado)
  unitPrice: number;              // Precio unitario (recomendado)
  currency?: string;              // Moneda (default: ARS)
  pictureUrl?: string;            // URL de imagen del producto
}

export interface Payer {
  email: string;                  // Email del comprador (OBLIGATORIO)
  firstName?: string;             // Nombre del comprador (recomendado)
  lastName?: string;              // Apellido del comprador (recomendado)
  phone?: {
    areaCode?: string;
    number?: string;
  };
  identification?: {
    type?: string;                // DNI, CUIT, etc.
    number?: string;
  };
  address?: {
    streetName?: string;
    streetNumber?: number;
    zipCode?: string;
  };
}

export interface BackUrls {
  success: string;                // URL de redirección en caso de éxito
  failure: string;                // URL de redirección en caso de fallo
  pending: string;                // URL de redirección en caso de pendiente
}

export interface PreferenceOptions {
  items: PaymentItem[];
  payer?: Payer;
  backUrls?: BackUrls;
  externalReference?: string;     // Referencia externa (OBLIGATORIO) - ID interno de tu sistema
  notificationUrl?: string;       // URL para webhooks (recomendado)
  statementDescriptor?: string;   // Descripción en resumen de tarjeta (recomendado) - max 22 chars
  autoReturn?: 'approved' | 'all'; // Auto retorno después del pago
  expires?: boolean;              // Si la preferencia expira
  expirationDateFrom?: string;    // Fecha desde la que es válida
  expirationDateTo?: string;      // Fecha hasta la que es válida
}

export interface SellerData {
  accessToken: string;
  userId: string;
}

/**
 * Genera la URL de autorización OAuth para que un vendedor conecte su cuenta
 */
export function getAuthorizationUrl(redirectUri: string, state: string = ''): string {
  const params = new URLSearchParams({
    client_id: mpConfig.clientId,
    response_type: 'code',
    platform_id: 'mp',
    redirect_uri: redirectUri,
  });
  
  if (state) {
    params.append('state', state);
  }
  
  return `https://auth.mercadopago.com.ar/authorization?${params.toString()}`;
}

/**
 * Intercambia el código de autorización por tokens de acceso
 */
export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<TokenData> {
  if (!oauth) {
    throw new Error('Cliente MP no inicializado');
  }
  
  const tokenData = await oauth.create({
    body: {
      client_id: mpConfig.clientId,
      client_secret: mpConfig.clientSecret,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri
    }
  });
  
  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    userId: tokenData.user_id?.toString() || '',
    publicKey: tokenData.public_key,
    expiresIn: tokenData.expires_in,
    tokenType: tokenData.token_type,
    scope: tokenData.scope,
  };
}

/**
 * Renueva el token de acceso usando el refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<Partial<TokenData>> {
  if (!oauth) {
    throw new Error('Cliente MP no inicializado');
  }
  
  const tokenData = await oauth.create({
    body: {
      client_id: mpConfig.clientId,
      client_secret: mpConfig.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    }
  });
  
  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresIn: tokenData.expires_in,
  };
}

/**
 * Crea una preferencia de pago simple (sin split)
 * Incluye todos los campos requeridos y recomendados por MP para mejor puntuación
 */
export async function createPreference(options: PreferenceOptions) {
  if (!preference) {
    throw new Error('Cliente MP no inicializado');
  }
  
  const { 
    items, 
    payer, 
    backUrls, 
    externalReference, 
    notificationUrl,
    statementDescriptor,
    autoReturn,
    expires,
    expirationDateFrom,
    expirationDateTo
  } = options;
  
  // Validar campos obligatorios
  if (!externalReference) {
    console.warn('⚠️ [MP] external_reference es OBLIGATORIO para mejor puntuación');
  }
  if (!payer?.email) {
    console.warn('⚠️ [MP] payer.email es OBLIGATORIO para mejor puntuación');
  }
  
  const preferenceBody: any = {
    // Items con todos los campos recomendados
    items: items.map((item, index) => ({
      id: item.id || `item-${index}-${Date.now()}`,           // Código del item
      title: item.title,                                       // Nombre del item
      description: item.description || item.title,             // Descripción del item
      category_id: item.categoryId || 'services',              // Categoría del item
      quantity: item.quantity || 1,                            // Cantidad
      unit_price: item.unitPrice,                              // Precio unitario
      currency_id: item.currency || 'ARS',
      picture_url: item.pictureUrl,
    })),
    
    // Referencia externa OBLIGATORIA
    external_reference: externalReference || `ORDER-${Date.now()}`,
    
    // Statement descriptor para resumen de tarjeta (max 22 chars)
    statement_descriptor: statementDescriptor 
      ? statementDescriptor.substring(0, 22) 
      : 'MOMENTO IA',
    
    // URL de notificaciones webhook
    notification_url: notificationUrl || `${mpConfig.appUrl}/api/modules/mercadopago/webhooks`,
  };
  
  // Payer con todos los campos recomendados
  if (payer) {
    preferenceBody.payer = {
      email: payer.email,                                      // OBLIGATORIO
      name: payer.firstName,                                   // Nombre (recomendado)
      surname: payer.lastName,                                 // Apellido (recomendado)
      phone: payer.phone ? {
        area_code: payer.phone.areaCode,
        number: payer.phone.number,
      } : undefined,
      identification: payer.identification ? {
        type: payer.identification.type,
        number: payer.identification.number,
      } : undefined,
      address: payer.address ? {
        street_name: payer.address.streetName,
        street_number: payer.address.streetNumber,
        zip_code: payer.address.zipCode,
      } : undefined,
    };
  }
  
  // Back URLs (recomendado)
  if (backUrls) {
    preferenceBody.back_urls = {
      success: backUrls.success,
      failure: backUrls.failure,
      pending: backUrls.pending,
    };
    preferenceBody.auto_return = autoReturn || 'approved';
  }
  
  // Expiración de la preferencia
  if (expires !== undefined) {
    preferenceBody.expires = expires;
  }
  if (expirationDateFrom) {
    preferenceBody.expiration_date_from = expirationDateFrom;
  }
  if (expirationDateTo) {
    preferenceBody.expiration_date_to = expirationDateTo;
  }
  
  const preferenceData = await preference.create({ body: preferenceBody });
  
  return {
    id: preferenceData.id,
    initPoint: preferenceData.init_point,
    sandboxInitPoint: preferenceData.sandbox_init_point,
    externalReference: preferenceData.external_reference,
  };
}

/**
 * Crea una preferencia de pago con Split Payment (Marketplace)
 * Incluye todos los campos requeridos y recomendados por MP para mejor puntuación
 */
export async function createSplitPreference(
  options: PreferenceOptions, 
  seller: SellerData, 
  marketplaceFee: number | null = null
) {
  const { 
    items, 
    payer, 
    backUrls, 
    externalReference, 
    notificationUrl,
    statementDescriptor,
    autoReturn,
    expires,
    expirationDateFrom,
    expirationDateTo
  } = options;
  
  // Validar campos obligatorios
  if (!externalReference) {
    console.warn('⚠️ [MP] external_reference es OBLIGATORIO para mejor puntuación');
  }
  if (!payer?.email) {
    console.warn('⚠️ [MP] payer.email es OBLIGATORIO para mejor puntuación');
  }
  
  // Calcular el total
  const total = items.reduce((sum, item) => sum + (item.unitPrice * (item.quantity || 1)), 0);
  
  // Calcular comisión del marketplace
  const fee = marketplaceFee !== null 
    ? marketplaceFee 
    : Math.round(total * (mpConfig.marketplaceFeePercent / 100) * 100) / 100;
  
  // Crear cliente con el access token del vendedor
  const sellerClient = new MercadoPagoConfig({
    accessToken: seller.accessToken,
    options: { timeout: 5000 }
  });
  
  const sellerPreference = new Preference(sellerClient);
  
  const preferenceBody: any = {
    // Items con todos los campos recomendados
    items: items.map((item, index) => ({
      id: item.id || `item-${index}-${Date.now()}`,           // Código del item
      title: item.title,                                       // Nombre del item
      description: item.description || item.title,             // Descripción del item
      category_id: item.categoryId || 'services',              // Categoría del item
      quantity: item.quantity || 1,                            // Cantidad
      unit_price: item.unitPrice,                              // Precio unitario
      currency_id: item.currency || 'ARS',
      picture_url: item.pictureUrl,
    })),
    
    // Referencia externa OBLIGATORIA
    external_reference: externalReference || `ORDER-${Date.now()}`,
    
    // Statement descriptor para resumen de tarjeta (max 22 chars)
    statement_descriptor: statementDescriptor 
      ? statementDescriptor.substring(0, 22) 
      : 'MOMENTO IA',
    
    // URL de notificaciones webhook
    notification_url: notificationUrl || `${mpConfig.appUrl}/api/modules/mercadopago/webhooks`,
    
    // Marketplace split payment
    marketplace_fee: fee,
    marketplace: mpConfig.clientId,
  };
  
  // Payer con todos los campos recomendados
  if (payer) {
    preferenceBody.payer = {
      email: payer.email,                                      // OBLIGATORIO
      name: payer.firstName,                                   // Nombre (recomendado)
      surname: payer.lastName,                                 // Apellido (recomendado)
      phone: payer.phone ? {
        area_code: payer.phone.areaCode,
        number: payer.phone.number,
      } : undefined,
      identification: payer.identification ? {
        type: payer.identification.type,
        number: payer.identification.number,
      } : undefined,
      address: payer.address ? {
        street_name: payer.address.streetName,
        street_number: payer.address.streetNumber,
        zip_code: payer.address.zipCode,
      } : undefined,
    };
  }
  
  // Back URLs (recomendado)
  if (backUrls) {
    preferenceBody.back_urls = {
      success: backUrls.success,
      failure: backUrls.failure,
      pending: backUrls.pending,
    };
    preferenceBody.auto_return = autoReturn || 'approved';
  }
  
  // Expiración de la preferencia
  if (expires !== undefined) {
    preferenceBody.expires = expires;
  }
  if (expirationDateFrom) {
    preferenceBody.expiration_date_from = expirationDateFrom;
  }
  if (expirationDateTo) {
    preferenceBody.expiration_date_to = expirationDateTo;
  }
  
  const preferenceData = await sellerPreference.create({ body: preferenceBody });
  
  return {
    id: preferenceData.id,
    initPoint: preferenceData.init_point,
    sandboxInitPoint: preferenceData.sandbox_init_point,
    externalReference: preferenceData.external_reference,
    marketplaceFee: fee,
    sellerAmount: total - fee,
    total: total,
  };
}

/**
 * Obtiene información de un pago
 */
export async function getPayment(paymentId: string, accessToken: string | null = null) {
  const client = accessToken 
    ? new MercadoPagoConfig({ accessToken, options: { timeout: 5000 } })
    : mpClient;
  
  if (!client) {
    throw new Error('Cliente MP no inicializado');
  }
  
  const paymentClient = new Payment(client);
  const paymentData = await paymentClient.get({ id: paymentId });
  
  return {
    id: paymentData.id,
    status: paymentData.status,
    statusDetail: paymentData.status_detail,
    amount: paymentData.transaction_amount,
    currency: paymentData.currency_id,
    paymentMethod: paymentData.payment_method_id,
    paymentType: paymentData.payment_type_id,
    externalReference: paymentData.external_reference,
    dateCreated: paymentData.date_created,
    dateApproved: paymentData.date_approved,
    payer: paymentData.payer,
    feeDetails: paymentData.fee_details,
    metadata: paymentData.metadata,
  };
}

export default {
  getAuthorizationUrl,
  exchangeCodeForToken,
  refreshAccessToken,
  createPreference,
  createSplitPreference,
  getPayment,
};
