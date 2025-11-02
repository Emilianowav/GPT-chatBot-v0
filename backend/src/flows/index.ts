// 🔄 Registro central de flujos
import { flowManager } from './FlowManager.js';
import { confirmacionTurnosFlow } from './confirmacionTurnosFlow.js';
import { reservaTurnosFlow } from './reservaTurnosFlow.js';
import { notificacionesViajesFlow } from './notificacionesViajesFlow.js';
import { conversacionGeneralFlow } from './conversacionGeneralFlow.js';

/**
 * Inicializar y registrar todos los flujos
 */
export function initializeFlows(): void {
  console.log('🔄 Inicializando sistema de flujos dinámicos...');
  
  // Registrar flujos en orden de prioridad (de mayor a menor)
  // Los flujos se evalúan en el orden de prioridad definido en cada uno
  
  flowManager.registerFlow(confirmacionTurnosFlow);
  flowManager.registerFlow(notificacionesViajesFlow);
  flowManager.registerFlow(reservaTurnosFlow);
  flowManager.registerFlow(conversacionGeneralFlow); // Fallback
  
  console.log('✅ Sistema de flujos inicializado correctamente');
  console.log('📋 Flujos registrados:');
  console.log('   1. confirmacion_turnos (urgente)');
  console.log('   2. notificaciones_viajes (urgente)');
  console.log('   3. reserva_turnos (normal)');
  console.log('   4. conversacion_general (baja - fallback)');
}

export { flowManager } from './FlowManager.js';
export * from './types.js';
