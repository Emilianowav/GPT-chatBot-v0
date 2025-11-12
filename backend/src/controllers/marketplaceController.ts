// 🛒 Controlador de Marketplace - Gestión de Integraciones
import { Request, Response } from 'express';
import { MarketplaceIntegrationModel } from '../models/MarketplaceIntegration.js';
import * as googleCalendarService from '../services/googleCalendarService.js';
import * as googleSheetsService from '../services/googleSheetsService.js';
import * as woocommerceService from '../services/woocommerceService.js';

/**
 * Lista todas las integraciones disponibles en el marketplace
 */
export async function listAvailableIntegrations(req: Request, res: Response) {
  try {
    const availableIntegrations = [
      {
        id: 'google_calendar',
        name: 'Google Calendar',
        description: 'Sincroniza y gestiona eventos de Google Calendar',
        icon: '📅',
        category: 'productivity',
        features: [
          'Sincronización automática de eventos',
          'Creación y edición de eventos',
          'Gestión de múltiples calendarios',
          'Notificaciones en tiempo real'
        ],
        status: 'available'
      },
      {
        id: 'google_drive',
        name: 'Google Drive',
        description: 'Gestiona archivos y documentos en Google Drive',
        icon: '📁',
        category: 'storage',
        features: ['Próximamente'],
        status: 'coming_soon'
      },
      {
        id: 'outlook_calendar',
        name: 'Outlook Calendar',
        description: 'Integración con Microsoft Outlook Calendar',
        icon: '📆',
        category: 'productivity',
        features: ['Próximamente'],
        status: 'coming_soon'
      },
      {
        id: 'zoom',
        name: 'Zoom',
        description: 'Crea y gestiona reuniones de Zoom',
        icon: '🎥',
        category: 'communication',
        features: ['Próximamente'],
        status: 'coming_soon'
      },
      {
        id: 'woocommerce',
        name: 'WooCommerce',
        description: 'Gestiona productos, órdenes y clientes de tu tienda online',
        icon: '🛒',
        category: 'ecommerce',
        features: [
          'Sincronización de productos',
          'Gestión de órdenes en tiempo real',
          'Gestión de clientes',
          'Reportes de ventas',
          'Actualización de inventario'
        ],
        status: 'available'
      },
      {
        id: 'google_sheets',
        name: 'Google Sheets',
        description: 'Lee y escribe datos en hojas de cálculo de Google',
        icon: '📊',
        category: 'productivity',
        features: [
          'Lectura y escritura de datos',
          'Creación de hojas de cálculo',
          'Gestión de pestañas',
          'Actualización en tiempo real',
          'Integración con Drive'
        ],
        status: 'available'
      }
    ];

    res.json({
      success: true,
      integrations: availableIntegrations
    });
  } catch (error: any) {
    console.error('❌ Error listando integraciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar integraciones disponibles'
    });
  }
}

/**
 * Lista las integraciones activas de una empresa
 */
export async function listActiveIntegrations(req: Request, res: Response) {
  try {
    const { empresaId } = req.params;

    const integrations = await MarketplaceIntegrationModel.find({
      empresaId,
      status: { $in: ['active', 'expired', 'error'] }
    })
      .select('-credentials') // No exponer credenciales
      .populate('usuarioEmpresaId', 'nombre apellido email')
      .populate('createdBy', 'nombre apellido email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      integrations
    });
  } catch (error: any) {
    console.error('❌ Error listando integraciones activas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar integraciones activas'
    });
  }
}

/**
 * Obtiene detalles de una integración específica
 */
export async function getIntegrationDetails(req: Request, res: Response) {
  try {
    const { integrationId } = req.params;

    const integration = await MarketplaceIntegrationModel.findById(integrationId)
      .select('-credentials') // No exponer credenciales
      .populate('usuarioEmpresaId', 'nombre apellido email')
      .populate('createdBy', 'nombre apellido email');

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'Integración no encontrada'
      });
    }

    res.json({
      success: true,
      integration
    });
  } catch (error: any) {
    console.error('❌ Error obteniendo detalles de integración:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener detalles de la integración'
    });
  }
}

/**
 * Actualiza la configuración de una integración
 */
export async function updateIntegrationConfig(req: Request, res: Response) {
  try {
    const { integrationId } = req.params;
    const { config } = req.body;

    const integration = await MarketplaceIntegrationModel.findById(integrationId);

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'Integración no encontrada'
      });
    }

    // Actualizar configuración
    integration.config = { ...integration.config, ...config };
    
    // Recalcular próxima sincronización si cambió el intervalo
    if (config[integration.provider]?.sync_interval) {
      integration.next_sync = (integration as any).calculateNextSync();
    }

    await integration.save();

    res.json({
      success: true,
      message: 'Configuración actualizada exitosamente',
      integration
    });
  } catch (error: any) {
    console.error('❌ Error actualizando configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar configuración'
    });
  }
}

/**
 * Elimina/desconecta una integración
 */
export async function disconnectIntegration(req: Request, res: Response) {
  try {
    const { integrationId } = req.params;

    const integration = await MarketplaceIntegrationModel.findById(integrationId);

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'Integración no encontrada'
      });
    }

    // Revocar acceso en el proveedor
    if (integration.provider === 'google_calendar') {
      try {
        const credentials = require('../services/encryptionService.js').decryptCredentials(integration.credentials);
        await googleCalendarService.revokeGoogleAccess(credentials.access_token);
      } catch (error) {
        console.warn('⚠️  No se pudo revocar el acceso en Google');
      }
    }

    // Marcar como revocado
    integration.status = 'revoked';
    await integration.save();

    res.json({
      success: true,
      message: 'Integración desconectada exitosamente'
    });
  } catch (error: any) {
    console.error('❌ Error desconectando integración:', error);
    res.status(500).json({
      success: false,
      message: 'Error al desconectar integración'
    });
  }
}

// ==================== GOOGLE CALENDAR ====================

/**
 * Inicia el flujo OAuth de Google Calendar
 */
export async function connectGoogleCalendar(req: Request, res: Response) {
  try {
    const { empresaId } = req.params;
    const usuarioEmpresaId = (req as any).user?.id || (req as any).user?._id;

    if (!usuarioEmpresaId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Verificar si ya existe una integración activa
    const existingIntegration = await MarketplaceIntegrationModel.findOne({
      empresaId,
      provider: 'google_calendar',
      status: 'active'
    });

    if (existingIntegration) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una integración activa de Google Calendar para esta empresa'
      });
    }

    // Generar URL de autorización
    const authUrl = googleCalendarService.getGoogleAuthUrl(empresaId, usuarioEmpresaId.toString());

    res.json({
      success: true,
      authUrl
    });
  } catch (error: any) {
    console.error('❌ Error iniciando OAuth de Google Calendar:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al iniciar conexión con Google Calendar'
    });
  }
}

/**
 * Callback de OAuth de Google Calendar
 */
export async function googleCalendarCallback(req: Request, res: Response) {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({
        success: false,
        message: 'Código o estado faltante'
      });
    }

    // Decodificar state
    const { empresaId, usuarioEmpresaId } = JSON.parse(
      Buffer.from(state as string, 'base64').toString('utf8')
    );

    // Intercambiar código por tokens
    const tokens = await googleCalendarService.exchangeCodeForTokens(code as string);

    // Obtener información del usuario
    const userInfo = await googleCalendarService.getGoogleUserInfo(tokens.access_token);

    // Guardar integración
    const integration = await googleCalendarService.saveGoogleCalendarIntegration(
      empresaId,
      usuarioEmpresaId,
      tokens,
      userInfo
    );

    // Redirigir al frontend con éxito
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    res.redirect(`${frontendUrl}/marketplace?integration=success&provider=google_calendar`);
  } catch (error: any) {
    console.error('❌ Error en callback de Google Calendar:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    res.redirect(`${frontendUrl}/marketplace?integration=error&message=${encodeURIComponent(error.message)}`);
  }
}

/**
 * Lista los calendarios de Google del usuario
 */
export async function listGoogleCalendars(req: Request, res: Response) {
  try {
    const { empresaId } = req.params;

    const integration = await MarketplaceIntegrationModel.findOne({
      empresaId,
      provider: 'google_calendar',
      status: 'active'
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'No hay integración activa de Google Calendar'
      });
    }

    const calendars = await googleCalendarService.listCalendars(integration);

    res.json({
      success: true,
      calendars
    });
  } catch (error: any) {
    console.error('❌ Error listando calendarios:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al listar calendarios'
    });
  }
}

/**
 * Obtiene eventos de un calendario
 */
export async function getGoogleCalendarEvents(req: Request, res: Response) {
  try {
    const { empresaId } = req.params;
    const { calendarId, timeMin, timeMax } = req.query;

    const integration = await MarketplaceIntegrationModel.findOne({
      empresaId,
      provider: 'google_calendar',
      status: 'active'
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'No hay integración activa de Google Calendar'
      });
    }

    const events = await googleCalendarService.getCalendarEvents(
      integration,
      (calendarId as string) || 'primary',
      timeMin ? new Date(timeMin as string) : undefined,
      timeMax ? new Date(timeMax as string) : undefined
    );

    // Actualizar última sincronización
    integration.last_sync = new Date();
    integration.sync_count += 1;
    await integration.save();

    res.json({
      success: true,
      events
    });
  } catch (error: any) {
    console.error('❌ Error obteniendo eventos:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener eventos'
    });
  }
}

/**
 * Crea un evento en Google Calendar
 */
export async function createGoogleCalendarEvent(req: Request, res: Response) {
  try {
    const { empresaId } = req.params;
    const { calendarId, event } = req.body;

    const integration = await MarketplaceIntegrationModel.findOne({
      empresaId,
      provider: 'google_calendar',
      status: 'active'
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'No hay integración activa de Google Calendar'
      });
    }

    const createdEvent = await googleCalendarService.createCalendarEvent(
      integration,
      calendarId || 'primary',
      event
    );

    res.json({
      success: true,
      event: createdEvent
    });
  } catch (error: any) {
    console.error('❌ Error creando evento:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al crear evento'
    });
  }
}

/**
 * Actualiza un evento en Google Calendar
 */
export async function updateGoogleCalendarEvent(req: Request, res: Response) {
  try {
    const { empresaId, eventId } = req.params;
    const { calendarId, event } = req.body;

    const integration = await MarketplaceIntegrationModel.findOne({
      empresaId,
      provider: 'google_calendar',
      status: 'active'
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'No hay integración activa de Google Calendar'
      });
    }

    const updatedEvent = await googleCalendarService.updateCalendarEvent(
      integration,
      calendarId || 'primary',
      eventId,
      event
    );

    res.json({
      success: true,
      event: updatedEvent
    });
  } catch (error: any) {
    console.error('❌ Error actualizando evento:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al actualizar evento'
    });
  }
}

/**
 * Elimina un evento de Google Calendar
 */
export async function deleteGoogleCalendarEvent(req: Request, res: Response) {
  try {
    const { empresaId, eventId } = req.params;
    const { calendarId } = req.query;

    const integration = await MarketplaceIntegrationModel.findOne({
      empresaId,
      provider: 'google_calendar',
      status: 'active'
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'No hay integración activa de Google Calendar'
      });
    }

    await googleCalendarService.deleteCalendarEvent(
      integration,
      (calendarId as string) || 'primary',
      eventId
    );

    res.json({
      success: true,
      message: 'Evento eliminado exitosamente'
    });
  } catch (error: any) {
    console.error('❌ Error eliminando evento:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al eliminar evento'
    });
  }
}

// ==================== WOOCOMMERCE ====================

/**
 * Conecta una tienda de WooCommerce
 */
export async function connectWooCommerce(req: Request, res: Response) {
  try {
    const { empresaId } = req.params;
    const { storeUrl, consumerKey, consumerSecret } = req.body;
    const usuarioEmpresaId = (req as any).user?.id || (req as any).user?._id;

    if (!usuarioEmpresaId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    if (!storeUrl || !consumerKey || !consumerSecret) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos requeridos: storeUrl, consumerKey, consumerSecret'
      });
    }

    // Guardar integración
    const integration = await woocommerceService.saveWooCommerceIntegration(
      empresaId,
      usuarioEmpresaId.toString(),
      storeUrl,
      consumerKey,
      consumerSecret
    );

    // Verificar conexión
    const isConnected = await woocommerceService.testConnection(integration);

    if (!isConnected) {
      return res.status(400).json({
        success: false,
        message: 'No se pudo conectar con la tienda. Verifica las credenciales.'
      });
    }

    res.json({
      success: true,
      message: 'WooCommerce conectado exitosamente',
      integration: {
        id: integration._id,
        provider: integration.provider,
        connected_account: integration.connected_account,
        status: integration.status
      }
    });
  } catch (error: any) {
    console.error('❌ Error conectando WooCommerce:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al conectar con WooCommerce'
    });
  }
}

/**
 * Lista productos de WooCommerce
 */
export async function listWooCommerceProducts(req: Request, res: Response) {
  try {
    const { empresaId } = req.params;
    const { page, per_page, search, category, status } = req.query;

    const integration = await MarketplaceIntegrationModel.findOne({
      empresaId,
      provider: 'woocommerce',
      status: 'active'
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'No hay integración activa de WooCommerce'
      });
    }

    const products = await woocommerceService.listProducts(integration, {
      page,
      per_page,
      search,
      category,
      status
    });

    res.json({
      success: true,
      products
    });
  } catch (error: any) {
    console.error('❌ Error listando productos:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al listar productos'
    });
  }
}

/**
 * Obtiene un producto específico
 */
export async function getWooCommerceProduct(req: Request, res: Response) {
  try {
    const { empresaId, productId } = req.params;

    const integration = await MarketplaceIntegrationModel.findOne({
      empresaId,
      provider: 'woocommerce',
      status: 'active'
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'No hay integración activa de WooCommerce'
      });
    }

    const product = await woocommerceService.getProduct(integration, productId);

    res.json({
      success: true,
      product
    });
  } catch (error: any) {
    console.error('❌ Error obteniendo producto:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener producto'
    });
  }
}

/**
 * Crea un producto en WooCommerce
 */
export async function createWooCommerceProduct(req: Request, res: Response) {
  try {
    const { empresaId } = req.params;
    const productData = req.body;

    const integration = await MarketplaceIntegrationModel.findOne({
      empresaId,
      provider: 'woocommerce',
      status: 'active'
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'No hay integración activa de WooCommerce'
      });
    }

    const product = await woocommerceService.createProduct(integration, productData);

    res.json({
      success: true,
      product,
      message: 'Producto creado exitosamente'
    });
  } catch (error: any) {
    console.error('❌ Error creando producto:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al crear producto'
    });
  }
}

/**
 * Actualiza un producto en WooCommerce
 */
export async function updateWooCommerceProduct(req: Request, res: Response) {
  try {
    const { empresaId, productId } = req.params;
    const productData = req.body;

    const integration = await MarketplaceIntegrationModel.findOne({
      empresaId,
      provider: 'woocommerce',
      status: 'active'
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'No hay integración activa de WooCommerce'
      });
    }

    const product = await woocommerceService.updateProduct(integration, productId, productData);

    res.json({
      success: true,
      product,
      message: 'Producto actualizado exitosamente'
    });
  } catch (error: any) {
    console.error('❌ Error actualizando producto:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al actualizar producto'
    });
  }
}

/**
 * Elimina un producto de WooCommerce
 */
export async function deleteWooCommerceProduct(req: Request, res: Response) {
  try {
    const { empresaId, productId } = req.params;

    const integration = await MarketplaceIntegrationModel.findOne({
      empresaId,
      provider: 'woocommerce',
      status: 'active'
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'No hay integración activa de WooCommerce'
      });
    }

    await woocommerceService.deleteProduct(integration, productId);

    res.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });
  } catch (error: any) {
    console.error('❌ Error eliminando producto:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al eliminar producto'
    });
  }
}

/**
 * Lista órdenes de WooCommerce
 */
export async function listWooCommerceOrders(req: Request, res: Response) {
  try {
    const { empresaId } = req.params;
    const { page, per_page, status, after, before } = req.query;

    const integration = await MarketplaceIntegrationModel.findOne({
      empresaId,
      provider: 'woocommerce',
      status: 'active'
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'No hay integración activa de WooCommerce'
      });
    }

    const orders = await woocommerceService.listOrders(integration, {
      page,
      per_page,
      status,
      after,
      before
    });

    res.json({
      success: true,
      orders
    });
  } catch (error: any) {
    console.error('❌ Error listando órdenes:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al listar órdenes'
    });
  }
}

/**
 * Obtiene una orden específica
 */
export async function getWooCommerceOrder(req: Request, res: Response) {
  try {
    const { empresaId, orderId } = req.params;

    const integration = await MarketplaceIntegrationModel.findOne({
      empresaId,
      provider: 'woocommerce',
      status: 'active'
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'No hay integración activa de WooCommerce'
      });
    }

    const order = await woocommerceService.getOrder(integration, orderId);

    res.json({
      success: true,
      order
    });
  } catch (error: any) {
    console.error('❌ Error obteniendo orden:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener orden'
    });
  }
}

/**
 * Actualiza una orden en WooCommerce
 */
export async function updateWooCommerceOrder(req: Request, res: Response) {
  try {
    const { empresaId, orderId } = req.params;
    const orderData = req.body;

    const integration = await MarketplaceIntegrationModel.findOne({
      empresaId,
      provider: 'woocommerce',
      status: 'active'
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'No hay integración activa de WooCommerce'
      });
    }

    const order = await woocommerceService.updateOrder(integration, orderId, orderData);

    res.json({
      success: true,
      order,
      message: 'Orden actualizada exitosamente'
    });
  } catch (error: any) {
    console.error('❌ Error actualizando orden:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al actualizar orden'
    });
  }
}

/**
 * Lista clientes de WooCommerce
 */
export async function listWooCommerceCustomers(req: Request, res: Response) {
  try {
    const { empresaId } = req.params;
    const { page, per_page, search, email } = req.query;

    const integration = await MarketplaceIntegrationModel.findOne({
      empresaId,
      provider: 'woocommerce',
      status: 'active'
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'No hay integración activa de WooCommerce'
      });
    }

    const customers = await woocommerceService.listCustomers(integration, {
      page,
      per_page,
      search,
      email
    });

    res.json({
      success: true,
      customers
    });
  } catch (error: any) {
    console.error('❌ Error listando clientes:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al listar clientes'
    });
  }
}

/**
 * Lista categorías de productos
 */
export async function listWooCommerceCategories(req: Request, res: Response) {
  try {
    const { empresaId } = req.params;

    const integration = await MarketplaceIntegrationModel.findOne({
      empresaId,
      provider: 'woocommerce',
      status: 'active'
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'No hay integración activa de WooCommerce'
      });
    }

    const categories = await woocommerceService.listCategories(integration, req.query);

    res.json({
      success: true,
      categories
    });
  } catch (error: any) {
    console.error('❌ Error listando categorías:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al listar categorías'
    });
  }
}

/**
 * Obtiene reporte de ventas
 */
export async function getWooCommerceSalesReport(req: Request, res: Response) {
  try {
    const { empresaId } = req.params;
    const { period, date_min, date_max } = req.query;

    const integration = await MarketplaceIntegrationModel.findOne({
      empresaId,
      provider: 'woocommerce',
      status: 'active'
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'No hay integración activa de WooCommerce'
      });
    }

    const report = await woocommerceService.getSalesReport(integration, {
      period,
      date_min,
      date_max
    });

    res.json({
      success: true,
      report
    });
  } catch (error: any) {
    console.error('❌ Error obteniendo reporte:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener reporte de ventas'
    });
  }
}

// ==================== GOOGLE SHEETS ====================

/**
 * Inicia la conexión con Google Sheets
 */
export async function connectGoogleSheets(req: Request, res: Response) {
  try {
    const { empresaId } = req.params;
    const usuarioEmpresaId = (req as any).user?.id || (req as any).user?._id;

    if (!usuarioEmpresaId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Generar URL de autorización
    const authUrl = googleSheetsService.getGoogleSheetsAuthUrl(
      empresaId,
      usuarioEmpresaId.toString()
    );

    res.json({
      success: true,
      authUrl
    });
  } catch (error: any) {
    console.error('❌ Error iniciando conexión Google Sheets:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al iniciar conexión con Google Sheets'
    });
  }
}

/**
 * Callback de OAuth de Google Sheets
 */
export async function googleSheetsCallback(req: Request, res: Response) {
  try {
    const { code, state, error } = req.query;

    if (error) {
      console.error('❌ Error en OAuth:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      return res.redirect(`${frontendUrl}/marketplace?integration=error&message=${encodeURIComponent(error as string)}`);
    }

    if (!code || !state) {
      return res.status(400).json({
        success: false,
        message: 'Código o state faltante'
      });
    }

    // Decodificar state
    const { empresaId, usuarioEmpresaId } = JSON.parse(
      Buffer.from(state as string, 'base64').toString('utf8')
    );

    // Intercambiar código por tokens
    const tokens = await googleSheetsService.exchangeCodeForTokens(code as string);

    // Obtener info del usuario
    const userInfo = await googleSheetsService.getUserInfo(tokens.access_token);

    // Guardar integración
    await googleSheetsService.saveGoogleSheetsIntegration(
      empresaId,
      usuarioEmpresaId,
      tokens,
      userInfo
    );

    // Redirigir al frontend
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    res.redirect(`${frontendUrl}/marketplace?integration=success&provider=google_sheets`);
  } catch (error: any) {
    console.error('❌ Error en callback de Google Sheets:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    res.redirect(`${frontendUrl}/marketplace?integration=error&message=${encodeURIComponent(error.message)}`);
  }
}

/**
 * Lista las hojas de cálculo del usuario
 */
export async function listGoogleSpreadsheets(req: Request, res: Response) {
  try {
    const { empresaId } = req.params;

    const integration = await MarketplaceIntegrationModel.findOne({
      empresaId,
      provider: 'google_sheets',
      status: 'active'
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'No hay integración activa de Google Sheets'
      });
    }

    const spreadsheets = await googleSheetsService.listSpreadsheets(integration);

    res.json({
      success: true,
      spreadsheets
    });
  } catch (error: any) {
    console.error('❌ Error listando spreadsheets:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al listar hojas de cálculo'
    });
  }
}

/**
 * Obtiene información de una hoja de cálculo
 */
export async function getGoogleSpreadsheet(req: Request, res: Response) {
  try {
    const { empresaId, spreadsheetId } = req.params;

    const integration = await MarketplaceIntegrationModel.findOne({
      empresaId,
      provider: 'google_sheets',
      status: 'active'
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'No hay integración activa de Google Sheets'
      });
    }

    const spreadsheet = await googleSheetsService.getSpreadsheet(integration, spreadsheetId);

    res.json({
      success: true,
      spreadsheet
    });
  } catch (error: any) {
    console.error('❌ Error obteniendo spreadsheet:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener hoja de cálculo'
    });
  }
}

/**
 * Crea una nueva hoja de cálculo
 */
export async function createGoogleSpreadsheet(req: Request, res: Response) {
  try {
    const { empresaId } = req.params;
    const { title, sheets } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'El título es requerido'
      });
    }

    const integration = await MarketplaceIntegrationModel.findOne({
      empresaId,
      provider: 'google_sheets',
      status: 'active'
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'No hay integración activa de Google Sheets'
      });
    }

    const spreadsheet = await googleSheetsService.createSpreadsheet(integration, title, sheets);

    res.json({
      success: true,
      spreadsheet,
      message: 'Hoja de cálculo creada exitosamente'
    });
  } catch (error: any) {
    console.error('❌ Error creando spreadsheet:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al crear hoja de cálculo'
    });
  }
}

/**
 * Lee valores de un rango
 */
export async function getGoogleSheetValues(req: Request, res: Response) {
  try {
    const { empresaId, spreadsheetId } = req.params;
    const { range } = req.query;

    if (!range) {
      return res.status(400).json({
        success: false,
        message: 'El rango es requerido'
      });
    }

    const integration = await MarketplaceIntegrationModel.findOne({
      empresaId,
      provider: 'google_sheets',
      status: 'active'
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'No hay integración activa de Google Sheets'
      });
    }

    const values = await googleSheetsService.getValues(integration, spreadsheetId, range as string);

    res.json({
      success: true,
      values
    });
  } catch (error: any) {
    console.error('❌ Error leyendo valores:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al leer valores'
    });
  }
}

/**
 * Actualiza valores en un rango
 */
export async function updateGoogleSheetValues(req: Request, res: Response) {
  try {
    const { empresaId, spreadsheetId } = req.params;
    const { range, values } = req.body;

    if (!range || !values) {
      return res.status(400).json({
        success: false,
        message: 'El rango y los valores son requeridos'
      });
    }

    const integration = await MarketplaceIntegrationModel.findOne({
      empresaId,
      provider: 'google_sheets',
      status: 'active'
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'No hay integración activa de Google Sheets'
      });
    }

    const result = await googleSheetsService.updateValues(integration, spreadsheetId, range, values);

    res.json({
      success: true,
      result,
      message: 'Valores actualizados exitosamente'
    });
  } catch (error: any) {
    console.error('❌ Error actualizando valores:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al actualizar valores'
    });
  }
}

/**
 * Agrega valores al final de una hoja
 */
export async function appendGoogleSheetValues(req: Request, res: Response) {
  try {
    const { empresaId, spreadsheetId } = req.params;
    const { range, values } = req.body;

    if (!range || !values) {
      return res.status(400).json({
        success: false,
        message: 'El rango y los valores son requeridos'
      });
    }

    const integration = await MarketplaceIntegrationModel.findOne({
      empresaId,
      provider: 'google_sheets',
      status: 'active'
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'No hay integración activa de Google Sheets'
      });
    }

    const result = await googleSheetsService.appendValues(integration, spreadsheetId, range, values);

    res.json({
      success: true,
      result,
      message: 'Valores agregados exitosamente'
    });
  } catch (error: any) {
    console.error('❌ Error agregando valores:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al agregar valores'
    });
  }
}

/**
 * Limpia valores de un rango
 */
export async function clearGoogleSheetValues(req: Request, res: Response) {
  try {
    const { empresaId, spreadsheetId } = req.params;
    const { range } = req.body;

    if (!range) {
      return res.status(400).json({
        success: false,
        message: 'El rango es requerido'
      });
    }

    const integration = await MarketplaceIntegrationModel.findOne({
      empresaId,
      provider: 'google_sheets',
      status: 'active'
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'No hay integración activa de Google Sheets'
      });
    }

    const result = await googleSheetsService.clearValues(integration, spreadsheetId, range);

    res.json({
      success: true,
      result,
      message: 'Valores limpiados exitosamente'
    });
  } catch (error: any) {
    console.error('❌ Error limpiando valores:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al limpiar valores'
    });
  }
}

/**
 * Agrega una nueva pestaña a una hoja de cálculo
 */
export async function addGoogleSheet(req: Request, res: Response) {
  try {
    const { empresaId, spreadsheetId } = req.params;
    const { sheetTitle } = req.body;

    if (!sheetTitle) {
      return res.status(400).json({
        success: false,
        message: 'El título de la pestaña es requerido'
      });
    }

    const integration = await MarketplaceIntegrationModel.findOne({
      empresaId,
      provider: 'google_sheets',
      status: 'active'
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'No hay integración activa de Google Sheets'
      });
    }

    const result = await googleSheetsService.addSheet(integration, spreadsheetId, sheetTitle);

    res.json({
      success: true,
      result,
      message: 'Pestaña agregada exitosamente'
    });
  } catch (error: any) {
    console.error('❌ Error agregando pestaña:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al agregar pestaña'
    });
  }
}

/**
 * Elimina una pestaña de una hoja de cálculo
 */
export async function deleteGoogleSheet(req: Request, res: Response) {
  try {
    const { empresaId, spreadsheetId, sheetId } = req.params;

    const integration = await MarketplaceIntegrationModel.findOne({
      empresaId,
      provider: 'google_sheets',
      status: 'active'
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'No hay integración activa de Google Sheets'
      });
    }

    const result = await googleSheetsService.deleteSheet(integration, spreadsheetId, parseInt(sheetId));

    res.json({
      success: true,
      result,
      message: 'Pestaña eliminada exitosamente'
    });
  } catch (error: any) {
    console.error('❌ Error eliminando pestaña:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al eliminar pestaña'
    });
  }
}
