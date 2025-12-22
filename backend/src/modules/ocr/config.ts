// 📸 Configuración del Módulo OCR
// Configuración para procesamiento de imágenes y extracción de datos

export interface OCRConfig {
  maxFileSize: number;
  allowedFormats: string[];
  tesseractLanguages: string[];
  imageQuality: number;
}

export const ocrConfig: OCRConfig = {
  maxFileSize: parseInt(process.env.OCR_MAX_FILE_SIZE || '10485760'), // 10MB
  allowedFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'],
  tesseractLanguages: ['spa', 'eng'], // Español e Inglés
  imageQuality: 90
};

// Patrones de regex para extracción de datos
export const extractionPatterns = {
  // CUIT: 20-12345678-9 o 20123456789
  cuit: /\b(\d{2})[.-]?(\d{8})[.-]?(\d{1})\b/g,
  
  // Montos: $1.234,56 o 1234.56
  amount: /\$?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/g,
  
  // Fecha: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
  date: /\b(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})\b|\b(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})\b/g,
  
  // CAE: 14 dígitos
  cae: /\bCAE[:\s]*(\d{14})\b/gi,
  
  // Número de factura: 0001-00000123 o similar
  invoiceNumber: /\b(\d{4})[.-](\d{8})\b/g,
  
  // Email
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  
  // Teléfono argentino
  phone: /\b(?:\+?54\s?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{4}[\s.-]?\d{4}\b/g
};

// Palabras clave para identificar tipos de comprobante
export const invoiceTypeKeywords = {
  facturaA: ['factura a', 'factura tipo a', 'cod. 01'],
  facturaB: ['factura b', 'factura tipo b', 'cod. 06'],
  facturaC: ['factura c', 'factura tipo c', 'cod. 11'],
  notaCredito: ['nota de crédito', 'nota credito', 'n/c'],
  notaDebito: ['nota de débito', 'nota debito', 'n/d'],
  ticket: ['ticket', 'comprobante', 'recibo']
};

// Palabras clave para identificar secciones
export const sectionKeywords = {
  proveedor: ['razón social', 'razon social', 'emisor', 'proveedor', 'vendedor'],
  cliente: ['cliente', 'comprador', 'destinatario', 'señor', 'señores'],
  total: ['total', 'importe total', 'total a pagar', 'total $'],
  subtotal: ['subtotal', 'sub total', 'neto'],
  iva: ['iva', 'i.v.a', 'impuesto'],
  items: ['descripción', 'descripcion', 'detalle', 'concepto', 'producto']
};

export default ocrConfig;
