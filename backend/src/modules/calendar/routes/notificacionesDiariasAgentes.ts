// 📅 Rutas para notificaciones diarias de agentes
import { Router } from 'express';
import { authenticate } from '../../../middlewares/authMiddleware.js';
import { 
  enviarNotificacionPruebaAgente 
} from '../controllers/notificacionesDiariasAgentesController.js';

const router = Router();

// POST /api/modules/calendar/notificaciones-diarias-agentes/test
// Enviar notificación de prueba a un agente específico
router.post('/test', authenticate, enviarNotificacionPruebaAgente);

export default router;
