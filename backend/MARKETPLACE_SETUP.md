# 🛒 Configuración del Módulo de Marketplace

## 📋 Resumen

El módulo de Marketplace permite a las empresas conectar integraciones externas como Google Calendar, Outlook, Zoom, etc. Este documento explica cómo configurar la integración de Google Calendar.

---

## 🚀 Configuración Inicial

### 1. Generar Clave de Encriptación

Los tokens OAuth se almacenan encriptados en la base de datos. Genera una clave de 32 bytes:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copia el resultado y agrégalo a tu `.env`:

```bash
ENCRYPTION_KEY=tu_clave_de_64_caracteres_aqui
```

### 2. Configurar Google Cloud Console

#### 2.1. Crear Proyecto

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la **Google Calendar API**:
   - Ve a "APIs & Services" > "Library"
   - Busca "Google Calendar API"
   - Click en "Enable"

#### 2.2. Crear Credenciales OAuth 2.0

1. Ve a "APIs & Services" > "Credentials"
2. Click en "Create Credentials" > "OAuth client ID"
3. Selecciona "Web application"
4. Configura:
   - **Name**: MomentoIA Marketplace
   - **Authorized JavaScript origins**:
     ```
     http://localhost:3000
     http://localhost:3001
     https://tu-dominio.com
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:3000/api/marketplace/google-calendar/callback
     https://tu-dominio.com/api/marketplace/google-calendar/callback
     ```
5. Click en "Create"
6. Copia el **Client ID** y **Client Secret**

#### 2.3. Configurar Pantalla de Consentimiento

1. Ve a "APIs & Services" > "OAuth consent screen"
2. Selecciona "External" (o "Internal" si es para Google Workspace)
3. Completa la información:
   - **App name**: MomentoIA
   - **User support email**: tu-email@dominio.com
   - **Developer contact**: tu-email@dominio.com
4. En "Scopes", agrega:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
5. Guarda y continúa

### 3. Configurar Variables de Entorno

Agrega las siguientes variables a tu archivo `.env`:

```bash
##############################################
# 🔐 MARKETPLACE - GOOGLE CALENDAR
##############################################
GOOGLE_CLIENT_ID=tu_client_id_de_google
GOOGLE_CLIENT_SECRET=tu_client_secret_de_google
GOOGLE_REDIRECT_URI=http://localhost:3000/api/marketplace/google-calendar/callback

# Clave de encriptación (generada en el paso 1)
ENCRYPTION_KEY=tu_clave_de_64_caracteres

# URL del frontend para redirecciones
FRONTEND_URL=http://localhost:3001
```

---

## 📡 Endpoints de la API

### Generales

#### `GET /api/marketplace/integrations`
Lista todas las integraciones disponibles en el marketplace.

**Headers**: `Authorization: Bearer {token}`

**Response**:
```json
{
  "success": true,
  "integrations": [
    {
      "id": "google_calendar",
      "name": "Google Calendar",
      "description": "Sincroniza y gestiona eventos de Google Calendar",
      "icon": "📅",
      "category": "productivity",
      "features": [...],
      "status": "available"
    }
  ]
}
```

#### `GET /api/marketplace/:empresaId/active`
Lista las integraciones activas de una empresa.

**Headers**: `Authorization: Bearer {token}`

**Response**:
```json
{
  "success": true,
  "integrations": [
    {
      "_id": "...",
      "empresaId": "Empresa1",
      "provider": "google_calendar",
      "status": "active",
      "connected_account": "usuario@gmail.com",
      "last_sync": "2025-11-11T23:00:00.000Z"
    }
  ]
}
```

### Google Calendar

#### `GET /api/marketplace/:empresaId/google-calendar/connect`
Inicia el flujo OAuth de Google Calendar.

**Headers**: `Authorization: Bearer {token}`

**Response**:
```json
{
  "success": true,
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

**Flujo**:
1. Frontend llama a este endpoint
2. Redirige al usuario a `authUrl`
3. Usuario autoriza en Google
4. Google redirige a `/api/marketplace/google-calendar/callback`
5. Backend guarda tokens y redirige al frontend

#### `GET /api/marketplace/:empresaId/google-calendar/calendars`
Lista los calendarios del usuario.

**Headers**: `Authorization: Bearer {token}`

**Response**:
```json
{
  "success": true,
  "calendars": [
    {
      "id": "primary",
      "summary": "usuario@gmail.com",
      "timeZone": "America/Argentina/Buenos_Aires"
    }
  ]
}
```

#### `GET /api/marketplace/:empresaId/google-calendar/events`
Obtiene eventos de un calendario.

**Headers**: `Authorization: Bearer {token}`

**Query Params**:
- `calendarId` (opcional): ID del calendario (default: "primary")
- `timeMin` (opcional): Fecha mínima ISO 8601
- `timeMax` (opcional): Fecha máxima ISO 8601

**Response**:
```json
{
  "success": true,
  "events": [
    {
      "id": "...",
      "summary": "Reunión con cliente",
      "start": { "dateTime": "2025-11-12T10:00:00-03:00" },
      "end": { "dateTime": "2025-11-12T11:00:00-03:00" }
    }
  ]
}
```

#### `POST /api/marketplace/:empresaId/google-calendar/events`
Crea un evento en Google Calendar.

**Headers**: `Authorization: Bearer {token}`

**Body**:
```json
{
  "calendarId": "primary",
  "event": {
    "summary": "Nueva reunión",
    "description": "Descripción del evento",
    "start": {
      "dateTime": "2025-11-12T10:00:00-03:00",
      "timeZone": "America/Argentina/Buenos_Aires"
    },
    "end": {
      "dateTime": "2025-11-12T11:00:00-03:00",
      "timeZone": "America/Argentina/Buenos_Aires"
    },
    "attendees": [
      { "email": "invitado@example.com" }
    ]
  }
}
```

#### `PUT /api/marketplace/:empresaId/google-calendar/events/:eventId`
Actualiza un evento existente.

**Headers**: `Authorization: Bearer {token}`

**Body**: Similar al POST

#### `DELETE /api/marketplace/:empresaId/google-calendar/events/:eventId`
Elimina un evento.

**Headers**: `Authorization: Bearer {token}`

**Query Params**:
- `calendarId` (opcional): ID del calendario (default: "primary")

#### `DELETE /api/marketplace/integration/:integrationId`
Desconecta una integración.

**Headers**: `Authorization: Bearer {token}`

---

## 🔄 Sincronización Automática

El sistema incluye 3 jobs automáticos:

### 1. Refresh de Tokens (cada 5 minutos)
Refresca automáticamente los tokens que están próximos a expirar (menos de 10 minutos).

### 2. Sincronización de Calendarios (cada 15 minutos)
Sincroniza eventos de calendarios con `auto_sync: true`.

### 3. Limpieza (cada 24 horas)
Elimina integraciones revocadas con más de 30 días de antigüedad.

---

## 🔐 Seguridad

### Encriptación
- Todos los tokens OAuth se almacenan encriptados con AES-256-CBC
- La clave de encriptación debe tener 32 bytes (64 caracteres hex)
- Nunca commitear la `ENCRYPTION_KEY` al repositorio

### Refresh Automático
- Los tokens se refrescan automáticamente antes de expirar
- Si el refresh falla 5 veces consecutivas, la integración se marca como "error"

### Revocación
- Al desconectar una integración, se revoca el acceso en Google
- Los datos se marcan como "revoked" y se eliminan después de 30 días

---

## 🧪 Testing

### Probar Conexión

```bash
# 1. Obtener URL de autorización
curl -X GET http://localhost:3000/api/marketplace/EmpresaTest/google-calendar/connect \
  -H "Authorization: Bearer {tu_token}"

# 2. Visitar la URL en el navegador y autorizar

# 3. Listar calendarios
curl -X GET http://localhost:3000/api/marketplace/EmpresaTest/google-calendar/calendars \
  -H "Authorization: Bearer {tu_token}"

# 4. Obtener eventos
curl -X GET "http://localhost:3000/api/marketplace/EmpresaTest/google-calendar/events?timeMin=2025-11-01T00:00:00Z&timeMax=2025-11-30T23:59:59Z" \
  -H "Authorization: Bearer {tu_token}"
```

---

## 📊 Modelo de Datos

### MarketplaceIntegration

```typescript
{
  _id: ObjectId,
  empresaId: string,              // Ref: Empresa.nombre
  usuarioEmpresaId: ObjectId,     // Quien conectó
  provider: 'google_calendar',
  provider_name: 'Google Calendar',
  credentials: {                   // ENCRIPTADO
    access_token: string,
    refresh_token: string,
    expires_at: Date
  },
  status: 'active' | 'expired' | 'revoked' | 'error',
  connected_account: string,       // Email de Google
  config: {
    google_calendar: {
      auto_sync: true,
      sync_interval: 30,           // minutos
      sync_past_days: 7,
      sync_future_days: 30
    }
  },
  last_sync: Date,
  next_sync: Date,
  sync_count: number,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🐛 Troubleshooting

### Error: "ENCRYPTION_KEY no encontrada"
- Genera una clave con el comando del paso 1
- Agrégala al archivo `.env`
- Reinicia el servidor

### Error: "GOOGLE_CLIENT_ID no configurado"
- Verifica que las credenciales estén en `.env`
- Asegúrate de que el archivo `.env` esté en la raíz del backend
- Reinicia el servidor

### Error: "redirect_uri_mismatch"
- Verifica que la URI de redirección en Google Cloud Console coincida exactamente
- Debe incluir el protocolo (http/https), dominio y path completo
- No debe tener espacios ni caracteres extra

### Token expirado constantemente
- Verifica que el job de refresh esté corriendo
- Revisa los logs del servidor
- Puede ser necesario reconectar la integración

---

## 🚀 Próximas Integraciones

- **Outlook Calendar**: Integración con Microsoft Calendar
- **Zoom**: Creación y gestión de reuniones
- **Slack**: Notificaciones y comandos
- **Google Drive**: Gestión de archivos
- **Microsoft Teams**: Integración con Teams

---

## 📝 Notas

- La integración es **por empresa**, no por usuario individual
- Todos los roles pueden usar las integraciones activas
- Solo un admin puede conectar/desconectar integraciones
- Los eventos se sincronizan automáticamente según la configuración
