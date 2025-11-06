// 🔔 Servicio de Confirmación Interactiva de Turnos
// ⚠️ NOTA: La lógica de manejo de respuestas se movió a notificacionViajesFlow.ts
// Este servicio ahora solo envía el mensaje inicial e inicia el flujo.

import { TurnoModel } from '../models/Turno.js';
import { ContactoEmpresaModel } from '../../../models/ContactoEmpresa.js';
import { enviarMensajeWhatsAppTexto } from '../../../services/metaService.js';
import { EmpresaModel } from '../../../models/Empresa.js';
import { iniciarFlujoNotificacionViajes } from '../../../services/flowIntegrationService.js';
import { ConfiguracionModuloModel } from '../models/ConfiguracionModulo.js';
import { enviarMensajePlantillaMeta, generarComponentesPlantilla } from '../../../services/metaTemplateService.js';

/**
 * Enviar notificación de confirmación con opciones
 * Construye el mensaje inicial y luego inicia el flujo en FlowManager
 */
export async function enviarNotificacionConfirmacion(
  clienteId: string,
  turnos: any[],
  empresaId: string
): Promise<boolean> {
  
  try {
    console.log(`🔔 [ConfirmacionTurnos] Enviando notificación a cliente ${clienteId}`);
    console.log(`   Turnos: ${turnos.length}`);
    
    const contacto = await ContactoEmpresaModel.findById(clienteId);
    if (!contacto || !contacto.telefono) {
      console.error('❌ Contacto sin teléfono');
      return false;
    }

    // Obtener configuración para verificar si usa plantilla de Meta
    const config = await ConfiguracionModuloModel.findOne({ empresaId });
    const notifConfirmacion = config?.notificaciones.find(n => n.tipo === 'confirmacion');
    
    // ✅ AUTO-CONFIGURAR PLANTILLA SI NO EXISTE
    if (config && notifConfirmacion && (!notifConfirmacion.usarPlantillaMeta || !notifConfirmacion.plantillaMeta)) {
      console.log('⚙️ Auto-configurando plantilla de Meta para confirmación de turnos...');
      
      notifConfirmacion.usarPlantillaMeta = true;
      notifConfirmacion.plantillaMeta = {
        nombre: 'clientes_sanjose',
        idioma: 'es',
        activa: true,
        componentes: {
          body: {
            parametros: [
              { tipo: 'text', variable: 'nombre_cliente' },
              { tipo: 'text', variable: 'fecha_hora' }
            ]
          }
        }
      };
      
      (config as any).markModified('notificaciones');
      await config.save();
      console.log('✅ Plantilla auto-configurada: clientes_sanjose (2 parámetros: nombre_cliente, fecha_hora)');
    }
    
    // Construir mensaje inicial
    let mensaje = `🚗 *Recordatorio de ${turnos.length > 1 ? 'viajes' : 'viaje'} para mañana*\n\n`;
    
    turnos.forEach((turno, index) => {
      const fechaInicio = new Date(turno.fechaInicio);
      const horas = String(fechaInicio.getUTCHours()).padStart(2, '0');
      const minutos = String(fechaInicio.getUTCMinutes()).padStart(2, '0');
      const hora = `${horas}:${minutos}`;
      
      const origen = turno.datos?.origen || 'No especificado';
      const destino = turno.datos?.destino || 'No especificado';
      const pasajeros = turno.datos?.pasajeros || '1';
      
      if (turnos.length > 1) {
        mensaje += `━━━━━━━━━━━━━━━━━━\n`;
        mensaje += `*Viaje ${index + 1}*\n\n`;
      }
      
      mensaje += `📍 *Origen:* ${origen}\n`;
      mensaje += `📍 *Destino:* ${destino}\n`;
      mensaje += `🕐 *Hora:* ${hora}\n`;
      mensaje += `👥 *Pasajeros:* ${pasajeros}\n\n`;
    });
    
    mensaje += `━━━━━━━━━━━━━━━━━━\n\n`;
    mensaje += `*¿Qué deseas hacer?*\n\n`;
    mensaje += `1️⃣ Confirmar ${turnos.length > 1 ? 'todos los viajes' : 'el viaje'}\n`;
    mensaje += `2️⃣ Editar un viaje específico\n`;
    mensaje += `\nResponde con el número de la opción.`;

    // Obtener empresa
    const empresa = await EmpresaModel.findOne({ nombre: empresaId });
    if (!empresa) {
      console.error('❌ No se encontró la empresa:', empresaId);
      return false;
    }

    const phoneNumberId = (empresa as any).phoneNumberId;
    if (!phoneNumberId) {
      console.error('❌ No se encontró phoneNumberId para la empresa:', empresaId);
      return false;
    }

    console.log(`📤 Enviando mensaje a ${contacto.telefono}`);
    
    let enviado = false;

    // ✅ OBLIGATORIO: Solo enviar con plantilla de Meta
    if (!notifConfirmacion?.usarPlantillaMeta || !notifConfirmacion?.plantillaMeta?.activa) {
      console.error('❌ [ConfirmacionTurnos] NO SE PUEDE ENVIAR: Plantilla de Meta no configurada o inactiva');
      console.error('   Las notificaciones DEBEN usar plantillas de Meta para abrir ventana de 24hs');
      return false;
    }

    console.log('📋 [ConfirmacionTurnos] Usando plantilla de Meta');
    console.log('   Plantilla:', notifConfirmacion.plantillaMeta.nombre);
    
    const plantilla = notifConfirmacion.plantillaMeta;
    
    // ✅ ESTRATEGIA: Enviar SOLO plantilla de Meta (no mensajes de texto adicionales)
    // Meta NO permite saltos de línea en parámetros, usar separadores visuales: " | "
    
    // 1. Construir detalles con separadores en lugar de saltos de línea
    let detallesViaje = '';
    
    turnos.forEach((turno, index) => {
      const fechaInicio = new Date(turno.fechaInicio);
      const horas = String(fechaInicio.getUTCHours()).padStart(2, '0');
      const minutos = String(fechaInicio.getUTCMinutes()).padStart(2, '0');
      const hora = `${horas}:${minutos}`;
      
      const origen = turno.datos?.origen || 'No especificado';
      const destino = turno.datos?.destino || 'No especificado';
      const pasajeros = turno.datos?.pasajeros || '1';
      
      if (turnos.length > 1) {
        detallesViaje += `Viaje ${index + 1}: `;
      }
      
      detallesViaje += `Hora: ${hora} | Origen: ${origen} | Destino: ${destino} | Pasajeros: ${pasajeros}`;
      
      if (index < turnos.length - 1) {
        detallesViaje += ' || ';  // Separador entre viajes
      }
    });
    
    const variables = {
      nombre_cliente: `${contacto.nombre} ${contacto.apellido}`,
      fecha_hora: detallesViaje  // Detalles completos con separadores
    };
    
    console.log('   Variables:', { 
      nombre_cliente: variables.nombre_cliente, 
      fecha_hora: variables.fecha_hora.substring(0, 100) + (variables.fecha_hora.length > 100 ? '...' : '')
    });
    
    // Generar componentes de la plantilla
    const componentes = generarComponentesPlantilla(plantilla, variables);

    // 2. Enviar SOLO plantilla de Meta (NO enviar mensaje de texto adicional)
    try {
      enviado = await enviarMensajePlantillaMeta(
        contacto.telefono,
        plantilla.nombre,
        plantilla.idioma,
        componentes,
        phoneNumberId
      );
      console.log('✅ [ConfirmacionTurnos] Plantilla enviada exitosamente');
      console.log('   ℹ️ NO se envía mensaje de texto adicional - la plantilla de Meta contiene toda la información necesaria');
      
    } catch (error) {
      console.error('❌ [ConfirmacionTurnos] ERROR CRÍTICO: No se pudo enviar notificación:', error);
      console.error('   Verifica que la plantilla esté aprobada en Meta Business Manager');
      throw error; // Propagar el error para que falle el proceso
    }
    
    if (enviado) {
      console.log(`✅ Mensaje enviado correctamente`);
      
      // ✅ Iniciar flujo en FlowManager
      console.log(`🔄 Iniciando flujo de notificación de viajes...`);
      await iniciarFlujoNotificacionViajes(
        contacto.telefono,
        empresaId,
        turnos
      );
      
      console.log(`✅ Flujo iniciado correctamente`);
      
      // Marcar notificaciones como enviadas
      for (const turno of turnos) {
        if (!turno.notificaciones) turno.notificaciones = [];
        turno.notificaciones.push({
          tipo: 'confirmacion',
          programadaPara: new Date(),
          enviada: true,
          enviadaEn: new Date(),
          plantilla: 'confirmacion_interactiva'
        });
        await turno.save();
      }
      
      console.log(`✅ Notificaciones marcadas como enviadas`);
    } else {
      console.error('❌ Error al enviar mensaje de WhatsApp');
    }
    
    return enviado;
    
  } catch (error) {
    console.error('❌ Error enviando notificación de confirmación:', error);
    return false;
  }
}
