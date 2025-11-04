// 🔄 Registro central de flujos
import { flowManager } from './FlowManager.js';
import { confirmacionTurnosFlow } from './confirmacionTurnosFlow.js';
import { notificacionViajesFlow } from './notificacionViajesFlow.js';
import { menuPrincipalFlow } from './menuPrincipalFlow.js';
import { gptFlow } from './gptFlow.js';

/**
 * Inicializar y registrar todos los flujos
 */
export function initializeFlows(): void {
  console.log('🔄 Inicializando sistema de flujos dinámicos...');
  
  // Registrar flujos en orden de prioridad (de mayor a menor)
  // Los flujos se evalúan en el orden de prioridad definido en cada uno
  
  flowManager.registerFlow(confirmacionTurnosFlow);    // Urgente - Confirmación de turnos
  flowManager.registerFlow(notificacionViajesFlow);    // Urgente - Notificaciones de viajes
  flowManager.registerFlow(menuPrincipalFlow);         // Normal - Menú principal (Reserva/Consulta/Cancelación)
  flowManager.registerFlow(gptFlow);                   // Baja - GPT Fallback (conversación con IA)
  
  console.log('✅ Sistema de flujos inicializado correctamente');
  console.log('📋 Flujos registrados:');
  console.log('   1. confirmacion_turnos (urgente)');
  console.log('   2. notificacion_viajes (urgente)');
  console.log('   3. menu_principal (normal - Reserva/Consulta/Cancelación)');
  console.log('   4. gpt_conversation (baja - Fallback GPT)');
}

export { flowManager } from './FlowManager.js';
export * from './types.js';
