// 🔄 Registro central de flujos (SOLO PARA BOT DE PASOS)
import { flowManager } from './FlowManager.js';
import { confirmacionTurnosFlow } from './confirmacionTurnosFlow.js';
import { notificacionViajesFlow } from './legacy/notificacionViajesFlow.js';
import { menuPrincipalFlow } from './menuPrincipalFlow.js';

/**
 * Inicializar y registrar todos los flujos del BOT DE PASOS
 * NOTA: El GPT conversacional se maneja directamente en whatsappController
 */
export function initializeFlows(): void {
  console.log('🔄 Inicializando sistema de flujos dinámicos (BOT DE PASOS)...');
  
  // Registrar flujos en orden de prioridad (de mayor a menor)
  // Estos flujos SOLO se usan cuando ConfiguracionBot.activo === true
  
  flowManager.registerFlow(confirmacionTurnosFlow);    // Urgente - Confirmación de turnos
  flowManager.registerFlow(notificacionViajesFlow);    // Urgente - Notificaciones de viajes
  flowManager.registerFlow(menuPrincipalFlow);         // Normal - Menú principal (Reserva/Consulta/Cancelación)
  
  console.log('✅ Sistema de flujos inicializado correctamente');
  console.log('📋 Flujos registrados (BOT DE PASOS):');
  console.log('   1. confirmacion_turnos (urgente)');
  console.log('   2. notificacion_viajes (urgente)');
  console.log('   3. menu_principal (normal - Reserva/Consulta/Cancelación)');
  console.log('');
  console.log('ℹ️  GPT conversacional se maneja independientemente en whatsappController');
}

export { flowManager } from './FlowManager.js';
export * from './types.js';
