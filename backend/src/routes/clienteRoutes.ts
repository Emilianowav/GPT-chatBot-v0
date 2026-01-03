// 👤 Rutas de Clientes
import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import {
  crearCliente,
  obtenerClientes,
  buscarClientes,
  obtenerClientePorId,
  actualizarCliente,
  eliminarCliente,
  agregarAgente,
  removerAgente,
  reemplazarAgentes,
  obtenerClientesPorAgente,
  obtenerClientesSinAgente
} from '../controllers/clienteController.js';

const router = Router();

// GET /api/clientes/buscar?q=termino - Buscar clientes (DEBE IR ANTES DE /:id)
router.get('/buscar', authenticate, buscarClientes);

// GET /api/clientes/sin-agente - Obtener clientes sin agente asignado
router.get('/sin-agente', authenticate, obtenerClientesSinAgente);

// GET /api/clientes/por-agente/:agenteId - Obtener clientes por agente
router.get('/por-agente/:agenteId', authenticate, obtenerClientesPorAgente);

// GET /api/clientes - Obtener todos los clientes
router.get('/', authenticate, obtenerClientes);

// GET /api/clientes/:id - Obtener un cliente por ID
router.get('/:id', authenticate, obtenerClientePorId);

// POST /api/clientes - Crear un nuevo cliente
router.post('/', authenticate, crearCliente);

// PATCH /api/clientes/:id - Actualizar un cliente
router.patch('/:id', authenticate, actualizarCliente);

// POST /api/clientes/:id/agentes - Agregar un agente a un cliente
router.post('/:id/agentes', authenticate, agregarAgente);

// PUT /api/clientes/:id/agentes - Reemplazar todos los agentes de un cliente
router.put('/:id/agentes', authenticate, reemplazarAgentes);

// DELETE /api/clientes/:id/agentes/:agenteId - Remover un agente de un cliente
router.delete('/:id/agentes/:agenteId', authenticate, removerAgente);

// DELETE /api/clientes/:id - Eliminar un cliente
router.delete('/:id', authenticate, eliminarCliente);

export default router;
