// 🛒 Controlador de Marketplace - Gestión de Integraciones
import { Request, Response } from 'express';
import { MarketplaceIntegrationModel } from '../models/MarketplaceIntegration.js';
import * as googleCalendarService from '../services/googleCalendarService.js';

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
