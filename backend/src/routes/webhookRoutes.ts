import { Router } from 'express';
import { MercadoPagoService } from '../services/MercadoPagoService.js';
import WhatsAppService from '../services/WhatsAppService.js';
import { CarritoModel } from '../models/Carrito.js';

const router = Router();

/**
 * Webhook de MercadoPago
 * Recibe notificaciones de pagos aprobados/rechazados/pendientes
 */
router.post('/mercadopago', async (req, res) => {
  try {
    console.log('🔔 [WEBHOOK] MercadoPago notification received');
    console.log('   Body:', JSON.stringify(req.body, null, 2));

    const { type, data, action } = req.body;

    // MercadoPago envía varios tipos de notificaciones
    // Solo procesamos las de tipo "payment"
    if (type !== 'payment' && action !== 'payment.created' && action !== 'payment.updated') {
      console.log(`   ⚠️  Tipo de notificación no es payment (${type}/${action}), ignorando`);
      return res.status(200).send('OK');
    }

    const paymentId = data?.id;
    if (!paymentId) {
      console.log('   ❌ No se encontró payment ID en la notificación');
      return res.status(400).send('Missing payment ID');
    }

    console.log(`   💳 Payment ID: ${paymentId}`);

    // Obtener access token de MercadoPago desde variables de entorno
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      console.error('   ❌ MERCADOPAGO_ACCESS_TOKEN no configurado');
      return res.status(500).send('MercadoPago not configured');
    }

    // Obtener detalles del pago
    const mercadoPagoService = new MercadoPagoService({ accessToken });
    const payment = await mercadoPagoService.obtenerPago(paymentId);

    console.log(`   📊 Payment status: ${payment.status}`);
    console.log(`   📦 External reference: ${payment.external_reference}`);
    console.log(`   💰 Amount: $${payment.transaction_amount}`);

    // Buscar el carrito asociado
    const carritoId = payment.external_reference;
    const carrito = await CarritoModel.findById(carritoId);

    if (!carrito) {
      console.log(`   ⚠️  Carrito ${carritoId} no encontrado`);
      return res.status(404).send('Carrito not found');
    }

    console.log(`   🛒 Carrito encontrado: ${carrito._id}`);
    console.log(`   📞 Teléfono cliente: ${carrito.telefono}`);

    // Actualizar estado del carrito
    carrito.estadoPago = payment.status;
    carrito.mercadoPagoPaymentId = paymentId;
    carrito.fechaPago = payment.date_approved ? new Date(payment.date_approved) : undefined;
    await carrito.save();

    console.log(`   ✅ Carrito actualizado con estado: ${payment.status}`);

    // Enviar mensaje de WhatsApp según el estado
    const whatsappService = new WhatsAppService();
    const telefono = carrito.telefono;

    if (payment.status === 'approved') {
      console.log('   ✅ Pago aprobado, enviando confirmación');

      const itemsList = carrito.items
        .map(item => `📖 ${item.nombre} x${item.cantidad} - $${item.precio}`)
        .join('\n');

      await whatsappService.sendMessage({
        to: telefono,
        message: `¡Pago confirmado! 🎉

Pedido #${payment.id} confirmado

${itemsList}
──────────────────────
💰 Total pagado: $${payment.transaction_amount}

📦 Tu pedido llegará en 2-3 días hábiles

¡Gracias por tu compra! 😊

Cualquier consulta, escribinos por acá.`
      });

      console.log('   ✅ Mensaje de confirmación enviado');

    } else if (payment.status === 'pending') {
      console.log('   ⏳ Pago pendiente');

      await whatsappService.sendMessage({
        to: telefono,
        message: `Tu pago está pendiente ⏳

Pedido #${payment.id}

💰 Monto: $${payment.transaction_amount}

Te avisaremos cuando se confirme el pago.

Si tenés alguna duda, escribinos 😊`
      });

      console.log('   ✅ Mensaje de pendiente enviado');

    } else if (payment.status === 'rejected') {
      console.log('   ❌ Pago rechazado');

      await whatsappService.sendMessage({
        to: telefono,
        message: `Tu pago fue rechazado ❌

Pedido #${payment.id}

Motivo: ${payment.status_detail}

Podés intentar nuevamente o contactarnos para ayudarte 😊

Escribinos si necesitás asistencia.`
      });

      console.log('   ✅ Mensaje de rechazo enviado');

    } else if (payment.status === 'cancelled') {
      console.log('   🚫 Pago cancelado');

      await whatsappService.sendMessage({
        to: telefono,
        message: `Tu pago fue cancelado 🚫

Pedido #${payment.id}

Si querés realizar la compra, escribinos y te ayudamos 😊`
      });

      console.log('   ✅ Mensaje de cancelación enviado');
    }

    // Responder OK a MercadoPago
    res.status(200).send('OK');

  } catch (error: any) {
    console.error('❌ [WEBHOOK] Error procesando notificación:', error);
    console.error('   Stack:', error.stack);
    res.status(500).send('Error processing webhook');
  }
});

/**
 * Endpoint de prueba para verificar que el webhook está funcionando
 */
router.get('/mercadopago/test', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Webhook de MercadoPago está funcionando',
    timestamp: new Date().toISOString()
  });
});

export default router;
