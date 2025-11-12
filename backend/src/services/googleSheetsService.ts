// 📊 Servicio de Google Sheets OAuth y API
import axios from 'axios';
import { encryptCredentials, decryptCredentials } from './encryptionService.js';
import { MarketplaceIntegrationModel, IMarketplaceIntegration } from '../models/MarketplaceIntegration.js';

// URLs de Google OAuth (reutilizamos las mismas que Calendar)
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';
const GOOGLE_SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';

export const GOOGLE_SHEETS_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets', // Lectura y escritura
  'https://www.googleapis.com/auth/drive.file',   // Acceso a archivos creados por la app
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

// Interfaces
export interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  picture?: string;
}

/**
 * Genera la URL de autorización de Google Sheets
 */
export function getGoogleSheetsAuthUrl(empresaId: string, usuarioEmpresaId: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_SHEETS_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI?.replace('calendar', 'sheets');
  
  if (!clientId || !redirectUri) {
    throw new Error('GOOGLE_CLIENT_ID o GOOGLE_SHEETS_REDIRECT_URI no configurados en .env');
  }
  
  // State para mantener contexto
  const state = Buffer.from(JSON.stringify({ empresaId, usuarioEmpresaId })).toString('base64');
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GOOGLE_SHEETS_SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state: state
  });
  
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/**
 * Intercambia el código de autorización por tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_SHEETS_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI?.replace('calendar', 'sheets');
  
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
 * Obtiene información del usuario de Google
 */
export async function getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  try {
    const response = await axios.get<GoogleUserInfo>(GOOGLE_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Error obteniendo info del usuario:', error.response?.data || error.message);
    throw new Error('Error al obtener información del usuario');
  }
}

/**
 * Guarda o actualiza la integración de Google Sheets
 */
export async function saveGoogleSheetsIntegration(
  empresaId: string,
  usuarioEmpresaId: string,
  tokens: GoogleTokenResponse,
  userInfo: GoogleUserInfo
): Promise<IMarketplaceIntegration> {
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
  
  const encryptedCredentials = encryptCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token || '',
    token_type: tokens.token_type,
    expires_at: expiresAt,
    scope: tokens.scope
  });
  
  const defaultConfig = {
    google_sheets: {
      auto_sync: false,
      sync_interval: 60,
      read_only: false
    }
  };
  
  // Buscar si ya existe una integración
  const existingIntegration = await MarketplaceIntegrationModel.findOne({
    empresaId,
    provider: 'google_sheets'
  });
  
  if (existingIntegration) {
    existingIntegration.credentials = encryptedCredentials;
    existingIntegration.status = 'active';
    existingIntegration.connected_account = userInfo.email;
    existingIntegration.granted_scopes = tokens.scope.split(' ');
    existingIntegration.error_message = undefined;
    existingIntegration.last_error = undefined;
    existingIntegration.sync_errors = 0;
    
    await existingIntegration.save();
    return existingIntegration;
  }
  
  const integration = new MarketplaceIntegrationModel({
    empresaId,
    usuarioEmpresaId,
    provider: 'google_sheets',
    provider_name: 'Google Sheets',
    credentials: encryptedCredentials,
    status: 'active',
    granted_scopes: tokens.scope.split(' '),
    connected_account: userInfo.email,
    config: defaultConfig,
    createdBy: usuarioEmpresaId
  });
  
  await integration.save();
  return integration;
}

/**
 * Obtiene un access token válido (refresca si es necesario)
 */
export async function getValidAccessToken(integration: IMarketplaceIntegration): Promise<string> {
  if (!(integration as any).isTokenExpiringSoon()) {
    const credentials = decryptCredentials(integration.credentials);
    return credentials.access_token;
  }
  
  console.log(`🔄 Refrescando token para ${integration.connected_account}...`);
  
  const credentials = decryptCredentials(integration.credentials);
  const newTokens = await refreshAccessToken(credentials.refresh_token);
  
  const expiresAt = new Date(Date.now() + newTokens.expires_in * 1000);
  const encryptedCredentials = encryptCredentials({
    access_token: newTokens.access_token,
    refresh_token: newTokens.refresh_token || credentials.refresh_token,
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
 * Revoca el acceso a Google Sheets
 */
export async function revokeAccess(integration: IMarketplaceIntegration): Promise<void> {
  try {
    const credentials = decryptCredentials(integration.credentials);
    
    await axios.post('https://oauth2.googleapis.com/revoke', null, {
      params: {
        token: credentials.access_token
      }
    });
    
    console.log(`✅ Acceso revocado para ${integration.connected_account}`);
  } catch (error: any) {
    console.error('❌ Error revocando acceso:', error.response?.data || error.message);
    throw new Error('Error al revocar acceso');
  }
}

// ==================== OPERACIONES CON SPREADSHEETS ====================

/**
 * Lista las hojas de cálculo del usuario
 */
export async function listSpreadsheets(integration: IMarketplaceIntegration): Promise<any[]> {
  const accessToken = await getValidAccessToken(integration);
  
  try {
    // Usar Google Drive API para listar spreadsheets
    const response = await axios.get('https://www.googleapis.com/drive/v3/files', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      params: {
        q: "mimeType='application/vnd.google-apps.spreadsheet'",
        fields: 'files(id, name, createdTime, modifiedTime, owners)',
        pageSize: 100
      }
    });
    
    return response.data.files || [];
  } catch (error: any) {
    console.error('❌ Error listando spreadsheets:', error.response?.data || error.message);
    throw new Error('Error al listar hojas de cálculo');
  }
}

/**
 * Obtiene información de una hoja de cálculo
 */
export async function getSpreadsheet(integration: IMarketplaceIntegration, spreadsheetId: string): Promise<any> {
  const accessToken = await getValidAccessToken(integration);
  
  try {
    const response = await axios.get(`${GOOGLE_SHEETS_API}/${spreadsheetId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      params: {
        includeGridData: false
      }
    });
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Error obteniendo spreadsheet:', error.response?.data || error.message);
    throw new Error('Error al obtener hoja de cálculo');
  }
}

/**
 * Crea una nueva hoja de cálculo
 */
export async function createSpreadsheet(
  integration: IMarketplaceIntegration,
  title: string,
  sheets?: Array<{ title: string }>
): Promise<any> {
  const accessToken = await getValidAccessToken(integration);
  
  try {
    const response = await axios.post(
      GOOGLE_SHEETS_API,
      {
        properties: {
          title
        },
        sheets: sheets || [{ properties: { title: 'Hoja 1' } }]
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Error creando spreadsheet:', error.response?.data || error.message);
    throw new Error('Error al crear hoja de cálculo');
  }
}

/**
 * Lee valores de un rango
 */
export async function getValues(
  integration: IMarketplaceIntegration,
  spreadsheetId: string,
  range: string
): Promise<any[][]> {
  const accessToken = await getValidAccessToken(integration);
  
  try {
    const response = await axios.get(
      `${GOOGLE_SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(range)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );
    
    return response.data.values || [];
  } catch (error: any) {
    console.error('❌ Error leyendo valores:', error.response?.data || error.message);
    throw new Error('Error al leer valores de la hoja');
  }
}

/**
 * Actualiza valores en un rango
 */
export async function updateValues(
  integration: IMarketplaceIntegration,
  spreadsheetId: string,
  range: string,
  values: any[][]
): Promise<any> {
  const accessToken = await getValidAccessToken(integration);
  
  try {
    const response = await axios.put(
      `${GOOGLE_SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(range)}`,
      {
        values
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          valueInputOption: 'USER_ENTERED'
        }
      }
    );
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Error actualizando valores:', error.response?.data || error.message);
    throw new Error('Error al actualizar valores de la hoja');
  }
}

/**
 * Agrega valores al final de una hoja
 */
export async function appendValues(
  integration: IMarketplaceIntegration,
  spreadsheetId: string,
  range: string,
  values: any[][]
): Promise<any> {
  const accessToken = await getValidAccessToken(integration);
  
  try {
    const response = await axios.post(
      `${GOOGLE_SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(range)}:append`,
      {
        values
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          valueInputOption: 'USER_ENTERED',
          insertDataOption: 'INSERT_ROWS'
        }
      }
    );
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Error agregando valores:', error.response?.data || error.message);
    throw new Error('Error al agregar valores a la hoja');
  }
}

/**
 * Limpia valores de un rango
 */
export async function clearValues(
  integration: IMarketplaceIntegration,
  spreadsheetId: string,
  range: string
): Promise<any> {
  const accessToken = await getValidAccessToken(integration);
  
  try {
    const response = await axios.post(
      `${GOOGLE_SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Error limpiando valores:', error.response?.data || error.message);
    throw new Error('Error al limpiar valores de la hoja');
  }
}

/**
 * Crea una nueva pestaña en una hoja de cálculo
 */
export async function addSheet(
  integration: IMarketplaceIntegration,
  spreadsheetId: string,
  sheetTitle: string
): Promise<any> {
  const accessToken = await getValidAccessToken(integration);
  
  try {
    const response = await axios.post(
      `${GOOGLE_SHEETS_API}/${spreadsheetId}:batchUpdate`,
      {
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetTitle
              }
            }
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Error agregando hoja:', error.response?.data || error.message);
    throw new Error('Error al agregar pestaña a la hoja de cálculo');
  }
}

/**
 * Elimina una pestaña de una hoja de cálculo
 */
export async function deleteSheet(
  integration: IMarketplaceIntegration,
  spreadsheetId: string,
  sheetId: number
): Promise<any> {
  const accessToken = await getValidAccessToken(integration);
  
  try {
    const response = await axios.post(
      `${GOOGLE_SHEETS_API}/${spreadsheetId}:batchUpdate`,
      {
        requests: [
          {
            deleteSheet: {
              sheetId
            }
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Error eliminando hoja:', error.response?.data || error.message);
    throw new Error('Error al eliminar pestaña de la hoja de cálculo');
  }
}
