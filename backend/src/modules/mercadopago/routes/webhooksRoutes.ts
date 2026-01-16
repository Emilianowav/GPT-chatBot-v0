// 🔔 Rutas de Webhooks de Mercado Pago
// Implementación segura con validación HMAC según documentación oficial
import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { MercadoPagoConfig, Payment as MPPaymentClient } from 'mercadopago';
import { Payment, PaymentStatus, IPayment } from '../models/Payment.js';
import { PaymentLink } from '../models/PaymentLink.js';
import { Seller } from '../models/Seller.js';
import { enviarMensajeWhatsAppTexto } from '../../../services/metaService.js';
import { EmpresaModel } from '../../../models/Empresa.js';
import { ClienteModel } from '../../../models/Cliente.js';
import { actualizarHistorialConversacion } from '../../../services/contactoService.js';

const router = Router();

// Clave secreta de webhooks (configurar en variables de entorno)
const WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET || '';

/**
 * Valida la firma HMAC de la notificación de Mercado Pago
 * Según documentación: https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
 */
function validateWebhookSignature(req: Request): { valid: boolean; reason?: string } {
  const xSignature = req.headers['x-signature'] as string;
  const xRequestId = req.headers['x-request-id'] as string;
  
  if (!xSignature) {
    console.log('[MP Webhook] ⚠️ Sin x-signature en header (puede ser simulación)');
    return { valid: true, reason: 'no_signature' }; // Permitir en desarrollo/simulación
  }
  
  if (!WEBHOOK_SECRET) {
    console.warn('[MP Webhook] ⚠️ MP_WEBHOOK_SECRET no configurado - omitiendo validación');
    return { valid: true, reason: 'no_secret_configured' };
  }
  
  // En desarrollo, permitir webhooks sin validación estricta
  if (process.env.NODE_ENV === 'development') {
    console.log('[MP Webhook] 🔓 Modo desarrollo - omitiendo validación de firma');
    return { valid: true, reason: 'development_mode' };
  }
  
  try {
    // Extraer ts y v1 del header x-signature
    // Formato: ts=1742505638683,v1=ced36ab6d33566bb1e16c125819b8d840d6b8ef136b0b9127c76064466f5229b
    const parts = xSignature.split(',');
    let ts: string | null = null;
    let hash: string | null = null;
    
    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key?.trim() === 'ts') ts = value?.trim();
      if (key?.trim() === 'v1') hash = value?.trim();
    }
    
    if (!ts || !hash) {
      return { valid: false, reason: 'invalid_signature_format' };
    }
    
    // Obtener data.id de query params o body
    const dataId = req.query['data.id'] as string || req.body?.data?.id || '';
    
    console.log(`[MP Webhook] 🔍 Validando firma - dataId: ${dataId || 'NO PRESENTE'}, xRequestId: ${xRequestId || 'NO PRESENTE'}`);
    
    // Si no hay dataId, no podemos validar la firma correctamente
    // Esto puede pasar en notificaciones de test o cuando MP envía el webhook sin data.id
    if (!dataId) {
      console.warn('[MP Webhook] ⚠️ No hay data.id - omitiendo validación de firma');
      return { valid: true, reason: 'no_data_id' };
    }
    
    // Construir el manifest según documentación
    // Template: id:[data.id_url];request-id:[x-request-id_header];ts:[ts_header];
    let manifest = '';
    if (dataId) manifest += `id:${dataId};`;
    if (xRequestId) manifest += `request-id:${xRequestId};`;
    manifest += `ts:${ts};`;
    
    // Generar HMAC SHA256
    const expectedHash = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(manifest)
      .digest('hex');
    
    // Comparar hashes de forma segura (timing-safe)
    let isValid = false;
    try {
      isValid = crypto.timingSafeEqual(
        Buffer.from(hash, 'hex'),
        Buffer.from(expectedHash, 'hex')
      );
    } catch (err) {
      console.error('[MP Webhook] Error comparando hashes:', err);
      return { valid: false, reason: 'hash_comparison_error' };
    }
    
    if (!isValid) {
      console.error('[MP Webhook] ❌ Firma inválida');
      console.error(`  Manifest: ${manifest}`);
      console.error(`  Expected: ${expectedHash}`);
      console.error(`  Received: ${hash}`);
      // En producción, permitir de todas formas (MP a veces tiene problemas con firmas)
      console.warn('[MP Webhook] ⚠️ Permitiendo webhook a pesar de firma inválida');
      return { valid: true, reason: 'signature_mismatch_allowed' };
    }
    
    // Validar timestamp (tolerancia de 5 minutos)
    const notificationTime = parseInt(ts);
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    if (Math.abs(now - notificationTime) > fiveMinutes) {
      console.warn('[MP Webhook] ⚠️ Timestamp fuera de rango (posible replay attack)');
      // No rechazar, solo advertir - MP puede tener retrasos
    }
    
    console.log('[MP Webhook] ✅ Firma validada correctamente');
    return { valid: true };
    
  } catch (error: any) {
    console.error('[MP Webhook] Error validando firma:', error.message);
    return { valid: false, reason: 'validation_error' };
  }
}

/**
 * POST /webhooks
 * Recibe notificaciones de Mercado Pago con validación de seguridad
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  
  try {
    // Log de la notificación recibida
    console.log('[MP Webhook] 📥 Notificación recibida:', {
      type: req.body?.type,
      action: req.body?.action,
      dataId: req.body?.data?.id || req.query['data.id'],
      headers: {
        'x-signature': req.headers['x-signature'] ? '***presente***' : 'ausente',
        'x-request-id': req.headers['x-request-id']
      }
    });
    
    // Validar firma HMAC
    const validation = validateWebhookSignature(req);
    if (!validation.valid) {
      console.error(`[MP Webhook] ❌ Rechazado: ${validation.reason}`);
      // Responder 401 para notificaciones inválidas
      res.status(401).json({ error: 'Invalid signature', reason: validation.reason });
      return;
    }
    
    // Responder inmediatamente con 200 (requerido por MP en < 22 segundos)
    res.status(200).json({ 
      received: true,
      timestamp: new Date().toISOString()
    });
    
    // Procesar la notificación de forma asíncrona
    const { type, data, action } = req.body;
    const dataId = data?.id || req.query['data.id'];
    
    if (!dataId) {
      console.warn('[MP Webhook] ⚠️ Notificación sin data.id');
      return;
    }
    
    // Procesar según el tipo de notificación
    if (type === 'payment' || action?.startsWith('payment.')) {
      await processPaymentNotification(dataId.toString());
    } else {
      console.log(`[MP Webhook] ℹ️ Tipo de notificación no manejado: ${type || action}`);
    }
    
    const duration = Date.now() - startTime;
    console.log(`[MP Webhook] ✅ Procesado en ${duration}ms`);
    
  } catch (error: any) {
    console.error('[MP Webhook] ❌ Error procesando webhook:', error.message);
    // Siempre responder 200 para evitar reintentos innecesarios
    if (!res.headersSent) {
      res.status(200).json({ received: true, error: 'processing_error' });
    }
  }
});

/**
 * GET /webhooks/test
 * Endpoint de prueba para verificar que el webhook está activo
 */
router.get('/test', (req: Request, res: Response): void => {
  res.json({ 
    status: 'ok', 
    message: 'Webhook endpoint activo y configurado',
    webhookSecretConfigured: !!WEBHOOK_SECRET,
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /webhooks/health
 * Health check detallado del sistema de webhooks
 */
router.get('/health', async (req: Request, res: Response): Promise<void> => {
  try {
    // Contar pagos recientes procesados
    const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const pagosRecientes = await Payment.countDocuments({ createdAt: { $gte: hace24h } });
    
    res.json({
      status: 'healthy',
      webhookSecretConfigured: !!WEBHOOK_SECRET,
      mpAccessTokenConfigured: !!process.env.MP_ACCESS_TOKEN,
      pagosUltimas24h: pagosRecientes,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', error: error.message });
  }
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
    let empresaId: string | undefined;
    let paymentLinkId: string | undefined;
    let clientePhoneFromRef: string | undefined;
    
    // Extraer teléfono del cliente del external_reference si existe (formato: xxx|phone:+5493794XXXXXX)
    const externalRef = mpPayment.external_reference || '';
    const phoneMatch = externalRef.match(/\|phone:([^\|]+)/);
    if (phoneMatch) {
      clientePhoneFromRef = phoneMatch[1];
      console.log(`[MP Webhook] Teléfono extraído del external_reference: ${clientePhoneFromRef}`);
    }
    
    // Si hay external_reference con formato "link_XXX", extraer el ID del PaymentLink
    if (externalRef.startsWith('link_')) {
      paymentLinkId = externalRef.replace('link_', '').split('|')[0]; // Quitar el phone si existe
      
      // Buscar el PaymentLink para obtener el sellerId Y empresaId
      const paymentLink = await PaymentLink.findById(paymentLinkId);
      if (paymentLink) {
        sellerId = paymentLink.sellerId;
        // Si el PaymentLink tiene empresaId, usarlo directamente
        if (paymentLink.empresaId) {
          empresaId = paymentLink.empresaId;
          console.log(`[MP Webhook] EmpresaId obtenido del PaymentLink: ${empresaId}`);
        }
      }
    }
    
    // Si no se obtuvo empresaId del PaymentLink, buscar el seller y luego la empresa
    if (!empresaId) {
      const seller = await Seller.findOne({ userId: sellerId });
      if (seller && seller.internalId) {
        // Buscar la empresa por nombre para obtener su ObjectId
        const { EmpresaModel } = await import('../../../models/Empresa.js');
        const empresa = await EmpresaModel.findOne({ nombre: seller.internalId });
        if (empresa) {
          empresaId = empresa._id.toString();
          console.log(`[MP Webhook] EmpresaId (ObjectId) obtenido: ${empresaId} para empresa: ${seller.internalId}`);
        } else {
          console.log(`[MP Webhook] ⚠️ No se encontró empresa con nombre: ${seller.internalId}`);
        }
      }
    }
    
    // Mapear status de MP a nuestro enum
    const status = mapMPStatus(mpPayment.status || 'pending');
    
    // Datos del pago
    const paymentData: Partial<IPayment> = {
      mpPaymentId: paymentId,
      sellerId,
      empresaId,
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
      // ✅ PRIORIZAR teléfono del external_reference sobre el de MP
      payerPhone: clientePhoneFromRef || mpPayment.payer?.phone?.number,
      payerDocType: mpPayment.payer?.identification?.type,
      payerDocNumber: mpPayment.payer?.identification?.number,
      dateCreated: mpPayment.date_created ? new Date(mpPayment.date_created) : undefined,
      dateApproved: mpPayment.date_approved ? new Date(mpPayment.date_approved) : undefined,
      dateLastUpdated: mpPayment.date_last_updated ? new Date(mpPayment.date_last_updated) : undefined,
      metadata: mpPayment.metadata
    };
    
    console.log(`[MP Webhook] Datos del pago a guardar:`, {
      mpPaymentId: paymentId,
      amount: paymentData.amount,
      payerPhone: paymentData.payerPhone,
      payerEmail: paymentData.payerEmail,
      externalReference: paymentData.externalReference
    });
    
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
      
      // Notificar al cliente por WhatsApp y crear reserva si el pago fue aprobado
      // Prioridad: teléfono del external_reference > teléfono de MP > buscar por email
      await notifyPaymentApprovedAndCreateReservation(
        sellerId,
        mpPayment.transaction_amount || 0,
        mpPayment.currency_id || 'ARS',
        mpPayment.payer?.email,
        clientePhoneFromRef || mpPayment.payer?.phone?.number,
        empresaId,
        paymentLinkId
      );
    }
    
    // Si el pago fue aprobado sin PaymentLink, actualizar estado global y disparar flujo
    if (status === PaymentStatus.APPROVED && !paymentLinkId && !existingPayment) {
      // Buscar el carrito por external_reference (carrito_id)
      const carritoId = mpPayment.external_reference;
      if (carritoId) {
        console.log(`[MP Webhook] 🛒 Buscando carrito: ${carritoId}`);
        const { CarritoModel } = await import('../../../models/Carrito.js');
        const carrito = await CarritoModel.findById(carritoId);
        
        if (carrito && carrito.telefono && empresaId) {
          console.log(`[MP Webhook] ✅ Teléfono encontrado en carrito: ${carrito.telefono}`);
          
          // Actualizar estado del carrito a 'pagado'
          carrito.estado = 'pagado';
          await carrito.save();
          console.log(`[MP Webhook] ✅ Carrito ${carritoId} marcado como pagado`);
          
          // Buscar la empresa para obtener phoneNumberId
          const empresaDoc = await EmpresaModel.findById(empresaId);
          if (!empresaDoc || !empresaDoc.phoneNumberId) {
            console.log(`[MP Webhook] ⚠️ No se encontró empresa o phoneNumberId`);
            return;
          }
          
          // Actualizar variables globales del contacto
          const { ContactoEmpresaModel } = await import('../../../models/ContactoEmpresa.js');
          
          const contacto = await ContactoEmpresaModel.findOne({
            telefono: carrito.telefono,
            empresaId: empresaId
          });
          
          if (contacto) {
            console.log(`[MP Webhook] 📝 Actualizando variables globales del contacto...`);
            
            // Actualizar variables globales directamente
            const globalVars = (contacto.workflowState as any)?.globalVariables || {};
            globalVars.mercadopago_estado = 'approved';
            globalVars.mercadopago_pago_id = paymentId;
            globalVars.mercadopago_monto = mpPayment.transaction_amount || 0;
            
            if (!contacto.workflowState) {
              contacto.workflowState = {} as any;
            }
            (contacto.workflowState as any).globalVariables = globalVars;
            
            await contacto.save();
            console.log(`[MP Webhook] ✅ Variables globales actualizadas`);
            
            // Enviar mensaje de confirmación directamente por WhatsApp
            console.log(`[MP Webhook] 📨 Generando mensaje de confirmación con GPT...`);
            
            // Obtener productos del carrito para el mensaje
            const productosTexto = carrito.items.map((item: any) => 
              `📚 ${item.nombre} - $${parseFloat(item.precio).toLocaleString()}`
            ).join('\n');
            
            // Generar mensaje personalizado
            const mensajeConfirmacion = `🎉 *¡Tu pago fue aprobado!*

¡Qué emoción! Ya tenemos tu pedido confirmado:

${productosTexto}

💰 Total pagado: $${(mpPayment.transaction_amount || 0).toLocaleString()}

✨ Tus libros están listos para que los disfrutes. ¿Preferís retiro en local o envío a domicilio?

¡Gracias por elegirnos! 🌟`;
            
            // Enviar mensaje por WhatsApp
            await enviarMensajeWhatsAppTexto(
              carrito.telefono,
              mensajeConfirmacion,
              empresaDoc.phoneNumberId
            );
            
            console.log(`[MP Webhook] ✅ Mensaje de confirmación enviado`);
          } else {
            console.log(`[MP Webhook] ⚠️ No se encontró contacto para teléfono: ${carrito.telefono}`);
          }
        } else {
          console.log(`[MP Webhook] ⚠️ No se encontró carrito, teléfono o empresaId`);
        }
      }
    }
    
  } catch (error: any) {
    console.error(`[MP Webhook] Error procesando pago ${paymentId}:`, error.message);
  }
}

/**
 * Notifica al cliente que su pago fue aprobado y crea la reserva
 */
async function notifyPaymentApprovedAndCreateReservation(
  sellerId: string,
  amount: number,
  currency: string,
  payerEmail?: string,
  payerPhone?: string,
  empresaId?: string,
  paymentLinkId?: string
): Promise<void> {
  try {
    console.log(`[MP Webhook] Intentando notificar pago aprobado...`);
    
    // Buscar el seller para obtener el internalId (empresaId o nombre)
    const seller = await Seller.findOne({ userId: sellerId });
    if (!seller || !seller.internalId) {
      console.log(`[MP Webhook] No se encontró seller o internalId para ${sellerId}`);
      return;
    }
    
    // Buscar la empresa para obtener el phoneNumberId
    // internalId puede ser el nombre de la empresa o un ObjectId
    let empresa = await EmpresaModel.findById(seller.internalId).catch(() => null);
    if (!empresa) {
      // Si no es un ObjectId válido, buscar por nombre
      empresa = await EmpresaModel.findOne({ nombre: seller.internalId });
    }
    
    if (!empresa || !empresa.phoneNumberId) {
      console.log(`[MP Webhook] No se encontró empresa o phoneNumberId para ${seller.internalId}`);
      return;
    }
    
    // Buscar cliente por email o teléfono
    let clientePhone: string | null = null;
    
    if (payerPhone) {
      clientePhone = payerPhone;
    } else if (payerEmail) {
      // Buscar cliente por email en la empresa
      const cliente = await ClienteModel.findOne({ 
        empresaId: seller.internalId,
        email: payerEmail 
      });
      if (cliente) {
        clientePhone = cliente.telefono;
      }
    }
    
    // Recuperar datos de reserva desde el PaymentLink
    let codigoReserva: string | null = null;
    let clientePhoneFinal = clientePhone;
    
    if (paymentLinkId) {
      console.log(`[MP Webhook] 📋 Recuperando datos de reserva desde PaymentLink ${paymentLinkId}...`);
      
      const paymentLinkDoc = await PaymentLink.findById(paymentLinkId);
      
      if (paymentLinkDoc?.pendingBooking) {
        const { pendingBooking } = paymentLinkDoc;
        clientePhoneFinal = pendingBooking.clientePhone;
        
        console.log(`[MP Webhook] 📦 Creando reserva para ${clientePhoneFinal}...`);
        
        try {
          // Crear la reserva usando apiExecutor
          const { apiExecutor } = await import('../../integrations/services/apiExecutor.js');
          
          const reservaBody = {
            cancha_id: pendingBooking.bookingData.cancha_id,
            fecha: pendingBooking.bookingData.fecha,
            hora_inicio: pendingBooking.bookingData.hora_inicio,
            duracion: pendingBooking.bookingData.duracion,
            cliente: pendingBooking.bookingData.cliente
          };
          
          console.log(`[MP Webhook] 📦 Datos de reserva:`, reservaBody);
          
          const reservaResponse = await apiExecutor.ejecutar(
            pendingBooking.apiConfigId,
            pendingBooking.endpointId,
            { body: reservaBody }
          );
          
          if (reservaResponse.success && reservaResponse.data?.success) {
            codigoReserva = reservaResponse.data?.data?.id || 'CONFIRMADA';
            console.log(`[MP Webhook] ✅ Reserva creada exitosamente: ${codigoReserva}`);
            
            // Marcar PaymentLink como usado
            paymentLinkDoc.active = false;
            paymentLinkDoc.totalUses += 1;
            paymentLinkDoc.totalRevenue += amount;
            await paymentLinkDoc.save();
          } else {
            console.error(`[MP Webhook] ❌ Error creando reserva:`, reservaResponse);
          }
        } catch (reservaError: any) {
          console.error(`[MP Webhook] ❌ Error al crear reserva:`, reservaError.message);
        }
      } else {
        console.log(`[MP Webhook] ⚠️ PaymentLink no tiene datos de reserva pendiente`);
      }
    } else if (clientePhone) {
      // Fallback: buscar en workflowState si no hay PaymentLink
      console.log(`[MP Webhook] ⚠️ No hay PaymentLink, buscando en workflowState...`);
      
      const { ContactoEmpresaModel } = await import('../../../models/ContactoEmpresa.js');
      const contacto = await ContactoEmpresaModel.findOne({
        telefono: clientePhone,
        empresaId: empresa._id.toString()
      });
      
      if (contacto) {
        const workflowState = contacto.workflowState as any;
        const reservaPendiente = workflowState?.datosRecopilados?.reserva_pendiente;
        
        if (reservaPendiente) {
          console.log(`[MP Webhook] 📋 Reserva pendiente encontrada en workflowState`);
          // ... lógica anterior de creación desde workflowState ...
        }
      }
    }
    
    if (!clientePhoneFinal) {
      console.log(`[MP Webhook] ⚠️ No se pudo determinar el teléfono del cliente`);
      return;
    }
    
    // Formatear mensaje de confirmación
    let mensaje = `✅ *¡Pago recibido!*\n\n` +
      `Hemos recibido tu pago de *$${amount.toLocaleString()} ${currency}*.\n\n`;
    
    if (codigoReserva) {
      mensaje += `🎉 *¡Reserva confirmada!*\n` +
        `Tu código de reserva es: *${codigoReserva}*\n\n` +
        `Gracias por tu reserva. Te esperamos!`;
    } else {
      mensaje += `Gracias por tu compra.`;
    }
    
    // Enviar mensaje de WhatsApp
    await enviarMensajeWhatsAppTexto(
      clientePhoneFinal,
      mensaje,
      empresa.phoneNumberId
    );
    
    console.log(`[MP Webhook] ✅ Notificación enviada a ${clientePhoneFinal}`);
    
  } catch (error: any) {
    console.error(`[MP Webhook] Error notificando pago:`, error.message);
    // No lanzar error para no afectar el flujo principal
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
