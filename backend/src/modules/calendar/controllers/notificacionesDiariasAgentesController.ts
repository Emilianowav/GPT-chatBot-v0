// 📅 Controlador para notificaciones diarias de agentes
// ⚠️ IMPORTANTE: Este controlador SOLO usa configuración de MongoDB
// NO auto-configura NADA, solo lee y envía lo que está guardado
// ✅ Sistema 100% escalable: URL y payload completo desde MongoDB

import { Request, Response } from 'express';
import { ConfiguracionModuloModel } from '../models/ConfiguracionModulo.js';
import { AgenteModel } from '../models/Agente.js';
import { TurnoModel } from '../models/Turno.js';
import { ContactoEmpresaModel } from '../../../models/ContactoEmpresa.js';
import { EmpresaModel } from '../../../models/Empresa.js';

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
 * Reemplazar variables en un objeto (recursivo)
 * Reemplaza {{variable}} con el valor real
 */
function reemplazarVariables(obj: any, variables: Record<string, any>): any {
  if (typeof obj === 'string') {
    // Reemplazar {{variable}} con el valor
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
 * Construir payload completo para Meta desde MongoDB
 * Lee TODO de la configuración: URL, body, componentes
 */
function construirPayloadMeta(plantillaMeta: any, variables: Record<string, any>): { url: string; payload: any } {
  console.log('🔧 [construirPayloadMeta] Construyendo desde MongoDB');
  console.log('   Variables disponibles:', Object.keys(variables));
  
  // 1. Construir URL (reemplazar {{phoneNumberId}})
  const url = reemplazarVariables(plantillaMeta.metaApiUrl, variables);
  console.log('   📍 URL:', url);
  
  // 2. Construir payload (reemplazar todas las variables)
  const payload = reemplazarVariables(plantillaMeta.metaPayload, variables);
  console.log('   📦 Payload:', JSON.stringify(payload, null, 2));
  
  return { url, payload };
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
    
    // ✅ NUEVA ESTRUCTURA: plantillasMeta.notificacionDiariaAgentes
    if (!config.plantillasMeta?.notificacionDiariaAgentes) {
      res.status(404).json({
        success: false,
        message: 'Esta empresa no tiene configurada la notificación diaria de agentes',
        instrucciones: 'Ejecuta: npx tsx src/scripts/migrarConfiguracionLimpia.ts'
      });
      return;
    }
    
    const notifConfig = config.plantillasMeta.notificacionDiariaAgentes;
    
    // ⚠️ VALIDAR QUE LA PLANTILLA ESTÉ ACTIVA
    if (!notifConfig.activa) {
      console.error('❌ [NotifAgentes] Plantilla inactiva en MongoDB');
      res.status(400).json({
        success: false,
        message: 'Plantilla de Meta está inactiva en la configuración'
      });
      return;
    }
    
    // ⚠️ VALIDAR QUE TENGA LA ESTRUCTURA COMPLETA
    if (!notifConfig.metaApiUrl || !notifConfig.metaPayload) {
      console.error('❌ [NotifAgentes] Plantilla NO tiene metaApiUrl o metaPayload');
      res.status(400).json({
        success: false,
        message: 'Plantilla incompleta. Falta metaApiUrl o metaPayload.',
        instrucciones: 'Ejecuta: npx tsx src/scripts/migrarConfiguracionLimpia.ts'
      });
      return;
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
    
    // ✅ NUEVA ESTRUCTURA: programacion.filtroEstado
    if (notifConfig.programacion?.filtroEstado) {
      query.estado = { $in: notifConfig.programacion.filtroEstado };
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
        
        // ✅ NUEVA ESTRUCTURA: programacion.incluirDetalles
        const incluirDetalles = notifConfig.programacion?.incluirDetalles || {};
        
        if (incluirDetalles.nombreCliente && contacto) {
          lineaViaje += ` - ${contacto.nombre} ${contacto.apellido}`;
        }
        
        if (incluirDetalles.telefonoCliente && contacto) {
          lineaViaje += ` | Tel: ${contacto.telefono}`;
        }
        
        if (incluirDetalles.origen && turno.datos?.origen) {
          lineaViaje += ` | Origen: ${turno.datos.origen}`;
        }
        
        if (incluirDetalles.destino && turno.datos?.destino) {
          lineaViaje += ` | Destino: ${turno.datos.destino}`;
        }
        
        if (incluirDetalles.notasInternas && turno.notasInternas) {
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
    

    console.log('📋 [NotifAgentes] Usando NUEVA ESTRUCTURA de MongoDB');
    console.log('   Plantilla:', notifConfig.nombre);
    console.log('   Idioma:', notifConfig.idioma);
    console.log('   URL:', notifConfig.metaApiUrl);
    
    // Construir TODAS las variables (incluye phoneNumberId, telefono, agente, lista_turnos)
    const variables: Record<string, any> = {
      phoneNumberId: phoneNumberId,
      telefono: agente.telefono,
      agente: `${agente.nombre} ${agente.apellido}`,
      lista_turnos: listaTurnos
    };

    console.log('📝 Variables para reemplazo:', Object.keys(variables));
    console.log('🚀 Construyendo payload desde MongoDB');
    
    const { url, payload } = construirPayloadMeta(notifConfig, variables);
    
    // Enviar directamente a Meta con axios
    try {
      const axios = require('axios');
      const token = process.env.META_WHATSAPP_TOKEN || process.env.WHATSAPP_TOKEN;
      
      if (!token) {
        throw new Error('META_WHATSAPP_TOKEN no configurado en .env');
      }
      
      console.log('📤 Enviando a Meta API...');
      console.log('   URL:', url);
      console.log('   Payload:', JSON.stringify(payload, null, 2));
      
      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`✅ [NotifAgentes] Mensaje enviado exitosamente`);
      console.log('   Message ID:', response.data.messages?.[0]?.id);
      console.log('   Response:', JSON.stringify(response.data, null, 2));
      
    } catch (error: any) {
      console.error(`❌ [NotifAgentes] ERROR enviando a Meta:`);
      console.error('   Status:', error.response?.status);
      console.error('   Data:', JSON.stringify(error.response?.data, null, 2));
      
      res.status(500).json({
        success: false,
        message: `Error al enviar a Meta: ${error.message}`,
        detalles: {
          status: error.response?.status,
          error: error.response?.data || error.message
        }
      });
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
        plantilla: notifConfig.nombre,
        activa: notifConfig.activa
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
