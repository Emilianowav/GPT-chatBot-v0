// 📅 Controlador para notificaciones diarias de agentes
import { Request, Response } from 'express';
import { ConfiguracionModuloModel } from '../models/ConfiguracionModulo.js';
import { AgenteModel } from '../models/Agente.js';
import { TurnoModel } from '../models/Turno.js';
import { ContactoEmpresaModel } from '../../../models/ContactoEmpresa.js';
import { EmpresaModel } from '../../../models/Empresa.js';
import { enviarMensajeWhatsAppTexto } from '../../../services/metaService.js';

/**
 * Formatear fecha y hora
 */
function formatearFechaHora(fecha: Date) {
  const opciones: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires'
  };
  
  const hora = fecha.toLocaleTimeString('es-AR', opciones);
  return { hora };
}

/**
 * Procesar plantilla con variables
 */
function procesarPlantilla(plantilla: string, variables: Record<string, any>): string {
  let resultado = plantilla;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    resultado = resultado.replace(regex, value);
  }
  
  return resultado;
}

/**
 * POST /api/modules/calendar/notificaciones-diarias-agentes/test
 * Enviar notificación de prueba a un agente específico
 */
export async function enviarNotificacionPruebaAgente(req: Request, res: Response) {
  try {
    const { empresaId, telefono } = req.body;
    
    if (!empresaId || !telefono) {
      res.status(400).json({
        success: false,
        message: 'Faltan parámetros requeridos: empresaId y telefono'
      });
      return;
    }
    
    console.log(`🧪 Enviando notificación de prueba a agente: ${telefono} (empresa: ${empresaId})`);
    
    // Obtener configuración
    const config = await ConfiguracionModuloModel.findOne({ empresaId });
    
    if (!config) {
      res.status(404).json({
        success: false,
        message: 'Configuración no encontrada para esta empresa'
      });
      return;
    }
    
    if (!config.notificacionDiariaAgentes) {
      res.status(404).json({
        success: false,
        message: 'Esta empresa no tiene configurada la notificación diaria de agentes'
      });
      return;
    }
    
    const notifConfig = config.notificacionDiariaAgentes;
    
    // Buscar agente por teléfono
    const agente = await AgenteModel.findOne({ 
      empresaId, 
      telefono,
      activo: true 
    });
    
    if (!agente) {
      res.status(404).json({
        success: false,
        message: 'Agente no encontrado con este teléfono. Verifica que el teléfono esté registrado como agente activo.'
      });
      return;
    }
    
    console.log(`👤 Agente encontrado: ${agente.nombre} ${agente.apellido}`);
    
    // Calcular rango de fechas (hoy)
    const ahora = new Date();
    const inicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0);
    const fin = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59);
    
    // Buscar turnos del agente
    const query: any = {
      empresaId,
      agenteId: agente._id,
      fechaInicio: { $gte: inicio, $lt: fin }
    };
    
    if (notifConfig.filtroEstado && notifConfig.filtroEstado.activo) {
      query.estado = { $in: notifConfig.filtroEstado.estados };
    } else {
      query.estado = { $in: ['pendiente', 'confirmado'] };
    }
    
    const turnos = await TurnoModel.find(query)
      .populate('clienteId')
      .sort({ fechaInicio: 1 });
    
    console.log(`📋 Turnos encontrados: ${turnos.length}`);
    
    // Construir mensaje
    let mensaje = procesarPlantilla(notifConfig.plantillaMensaje, {
      agente: `${agente.nombre} ${agente.apellido}`,
      turnos: config.nomenclatura.turnos.toLowerCase(),
      cantidad: turnos.length
    });
    
    mensaje += '\n\n';
    
    if (turnos.length === 0) {
      mensaje += `No tienes ${config.nomenclatura.turnos.toLowerCase()} programados para hoy. 🎉`;
    } else {
      mensaje += `📋 *${turnos.length} ${turnos.length === 1 ? config.nomenclatura.turno : config.nomenclatura.turnos}:*\n\n`;
      
      for (let i = 0; i < turnos.length; i++) {
        const turno = turnos[i];
        const { hora } = formatearFechaHora(new Date(turno.fechaInicio));
        
        mensaje += `${i + 1}. 🕐 ${hora}`;
        
        // Obtener contacto
        const contacto = await ContactoEmpresaModel.findOne({
          _id: turno.clienteId,
          empresaId
        });
        
        const detalles: string[] = [];
        
        if (notifConfig.incluirDetalles.nombreCliente && contacto) {
          detalles.push(`${contacto.nombre} ${contacto.apellido}`);
        }
        
        if (notifConfig.incluirDetalles.telefonoCliente && contacto) {
          detalles.push(`📞 ${contacto.telefono}`);
        }
        
        if (notifConfig.incluirDetalles.origen && turno.datos?.origen) {
          detalles.push(`📍 Origen: ${turno.datos.origen}`);
        }
        
        if (notifConfig.incluirDetalles.destino && turno.datos?.destino) {
          detalles.push(`🎯 Destino: ${turno.datos.destino}`);
        }
        
        if (notifConfig.incluirDetalles.notasInternas && turno.notasInternas) {
          detalles.push(`📝 ${turno.notasInternas}`);
        }
        
        if (detalles.length > 0) {
          mensaje += '\n   ' + detalles.join('\n   ');
        }
        
        mensaje += '\n\n';
      }
    }
    
    mensaje += '¡Que tengas un excelente día! 💪';
    
    console.log('📝 Mensaje generado:', mensaje.substring(0, 100) + '...');
    
    // Obtener phoneNumberId de la empresa
    const empresa = await EmpresaModel.findOne({ nombre: empresaId });
    if (!empresa || !empresa.phoneNumberId) {
      res.status(500).json({
        success: false,
        message: 'Error de configuración: phoneNumberId no encontrado para la empresa'
      });
      return;
    }
    
    // Enviar mensaje
    await enviarMensajeWhatsAppTexto(telefono, mensaje, empresa.phoneNumberId);
    
    console.log(`✅ Notificación de prueba enviada a ${agente.nombre} ${agente.apellido}`);
    
    res.status(200).json({
      success: true,
      message: `Notificación de prueba enviada a ${agente.nombre} ${agente.apellido}`,
      detalles: {
        agente: `${agente.nombre} ${agente.apellido}`,
        turnosEncontrados: turnos.length,
        telefono
      }
    });
    
  } catch (error: any) {
    console.error('❌ Error enviando notificación de prueba:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al enviar notificación de prueba'
    });
  }
}
