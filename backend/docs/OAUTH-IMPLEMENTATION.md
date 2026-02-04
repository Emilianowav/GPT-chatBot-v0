# Implementación OAuth 2.0 - Guía Completa

## 📋 Descripción General

Esta guía documenta la implementación completa del sistema OAuth 2.0 para integrar servicios de terceros (Google Sheets, Google Calendar, etc.) en los flujos conversacionales.

**Arquitectura:**
- **Frontend:** Botón de autorización en nodos
- **Backend:** Controladores OAuth, servicios de API, encriptación de tokens
- **Base de datos:** Almacenamiento seguro de tokens y configuración
- **Refresh automático:** Renovación de tokens expirados

---

## 🗄️ Base de Datos - Schema Completo

### Modelo: OAuthConfiguration

```typescript
// models/OAuthConfiguration.ts
import mongoose, { Schema, Document } from 'mongoose';
import { encrypt, decrypt } from '../utils/encryption.js';

export interface IOAuthConfiguration extends Document {
  // Identificación
  empresaId: string;           // ID de la empresa propietaria
  provider: 'google' | 'microsoft' | 'facebook' | 'twitter';
  service: 'sheets' | 'calendar' | 'drive' | 'outlook' | 'onedrive';
  
  // Tokens OAuth (encriptados)
  accessToken: string;         // Token de acceso
  refreshToken: string;        // Token de refresh
  tokenExpiry: Date;           // Fecha de expiración del access token
  
  // Información del usuario autorizado
  userEmail: string;           // Email de la cuenta autorizada
  userName?: string;           // Nombre del usuario
  userPhoto?: string;          // URL de foto de perfil
  
  // Scopes y permisos
  scopes: string[];            // Permisos otorgados
  
  // Estado y metadata
  isActive: boolean;           // Si la autorización está activa
  lastUsed: Date;              // Última vez que se usó
  lastRefreshed?: Date;        // Última vez que se refrescó el token
  errorCount: number;          // Contador de errores consecutivos
  lastError?: string;          // Último error registrado
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const OAuthConfigurationSchema = new Schema<IOAuthConfiguration>({
  empresaId: { 
    type: String, 
    required: true, 
    index: true 
  },
  provider: { 
    type: String, 
    required: true, 
    enum: ['google', 'microsoft', 'facebook', 'twitter'] 
  },
  service: { 
    type: String, 
    required: true, 
    enum: ['sheets', 'calendar', 'drive', 'outlook', 'onedrive'] 
  },
  
  // Tokens (se encriptan en middleware pre-save)
  accessToken: { 
    type: String, 
    required: true,
    select: false  // No incluir por defecto en queries
  },
  refreshToken: { 
    type: String, 
    required: true,
    select: false  // No incluir por defecto en queries
  },
  tokenExpiry: { 
    type: Date, 
    required: true 
  },
  
  // Info del usuario
  userEmail: { 
    type: String, 
    required: true 
  },
  userName: { 
    type: String 
  },
  userPhoto: { 
    type: String 
  },
  
  // Scopes
  scopes: [{ 
    type: String 
  }],
  
  // Estado
  isActive: { 
    type: Boolean, 
    default: true,
    index: true
  },
  lastUsed: { 
    type: Date, 
    default: Date.now 
  },
  lastRefreshed: { 
    type: Date 
  },
  errorCount: { 
    type: Number, 
    default: 0 
  },
  lastError: { 
    type: String 
  }
}, { 
  timestamps: true 
});

// Índices compuestos para búsqueda rápida
OAuthConfigurationSchema.index({ empresaId: 1, provider: 1, service: 1 }, { unique: true });
OAuthConfigurationSchema.index({ isActive: 1, tokenExpiry: 1 });

// Middleware para encriptar tokens antes de guardar
OAuthConfigurationSchema.pre('save', async function(next) {
  if (this.isModified('accessToken')) {
    this.accessToken = await encrypt(this.accessToken);
  }
  if (this.isModified('refreshToken')) {
    this.refreshToken = await encrypt(this.refreshToken);
  }
  next();
});

// Método para obtener tokens desencriptados
OAuthConfigurationSchema.methods.getDecryptedTokens = async function() {
  // Necesitamos hacer select explícito para obtener los tokens
  const doc = await OAuthConfigurationModel.findById(this._id).select('+accessToken +refreshToken');
  
  if (!doc) throw new Error('Configuración no encontrada');
  
  return {
    accessToken: await decrypt(doc.accessToken),
    refreshToken: await decrypt(doc.refreshToken)
  };
};

// Método para incrementar contador de errores
OAuthConfigurationSchema.methods.recordError = async function(error: string) {
  this.errorCount += 1;
  this.lastError = error;
  
  // Desactivar si hay muchos errores consecutivos
  if (this.errorCount >= 5) {
    this.isActive = false;
    console.warn(`⚠️ OAuth config ${this._id} desactivada por exceso de errores`);
  }
  
  await this.save();
};

// Método para resetear contador de errores
OAuthConfigurationSchema.methods.resetErrors = async function() {
  this.errorCount = 0;
  this.lastError = undefined;
  await this.save();
};

export const OAuthConfigurationModel = mongoose.model<IOAuthConfiguration>(
  'OAuthConfiguration', 
  OAuthConfigurationSchema
);
```

### Actualización: VisualFlow

Agregar soporte OAuth en los nodos:

```typescript
// models/VisualFlow.ts - Actualización en NodeData
interface NodeData {
  // ... campos existentes (label, type, module, etc.)
  
  // OAuth configuration
  requiresOAuth?: boolean;     // Si el nodo requiere OAuth
  oauthProvider?: 'google' | 'microsoft';
  oauthService?: 'sheets' | 'calendar' | 'drive';
  oauthConfigId?: string;      // ID de la configuración OAuth (se asigna después de autorizar)
  oauthStatus?: 'not_configured' | 'authorizing' | 'authorized' | 'error';
  oauthError?: string;         // Mensaje de error si hay
}
```

---

## 🔐 Seguridad - Encriptación de Tokens

### Implementación de Encriptación

```typescript
// utils/encryption.ts
import crypto from 'crypto';

// Clave de encriptación (debe ser de 32 bytes)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY 
  ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex')
  : crypto.randomBytes(32);

const IV_LENGTH = 16; // Para AES, el IV es de 16 bytes
const ALGORITHM = 'aes-256-cbc';

/**
 * Encripta un texto usando AES-256-CBC
 */
export async function encrypt(text: string): Promise<string> {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Retornar IV + texto encriptado (separados por :)
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('❌ Error encriptando:', error);
    throw new Error('Error en encriptación');
  }
}

/**
 * Desencripta un texto encriptado con AES-256-CBC
 */
export async function decrypt(text: string): Promise<string> {
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = textParts.join(':');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('❌ Error desencriptando:', error);
    throw new Error('Error en desencriptación');
  }
}

/**
 * Genera una clave de encriptación aleatoria
 * Ejecutar una vez y guardar en .env
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Script para generar clave (ejecutar una vez)
if (require.main === module) {
  console.log('🔑 Clave de encriptación generada:');
  console.log(generateEncryptionKey());
  console.log('\n⚠️  Guardar en .env como ENCRYPTION_KEY=...');
}
```

### Variables de Entorno

```bash
# .env - Configuración OAuth

# Google OAuth
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
GOOGLE_REDIRECT_URI=https://tu-dominio.com/api/oauth/google/callback

# Microsoft OAuth (opcional)
MICROSOFT_CLIENT_ID=tu-microsoft-client-id
MICROSOFT_CLIENT_SECRET=tu-microsoft-client-secret
MICROSOFT_REDIRECT_URI=https://tu-dominio.com/api/oauth/microsoft/callback

# Encriptación (generar con: node dist/utils/encryption.js)
ENCRYPTION_KEY=tu-clave-de-64-caracteres-hex

# Frontend
FRONTEND_URL=https://tu-frontend.com

# Configuración de sesión
SESSION_SECRET=tu-session-secret-aleatorio
```

### Generar Clave de Encriptación

```bash
# Ejecutar una vez para generar la clave
cd backend
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Copiar el resultado a .env como ENCRYPTION_KEY
```

---

## 🔧 Backend - Controladores OAuth

### Controlador Principal

```typescript
// controllers/oauthController.ts
import { Request, Response } from 'express';
import { google } from 'googleapis';
import { OAuthConfigurationModel } from '../models/OAuthConfiguration.js';

// Configuración de clientes OAuth
const googleOAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Mapeo de scopes por servicio
const SCOPES_MAP = {
  google: {
    sheets: ['https://www.googleapis.com/auth/spreadsheets'],
    calendar: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ],
    drive: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.metadata.readonly'
    ]
  },
  microsoft: {
    outlook: ['https://graph.microsoft.com/Calendars.ReadWrite'],
    onedrive: ['https://graph.microsoft.com/Files.ReadWrite']
  }
};

/**
 * POST /api/oauth/google/initiate
 * Iniciar flujo OAuth para Google
 */
export const initiateGoogleOAuth = async (req: Request, res: Response) => {
  try {
    const { empresaId, service } = req.body;
    
    if (!empresaId || !service) {
      return res.status(400).json({ 
        success: false, 
        error: 'empresaId y service son requeridos' 
      });
    }
    
    // Obtener scopes según el servicio
    const scopes = SCOPES_MAP.google[service as keyof typeof SCOPES_MAP.google];
    
    if (!scopes) {
      return res.status(400).json({ 
        success: false, 
        error: `Servicio no soportado: ${service}` 
      });
    }
    
    // Generar URL de autorización
    const authUrl = googleOAuth2Client.generateAuthUrl({
      access_type: 'offline',      // Para obtener refresh token
      scope: scopes,
      state: JSON.stringify({ empresaId, service }), // Metadata
      prompt: 'consent'            // Forzar consent screen
    });
    
    console.log(`🔐 [OAUTH] URL de autorización generada para ${empresaId} - ${service}`);
    
    res.json({ 
      success: true, 
      authUrl 
    });
  } catch (error) {
    console.error('❌ [OAUTH] Error iniciando OAuth:', error);
    res.status(500).json({ 
      success: false, 
      error: String(error) 
    });
  }
};

/**
 * GET /api/oauth/google/callback
 * Callback después de autorización de Google
 */
export const handleGoogleOAuthCallback = async (req: Request, res: Response) => {
  try {
    const { code, state, error } = req.query;
    
    // Verificar si hubo error en la autorización
    if (error) {
      console.error('❌ [OAUTH] Error en autorización:', error);
      return res.redirect(`${process.env.FRONTEND_URL}/flows?oauth=error&message=${error}`);
    }
    
    if (!code || !state) {
      return res.redirect(`${process.env.FRONTEND_URL}/flows?oauth=error&message=missing_params`);
    }
    
    // Parsear metadata del state
    const { empresaId, service } = JSON.parse(state as string);
    
    console.log(`🔐 [OAUTH] Procesando callback para ${empresaId} - ${service}`);
    
    // Intercambiar código por tokens
    const { tokens } = await googleOAuth2Client.getToken(code as string);
    
    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('No se recibieron tokens completos de Google');
    }
    
    // Obtener información del usuario
    googleOAuth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: googleOAuth2Client });
    const userInfo = await oauth2.userinfo.get();
    
    console.log(`✅ [OAUTH] Usuario autorizado: ${userInfo.data.email}`);
    
    // Guardar/actualizar en base de datos
    const oauthConfig = await OAuthConfigurationModel.findOneAndUpdate(
      { 
        empresaId, 
        provider: 'google', 
        service 
      },
      {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry: new Date(tokens.expiry_date || Date.now() + 3600000),
        userEmail: userInfo.data.email || '',
        userName: userInfo.data.name || '',
        userPhoto: userInfo.data.picture || '',
        scopes: tokens.scope?.split(' ') || [],
        isActive: true,
        lastUsed: new Date(),
        errorCount: 0,
        lastError: undefined
      },
      { 
        upsert: true, 
        new: true 
      }
    );
    
    console.log(`✅ [OAUTH] Configuración guardada: ${oauthConfig._id}`);
    
    // Redirigir al frontend con éxito
    res.redirect(
      `${process.env.FRONTEND_URL}/flows?oauth=success&configId=${oauthConfig._id}&service=${service}`
    );
  } catch (error) {
    console.error('❌ [OAUTH] Error en callback:', error);
    res.redirect(
      `${process.env.FRONTEND_URL}/flows?oauth=error&message=${encodeURIComponent(String(error))}`
    );
  }
};

/**
 * GET /api/oauth/status
 * Verificar estado de autorización OAuth
 */
export const checkOAuthStatus = async (req: Request, res: Response) => {
  try {
    const { empresaId, service, provider = 'google' } = req.query;
    
    if (!empresaId || !service) {
      return res.status(400).json({ 
        success: false, 
        error: 'empresaId y service son requeridos' 
      });
    }
    
    const config = await OAuthConfigurationModel.findOne({
      empresaId,
      provider,
      service,
      isActive: true
    });
    
    if (!config) {
      return res.json({ 
        authorized: false,
        status: 'not_configured'
      });
    }
    
    // Verificar si el token está próximo a expirar
    const now = new Date();
    const expiresIn = config.tokenExpiry.getTime() - now.getTime();
    const willExpireSoon = expiresIn < 5 * 60 * 1000; // Menos de 5 minutos
    
    res.json({
      authorized: true,
      status: 'authorized',
      configId: config._id,
      userEmail: config.userEmail,
      userName: config.userName,
      userPhoto: config.userPhoto,
      lastUsed: config.lastUsed,
      tokenExpiry: config.tokenExpiry,
      willExpireSoon,
      errorCount: config.errorCount
    });
  } catch (error) {
    console.error('❌ [OAUTH] Error verificando estado:', error);
    res.status(500).json({ 
      success: false, 
      error: String(error) 
    });
  }
};

/**
 * DELETE /api/oauth/:configId
 * Desconectar/revocar autorización OAuth
 */
export const disconnectOAuth = async (req: Request, res: Response) => {
  try {
    const { configId } = req.params;
    
    const config = await OAuthConfigurationModel.findById(configId);
    
    if (!config) {
      return res.status(404).json({ 
        success: false, 
        error: 'Configuración no encontrada' 
      });
    }
    
    // Revocar token en Google (opcional pero recomendado)
    try {
      const tokens = await config.getDecryptedTokens();
      await googleOAuth2Client.revokeToken(tokens.accessToken);
      console.log(`🔓 [OAUTH] Token revocado en Google`);
    } catch (error) {
      console.warn('⚠️ [OAUTH] No se pudo revocar token en Google:', error);
    }
    
    // Desactivar en BD
    config.isActive = false;
    await config.save();
    
    console.log(`✅ [OAUTH] Configuración ${configId} desconectada`);
    
    res.json({ 
      success: true,
      message: 'OAuth desconectado correctamente'
    });
  } catch (error) {
    console.error('❌ [OAUTH] Error desconectando:', error);
    res.status(500).json({ 
      success: false, 
      error: String(error) 
    });
  }
};

/**
 * POST /api/oauth/refresh
 * Refrescar token manualmente (para testing)
 */
export const refreshOAuthToken = async (req: Request, res: Response) => {
  try {
    const { configId } = req.body;
    
    const config = await OAuthConfigurationModel.findById(configId).select('+refreshToken');
    
    if (!config) {
      return res.status(404).json({ 
        success: false, 
        error: 'Configuración no encontrada' 
      });
    }
    
    const tokens = await config.getDecryptedTokens();
    
    googleOAuth2Client.setCredentials({
      refresh_token: tokens.refreshToken
    });
    
    const { credentials } = await googleOAuth2Client.refreshAccessToken();
    
    // Actualizar en BD
    config.accessToken = credentials.access_token!;
    config.tokenExpiry = new Date(credentials.expiry_date || Date.now() + 3600000);
    config.lastRefreshed = new Date();
    await config.save();
    
    console.log(`🔄 [OAUTH] Token refrescado: ${configId}`);
    
    res.json({ 
      success: true,
      tokenExpiry: config.tokenExpiry
    });
  } catch (error) {
    console.error('❌ [OAUTH] Error refrescando token:', error);
    res.status(500).json({ 
      success: false, 
      error: String(error) 
    });
  }
};
```

### Rutas OAuth

```typescript
// routes/oauth.routes.ts
import express from 'express';
import { 
  initiateGoogleOAuth, 
  handleGoogleOAuthCallback,
  checkOAuthStatus,
  disconnectOAuth,
  refreshOAuthToken
} from '../controllers/oauthController.js';

const router = express.Router();

// Google OAuth
router.post('/oauth/google/initiate', initiateGoogleOAuth);
router.get('/oauth/google/callback', handleGoogleOAuthCallback);

// Estado y gestión
router.get('/oauth/status', checkOAuthStatus);
router.delete('/oauth/:configId', disconnectOAuth);
router.post('/oauth/refresh', refreshOAuthToken);

export default router;
```

### Integrar en app.ts

```typescript
// app.ts
import oauthRoutes from './routes/oauth.routes.js';

// ... otras rutas

app.use('/api', oauthRoutes);
```

---

## 🎨 Frontend - Componentes React

### Componente: OAuthButton

```tsx
// components/OAuthButton.tsx
import React, { useState } from 'react';
import axios from 'axios';

interface OAuthButtonProps {
  empresaId: string;
  provider: 'google' | 'microsoft';
  service: 'sheets' | 'calendar' | 'drive' | 'outlook';
  onSuccess: (configId: string) => void;
  onError: (error: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const OAuthButton: React.FC<OAuthButtonProps> = ({
  empresaId,
  provider,
  service,
  onSuccess,
  onError,
  children,
  className = ''
}) => {
  const [loading, setLoading] = useState(false);
  
  const handleConnect = async () => {
    try {
      setLoading(true);
      
      // Solicitar URL de autorización
      const response = await axios.post(`/api/oauth/${provider}/initiate`, {
        empresaId,
        service
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error);
      }
      
      // Abrir ventana de autorización
      const authWindow = window.open(
        response.data.authUrl,
        'OAuth Authorization',
        'width=600,height=700,left=200,top=100'
      );
      
      // Escuchar mensaje del callback
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'oauth-success') {
          onSuccess(event.data.configId);
          authWindow?.close();
          window.removeEventListener('message', handleMessage);
        } else if (event.data.type === 'oauth-error') {
          onError(event.data.message);
          authWindow?.close();
          window.removeEventListener('message', handleMessage);
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      // Timeout de 5 minutos
      setTimeout(() => {
        if (authWindow && !authWindow.closed) {
          authWindow.close();
          onError('Timeout: La autorización tomó demasiado tiempo');
        }
        window.removeEventListener('message', handleMessage);
      }, 5 * 60 * 1000);
      
    } catch (error: any) {
      console.error('Error iniciando OAuth:', error);
      onError(error.message || 'Error al iniciar autorización');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      className={`oauth-button ${className}`}
    >
      {loading ? (
        <>
          <span className="spinner" />
          Conectando...
        </>
      ) : (
        children
      )}
    </button>
  );
};
```

### Componente: OAuthStatus

```tsx
// components/OAuthStatus.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface OAuthStatusProps {
  empresaId: string;
  provider: 'google' | 'microsoft';
  service: 'sheets' | 'calendar' | 'drive';
  configId?: string;
  onDisconnect?: () => void;
}

interface OAuthStatusData {
  authorized: boolean;
  status: string;
  userEmail?: string;
  userName?: string;
  userPhoto?: string;
  lastUsed?: Date;
  tokenExpiry?: Date;
  willExpireSoon?: boolean;
  errorCount?: number;
}

export const OAuthStatus: React.FC<OAuthStatusProps> = ({
  empresaId,
  provider,
  service,
  configId,
  onDisconnect
}) => {
  const [status, setStatus] = useState<OAuthStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    checkStatus();
  }, [empresaId, provider, service]);
  
  const checkStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/oauth/status', {
        params: { empresaId, provider, service }
      });
      setStatus(response.data);
    } catch (error) {
      console.error('Error verificando estado OAuth:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDisconnect = async () => {
    if (!configId) return;
    
    try {
      await axios.delete(`/api/oauth/${configId}`);
      setStatus({ authorized: false, status: 'not_configured' });
      onDisconnect?.();
    } catch (error) {
      console.error('Error desconectando OAuth:', error);
    }
  };
  
  if (loading) {
    return <div className="oauth-status loading">Verificando...</div>;
  }
  
  if (!status?.authorized) {
    return <div className="oauth-status not-authorized">No conectado</div>;
  }
  
  return (
    <div className="oauth-status authorized">
      <div className="user-info">
        {status.userPhoto && (
          <img src={status.userPhoto} alt={status.userName} className="user-photo" />
        )}
        <div>
          <div className="user-name">{status.userName}</div>
          <div className="user-email">{status.userEmail}</div>
        </div>
      </div>
      
      {status.willExpireSoon && (
        <div className="warning">⚠️ Token expirará pronto</div>
      )}
      
      {status.errorCount && status.errorCount > 0 && (
        <div className="error">❌ {status.errorCount} errores recientes</div>
      )}
      
      <button onClick={handleDisconnect} className="disconnect-btn">
        Desconectar
      </button>
    </div>
  );
};
```

### Página de Callback OAuth

```tsx
// pages/OAuthCallback.tsx
import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    const oauth = searchParams.get('oauth');
    const configId = searchParams.get('configId');
    const message = searchParams.get('message');
    
    if (oauth === 'success' && configId) {
      // Enviar mensaje a la ventana padre
      window.opener?.postMessage({
        type: 'oauth-success',
        configId
      }, window.location.origin);
      
      // Mostrar mensaje de éxito
      setTimeout(() => {
        window.close();
      }, 2000);
    } else if (oauth === 'error') {
      // Enviar mensaje de error
      window.opener?.postMessage({
        type: 'oauth-error',
        message: message || 'Error desconocido'
      }, window.location.origin);
      
      setTimeout(() => {
        window.close();
      }, 3000);
    }
  }, [searchParams]);
  
  const oauth = searchParams.get('oauth');
  
  return (
    <div className="oauth-callback">
      {oauth === 'success' ? (
        <div className="success">
          <h2>✅ Autorización Exitosa</h2>
          <p>Puedes cerrar esta ventana</p>
        </div>
      ) : (
        <div className="error">
          <h2>❌ Error en Autorización</h2>
          <p>{searchParams.get('message') || 'Error desconocido'}</p>
          <p>Esta ventana se cerrará automáticamente</p>
        </div>
      )}
    </div>
  );
};
```

### Integración en Nodo del Editor Visual

```tsx
// components/nodes/GoogleSheetsNode.tsx
import React, { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { OAuthButton } from '../OAuthButton';
import { OAuthStatus } from '../OAuthStatus';

interface GoogleSheetsNodeProps {
  data: {
    label: string;
    empresaId: string;
    oauthConfigId?: string;
    oauthStatus?: string;
    // ... otros campos
  };
  id: string;
}

export const GoogleSheetsNode: React.FC<GoogleSheetsNodeProps> = ({ data, id }) => {
  const [isAuthorized, setIsAuthorized] = useState(!!data.oauthConfigId);
  
  const handleOAuthSuccess = (configId: string) => {
    // Actualizar nodo con configId
    updateNodeData(id, {
      oauthConfigId: configId,
      oauthStatus: 'authorized'
    });
    setIsAuthorized(true);
  };
  
  const handleOAuthError = (error: string) => {
    console.error('OAuth error:', error);
    alert(`Error: ${error}`);
  };
  
  const handleDisconnect = () => {
    updateNodeData(id, {
      oauthConfigId: undefined,
      oauthStatus: 'not_configured'
    });
    setIsAuthorized(false);
  };
  
  return (
    <div className="google-sheets-node">
      <Handle type="target" position={Position.Top} />
      
      <div className="node-header">
        <span className="node-icon">📊</span>
        <span className="node-label">{data.label}</span>
      </div>
      
      <div className="node-body">
        {!isAuthorized ? (
          <OAuthButton
            empresaId={data.empresaId}
            provider="google"
            service="sheets"
            onSuccess={handleOAuthSuccess}
            onError={handleOAuthError}
            className="connect-button"
          >
            <span className="google-icon">G</span>
            Conectar con Google Sheets
          </OAuthButton>
        ) : (
          <OAuthStatus
            empresaId={data.empresaId}
            provider="google"
            service="sheets"
            configId={data.oauthConfigId}
            onDisconnect={handleDisconnect}
          />
        )}
        
        {/* Configuración adicional del nodo */}
        {isAuthorized && (
          <div className="node-config">
            {/* Inputs de configuración */}
          </div>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};
```

---

## 📚 Referencias y Recursos

### Google Cloud Console

1. Crear proyecto: https://console.cloud.google.com/
2. Habilitar APIs: Google Sheets API, Google Calendar API
3. Crear credenciales OAuth 2.0
4. Configurar pantalla de consentimiento
5. Agregar URIs de redirección autorizadas

### Documentación Oficial

- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [Google Calendar API](https://developers.google.com/calendar/api)
- [googleapis Node.js](https://github.com/googleapis/google-api-nodejs-client)

---

**Creado:** 2026-01-31  
**Última actualización:** 2026-01-31  
**Versión:** 1.0
