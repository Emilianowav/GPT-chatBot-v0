// 🛒 Rutas de Marketplace
import express from 'express';
import * as marketplaceController from '../controllers/marketplaceController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

// ==================== RUTAS GENERALES ====================

/**
 * GET /api/marketplace/integrations
 * Lista todas las integraciones disponibles en el marketplace
 */
router.get('/integrations', authenticate, asyncHandler(marketplaceController.listAvailableIntegrations));

/**
 * GET /api/marketplace/:empresaId/active
 * Lista las integraciones activas de una empresa
 */
router.get('/:empresaId/active', authenticate, asyncHandler(marketplaceController.listActiveIntegrations));

/**
 * GET /api/marketplace/integration/:integrationId
 * Obtiene detalles de una integración específica
 */
router.get('/integration/:integrationId', authenticate, asyncHandler(marketplaceController.getIntegrationDetails));

/**
 * PUT /api/marketplace/integration/:integrationId/config
 * Actualiza la configuración de una integración
 */
router.put('/integration/:integrationId/config', authenticate, asyncHandler(marketplaceController.updateIntegrationConfig));

/**
 * DELETE /api/marketplace/integration/:integrationId
 * Desconecta/elimina una integración
 */
router.delete('/integration/:integrationId', authenticate, asyncHandler(marketplaceController.disconnectIntegration));

// ==================== GOOGLE CALENDAR ====================

/**
 * GET /api/marketplace/:empresaId/google-calendar/connect
 * Inicia el flujo OAuth de Google Calendar
 */
router.get('/:empresaId/google-calendar/connect', authenticate, asyncHandler(marketplaceController.connectGoogleCalendar));

/**
 * GET /api/marketplace/google-calendar/callback
 * Callback de OAuth de Google Calendar (no requiere auth)
 */
router.get('/google-calendar/callback', asyncHandler(marketplaceController.googleCalendarCallback));

/**
 * GET /api/marketplace/:empresaId/google-calendar/calendars
 * Lista los calendarios de Google del usuario
 */
router.get('/:empresaId/google-calendar/calendars', authenticate, asyncHandler(marketplaceController.listGoogleCalendars));

/**
 * GET /api/marketplace/:empresaId/google-calendar/events
 * Obtiene eventos de un calendario
 * Query params: calendarId, timeMin, timeMax
 */
router.get('/:empresaId/google-calendar/events', authenticate, asyncHandler(marketplaceController.getGoogleCalendarEvents));

/**
 * POST /api/marketplace/:empresaId/google-calendar/events
 * Crea un evento en Google Calendar
 * Body: { calendarId?, event: {...} }
 */
router.post('/:empresaId/google-calendar/events', authenticate, asyncHandler(marketplaceController.createGoogleCalendarEvent));

/**
 * PUT /api/marketplace/:empresaId/google-calendar/events/:eventId
 * Actualiza un evento en Google Calendar
 * Body: { calendarId?, event: {...} }
 */
router.put('/:empresaId/google-calendar/events/:eventId', authenticate, asyncHandler(marketplaceController.updateGoogleCalendarEvent));

/**
 * DELETE /api/marketplace/:empresaId/google-calendar/events/:eventId
 * Elimina un evento de Google Calendar
 * Query params: calendarId?
 */
router.delete('/:empresaId/google-calendar/events/:eventId', authenticate, asyncHandler(marketplaceController.deleteGoogleCalendarEvent));

export default router;
