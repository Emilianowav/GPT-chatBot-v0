// 🎯 Rutas de Intervención de Conversaciones
import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import {
  pausarChatbotController,
  reanudarChatbotController,
  enviarMensajeController,
  obtenerEstadoController
} from '../controllers/intervencionController.js';

const router = Router();

// GET /api/intervencion/:contactoId/estado - Obtener estado de intervención
router.get('/:contactoId/estado', authenticate, obtenerEstadoController);

// POST /api/intervencion/:contactoId/pausar - Pausar chatbot
router.post('/:contactoId/pausar', authenticate, pausarChatbotController);

// POST /api/intervencion/:contactoId/reanudar - Reanudar chatbot
router.post('/:contactoId/reanudar', authenticate, reanudarChatbotController);

// POST /api/intervencion/:contactoId/mensaje - Enviar mensaje manual
router.post('/:contactoId/mensaje', authenticate, enviarMensajeController);

export default router;
