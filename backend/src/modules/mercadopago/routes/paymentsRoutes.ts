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
 * 
 * Body esperado para mejor puntuación en MP:
 * {
 *   items: [{
 *     id: string,              // Código del item (recomendado)
 *     title: string,           // Nombre del item (recomendado)
 *     description: string,     // Descripción (recomendado)
 *     categoryId: string,      // Categoría: "services", "electronics", etc. (recomendado)
 *     quantity: number,        // Cantidad (recomendado)
 *     unitPrice: number,       // Precio unitario (recomendado)
 *     currency: string,        // Moneda (default: ARS)
 *     pictureUrl: string       // URL de imagen
 *   }],
 *   payer: {
 *     email: string,           // OBLIGATORIO
 *     firstName: string,       // Nombre (recomendado)
 *     lastName: string,        // Apellido (recomendado)
 *     phone: { areaCode, number },
 *     identification: { type, number }
 *   },
 *   backUrls: {                // URLs de redirección (recomendado)
 *     success: string,
 *     failure: string,
 *     pending: string
 *   },
 *   externalReference: string, // OBLIGATORIO - ID interno de tu sistema
 *   notificationUrl: string,   // URL para webhooks (recomendado)
 *   statementDescriptor: string // Descripción en resumen de tarjeta (max 22 chars)
 * }
 */
router.post('/create-preference', async (req, res) => {
  const { 
    items, 
    payer, 
    backUrls, 
    externalReference,
    notificationUrl,
    statementDescriptor 
  } = req.body;
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'items is required and must be an array' });
    return;
  }
  
  // Validar campos obligatorios para mejor puntuación
  if (!externalReference) {
    console.warn('⚠️ [MP Payments] external_reference no proporcionado (OBLIGATORIO para mejor puntuación)');
  }
  if (!payer?.email) {
    console.warn('⚠️ [MP Payments] payer.email no proporcionado (OBLIGATORIO para mejor puntuación)');
  }
  
  try {
    const preference = await mpService.createPreference({
      items,
      payer,
      backUrls,
      externalReference,
      notificationUrl,
      statementDescriptor,
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
 * 
 * Body esperado para mejor puntuación en MP:
 * {
 *   sellerId: string,          // ID del vendedor en MP (OBLIGATORIO)
 *   items: [{
 *     id: string,              // Código del item (recomendado)
 *     title: string,           // Nombre del item (recomendado)
 *     description: string,     // Descripción (recomendado)
 *     categoryId: string,      // Categoría: "services", "electronics", etc. (recomendado)
 *     quantity: number,        // Cantidad (recomendado)
 *     unitPrice: number,       // Precio unitario (recomendado)
 *     currency: string,        // Moneda (default: ARS)
 *     pictureUrl: string       // URL de imagen
 *   }],
 *   payer: {
 *     email: string,           // OBLIGATORIO
 *     firstName: string,       // Nombre (recomendado)
 *     lastName: string,        // Apellido (recomendado)
 *     phone: { areaCode, number },
 *     identification: { type, number }
 *   },
 *   backUrls: {                // URLs de redirección (recomendado)
 *     success: string,
 *     failure: string,
 *     pending: string
 *   },
 *   externalReference: string, // OBLIGATORIO - ID interno de tu sistema
 *   notificationUrl: string,   // URL para webhooks (recomendado)
 *   statementDescriptor: string, // Descripción en resumen de tarjeta (max 22 chars)
 *   marketplaceFee: number     // Comisión del marketplace (opcional, usa config por defecto)
 * }
 */
router.post('/create-split-preference', async (req, res) => {
  const { 
    sellerId, 
    items, 
    payer, 
    backUrls, 
    externalReference, 
    notificationUrl,
    statementDescriptor,
    marketplaceFee 
  } = req.body;
  
  if (!sellerId) {
    res.status(400).json({ error: 'sellerId is required' });
    return;
  }
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'items is required and must be an array' });
    return;
  }
  
  // Validar campos obligatorios para mejor puntuación
  if (!externalReference) {
    console.warn('⚠️ [MP Payments] external_reference no proporcionado (OBLIGATORIO para mejor puntuación)');
  }
  if (!payer?.email) {
    console.warn('⚠️ [MP Payments] payer.email no proporcionado (OBLIGATORIO para mejor puntuación)');
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
      { items, payer, backUrls, externalReference, notificationUrl, statementDescriptor },
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
 * Filtra directamente por empresaId del pago
 */
router.get('/history/:empresaId', async (req, res): Promise<void> => {
  const { empresaId } = req.params;
  const { status, limit = '50', offset = '0' } = req.query;
  
  console.log(`📊 [MP Payments] Buscando historial para empresaId: "${empresaId}"`);
  
  try {
    // Primero intentar filtrar directamente por empresaId en los pagos
    let query: any = { empresaId: empresaId };
    
    // Contar pagos con empresaId directo
    let total = await Payment.countDocuments(query);
    
    // Si no hay pagos con empresaId directo, buscar por seller (compatibilidad hacia atrás)
    if (total === 0) {
      console.log(`📊 [MP Payments] No hay pagos con empresaId directo, buscando por seller...`);
      
      // Buscar el seller por internalId (puede ser nombre o ObjectId)
      let seller = await Seller.findOne({ internalId: empresaId });
      
      // Si no se encuentra, buscar por nombre de empresa usando el ObjectId
      if (!seller) {
        const { EmpresaModel } = await import('../../../models/Empresa.js');
        const empresa = await EmpresaModel.findById(empresaId);
        if (empresa) {
          console.log(`📊 [MP Payments] Buscando seller por nombre: ${empresa.nombre}`);
          seller = await Seller.findOne({ internalId: empresa.nombre });
          
          // También buscar pagos por nombre de empresa
          if (!seller) {
            query = { empresaId: empresa.nombre };
            total = await Payment.countDocuments(query);
          }
        }
      }
      
      if (seller) {
        console.log(`📊 [MP Payments] Seller encontrado:`, { internalId: seller.internalId, userId: seller.userId });
        query = { sellerId: seller.userId };
        total = await Payment.countDocuments(query);
      }
    }
    
    console.log(`📊 [MP Payments] Query final:`, query, `Total: ${total}`);
    
    if (total === 0) {
      console.log(`📊 [MP Payments] No hay pagos para "${empresaId}"`);
      res.json({
        success: true,
        payments: [],
        total: 0,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });
      return;
    }
    
    if (status && typeof status === 'string') {
      query.status = status;
    }
    
    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(offset as string))
      .limit(parseInt(limit as string));
    
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
 * Filtra directamente por empresaId del pago
 */
router.get('/stats/:empresaId', async (req, res): Promise<void> => {
  const { empresaId } = req.params;
  
  try {
    // Construir query - primero intentar por empresaId directo
    let query: any = { empresaId: empresaId };
    let total = await Payment.countDocuments(query);
    
    // Si no hay pagos con empresaId directo, buscar por seller (compatibilidad)
    if (total === 0) {
      let seller = await Seller.findOne({ internalId: empresaId });
      
      if (!seller) {
        const { EmpresaModel } = await import('../../../models/Empresa.js');
        const empresa = await EmpresaModel.findById(empresaId);
        if (empresa) {
          seller = await Seller.findOne({ internalId: empresa.nombre });
          if (!seller) {
            query = { empresaId: empresa.nombre };
            total = await Payment.countDocuments(query);
          }
        }
      }
      
      if (seller) {
        query = { sellerId: seller.userId };
      }
    }
    
    // Si no hay pagos, retornar stats vacías
    if (total === 0 && !(await Payment.countDocuments(query))) {
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
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    // Total de pagos aprobados
    const pagosAprobados = await Payment.countDocuments({ 
      ...query, 
      status: 'approved' 
    });
    
    // Ingresos totales
    const ingresosTotales = await Payment.aggregate([
      { $match: { ...query, status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // Pagos del mes
    const pagosDelMes = await Payment.countDocuments({
      ...query,
      status: 'approved',
      createdAt: { $gte: inicioMes }
    });
    
    // Ingresos del mes
    const ingresosDelMes = await Payment.aggregate([
      { $match: { ...query, status: 'approved', createdAt: { $gte: inicioMes } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // Pagos pendientes
    const pagosPendientes = await Payment.countDocuments({
      ...query,
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
