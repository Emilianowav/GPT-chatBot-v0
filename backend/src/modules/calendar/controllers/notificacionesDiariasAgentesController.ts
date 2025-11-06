// 📅 Controlador para notificaciones diarias de agentes
import { Request, Response } from 'express';
import { ConfiguracionModuloModel } from '../models/ConfiguracionModulo.js';
import { AgenteModel } from '../models/Agente.js';
import { TurnoModel } from '../models/Turno.js';
import { ContactoEmpresaModel } from '../../../models/ContactoEmpresa.js';
import { EmpresaModel } from '../../../models/Empresa.js';
import { enviarMensajeWhatsAppTexto } from '../../../services/metaService.js';
import { enviarMensajePlantillaMeta, generarComponentesPlantilla } from '../../../services/metaTemplateService.js';

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
    console.log(`\n🚨🚨🚨 ENDPOINT /test LLAMADO 🚨🚨🚨`);
    console.log(`   Hora: ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}`);
    console.log(`   Body:`, req.body);
    
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
    
    // ✅ AUTO-CONFIGURAR PLANTILLA SI NO EXISTE (igual que en confirmacionTurnosService)
    if (!notifConfig.usarPlantillaMeta || !notifConfig.plantillaMeta) {
      console.log('⚙️ Auto-configurando plantilla de Meta para notificación diaria de agentes...');
      
      notifConfig.usarPlantillaMeta = true;
      notifConfig.plantillaMeta = {
        nombre: 'chofer_sanjose',
        idioma: 'es',
        activa: true,
        componentes: {
          body: {
            parametros: [
              { tipo: 'text', variable: 'agente' },
              { tipo: 'text', variable: 'lista_turnos' }
            ]
          }
        }
      };
      
      (config as any).markModified('notificacionDiariaAgentes');
      await config.save();
      console.log('✅ Plantilla auto-configurada: chofer_sanjose (2 parámetros: agente, lista_turnos)');
      
      // ⚠️ IMPORTANTE: Recargar la configuración para obtener los cambios
      const configActualizada = await ConfiguracionModuloModel.findOne({ empresaId });
      if (configActualizada?.notificacionDiariaAgentes) {
        Object.assign(notifConfig, configActualizada.notificacionDiariaAgentes);
      }
    }
    
    // Buscar agente por teléfono (normalizar con y sin +)
    const telefonoNormalizado = telefono.startsWith('+') ? telefono : `+${telefono}`;
    const telefonoSinMas = telefono.replace('+', '');
    
    console.log(`🔍 Buscando agente con teléfonos:`, { 
      empresaId, 
      original: telefono,
      conMas: telefonoNormalizado,
      sinMas: telefonoSinMas,
      activo: true 
    });
    
    // Buscar con ambas variantes
    const agente = await AgenteModel.findOne({ 
      empresaId, 
      $or: [
        { telefono: telefono },
        { telefono: telefonoNormalizado },
        { telefono: telefonoSinMas }
      ],
      activo: true 
    });
    
    console.log(`📊 Resultado búsqueda:`, agente ? `Encontrado: ${agente.nombre} ${agente.apellido}` : 'No encontrado');
    
    if (!agente) {
      // Buscar todos los agentes para debug
      const todosAgentes = await AgenteModel.find({ empresaId, activo: true });
      console.log(`🔍 DEBUG - Agentes activos en ${empresaId}:`, todosAgentes.map(a => ({ 
        nombre: a.nombre, 
        telefono: a.telefono 
      })));
      
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
    
    // Construir lista de turnos formateada con separadores (Meta NO permite saltos de línea)
    let listaTurnos = '';
    
    if (turnos.length === 0) {
      listaTurnos = `No tienes ${config.nomenclatura.turnos.toLowerCase()} programados para hoy.`;
    } else {
      for (let i = 0; i < turnos.length; i++) {
        const turno = turnos[i];
        const { hora } = formatearFechaHora(new Date(turno.fechaInicio));
        
        // Construir línea del viaje con separadores
        let lineaViaje = `${i + 1}. ${hora}`;
        
        // Obtener contacto
        const contacto = await ContactoEmpresaModel.findOne({
          _id: turno.clienteId,
          empresaId
        });
        
        if (notifConfig.incluirDetalles.nombreCliente && contacto) {
          lineaViaje += ` - ${contacto.nombre} ${contacto.apellido}`;
        }
        
        if (notifConfig.incluirDetalles.telefonoCliente && contacto) {
          lineaViaje += ` | Tel: ${contacto.telefono}`;
        }
        
        if (notifConfig.incluirDetalles.origen && turno.datos?.origen) {
          lineaViaje += ` | Origen: ${turno.datos.origen}`;
        }
        
        if (notifConfig.incluirDetalles.destino && turno.datos?.destino) {
          lineaViaje += ` | Destino: ${turno.datos.destino}`;
        }
        
        if (notifConfig.incluirDetalles.notasInternas && turno.notasInternas) {
          lineaViaje += ` | Notas: ${turno.notasInternas}`;
        }
        
        listaTurnos += lineaViaje;
        
        // Agregar separador entre viajes (excepto el último)
        if (i < turnos.length - 1) {
          listaTurnos += ' || ';  // Separador visual entre viajes
        }
      }
    }
    
    console.log('📝 Lista de turnos generada:', listaTurnos.substring(0, 100) + '...');
    
    // Obtener phoneNumberId de la empresa
    const empresa = await EmpresaModel.findOne({ nombre: empresaId });
    if (!empresa || !empresa.phoneNumberId) {
      res.status(500).json({
        success: false,
        message: 'Error de configuración: phoneNumberId no encontrado para la empresa'
      });
      return;
    }
    
    const phoneNumberId = empresa.phoneNumberId;
    
    // ✅ OBLIGATORIO: Solo enviar con plantilla de Meta
    if (!notifConfig.usarPlantillaMeta || !notifConfig.plantillaMeta?.activa) {
      console.error('❌ [NotifAgentes] NO SE PUEDE ENVIAR: Plantilla de Meta no configurada o inactiva');
      console.error('   Las notificaciones DEBEN usar plantillas de Meta para abrir ventana de 24hs');
      res.status(400).json({
        success: false,
        message: 'No se puede enviar: Plantilla de Meta no configurada. Configure la plantilla primero.',
        detalles: {
          usarPlantillaMeta: notifConfig.usarPlantillaMeta || false,
          plantillaActiva: notifConfig.plantillaMeta?.activa || false
        }
      });
      return;
    }

    console.log('📋 [NotifAgentes] Usando plantilla de Meta para abrir ventana de 24h');
    console.log('   Plantilla:', notifConfig.plantillaMeta.nombre);
    
    const plantilla = notifConfig.plantillaMeta;
    
    // ✅ ESTRATEGIA: Enviar SOLO plantilla de Meta con DETALLE COMPLETO
    // Meta NO permite saltos de línea en parámetros, usar separadores visuales: " | "
    
    // 1. Usar el detalle completo que ya construimos en listaTurnos (con separadores)
    const variables = {
      agente: `${agente.nombre} ${agente.apellido}`,
      lista_turnos: listaTurnos  // Detalle completo con separadores
    };

    console.log('   Variables:', { agente: variables.agente, lista_turnos: variables.lista_turnos });

    // Generar componentes de la plantilla
    const componentes = generarComponentesPlantilla(plantilla, variables);

    // 2. Enviar SOLO plantilla de Meta (NO enviar mensaje de texto adicional)
    let enviado = false;
    try {
      await enviarMensajePlantillaMeta(
        agente.telefono,
        plantilla.nombre,
        plantilla.idioma,
        componentes,
        phoneNumberId
      );
      enviado = true;
      console.log(`✅ [NotifAgentes] Plantilla enviada exitosamente a ${agente.telefono}`);
      console.log(`   ℹ️ NO se envía mensaje de texto adicional - la plantilla de Meta contiene toda la información necesaria`);
      
    } catch (error: any) {
      console.error(`❌ [NotifAgentes] ERROR CRÍTICO: No se pudo enviar plantilla de Meta:`, error);
      throw new Error(`No se pudo enviar la notificación: ${error.message}`);
      return;
    }
    
    console.log(`✅ Notificación de prueba enviada a ${agente.nombre} ${agente.apellido}`);
    
    res.status(200).json({
      success: true,
      message: `Notificación de prueba enviada a ${agente.nombre} ${agente.apellido}`,
      detalles: {
        agente: `${agente.nombre} ${agente.apellido}`,
        turnosEncontrados: turnos.length,
        telefono,
        usaPlantillaMeta: notifConfig.usarPlantillaMeta || false
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
