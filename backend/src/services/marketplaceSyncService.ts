// 🔄 Servicio de Sincronización Automática de Marketplace
import { MarketplaceIntegrationModel } from '../models/MarketplaceIntegration.js';
import * as googleCalendarService from './googleCalendarService.js';
import { decryptCredentials } from './encryptionService.js';

/**
 * Refresca tokens que están próximos a expirar
 * Se ejecuta cada 5 minutos
 */
export async function refreshExpiringTokens() {
  try {
    // Buscar integraciones con tokens que expiran en los próximos 10 minutos
    const tenMinutesFromNow = new Date(Date.now() + 10 * 60 * 1000);
    
    const expiringIntegrations = await MarketplaceIntegrationModel.find({
      status: 'active',
      'credentials.expires_at': { $lte: tenMinutesFromNow }
    });

    if (expiringIntegrations.length === 0) {
      console.log('✅ No hay tokens próximos a expirar');
      return;
    }

    console.log(`🔄 Refrescando ${expiringIntegrations.length} tokens próximos a expirar...`);

    for (const integration of expiringIntegrations) {
      try {
        if (integration.provider === 'google_calendar') {
          // El servicio de Google Calendar ya maneja el refresh automáticamente
          await googleCalendarService.getValidAccessToken(integration);
          console.log(`✅ Token refrescado para ${integration.connected_account}`);
        }
      } catch (error: any) {
        console.error(`❌ Error refrescando token para ${integration.connected_account}:`, error.message);
        
        // Marcar como error
        integration.status = 'error';
        integration.error_message = `Error refrescando token: ${error.message}`;
        integration.last_error = new Date();
        integration.sync_errors += 1;
        await integration.save();
      }
    }
  } catch (error) {
    console.error('❌ Error en refreshExpiringTokens:', error);
  }
}

/**
 * Sincroniza calendarios que tienen sincronización automática habilitada
 * Se ejecuta según el intervalo configurado para cada integración
 */
export async function syncCalendars() {
  try {
    const now = new Date();
    
    // Buscar integraciones que necesitan sincronización
    const integrationsToSync = await MarketplaceIntegrationModel.find({
      status: 'active',
      provider: 'google_calendar',
      'config.google_calendar.auto_sync': true,
      $or: [
        { next_sync: { $lte: now } },
        { next_sync: null }
      ]
    });

    if (integrationsToSync.length === 0) {
      console.log('✅ No hay calendarios para sincronizar');
      return;
    }

    console.log(`📅 Sincronizando ${integrationsToSync.length} calendarios...`);

    for (const integration of integrationsToSync) {
      try {
        const config = integration.config.google_calendar || {};
        
        // Calcular rango de fechas
        const pastDays = config.sync_past_days || 7;
        const futureDays = config.sync_future_days || 30;
        
        const timeMin = new Date();
        timeMin.setDate(timeMin.getDate() - pastDays);
        
        const timeMax = new Date();
        timeMax.setDate(timeMax.getDate() + futureDays);

        // Obtener eventos (esto también actualiza last_sync)
        const calendarId = config.default_calendar_id || 'primary';
        await googleCalendarService.getCalendarEvents(
          integration,
          calendarId,
          timeMin,
          timeMax
        );

        // Actualizar métricas
        integration.last_sync = new Date();
        integration.sync_count += 1;
        integration.next_sync = (integration as any).calculateNextSync();
        integration.error_message = undefined;
        
        await integration.save();
        
        console.log(`✅ Calendario sincronizado: ${integration.connected_account}`);
      } catch (error: any) {
        console.error(`❌ Error sincronizando ${integration.connected_account}:`, error.message);
        
        // Registrar error
        integration.error_message = `Error en sincronización: ${error.message}`;
        integration.last_error = new Date();
        integration.sync_errors += 1;
        
        // Si hay muchos errores consecutivos, marcar como error
        if (integration.sync_errors >= 5) {
          integration.status = 'error';
        } else {
          // Reintentar en el próximo ciclo
          integration.next_sync = (integration as any).calculateNextSync();
        }
        
        await integration.save();
      }
    }
  } catch (error) {
    console.error('❌ Error en syncCalendars:', error);
  }
}

/**
 * Limpia integraciones revocadas antiguas (más de 30 días)
 */
export async function cleanupRevokedIntegrations() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await MarketplaceIntegrationModel.deleteMany({
      status: 'revoked',
      updatedAt: { $lte: thirtyDaysAgo }
    });

    if (result.deletedCount > 0) {
      console.log(`🗑️  Eliminadas ${result.deletedCount} integraciones revocadas antiguas`);
    }
  } catch (error) {
    console.error('❌ Error en cleanupRevokedIntegrations:', error);
  }
}

/**
 * Inicia los jobs de sincronización automática
 */
export function startMarketplaceSyncJobs() {
  console.log('🚀 Iniciando jobs de sincronización de Marketplace...');

  // Refresh de tokens cada 5 minutos
  setInterval(refreshExpiringTokens, 5 * 60 * 1000);
  console.log('✅ Job de refresh de tokens iniciado (cada 5 minutos)');

  // Sincronización de calendarios cada 15 minutos
  setInterval(syncCalendars, 15 * 60 * 1000);
  console.log('✅ Job de sincronización de calendarios iniciado (cada 15 minutos)');

  // Limpieza de integraciones revocadas cada 24 horas
  setInterval(cleanupRevokedIntegrations, 24 * 60 * 60 * 1000);
  console.log('✅ Job de limpieza iniciado (cada 24 horas)');

  // Ejecutar inmediatamente al iniciar
  setTimeout(refreshExpiringTokens, 10000); // 10 segundos después de iniciar
  setTimeout(syncCalendars, 20000); // 20 segundos después de iniciar
}
