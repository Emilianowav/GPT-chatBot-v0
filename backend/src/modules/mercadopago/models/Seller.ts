// 💳 Modelo de Vendedor conectado a Mercado Pago
import mongoose, { Schema, Document } from 'mongoose';

export interface ISeller extends Document {
  userId: string;           // User ID de Mercado Pago
  accessToken: string;      // Token de acceso
  refreshToken: string;     // Token para renovar
  publicKey?: string;       // Public key del vendedor
  expiresIn?: number;       // Tiempo de expiración en segundos
  internalId?: string;      // ID interno (empresa en nuestro sistema)
  email?: string;           // Email del vendedor
  businessName?: string;    // Nombre del negocio
  active: boolean;          // Si está activo
  connectedAt: Date;        // Fecha de conexión
  updatedAt: Date;          // Última actualización
}

const SellerSchema = new Schema<ISeller>({
  userId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  accessToken: { 
    type: String, 
    required: true 
  },
  refreshToken: { 
    type: String, 
    required: true 
  },
  publicKey: { 
    type: String 
  },
  expiresIn: { 
    type: Number 
  },
  internalId: { 
    type: String,
    index: true 
  },
  email: { 
    type: String 
  },
  businessName: { 
    type: String 
  },
  active: { 
    type: Boolean, 
    default: true 
  },
  connectedAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Índice compuesto para búsquedas por internalId
SellerSchema.index({ internalId: 1, active: 1 });

export const Seller = mongoose.model<ISeller>('MPSeller', SellerSchema);
export default Seller;
