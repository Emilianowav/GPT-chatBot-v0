// 🛣️ Rutas del módulo de Calendario
// @ts-nocheck
import { Router, Request, Response } from 'express';
import { authenticate } from '../../../middlewares/authMiddleware.js';
import * as turnoController from '../controllers/turnoController.js';
import * as agenteController from '../controllers/agenteController.js';
import * as disponibilidadController from '../controllers/disponibilidadController.js';
import configuracionRoutes from './configuracionRoutes.js';
import botRoutes from './botRoutes.js';

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authenticate);

// ========== RUTAS DE CONFIGURACIÓN ==========
router.use('/configuracion', configuracionRoutes);

// ========== RUTAS DEL BOT ==========
router.use('/bot', botRoutes);

// ========== RUTAS DE TURNOS ==========

// Obtener turnos del día (debe ir antes de /:id)
router.get('/turnos/hoy', turnoController.obtenerTurnosDelDia);

// Obtener estadísticas (debe ir antes de /:id)
router.get('/turnos/estadisticas', turnoController.obtenerEstadisticas);

// Crear turno
router.post('/turnos', turnoController.crearTurno);

// Obtener turnos con filtros
router.get('/turnos', turnoController.obtenerTurnos);

// Obtener turno por ID
router.get('/turnos/:id', turnoController.obtenerTurnoPorId);

// Actualizar estado de turno
router.patch('/turnos/:id/estado', turnoController.actualizarEstadoTurno);

// Cancelar turno
router.delete('/turnos/:id', turnoController.cancelarTurno);

// ========== RUTAS DE AGENTES ==========

// Crear agente
router.post('/agentes', agenteController.crearAgente);

// Obtener agentes
router.get('/agentes', agenteController.obtenerAgentes);

// Obtener agentes disponibles
router.get('/agentes/disponibles', agenteController.obtenerAgentesDisponibles);

// Obtener agente por ID
router.get('/agentes/:id', agenteController.obtenerAgentePorId);

// Actualizar agente
router.patch('/agentes/:id', agenteController.actualizarAgente);

// Eliminar agente
router.delete('/agentes/:id', agenteController.eliminarAgente);

// Configurar disponibilidad
router.put('/agentes/:id/disponibilidad', agenteController.configurarDisponibilidad);

// ========== RUTAS DE DISPONIBILIDAD ==========

// Obtener slots disponibles
router.get('/disponibilidad/:agenteId', disponibilidadController.obtenerSlotsDisponibles);

// Verificar disponibilidad
router.post('/disponibilidad/verificar', disponibilidadController.verificarDisponibilidad);

export default router;
