// 🤖 Rutas del Bot de Turnos
import express from 'express';
import * as botController from '../controllers/botController.js';

const router = express.Router();

// Nota: La autenticación se aplica en calendarRoutes.ts

// Configuración del bot
router.get('/configuracion/:empresaId', botController.obtenerConfiguracion);
router.put('/configuracion/:empresaId', botController.actualizarConfiguracion);

// Activar/Desactivar
router.post('/activar/:empresaId', botController.toggleBot);

// Estadísticas
router.get('/estadisticas/:empresaId', botController.obtenerEstadisticas);

export default router;
