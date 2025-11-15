// 🛣️ Rutas para APIs Configurables
import { Router } from 'express';
import * as apiConfigController from '../controllers/apiConfigController.js';

const router = Router();

console.log('🟡 [INTEGRATIONS] Registrando rutas de APIs...');

// CRUD de APIs
router.get('/:empresaId/apis', apiConfigController.obtenerApis as any);
console.log('✅ GET /:empresaId/apis');

router.get('/:empresaId/apis/:id', apiConfigController.obtenerApiPorId as any);
console.log('✅ GET /:empresaId/apis/:id');

router.post('/:empresaId/apis', apiConfigController.crearApi as any);
console.log('✅ POST /:empresaId/apis');

router.put('/:empresaId/apis/:id', apiConfigController.actualizarApi as any);
console.log('✅ PUT /:empresaId/apis/:id');

router.delete('/:empresaId/apis/:id', apiConfigController.eliminarApi as any);
console.log('✅ DELETE /:empresaId/apis/:id');

// Endpoints
router.post('/:empresaId/apis/:id/endpoints', apiConfigController.crearEndpoint as any);
router.put('/:empresaId/apis/:id/endpoints/:endpointId', apiConfigController.actualizarEndpoint as any);
router.delete('/:empresaId/apis/:id/endpoints/:endpointId', apiConfigController.eliminarEndpoint as any);

// Ejecución
router.post('/:empresaId/apis/:id/ejecutar/:endpointId', apiConfigController.ejecutarEndpoint as any);

// Logs y estadísticas
router.get('/:empresaId/apis/:id/logs', apiConfigController.obtenerLogs as any);
router.get('/:empresaId/apis/:id/estadisticas', apiConfigController.obtenerEstadisticas as any);

export default router;
