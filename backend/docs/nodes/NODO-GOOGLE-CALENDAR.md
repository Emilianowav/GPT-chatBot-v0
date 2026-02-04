# Nodo Google Calendar - Documentación Completa

## 📅 Descripción General

El nodo Google Calendar permite gestionar eventos y calendarios de Google en tus flujos conversacionales mediante OAuth 2.0. Los usuarios pueden autorizar el acceso con un solo clic desde el frontend.

**Características principales:**
- ✅ Autenticación OAuth 2.0 con un botón
- ✅ Crear eventos en calendarios
- ✅ Listar eventos próximos
- ✅ Actualizar eventos existentes
- ✅ Eliminar eventos
- ✅ Buscar disponibilidad horaria
- ✅ Tokens almacenados de forma segura en BD
- ✅ Refresh automático de tokens expirados

---

## 🎨 Configuración en el Frontend

### Botón de Autorización OAuth

El nodo muestra un botón "Conectar con Google" cuando no hay autorización:

```jsx
// Componente del nodo en el editor visual
<GoogleCalendarNode>
  {!isAuthorized ? (
    <OAuthButton
      provider="google"
      scopes={[
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ]}
      onSuccess={handleOAuthSuccess}
    >
      <GoogleIcon /> Conectar con Google Calendar
    </OAuthButton>
  ) : (
    <div className="authorized-badge">
      ✅ Conectado como {userEmail}
      <button onClick={handleDisconnect}>Desconectar</button>
    </div>
  )}
</GoogleCalendarNode>
```

### Estados del Nodo

1. **No autorizado:** Muestra botón de conexión
2. **Autorizando:** Loading mientras se obtiene el token
3. **Autorizado:** Badge verde con email del usuario
4. **Error:** Mensaje de error con opción de reintentar

### Configuración del Nodo

Una vez autorizado, el usuario puede configurar:

```typescript
interface GoogleCalendarNodeConfig {
  // OAuth (automático)
  oauthConfigId: string;  // ID de la configuración OAuth en BD
  
  // Configuración del módulo
  module: 'create-event' | 'list-events' | 'update-event' | 'delete-event' | 'check-availability';
  
  // Parámetros comunes
  calendarId?: string;    // ID del calendario (default: 'primary')
  
  // Parámetros para crear/actualizar evento
  eventTitle?: string;    // Título del evento
  eventDescription?: string;
  startDateTime?: string; // ISO 8601: "2026-02-01T10:00:00-03:00"
  endDateTime?: string;
  location?: string;
  attendees?: string[];   // Emails de invitados
  
  // Parámetros para listar eventos
  timeMin?: string;       // Fecha mínima
  timeMax?: string;       // Fecha máxima
  maxResults?: number;    // Cantidad de eventos
  
  // Parámetros para actualizar/eliminar
  eventId?: string;       // ID del evento
  
  // Output mapping
  outputVariable: string; // Variable donde guardar resultado
}
```

**Ejemplo de configuración en el frontend:**

```jsx
<NodeConfigPanel>
  <Select label="Módulo" value={config.module}>
    <option value="create-event">Crear evento</option>
    <option value="list-events">Listar eventos</option>
    <option value="update-event">Actualizar evento</option>
    <option value="delete-event">Eliminar evento</option>
    <option value="check-availability">Verificar disponibilidad</option>
  </Select>
  
  <Input 
    label="ID del calendario" 
    value={config.calendarId}
    placeholder="primary"
    hint="Usar 'primary' para calendario principal"
  />
  
  {(config.module === 'create-event' || config.module === 'update-event') && (
    <>
      <Input 
        label="Título del evento" 
        value={config.eventTitle}
        placeholder="Reunión con {{nombre_cliente}}"
        hint="Puedes usar {{variables}}"
      />
      
      <TextArea 
        label="Descripción" 
        value={config.eventDescription}
        placeholder="Detalles del evento..."
      />
      
      <Input 
        label="Fecha/hora inicio" 
        value={config.startDateTime}
        type="datetime-local"
        hint="O usa variable: {{fecha_reserva}}"
      />
      
      <Input 
        label="Fecha/hora fin" 
        value={config.endDateTime}
        type="datetime-local"
      />
      
      <Input 
        label="Ubicación" 
        value={config.location}
        placeholder="Av. Corrientes 1234, CABA"
      />
      
      <Input 
        label="Invitados (emails separados por coma)" 
        value={config.attendees?.join(', ')}
        placeholder="cliente@email.com, admin@empresa.com"
      />
    </>
  )}
  
  {config.module === 'list-events' && (
    <>
      <Input 
        label="Desde (fecha)" 
        value={config.timeMin}
        type="date"
      />
      
      <Input 
        label="Hasta (fecha)" 
        value={config.timeMax}
        type="date"
      />
      
      <Input 
        label="Máximo de eventos" 
        value={config.maxResults}
        type="number"
        placeholder="10"
      />
    </>
  )}
  
  {(config.module === 'update-event' || config.module === 'delete-event') && (
    <Input 
      label="ID del evento" 
      value={config.eventId}
      placeholder="{{event_id}}"
      hint="Usar variable del evento creado anteriormente"
    />
  )}
  
  <Input 
    label="Guardar resultado en" 
    value={config.outputVariable}
    placeholder="calendar_event"
  />
</NodeConfigPanel>
```

---

## 🗄️ Base de Datos - Schema

Utiliza el mismo modelo `OAuthConfiguration` que Google Sheets (ver documentación de Google Sheets), pero con `service: 'calendar'`:

```typescript
// Ejemplo de documento en MongoDB
{
  _id: ObjectId("..."),
  empresaId: "JFC Techno",
  provider: "google",
  service: "calendar",  // ← Diferencia clave
  accessToken: "encrypted_token...",
  refreshToken: "encrypted_refresh_token...",
  tokenExpiry: ISODate("2026-02-01T15:30:00Z"),
  userEmail: "admin@jfctechno.com",
  userName: "Admin JFC",
  scopes: [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events"
  ],
  isActive: true,
  lastUsed: ISODate("2026-01-31T12:00:00Z"),
  createdAt: ISODate("2026-01-30T10:00:00Z"),
  updatedAt: ISODate("2026-01-31T12:00:00Z")
}
```

---

## 🔧 Backend - Implementación

### 1. Servicio Google Calendar

```typescript
// services/googleCalendarService.ts
import { google } from 'googleapis';
import { OAuthConfigurationModel } from '../models/OAuthConfiguration.js';
import { decrypt } from '../utils/encryption.js';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Obtener cliente autenticado (mismo que Sheets)
async function getAuthenticatedClient(oauthConfigId: string) {
  const config = await OAuthConfigurationModel.findById(oauthConfigId);
  
  if (!config || !config.isActive) {
    throw new Error('Configuración OAuth no encontrada o inactiva');
  }
  
  const accessToken = await decrypt(config.accessToken);
  const refreshToken = await decrypt(config.refreshToken);
  
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: config.tokenExpiry.getTime()
  });
  
  // Refrescar token si expiró
  if (config.tokenExpiry < new Date()) {
    console.log('🔄 Token expirado, refrescando...');
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    await OAuthConfigurationModel.findByIdAndUpdate(oauthConfigId, {
      accessToken: credentials.access_token,
      tokenExpiry: new Date(credentials.expiry_date || Date.now() + 3600000),
      lastUsed: new Date()
    });
    
    oauth2Client.setCredentials(credentials);
  } else {
    await OAuthConfigurationModel.findByIdAndUpdate(oauthConfigId, {
      lastUsed: new Date()
    });
  }
  
  return google.calendar({ version: 'v3', auth: oauth2Client });
}

// Crear evento
export async function createCalendarEvent(params: {
  oauthConfigId: string;
  calendarId?: string;
  eventTitle: string;
  eventDescription?: string;
  startDateTime: string;
  endDateTime: string;
  location?: string;
  attendees?: string[];
  timeZone?: string;
}) {
  try {
    const calendar = await getAuthenticatedClient(params.oauthConfigId);
    
    const event = {
      summary: params.eventTitle,
      description: params.eventDescription,
      location: params.location,
      start: {
        dateTime: params.startDateTime,
        timeZone: params.timeZone || 'America/Argentina/Buenos_Aires'
      },
      end: {
        dateTime: params.endDateTime,
        timeZone: params.timeZone || 'America/Argentina/Buenos_Aires'
      },
      attendees: params.attendees?.map(email => ({ email })),
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 }
        ]
      }
    };
    
    const response = await calendar.events.insert({
      calendarId: params.calendarId || 'primary',
      requestBody: event,
      sendUpdates: 'all' // Enviar invitaciones
    });
    
    console.log('✅ Evento creado:', response.data.id);
    
    return {
      success: true,
      eventId: response.data.id,
      htmlLink: response.data.htmlLink,
      event: {
        id: response.data.id,
        title: response.data.summary,
        start: response.data.start?.dateTime,
        end: response.data.end?.dateTime,
        link: response.data.htmlLink
      }
    };
  } catch (error: any) {
    console.error('❌ Error creando evento:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Listar eventos
export async function listCalendarEvents(params: {
  oauthConfigId: string;
  calendarId?: string;
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
}) {
  try {
    const calendar = await getAuthenticatedClient(params.oauthConfigId);
    
    const response = await calendar.events.list({
      calendarId: params.calendarId || 'primary',
      timeMin: params.timeMin || new Date().toISOString(),
      timeMax: params.timeMax,
      maxResults: params.maxResults || 10,
      singleEvents: true,
      orderBy: 'startTime'
    });
    
    const events = response.data.items?.map(event => ({
      id: event.id,
      title: event.summary,
      description: event.description,
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      location: event.location,
      link: event.htmlLink,
      attendees: event.attendees?.map(a => a.email)
    })) || [];
    
    console.log(`✅ Eventos encontrados: ${events.length}`);
    
    return {
      success: true,
      events,
      count: events.length
    };
  } catch (error: any) {
    console.error('❌ Error listando eventos:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Actualizar evento
export async function updateCalendarEvent(params: {
  oauthConfigId: string;
  calendarId?: string;
  eventId: string;
  eventTitle?: string;
  eventDescription?: string;
  startDateTime?: string;
  endDateTime?: string;
  location?: string;
  attendees?: string[];
}) {
  try {
    const calendar = await getAuthenticatedClient(params.oauthConfigId);
    
    // Obtener evento actual
    const currentEvent = await calendar.events.get({
      calendarId: params.calendarId || 'primary',
      eventId: params.eventId
    });
    
    // Actualizar solo campos proporcionados
    const updatedEvent: any = {
      summary: params.eventTitle || currentEvent.data.summary,
      description: params.eventDescription !== undefined ? params.eventDescription : currentEvent.data.description,
      location: params.location !== undefined ? params.location : currentEvent.data.location
    };
    
    if (params.startDateTime) {
      updatedEvent.start = {
        dateTime: params.startDateTime,
        timeZone: 'America/Argentina/Buenos_Aires'
      };
    }
    
    if (params.endDateTime) {
      updatedEvent.end = {
        dateTime: params.endDateTime,
        timeZone: 'America/Argentina/Buenos_Aires'
      };
    }
    
    if (params.attendees) {
      updatedEvent.attendees = params.attendees.map(email => ({ email }));
    }
    
    const response = await calendar.events.update({
      calendarId: params.calendarId || 'primary',
      eventId: params.eventId,
      requestBody: updatedEvent,
      sendUpdates: 'all'
    });
    
    console.log('✅ Evento actualizado:', response.data.id);
    
    return {
      success: true,
      eventId: response.data.id,
      htmlLink: response.data.htmlLink
    };
  } catch (error: any) {
    console.error('❌ Error actualizando evento:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Eliminar evento
export async function deleteCalendarEvent(params: {
  oauthConfigId: string;
  calendarId?: string;
  eventId: string;
}) {
  try {
    const calendar = await getAuthenticatedClient(params.oauthConfigId);
    
    await calendar.events.delete({
      calendarId: params.calendarId || 'primary',
      eventId: params.eventId,
      sendUpdates: 'all'
    });
    
    console.log('✅ Evento eliminado:', params.eventId);
    
    return {
      success: true,
      message: 'Evento eliminado correctamente'
    };
  } catch (error: any) {
    console.error('❌ Error eliminando evento:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Verificar disponibilidad
export async function checkAvailability(params: {
  oauthConfigId: string;
  calendarId?: string;
  timeMin: string;
  timeMax: string;
}) {
  try {
    const calendar = await getAuthenticatedClient(params.oauthConfigId);
    
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: params.timeMin,
        timeMax: params.timeMax,
        items: [{ id: params.calendarId || 'primary' }]
      }
    });
    
    const calendarData = response.data.calendars?.[params.calendarId || 'primary'];
    const busySlots = calendarData?.busy || [];
    
    const isFree = busySlots.length === 0;
    
    console.log(`✅ Disponibilidad verificada: ${isFree ? 'LIBRE' : 'OCUPADO'}`);
    
    return {
      success: true,
      isFree,
      busySlots: busySlots.map(slot => ({
        start: slot.start,
        end: slot.end
      }))
    };
  } catch (error: any) {
    console.error('❌ Error verificando disponibilidad:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
```

### 2. Executor del Nodo

```typescript
// services/nodeExecutors/GoogleCalendarExecutor.ts
import { 
  createCalendarEvent, 
  listCalendarEvents, 
  updateCalendarEvent, 
  deleteCalendarEvent,
  checkAvailability
} from '../googleCalendarService.js';
import { resolveVariables } from '../../utils/variableResolver.js';

export async function executeGoogleCalendarNode(
  nodeConfig: any,
  globalVariables: Record<string, any>
): Promise<{ success: boolean; data?: any; error?: string }> {
  
  console.log('📅 [GOOGLE CALENDAR] Ejecutando nodo...');
  
  const { 
    module, 
    oauthConfigId, 
    calendarId,
    eventTitle,
    eventDescription,
    startDateTime,
    endDateTime,
    location,
    attendees,
    timeMin,
    timeMax,
    maxResults,
    eventId,
    outputVariable 
  } = nodeConfig;
  
  if (!oauthConfigId) {
    return { success: false, error: 'No hay configuración OAuth' };
  }
  
  let result: any;
  
  switch (module) {
    case 'create-event':
      result = await createCalendarEvent({
        oauthConfigId,
        calendarId: calendarId || 'primary',
        eventTitle: resolveVariables(eventTitle, globalVariables),
        eventDescription: eventDescription ? resolveVariables(eventDescription, globalVariables) : undefined,
        startDateTime: resolveVariables(startDateTime, globalVariables),
        endDateTime: resolveVariables(endDateTime, globalVariables),
        location: location ? resolveVariables(location, globalVariables) : undefined,
        attendees: attendees ? attendees.map((email: string) => resolveVariables(email, globalVariables)) : undefined
      });
      break;
      
    case 'list-events':
      result = await listCalendarEvents({
        oauthConfigId,
        calendarId: calendarId || 'primary',
        timeMin: timeMin ? resolveVariables(timeMin, globalVariables) : undefined,
        timeMax: timeMax ? resolveVariables(timeMax, globalVariables) : undefined,
        maxResults: maxResults || 10
      });
      break;
      
    case 'update-event':
      result = await updateCalendarEvent({
        oauthConfigId,
        calendarId: calendarId || 'primary',
        eventId: resolveVariables(eventId, globalVariables),
        eventTitle: eventTitle ? resolveVariables(eventTitle, globalVariables) : undefined,
        eventDescription: eventDescription ? resolveVariables(eventDescription, globalVariables) : undefined,
        startDateTime: startDateTime ? resolveVariables(startDateTime, globalVariables) : undefined,
        endDateTime: endDateTime ? resolveVariables(endDateTime, globalVariables) : undefined,
        location: location ? resolveVariables(location, globalVariables) : undefined,
        attendees: attendees ? attendees.map((email: string) => resolveVariables(email, globalVariables)) : undefined
      });
      break;
      
    case 'delete-event':
      result = await deleteCalendarEvent({
        oauthConfigId,
        calendarId: calendarId || 'primary',
        eventId: resolveVariables(eventId, globalVariables)
      });
      break;
      
    case 'check-availability':
      result = await checkAvailability({
        oauthConfigId,
        calendarId: calendarId || 'primary',
        timeMin: resolveVariables(timeMin, globalVariables),
        timeMax: resolveVariables(timeMax, globalVariables)
      });
      break;
      
    default:
      return { success: false, error: `Módulo no soportado: ${module}` };
  }
  
  // Guardar resultado en variable global
  if (result.success && outputVariable) {
    globalVariables[outputVariable] = result;
  }
  
  console.log(`✅ [GOOGLE CALENDAR] Módulo ${module} ejecutado`);
  
  return result;
}
```

---

## 📝 Ejemplos de Uso

### Ejemplo 1: Reserva de Turno Automática

```javascript
// Flujo: Cliente reserva turno
[GPT Formateador] → Extrae: fecha, hora, nombre_cliente, email_cliente
    ↓
[Google Calendar - Check Availability]
    Config:
    - timeMin: "{{fecha}}T{{hora}}:00-03:00"
    - timeMax: "{{fecha}}T{{hora_fin}}:00-03:00"
    - outputVariable: "disponibilidad"
    ↓
[Router] → ¿Está disponible?
    ├─ [disponibilidad.isFree equals true] → [Google Calendar - Create Event]
    │                                            Config:
    │                                            - eventTitle: "Turno - {{nombre_cliente}}"
    │                                            - startDateTime: "{{fecha}}T{{hora}}:00-03:00"
    │                                            - endDateTime: "{{fecha}}T{{hora_fin}}:00-03:00"
    │                                            - attendees: ["{{email_cliente}}", "admin@empresa.com"]
    │                                            - outputVariable: "evento_creado"
    │                                            ↓
    │                                        [WhatsApp] → "✅ Turno confirmado para {{fecha}} a las {{hora}}"
    │
    └─ [disponibilidad.isFree equals false] → [WhatsApp] → "❌ Ese horario no está disponible. Horarios ocupados: {{disponibilidad.busySlots}}"
```

### Ejemplo 2: Listar Próximos Eventos

```javascript
// Flujo: Usuario pregunta "¿Qué turnos tengo?"
[Google Calendar - List Events]
    Config:
    - timeMin: "{{fecha_actual}}"
    - timeMax: "{{fecha_en_7_dias}}"
    - maxResults: 5
    - outputVariable: "mis_eventos"
    ↓
[Router] → ¿Tiene eventos?
    ├─ [mis_eventos.count > 0] → [GPT Transform] → Formatea lista de eventos
    │                                  ↓
    │                              [WhatsApp] → "📅 Tus próximos turnos:\n{{eventos_formateados}}"
    │
    └─ [mis_eventos.count equals 0] → [WhatsApp] → "No tienes turnos programados"
```

### Ejemplo 3: Cancelar Turno

```javascript
// Flujo: Cliente quiere cancelar turno
[GPT Formateador] → Extrae: event_id (del mensaje o historial)
    ↓
[Google Calendar - Delete Event]
    Config:
    - eventId: "{{event_id}}"
    - outputVariable: "resultado_cancelacion"
    ↓
[Router] → ¿Se canceló?
    ├─ [resultado_cancelacion.success equals true] → [WhatsApp] → "✅ Tu turno fue cancelado correctamente"
    └─ [resultado_cancelacion.success equals false] → [WhatsApp] → "❌ Error al cancelar: {{resultado_cancelacion.error}}"
```

### Ejemplo 4: Reprogramar Turno

```javascript
// Flujo: Cliente quiere cambiar fecha/hora
[GPT Formateador] → Extrae: event_id, nueva_fecha, nueva_hora
    ↓
[Google Calendar - Update Event]
    Config:
    - eventId: "{{event_id}}"
    - startDateTime: "{{nueva_fecha}}T{{nueva_hora}}:00-03:00"
    - endDateTime: "{{nueva_fecha}}T{{nueva_hora_fin}}:00-03:00"
    - outputVariable: "evento_actualizado"
    ↓
[WhatsApp] → "✅ Turno reprogramado para {{nueva_fecha}} a las {{nueva_hora}}"
```

---

## 🔐 Seguridad

### Scopes Requeridos

```javascript
const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar',          // Acceso completo
  'https://www.googleapis.com/auth/calendar.events'    // Solo eventos
];
```

### Permisos por Módulo

| Módulo | Scope Mínimo |
|--------|--------------|
| `create-event` | `calendar.events` |
| `list-events` | `calendar.readonly` |
| `update-event` | `calendar.events` |
| `delete-event` | `calendar.events` |
| `check-availability` | `calendar.readonly` |

### Encriptación

Los tokens se encriptan usando el mismo sistema que Google Sheets (ver `utils/encryption.ts`).

---

## 🐛 Troubleshooting

### Error: "Calendar not found"

**Solución:** Verificar que `calendarId` sea correcto. Usar `'primary'` para calendario principal.

### Error: "Invalid datetime format"

**Solución:** Usar formato ISO 8601: `"2026-02-01T10:00:00-03:00"` (incluir timezone).

### Error: "Insufficient permissions"

**Solución:** Reconectar OAuth con los scopes correctos.

### Eventos no se crean

**Solución:** Verificar que las fechas sean futuras y que el formato sea correcto.

### Invitaciones no se envían

**Solución:** Verificar que `sendUpdates: 'all'` esté configurado en el servicio.

---

## 🎯 Mejores Prácticas

### 1. Validar Fechas

Siempre validar que las fechas sean futuras antes de crear eventos:

```javascript
// En GPT Formateador
"Valida que la fecha {{fecha}} sea posterior a hoy"
```

### 2. Usar Timezone Correcto

Especificar timezone explícitamente:

```javascript
timeZone: 'America/Argentina/Buenos_Aires'
```

### 3. Guardar Event IDs

Guardar el `eventId` en variables globales para poder actualizar/eliminar después:

```javascript
globalVariables.ultimo_evento_id = result.eventId;
```

### 4. Verificar Disponibilidad

Siempre verificar disponibilidad antes de crear eventos para evitar conflictos.

### 5. Notificaciones

Configurar recordatorios automáticos en los eventos:

```javascript
reminders: {
  useDefault: false,
  overrides: [
    { method: 'email', minutes: 24 * 60 },  // 1 día antes
    { method: 'popup', minutes: 30 }         // 30 min antes
  ]
}
```

---

## 📚 Referencias

- [Google Calendar API Documentation](https://developers.google.com/calendar/api)
- [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Calendar API Events Resource](https://developers.google.com/calendar/api/v3/reference/events)
- [Freebusy API](https://developers.google.com/calendar/api/v3/reference/freebusy)

---

**Creado:** 2026-01-31  
**Última actualización:** 2026-01-31  
**Versión:** 1.0
