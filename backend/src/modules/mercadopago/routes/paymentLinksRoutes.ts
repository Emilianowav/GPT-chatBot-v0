// 💳 Rutas de Payment Links de Mercado Pago
import { Router, Request, Response } from 'express';
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

export default router;
