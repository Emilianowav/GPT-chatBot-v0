// 🔔 Servicio Unificado de Notificaciones con Plantillas de Meta
// Sistema completamente nuevo y escalable

import axios from 'axios';
import { ConfiguracionModuloModel } from '../modules/calendar/models/ConfiguracionModulo.js';
import { AgenteModel } from '../modules/calendar/models/Agente.js';
import { TurnoModel } from '../modules/calendar/models/Turno.js';
import { ContactoEmpresaModel } from '../models/ContactoEmpresa.js';
import { EmpresaModel } from '../models/Empresa.js';

/**
 * Reemplazar variables en un objeto (recursivo)
 */
function reemplazarVariables(obj: any, variables: Record<string, any>): any {
  if (typeof obj === 'string') {
    return obj.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return variables[varName] !== undefined ? String(variables[varName]) : match;
    });
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => reemplazarVariables(item, variables));
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const result: any = {};
    for (const key in obj) {
      result[key] = reemplazarVariables(obj[key], variables);
    }
    return result;
  }
  
  return obj;
}

/**
 * Construir lista de turnos formateada
 */
function construirListaTurnos(turnos: any[], config: any): string {
  if (turnos.length === 0) {
    return `No tienes ${config.nomenclatura?.turnos?.toLowerCase() || 'turnos'} programados para hoy.`;
  }
  
  let lista = '';
  
  for (let i = 0; i < turnos.length; i++) {
    const turno = turnos[i];
    const fechaInicio = new Date(turno.fechaInicio);
    const hora = fechaInicio.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Argentina/Buenos_Aires'
    });
    
    lista += `${i + 1}. ${hora}`;
    
    const incluir = config.plantillasMeta?.notificacionDiariaAgentes?.programacion?.incluirDetalles;
    
    if (incluir?.nombreCliente && turno.clienteNombre) {
      lista += ` - ${turno.clienteNombre}`;
    }
    
    if (incluir?.origen && turno.datos?.origen) {
      lista += ` | Origen: ${turno.datos.origen}`;
    }
    
    if (incluir?.destino && turno.datos?.destino) {
      lista += ` | Destino: ${turno.datos.destino}`;
    }
    
    if (i < turnos.length - 1) {
      lista += ' || ';
    }
  }
  
  return lista;
}

/**
 * Enviar plantilla de Meta
 */
async function enviarPlantillaMeta(
  telefono: string,
  url: string,
  payload: any
): Promise<boolean> {
  try {
    const token = process.env.META_WHATSAPP_TOKEN || process.env.WHATSAPP_TOKEN;
    if (!token) {
      throw new Error('META_WHATSAPP_TOKEN no configurado');
    }

    const telefonoLimpio = telefono.replace(/[^\d+]/g, '');

    console.log('📤 [NotifMeta] Enviando plantilla:');
    console.log('   📞 Teléfono:', telefonoLimpio);
    console.log('   🌐 URL:', url);

    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ [NotifMeta] Plantilla enviada');
    console.log('   📨 Message ID:', response.data.messages?.[0]?.id);
    
    return true;

  } catch (error: any) {
    console.error('❌ [NotifMeta] Error:', error.response?.data || error.message);
    throw error;
  }
}

// Exportar funciones de procesamiento
export { procesarNotificacionesDiariasAgentes } from './notificaciones/agentesService.js';
export { procesarNotificacionesConfirmacion } from './notificaciones/confirmacionService.js';
export { enviarNotificacionPrueba } from './notificaciones/pruebaService.js';

// Exportar utilidades
export { reemplazarVariables, construirListaTurnos, enviarPlantillaMeta };
