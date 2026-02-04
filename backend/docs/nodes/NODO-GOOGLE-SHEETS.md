# Nodo Google Sheets - Documentación Completa

## 📊 Descripción General

El nodo Google Sheets permite integrar hojas de cálculo de Google en tus flujos conversacionales mediante OAuth 2.0. Los usuarios pueden autorizar el acceso con un solo clic desde el frontend.

**Características principales:**
- ✅ Autenticación OAuth 2.0 con un botón
- ✅ Lectura de datos de hojas de cálculo
- ✅ Escritura y actualización de filas
- ✅ Creación de nuevas hojas
- ✅ Búsqueda y filtrado de datos
- ✅ Tokens almacenados de forma segura en BD
- ✅ Refresh automático de tokens expirados

---

## 🎨 Configuración en el Frontend

### Botón de Autorización OAuth

El nodo muestra un botón "Conectar con Google" cuando no hay autorización:

```jsx
// Componente del nodo en el editor visual
<GoogleSheetsNode>
  {!isAuthorized ? (
    <OAuthButton
      provider="google"
      scopes={['https://www.googleapis.com/auth/spreadsheets']}
      onSuccess={handleOAuthSuccess}
    >
      <GoogleIcon /> Conectar con Google Sheets
    </OAuthButton>
  ) : (
    <div className="authorized-badge">
      ✅ Conectado como {userEmail}
      <button onClick={handleDisconnect}>Desconectar</button>
    </div>
  )}
</GoogleSheetsNode>
```

### Estados del Nodo

1. **No autorizado:** Muestra botón de conexión
2. **Autorizando:** Loading mientras se obtiene el token
3. **Autorizado:** Badge verde con email del usuario
4. **Error:** Mensaje de error con opción de reintentar

### Configuración del Nodo

Una vez autorizado, el usuario puede configurar:

```typescript
interface GoogleSheetsNodeConfig {
  // OAuth (automático)
  oauthConfigId: string;  // ID de la configuración OAuth en BD
  
  // Configuración del módulo
  module: 'read' | 'write' | 'append' | 'update' | 'search' | 'create-sheet';
  
  // Parámetros comunes
  spreadsheetId: string;  // ID de la hoja (puede usar variables)
  sheetName?: string;     // Nombre de la pestaña (opcional)
  
  // Parámetros según módulo
  range?: string;         // Para read: "A1:D10"
  values?: any[][];       // Para write/append: datos a escribir
  searchColumn?: string;  // Para search: columna donde buscar
  searchValue?: string;   // Para search: valor a buscar
  
  // Output mapping
  outputVariable: string; // Variable donde guardar resultado
}
```

**Ejemplo de configuración en el frontend:**

```jsx
<NodeConfigPanel>
  <Select label="Módulo" value={config.module}>
    <option value="read">Leer datos</option>
    <option value="write">Escribir datos</option>
    <option value="append">Agregar fila</option>
    <option value="update">Actualizar fila</option>
    <option value="search">Buscar en hoja</option>
    <option value="create-sheet">Crear nueva hoja</option>
  </Select>
  
  <Input 
    label="ID de la hoja" 
    value={config.spreadsheetId}
    placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
    hint="Puedes usar {{variables}}"
  />
  
  <Input 
    label="Nombre de la pestaña" 
    value={config.sheetName}
    placeholder="Hoja1"
  />
  
  {config.module === 'read' && (
    <Input 
      label="Rango" 
      value={config.range}
      placeholder="A1:D10"
    />
  )}
  
  {config.module === 'append' && (
    <TextArea 
      label="Datos a agregar (JSON)" 
      value={config.values}
      placeholder='[["Nombre", "Email", "Teléfono"]]'
    />
  )}
  
  <Input 
    label="Guardar resultado en" 
    value={config.outputVariable}
    placeholder="sheets_data"
  />
</NodeConfigPanel>
```

---

## 🗄️ Base de Datos - Schema

### Modelo: OAuthConfiguration

Almacena las credenciales OAuth de cada empresa:

```typescript
// models/OAuthConfiguration.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IOAuthConfiguration extends Document {
  empresaId: string;           // ID de la empresa
  provider: 'google' | 'microsoft' | 'facebook';
  service: 'sheets' | 'calendar' | 'drive' | 'outlook';
  
  // Tokens OAuth
  accessToken: string;         // Token de acceso (encriptado)
  refreshToken: string;        // Token de refresh (encriptado)
  tokenExpiry: Date;           // Fecha de expiración del access token
  
  // Info del usuario autorizado
  userEmail: string;           // Email de la cuenta autorizada
  userName?: string;           // Nombre del usuario
  
  // Scopes autorizados
  scopes: string[];            // ['https://www.googleapis.com/auth/spreadsheets']
  
  // Metadata
  isActive: boolean;           // Si la autorización está activa
  lastUsed: Date;              // Última vez que se usó
  createdAt: Date;
  updatedAt: Date;
}

const OAuthConfigurationSchema = new Schema<IOAuthConfiguration>({
  empresaId: { type: String, required: true, index: true },
  provider: { 
    type: String, 
    required: true, 
    enum: ['google', 'microsoft', 'facebook'] 
  },
  service: { 
    type: String, 
    required: true, 
    enum: ['sheets', 'calendar', 'drive', 'outlook'] 
  },
  
  // Tokens (encriptados en el middleware pre-save)
  accessToken: { type: String, required: true },
  refreshToken: { type: String, required: true },
  tokenExpiry: { type: Date, required: true },
  
  userEmail: { type: String, required: true },
  userName: { type: String },
  
  scopes: [{ type: String }],
  
  isActive: { type: Boolean, default: true },
  lastUsed: { type: Date, default: Date.now },
}, { 
  timestamps: true 
});

// Índice compuesto para búsqueda rápida
OAuthConfigurationSchema.index({ empresaId: 1, provider: 1, service: 1 });

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

export const OAuthConfigurationModel = mongoose.model<IOAuthConfiguration>(
  'OAuthConfiguration', 
  OAuthConfigurationSchema
);
```

### Modelo: VisualFlow (actualizado)

Agregar referencia a OAuth en los nodos:

```typescript
// Actualización en models/VisualFlow.ts
interface NodeData {
  // ... campos existentes
  
  // OAuth configuration
  oauthConfigId?: string;  // Referencia a OAuthConfiguration
  requiresOAuth?: boolean; // Si el nodo requiere OAuth
  oauthProvider?: 'google' | 'microsoft';
  oauthService?: 'sheets' | 'calendar';
}
```

---

## 🔧 Backend - Implementación

### 1. Controlador OAuth

```typescript
// controllers/oauthController.ts
import { Request, Response } from 'express';
import { google } from 'googleapis';
import { OAuthConfigurationModel } from '../models/OAuthConfiguration.js';
import { encrypt, decrypt } from '../utils/encryption.js';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Iniciar flujo OAuth
export const initiateGoogleOAuth = async (req: Request, res: Response) => {
  try {
    const { empresaId, service } = req.body;
    
    // Scopes según el servicio
    const scopesMap = {
      sheets: ['https://www.googleapis.com/auth/spreadsheets'],
      calendar: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ],
      drive: ['https://www.googleapis.com/auth/drive.file']
    };
    
    const scopes = scopesMap[service as keyof typeof scopesMap];
    
    // Generar URL de autorización
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: JSON.stringify({ empresaId, service }), // Pasar metadata
      prompt: 'consent' // Forzar consent para obtener refresh token
    });
    
    res.json({ success: true, authUrl });
  } catch (error) {
    console.error('❌ Error iniciando OAuth:', error);
    res.status(500).json({ success: false, error: String(error) });
  }
};

// Callback OAuth (después de autorización)
export const handleGoogleOAuthCallback = async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;
    const { empresaId, service } = JSON.parse(state as string);
    
    // Intercambiar código por tokens
    const { tokens } = await oauth2Client.getToken(code as string);
    
    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('No se recibieron tokens completos');
    }
    
    // Obtener info del usuario
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    
    // Guardar en base de datos
    const oauthConfig = await OAuthConfigurationModel.findOneAndUpdate(
      { empresaId, provider: 'google', service },
      {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry: new Date(tokens.expiry_date || Date.now() + 3600000),
        userEmail: userInfo.data.email || '',
        userName: userInfo.data.name || '',
        scopes: tokens.scope?.split(' ') || [],
        isActive: true,
        lastUsed: new Date()
      },
      { upsert: true, new: true }
    );
    
    console.log('✅ OAuth configurado:', oauthConfig._id);
    
    // Redirigir al frontend con éxito
    res.redirect(`${process.env.FRONTEND_URL}/flows?oauth=success&configId=${oauthConfig._id}`);
  } catch (error) {
    console.error('❌ Error en callback OAuth:', error);
    res.redirect(`${process.env.FRONTEND_URL}/flows?oauth=error`);
  }
};

// Verificar estado de OAuth
export const checkOAuthStatus = async (req: Request, res: Response) => {
  try {
    const { empresaId, service } = req.query;
    
    const config = await OAuthConfigurationModel.findOne({
      empresaId,
      provider: 'google',
      service,
      isActive: true
    });
    
    if (!config) {
      return res.json({ authorized: false });
    }
    
    res.json({
      authorized: true,
      configId: config._id,
      userEmail: config.userEmail,
      userName: config.userName,
      lastUsed: config.lastUsed
    });
  } catch (error) {
    console.error('❌ Error verificando OAuth:', error);
    res.status(500).json({ success: false, error: String(error) });
  }
};

// Desconectar OAuth
export const disconnectOAuth = async (req: Request, res: Response) => {
  try {
    const { configId } = req.params;
    
    await OAuthConfigurationModel.findByIdAndUpdate(configId, {
      isActive: false
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error desconectando OAuth:', error);
    res.status(500).json({ success: false, error: String(error) });
  }
};
```

### 2. Servicio Google Sheets

```typescript
// services/googleSheetsService.ts
import { google } from 'googleapis';
import { OAuthConfigurationModel } from '../models/OAuthConfiguration.js';
import { decrypt } from '../utils/encryption.js';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Obtener cliente autenticado
async function getAuthenticatedClient(oauthConfigId: string) {
  const config = await OAuthConfigurationModel.findById(oauthConfigId);
  
  if (!config || !config.isActive) {
    throw new Error('Configuración OAuth no encontrada o inactiva');
  }
  
  // Desencriptar tokens
  const accessToken = await decrypt(config.accessToken);
  const refreshToken = await decrypt(config.refreshToken);
  
  // Configurar cliente
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: config.tokenExpiry.getTime()
  });
  
  // Verificar si el token expiró y refrescarlo
  if (config.tokenExpiry < new Date()) {
    console.log('🔄 Token expirado, refrescando...');
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    // Actualizar en BD
    await OAuthConfigurationModel.findByIdAndUpdate(oauthConfigId, {
      accessToken: credentials.access_token,
      tokenExpiry: new Date(credentials.expiry_date || Date.now() + 3600000),
      lastUsed: new Date()
    });
    
    oauth2Client.setCredentials(credentials);
  } else {
    // Actualizar lastUsed
    await OAuthConfigurationModel.findByIdAndUpdate(oauthConfigId, {
      lastUsed: new Date()
    });
  }
  
  return google.sheets({ version: 'v4', auth: oauth2Client });
}

// Leer datos de una hoja
export async function readSheetData(params: {
  oauthConfigId: string;
  spreadsheetId: string;
  range: string;
}) {
  try {
    const sheets = await getAuthenticatedClient(params.oauthConfigId);
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: params.spreadsheetId,
      range: params.range
    });
    
    return {
      success: true,
      data: response.data.values || [],
      rowCount: response.data.values?.length || 0
    };
  } catch (error: any) {
    console.error('❌ Error leyendo Google Sheets:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Agregar fila
export async function appendSheetRow(params: {
  oauthConfigId: string;
  spreadsheetId: string;
  range: string;
  values: any[][];
}) {
  try {
    const sheets = await getAuthenticatedClient(params.oauthConfigId);
    
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: params.spreadsheetId,
      range: params.range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: params.values
      }
    });
    
    return {
      success: true,
      updatedRange: response.data.updates?.updatedRange,
      updatedRows: response.data.updates?.updatedRows
    };
  } catch (error: any) {
    console.error('❌ Error agregando fila:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Actualizar datos
export async function updateSheetData(params: {
  oauthConfigId: string;
  spreadsheetId: string;
  range: string;
  values: any[][];
}) {
  try {
    const sheets = await getAuthenticatedClient(params.oauthConfigId);
    
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: params.spreadsheetId,
      range: params.range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: params.values
      }
    });
    
    return {
      success: true,
      updatedCells: response.data.updatedCells,
      updatedRows: response.data.updatedRows
    };
  } catch (error: any) {
    console.error('❌ Error actualizando datos:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Buscar en hoja
export async function searchInSheet(params: {
  oauthConfigId: string;
  spreadsheetId: string;
  sheetName: string;
  searchColumn: string;
  searchValue: string;
}) {
  try {
    const sheets = await getAuthenticatedClient(params.oauthConfigId);
    
    // Leer toda la hoja
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: params.spreadsheetId,
      range: `${params.sheetName}!A:Z`
    });
    
    const rows = response.data.values || [];
    if (rows.length === 0) {
      return { success: true, found: false, data: null };
    }
    
    // Buscar en la columna especificada
    const columnIndex = params.searchColumn.charCodeAt(0) - 65; // A=0, B=1, etc.
    const foundRow = rows.find(row => row[columnIndex] === params.searchValue);
    
    return {
      success: true,
      found: !!foundRow,
      data: foundRow || null
    };
  } catch (error: any) {
    console.error('❌ Error buscando en hoja:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
```

### 3. Executor del Nodo

```typescript
// services/nodeExecutors/GoogleSheetsExecutor.ts
import { readSheetData, appendSheetRow, updateSheetData, searchInSheet } from '../googleSheetsService.js';
import { resolveVariables } from '../../utils/variableResolver.js';

export async function executeGoogleSheetsNode(
  nodeConfig: any,
  globalVariables: Record<string, any>
): Promise<{ success: boolean; data?: any; error?: string }> {
  
  console.log('📊 [GOOGLE SHEETS] Ejecutando nodo...');
  
  const { module, oauthConfigId, spreadsheetId, sheetName, range, values, searchColumn, searchValue, outputVariable } = nodeConfig;
  
  if (!oauthConfigId) {
    return { success: false, error: 'No hay configuración OAuth' };
  }
  
  // Resolver variables en parámetros
  const resolvedSpreadsheetId = resolveVariables(spreadsheetId, globalVariables);
  const resolvedRange = range ? resolveVariables(range, globalVariables) : '';
  
  let result: any;
  
  switch (module) {
    case 'read':
      result = await readSheetData({
        oauthConfigId,
        spreadsheetId: resolvedSpreadsheetId,
        range: resolvedRange
      });
      break;
      
    case 'append':
      const resolvedValues = JSON.parse(resolveVariables(JSON.stringify(values), globalVariables));
      result = await appendSheetRow({
        oauthConfigId,
        spreadsheetId: resolvedSpreadsheetId,
        range: `${sheetName}!A:Z`,
        values: resolvedValues
      });
      break;
      
    case 'update':
      const updateValues = JSON.parse(resolveVariables(JSON.stringify(values), globalVariables));
      result = await updateSheetData({
        oauthConfigId,
        spreadsheetId: resolvedSpreadsheetId,
        range: resolvedRange,
        values: updateValues
      });
      break;
      
    case 'search':
      result = await searchInSheet({
        oauthConfigId,
        spreadsheetId: resolvedSpreadsheetId,
        sheetName: sheetName || 'Hoja1',
        searchColumn: searchColumn || 'A',
        searchValue: resolveVariables(searchValue, globalVariables)
      });
      break;
      
    default:
      return { success: false, error: `Módulo no soportado: ${module}` };
  }
  
  // Guardar resultado en variable global
  if (result.success && outputVariable) {
    globalVariables[outputVariable] = result.data || result;
  }
  
  console.log(`✅ [GOOGLE SHEETS] Módulo ${module} ejecutado`);
  
  return result;
}
```

### 4. Rutas

```typescript
// routes/oauth.routes.ts
import express from 'express';
import { 
  initiateGoogleOAuth, 
  handleGoogleOAuthCallback,
  checkOAuthStatus,
  disconnectOAuth
} from '../controllers/oauthController.js';

const router = express.Router();

// Iniciar OAuth
router.post('/oauth/google/initiate', initiateGoogleOAuth);

// Callback OAuth
router.get('/oauth/google/callback', handleGoogleOAuthCallback);

// Verificar estado
router.get('/oauth/status', checkOAuthStatus);

// Desconectar
router.delete('/oauth/:configId', disconnectOAuth);

export default router;
```

---

## 📝 Ejemplos de Uso

### Ejemplo 1: Guardar Lead en Google Sheets

```javascript
// Flujo: Capturar lead y guardar en hoja
[GPT Formateador] → Extrae: nombre, email, telefono
    ↓
[Google Sheets - Append]
    Config:
    - spreadsheetId: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
    - sheetName: "Leads"
    - values: [["{{nombre}}", "{{email}}", "{{telefono}}", "{{fecha_actual}}"]]
    - outputVariable: "sheets_result"
    ↓
[WhatsApp] → "✅ Tus datos fueron registrados correctamente"
```

### Ejemplo 2: Buscar Cliente en Base de Datos

```javascript
// Flujo: Buscar cliente por teléfono
[Google Sheets - Search]
    Config:
    - spreadsheetId: "{{empresa_spreadsheet_id}}"
    - sheetName: "Clientes"
    - searchColumn: "C"  // Columna de teléfono
    - searchValue: "{{telefono_cliente}}"
    - outputVariable: "cliente_data"
    ↓
[Router] → ¿Cliente encontrado?
    ├─ [sheets_result.found equals true] → [WhatsApp] "Hola {{cliente_data[0]}}, ¿en qué puedo ayudarte?"
    └─ [sheets_result.found equals false] → [WhatsApp] "Bienvenido, ¿cuál es tu nombre?"
```

### Ejemplo 3: Actualizar Stock

```javascript
// Flujo: Actualizar stock después de venta
[Google Sheets - Read]
    Config:
    - spreadsheetId: "{{inventory_sheet_id}}"
    - range: "Productos!A2:D100"
    - outputVariable: "productos"
    ↓
[GPT Transform] → Encuentra producto y calcula nuevo stock
    ↓
[Google Sheets - Update]
    Config:
    - spreadsheetId: "{{inventory_sheet_id}}"
    - range: "Productos!D{{fila_producto}}"
    - values: [["{{nuevo_stock}}"]]
    ↓
[WhatsApp] → "Stock actualizado: {{nuevo_stock}} unidades"
```

---

## 🔐 Seguridad

### Encriptación de Tokens

```typescript
// utils/encryption.ts
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
const IV_LENGTH = 16;

export async function encrypt(text: string): Promise<string> {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export async function decrypt(text: string): Promise<string> {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
```

### Variables de Entorno

```bash
# .env
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
GOOGLE_REDIRECT_URI=https://tu-dominio.com/api/oauth/google/callback
ENCRYPTION_KEY=tu-clave-de-32-bytes-para-encriptar-tokens
FRONTEND_URL=https://tu-frontend.com
```

---

## 🐛 Troubleshooting

### Error: "Token expirado"

**Solución:** El sistema refresca automáticamente. Si persiste, reconectar OAuth.

### Error: "Spreadsheet not found"

**Solución:** Verificar que el ID de la hoja sea correcto y que la cuenta autorizada tenga acceso.

### Error: "Insufficient permissions"

**Solución:** Verificar que los scopes incluyan `https://www.googleapis.com/auth/spreadsheets`.

### No se muestra el botón de OAuth

**Solución:** Verificar que `requiresOAuth: true` esté en la configuración del nodo.

---

## 📚 Referencias

- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google API Node.js Client](https://github.com/googleapis/google-api-nodejs-client)

---

**Creado:** 2026-01-31  
**Última actualización:** 2026-01-31  
**Versión:** 1.0
