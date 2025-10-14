// 🔐 Rutas de Autenticación
import { Router } from 'express';
import { login, register, getMe } from '../controllers/authController.js';
import { authenticate, requireAdmin } from '../middlewares/authMiddleware.js';

const router = Router();

// POST /api/auth/login - Login de usuario
router.post('/login', login);

// POST /api/auth/register - Registro de nuevo admin (requiere autenticación y rol admin)
router.post('/register', authenticate, requireAdmin, register);

// GET /api/auth/me - Obtener información del usuario autenticado
router.get('/me', authenticate, getMe);

export default router;
