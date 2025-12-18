// 💳 Servicio para generar links de pago dinámicos desde el chatbot
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { Seller } from '../modules/mercadopago/models/Seller.js';

const MP_MODULE_URL = process.env.MP_MODULE_URL || 'https://gpt-chatbot-v0.onrender.com/api/modules/mercadopago';

interface GeneratePaymentLinkParams {
  empresaId: string;
  title: string;
  amount: number;
  description?: string;
  payerEmail?: string;
  payerPhone?: string;
  externalReference?: string;
}

interface PaymentLinkResult {
  success: boolean;
  paymentUrl?: string;
  preferenceId?: string;
  error?: string;
}

/**
 * Genera un link de pago dinámico para una empresa
 * Busca el seller asociado a la empresa y crea una preferencia de pago
 */
export async function generateDynamicPaymentLink(params: GeneratePaymentLinkParams): Promise<PaymentLinkResult> {
  const { empresaId, title, amount, description, payerEmail, externalReference } = params;
  
  try {
    console.log(`[PaymentLink] Generando link para empresa ${empresaId}, monto: $${amount}`);
    
    // Buscar el seller asociado a la empresa
    const seller = await Seller.findOne({ internalId: empresaId });
    
    if (!seller || !seller.accessToken) {
      console.log(`[PaymentLink] No se encontró seller con MP conectado para empresa ${empresaId}`);
      return {
        success: false,
        error: 'La empresa no tiene Mercado Pago conectado'
      };
    }
    
    // Crear cliente de MP con el token del seller
    const mpClient = new MercadoPagoConfig({
      accessToken: seller.accessToken,
      options: { timeout: 5000 }
    });
    
    const preferenceClient = new Preference(mpClient);
    
    // URLs de retorno
    const backUrls = {
      success: `${MP_MODULE_URL}/payment-links/callback?status=success`,
      failure: `${MP_MODULE_URL}/payment-links/callback?status=failure`,
      pending: `${MP_MODULE_URL}/payment-links/callback?status=pending`
    };
    
    // Crear preferencia
    const preferenceData = await preferenceClient.create({
      body: {
        items: [{
          id: `chatbot-${Date.now()}`,
          title: title,
          quantity: 1,
          unit_price: amount,
          currency_id: 'ARS',
          description: description || ''
        }],
        payer: payerEmail ? { email: payerEmail } : undefined,
        back_urls: backUrls,
        auto_return: 'approved',
        external_reference: externalReference || `chatbot_${empresaId}_${Date.now()}`,
        notification_url: `${MP_MODULE_URL}/webhooks`
      }
    });
    
    console.log(`[PaymentLink] ✅ Preferencia creada: ${preferenceData.id}`);
    
    return {
      success: true,
      paymentUrl: preferenceData.init_point || '',
      preferenceId: preferenceData.id || ''
    };
    
  } catch (error: any) {
    console.error(`[PaymentLink] Error generando link:`, error.message);
    return {
      success: false,
      error: error.message || 'Error al generar el link de pago'
    };
  }
}
