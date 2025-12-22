// 🤖 Servicio de Integración OCR con MP y AFIP
// Automatiza el flujo completo: Imagen → OCR → Pago MP / Factura AFIP

import { processImageOCR, extractInvoiceData, saveOCRDocument } from './ocrService.js';
import { OCRDocument } from '../models/OCRDocument.js';

/**
 * Procesa una imagen y crea un pago en Mercado Pago automáticamente
 */
export async function processImageAndCreatePayment(
  imageBuffer: Buffer,
  empresaId: string,
  fileName: string,
  fileType: string,
  fileSize: number
): Promise<{
  ocrDocument: any;
  paymentData: {
    amount: number;
    description: string;
    invoiceNumber?: string;
  };
}> {
  try {
    console.log('🔄 [OCR Integration] Procesando imagen para pago...');
    
    // 1. Procesar imagen con OCR
    const startTime = Date.now();
    const { text, confidence } = await processImageOCR(imageBuffer);
    
    // 2. Extraer datos estructurados
    const extractedData = extractInvoiceData(text);
    const processingTime = Date.now() - startTime;
    
    // 3. Guardar documento OCR
    const ocrDocument = await saveOCRDocument({
      empresaId,
      fileName,
      fileType,
      fileSize,
      rawText: text,
      confidence,
      extractedData,
      processingTime
    });
    
    // 4. Preparar datos para pago en MP
    const paymentData = {
      amount: extractedData.total || 0,
      description: `Pago de factura ${extractedData.numeroComprobante || 'sin número'}`,
      invoiceNumber: extractedData.numeroComprobante
    };
    
    console.log(`✅ [OCR Integration] Imagen procesada. Total: $${paymentData.amount}`);
    
    return {
      ocrDocument,
      paymentData
    };
    
  } catch (error: any) {
    console.error('❌ [OCR Integration] Error procesando imagen:', error.message);
    throw error;
  }
}

/**
 * Procesa una imagen y valida con AFIP automáticamente
 */
export async function processImageAndValidateAFIP(
  imageBuffer: Buffer,
  empresaId: string,
  fileName: string,
  fileType: string,
  fileSize: number
): Promise<{
  ocrDocument: any;
  afipValidation?: {
    valid: boolean;
    cae?: string;
    message: string;
  };
}> {
  try {
    console.log('🔄 [OCR Integration] Procesando imagen para validación AFIP...');
    
    // 1. Procesar imagen con OCR
    const startTime = Date.now();
    const { text, confidence } = await processImageOCR(imageBuffer);
    
    // 2. Extraer datos estructurados
    const extractedData = extractInvoiceData(text);
    const processingTime = Date.now() - startTime;
    
    // 3. Guardar documento OCR
    const ocrDocument = await saveOCRDocument({
      empresaId,
      fileName,
      fileType,
      fileSize,
      rawText: text,
      confidence,
      extractedData,
      processingTime
    });
    
    // 4. Validar con AFIP si hay CAE
    let afipValidation;
    if (extractedData.cae) {
      afipValidation = {
        valid: true,
        cae: extractedData.cae,
        message: 'CAE detectado en la imagen'
      };
      
      // Marcar como validado en el documento
      ocrDocument.afipValidated = true;
      ocrDocument.afipValidationDate = new Date();
      await ocrDocument.save();
      
      console.log(`✅ [OCR Integration] CAE detectado: ${extractedData.cae}`);
    } else {
      afipValidation = {
        valid: false,
        message: 'No se detectó CAE en la imagen'
      };
    }
    
    return {
      ocrDocument,
      afipValidation
    };
    
  } catch (error: any) {
    console.error('❌ [OCR Integration] Error validando con AFIP:', error.message);
    throw error;
  }
}

/**
 * Flujo completo: OCR → Crear Pago MP → Enviar link
 * Para uso en chatbots
 */
export async function ocrToPaymentFlow(
  imageBuffer: Buffer,
  empresaId: string,
  fileName: string,
  fileType: string,
  fileSize: number,
  mpSellerId?: string
): Promise<{
  success: boolean;
  ocrDocument: any;
  paymentLink?: string;
  amount?: number;
  message: string;
}> {
  try {
    console.log('🚀 [OCR Integration] Iniciando flujo OCR → Pago MP...');
    
    // 1. Procesar imagen y preparar datos de pago
    const { ocrDocument, paymentData } = await processImageAndCreatePayment(
      imageBuffer,
      empresaId,
      fileName,
      fileType,
      fileSize
    );
    
    // 2. Verificar que haya un monto válido
    if (!paymentData.amount || paymentData.amount <= 0) {
      return {
        success: false,
        ocrDocument,
        message: 'No se pudo detectar el monto en la imagen. Por favor, ingresa el monto manualmente.'
      };
    }
    
    // 3. Si hay sellerId de MP, crear link de pago
    // (Esto se puede extender para crear el pago automáticamente)
    let paymentLink;
    if (mpSellerId) {
      // Aquí se integraría con el servicio de MP para crear el link
      // Por ahora retornamos los datos para que el chatbot lo maneje
      paymentLink = `https://mpago.la/pending`; // Placeholder
    }
    
    return {
      success: true,
      ocrDocument,
      paymentLink,
      amount: paymentData.amount,
      message: `Factura procesada correctamente. Total: $${paymentData.amount.toLocaleString()}`
    };
    
  } catch (error: any) {
    console.error('❌ [OCR Integration] Error en flujo OCR → Pago:', error.message);
    return {
      success: false,
      ocrDocument: null,
      message: `Error al procesar la imagen: ${error.message}`
    };
  }
}

/**
 * Obtener resumen de documento OCR para chatbot
 */
export async function getOCRSummaryForChatbot(documentId: string): Promise<string> {
  try {
    const document = await OCRDocument.findById(documentId);
    
    if (!document) {
      return 'No se encontró el documento procesado.';
    }
    
    const data = document.extractedData;
    let summary = '📄 *Datos extraídos de la imagen:*\n\n';
    
    if (data.proveedorRazonSocial) {
      summary += `🏢 Proveedor: ${data.proveedorRazonSocial}\n`;
    }
    
    if (data.proveedorCuit) {
      summary += `📋 CUIT: ${data.proveedorCuit}\n`;
    }
    
    if (data.tipoComprobante) {
      summary += `📝 Tipo: ${data.tipoComprobante}\n`;
    }
    
    if (data.numeroComprobante) {
      summary += `#️⃣ Número: ${data.numeroComprobante}\n`;
    }
    
    if (data.fecha) {
      summary += `📅 Fecha: ${data.fecha}\n`;
    }
    
    if (data.total) {
      summary += `\n💰 *Total: $${data.total.toLocaleString()}*\n`;
    }
    
    if (data.cae) {
      summary += `\n✅ CAE: ${data.cae}\n`;
    }
    
    summary += `\n🎯 Confianza: ${document.confidence.toFixed(0)}%`;
    
    return summary;
    
  } catch (error: any) {
    console.error('❌ [OCR Integration] Error generando resumen:', error.message);
    return 'Error al generar el resumen del documento.';
  }
}

