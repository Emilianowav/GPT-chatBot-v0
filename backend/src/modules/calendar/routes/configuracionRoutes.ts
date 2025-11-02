// ⚙️ Rutas de Configuración del Módulo
import { Router } from 'express';
import * as configuracionController from '../controllers/configuracionController.js';

const router = Router();

// Obtener plantillas predefinidas
router.get('/plantillas', configuracionController.obtenerPlantillas);

// Enviar notificación de prueba (debe ir antes de /:empresaId)
router.post('/notificaciones/enviar-prueba', configuracionController.enviarNotificacionPrueba);

// Obtener configuración de una empresa
router.get('/:empresaId', configuracionController.obtenerConfiguracion);

// Guardar/actualizar configuración
router.put('/:empresaId', configuracionController.guardarConfiguracion);

export default router;
