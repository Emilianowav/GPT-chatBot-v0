// 🧾 Modelo de Vendedor AFIP
import mongoose, { Schema, Document } from 'mongoose';

export interface IAFIPSeller extends Document {
  empresaId: string;           // ID de la empresa en el sistema
  cuit: string;                // CUIT del contribuyente
  razonSocial: string;         // Razón social
  puntoVenta: number;          // Punto de venta por defecto
  certificado: string;         // Certificado AFIP (PEM)
  clavePrivada: string;        // Clave privada (PEM)
  environment: 'testing' | 'production'; // Ambiente
  activo: boolean;             // Si está activo
  
  // Tokens de autenticación (se renuevan cada 12 horas)
  token?: string;
  sign?: string;
  tokenExpiration?: Date;
  
  // Configuración
  tipoComprobanteDefault?: number; // Tipo de comprobante por defecto
  conceptoDefault?: number;        // Concepto por defecto (1=Productos, 2=Servicios)
  
  // Estadísticas
  totalFacturas: number;
  totalNotasCredito: number;
  totalNotasDebito: number;
  
  createdAt: Date;
  updatedAt: Date;
}

const AFIPSellerSchema = new Schema<IAFIPSeller>({
  empresaId: {
    type: String,
    required: true,
    index: true
  },
  cuit: {
    type: String,
    required: true,
    index: true
  },
  razonSocial: {
    type: String,
    required: true
  },
  puntoVenta: {
    type: Number,
    required: true,
    default: 1
  },
  certificado: {
    type: String,
    required: true
  },
  clavePrivada: {
    type: String,
    required: true
  },
  environment: {
    type: String,
    enum: ['testing', 'production'],
    default: 'production'
  },
  activo: {
    type: Boolean,
    default: true
  },
  
  // Tokens
  token: String,
  sign: String,
  tokenExpiration: Date,
  
  // Configuración
  tipoComprobanteDefault: {
    type: Number,
    default: 11 // Factura C
  },
  conceptoDefault: {
    type: Number,
    default: 1 // Productos
  },
  
  // Estadísticas
  totalFacturas: {
    type: Number,
    default: 0
  },
  totalNotasCredito: {
    type: Number,
    default: 0
  },
  totalNotasDebito: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Índices
AFIPSellerSchema.index({ empresaId: 1, activo: 1 });
AFIPSellerSchema.index({ cuit: 1 });

export const AFIPSeller = mongoose.model<IAFIPSeller>('AFIPSeller', AFIPSellerSchema);
export default AFIPSeller;
