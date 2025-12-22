// 📸 Servicio de OCR con Tesseract
import TesseractPkg from 'tesseract.js';
const Tesseract = TesseractPkg;
import { ocrConfig, extractionPatterns, invoiceTypeKeywords, sectionKeywords } from '../config.js';
import { OCRDocument } from '../models/OCRDocument.js';

/**
 * Procesa una imagen con OCR y extrae texto
 */
export async function processImageOCR(
  imageBuffer: Buffer,
  language: string = 'spa+eng'
): Promise<{ text: string; confidence: number }> {
  try {
    console.log('📸 [OCR] Iniciando procesamiento OCR...');
    const startTime = Date.now();
    
    const result = await Tesseract.recognize(imageBuffer, language, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`📸 [OCR] Progreso: ${Math.round(m.progress * 100)}%`);
        }
      }
    });
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ [OCR] Procesamiento completado en ${processingTime}ms`);
    console.log(`📊 [OCR] Confianza: ${result.data.confidence.toFixed(2)}%`);
    
    return {
      text: result.data.text,
      confidence: result.data.confidence
    };
    
  } catch (error: any) {
    console.error('❌ [OCR] Error en procesamiento:', error.message);
    throw new Error(`Error en OCR: ${error.message}`);
  }
}

/**
 * Extrae datos estructurados del texto OCR
 */
export function extractInvoiceData(text: string): any {
  const data: any = {};
  
  // Normalizar texto
  const normalizedText = text.toLowerCase();
  
  // Extraer CUIT
  const cuitMatches = Array.from(text.matchAll(extractionPatterns.cuit));
  if (cuitMatches.length > 0) {
    // Primer CUIT suele ser del proveedor
    const firstCuit = cuitMatches[0];
    data.proveedorCuit = `${firstCuit[1]}-${firstCuit[2]}-${firstCuit[3]}`;
    
    // Segundo CUIT suele ser del cliente
    if (cuitMatches.length > 1) {
      const secondCuit = cuitMatches[1];
      data.clienteCuit = `${secondCuit[1]}-${secondCuit[2]}-${secondCuit[3]}`;
    }
  }
  
  // Extraer tipo de comprobante
  for (const [type, keywords] of Object.entries(invoiceTypeKeywords)) {
    for (const keyword of keywords) {
      if (normalizedText.includes(keyword)) {
        data.tipoComprobante = type.replace(/([A-Z])/g, ' $1').trim();
        break;
      }
    }
    if (data.tipoComprobante) break;
  }
  
  // Extraer número de comprobante
  const invoiceNumberMatches = Array.from(text.matchAll(extractionPatterns.invoiceNumber));
  if (invoiceNumberMatches.length > 0) {
    const match = invoiceNumberMatches[0];
    data.numeroComprobante = `${match[1]}-${match[2]}`;
    data.puntoVenta = match[1];
  }
  
  // Extraer CAE
  const caeMatches = Array.from(text.matchAll(extractionPatterns.cae));
  if (caeMatches.length > 0) {
    data.cae = caeMatches[0][1];
  }
  
  // Extraer fechas
  const dateMatches = Array.from(text.matchAll(extractionPatterns.date));
  if (dateMatches.length > 0) {
    const firstDate = dateMatches[0];
    if (firstDate[1]) {
      // Formato DD/MM/YYYY
      data.fecha = `${firstDate[1]}/${firstDate[2]}/${firstDate[3]}`;
    } else if (firstDate[4]) {
      // Formato YYYY-MM-DD
      data.fecha = `${firstDate[6]}/${firstDate[5]}/${firstDate[4]}`;
    }
  }
  
  // Extraer montos
  const amounts = extractAmounts(text, normalizedText);
  if (amounts.total) data.total = amounts.total;
  if (amounts.subtotal) data.subtotal = amounts.subtotal;
  if (amounts.iva) data.iva = amounts.iva;
  
  // Extraer razón social del proveedor
  data.proveedorRazonSocial = extractProviderName(text, normalizedText);
  
  // Extraer email
  const emailMatches = Array.from(text.matchAll(extractionPatterns.email));
  if (emailMatches.length > 0) {
    data.email = emailMatches[0][0];
  }
  
  // Extraer teléfono
  const phoneMatches = Array.from(text.matchAll(extractionPatterns.phone));
  if (phoneMatches.length > 0) {
    data.telefono = phoneMatches[0][0];
  }
  
  return data;
}

/**
 * Extrae montos del texto
 */
function extractAmounts(text: string, normalizedText: string): any {
  const amounts: any = {};
  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLower = line.toLowerCase();
    
    // Buscar total
    if (lineLower.includes('total') && !lineLower.includes('subtotal')) {
      const amountMatch = line.match(extractionPatterns.amount);
      if (amountMatch) {
        amounts.total = parseAmount(amountMatch[amountMatch.length - 1]);
      }
    }
    
    // Buscar subtotal
    if (lineLower.includes('subtotal') || lineLower.includes('neto')) {
      const amountMatch = line.match(extractionPatterns.amount);
      if (amountMatch) {
        amounts.subtotal = parseAmount(amountMatch[amountMatch.length - 1]);
      }
    }
    
    // Buscar IVA
    if (lineLower.includes('iva') || lineLower.includes('i.v.a')) {
      const amountMatch = line.match(extractionPatterns.amount);
      if (amountMatch) {
        amounts.iva = parseAmount(amountMatch[amountMatch.length - 1]);
      }
    }
  }
  
  return amounts;
}

/**
 * Parsea un monto a número
 */
function parseAmount(amountStr: string): number {
  // Remover símbolos y espacios
  let cleaned = amountStr.replace(/[$\s]/g, '');
  
  // Determinar si usa punto o coma como decimal
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  
  if (lastComma > lastDot) {
    // Coma es decimal
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    // Punto es decimal
    cleaned = cleaned.replace(/,/g, '');
  }
  
  return parseFloat(cleaned) || 0;
}

/**
 * Extrae el nombre del proveedor
 */
function extractProviderName(text: string, normalizedText: string): string | undefined {
  const lines = text.split('\n');
  
  // Buscar línea con palabras clave de proveedor
  for (let i = 0; i < lines.length; i++) {
    const lineLower = lines[i].toLowerCase();
    
    for (const keyword of sectionKeywords.proveedor) {
      if (lineLower.includes(keyword)) {
        // La razón social suele estar en la misma línea o la siguiente
        const nextLine = lines[i + 1];
        if (nextLine && nextLine.trim().length > 3) {
          return nextLine.trim();
        }
        
        // O después de los dos puntos en la misma línea
        const parts = lines[i].split(':');
        if (parts.length > 1 && parts[1].trim().length > 3) {
          return parts[1].trim();
        }
      }
    }
  }
  
  // Si no se encuentra, tomar las primeras líneas no vacías
  const firstLines = lines.filter(l => l.trim().length > 3).slice(0, 3);
  if (firstLines.length > 0) {
    return firstLines[0].trim();
  }
  
  return undefined;
}

/**
 * Guarda el documento OCR procesado
 */
export async function saveOCRDocument(data: {
  empresaId: string;
  userId?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  rawText: string;
  confidence: number;
  extractedData: any;
  processingTime: number;
}): Promise<any> {
  try {
    const document = new OCRDocument({
      empresaId: data.empresaId,
      userId: data.userId,
      fileName: data.fileName,
      fileType: data.fileType,
      fileSize: data.fileSize,
      rawText: data.rawText,
      confidence: data.confidence,
      extractedData: data.extractedData,
      processingTime: data.processingTime,
      status: 'completed'
    });
    
    await document.save();
    
    console.log(`✅ [OCR] Documento guardado: ${document._id}`);
    
    return document;
    
  } catch (error: any) {
    console.error('❌ [OCR] Error guardando documento:', error.message);
    throw error;
  }
}

