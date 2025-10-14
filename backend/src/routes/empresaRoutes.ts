// 🏢 Rutas de Empresas
import { Router } from 'express';
import { getEmpresaStats, getEmpresa, updateEmpresa } from '../controllers/empresaController.js';
import { authenticate, requireAdmin } from '../middlewares/authMiddleware.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/empresas/:empresaId/stats - Estadísticas de la empresa
router.get('/:empresaId/stats', getEmpresaStats);

// GET /api/empresas/:empresaId - Información de la empresa
router.get('/:empresaId', getEmpresa);

// PUT /api/empresas/:empresaId - Actualizar empresa (solo admin)
router.put('/:empresaId', requireAdmin, updateEmpresa);

export default router;
