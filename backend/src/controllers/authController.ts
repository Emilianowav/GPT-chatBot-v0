// 🔐 Controlador de Autenticación
import type { Request, Response } from 'express';
import { login as loginService, createAdminUser, generatePasswordResetToken, resetPasswordWithToken } from '../services/authService.js';

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

/**
 * POST /api/auth/forgot-password
 * Genera un token de recuperación de contraseña
 */
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    // Validar email
    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email es requerido'
      });
      return;
    }

    // Generar token de recuperación
    const result = await generatePasswordResetToken(email);

    // Siempre devolver éxito por seguridad (no revelar si el email existe)
    res.status(200).json({
      success: true,
      message: result.message,
      // En un entorno real, aquí enviarías el email
      // Por ahora, devolvemos el token para testing
      ...(process.env.NODE_ENV !== 'production' && { resetToken: result.resetToken })
    });
  } catch (error) {
    console.error('❌ Error en forgot password controller:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

/**
 * POST /api/auth/reset-password
 * Resetea la contraseña usando un token de recuperación
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { resetToken, newPassword } = req.body;

    // Validar datos
    if (!resetToken || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Token y nueva contraseña son requeridos'
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
      return;
    }

    // Resetear contraseña
    const result = await resetPasswordWithToken(resetToken, newPassword);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Error en reset password controller:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};
