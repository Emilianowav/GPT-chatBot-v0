// 📊 Sistema de Logging para Flujos
import mongoose from 'mongoose';

export interface FlowLogEntry {
  timestamp: Date;
  telefono: string;
  empresaId: string;
  flujo: string;
  estado: string;
  accion: 'inicio' | 'transicion' | 'fin' | 'error' | 'cancelacion';
  mensaje?: string;
  data?: Record<string, any>;
  error?: string;
}

const FlowLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now, index: true },
  telefono: { type: String, required: true, index: true },
  empresaId: { type: String, required: true, index: true },
  flujo: { type: String, required: true, index: true },
  estado: { type: String },
  accion: { 
    type: String, 
    enum: ['inicio', 'transicion', 'fin', 'error', 'cancelacion'],
    required: true 
  },
  mensaje: { type: String },
  data: { type: mongoose.Schema.Types.Mixed },
  error: { type: String }
}, {
  collection: 'flow_logs',
  timestamps: false
});

// Índices compuestos para consultas comunes
FlowLogSchema.index({ telefono: 1, timestamp: -1 });
FlowLogSchema.index({ empresaId: 1, timestamp: -1 });
FlowLogSchema.index({ flujo: 1, timestamp: -1 });

const FlowLogModel = mongoose.model('FlowLog', FlowLogSchema);

/**
 * Logger de flujos
 */
export class FlowLogger {
  /**
   * Registrar inicio de flujo
   */
  static async logInicio(
    telefono: string,
    empresaId: string,
    flujo: string,
    mensaje?: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      await FlowLogModel.create({
        telefono,
        empresaId,
        flujo,
        estado: 'inicio',
        accion: 'inicio',
        mensaje,
        data
      });
      
      console.log(`📝 [FlowLog] Inicio: ${flujo} - ${telefono}`);
    } catch (error) {
      console.error('❌ Error guardando log de inicio:', error);
    }
  }

  /**
   * Registrar transición de estado
   */
  static async logTransicion(
    telefono: string,
    empresaId: string,
    flujo: string,
    estadoAnterior: string,
    estadoNuevo: string,
    mensaje?: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      await FlowLogModel.create({
        telefono,
        empresaId,
        flujo,
        estado: `${estadoAnterior} → ${estadoNuevo}`,
        accion: 'transicion',
        mensaje,
        data
      });
      
      console.log(`📝 [FlowLog] Transición: ${flujo} - ${estadoAnterior} → ${estadoNuevo}`);
    } catch (error) {
      console.error('❌ Error guardando log de transición:', error);
    }
  }

  /**
   * Registrar fin de flujo
   */
  static async logFin(
    telefono: string,
    empresaId: string,
    flujo: string,
    mensaje?: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      await FlowLogModel.create({
        telefono,
        empresaId,
        flujo,
        estado: 'finalizado',
        accion: 'fin',
        mensaje,
        data
      });
      
      console.log(`📝 [FlowLog] Fin: ${flujo} - ${telefono}`);
    } catch (error) {
      console.error('❌ Error guardando log de fin:', error);
    }
  }

  /**
   * Registrar error en flujo
   */
  static async logError(
    telefono: string,
    empresaId: string,
    flujo: string,
    estado: string,
    error: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      await FlowLogModel.create({
        telefono,
        empresaId,
        flujo,
        estado,
        accion: 'error',
        error,
        data
      });
      
      console.error(`📝 [FlowLog] Error: ${flujo} - ${error}`);
    } catch (err) {
      console.error('❌ Error guardando log de error:', err);
    }
  }

  /**
   * Registrar cancelación de flujo
   */
  static async logCancelacion(
    telefono: string,
    empresaId: string,
    flujo: string,
    estado: string,
    razon?: string
  ): Promise<void> {
    try {
      await FlowLogModel.create({
        telefono,
        empresaId,
        flujo,
        estado,
        accion: 'cancelacion',
        mensaje: razon
      });
      
      console.log(`📝 [FlowLog] Cancelación: ${flujo} - ${razon || 'Sin razón'}`);
    } catch (error) {
      console.error('❌ Error guardando log de cancelación:', error);
    }
  }

  /**
   * Obtener historial de flujos de un usuario
   */
  static async obtenerHistorial(
    telefono: string,
    empresaId: string,
    limite: number = 50
  ): Promise<FlowLogEntry[]> {
    try {
      const logs = await FlowLogModel
        .find({ telefono, empresaId })
        .sort({ timestamp: -1 })
        .limit(limite)
        .lean();
      
      return logs as FlowLogEntry[];
    } catch (error) {
      console.error('❌ Error obteniendo historial de flujos:', error);
      return [];
    }
  }

  /**
   * Obtener estadísticas de flujos
   */
  static async obtenerEstadisticas(
    empresaId: string,
    fechaInicio?: Date,
    fechaFin?: Date
  ): Promise<any> {
    try {
      const filtro: any = { empresaId };
      
      if (fechaInicio || fechaFin) {
        filtro.timestamp = {};
        if (fechaInicio) filtro.timestamp.$gte = fechaInicio;
        if (fechaFin) filtro.timestamp.$lte = fechaFin;
      }
      
      const stats = await FlowLogModel.aggregate([
        { $match: filtro },
        {
          $group: {
            _id: {
              flujo: '$flujo',
              accion: '$accion'
            },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.flujo',
            acciones: {
              $push: {
                accion: '$_id.accion',
                count: '$count'
              }
            },
            total: { $sum: '$count' }
          }
        },
        { $sort: { total: -1 } }
      ]);
      
      return stats;
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas de flujos:', error);
      return [];
    }
  }

  /**
   * Limpiar logs antiguos (más de 30 días)
   */
  static async limpiarLogsAntiguos(): Promise<number> {
    try {
      const hace30Dias = new Date();
      hace30Dias.setDate(hace30Dias.getDate() - 30);
      
      const result = await FlowLogModel.deleteMany({
        timestamp: { $lt: hace30Dias }
      });
      
      if (result.deletedCount > 0) {
        console.log(`🧹 Logs antiguos eliminados: ${result.deletedCount}`);
      }
      
      return result.deletedCount;
    } catch (error) {
      console.error('❌ Error limpiando logs antiguos:', error);
      return 0;
    }
  }
}

// Limpiar logs antiguos cada día
setInterval(() => {
  FlowLogger.limpiarLogsAntiguos().catch(console.error);
}, 24 * 60 * 60 * 1000);
