// 🎨 Rutas para gestión de plantillas de notificaciones

import { Router } from 'express';
import * as plantillasController from '../controllers/plantillasController.js';

const router = Router();

// Configurar parámetros de plantilla
router.post('/configurar', plantillasController.configurarParametrosPlantilla);

// Configurar plantillas de San Jose (solución rápida)
router.post('/configurar-sanjose', plantillasController.configurarSanJose);

export default router;
