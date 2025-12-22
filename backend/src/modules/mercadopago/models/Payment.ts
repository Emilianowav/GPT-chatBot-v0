// 💰 Modelo de Pago de Mercado Pago
import mongoose, { Schema, Document } from 'mongoose';

export enum PaymentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  AUTHORIZED = 'authorized',
  IN_PROCESS = 'in_process',
  IN_MEDIATION = 'in_mediation',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  CHARGED_BACK = 'charged_back'
}

export interface IPayment extends Document {
  // Identificadores
  mpPaymentId: string;          // ID del pago en MP
  sellerId: string;             // userId de MP del vendedor
  empresaId?: string;           // ID o nombre de la empresa (para filtrar por empresa)
  paymentLinkId?: string;       // ID del PaymentLink (si aplica)
  externalReference?: string;   // Referencia externa
  
  // Datos del pago
  status: PaymentStatus;
  statusDetail?: string;
  amount: number;
  currency: string;
  
  // Método de pago
  paymentMethodId?: string;     // visa, master, etc
  paymentTypeId?: string;       // credit_card, debit_card, etc
  installments?: number;
  
  // Datos del pagador
  payerEmail?: string;
  payerName?: string;
  payerPhone?: string;
  payerDocType?: string;
  payerDocNumber?: string;
  
  // Fechas
  dateCreated?: Date;
  dateApproved?: Date;
  dateLastUpdated?: Date;
  
  // Metadata
  metadata?: Record<string, any>;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>({
  mpPaymentId: { 
    type: String, 
    required: true,
    unique: true,
    index: true 
  },
  sellerId: { 
    type: String, 
    required: true,
    index: true 
  },
  empresaId: {
    type: String,
    index: true
  },
  paymentLinkId: { 
    type: String,
    index: true 
  },
  externalReference: { 
    type: String,
    index: true 
  },
  
  status: { 
    type: String, 
    enum: Object.values(PaymentStatus),
    required: true,
    index: true
  },
  statusDetail: String,
  amount: { 
    type: Number, 
    required: true 
  },
  currency: { 
    type: String, 
    default: 'ARS' 
  },
  
  paymentMethodId: String,
  paymentTypeId: String,
  installments: Number,
  
  payerEmail: String,
  payerName: String,
  payerPhone: String,
  payerDocType: String,
  payerDocNumber: String,
  
  dateCreated: Date,
  dateApproved: Date,
  dateLastUpdated: Date,
  
  metadata: Schema.Types.Mixed
}, {
  timestamps: true
});

// Índices compuestos
PaymentSchema.index({ sellerId: 1, status: 1 });
PaymentSchema.index({ sellerId: 1, createdAt: -1 });
PaymentSchema.index({ empresaId: 1, status: 1 });
PaymentSchema.index({ empresaId: 1, createdAt: -1 });

export const Payment = mongoose.model<IPayment>('MPPayment', PaymentSchema);
export default Payment;
