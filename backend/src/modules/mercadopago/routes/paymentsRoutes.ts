// 💳 Rutas de Pagos de Mercado Pago
import { Router } from 'express';
import * as mpService from '../services/mercadopagoService.js';
import * as sellersService from '../services/sellersService.js';
import { Payment } from '../models/Payment.js';
import { Seller } from '../models/Seller.js';

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

/**
 * GET /payments/history/:empresaId
 * Lista el historial de pagos de una empresa
 * Busca por internalId del seller (empresaId) en lugar de userId de MP
 */
router.get('/history/:empresaId', async (req, res): Promise<void> => {
  const { empresaId } = req.params;
  const { status, limit = '50', offset = '0' } = req.query;
  
  console.log(`📊 [MP Payments] Buscando historial para empresaId: "${empresaId}"`);
  
  try {
    // Buscar el seller por internalId (puede ser nombre o ObjectId)
    let seller = await Seller.findOne({ internalId: empresaId });
    
    // Si no se encuentra, buscar por nombre de empresa usando el ObjectId
    if (!seller) {
      const { EmpresaModel } = await import('../../../models/Empresa.js');
      const empresa = await EmpresaModel.findById(empresaId);
      if (empresa) {
        console.log(`📊 [MP Payments] Buscando seller por nombre: ${empresa.nombre}`);
        seller = await Seller.findOne({ internalId: empresa.nombre });
      }
    }
    
    console.log(`📊 [MP Payments] Seller encontrado:`, seller ? { internalId: seller.internalId, userId: seller.userId } : 'NO ENCONTRADO');
    
    if (!seller) {
      console.log(`📊 [MP Payments] No hay seller para "${empresaId}", retornando lista vacía`);
      res.json({
        success: true,
        payments: [],
        total: 0,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });
      return;
    }
    
    // Buscar pagos por el userId de MP del seller
    const query: any = { sellerId: seller.userId };
    console.log(`📊 [MP Payments] Query de pagos:`, query);
    
    if (status && typeof status === 'string') {
      query.status = status;
    }
    
    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(offset as string))
      .limit(parseInt(limit as string));
    
    const total = await Payment.countDocuments(query);
    
    res.json({
      success: true,
      payments,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (err: any) {
    console.error('❌ [MP Payments] Error listando pagos:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /payments/stats/:empresaId
 * Estadísticas de pagos de una empresa
 * Busca por internalId del seller (empresaId)
 */
router.get('/stats/:empresaId', async (req, res): Promise<void> => {
  const { empresaId } = req.params;
  
  try {
    // Buscar el seller por internalId (puede ser nombre o ObjectId)
    let seller = await Seller.findOne({ internalId: empresaId });
    
    // Si no se encuentra, buscar por nombre de empresa usando el ObjectId
    if (!seller) {
      const { EmpresaModel } = await import('../../../models/Empresa.js');
      const empresa = await EmpresaModel.findById(empresaId);
      if (empresa) {
        seller = await Seller.findOne({ internalId: empresa.nombre });
      }
    }
    
    if (!seller) {
      res.json({
        success: true,
        stats: {
          pagosAprobados: 0,
          ingresosTotales: 0,
          pagosDelMes: 0,
          ingresosDelMes: 0,
          pagosPendientes: 0
        }
      });
      return;
    }
    
    const sellerId = seller.userId;
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    // Total de pagos aprobados
    const pagosAprobados = await Payment.countDocuments({ 
      sellerId, 
      status: 'approved' 
    });
    
    // Ingresos totales
    const ingresosTotales = await Payment.aggregate([
      { $match: { sellerId, status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // Pagos del mes
    const pagosDelMes = await Payment.countDocuments({
      sellerId,
      status: 'approved',
      createdAt: { $gte: inicioMes }
    });
    
    // Ingresos del mes
    const ingresosDelMes = await Payment.aggregate([
      { $match: { sellerId, status: 'approved', createdAt: { $gte: inicioMes } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // Pagos pendientes
    const pagosPendientes = await Payment.countDocuments({
      sellerId,
      status: { $in: ['pending', 'in_process'] }
    });
    
    res.json({
      success: true,
      stats: {
        pagosAprobados,
        ingresosTotales: ingresosTotales[0]?.total || 0,
        pagosDelMes,
        ingresosDelMes: ingresosDelMes[0]?.total || 0,
        pagosPendientes
      }
    });
  } catch (err: any) {
    console.error('❌ [MP Payments] Error obteniendo stats:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
