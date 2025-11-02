// 🔗 Servicio de Integración de Flujos
// Permite iniciar flujos programáticamente desde otros servicios

import { flowManager } from '../flows/index.js';
import { EmpresaModel } from '../models/Empresa.js';

/**
 * Iniciar flujo de confirmación de turno
 */
export async function iniciarFlujoConfirmacionTurno(
  telefono: string,
  empresaId: string,
  turnoId: string,
  mensaje?: string
): Promise<void> {
  try {
    console.log(`🔔 Iniciando flujo de confirmación para ${telefono}, turno: ${turnoId}`);
    
    await flowManager.startFlow(
      telefono,
      empresaId,
      'confirmacion_turnos',
      {
        turnoId,
        mensaje: mensaje || '¿Confirmás tu turno?'
      }
    );
    
    console.log('✅ Flujo de confirmación iniciado correctamente');
  } catch (error) {
    console.error('❌ Error iniciando flujo de confirmación:', error);
    throw error;
  }
}

/**
 * Iniciar flujo de notificación de viajes
 */
export async function iniciarFlujoNotificacionViajes(
  telefono: string,
  empresaId: string,
  viajes: any[]
): Promise<void> {
  try {
    console.log(`🚗 Iniciando flujo de notificación de viajes para ${telefono}`);
    console.log(`   Viajes:`, viajes.length);
    
    await flowManager.startFlow(
      telefono,
      empresaId,
      'notificacion_viajes',
      {
        viajes
      }
    );
    
    console.log('✅ Flujo de notificación de viajes iniciado correctamente');
  } catch (error) {
    console.error('❌ Error iniciando flujo de notificación de viajes:', error);
    throw error;
  }
}

/**
 * Verificar si un usuario tiene un flujo activo
 */
export async function tieneFlujosActivos(
  telefono: string,
  empresaId: string
): Promise<boolean> {
  try {
    const state = await flowManager.getState(telefono, empresaId);
    return state !== null && state.flujo_activo !== null;
  } catch (error) {
    console.error('❌ Error verificando flujos activos:', error);
    return false;
  }
}

/**
 * Obtener información del flujo activo de un usuario
 */
export async function obtenerFlujoActivo(
  telefono: string,
  empresaId: string
): Promise<{ flujo: string; estado: string; prioridad: string } | null> {
  try {
    const state = await flowManager.getState(telefono, empresaId);
    
    if (!state || !state.flujo_activo) {
      return null;
    }
    
    return {
      flujo: state.flujo_activo,
      estado: state.estado_actual || '',
      prioridad: state.prioridad
    };
  } catch (error) {
    console.error('❌ Error obteniendo flujo activo:', error);
    return null;
  }
}

/**
 * Cancelar cualquier flujo activo de un usuario
 */
export async function cancelarFlujosActivos(
  telefono: string,
  empresaId: string
): Promise<void> {
  try {
    await flowManager.cancelFlow(telefono, empresaId);
    console.log(`🚫 Flujos cancelados para ${telefono}`);
  } catch (error) {
    console.error('❌ Error cancelando flujos:', error);
    throw error;
  }
}

/**
 * Encolar un flujo para ejecución posterior
 */
export async function encolarFlujo(
  telefono: string,
  empresaId: string,
  nombreFlujo: string
): Promise<void> {
  try {
    await flowManager.enqueueFlow(telefono, empresaId, nombreFlujo);
    console.log(`📥 Flujo ${nombreFlujo} encolado para ${telefono}`);
  } catch (error) {
    console.error('❌ Error encolando flujo:', error);
    throw error;
  }
}

/**
 * Obtener phoneNumberId de una empresa
 */
export async function obtenerPhoneNumberId(empresaId: string): Promise<string> {
  try {
    const empresa = await EmpresaModel.findById(empresaId);
    
    if (!empresa) {
      throw new Error(`Empresa no encontrada: ${empresaId}`);
    }
    
    // Extraer phoneNumberId del teléfono de WhatsApp
    // Formato esperado: "whatsapp:+1234567890" o "+1234567890"
    const telefono = empresa.telefono;
    
    if (!telefono) {
      throw new Error(`Empresa ${empresaId} no tiene teléfono configurado`);
    }
    
    // Por ahora retornamos el teléfono limpio
    // En producción, esto debería venir de la configuración de Meta
    return telefono.replace('whatsapp:', '').replace('+', '');
  } catch (error) {
    console.error('❌ Error obteniendo phoneNumberId:', error);
    throw error;
  }
}
