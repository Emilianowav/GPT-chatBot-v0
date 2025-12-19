// 💳 Rutas de Payment Links de Mercado Pago
import { Router, Request, Response } from 'express';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import paymentLinksService from '../services/paymentLinksService.js';
import { Seller } from '../models/Seller.js';

const router = Router();

/**
 * GET /payment-links?sellerId=xxx
 * Lista todos los links de un vendedor
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sellerId } = req.query;
    
    if (!sellerId || typeof sellerId !== 'string') {
      res.status(400).json({ error: 'sellerId es requerido' });
      return;
    }

    const links = await paymentLinksService.getLinksBySeller(sellerId);
    
    // Agregar paymentUrl a cada link
    const baseUrl = process.env.MP_MODULE_URL || `${req.protocol}://${req.get('host')}`;
    const linksWithUrl = links.map(link => ({
      id: link._id,
      slug: link.slug,
      title: link.title,
      description: link.description,
      unitPrice: link.unitPrice,
      priceType: link.priceType,
      currency: link.currency,
      active: link.active,
      totalUses: link.totalUses,
      totalRevenue: link.totalRevenue,
      paymentUrl: `${baseUrl}/api/modules/mercadopago/payment-links/pay/${link.slug}`,
      createdAt: link.createdAt
    }));

    res.json({ success: true, links: linksWithUrl });
  } catch (error: any) {
    console.error('[MP] Error listando payment links:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /payment-links
 * Crea un nuevo link de pago
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sellerId, title, unitPrice, description, priceType } = req.body;

    if (!sellerId || !title || !unitPrice) {
      res.status(400).json({ 
        error: 'Campos requeridos: sellerId, title, unitPrice' 
      });
      return;
    }

    // Verificar que el vendedor existe
    const seller = await Seller.findOne({ userId: sellerId });
    if (!seller) {
      res.status(404).json({ 
        error: 'Vendedor no encontrado. Debe conectar su cuenta de MP primero.' 
      });
      return;
    }

    const link = await paymentLinksService.createPaymentLink({
      sellerId,
      title,
      unitPrice: Number(unitPrice),
      description,
      priceType: priceType || 'fixed'
    });

    const baseUrl = process.env.MP_MODULE_URL || `${req.protocol}://${req.get('host')}`;
    
    res.status(201).json({ 
      success: true, 
      link: {
        id: link._id,
        slug: link.slug,
        title: link.title,
        unitPrice: link.unitPrice,
        priceType: link.priceType,
        active: link.active,
        paymentUrl: `${baseUrl}/api/modules/mercadopago/payment-links/pay/${link.slug}`
      }
    });
  } catch (error: any) {
    console.error('[MP] Error creando payment link:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /payment-links/:id
 * Obtiene un link por ID o slug
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const link = await paymentLinksService.getLinkByIdOrSlug(req.params.id);
    
    if (!link) {
      res.status(404).json({ error: 'Link no encontrado' });
      return;
    }

    res.json({ success: true, link });
  } catch (error: any) {
    console.error('[MP] Error obteniendo payment link:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /payment-links/:id
 * Actualiza un link de pago existente
 */
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, unitPrice, description, priceType, active } = req.body;
    
    const link = await paymentLinksService.getLinkByIdOrSlug(req.params.id);
    
    if (!link) {
      res.status(404).json({ error: 'Link no encontrado' });
      return;
    }

    // Actualizar campos
    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (unitPrice !== undefined) updates.unitPrice = Number(unitPrice);
    if (description !== undefined) updates.description = description;
    if (priceType !== undefined) updates.priceType = priceType;
    if (active !== undefined) updates.active = active;

    const updatedLink = await paymentLinksService.updatePaymentLink(req.params.id, updates);
    
    if (!updatedLink) {
      res.status(404).json({ error: 'Link no encontrado' });
      return;
    }

    const baseUrl = process.env.MP_MODULE_URL || `${req.protocol}://${req.get('host')}`;
    
    res.json({ 
      success: true, 
      link: {
        id: updatedLink._id,
        slug: updatedLink.slug,
        title: updatedLink.title,
        unitPrice: updatedLink.unitPrice,
        priceType: updatedLink.priceType,
        description: updatedLink.description,
        active: updatedLink.active,
        paymentUrl: `${baseUrl}/api/modules/mercadopago/payment-links/pay/${updatedLink.slug}`
      }
    });
  } catch (error: any) {
    console.error('[MP] Error actualizando payment link:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /payment-links/:id
 * Elimina un link de pago
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const deleted = await paymentLinksService.deletePaymentLink(req.params.id);
    
    if (!deleted) {
      res.status(404).json({ error: 'Link no encontrado' });
      return;
    }

    res.json({ success: true, message: 'Link eliminado' });
  } catch (error: any) {
    console.error('[MP] Error eliminando payment link:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /payment-links/pay/:slug
 * Crea una preferencia de MP y redirige al checkout
 */
router.get('/pay/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    
    // Buscar el link por slug
    const link = await paymentLinksService.getLinkByIdOrSlug(slug);
    
    if (!link) {
      res.status(404).send(`
        <html>
          <head><title>Link no encontrado</title></head>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1>❌ Link no encontrado</h1>
            <p>El link de pago que buscas no existe o fue eliminado.</p>
          </body>
        </html>
      `);
      return;
    }
    
    if (!link.active) {
      res.status(400).send(`
        <html>
          <head><title>Link inactivo</title></head>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1>⚠️ Link inactivo</h1>
            <p>Este link de pago ya no está disponible.</p>
          </body>
        </html>
      `);
      return;
    }
    
    // Buscar el seller para obtener el access_token
    const seller = await Seller.findOne({ userId: link.sellerId });
    
    if (!seller || !seller.accessToken) {
      res.status(400).send(`
        <html>
          <head><title>Error de configuración</title></head>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1>⚠️ Error de configuración</h1>
            <p>El vendedor no tiene configurada su cuenta de Mercado Pago.</p>
          </body>
        </html>
      `);
      return;
    }
    
    // Crear cliente de MP con el access_token del vendedor
    const sellerClient = new MercadoPagoConfig({
      accessToken: seller.accessToken,
      options: { timeout: 5000 }
    });
    
    const preference = new Preference(sellerClient);
    
    // Construir baseUrl - usar variable de entorno o URL de producción
    const baseUrl = process.env.BACKEND_URL || process.env.MP_MODULE_URL || 'https://gpt-chatbot-v0.onrender.com';
    const callbackBase = `${baseUrl}/api/modules/mercadopago/payment-links/callback`;
    
    console.log(`[MP] Creando preferencia con baseUrl: ${baseUrl}`);
    
    const preferenceData = await preference.create({
      body: {
        items: [
          {
            id: link._id.toString(),
            title: link.title,
            description: link.description || link.title,
            quantity: 1,
            unit_price: link.unitPrice,
            currency_id: link.currency || 'ARS'
          }
        ],
        back_urls: {
          success: `${callbackBase}?status=success&link=${slug}`,
          failure: `${callbackBase}?status=failure&link=${slug}`,
          pending: `${callbackBase}?status=pending&link=${slug}`
        },
        auto_return: 'approved',
        external_reference: `link_${link._id}`
      }
    });
    
    // Redirigir al checkout de MP
    const checkoutUrl = preferenceData.init_point || preferenceData.sandbox_init_point;
    
    if (!checkoutUrl) {
      throw new Error('No se pudo obtener URL de checkout');
    }
    
    console.log(`[MP] Redirigiendo a checkout: ${checkoutUrl}`);
    res.redirect(checkoutUrl);
    
  } catch (error: any) {
    console.error('[MP] Error creando preferencia:', error);
    res.status(500).send(`
      <html>
        <head><title>Error</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>❌ Error al procesar el pago</h1>
          <p>${error.message}</p>
        </body>
      </html>
    `);
  }
});

/**
 * GET /payment-links/callback
 * Callback después del pago
 */
router.get('/callback', async (req: Request, res: Response): Promise<void> => {
  const { status, link } = req.query;
  
  console.log(`[MP Callback] Status: ${status}, Link: ${link}`);
  
  let message = '';
  let icon = '';
  
  switch (status) {
    case 'success':
      message = '¡Pago realizado con éxito!';
      icon = '✅';
      // Incrementar contador de usos
      if (link) {
        try {
          const paymentLink = await paymentLinksService.getLinkByIdOrSlug(link as string);
          if (paymentLink) {
            await paymentLinksService.incrementLinkUsage(paymentLink._id.toString(), paymentLink.unitPrice);
            console.log(`[MP Callback] Contador incrementado para link: ${link}`);
          } else {
            console.warn(`[MP Callback] Link no encontrado: ${link}`);
          }
        } catch (err: any) {
          console.error(`[MP Callback] Error incrementando contador:`, err.message);
        }
      }
      break;
    case 'failure':
      message = 'El pago no pudo ser procesado.';
      icon = '❌';
      break;
    case 'pending':
      message = 'Tu pago está pendiente de confirmación.';
      icon = '⏳';
      break;
    default:
      message = 'Estado del pago desconocido.';
      icon = '❓';
  }
  
  res.send(`
    <html>
      <head>
        <title>Resultado del pago</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
          .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); max-width: 400px; margin: 0 auto; }
          .icon { font-size: 64px; margin-bottom: 20px; }
          h1 { color: #333; margin-bottom: 10px; }
          p { color: #666; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">${icon}</div>
          <h1>${message}</h1>
          <p>Gracias por tu compra.</p>
        </div>
      </body>
    </html>
  `);
});

export default router;
