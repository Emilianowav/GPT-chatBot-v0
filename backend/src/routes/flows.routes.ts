import { Router } from 'express';
import { FlowController } from '../controllers/flow.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const flowController = new FlowController();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/flows/:empresaId - Obtener flows de una empresa
router.get('/:empresaId', flowController.getFlowsByEmpresa);

// GET /api/flows/detail/:flowId - Obtener un flow específico
router.get('/detail/:flowId', flowController.getFlowById);

// POST /api/flows - Crear nuevo flow
router.post('/', flowController.createFlow);

// PUT /api/flows/:flowId - Actualizar flow
router.put('/:flowId', flowController.updateFlow);

// DELETE /api/flows/:flowId - Eliminar flow
router.delete('/:flowId', flowController.deleteFlow);

// POST /api/flows/:flowId/execute - Ejecutar flow
router.post('/:flowId/execute', flowController.executeFlow);

export default router;
