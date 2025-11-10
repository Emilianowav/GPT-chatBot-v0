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
    
    res.json({
      success: true,
      message: `Notificación de prueba enviada a ${tipo}`,
      detalles: {
        tipo,
        empresaId,
        telefono
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
