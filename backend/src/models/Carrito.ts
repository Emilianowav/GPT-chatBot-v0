import mongoose, { Schema, Document } from 'mongoose';

export interface ICarritoItem {
  productoId: number;
  nombre: string;
  precio: string;
  cantidad: number;
  imagen?: string;
  permalink?: string;
  subtotal: number;
}

export interface ICarrito extends Document {
  contactoId: mongoose.Types.ObjectId;
  empresaId: string;
  items: ICarritoItem[];
  total: number;
  estado: 'activo' | 'pagado' | 'cancelado';
  fechaCreacion: Date;
  fechaActualizacion: Date;
  mercadoPagoLink?: string;
  mercadoPagoId?: string;
}

const CarritoItemSchema = new Schema<ICarritoItem>({
  productoId: { type: Number, required: true },
  nombre: { type: String, required: true },
  precio: { type: String, required: true },
  cantidad: { type: Number, required: true, default: 1 },
  imagen: { type: String },
  permalink: { type: String },
  subtotal: { type: Number, required: true }
}, { _id: false });

const CarritoSchema = new Schema<ICarrito>({
  contactoId: { type: Schema.Types.ObjectId, required: true, ref: 'ContactoEmpresa' },
  empresaId: { type: String, required: true },
  items: [CarritoItemSchema],
  total: { type: Number, required: true, default: 0 },
  estado: { 
    type: String, 
    enum: ['activo', 'pagado', 'cancelado'],
    default: 'activo'
  },
  fechaCreacion: { type: Date, default: Date.now },
  fechaActualizacion: { type: Date, default: Date.now },
  mercadoPagoLink: { type: String },
  mercadoPagoId: { type: String }
}, {
  timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' }
});

// Índices para búsquedas rápidas
CarritoSchema.index({ contactoId: 1, empresaId: 1, estado: 1 });

export const CarritoModel = mongoose.model<ICarrito>('Carrito', CarritoSchema);
