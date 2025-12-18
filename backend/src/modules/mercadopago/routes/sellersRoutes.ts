// 💳 Rutas de Vendedores de Mercado Pago
import { Router } from 'express';
import * as sellersService from '../services/sellersService.js';

const router = Router();

/**
 * GET /sellers
 * Lista todos los vendedores conectados
 */
router.get('/', async (req: any, res: any) => {
  try {
    const sellers = await sellersService.getAllSellers();
    
    res.json({
      success: true,
      count: sellers.length,
      sellers: sellers.map(s => ({
        userId: s.userId,
        internalId: s.internalId,
        email: s.email,
        businessName: s.businessName,
        connectedAt: s.connectedAt,
        updatedAt: s.updatedAt,
        active: s.active,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /sellers/:userId
 * Obtiene un vendedor por su User ID de MP
 */
router.get('/:userId', async (req: any, res: any) => {
  const { userId } = req.params;
  
  try {
    const seller = await sellersService.getSellerByUserId(userId);
    
    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }
    
    res.json({
      success: true,
      seller: {
        userId: seller.userId,
        internalId: seller.internalId,
        email: seller.email,
        businessName: seller.businessName,
        connectedAt: seller.connectedAt,
        updatedAt: seller.updatedAt,
        active: seller.active,
        hasAccessToken: !!seller.accessToken,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /sellers/by-internal/:internalId
 * Obtiene un vendedor por su ID interno (empresa)
 */
router.get('/by-internal/:internalId', async (req: any, res: any) => {
  const { internalId } = req.params;
  
  try {
    const seller = await sellersService.getSellerByInternalId(internalId);
    
    if (!seller) {
      return res.status(404).json({ error: 'Seller not found', connected: false });
    }
    
    res.json({
      success: true,
      connected: true,
      seller: {
        userId: seller.userId,
        internalId: seller.internalId,
        email: seller.email,
        businessName: seller.businessName,
        connectedAt: seller.connectedAt,
        active: seller.active,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /sellers/:userId
 * Elimina un vendedor
 */
router.delete('/:userId', async (req: any, res: any) => {
  const { userId } = req.params;
  
  try {
    const success = await sellersService.deleteSeller(userId);
    
    if (success) {
      res.json({ success: true, message: 'Seller deleted' });
    } else {
      res.status(404).json({ error: 'Seller not found' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
