// 💬 Rutas de Conversaciones
import { Router } from 'express';
import { getConversaciones, getHistorialUsuario, buscarConversaciones } from '../controllers/conversacionesController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/conversaciones/:empresaId - Lista de conversaciones
router.get('/:empresaId', getConversaciones);

// GET /api/conversaciones/:empresaId/buscar - Buscar conversaciones
router.get('/:empresaId/buscar', buscarConversaciones);

// GET /api/conversaciones/:empresaId/:usuarioId - Historial de un usuario
router.get('/:empresaId/:usuarioId', getHistorialUsuario);

export default router;
