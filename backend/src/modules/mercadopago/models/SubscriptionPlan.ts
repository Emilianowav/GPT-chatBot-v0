// 💳 Modelo de Plan de Suscripción de Mercado Pago
import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscriptionPlan extends Document {
  sellerId: string;         // userId de MP del vendedor
  name: string;             // Nombre del plan
  description?: string;     // Descripción opcional
  amount: number;           // Monto del plan
  currency: string;         // Moneda
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  trialDays: number;        // Días de prueba gratis
  active: boolean;          // Si está activo
  subscriberCount: number;  // Cantidad de suscriptores
  mpPlanId?: string;        // ID del plan en MP (si se creó)
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionPlanSchema = new Schema<ISubscriptionPlan>({
  sellerId: { 
    type: String, 
    required: true,
    index: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String,
    default: ''
  },
  amount: { 
    type: Number, 
    required: true,
    min: 1
  },
  currency: { 
    type: String, 
    default: 'ARS'
  },
  frequency: { 
    type: String, 
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
    default: 'monthly'
  },
  trialDays: { 
    type: Number, 
    default: 0 
  },
  active: { 
    type: Boolean, 
    default: true 
  },
  subscriberCount: { 
    type: Number, 
    default: 0 
  },
  mpPlanId: { 
    type: String 
  }
}, {
  timestamps: true
});

SubscriptionPlanSchema.index({ sellerId: 1, active: 1 });

export const SubscriptionPlan = mongoose.model<ISubscriptionPlan>('MPSubscriptionPlan', SubscriptionPlanSchema);
export default SubscriptionPlan;
