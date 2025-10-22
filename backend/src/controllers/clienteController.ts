// 👤 Controlador de Clientes
import type { Request, Response } from 'express';
import * as clienteService from '../services/clienteService.js';

/**
 * POST /api/clientes
 * Crear un nuevo cliente
 */
export const crearCliente = async (req: Request, res: Response): Promise<void> => {
  try {
    const empresaId = (req as any).user?.empresaId;
    if (!empresaId) {
      res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
      return;
    }

    const {
      nombre,
      apellido,
      telefono,
      email,
      direccion,
      ciudad,
      provincia,
      codigoPostal,
      fechaNacimiento,
      dni,
      notas,
      origen,
      chatbotUserId
    } = req.body;

    if (!nombre || !apellido || !telefono) {
      res.status(400).json({
        success: false,
        message: 'Nombre, apellido y teléfono son requeridos'
      });
      return;
    }

    const cliente = await clienteService.crearCliente({
      empresaId,
      nombre,
      apellido,
      telefono,
      email,
      direccion,
      ciudad,
      provincia,
      codigoPostal,
      fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : undefined,
      dni,
      notas,
      origen,
      chatbotUserId
    });

    res.status(201).json({
      success: true,
      cliente
    });
  } catch (error: any) {
    console.error('Error al crear cliente:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al crear cliente'
    });
  }
}

/**
 * GET /api/clientes
 * Obtener todos los clientes
 */
export const obtenerClientes = async (req: Request, res: Response): Promise<void> => {
  try {
    const empresaId = (req as any).user?.empresaId;
    if (!empresaId) {
      res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
      return;
    }

    const soloActivos = req.query.activos === 'true';

    const clientes = await clienteService.obtenerClientes(empresaId, soloActivos);

    res.json({
      success: true,
      clientes
    });
  } catch (error: any) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener clientes'
    });
  }
}

/**
 * GET /api/clientes/buscar?q=termino
 * Buscar clientes
 */
export const buscarClientes = async (req: Request, res: Response): Promise<void> => {
  try {
    const empresaId = (req as any).user?.empresaId;
    if (!empresaId) {
      res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
      return;
    }

    const termino = req.query.q as string;
    if (!termino) {
      res.status(400).json({
        success: false,
        message: 'Término de búsqueda requerido'
      });
      return;
    }

    const clientes = await clienteService.buscarClientes(empresaId, termino);

    res.json({
      success: true,
      clientes
    });
  } catch (error: any) {
    console.error('Error al buscar clientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar clientes'
    });
  }
}

/**
 * GET /api/clientes/:id
 * Obtener un cliente por ID
 */
export const obtenerClientePorId = async (req: Request, res: Response): Promise<void> => {
  try {
    const empresaId = (req as any).user?.empresaId;
    if (!empresaId) {
      res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
      return;
    }

    const { id } = req.params;

    const cliente = await clienteService.obtenerClientePorId(id, empresaId);

    if (!cliente) {
      res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
      return;
    }

    res.json({
      success: true,
      cliente
    });
  } catch (error: any) {
    console.error('Error al obtener cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cliente'
    });
  }
}

/**
 * PATCH /api/clientes/:id
 * Actualizar un cliente
 */
export const actualizarCliente = async (req: Request, res: Response): Promise<void> => {
  try {
    const empresaId = (req as any).user?.empresaId;
    if (!empresaId) {
      res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
      return;
    }

    const { id } = req.params;
    const datos = req.body;

    // Convertir fechaNacimiento si viene
    if (datos.fechaNacimiento) {
      datos.fechaNacimiento = new Date(datos.fechaNacimiento);
    }

    const cliente = await clienteService.actualizarCliente(id, empresaId, datos);

    res.json({
      success: true,
      cliente
    });
  } catch (error: any) {
    console.error('Error al actualizar cliente:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al actualizar cliente'
    });
  }
}

/**
 * DELETE /api/clientes/:id
 * Eliminar permanentemente un cliente
 */
export const eliminarCliente = async (req: Request, res: Response): Promise<void> => {
  try {
    const empresaId = (req as any).user?.empresaId;
    if (!empresaId) {
      res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
      return;
    }

    const { id } = req.params;

    await clienteService.eliminarCliente(id, empresaId);

    res.json({
      success: true,
      message: 'Cliente eliminado correctamente'
    });
  } catch (error: any) {
    console.error('Error al eliminar cliente:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al eliminar cliente'
    });
  }
}
