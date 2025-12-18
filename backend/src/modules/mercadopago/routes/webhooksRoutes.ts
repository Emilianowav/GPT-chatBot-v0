// 🔔 Rutas de Webhooks de Mercado Pago
import { Router, Request, Response } from 'express';
import { MercadoPagoConfig, Payment as MPPaymentClient } from 'mercadopago';
import { Payment, PaymentStatus, IPayment } from '../models/Payment.js';
import { PaymentLink } from '../models/PaymentLink.js';
import { Seller } from '../models/Seller.js';

const router = Router();

/**
 * POST /webhooks
 * Recibe notificaciones de Mercado Pago
 * Documentación: https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, data, action } = req.body;
    
    console.log(`[MP Webhook] Recibido: type=${type}, action=${action}, data=`, data);
    
    // Responder inmediatamente con 200 para que MP no reintente
    res.status(200).send('OK');
    
    // Procesar según el tipo de notificación
    if (type === 'payment') {
      await processPaymentNotification(data.id);
    } else if (action === 'payment.created' || action === 'payment.updated') {
      await processPaymentNotification(data.id);
    }
    
  } catch (error: any) {
    console.error('[MP Webhook] Error procesando webhook:', error);
    // Siempre responder 200 para evitar reintentos
    res.status(200).send('OK');
  }
});

/**
 * GET /webhooks/test
 * Endpoint de prueba para verificar que el webhook está activo
 */
router.get('/test', (req: Request, res: Response): void => {
  res.json({ 
    status: 'ok', 
    message: 'Webhook endpoint activo',
    timestamp: new Date().toISOString()
  });
});

/**
 * Procesa una notificación de pago
 */
async function processPaymentNotification(paymentId: string): Promise<void> {
  try {
    console.log(`[MP Webhook] Procesando pago ID: ${paymentId}`);
    
    // Verificar si ya existe el pago
    let existingPayment = await Payment.findOne({ mpPaymentId: paymentId });
    
    // Obtener detalles del pago desde MP
    // Necesitamos el access token del marketplace para consultar
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      console.error('[MP Webhook] MP_ACCESS_TOKEN no configurado');
      return;
    }
    
    const mpClient = new MercadoPagoConfig({ 
      accessToken,
      options: { timeout: 5000 }
    });
    const paymentClient = new MPPaymentClient(mpClient);
    
    const mpPayment = await paymentClient.get({ id: paymentId });
    
    if (!mpPayment) {
      console.error(`[MP Webhook] No se encontró el pago ${paymentId} en MP`);
      return;
    }
    
    console.log(`[MP Webhook] Pago obtenido de MP:`, {
      id: mpPayment.id,
      status: mpPayment.status,
      amount: mpPayment.transaction_amount,
      external_reference: mpPayment.external_reference
    });
    
    // Extraer sellerId del collector_id o buscar por external_reference
    let sellerId = mpPayment.collector_id?.toString() || '';
    let paymentLinkId: string | undefined;
    
    // Si hay external_reference con formato "link_XXX", extraer el ID del PaymentLink
    if (mpPayment.external_reference?.startsWith('link_')) {
      paymentLinkId = mpPayment.external_reference.replace('link_', '');
      
      // Buscar el PaymentLink para obtener el sellerId
      const paymentLink = await PaymentLink.findById(paymentLinkId);
      if (paymentLink) {
        sellerId = paymentLink.sellerId;
      }
    }
    
    // Mapear status de MP a nuestro enum
    const status = mapMPStatus(mpPayment.status || 'pending');
    
    // Datos del pago
    const paymentData: Partial<IPayment> = {
      mpPaymentId: paymentId,
      sellerId,
      paymentLinkId,
      externalReference: mpPayment.external_reference,
      status,
      statusDetail: mpPayment.status_detail,
      amount: mpPayment.transaction_amount || 0,
      currency: mpPayment.currency_id || 'ARS',
      paymentMethodId: mpPayment.payment_method_id,
      paymentTypeId: mpPayment.payment_type_id,
      installments: mpPayment.installments,
      payerEmail: mpPayment.payer?.email,
      payerName: mpPayment.payer?.first_name 
        ? `${mpPayment.payer.first_name} ${mpPayment.payer.last_name || ''}`
        : undefined,
      payerPhone: mpPayment.payer?.phone?.number,
      payerDocType: mpPayment.payer?.identification?.type,
      payerDocNumber: mpPayment.payer?.identification?.number,
      dateCreated: mpPayment.date_created ? new Date(mpPayment.date_created) : undefined,
      dateApproved: mpPayment.date_approved ? new Date(mpPayment.date_approved) : undefined,
      dateLastUpdated: mpPayment.date_last_updated ? new Date(mpPayment.date_last_updated) : undefined,
      metadata: mpPayment.metadata
    };
    
    if (existingPayment) {
      // Actualizar pago existente
      await Payment.updateOne(
        { mpPaymentId: paymentId },
        { $set: paymentData }
      );
      console.log(`[MP Webhook] Pago ${paymentId} actualizado: ${status}`);
    } else {
      // Crear nuevo pago
      await Payment.create(paymentData);
      console.log(`[MP Webhook] Pago ${paymentId} creado: ${status}`);
    }
    
    // Si el pago fue aprobado y tiene PaymentLink, actualizar estadísticas
    if (status === PaymentStatus.APPROVED && paymentLinkId) {
      await PaymentLink.updateOne(
        { _id: paymentLinkId },
        { 
          $inc: { 
            totalUses: 1, 
            totalRevenue: mpPayment.transaction_amount || 0 
          } 
        }
      );
      console.log(`[MP Webhook] PaymentLink ${paymentLinkId} actualizado con nuevo pago`);
    }
    
  } catch (error: any) {
    console.error(`[MP Webhook] Error procesando pago ${paymentId}:`, error.message);
  }
}

/**
 * Mapea el status de MP a nuestro enum
 */
function mapMPStatus(mpStatus: string): PaymentStatus {
  const statusMap: Record<string, PaymentStatus> = {
    'pending': PaymentStatus.PENDING,
    'approved': PaymentStatus.APPROVED,
    'authorized': PaymentStatus.AUTHORIZED,
    'in_process': PaymentStatus.IN_PROCESS,
    'in_mediation': PaymentStatus.IN_MEDIATION,
    'rejected': PaymentStatus.REJECTED,
    'cancelled': PaymentStatus.CANCELLED,
    'refunded': PaymentStatus.REFUNDED,
    'charged_back': PaymentStatus.CHARGED_BACK
  };
  
  return statusMap[mpStatus] || PaymentStatus.PENDING;
}

export default router;
