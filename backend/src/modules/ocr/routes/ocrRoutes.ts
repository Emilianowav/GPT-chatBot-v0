// 📸 Rutas de OCR
import { Router, Request, Response } from 'express';
import multerPkg from 'multer';
const multer = multerPkg;
import { ocrConfig } from '../config.js';
import { processImageOCR, extractInvoiceData, saveOCRDocument } from '../services/ocrService.js';
import { OCRDocument } from '../models/OCRDocument.js';

const router = Router();

// Configurar multer para manejo de archivos
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: ocrConfig.maxFileSize
  },
  fileFilter: (req, file, cb) => {
    if (ocrConfig.allowedFormats.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de archivo no permitido'));
    }
  }
});

/**
 * POST /process
 * Procesa una imagen con OCR y extrae datos
 */
router.post('/process', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { empresaId, userId } = req.body;
    
    if (!empresaId) {
      res.status(400).json({ error: 'empresaId es requerido' });
      return;
    }
    
    if (!req.file) {
      res.status(400).json({ error: 'No se proporcionó ningún archivo' });
      return;
    }
    
    console.log(`📸 [OCR] Procesando archivo: ${req.file.originalname}`);
    console.log(`📊 [OCR] Tamaño: ${(req.file.size / 1024).toFixed(2)} KB`);
    
    const startTime = Date.now();
    
    // Procesar imagen con OCR
    const { text, confidence } = await processImageOCR(req.file.buffer);
    
    // Extraer datos estructurados
    const extractedData = extractInvoiceData(text);
    
    const processingTime = Date.now() - startTime;
    
    // Guardar documento
    const document = await saveOCRDocument({
      empresaId,
      userId,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      rawText: text,
      confidence,
      extractedData,
      processingTime
    });
    
    res.json({
      success: true,
      document: {
        _id: document._id,
        extractedData: document.extractedData,
        confidence: document.confidence,
        processingTime: document.processingTime,
        rawText: document.rawText
      }
    });
    
  } catch (error: any) {
    console.error('[OCR] Error procesando imagen:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /documents?empresaId=xxx
 * Lista los documentos OCR de una empresa
 */
router.get('/documents', async (req: Request, res: Response): Promise<void> => {
  try {
    const { empresaId, limit = '50', offset = '0' } = req.query;
    
    if (!empresaId || typeof empresaId !== 'string') {
      res.status(400).json({ error: 'empresaId es requerido' });
      return;
    }
    
    const documents = await OCRDocument.find({ empresaId })
      .sort({ createdAt: -1 })
      .skip(parseInt(offset as string))
      .limit(parseInt(limit as string))
      .select('-rawText'); // No incluir texto completo en listado
    
    const total = await OCRDocument.countDocuments({ empresaId });
    
    res.json({
      success: true,
      documents,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
    
  } catch (error: any) {
    console.error('[OCR] Error listando documentos:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /documents/:id
 * Obtiene un documento OCR por ID
 */
router.get('/documents/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const document = await OCRDocument.findById(id);
    
    if (!document) {
      res.status(404).json({ error: 'Documento no encontrado' });
      return;
    }
    
    res.json({
      success: true,
      document
    });
    
  } catch (error: any) {
    console.error('[OCR] Error obteniendo documento:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /documents/:id
 * Actualiza los datos extraídos de un documento
 */
router.put('/documents/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { extractedData } = req.body;
    
    if (!extractedData) {
      res.status(400).json({ error: 'extractedData es requerido' });
      return;
    }
    
    const document = await OCRDocument.findByIdAndUpdate(
      id,
      { extractedData },
      { new: true }
    );
    
    if (!document) {
      res.status(404).json({ error: 'Documento no encontrado' });
      return;
    }
    
    res.json({
      success: true,
      document
    });
    
  } catch (error: any) {
    console.error('[OCR] Error actualizando documento:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /documents/:id
 * Elimina un documento OCR
 */
router.delete('/documents/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const document = await OCRDocument.findByIdAndDelete(id);
    
    if (!document) {
      res.status(404).json({ error: 'Documento no encontrado' });
      return;
    }
    
    res.json({
      success: true,
      message: 'Documento eliminado'
    });
    
  } catch (error: any) {
    console.error('[OCR] Error eliminando documento:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /stats/:empresaId
 * Estadísticas de OCR
 */
router.get('/stats/:empresaId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { empresaId } = req.params;
    
    const totalDocuments = await OCRDocument.countDocuments({ empresaId });
    const completedDocuments = await OCRDocument.countDocuments({ empresaId, status: 'completed' });
    const failedDocuments = await OCRDocument.countDocuments({ empresaId, status: 'failed' });
    
    // Confianza promedio
    const avgConfidenceResult = await OCRDocument.aggregate([
      { $match: { empresaId, status: 'completed' } },
      { $group: { _id: null, avgConfidence: { $avg: '$confidence' } } }
    ]);
    
    const avgConfidence = avgConfidenceResult[0]?.avgConfidence || 0;
    
    // Tiempo de procesamiento promedio
    const avgTimeResult = await OCRDocument.aggregate([
      { $match: { empresaId, status: 'completed', processingTime: { $exists: true } } },
      { $group: { _id: null, avgTime: { $avg: '$processingTime' } } }
    ]);
    
    const avgProcessingTime = avgTimeResult[0]?.avgTime || 0;
    
    res.json({
      success: true,
      stats: {
        totalDocuments,
        completedDocuments,
        failedDocuments,
        avgConfidence: Math.round(avgConfidence * 100) / 100,
        avgProcessingTime: Math.round(avgProcessingTime)
      }
    });
    
  } catch (error: any) {
    console.error('[OCR] Error obteniendo estadísticas:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
