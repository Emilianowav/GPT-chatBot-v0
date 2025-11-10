// 👤 Modelo de Usuario Administrador para MongoDB
import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAdminUser extends Document {
  _id: mongoose.Types.ObjectId;
  username: string;
  password: string;
  empresaId: string; // Referencia a la empresa que administra
  role: 'admin' | 'viewer' | 'super_admin';
  email?: string;
  activo: boolean;
  ultimoAcceso?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const AdminUserSchema = new Schema<IAdminUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    empresaId: {
      type: String,
      required: true,
      index: true
    },
    role: {
      type: String,
      enum: ['admin', 'viewer', 'super_admin'],
      default: 'viewer'
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    activo: {
      type: Boolean,
      default: true
    },
    ultimoAcceso: {
      type: Date
    }
  },
  {
    timestamps: true,
    collection: 'admin_users'
  }
);

// Índice compuesto para búsquedas rápidas
AdminUserSchema.index({ username: 1, empresaId: 1 });

// Hash de contraseña antes de guardar
AdminUserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Método para comparar contraseñas
AdminUserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

// No incluir password en las respuestas JSON
AdminUserSchema.set('toJSON', {
  transform: function(doc, ret) {
    const { password, ...rest } = ret;
    return rest;
  }
});

export const AdminUserModel = mongoose.model<IAdminUser>('AdminUser', AdminUserSchema);
