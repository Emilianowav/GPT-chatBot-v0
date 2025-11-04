// 🔄 Rutas para gestión completa de flujos
import express from 'express';
import { obtenerTodosLosFlujos, actualizarFlujo, toggleFlujo } from '../controllers/flujosController.js';
import { authenticate } from '../../../middlewares/authMiddleware.js';

const router = express.Router();

// Obtener todos los flujos (notificaciones + menú + especiales)
router.get('/:empresaId', authenticate, obtenerTodosLosFlujos);

// Actualizar configuración de un flujo
router.put('/:empresaId/:flujoId', authenticate, actualizarFlujo);

// Activar/Desactivar un flujo
router.patch('/:empresaId/:flujoId/toggle', authenticate, toggleFlujo);

export default router;
