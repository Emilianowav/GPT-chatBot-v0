// 💳 Modelo de Link de Pago de Mercado Pago
import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentLink extends Document {
  sellerId: string;         // userId de MP del vendedor
  empresaId?: string;       // ID de la empresa (para filtrado cuando mismo seller en múltiples empresas)
  slug: string;             // URL amigable única
  title: string;            // Nombre del producto/servicio
  description?: string;     // Descripción opcional
  imageUrl?: string;        // URL de imagen
  category?: string;        // Categoría del producto (mejora tasa de aprobación)
  priceType: 'fixed' | 'variable'; // Tipo de precio
  unitPrice: number;        // Precio fijo o mínimo
  minPrice?: number;        // Precio mínimo (si variable)
  maxPrice?: number;        // Precio máximo (si variable)
  currency: string;         // Moneda (ARS, USD, etc)
  active: boolean;          // Si está activo
  totalUses: number;        // Cantidad de usos
  totalRevenue: number;     // Ingresos totales
  // Datos de reserva pendiente (para workflow de reservas)
  pendingBooking?: {
    contactoId: string;     // ID del contacto que hizo la reserva
    clientePhone: string;   // Teléfono del cliente
    bookingData: any;       // Datos completos de la reserva para crear en API
    apiConfigId: string;    // ID de la configuración API
    endpointId: string;     // ID del endpoint para crear reserva
  };
  mpPreferenceId?: string;  // ID de la preferencia de MP generada
  createdAt: Date;
  updatedAt: Date;
}

const PaymentLinkSchema = new Schema<IPaymentLink>({
  sellerId: { 
    type: String, 
    required: true,
    index: true 
  },
  empresaId: {
    type: String,
    index: true
  },
  slug: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String,
    default: ''
  },
  imageUrl: { 
    type: String 
  },
  category: {
    type: String,
    default: 'services'
  },
  priceType: { 
    type: String, 
    enum: ['fixed', 'variable'],
    default: 'fixed'
  },
  unitPrice: { 
    type: Number, 
    required: true,
    min: 1
  },
  minPrice: { 
    type: Number 
  },
  maxPrice: { 
    type: Number 
  },
  currency: { 
    type: String, 
    default: 'ARS'
  },
  active: { 
    type: Boolean, 
    default: true 
  },
  totalUses: { 
    type: Number, 
    default: 0 
  },
  totalRevenue: { 
    type: Number, 
    default: 0 
  },
  pendingBooking: {
    contactoId: { type: String, required: false },
    clientePhone: { type: String, required: false },
    bookingData: { type: Schema.Types.Mixed, required: false },
    apiConfigId: { type: String, required: false },
    endpointId: { type: String, required: false }
  },
  mpPreferenceId: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

// Índices compuestos para filtrado eficiente
PaymentLinkSchema.index({ sellerId: 1, active: 1 });
PaymentLinkSchema.index({ sellerId: 1, empresaId: 1 });

export const PaymentLink = mongoose.model<IPaymentLink>('MPPaymentLink', PaymentLinkSchema);
export default PaymentLink;
