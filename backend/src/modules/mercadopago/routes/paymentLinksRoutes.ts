// 💳 Rutas de Payment Links de Mercado Pago
import { Router, Request, Response } from 'express';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import paymentLinksService from '../services/paymentLinksService.js';
import { Seller } from '../models/Seller.js';
import { EmpresaModel } from '../../../models/Empresa.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

/**
 * GET /payment-links?empresaId=xxx
 * Lista todos los links de una empresa
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { empresaId } = req.query;
    
    if (!empresaId || typeof empresaId !== 'string') {
      res.status(400).json({ error: 'empresaId es requerido' });
      return;
    }

    console.log(`📋 [Payment Links] Buscando links para empresaId: "${empresaId}"`);

    // Primero buscar la empresa para obtener su nombre
    const empresa = await EmpresaModel.findById(empresaId).catch(() => null);
    
    if (!empresa) {
      console.log(`📋 [Payment Links] Empresa no encontrada con ID: "${empresaId}"`);
      res.json({ success: true, links: [] });
      return;
    }

    console.log(`📋 [Payment Links] Empresa encontrada: ${empresa.nombre}`);

    // Buscar el seller por nombre de empresa (internalId)
    const seller = await Seller.findOne({ internalId: empresa.nombre });

    if (!seller) {
      console.log(`📋 [Payment Links] No hay seller para empresa "${empresa.nombre}"`);
      res.json({ success: true, links: [] });
      return;
    }

    console.log(`📋 [Payment Links] Seller encontrado:`, { internalId: seller.internalId, userId: seller.userId });

    const links = await paymentLinksService.getLinksBySeller(seller.userId);
    
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
    const { sellerId, title, unitPrice, description, priceType, category } = req.body;

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
      priceType: priceType || 'fixed',
      category: category || 'services'
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
 * Redirige al checkout de Mercado Pago para un link de pago
 * Query params opcionales:
 * - phone: Teléfono del cliente (se incluye en external_reference para notificaciones)
 * - name: Nombre del cliente (opcional)
 */
router.get('/pay/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const { phone, name } = req.query;
    
    console.log(`[MP] Procesando pago para slug: ${slug}, phone: ${phone || 'no proporcionado'}`);
    
    // Buscar el link por slug
    const link = await paymentLinksService.getLinkByIdOrSlug(slug);
    
    // Si no hay teléfono, mostrar formulario de captura
    if (!phone) {
      const formPath = path.join(__dirname, '../views/paymentForm.html');
      let html = fs.readFileSync(formPath, 'utf-8');
      
      // Reemplazar placeholders
      html = html.replace('{{TITLE}}', link?.title || 'Pago');
      html = html.replace('{{DESCRIPTION}}', link?.description || 'Completa tus datos para continuar');
      html = html.replace('{{PRICE}}', link?.unitPrice.toLocaleString('es-AR') || '0');
      
      res.send(html);
      return;
    }
    
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
    
    // Construir external_reference con teléfono si está disponible
    let externalReference = `link_${link._id}`;
    if (phone && typeof phone === 'string') {
      externalReference += `|phone:${phone}`;
      console.log(`[MP] Teléfono incluido en external_reference: ${phone}`);
    }
    
    console.log(`[MP] Creando preferencia con baseUrl: ${baseUrl}`);
    console.log(`[MP] External reference: ${externalReference}`);
    
    // Buscar empresa para statement_descriptor
    const { EmpresaModel } = await import('../../../models/Empresa.js');
    let statementDescriptor = 'MOMENTO IA';
    
    try {
      let empresa = await EmpresaModel.findById(seller.internalId).catch(() => null);
      if (!empresa) {
        empresa = await EmpresaModel.findOne({ nombre: seller.internalId });
      }
      if (empresa) {
        // Generar statement descriptor optimizado (max 22 chars)
        const empresaClean = empresa.nombre
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-zA-Z0-9\s]/g, '')
          .trim()
          .toUpperCase()
          .substring(0, 22);
        statementDescriptor = empresaClean;
      }
    } catch (err) {
      console.log('[MP] No se pudo obtener empresa para statement_descriptor');
    }
    
    const preferenceData = await preference.create({
      body: {
        items: [
          {
            id: link._id.toString(),
            title: link.title,
            description: link.description || link.title,
            category_id: link.category || 'services',
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
        external_reference: externalReference,
        statement_descriptor: statementDescriptor,
        payer: name && typeof name === 'string' ? {
          name: name
        } : undefined
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
  
  // URL institucional para volver (configurable por variable de entorno)
  const institutionalUrl = process.env.INSTITUTIONAL_URL || process.env.FRONTEND_URL || 'https://bot-crm-mu.vercel.app';
  
  res.send(`
    <html>
      <head>
        <title>Resultado del pago</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            text-align: center; 
            padding: 20px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .card { 
            background: white; 
            padding: 40px; 
            border-radius: 16px; 
            box-shadow: 0 20px 60px rgba(0,0,0,0.3); 
            max-width: 450px; 
            width: 100%;
          }
          .icon { font-size: 72px; margin-bottom: 20px; }
          h1 { color: #1e293b; margin-bottom: 12px; font-size: 24px; }
          p { color: #64748b; line-height: 1.6; margin-bottom: 24px; }
          .btn-home {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 8px;
            font-weight: 600;
            transition: all 0.2s;
            margin-top: 8px;
          }
          .btn-home:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
          }
          .whatsapp-notice {
            background: #f0fdf4;
            border-left: 4px solid #22c55e;
            padding: 16px;
            margin-top: 24px;
            border-radius: 4px;
            text-align: left;
          }
          .whatsapp-notice p {
            color: #166534;
            font-size: 14px;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 8px;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">${icon}</div>
          <h1>${message}</h1>
          <p>Gracias por tu compra. ${status === 'success' ? 'Recibirás una confirmación por WhatsApp en breve.' : ''}</p>
          
          ${status === 'success' ? `
            <div class="whatsapp-notice">
              <p>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                </svg>
                Te enviaremos los detalles de tu compra por WhatsApp
              </p>
            </div>
          ` : ''}
          
          <a href="${institutionalUrl}" class="btn-home">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Volver al inicio
          </a>
        </div>
      </body>
    </html>
  `);
});

export default router;
