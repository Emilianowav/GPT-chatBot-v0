// 📅 Controlador de Disponibilidad
import { Request, Response } from 'express';
import * as disponibilidadService from '../services/disponibilidadService.js';

/**
 * GET /api/modules/calendar/disponibilidad/:agenteId
 * Obtener slots disponibles para un agente en una fecha
 */
export async function obtenerSlotsDisponibles(req: Request, res: Response) {
  try {
    const empresaId = (req as any).user?.empresaId;
    if (!empresaId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    const { agenteId } = req.params;
    const { fecha, duracion } = req.query;

    if (!fecha) {
      return res.status(400).json({
        success: false,
        message: 'Fecha requerida'
      });
    }

    const slots = await disponibilidadService.generarSlotsDisponibles(
      agenteId,
      new Date(fecha as string),
      duracion ? parseInt(duracion as string) : undefined
    );

    res.json({
      success: true,
      slots,
      total: slots.length
    });
  } catch (error: any) {
    console.error('Error al obtener slots disponibles:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener slots disponibles'
    });
  }
}

/**
 * POST /api/modules/calendar/disponibilidad/verificar
 * Verificar si un horario está disponible
 */
export async function verificarDisponibilidad(req: Request, res: Response) {
  try {
    const empresaId = (req as any).user?.empresaId;
    if (!empresaId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    const { agenteId, fechaInicio, duracion } = req.body;

    if (!agenteId || !fechaInicio || !duracion) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos'
      });
    }

    const resultado = await disponibilidadService.verificarDisponibilidad(
      empresaId,
      agenteId,
      new Date(fechaInicio),
      duracion
    );

    res.json({
      success: true,
      ...resultado
    });
  } catch (error: any) {
    console.error('Error al verificar disponibilidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar disponibilidad'
    });
  }
}
