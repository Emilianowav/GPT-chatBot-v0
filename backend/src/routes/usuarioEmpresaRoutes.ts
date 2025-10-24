// 👥 Rutas de Usuarios de Empresa
import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import * as controller from '../controllers/usuarioEmpresaController.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Estadísticas (debe ir antes de /:id para evitar conflictos)
router.get('/estadisticas', controller.obtenerEstadisticas);

// CRUD de usuarios
router.post('/', controller.crearUsuario);
router.get('/', controller.obtenerUsuarios);
router.get('/:id', controller.obtenerUsuarioPorId);
router.put('/:id', controller.actualizarUsuario);
router.delete('/:id', controller.eliminarUsuario);

// Cambio de contraseña
router.put('/:id/password', controller.cambiarPassword);

export default router;
