// 🧾 Rutas de Facturas AFIP
import { Router, Request, Response } from 'express';
import { AFIPSeller } from '../models/AFIPSeller.js';
import { AFIPInvoice } from '../models/AFIPInvoice.js';
import { crearComprobante, obtenerUltimoComprobante, consultarComprobante } from '../services/afipInvoicingService.js';
import { TipoComprobanteLabels } from '../config.js';

const router = Router();

/**
 * GET /invoices?empresaId=xxx
 * Lista las facturas de una empresa
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { empresaId, limit = '50', offset = '0' } = req.query;
    
    if (!empresaId || typeof empresaId !== 'string') {
      res.status(400).json({ error: 'empresaId es requerido' });
      return;
    }
    
    const invoices = await AFIPInvoice.find({ empresaId })
      .sort({ createdAt: -1 })
      .skip(parseInt(offset as string))
      .limit(parseInt(limit as string));
    
    const total = await AFIPInvoice.countDocuments({ empresaId });
    
    // Agregar labels de tipo de comprobante y número completo
    const invoicesWithLabels = invoices.map(inv => ({
      ...inv.toObject(),
      tipoComprobanteLabel: TipoComprobanteLabels[inv.tipoComprobante as keyof typeof TipoComprobanteLabels] || 'Desconocido',
      numeroCompleto: `${inv.puntoVenta.toString().padStart(4, '0')}-${inv.numero.toString().padStart(8, '0')}`
    }));
    
    res.json({
      success: true,
      invoices: invoicesWithLabels,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
    
  } catch (error: any) {
    console.error('[AFIP Invoices] Error listando facturas:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /invoices
 * Crea una nueva factura
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { empresaId, invoiceData } = req.body;
    
    if (!empresaId || !invoiceData) {
      res.status(400).json({ error: 'empresaId e invoiceData son requeridos' });
      return;
    }
    
    // Buscar seller
    const seller = await AFIPSeller.findOne({ empresaId, activo: true });
    if (!seller) {
      res.status(404).json({ error: 'No hay configuración AFIP para esta empresa' });
      return;
    }
    
    // Validar datos mínimos
    if (!invoiceData.tipoComprobante || !invoiceData.importeTotal) {
      res.status(400).json({
        error: 'Datos requeridos: tipoComprobante, importeTotal'
      });
      return;
    }
    
    // Log del ambiente para debugging
    console.log(`🔧 [AFIP] Ambiente del seller: ${seller.environment}`);
    console.log(`🔧 [AFIP] URL WSFEv1: ${seller.environment === 'production' ? 'https://servicios1.afip.gov.ar/wsfev1/service.asmx' : 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx'}`);
    
    // Crear comprobante
    const result = await crearComprobante(seller._id.toString(), {
      tipoComprobante: invoiceData.tipoComprobante,
      concepto: invoiceData.concepto || seller.conceptoDefault || 1,
      clienteTipoDoc: invoiceData.clienteTipoDoc || 99, // Consumidor Final por defecto
      clienteNroDoc: invoiceData.clienteNroDoc || 0,
      clienteRazonSocial: invoiceData.clienteRazonSocial,
      importeNeto: invoiceData.importeNeto || invoiceData.importeTotal,
      importeIVA: invoiceData.importeIVA || 0,
      importeExento: invoiceData.importeExento || 0,
      importeTotal: invoiceData.importeTotal,
      iva: invoiceData.iva,
      comprobanteAsociado: invoiceData.comprobanteAsociado
    });
    
    // Advertencia si está en testing
    const isTestingMode = seller.environment === 'testing';
    
    res.json({
      success: true,
      invoice: result.invoice,
      cae: result.cae,
      caeVencimiento: result.caeVencimiento,
      numero: result.numero,
      puntoVenta: result.puntoVenta,
      numeroCompleto: `${result.puntoVenta.toString().padStart(4, '0')}-${result.numero.toString().padStart(8, '0')}`,
      environment: seller.environment,
      isTestingMode,
      warning: isTestingMode ? '⚠️ MODO TESTING: Este comprobante fue emitido en el ambiente de homologación de AFIP. NO es válido fiscalmente y NO aparecerá en AFIP real ni en buscadores de CAE.' : null
    });
    
  } catch (error: any) {
    console.error('[AFIP Invoices] Error creando factura:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /invoices/:id
 * Obtiene una factura por ID
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const invoice = await AFIPInvoice.findById(id);
    if (!invoice) {
      res.status(404).json({ error: 'Factura no encontrada' });
      return;
    }
    
    res.json({
      success: true,
      invoice: {
        ...invoice.toObject(),
        tipoComprobanteLabel: TipoComprobanteLabels[invoice.tipoComprobante as keyof typeof TipoComprobanteLabels] || 'Desconocido',
        numeroCompleto: `${invoice.puntoVenta.toString().padStart(4, '0')}-${invoice.numero.toString().padStart(8, '0')}`
      }
    });
    
  } catch (error: any) {
    console.error('[AFIP Invoices] Error obteniendo factura:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /invoices/ultimo/:tipoComprobante
 * Obtiene el último número de comprobante
 */
router.get('/ultimo/:tipoComprobante', async (req: Request, res: Response): Promise<void> => {
  try {
    const { tipoComprobante } = req.params;
    const { empresaId } = req.query;
    
    if (!empresaId || typeof empresaId !== 'string') {
      res.status(400).json({ error: 'empresaId es requerido' });
      return;
    }
    
    const seller = await AFIPSeller.findOne({ empresaId, activo: true });
    if (!seller) {
      res.status(404).json({ error: 'No hay configuración AFIP para esta empresa' });
      return;
    }
    
    const ultimoNro = await obtenerUltimoComprobante(
      seller._id.toString(),
      parseInt(tipoComprobante)
    );
    
    res.json({
      success: true,
      ultimoNumero: ultimoNro,
      proximoNumero: ultimoNro + 1
    });
    
  } catch (error: any) {
    console.error('[AFIP Invoices] Error obteniendo último número:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /invoices/consultar
 * Consulta un comprobante en AFIP
 */
router.post('/consultar', async (req: Request, res: Response): Promise<void> => {
  try {
    const { empresaId, tipoComprobante, puntoVenta, numero } = req.body;
    
    if (!empresaId || !tipoComprobante || !puntoVenta || !numero) {
      res.status(400).json({
        error: 'Campos requeridos: empresaId, tipoComprobante, puntoVenta, numero'
      });
      return;
    }
    
    const seller = await AFIPSeller.findOne({ empresaId, activo: true });
    if (!seller) {
      res.status(404).json({ error: 'No hay configuración AFIP para esta empresa' });
      return;
    }
    
    const result = await consultarComprobante(
      seller._id.toString(),
      tipoComprobante,
      puntoVenta,
      numero
    );
    
    res.json({
      success: true,
      comprobante: result
    });
    
  } catch (error: any) {
    console.error('[AFIP Invoices] Error consultando comprobante:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /invoices/stats/:empresaId
 * Estadísticas de facturación
 */
router.get('/stats/:empresaId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { empresaId } = req.params;
    
    const seller = await AFIPSeller.findOne({ empresaId, activo: true });
    
    const stats = {
      totalFacturas: seller?.totalFacturas || 0,
      totalNotasCredito: seller?.totalNotasCredito || 0,
      totalNotasDebito: seller?.totalNotasDebito || 0,
      configurado: !!seller,
      activo: seller?.activo || false
    };
    
    // Calcular totales del mes
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    
    const facturasDelMes = await AFIPInvoice.countDocuments({
      empresaId,
      resultado: 'A',
      createdAt: { $gte: inicioMes }
    });
    
    const importeDelMes = await AFIPInvoice.aggregate([
      {
        $match: {
          empresaId,
          resultado: 'A',
          createdAt: { $gte: inicioMes }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$importeTotal' }
        }
      }
    ]);
    
    res.json({
      success: true,
      stats: {
        ...stats,
        facturasDelMes,
        importeDelMes: importeDelMes[0]?.total || 0
      }
    });
    
  } catch (error: any) {
    console.error('[AFIP Invoices] Error obteniendo estadísticas:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /invoices/clear-testing
 * Elimina todas las facturas de testing
 */
router.delete('/clear-testing', async (req: Request, res: Response): Promise<void> => {
  try {
    const { empresaId } = req.query;
    
    // Eliminar todas las facturas de testing
    const filter: any = { environment: 'testing' };
    if (empresaId) {
      filter.empresaId = empresaId;
    }
    
    const result = await AFIPInvoice.deleteMany(filter);
    
    console.log(`🗑️ [AFIP] Eliminadas ${result.deletedCount} facturas de testing`);
    
    res.json({
      success: true,
      message: `Se eliminaron ${result.deletedCount} facturas de testing`,
      deletedCount: result.deletedCount
    });
    
  } catch (error: any) {
    console.error('[AFIP Invoices] Error eliminando facturas de testing:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /invoices/clear-all
 * Elimina TODAS las facturas (usar con cuidado)
 */
router.delete('/clear-all', async (req: Request, res: Response): Promise<void> => {
  try {
    const { empresaId, confirmDelete } = req.query;
    
    if (confirmDelete !== 'true') {
      res.status(400).json({ 
        error: 'Debes confirmar la eliminación con ?confirmDelete=true',
        warning: '⚠️ Esta acción eliminará TODAS las facturas y no se puede deshacer'
      });
      return;
    }
    
    const filter: any = {};
    if (empresaId) {
      filter.empresaId = empresaId;
    }
    
    const result = await AFIPInvoice.deleteMany(filter);
    
    console.log(`🗑️ [AFIP] Eliminadas ${result.deletedCount} facturas (TODAS)`);
    
    res.json({
      success: true,
      message: `Se eliminaron ${result.deletedCount} facturas`,
      deletedCount: result.deletedCount
    });
    
  } catch (error: any) {
    console.error('[AFIP Invoices] Error eliminando facturas:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
