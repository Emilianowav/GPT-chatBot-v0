/**
 * 💬 Rutas de Mensajes de Flujo
 */

import { Router } from 'express';
import {
  obtenerMensajesFlujo,
  actualizarMensajesFlujo,
  actualizarVariablesDinamicas,
  obtenerCamposPersonalizados,
  actualizarCamposPersonalizados,
  previsualizarMensaje
} from '../controllers/mensajesFlujoController.js';

const router = Router();

// Rutas específicas primero (antes de las dinámicas)

// Previsualizar mensaje
router.post('/:empresaId/preview', previsualizarMensaje);

// Obtener campos personalizados
router.get('/:empresaId/campos-personalizados', obtenerCamposPersonalizados);

// Actualizar campos personalizados
router.put('/:empresaId/campos-personalizados', actualizarCamposPersonalizados);

// Actualizar variables dinámicas
router.put('/:empresaId/variables', actualizarVariablesDinamicas);

// Actualizar mensajes de un flujo específico
router.put('/:empresaId/:flujo', actualizarMensajesFlujo);

// Obtener todos los mensajes de flujo (al final porque es más general)
router.get('/:empresaId', obtenerMensajesFlujo);

export default router;
