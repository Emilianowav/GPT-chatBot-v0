// 🔐 Rutas de Super Administrador
import { Router } from 'express';
import { authenticate, requireSuperAdmin } from '../middlewares/authMiddleware.js';
import * as controller from '../controllers/superAdminController.js';

const router = Router();

// Todas las rutas requieren autenticación y rol super_admin
router.use(authenticate);
router.use(requireSuperAdmin);

// POST /api/sa/empresas - Crear nueva empresa (onboarding)
router.post('/empresas', controller.crearEmpresa);

// GET /api/sa/empresas - Listar todas las empresas con filtros
router.get('/empresas', controller.obtenerEmpresas);

// GET /api/sa/empresas/:id - Detalle completo de empresa + métricas
router.get('/empresas/:id', controller.obtenerDetalleEmpresa);

// PUT /api/sa/empresas/:id - Actualizar empresa (WhatsApp, límites, etc.)
router.put('/empresas/:id', controller.actualizarEmpresa);

// POST /api/sa/empresas/:id/user - Crear usuario admin para empresa
router.post('/empresas/:id/user', controller.crearUsuarioAdmin);

// DELETE /api/sa/empresas/:id - Eliminar empresa
router.delete('/empresas/:id', controller.eliminarEmpresa);

// POST /api/sa/generar-prompt - Generar prompt con GPT
router.post('/generar-prompt', controller.generarPrompt);

export default router;
