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
  title: string;
  quantity?: number;
  unitPrice: number;
  currency?: string;
  description?: string;
}

export interface Payer {
  email: string;
  name?: string;
  surname?: string;
}

export interface BackUrls {
  success: string;
  failure: string;
  pending: string;
}

export interface PreferenceOptions {
  items: PaymentItem[];
  payer?: Payer;
  backUrls?: BackUrls;
  externalReference?: string;
  notificationUrl?: string;
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
 */
export async function createPreference(options: PreferenceOptions) {
  if (!preference) {
    throw new Error('Cliente MP no inicializado');
  }
  
  const { items, payer, backUrls, externalReference, notificationUrl } = options;
  
  const preferenceData = await preference.create({
    body: {
      items: items.map((item, index) => ({
        id: `item-${index}`,
        title: item.title,
        quantity: item.quantity || 1,
        unit_price: item.unitPrice,
        currency_id: item.currency || 'ARS',
        description: item.description || '',
      })),
      payer: payer ? {
        email: payer.email,
        name: payer.name,
        surname: payer.surname,
      } : undefined,
      back_urls: backUrls ? {
        success: backUrls.success,
        failure: backUrls.failure,
        pending: backUrls.pending,
      } : undefined,
      auto_return: backUrls ? 'approved' : undefined,
      external_reference: externalReference || `ORDER-${Date.now()}`,
      notification_url: notificationUrl,
    }
  });
  
  return {
    id: preferenceData.id,
    initPoint: preferenceData.init_point,
    sandboxInitPoint: preferenceData.sandbox_init_point,
    externalReference: preferenceData.external_reference,
  };
}

/**
 * Crea una preferencia de pago con Split Payment (Marketplace)
 */
export async function createSplitPreference(
  options: PreferenceOptions, 
  seller: SellerData, 
  marketplaceFee: number | null = null
) {
  const { items, payer, backUrls, externalReference, notificationUrl } = options;
  
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
  
  const preferenceData = await sellerPreference.create({
    body: {
      items: items.map((item, index) => ({
        id: `item-${index}`,
        title: item.title,
        quantity: item.quantity || 1,
        unit_price: item.unitPrice,
        currency_id: item.currency || 'ARS',
        description: item.description || '',
      })),
      payer: payer ? {
        email: payer.email,
        name: payer.name,
        surname: payer.surname,
      } : undefined,
      back_urls: backUrls ? {
        success: backUrls.success,
        failure: backUrls.failure,
        pending: backUrls.pending,
      } : undefined,
      auto_return: backUrls ? 'approved' : undefined,
      external_reference: externalReference || `ORDER-${Date.now()}`,
      notification_url: notificationUrl,
      marketplace_fee: fee,
      marketplace: mpConfig.clientId,
    }
  });
  
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
