// 📅 Servicio de Google Calendar OAuth y API
import axios from 'axios';
import { encryptCredentials, decryptCredentials } from './encryptionService.js';
import { MarketplaceIntegrationModel, IMarketplaceIntegration } from '../models/MarketplaceIntegration.js';

// URLs de Google OAuth
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';
const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

// Scopes necesarios para Google Calendar
export const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar',           // Gestión completa
  'https://www.googleapis.com/auth/calendar.events',    // Eventos
  'https://www.googleapis.com/auth/userinfo.email',     // Email del usuario
  'https://www.googleapis.com/auth/userinfo.profile'    // Perfil del usuario
];

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

interface GoogleUserInfo {
  email: string;
  name: string;
  picture?: string;
}

/**
 * Genera la URL de autorización de Google OAuth
 */
export function getGoogleAuthUrl(empresaId: string, usuarioEmpresaId: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  
  if (!clientId || !redirectUri) {
    throw new Error('GOOGLE_CLIENT_ID o GOOGLE_REDIRECT_URI no configurados en .env');
  }
  
  // State para mantener contexto (empresaId y usuarioEmpresaId)
  const state = Buffer.from(JSON.stringify({ empresaId, usuarioEmpresaId })).toString('base64');
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GOOGLE_CALENDAR_SCOPES.join(' '),
    access_type: 'offline',  // Para obtener refresh_token
    prompt: 'consent',       // Forzar pantalla de consentimiento para obtener refresh_token
    state: state
  });
  
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/**
 * Intercambia el código de autorización por tokens de acceso
 */
export async function exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Credenciales de Google no configuradas en .env');
  }
  
  try {
    const response = await axios.post<GoogleTokenResponse>(GOOGLE_TOKEN_URL, {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    });
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Error intercambiando código por tokens:', error.response?.data || error.message);
    throw new Error('Error al obtener tokens de Google');
  }
}

/**
 * Obtiene información del usuario de Google
 */
export async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  try {
    const response = await axios.get<GoogleUserInfo>(GOOGLE_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Error obteniendo info del usuario:', error.response?.data || error.message);
    throw new Error('Error al obtener información del usuario de Google');
  }
}

/**
 * Refresca el access token usando el refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokenResponse> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error('Credenciales de Google no configuradas en .env');
  }
  
  try {
    const response = await axios.post<GoogleTokenResponse>(GOOGLE_TOKEN_URL, {
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token'
    });
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Error refrescando token:', error.response?.data || error.message);
    throw new Error('Error al refrescar token de Google');
  }
}

/**
 * Revoca el acceso de Google
 */
export async function revokeGoogleAccess(token: string): Promise<void> {
  try {
    await axios.post('https://oauth2.googleapis.com/revoke', null, {
      params: { token }
    });
  } catch (error: any) {
    console.error('❌ Error revocando acceso:', error.response?.data || error.message);
    // No lanzar error, solo logear
  }
}

/**
 * Guarda o actualiza una integración de Google Calendar
 */
export async function saveGoogleCalendarIntegration(
  empresaId: string,
  usuarioEmpresaId: string,
  tokens: GoogleTokenResponse,
  userInfo: GoogleUserInfo
): Promise<IMarketplaceIntegration> {
  // Calcular fecha de expiración
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
  
  // Encriptar credenciales
  const encryptedCredentials = encryptCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token || '',
    token_type: tokens.token_type,
    expires_at: expiresAt,
    scope: tokens.scope
  });
  
  // Configuración por defecto
  const defaultConfig = {
    google_calendar: {
      auto_sync: true,
      sync_interval: 30,      // 30 minutos
      sync_past_days: 7,      // 7 días hacia atrás
      sync_future_days: 30    // 30 días hacia adelante
    }
  };
  
  // Buscar si ya existe una integración para esta empresa
  const existingIntegration = await MarketplaceIntegrationModel.findOne({
    empresaId,
    provider: 'google_calendar'
  });
  
  if (existingIntegration) {
    // Actualizar integración existente
    existingIntegration.credentials = encryptedCredentials;
    existingIntegration.status = 'active';
    existingIntegration.connected_account = userInfo.email;
    existingIntegration.granted_scopes = tokens.scope.split(' ');
    existingIntegration.error_message = undefined;
    existingIntegration.last_error = undefined;
    existingIntegration.sync_errors = 0;
    existingIntegration.next_sync = (existingIntegration as any).calculateNextSync();
    
    await existingIntegration.save();
    return existingIntegration;
  }
  
  // Crear nueva integración
  const integration = new MarketplaceIntegrationModel({
    empresaId,
    usuarioEmpresaId,
    provider: 'google_calendar',
    provider_name: 'Google Calendar',
    credentials: encryptedCredentials,
    status: 'active',
    granted_scopes: tokens.scope.split(' '),
    connected_account: userInfo.email,
    config: defaultConfig,
    createdBy: usuarioEmpresaId
  });
  
  integration.next_sync = (integration as any).calculateNextSync();
  await integration.save();
  
  return integration;
}

/**
 * Obtiene un access token válido (refresca si es necesario)
 */
export async function getValidAccessToken(integration: IMarketplaceIntegration): Promise<string> {
  // Si el token no está próximo a expirar, retornarlo
  if (!(integration as any).isTokenExpiringSoon()) {
    const credentials = decryptCredentials(integration.credentials);
    return credentials.access_token;
  }
  
  // Refrescar el token
  console.log(`🔄 Refrescando token para ${integration.connected_account}...`);
  
  const credentials = decryptCredentials(integration.credentials);
  const newTokens = await refreshAccessToken(credentials.refresh_token);
  
  // Actualizar credenciales
  const expiresAt = new Date(Date.now() + newTokens.expires_in * 1000);
  const encryptedCredentials = encryptCredentials({
    access_token: newTokens.access_token,
    refresh_token: newTokens.refresh_token || credentials.refresh_token, // Mantener el anterior si no viene uno nuevo
    token_type: newTokens.token_type,
    expires_at: expiresAt,
    scope: newTokens.scope
  });
  
  integration.credentials = encryptedCredentials;
  integration.status = 'active';
  await integration.save();
  
  return newTokens.access_token;
}

/**
 * Lista los calendarios del usuario
 */
export async function listCalendars(integration: IMarketplaceIntegration) {
  const accessToken = await getValidAccessToken(integration);
  
  try {
    const response = await axios.get(`${GOOGLE_CALENDAR_API}/users/me/calendarList`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    
    return response.data.items || [];
  } catch (error: any) {
    console.error('❌ Error listando calendarios:', error.response?.data || error.message);
    throw new Error('Error al listar calendarios de Google');
  }
}

/**
 * Obtiene eventos de un calendario
 */
export async function getCalendarEvents(
  integration: IMarketplaceIntegration,
  calendarId: string = 'primary',
  timeMin?: Date,
  timeMax?: Date
) {
  const accessToken = await getValidAccessToken(integration);
  
  const params: any = {
    singleEvents: true,
    orderBy: 'startTime'
  };
  
  if (timeMin) params.timeMin = timeMin.toISOString();
  if (timeMax) params.timeMax = timeMax.toISOString();
  
  try {
    const response = await axios.get(`${GOOGLE_CALENDAR_API}/calendars/${calendarId}/events`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      params
    });
    
    return response.data.items || [];
  } catch (error: any) {
    console.error('❌ Error obteniendo eventos:', error.response?.data || error.message);
    throw new Error('Error al obtener eventos de Google Calendar');
  }
}

/**
 * Crea un evento en el calendario
 */
export async function createCalendarEvent(
  integration: IMarketplaceIntegration,
  calendarId: string = 'primary',
  event: any
) {
  const accessToken = await getValidAccessToken(integration);
  
  try {
    const response = await axios.post(
      `${GOOGLE_CALENDAR_API}/calendars/${calendarId}/events`,
      event,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Error creando evento:', error.response?.data || error.message);
    throw new Error('Error al crear evento en Google Calendar');
  }
}

/**
 * Actualiza un evento en el calendario
 */
export async function updateCalendarEvent(
  integration: IMarketplaceIntegration,
  calendarId: string,
  eventId: string,
  event: any
) {
  const accessToken = await getValidAccessToken(integration);
  
  try {
    const response = await axios.put(
      `${GOOGLE_CALENDAR_API}/calendars/${calendarId}/events/${eventId}`,
      event,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Error actualizando evento:', error.response?.data || error.message);
    throw new Error('Error al actualizar evento en Google Calendar');
  }
}

/**
 * Elimina un evento del calendario
 */
export async function deleteCalendarEvent(
  integration: IMarketplaceIntegration,
  calendarId: string,
  eventId: string
) {
  const accessToken = await getValidAccessToken(integration);
  
  try {
    await axios.delete(`${GOOGLE_CALENDAR_API}/calendars/${calendarId}/events/${eventId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error eliminando evento:', error.response?.data || error.message);
    throw new Error('Error al eliminar evento de Google Calendar');
  }
}
