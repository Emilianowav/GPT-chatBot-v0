// Índice de Rutas del Módulo OCR
import { Router, Request, Response } from 'express';
import ocrRoutes from './ocrRoutes.js';
import { OCRConfig } from '../models/OCRConfig.js';

const router = Router();

console.log('🔄 [OCR] Montando rutas del módulo...');

// Health check del módulo
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    module: 'OCR',
    version: '1.0.0',
    description: 'Carga de datos por Imagen - OCR para facturas y comprobantes',
    endpoints: {
      process: 'POST /process (multipart/form-data con campo "file")',
      config: {
        get: 'GET /config/:empresaId',
        save: 'POST /config'
      },
      documents: {
        list: 'GET /documents?empresaId=xxx',
        get: 'GET /documents/:id',
        update: 'PUT /documents/:id',
        delete: 'DELETE /documents/:id'
      },
      stats: 'GET /stats/:empresaId'
    },
    supportedFormats: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    maxFileSize: '10MB'
  });
});

// Get OCR configuration
router.get('/config/:empresaId', async (req: Request, res: Response) => {
  try {
    const { empresaId } = req.params;
    
    let config = await OCRConfig.findOne({ empresaId });
    
    if (!config) {
      config = await OCRConfig.create({
        empresaId,
        mpValidationEnabled: false,
        afipInvoicingEnabled: false,
        autoProcessWhatsApp: false
      });
    }
    
    res.json({
      success: true,
      config: {
        mpValidationEnabled: config.mpValidationEnabled,
        afipInvoicingEnabled: config.afipInvoicingEnabled,
        autoProcessWhatsApp: config.autoProcessWhatsApp
      }
    });
  } catch (error: any) {
    console.error('❌ [OCR] Error getting config:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Save OCR configuration
router.post('/config', async (req: Request, res: Response): Promise<void> => {
  try {
    const { empresaId, mpValidationEnabled, afipInvoicingEnabled, autoProcessWhatsApp } = req.body;
    
    if (!empresaId) {
      res.status(400).json({
        success: false,
        error: 'empresaId es requerido'
      });
      return;
    }
    
    let config = await OCRConfig.findOne({ empresaId });
    
    if (config) {
      config.mpValidationEnabled = mpValidationEnabled ?? config.mpValidationEnabled;
      config.afipInvoicingEnabled = afipInvoicingEnabled ?? config.afipInvoicingEnabled;
      config.autoProcessWhatsApp = autoProcessWhatsApp ?? config.autoProcessWhatsApp;
      await config.save();
    } else {
      config = await OCRConfig.create({
        empresaId,
        mpValidationEnabled: mpValidationEnabled ?? false,
        afipInvoicingEnabled: afipInvoicingEnabled ?? false,
        autoProcessWhatsApp: autoProcessWhatsApp ?? false
      });
    }
    
    console.log(`✅ [OCR] Config guardada para empresa ${empresaId}`);
    
    res.json({
      success: true,
      message: 'Configuración guardada correctamente',
      config: {
        mpValidationEnabled: config.mpValidationEnabled,
        afipInvoicingEnabled: config.afipInvoicingEnabled,
        autoProcessWhatsApp: config.autoProcessWhatsApp
      }
    });
  } catch (error: any) {
    console.error('❌ [OCR] Error saving config:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Montar rutas de documentos OCR
router.use('/', ocrRoutes);

console.log('✅ [OCR] Módulo montado exitosamente\n');

export default router;
