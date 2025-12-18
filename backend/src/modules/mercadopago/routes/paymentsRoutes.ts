// 💳 Rutas de Pagos de Mercado Pago
import { Router } from 'express';
import * as mpService from '../services/mercadopagoService.js';
import * as sellersService from '../services/sellersService.js';

const router = Router();

/**
 * POST /payments/create-preference
 * Crea una preferencia de pago simple (sin split)
 */
router.post('/create-preference', async (req, res) => {
  const { items, payer, backUrls, externalReference } = req.body;
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'items is required and must be an array' });
    return;
  }
  
  try {
    const preference = await mpService.createPreference({
      items,
      payer,
      backUrls,
      externalReference,
    });
    
    res.json({
      success: true,
      preference,
    });
  } catch (err: any) {
    console.error('❌ [MP Payments] Error creando preferencia:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /payments/create-split-preference
 * Crea una preferencia de pago con Split Payment (Marketplace)
 */
router.post('/create-split-preference', async (req, res) => {
  const { sellerId, items, payer, backUrls, externalReference, marketplaceFee } = req.body;
  
  if (!sellerId) {
    res.status(400).json({ error: 'sellerId is required' });
    return;
  }
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'items is required and must be an array' });
    return;
  }
  
  try {
    const seller = await sellersService.getSellerByUserId(sellerId);
    
    if (!seller) {
      res.status(404).json({ error: 'Seller not found' });
      return;
    }
    
    if (!seller.active) {
      res.status(400).json({ error: 'Seller is not active' });
      return;
    }
    
    const preference = await mpService.createSplitPreference(
      { items, payer, backUrls, externalReference },
      { accessToken: seller.accessToken, userId: seller.userId },
      marketplaceFee
    );
    
    res.json({
      success: true,
      preference,
    });
  } catch (err: any) {
    console.error('❌ [MP Payments] Error creando split preference:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /payments/:paymentId
 * Obtiene información de un pago
 */
router.get('/:paymentId', async (req, res) => {
  const { paymentId } = req.params;
  const { sellerId } = req.query;
  
  try {
    let accessToken = null;
    
    if (sellerId && typeof sellerId === 'string') {
      const seller = await sellersService.getSellerByUserId(sellerId);
      if (seller) {
        accessToken = seller.accessToken;
      }
    }
    
    const payment = await mpService.getPayment(paymentId, accessToken);
    
    res.json({
      success: true,
      payment,
    });
  } catch (err: any) {
    console.error('❌ [MP Payments] Error obteniendo pago:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
