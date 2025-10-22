// 👨‍⚕️ Controlador de Agentes
import { Request, Response } from 'express';
import * as agenteService from '../services/agenteService.js';

/**
 * POST /api/modules/calendar/agentes
 * Crear un nuevo agente
 */
export async function crearAgente(req: Request, res: Response) {
  try {
    const empresaId = (req as any).user?.empresaId;
    if (!empresaId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    const {
      nombre,
      apellido,
      email,
      telefono,
      especialidad,
      descripcion,
      titulo,
      duracionTurnoPorDefecto,
      bufferEntreturnos,
      maximoTurnosPorDia
    } = req.body;

    if (!nombre || !apellido || !email) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, apellido y email son requeridos'
      });
    }

    const agente = await agenteService.crearAgente({
      empresaId,
      nombre,
      apellido,
      email,
      telefono,
      especialidad,
      descripcion,
      titulo,
      duracionTurnoPorDefecto,
      bufferEntreturnos,
      maximoTurnosPorDia
    });

    res.status(201).json({
      success: true,
      agente
    });
  } catch (error: any) {
    console.error('Error al crear agente:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al crear agente'
    });
  }
}

/**
 * GET /api/modules/calendar/agentes
 * Obtener todos los agentes
 */
export async function obtenerAgentes(req: Request, res: Response) {
  try {
    const empresaId = (req as any).user?.empresaId;
    if (!empresaId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    const soloActivos = req.query.activos === 'true';

    const agentes = await agenteService.obtenerAgentes(empresaId, soloActivos);

    res.json({
      success: true,
      agentes
    });
  } catch (error: any) {
    console.error('Error al obtener agentes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener agentes'
    });
  }
}

/**
 * GET /api/modules/calendar/agentes/:id
 * Obtener un agente por ID
 */
export async function obtenerAgentePorId(req: Request, res: Response) {
  try {
    const empresaId = (req as any).user?.empresaId;
    if (!empresaId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    const { id } = req.params;

    const agente = await agenteService.obtenerAgentePorId(id, empresaId);

    if (!agente) {
      return res.status(404).json({
        success: false,
        message: 'Agente no encontrado'
      });
    }

    res.json({
      success: true,
      agente
    });
  } catch (error: any) {
    console.error('Error al obtener agente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener agente'
    });
  }
}

/**
 * PATCH /api/modules/calendar/agentes/:id
 * Actualizar un agente
 */
export async function actualizarAgente(req: Request, res: Response) {
  try {
    const empresaId = (req as any).user?.empresaId;
    if (!empresaId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    const { id } = req.params;
    const datos = req.body;

    const agente = await agenteService.actualizarAgente(id, empresaId, datos);

    res.json({
      success: true,
      agente
    });
  } catch (error: any) {
    console.error('Error al actualizar agente:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al actualizar agente'
    });
  }
}

/**
 * DELETE /api/modules/calendar/agentes/:id
 * Eliminar permanentemente un agente
 */
export async function eliminarAgente(req: Request, res: Response) {
  try {
    const empresaId = (req as any).user?.empresaId;
    if (!empresaId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    const { id } = req.params;

    await agenteService.eliminarAgente(id, empresaId);

    res.json({
      success: true,
      message: 'Agente eliminado correctamente'
    });
  } catch (error: any) {
    console.error('Error al eliminar agente:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al eliminar agente'
    });
  }
}

/**
 * PUT /api/modules/calendar/agentes/:id/disponibilidad
 * Configurar disponibilidad de un agente
 */
export async function configurarDisponibilidad(req: Request, res: Response) {
  try {
    const empresaId = (req as any).user?.empresaId;
    if (!empresaId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    const { id } = req.params;
    const { disponibilidad } = req.body;

    if (!disponibilidad || !Array.isArray(disponibilidad)) {
      return res.status(400).json({
        success: false,
        message: 'Disponibilidad debe ser un array'
      });
    }

    const agente = await agenteService.configurarDisponibilidad(
      id,
      empresaId,
      disponibilidad
    );

    res.json({
      success: true,
      agente
    });
  } catch (error: any) {
    console.error('Error al configurar disponibilidad:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al configurar disponibilidad'
    });
  }
}

/**
 * GET /api/modules/calendar/agentes/disponibles
 * Obtener agentes disponibles en una fecha
 */
export async function obtenerAgentesDisponibles(req: Request, res: Response) {
  try {
    const empresaId = (req as any).user?.empresaId;
    if (!empresaId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    const { fecha } = req.query;

    if (!fecha) {
      return res.status(400).json({
        success: false,
        message: 'Fecha requerida'
      });
    }

    const agentes = await agenteService.obtenerAgentesDisponibles(
      empresaId,
      new Date(fecha as string)
    );

    res.json({
      success: true,
      agentes
    });
  } catch (error: any) {
    console.error('Error al obtener agentes disponibles:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener agentes disponibles'
    });
  }
}
