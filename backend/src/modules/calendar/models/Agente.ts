// 👨‍⚕️ Modelo de Agente
import mongoose, { Schema, Document } from 'mongoose';

export enum DiaSemana {
  DOMINGO = 0,
  LUNES = 1,
  MARTES = 2,
  MIERCOLES = 3,
  JUEVES = 4,
  VIERNES = 5,
  SABADO = 6
}

export enum ModoAtencion {
  TURNOS_PROGRAMADOS = 'turnos_programados',  // Turnos con horarios específicos
  TURNOS_LIBRES = 'turnos_libres',            // Sin horarios, por orden de llegada
  MIXTO = 'mixto'                              // Ambos modos
}

export interface Disponibilidad {
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFin: string;
  activo: boolean;
}

export interface IAgente extends Document {
  empresaId: string;
  
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  avatar?: string;
  
  especialidad?: string;
  descripcion?: string;
  titulo?: string;
  
  // Configuración de atención
  modoAtencion: ModoAtencion;
  disponibilidad: Disponibilidad[];
  
  // Para turnos programados
  duracionTurnoPorDefecto: number;
  bufferEntreturnos: number;
  
  // Para turnos libres
  capacidadSimultanea?: number;  // Cuántos pacientes puede atender a la vez
  maximoTurnosPorDia?: number;
  
  activo: boolean;
  
  creadoEn: Date;
  actualizadoEn: Date;
}

const DisponibilidadSchema = new Schema<Disponibilidad>(
  {
    diaSemana: {
      type: Number,
      required: true,
      min: 0,
      max: 6
    },
    horaInicio: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    horaFin: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    activo: {
      type: Boolean,
      default: true
    }
  },
  { _id: false }
);

const AgenteSchema = new Schema<IAgente>(
  {
    empresaId: {
      type: String,
      required: true,
      index: true
    },
    
    nombre: {
      type: String,
      required: true
    },
    apellido: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    telefono: String,
    avatar: String,
    
    especialidad: String,
    descripcion: String,
    titulo: String,
    
    // Configuración de atención
    modoAtencion: {
      type: String,
      enum: Object.values(ModoAtencion),
      default: ModoAtencion.TURNOS_PROGRAMADOS
    },
    disponibilidad: {
      type: [DisponibilidadSchema],
      default: []
    },
    
    // Para turnos programados
    duracionTurnoPorDefecto: {
      type: Number,
      default: 30
    },
    bufferEntreturnos: {
      type: Number,
      default: 5
    },
    
    // Para turnos libres
    capacidadSimultanea: {
      type: Number,
      default: 1,
      min: 1
    },
    maximoTurnosPorDia: Number,
    
    activo: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: {
      createdAt: 'creadoEn',
      updatedAt: 'actualizadoEn'
    },
    collection: 'agentes'
  }
);

// Índices
AgenteSchema.index({ empresaId: 1, activo: 1 });
AgenteSchema.index({ empresaId: 1, email: 1 }, { unique: true });

export const AgenteModel = mongoose.model<IAgente>('Agente', AgenteSchema);
