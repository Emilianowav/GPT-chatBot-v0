// 🔐 Middleware de Autenticación
import type { Request, Response, NextFunction } from 'express';
import { verifyToken, type TokenPayload } from '../services/authService.js';

// Extender el tipo Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Middleware para verificar autenticación JWT
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    console.log('🔐 authenticate - Request:', {
      method: req.method,
      url: req.url,
      headers: {
        authorization: req.headers.authorization ? `${req.headers.authorization.substring(0, 30)}...` : 'NOT SET',
        'content-type': req.headers['content-type']
      }
    });

    // Obtener token del header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ authenticate - No token provided or invalid format');
      res.status(401).json({ 
        success: false,
        message: 'No se proporcionó token de autenticación' 
      });
      return;
    }

    const token = authHeader.substring(7); // Remover 'Bearer '
    console.log('🔑 authenticate - Token extracted:', token.substring(0, 20) + '...');

    // Verificar token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      console.log('❌ authenticate - Token verification failed');
      res.status(401).json({ 
        success: false,
        message: 'Token inválido o expirado' 
      });
      return;
    }

    console.log('✅ authenticate - Token verified:', {
      userId: decoded.userId,
      empresaId: decoded.empresaId,
      role: decoded.role
    });

    // Agregar información del usuario al request
    req.user = decoded;
    next();
  } catch (error) {
    console.error('❌ Error en middleware de autenticación:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error en autenticación' 
    });
  }
};

/**
 * Middleware para verificar rol de administrador
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ 
      success: false,
      message: 'No autenticado' 
    });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ 
      success: false,
      message: 'Acceso denegado. Se requiere rol de administrador' 
    });
    return;
  }

  next();
};

/**
 * Middleware para verificar que el usuario pertenece a la empresa
 */
export const requireEmpresa = (empresaId: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'No autenticado' 
      });
      return;
    }

    if (req.user.empresaId !== empresaId) {
      res.status(403).json({ 
        success: false,
        message: 'Acceso denegado. No pertenece a esta empresa' 
      });
      return;
    }

    next();
  };
};
