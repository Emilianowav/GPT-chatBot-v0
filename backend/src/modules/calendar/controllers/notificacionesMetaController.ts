// 🔔 Controlador Unificado de Notificaciones con Plantillas de Meta

import { Request, Response } from 'express';
import { enviarNotificacionPrueba } from '../../../services/notificacionesMetaService.js';

/**
 * POST /api/modules/calendar/notificaciones-meta/test
 * Enviar notificación de prueba (agente o cliente)
 */
export async function enviarPrueba(req: Request, res: Response) {
  try {
    console.log(`\n🧪 [NotifMeta] Endpoint /test llamado`);
    console.log(`   Body:`, req.body);
    
    const { tipo, empresaId, telefono } = req.body;
    
    if (!tipo || !empresaId || !telefono) {
      res.status(400).json({
        success: false,
        message: 'Faltan parámetros: tipo, empresaId, telefono'
      });
      return;
    }
    
    if (tipo !== 'agente' && tipo !== 'cliente') {
      res.status(400).json({
        success: false,
        message: 'Tipo debe ser "agente" o "cliente"'
      });
      return;
    }
    
    console.log(`📤 Enviando prueba: ${tipo} - ${telefono}`);
    
    const enviado = await enviarNotificacionPrueba(tipo, empresaId, telefono);
    
    // ✅ INICIAR FLUJO DE CONFIRMACIÓN si es cliente
    let flujoIniciado = false;
    
    if (tipo === 'cliente') {
      console.log(`\n🔄 [Prueba] Iniciando flujo de confirmación...`);
      
      const { ConversationStateModel } = await import('../../../models/ConversationState.js');
      const { EmpresaModel } = await import('../../../models/Empresa.js');
      const { TurnoModel } = await import('../models/Turno.js');
      const { ContactoEmpresaModel } = await import('../../../models/ContactoEmpresa.js');
      
      console.log(`   🔍 Buscando cliente: ${telefono} en empresa ${empresaId}`);
      const cliente = await ContactoEmpresaModel.findOne({ 
        telefono,
        empresaId 
      });
      
      console.log(`   📋 Cliente encontrado:`, cliente ? `${cliente.nombre} (${cliente._id})` : 'NO ENCONTRADO');
      
      if (cliente) {
        // Buscar turnos pendientes del cliente
        const ahora = new Date();
        const mañana = new Date(ahora);
        mañana.setDate(mañana.getDate() + 2);
        
        console.log(`   🔍 Buscando turnos entre ${ahora.toISOString()} y ${mañana.toISOString()}`);
        
        const turnos = await TurnoModel.find({
          empresaId,
          clienteId: cliente._id,
          fechaInicio: { $gte: ahora, $lte: mañana },
          estado: { $in: ['no_confirmado', 'pendiente'] }
        });
        
        console.log(`   📋 Turnos encontrados: ${turnos.length}`);
        
        if (turnos.length > 0) {
          const empresa = await EmpresaModel.findOne({ nombre: empresaId });
          
          console.log(`   💾 Guardando estado en ConversationState...`);
          
          const estadoGuardado = await ConversationStateModel.findOneAndUpdate(
            { telefono, empresaId },
            {
              telefono,
              empresaId,
              phoneNumberId: empresa?.phoneNumberId || process.env.META_PHONE_NUMBER_ID,
              flujo_activo: 'confirmacion_turnos',
              estado_actual: 'esperando_confirmacion',
              data: {
                turnosIds: turnos.map(t => t._id.toString()),
                clienteId: cliente._id.toString(),
                intentos: 0
              },
              ultima_interaccion: new Date()
            },
            { upsert: true, new: true }
          );
          
          console.log(`   ✅ Estado guardado:`, {
            _id: estadoGuardado._id,
            flujo_activo: estadoGuardado.flujo_activo,
            estado_actual: estadoGuardado.estado_actual
          });
          
          console.log(`🔄 Flujo de confirmación iniciado para ${telefono}`);
          flujoIniciado = true;
        } else {
          console.log(`   ⚠️ No se encontraron turnos pendientes para iniciar el flujo`);
        }
      } else {
        console.log(`   ⚠️ No se encontró el cliente para iniciar el flujo`);
      }
    }
    
    res.json({
      success: true,
      message: `Notificación de prueba enviada a ${tipo}`,
      detalles: {
        tipo,
        empresaId,
        telefono,
        flujoIniciado
      }
    });
    
  } catch (error: any) {
    console.error('❌ Error en enviarPrueba:', error);
    res.status(500).json({
      success: false,
      message: 'Error al enviar notificación de prueba',
      error: error.message
    });
  }
}
