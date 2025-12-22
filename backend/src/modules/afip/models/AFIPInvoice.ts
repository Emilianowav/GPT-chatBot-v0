// 🧾 Modelo de Comprobante AFIP
import mongoose, { Schema, Document } from 'mongoose';

export interface IAFIPInvoice extends Document {
  empresaId: string;           // ID de la empresa
  sellerId: string;            // ID del AFIPSeller
  
  // Datos del comprobante
  tipoComprobante: number;     // 1=Factura A, 6=Factura B, 11=Factura C, etc
  puntoVenta: number;          // Punto de venta
  numero: number;              // Número de comprobante
  fecha: string;               // Fecha formato YYYYMMDD
  
  // Cliente
  clienteTipoDoc: number;      // Tipo de documento (80=CUIT, 96=DNI, 99=Consumidor Final)
  clienteNroDoc: number;       // Número de documento
  clienteRazonSocial?: string; // Razón social del cliente
  
  // Concepto
  concepto: number;            // 1=Productos, 2=Servicios, 3=Productos y Servicios
  
  // Importes
  importeNeto: number;         // Importe neto gravado
  importeIVA: number;          // Importe IVA
  importeExento: number;       // Importe exento
  importeTotal: number;        // Importe total
  
  // IVA (array de alícuotas)
  iva?: Array<{
    id: number;                // ID de alícuota (3=0%, 4=10.5%, 5=21%, 6=27%)
    baseImp: number;           // Base imponible
    importe: number;           // Importe de IVA
  }>;
  
  // Comprobante asociado (para NC/ND)
  comprobanteAsociado?: {
    tipo: number;
    puntoVenta: number;
    numero: number;
  };
  
  // Respuesta de AFIP
  cae?: string;                // CAE (Código de Autorización Electrónico)
  caeVencimiento?: string;     // Fecha de vencimiento del CAE
  resultado: 'A' | 'R' | 'P';  // A=Aprobado, R=Rechazado, P=Pendiente
  observaciones?: string;      // Observaciones de AFIP
  
  // Metadata
  rawResponse?: any;           // Respuesta completa de AFIP
  environment: 'testing' | 'production'; // Ambiente en que fue emitido
  
  createdAt: Date;
  updatedAt: Date;
}

const AFIPInvoiceSchema = new Schema<IAFIPInvoice>({
  empresaId: {
    type: String,
    required: true,
    index: true
  },
  sellerId: {
    type: String,
    required: true,
    index: true
  },
  
  // Datos del comprobante
  tipoComprobante: {
    type: Number,
    required: true,
    index: true
  },
  puntoVenta: {
    type: Number,
    required: true
  },
  numero: {
    type: Number,
    required: true
  },
  fecha: {
    type: String,
    required: true
  },
  
  // Cliente
  clienteTipoDoc: {
    type: Number,
    required: true
  },
  clienteNroDoc: {
    type: Number,
    required: true
  },
  clienteRazonSocial: String,
  
  // Concepto
  concepto: {
    type: Number,
    required: true,
    default: 1
  },
  
  // Importes
  importeNeto: {
    type: Number,
    required: true
  },
  importeIVA: {
    type: Number,
    default: 0
  },
  importeExento: {
    type: Number,
    default: 0
  },
  importeTotal: {
    type: Number,
    required: true
  },
  
  // IVA
  iva: [{
    id: Number,
    baseImp: Number,
    importe: Number
  }],
  
  // Comprobante asociado
  comprobanteAsociado: {
    tipo: Number,
    puntoVenta: Number,
    numero: Number
  },
  
  // Respuesta AFIP
  cae: String,
  caeVencimiento: String,
  resultado: {
    type: String,
    enum: ['A', 'R', 'P'],
    default: 'P'
  },
  observaciones: String,
  rawResponse: Schema.Types.Mixed,
  environment: {
    type: String,
    enum: ['testing', 'production'],
    default: 'production'
  }
}, {
  timestamps: true
});

// Índices compuestos
AFIPInvoiceSchema.index({ empresaId: 1, fecha: -1 });
AFIPInvoiceSchema.index({ empresaId: 1, tipoComprobante: 1, puntoVenta: 1, numero: 1 });
AFIPInvoiceSchema.index({ sellerId: 1, createdAt: -1 });
AFIPInvoiceSchema.index({ cae: 1 });

export const AFIPInvoice = mongoose.model<IAFIPInvoice>('AFIPInvoice', AFIPInvoiceSchema);
export default AFIPInvoice;
