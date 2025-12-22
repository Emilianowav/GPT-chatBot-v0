// 🧾 Rutas de Sellers AFIP
import { Router, Request, Response } from 'express';
import { AFIPSeller } from '../models/AFIPSeller.js';
import { autenticarWSAA } from '../services/afipAuthService.js';

const router = Router();

/**
 * GET /sellers/all
 * Obtiene TODOS los sellers (para debugging)
 */
router.get('/all', async (req: Request, res: Response): Promise<void> => {
  try {
    const sellers = await AFIPSeller.find({});
    
    const sellersData = sellers.map(seller => ({
      _id: seller._id,
      empresaId: seller.empresaId,
      cuit: seller.cuit,
      razonSocial: seller.razonSocial,
      puntoVenta: seller.puntoVenta,
      environment: seller.environment,
      activo: seller.activo
    }));
    
    res.json({ success: true, count: sellers.length, sellers: sellersData });
    
  } catch (error: any) {
    console.error('[AFIP Sellers] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /sellers?empresaId=xxx
 * Obtiene todos los sellers AFIP de una empresa
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { empresaId } = req.query;
    
    if (!empresaId || typeof empresaId !== 'string') {
      res.status(400).json({ error: 'empresaId es requerido' });
      return;
    }
    
    // Buscar todos los sellers activos de la empresa
    const sellers = await AFIPSeller.find({ empresaId, activo: true });
    
    // No enviar certificado ni clave privada al frontend
    const sellersData = sellers.map(seller => ({
      _id: seller._id,
      empresaId: seller.empresaId,
      cuit: seller.cuit,
      razonSocial: seller.razonSocial,
      puntoVenta: seller.puntoVenta,
      environment: seller.environment,
      activo: seller.activo,
      tipoComprobanteDefault: seller.tipoComprobanteDefault,
      conceptoDefault: seller.conceptoDefault,
      totalFacturas: seller.totalFacturas,
      totalNotasCredito: seller.totalNotasCredito,
      totalNotasDebito: seller.totalNotasDebito,
      tokenExpiration: seller.tokenExpiration,
      createdAt: seller.createdAt
    }));
    
    res.json({ success: true, sellers: sellersData });
    
  } catch (error: any) {
    console.error('[AFIP Sellers] Error obteniendo sellers:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /sellers
 * Crea o actualiza un seller AFIP
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      empresaId,
      cuit,
      razonSocial,
      puntoVenta,
      certificado,
      clavePrivada,
      environment
    } = req.body;
    
    // Validar campos requeridos
    if (!empresaId || !cuit || !razonSocial || !certificado || !clavePrivada) {
      res.status(400).json({
        error: 'Campos requeridos: empresaId, cuit, razonSocial, certificado, clavePrivada'
      });
      return;
    }
    
    // Validar formato de certificado y clave
    if (!certificado.includes('BEGIN CERTIFICATE') || !clavePrivada.includes('BEGIN')) {
      res.status(400).json({
        error: 'Certificado o clave privada en formato inválido (debe ser PEM)'
      });
      return;
    }
    
    // Buscar seller existente por empresaId Y cuit
    let seller = await AFIPSeller.findOne({ empresaId, cuit });
    
    if (seller) {
      // Actualizar seller existente con el mismo CUIT
      seller.razonSocial = razonSocial;
      seller.puntoVenta = puntoVenta || seller.puntoVenta;
      seller.certificado = certificado;
      seller.clavePrivada = clavePrivada;
      seller.environment = environment || seller.environment;
      seller.activo = true;
      
      // Invalidar token anterior
      seller.token = undefined;
      seller.sign = undefined;
      seller.tokenExpiration = undefined;
      
      await seller.save();
      
      console.log(`✅ [AFIP Sellers] Seller actualizado para CUIT ${cuit} de empresa ${empresaId}`);
    } else {
      // Crear nuevo seller (permite múltiples CUITs por empresa)
      seller = new AFIPSeller({
        empresaId,
        cuit,
        razonSocial,
        puntoVenta: puntoVenta || 1,
        certificado,
        clavePrivada,
        environment: environment || 'production',
        activo: true
      });
      
      await seller.save();
      
      console.log(`✅ [AFIP Sellers] Nuevo seller creado para CUIT ${cuit} de empresa ${empresaId}`);
    }
    
    // Intentar autenticar inmediatamente
    try {
      const { token, sign, expirationTime } = await autenticarWSAA(
        certificado,
        clavePrivada,
        seller.environment
      );
      
      seller.token = token;
      seller.sign = sign;
      seller.tokenExpiration = expirationTime;
      await seller.save();
      
      console.log('✅ [AFIP Sellers] Autenticación inicial exitosa');
    } catch (authError: any) {
      console.warn('⚠️ [AFIP Sellers] No se pudo autenticar inicialmente:', authError.message);
    }
    
    res.json({
      success: true,
      seller: {
        _id: seller._id,
        empresaId: seller.empresaId,
        cuit: seller.cuit,
        razonSocial: seller.razonSocial,
        puntoVenta: seller.puntoVenta,
        environment: seller.environment,
        activo: seller.activo
      }
    });
    
  } catch (error: any) {
    console.error('[AFIP Sellers] Error creando/actualizando seller:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /sellers/migrate-to-production
 * Migra todos los sellers de testing a producción
 */
router.put('/migrate-to-production', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await AFIPSeller.updateMany(
      { environment: 'testing' },
      { 
        $set: { 
          environment: 'production',
          token: undefined,
          sign: undefined,
          tokenExpiration: undefined
        }
      }
    );
    
    console.log(`🔄 [AFIP] Migrados ${result.modifiedCount} sellers a producción`);
    
    res.json({
      success: true,
      message: `Se migraron ${result.modifiedCount} sellers a producción`,
      modifiedCount: result.modifiedCount
    });
    
  } catch (error: any) {
    console.error('[AFIP Sellers] Error migrando sellers:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /sellers/clear-testing
 * Elimina todos los sellers de testing
 */
router.delete('/clear-testing', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await AFIPSeller.deleteMany({ environment: 'testing' });
    
    console.log(`🗑️ [AFIP] Eliminados ${result.deletedCount} sellers de testing`);
    
    res.json({
      success: true,
      message: `Se eliminaron ${result.deletedCount} sellers de testing`,
      deletedCount: result.deletedCount
    });
    
  } catch (error: any) {
    console.error('[AFIP Sellers] Error eliminando sellers:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /sellers/:id/test-auth
 * Prueba la autenticación con AFIP
 */
router.post('/:id/test-auth', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const seller = await AFIPSeller.findById(id);
    if (!seller) {
      res.status(404).json({ error: 'Seller no encontrado' });
      return;
    }
    
    const { token, sign, expirationTime } = await autenticarWSAA(
      seller.certificado,
      seller.clavePrivada,
      seller.environment
    );
    
    seller.token = token;
    seller.sign = sign;
    seller.tokenExpiration = expirationTime;
    await seller.save();
    
    res.json({
      success: true,
      message: 'Autenticación exitosa',
      expirationTime
    });
    
  } catch (error: any) {
    console.error('[AFIP Sellers] Error en test de autenticación:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /sellers/:id/puntos-venta
 * Obtiene los puntos de venta disponibles en AFIP para este seller
 */
router.get('/:id/puntos-venta', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const seller = await AFIPSeller.findById(id);
    if (!seller) {
      res.status(404).json({ error: 'Seller no encontrado' });
      return;
    }
    
    // Importar dinámicamente para evitar dependencias circulares
    const { obtenerPuntosVentaDisponibles } = await import('../services/afipInvoicingService.js');
    
    const puntosVenta = await obtenerPuntosVentaDisponibles(id);
    
    res.json({
      success: true,
      puntosVenta,
      puntoVentaActual: seller.puntoVenta,
      esValido: puntosVenta.includes(seller.puntoVenta)
    });
    
  } catch (error: any) {
    console.error('[AFIP Sellers] Error obteniendo puntos de venta:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /sellers/:id
 * Actualiza un seller AFIP (punto de venta, etc.)
 */
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { puntoVenta, razonSocial } = req.body;
    
    const seller = await AFIPSeller.findById(id);
    if (!seller) {
      res.status(404).json({ error: 'Seller no encontrado' });
      return;
    }
    
    if (puntoVenta !== undefined) {
      seller.puntoVenta = puntoVenta;
      console.log(`🔄 [AFIP] Punto de venta actualizado a ${puntoVenta} para CUIT ${seller.cuit}`);
    }
    
    if (razonSocial !== undefined) {
      seller.razonSocial = razonSocial;
    }
    
    await seller.save();
    
    res.json({
      success: true,
      message: 'Seller actualizado',
      seller: {
        _id: seller._id,
        cuit: seller.cuit,
        razonSocial: seller.razonSocial,
        puntoVenta: seller.puntoVenta,
        environment: seller.environment
      }
    });
    
  } catch (error: any) {
    console.error('[AFIP Sellers] Error actualizando seller:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /sellers/:id
 * Desactiva un seller AFIP
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const seller = await AFIPSeller.findById(id);
    if (!seller) {
      res.status(404).json({ error: 'Seller no encontrado' });
      return;
    }
    
    seller.activo = false;
    await seller.save();
    
    res.json({ success: true, message: 'Seller desactivado' });
    
  } catch (error: any) {
    console.error('[AFIP Sellers] Error desactivando seller:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
