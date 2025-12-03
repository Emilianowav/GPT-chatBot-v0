// 📦 Exportación centralizada de rutas
import { Router } from 'express';
import apiConfigRoutes from './apiConfigRoutes.js';

const router = Router();

console.log('🟢 [INTEGRATIONS] Módulo de integraciones - Montando rutas...');

// Montar rutas
router.use('', apiConfigRoutes);

console.log('🟢 [INTEGRATIONS] Rutas montadas exitosamente');

export default router;
