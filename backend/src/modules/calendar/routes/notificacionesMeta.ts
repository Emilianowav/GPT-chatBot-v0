// 🔔 Rutas para Notificaciones con Plantillas de Meta

import { Router } from 'express';
import { authenticate } from '../../../middlewares/authMiddleware.js';
import { enviarPrueba } from '../controllers/notificacionesMetaController.js';

const router = Router();

// POST /api/modules/calendar/notificaciones-meta/test
// Enviar notificación de prueba (agente o cliente)
router.post('/test', authenticate, enviarPrueba);

export default router;
