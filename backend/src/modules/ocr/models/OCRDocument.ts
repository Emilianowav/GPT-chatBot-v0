// 📸 Modelo de Documento OCR
import mongoose, { Schema, Document } from 'mongoose';

export interface IOCRDocument extends Document {
  empresaId: string;           // ID de la empresa
  userId?: string;             // ID del usuario que subió
  
  // Archivo original
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl?: string;            // URL del archivo almacenado
  
  // Datos extraídos
  extractedData: {
    // Proveedor/Emisor
    proveedorCuit?: string;
    proveedorRazonSocial?: string;
    proveedorDireccion?: string;
    
    // Cliente
    clienteCuit?: string;
    clienteRazonSocial?: string;
    
    // Comprobante
    tipoComprobante?: string;  // Factura A/B/C, NC, ND, Ticket
    numeroComprobante?: string;
    puntoVenta?: string;
    fecha?: string;
    cae?: string;
    vencimientoCae?: string;
    
    // Importes
    subtotal?: number;
    iva?: number;
    total?: number;
    
    // Items
    items?: Array<{
      descripcion: string;
      cantidad?: number;
      precioUnitario?: number;
      subtotal?: number;
    }>;
    
    // Contacto
    email?: string;
    telefono?: string;
  };
  
  // Texto completo extraído
  rawText: string;
  
  // Confianza del OCR (0-100)
  confidence: number;
  
  // Estado del procesamiento
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  
  // Metadata
  processingTime?: number;     // Tiempo de procesamiento en ms
  
  // Validación AFIP
  afipValidated?: boolean;
  afipValidationDate?: Date;
  
  // Integración con otros módulos
  mercadopagoPaymentId?: string;
  afipInvoiceId?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const OCRDocumentSchema = new Schema<IOCRDocument>({
  empresaId: {
    type: String,
    required: true,
    index: true
  },
  userId: String,
  
  // Archivo
  fileName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  fileUrl: String,
  
  // Datos extraídos
  extractedData: {
    proveedorCuit: String,
    proveedorRazonSocial: String,
    proveedorDireccion: String,
    clienteCuit: String,
    clienteRazonSocial: String,
    tipoComprobante: String,
    numeroComprobante: String,
    puntoVenta: String,
    fecha: String,
    cae: String,
    vencimientoCae: String,
    subtotal: Number,
    iva: Number,
    total: Number,
    items: [{
      descripcion: String,
      cantidad: Number,
      precioUnitario: Number,
      subtotal: Number
    }],
    email: String,
    telefono: String
  },
  
  rawText: {
    type: String,
    required: true
  },
  
  confidence: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  errorMessage: String,
  
  processingTime: Number,
  
  afipValidated: Boolean,
  afipValidationDate: Date,
  
  mercadopagoPaymentId: String,
  afipInvoiceId: String
}, {
  timestamps: true
});

// Índices
OCRDocumentSchema.index({ empresaId: 1, createdAt: -1 });
OCRDocumentSchema.index({ status: 1 });
OCRDocumentSchema.index({ 'extractedData.proveedorCuit': 1 });
OCRDocumentSchema.index({ 'extractedData.numeroComprobante': 1 });

export const OCRDocument = mongoose.model<IOCRDocument>('OCRDocument', OCRDocumentSchema);
export default OCRDocument;
