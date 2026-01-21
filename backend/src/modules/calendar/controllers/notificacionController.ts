// 🔔 Controlador de Notificaciones
import { Request, Response } from 'express';
import { enviarMensajeWhatsAppTexto } from '../../../services/metaService.js';
import { EmpresaModel } from '../../../models/Empresa.js';
import { ClienteModel } from '../../../models/Cliente.js';
import { AgenteModel } from '../models/Agente.js';

/**
 * Enviar notificación de prueba
 * POST /api/modules/calendar/notificaciones/prueba
 */
export async function enviarNotificacionPrueba(req: Request, res: Response) {
  try {
    const { empresaId, destinatario, telefono, mensaje } = req.body;

    // Validaciones
    if (!empresaId || !destinatario || !telefono || !mensaje) {
      return res.status(400).json({
        error: 'Faltan campos requeridos: empresaId, destinatario, telefono, mensaje'
      });
    }

    console.log('📤 Enviando notificación de prueba...');
    console.log('  Empresa:', empresaId);
    console.log('  Destinatario:', destinatario);
    console.log('  Teléfono:', telefono);

    // Obtener configuración de la empresa para el phoneNumberId
    // empresaId puede ser el nombre de la empresa o el ObjectId
    let empresa;
    
    // Intentar primero por nombre (más común en este sistema)
    empresa = await EmpresaModel.findOne({ nombre: empresaId });
    
    // Si no se encuentra y el ID parece ser un ObjectId válido, intentar por _id
    if (!empresa && empresaId.match(/^[0-9a-fA-F]{24}$/)) {
      empresa = await EmpresaModel.findOne({ _id: empresaId });
    }
    
    if (!empresa) {
      return res.status(404).json({
        error: 'Empresa no encontrada'
      });
    }
    
    // Obtener phoneNumberId de la empresa
    const phoneNumberId = (empresa as any).phoneNumberId;
    
    if (!phoneNumberId) {
      return res.status(400).json({
        error: 'La empresa no tiene phoneNumberId configurado. Configure el número de WhatsApp Business primero.'
      });
    }

    // Enviar mensaje vía WhatsApp API
    const resultado = await enviarMensajeWhatsAppTexto(telefono, mensaje, phoneNumberId);

    console.log('✅ Notificación de prueba enviada exitosamente');

    res.json({
      success: true,
      mensaje: 'Notificación de prueba enviada exitosamente',
      resultado,
      detalles: {
        empresaId,
        destinatario,
        telefono,
        phoneNumberId: phoneNumberId.substring(0, 5) + '...' // Ocultar parte del ID
      }
    });

  } catch (error: any) {
    console.error('❌ Error al enviar notificación de prueba:', error);
    res.status(500).json({
      error: 'Error al enviar notificación de prueba',
      detalles: error.message
    });
  }
}

/**
 * Obtener lista de agentes para selector
 * GET /api/modules/calendar/notificaciones/agentes/:empresaId
 */
export async function obtenerAgentesParaNotificaciones(req: Request, res: Response) {
  try {
    const { empresaId } = req.params;

    const agentes = await AgenteModel.find({ 
      empresaId, 
      activo: true 
    }).select('nombre apellido telefono email');

    res.json({
      agentes: agentes.map(a => ({
        id: a._id.toString(),
        nombre: a.nombre,
        apellido: a.apellido,
        telefono: a.telefono,
        email: a.email
      }))
    });

  } catch (error: any) {
    console.error('❌ Error al obtener agentes:', error);
    res.status(500).json({
      error: 'Error al obtener agentes',
      detalles: error.message
    });
  }
}

/**
 * Obtener lista de clientes para selector
 * GET /api/modules/calendar/notificaciones/clientes/:empresaId
 */
export async function obtenerClientesParaNotificaciones(req: Request, res: Response) {
  try {
    const { empresaId } = req.params;

    const clientes = await ClienteModel.find({ 
      empresaId, 
      activo: true 
    }).select('nombre apellido telefono email').sort({ creadoEn: -1 }).limit(100);

    res.json({
      clientes: clientes.map(c => ({
        id: c._id.toString(),
        nombre: c.nombre,
        apellido: c.apellido,
        telefono: c.telefono,
        email: c.email
      }))
    });

  } catch (error: any) {
    console.error('❌ Error al obtener clientes:', error);
    res.status(500).json({
      error: 'Error al obtener clientes',
      detalles: error.message
    });
  }
}
