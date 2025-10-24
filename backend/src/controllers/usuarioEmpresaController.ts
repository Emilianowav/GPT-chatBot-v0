// 👥 Controlador de Usuarios de Empresa
import type { Request, Response } from 'express';
import * as usuarioService from '../services/usuarioEmpresaService.js';

/**
 * POST /api/usuarios-empresa
 * Crea un nuevo usuario de empresa
 */
export const crearUsuario = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, email, nombre, apellido, rol, permisos, telefono } = req.body;

    // Validar datos requeridos
    if (!username || !password || !email || !nombre || !rol) {
      res.status(400).json({
        success: false,
        message: 'Username, password, email, nombre y rol son requeridos'
      });
      return;
    }

    // Validar que el usuario autenticado sea admin
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden crear usuarios'
      });
      return;
    }

    const result = await usuarioService.crearUsuario({
      username,
      password,
      email,
      nombre,
      apellido,
      empresaId: req.user.empresaId,
      rol,
      permisos,
      telefono,
      createdBy: req.user.userId
    });

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('❌ Error en crearUsuario controller:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

/**
 * GET /api/usuarios-empresa
 * Obtiene todos los usuarios de la empresa
 */
export const obtenerUsuarios = async (req: Request, res: Response): Promise<void> => {
  try {
    const incluirInactivos = req.query.incluirInactivos === 'true';

    const result = await usuarioService.obtenerUsuarios(
      req.user!.empresaId,
      incluirInactivos
    );

    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Error en obtenerUsuarios controller:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

/**
 * GET /api/usuarios-empresa/:id
 * Obtiene un usuario por ID
 */
export const obtenerUsuarioPorId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await usuarioService.obtenerUsuarioPorId(id);

    if (!result.success) {
      res.status(404).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Error en obtenerUsuarioPorId controller:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

/**
 * PUT /api/usuarios-empresa/:id
 * Actualiza un usuario
 */
export const actualizarUsuario = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nombre, apellido, email, rol, permisos, telefono, activo, avatar } = req.body;

    // Validar que el usuario autenticado sea admin
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden actualizar usuarios'
      });
      return;
    }

    const result = await usuarioService.actualizarUsuario(
      id,
      { nombre, apellido, email, rol, permisos, telefono, activo, avatar },
      req.user.userId
    );

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Error en actualizarUsuario controller:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

/**
 * DELETE /api/usuarios-empresa/:id
 * Elimina (desactiva) un usuario
 */
export const eliminarUsuario = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validar que el usuario autenticado sea admin
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden eliminar usuarios'
      });
      return;
    }

    // No permitir que un admin se elimine a sí mismo
    if (id === req.user.userId) {
      res.status(400).json({
        success: false,
        message: 'No puedes eliminarte a ti mismo'
      });
      return;
    }

    const result = await usuarioService.eliminarUsuario(id, req.user.userId);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Error en eliminarUsuario controller:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

/**
 * PUT /api/usuarios-empresa/:id/password
 * Cambia la contraseña de un usuario
 */
export const cambiarPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
      return;
    }

    // Solo admins o el mismo usuario pueden cambiar la contraseña
    if (req.user?.role !== 'admin' && req.user?.userId !== id) {
      res.status(403).json({
        success: false,
        message: 'No tienes permiso para cambiar esta contraseña'
      });
      return;
    }

    const result = await usuarioService.cambiarPassword(id, password);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Error en cambiarPassword controller:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

/**
 * GET /api/usuarios-empresa/estadisticas
 * Obtiene estadísticas de usuarios
 */
export const obtenerEstadisticas = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await usuarioService.obtenerEstadisticas(req.user!.empresaId);

    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Error en obtenerEstadisticas controller:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};
