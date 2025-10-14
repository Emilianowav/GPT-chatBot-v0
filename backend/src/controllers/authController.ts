// 🔐 Controlador de Autenticación
import type { Request, Response } from 'express';
import { login as loginService, createAdminUser } from '../services/authService.js';

/**
 * POST /api/auth/login
 * Autentica un usuario y devuelve un token JWT
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    // Validar datos
    if (!username || !password) {
      res.status(400).json({
        success: false,
        message: 'Usuario y contraseña son requeridos'
      });
      return;
    }

    // Intentar login
    const result = await loginService(username, password);

    if (!result.success) {
      res.status(401).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Error en login controller:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

/**
 * POST /api/auth/register
 * Crea un nuevo usuario administrador (solo para admins)
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, empresaId, role, email } = req.body;

    // Validar datos
    if (!username || !password || !empresaId) {
      res.status(400).json({
        success: false,
        message: 'Usuario, contraseña y empresa son requeridos'
      });
      return;
    }

    // Crear usuario
    const result = await createAdminUser(username, password, empresaId, role, email);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('❌ Error en register controller:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

/**
 * GET /api/auth/me
 * Obtiene información del usuario autenticado
 */
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
      return;
    }

    res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('❌ Error en getMe controller:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};
