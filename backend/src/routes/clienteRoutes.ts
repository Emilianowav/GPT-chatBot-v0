// 👤 Rutas de Clientes
import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import {
  crearCliente,
  obtenerClientes,
  buscarClientes,
  obtenerClientePorId,
  actualizarCliente,
  eliminarCliente
} from '../controllers/clienteController.js';

const router = Router();

// GET /api/clientes/buscar?q=termino - Buscar clientes (DEBE IR ANTES DE /:id)
router.get('/buscar', authenticate, buscarClientes);

// GET /api/clientes - Obtener todos los clientes
router.get('/', authenticate, obtenerClientes);

// GET /api/clientes/:id - Obtener un cliente por ID
router.get('/:id', authenticate, obtenerClientePorId);

// POST /api/clientes - Crear un nuevo cliente
router.post('/', authenticate, crearCliente);

// PATCH /api/clientes/:id - Actualizar un cliente
router.patch('/:id', authenticate, actualizarCliente);

// DELETE /api/clientes/:id - Eliminar un cliente
router.delete('/:id', authenticate, eliminarCliente);

export default router;
