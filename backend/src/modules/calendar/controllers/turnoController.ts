// 📋 Controlador de Turnos
import { Request, Response } from 'express';
import * as turnoService from '../services/turnoService.js';
import { EstadoTurno } from '../models/Turno.js';

/**
 * POST /api/modules/calendar/turnos
 * Crear un nuevo turno
 */
export async function crearTurno(req: Request, res: Response) {
  try {
    const empresaId = (req as any).user?.empresaId;
    if (!empresaId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    const { agenteId, clienteId, fechaInicio, duracion, servicio, notas } = req.body;

    if (!agenteId || !clienteId || !fechaInicio || !duracion) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos'
      });
    }

    const turno = await turnoService.crearTurno({
      empresaId,
      agenteId,
      clienteId,
      fechaInicio: new Date(fechaInicio),
      duracion,
      servicio,
      notas,
      creadoPor: 'admin'
    });

    res.status(201).json({
      success: true,
      turno
    });
  } catch (error: any) {
    console.error('Error al crear turno:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al crear turno'
    });
  }
}

/**
 * GET /api/modules/calendar/turnos
 * Obtener turnos con filtros
 */
export async function obtenerTurnos(req: Request, res: Response) {
  try {
    const empresaId = (req as any).user?.empresaId;
    if (!empresaId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    const {
      agenteId,
      clienteId,
      estado,
      fechaDesde,
      fechaHasta,
      limit,
      skip
    } = req.query;

    const filtros: any = { empresaId };
    
    if (agenteId) filtros.agenteId = agenteId;
    if (clienteId) filtros.clienteId = clienteId;
    if (estado) filtros.estado = estado as EstadoTurno;
    if (fechaDesde) filtros.fechaDesde = new Date(fechaDesde as string);
    if (fechaHasta) filtros.fechaHasta = new Date(fechaHasta as string);
    if (limit) filtros.limit = parseInt(limit as string);
    if (skip) filtros.skip = parseInt(skip as string);

    const resultado = await turnoService.obtenerTurnos(filtros);

    res.json({
      success: true,
      ...resultado
    });
  } catch (error: any) {
    console.error('Error al obtener turnos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener turnos'
    });
  }
}

/**
 * GET /api/modules/calendar/turnos/hoy
 * Obtener turnos del día
 */
export async function obtenerTurnosDelDia(req: Request, res: Response) {
  try {
    const empresaId = (req as any).user?.empresaId;
    if (!empresaId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    const { agenteId } = req.query;

    const turnos = await turnoService.obtenerTurnosDelDia(
      empresaId,
      agenteId as string | undefined
    );

    res.json({
      success: true,
      turnos
    });
  } catch (error: any) {
    console.error('Error al obtener turnos del día:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener turnos del día'
    });
  }
}

/**
 * GET /api/modules/calendar/turnos/:id
 * Obtener un turno por ID
 */
export async function obtenerTurnoPorId(req: Request, res: Response) {
  try {
    const empresaId = (req as any).user?.empresaId;
    if (!empresaId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    const { id } = req.params;

    const turno = await turnoService.obtenerTurnoPorId(id, empresaId);

    if (!turno) {
      return res.status(404).json({
        success: false,
        message: 'Turno no encontrado'
      });
    }

    res.json({
      success: true,
      turno
    });
  } catch (error: any) {
    console.error('Error al obtener turno:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener turno'
    });
  }
}

/**
 * PATCH /api/modules/calendar/turnos/:id/estado
 * Actualizar estado de un turno
 */
export async function actualizarEstadoTurno(req: Request, res: Response) {
  try {
    const empresaId = (req as any).user?.empresaId;
    if (!empresaId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    const { id } = req.params;
    const { estado, motivoCancelacion } = req.body;

    if (!estado) {
      return res.status(400).json({
        success: false,
        message: 'Estado requerido'
      });
    }

    const turno = await turnoService.actualizarEstadoTurno(
      id,
      empresaId,
      estado,
      motivoCancelacion
    );

    res.json({
      success: true,
      turno
    });
  } catch (error: any) {
    console.error('Error al actualizar estado:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al actualizar estado'
    });
  }
}

/**
 * DELETE /api/modules/calendar/turnos/:id
 * Cancelar un turno
 */
export async function cancelarTurno(req: Request, res: Response) {
  try {
    const empresaId = (req as any).user?.empresaId;
    if (!empresaId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    const { id } = req.params;
    const { motivo } = req.body;

    if (!motivo) {
      return res.status(400).json({
        success: false,
        message: 'Motivo de cancelación requerido'
      });
    }

    const turno = await turnoService.cancelarTurno(id, empresaId, motivo);

    res.json({
      success: true,
      turno
    });
  } catch (error: any) {
    console.error('Error al cancelar turno:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al cancelar turno'
    });
  }
}

/**
 * GET /api/modules/calendar/turnos/estadisticas
 * Obtener estadísticas de turnos
 */
export async function obtenerEstadisticas(req: Request, res: Response) {
  try {
    const empresaId = (req as any).user?.empresaId;
    if (!empresaId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    const { fechaDesde, fechaHasta } = req.query;

    const estadisticas = await turnoService.obtenerEstadisticas(
      empresaId,
      fechaDesde ? new Date(fechaDesde as string) : undefined,
      fechaHasta ? new Date(fechaHasta as string) : undefined
    );

    res.json({
      success: true,
      estadisticas
    });
  } catch (error: any) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
}
