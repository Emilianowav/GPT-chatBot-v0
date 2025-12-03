// 👥 Modelo de Usuario de Empresa (Staff/Empleados)
import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export type RolUsuario = 'super_admin' | 'admin' | 'manager' | 'agent' | 'viewer';

export interface IUsuarioEmpresa extends Document {
  _id: mongoose.Types.ObjectId;
  username: string;
  password: string;
  email: string;
  nombre: string;
  apellido?: string;
  empresaId: string; // Referencia al nombre de la empresa
  rol: RolUsuario;
  permisos: string[]; // Permisos específicos
  activo: boolean;
  avatar?: string;
  telefono?: string;
  ultimoAcceso?: Date;
  createdBy: string; // ID del usuario que lo creó
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UsuarioEmpresaSchema = new Schema<IUsuarioEmpresa>(
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
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true
    },
    nombre: {
      type: String,
      required: true,
      trim: true
    },
    apellido: {
      type: String,
      trim: true
    },
    empresaId: {
      type: String,
      required: true,
      index: true
    },
    rol: {
      type: String,
      enum: ['super_admin', 'admin', 'manager', 'agent', 'viewer'],
      default: 'viewer',
      required: true
    },
    permisos: {
      type: [String],
      default: []
    },
    activo: {
      type: Boolean,
      default: true
    },
    avatar: {
      type: String
    },
    telefono: {
      type: String
    },
    ultimoAcceso: {
      type: Date
    },
    createdBy: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true,
    collection: 'usuarios_empresa'
  }
);

// Índices
UsuarioEmpresaSchema.index({ username: 1, empresaId: 1 });
UsuarioEmpresaSchema.index({ email: 1, empresaId: 1 });
UsuarioEmpresaSchema.index({ empresaId: 1, activo: 1 });

// Hash de contraseña antes de guardar
UsuarioEmpresaSchema.pre('save', async function(next) {
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
UsuarioEmpresaSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

export const UsuarioEmpresaModel = mongoose.model<IUsuarioEmpresa>('UsuarioEmpresa', UsuarioEmpresaSchema);
