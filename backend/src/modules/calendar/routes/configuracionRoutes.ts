// ⚙️ Rutas de Configuración del Módulo
import { Router } from 'express';
import * as configuracionController from '../controllers/configuracionController';

const router = Router();

// Obtener plantillas predefinidas
router.get('/plantillas', configuracionController.obtenerPlantillas);

// Obtener configuración de una empresa
router.get('/:empresaId', configuracionController.obtenerConfiguracion);

// Guardar/actualizar configuración
router.put('/:empresaId', configuracionController.guardarConfiguracion);

export default router;
