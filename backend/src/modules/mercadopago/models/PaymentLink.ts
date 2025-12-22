// 💳 Modelo de Link de Pago de Mercado Pago
import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentLink extends Document {
  sellerId: string;         // userId de MP del vendedor
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
  createdAt: Date;
  updatedAt: Date;
}

const PaymentLinkSchema = new Schema<IPaymentLink>({
  sellerId: { 
    type: String, 
    required: true,
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
  }
}, {
  timestamps: true
});

// Índice compuesto
PaymentLinkSchema.index({ sellerId: 1, active: 1 });

export const PaymentLink = mongoose.model<IPaymentLink>('MPPaymentLink', PaymentLinkSchema);
export default PaymentLink;
