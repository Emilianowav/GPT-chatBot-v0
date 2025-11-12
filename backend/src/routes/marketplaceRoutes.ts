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

// ==================== WOOCOMMERCE ====================

/**
 * POST /api/marketplace/:empresaId/woocommerce/connect
 * Conecta una tienda de WooCommerce
 * Body: { storeUrl: string, consumerKey: string, consumerSecret: string }
 */
router.post('/:empresaId/woocommerce/connect', authenticate, asyncHandler(marketplaceController.connectWooCommerce));

/**
 * GET /api/marketplace/:empresaId/woocommerce/products
 * Lista productos de WooCommerce
 * Query params: page?, per_page?, search?, category?, status?
 */
router.get('/:empresaId/woocommerce/products', authenticate, asyncHandler(marketplaceController.listWooCommerceProducts));

/**
 * GET /api/marketplace/:empresaId/woocommerce/products/:productId
 * Obtiene un producto específico
 */
router.get('/:empresaId/woocommerce/products/:productId', authenticate, asyncHandler(marketplaceController.getWooCommerceProduct));

/**
 * POST /api/marketplace/:empresaId/woocommerce/products
 * Crea un producto en WooCommerce
 * Body: { name, type, regular_price, description, ... }
 */
router.post('/:empresaId/woocommerce/products', authenticate, asyncHandler(marketplaceController.createWooCommerceProduct));

/**
 * PUT /api/marketplace/:empresaId/woocommerce/products/:productId
 * Actualiza un producto en WooCommerce
 * Body: { name?, regular_price?, description?, ... }
 */
router.put('/:empresaId/woocommerce/products/:productId', authenticate, asyncHandler(marketplaceController.updateWooCommerceProduct));

/**
 * DELETE /api/marketplace/:empresaId/woocommerce/products/:productId
 * Elimina un producto de WooCommerce
 */
router.delete('/:empresaId/woocommerce/products/:productId', authenticate, asyncHandler(marketplaceController.deleteWooCommerceProduct));

/**
 * GET /api/marketplace/:empresaId/woocommerce/orders
 * Lista órdenes de WooCommerce
 * Query params: page?, per_page?, status?, after?, before?
 */
router.get('/:empresaId/woocommerce/orders', authenticate, asyncHandler(marketplaceController.listWooCommerceOrders));

/**
 * GET /api/marketplace/:empresaId/woocommerce/orders/:orderId
 * Obtiene una orden específica
 */
router.get('/:empresaId/woocommerce/orders/:orderId', authenticate, asyncHandler(marketplaceController.getWooCommerceOrder));

/**
 * PUT /api/marketplace/:empresaId/woocommerce/orders/:orderId
 * Actualiza una orden en WooCommerce
 * Body: { status?, customer_note?, ... }
 */
router.put('/:empresaId/woocommerce/orders/:orderId', authenticate, asyncHandler(marketplaceController.updateWooCommerceOrder));

/**
 * GET /api/marketplace/:empresaId/woocommerce/customers
 * Lista clientes de WooCommerce
 * Query params: page?, per_page?, search?, email?
 */
router.get('/:empresaId/woocommerce/customers', authenticate, asyncHandler(marketplaceController.listWooCommerceCustomers));

/**
 * GET /api/marketplace/:empresaId/woocommerce/categories
 * Lista categorías de productos
 */
router.get('/:empresaId/woocommerce/categories', authenticate, asyncHandler(marketplaceController.listWooCommerceCategories));

/**
 * GET /api/marketplace/:empresaId/woocommerce/reports/sales
 * Obtiene reporte de ventas
 * Query params: period?, date_min?, date_max?
 */
router.get('/:empresaId/woocommerce/reports/sales', authenticate, asyncHandler(marketplaceController.getWooCommerceSalesReport));

// ==================== GOOGLE SHEETS ====================

/**
 * GET /api/marketplace/:empresaId/google-sheets/connect
 * Inicia el flujo OAuth de Google Sheets
 */
router.get('/:empresaId/google-sheets/connect', authenticate, asyncHandler(marketplaceController.connectGoogleSheets));

/**
 * GET /api/marketplace/google-sheets/callback
 * Callback de OAuth de Google Sheets (no requiere auth)
 */
router.get('/google-sheets/callback', asyncHandler(marketplaceController.googleSheetsCallback));

/**
 * GET /api/marketplace/:empresaId/google-sheets/spreadsheets
 * Lista las hojas de cálculo del usuario
 */
router.get('/:empresaId/google-sheets/spreadsheets', authenticate, asyncHandler(marketplaceController.listGoogleSpreadsheets));

/**
 * GET /api/marketplace/:empresaId/google-sheets/spreadsheets/:spreadsheetId
 * Obtiene información de una hoja de cálculo
 */
router.get('/:empresaId/google-sheets/spreadsheets/:spreadsheetId', authenticate, asyncHandler(marketplaceController.getGoogleSpreadsheet));

/**
 * POST /api/marketplace/:empresaId/google-sheets/spreadsheets
 * Crea una nueva hoja de cálculo
 * Body: { title: string, sheets?: Array<{ title: string }> }
 */
router.post('/:empresaId/google-sheets/spreadsheets', authenticate, asyncHandler(marketplaceController.createGoogleSpreadsheet));

/**
 * GET /api/marketplace/:empresaId/google-sheets/spreadsheets/:spreadsheetId/values
 * Lee valores de un rango
 * Query params: range (ej: "Hoja1!A1:B10")
 */
router.get('/:empresaId/google-sheets/spreadsheets/:spreadsheetId/values', authenticate, asyncHandler(marketplaceController.getGoogleSheetValues));

/**
 * PUT /api/marketplace/:empresaId/google-sheets/spreadsheets/:spreadsheetId/values
 * Actualiza valores en un rango
 * Body: { range: string, values: any[][] }
 */
router.put('/:empresaId/google-sheets/spreadsheets/:spreadsheetId/values', authenticate, asyncHandler(marketplaceController.updateGoogleSheetValues));

/**
 * POST /api/marketplace/:empresaId/google-sheets/spreadsheets/:spreadsheetId/values/append
 * Agrega valores al final de una hoja
 * Body: { range: string, values: any[][] }
 */
router.post('/:empresaId/google-sheets/spreadsheets/:spreadsheetId/values/append', authenticate, asyncHandler(marketplaceController.appendGoogleSheetValues));

/**
 * POST /api/marketplace/:empresaId/google-sheets/spreadsheets/:spreadsheetId/values/clear
 * Limpia valores de un rango
 * Body: { range: string }
 */
router.post('/:empresaId/google-sheets/spreadsheets/:spreadsheetId/values/clear', authenticate, asyncHandler(marketplaceController.clearGoogleSheetValues));

/**
 * POST /api/marketplace/:empresaId/google-sheets/spreadsheets/:spreadsheetId/sheets
 * Agrega una nueva pestaña
 * Body: { sheetTitle: string }
 */
router.post('/:empresaId/google-sheets/spreadsheets/:spreadsheetId/sheets', authenticate, asyncHandler(marketplaceController.addGoogleSheet));

/**
 * DELETE /api/marketplace/:empresaId/google-sheets/spreadsheets/:spreadsheetId/sheets/:sheetId
 * Elimina una pestaña
 */
router.delete('/:empresaId/google-sheets/spreadsheets/:spreadsheetId/sheets/:sheetId', authenticate, asyncHandler(marketplaceController.deleteGoogleSheet));

export default router;
