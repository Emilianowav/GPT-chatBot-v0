# 🛣️ Arquitectura de Rutas API - Documentación Completa

## 📋 Problema Resuelto

**Error 404 al actualizar turnos**: El frontend usaba `/api/calendar/turnos/:id` pero el backend esperaba `/api/modules/calendar/turnos/:id`.

## 🏗️ Estructura de Rutas del Backend

### Registro Principal (app.ts)

```typescript
// Línea 93 en app.ts
app.use("/api/modules/calendar", calendarRoutes);
```

**Ruta base**: `/api/modules/calendar`

### Rutas del Módulo de Calendario (calendarRoutes.ts)

Todas las rutas del calendario se montan bajo `/api/modules/calendar`:

#### 📅 Turnos
```typescript
// Crear turno
POST   /api/modules/calendar/turnos

// Obtener turnos con filtros
GET    /api/modules/calendar/turnos

// Obtener turnos del día
GET    /api/modules/calendar/turnos/hoy

// Obtener estadísticas
GET    /api/modules/calendar/turnos/estadisticas

// Obtener turno por ID
GET    /api/modules/calendar/turnos/:id

// Actualizar turno completo
PUT    /api/modules/calendar/turnos/:id

// Actualizar estado de turno
PATCH  /api/modules/calendar/turnos/:id/estado

// Cancelar turno
DELETE /api/modules/calendar/turnos/:id
```

#### 👤 Agentes
```typescript
// Crear agente
POST   /api/modules/calendar/agentes

// Obtener agentes
GET    /api/modules/calendar/agentes

// Obtener agentes disponibles
GET    /api/modules/calendar/agentes/disponibles

// Obtener agente por ID
GET    /api/modules/calendar/agentes/:id

// Actualizar agente
PATCH  /api/modules/calendar/agentes/:id

// Eliminar agente
DELETE /api/modules/calendar/agentes/:id

// Configurar disponibilidad
PUT    /api/modules/calendar/agentes/:id/disponibilidad
```

#### 📊 Disponibilidad
```typescript
// Obtener horarios del agente
GET    /api/modules/calendar/disponibilidad/:agenteId/horarios

// Obtener slots disponibles
GET    /api/modules/calendar/disponibilidad/:agenteId

// Verificar disponibilidad
POST   /api/modules/calendar/disponibilidad/verificar
```

#### 🔔 Notificaciones
```typescript
// Enviar notificación de prueba
POST   /api/modules/calendar/notificaciones/prueba

// Obtener agentes para selector
GET    /api/modules/calendar/notificaciones/agentes/:empresaId

// Obtener clientes para selector
GET    /api/modules/calendar/notificaciones/clientes/:empresaId
```

#### ⚙️ Configuración
```typescript
// Obtener configuración del módulo
GET    /api/modules/calendar/configuracion/:empresaId

// Guardar configuración del módulo
POST   /api/modules/calendar/configuracion/:empresaId

// Obtener campos personalizados
GET    /api/modules/calendar/configuracion/:empresaId/campos

// Guardar campos personalizados
POST   /api/modules/calendar/configuracion/:empresaId/campos
```

#### 🤖 Bot
```typescript
// Obtener configuración del bot
GET    /api/modules/calendar/bot/:empresaId

// Actualizar configuración del bot
PUT    /api/modules/calendar/bot/:empresaId

// Toggle bot activo/inactivo
PATCH  /api/modules/calendar/bot/:empresaId/toggle
```

## 🎯 Frontend - Uso Correcto

### ✅ Archivo calendarApi.ts (CORRECTO)

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// ✅ CORRECTO - Incluye /modules/
export async function obtenerTurnos(filtros?: any) {
  const response = await fetch(`${API_BASE_URL}/api/modules/calendar/turnos?${params}`, {
    headers: getHeaders()
  });
  return response.json();
}

// ✅ CORRECTO - Incluye /modules/
export async function crearTurno(data: CrearTurnoData) {
  const response = await fetch(`${API_BASE_URL}/api/modules/calendar/turnos`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  return response.json();
}

// ✅ CORRECTO - Incluye /modules/
export async function actualizarEstadoTurno(turnoId: string, estado: string) {
  const response = await fetch(`${API_BASE_URL}/api/modules/calendar/turnos/${turnoId}/estado`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ estado })
  });
  return response.json();
}
```

### ❌ Error Común (INCORRECTO)

```typescript
// ❌ INCORRECTO - Falta /modules/
const response = await fetch(`${apiUrl}/api/calendar/turnos/${id}`, {
  method: 'PUT',
  headers: { ... }
});

// ✅ CORRECTO - Incluye /modules/
const response = await fetch(`${apiUrl}/api/modules/calendar/turnos/${id}`, {
  method: 'PUT',
  headers: { ... }
});
```

## 🔍 Debugging de Rutas

### 1. Verificar Ruta en Backend

```bash
# Buscar cómo se registra la ruta
grep -r "app.use.*calendar" backend/src/

# Resultado:
# app.ts:93: app.use("/api/modules/calendar", calendarRoutes);
```

### 2. Verificar Controlador

```typescript
// turnoController.ts - Línea 201
/**
 * PUT /api/modules/calendar/turnos/:id
 * Actualizar turno completo
 */
export async function actualizarTurno(req: Request, res: Response) {
  // ...
}
```

### 3. Verificar Ruta en Router

```typescript
// calendarRoutes.ts - Línea 41
router.put('/turnos/:id', turnoController.actualizarTurno);
```

### 4. Ruta Completa Resultante

```
app.use("/api/modules/calendar", ...)  +  router.put('/turnos/:id', ...)
                ↓
PUT /api/modules/calendar/turnos/:id
```

## 📊 Mapa Completo de Rutas

```
Backend (Express)
├── /api
│   ├── /modules
│   │   └── /calendar ← Módulo de Calendario
│   │       ├── /turnos
│   │       │   ├── GET    /           (listar)
│   │       │   ├── POST   /           (crear)
│   │       │   ├── GET    /hoy        (del día)
│   │       │   ├── GET    /estadisticas
│   │       │   ├── GET    /:id        (obtener uno)
│   │       │   ├── PUT    /:id        (actualizar)
│   │       │   ├── PATCH  /:id/estado (cambiar estado)
│   │       │   └── DELETE /:id        (cancelar)
│   │       ├── /agentes
│   │       │   ├── GET    /
│   │       │   ├── POST   /
│   │       │   ├── GET    /disponibles
│   │       │   ├── GET    /:id
│   │       │   ├── PATCH  /:id
│   │       │   ├── DELETE /:id
│   │       │   └── PUT    /:id/disponibilidad
│   │       ├── /disponibilidad
│   │       │   ├── GET    /:agenteId/horarios
│   │       │   ├── GET    /:agenteId
│   │       │   └── POST   /verificar
│   │       ├── /notificaciones
│   │       │   ├── POST   /prueba
│   │       │   ├── GET    /agentes/:empresaId
│   │       │   └── GET    /clientes/:empresaId
│   │       ├── /configuracion
│   │       │   ├── GET    /:empresaId
│   │       │   ├── POST   /:empresaId
│   │       │   ├── GET    /:empresaId/campos
│   │       │   └── POST   /:empresaId/campos
│   │       └── /bot
│   │           ├── GET    /:empresaId
│   │           ├── PUT    /:empresaId
│   │           └── PATCH  /:empresaId/toggle
│   ├── /conversaciones
│   ├── /openai
│   ├── /whatsapp
│   └── /flows
```

## 🛡️ Middleware de Autenticación

**TODAS** las rutas del módulo de calendario requieren autenticación:

```typescript
// calendarRoutes.ts - Línea 15
router.use(authenticate);
```

**Headers requeridos**:
```typescript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer <token>'
}
```

## 🔧 Controladores y Servicios

### Flujo de una Petición

```
Frontend
    ↓
PUT /api/modules/calendar/turnos/:id
    ↓
Express Router (calendarRoutes.ts)
    ↓
Middleware: authenticate
    ↓
Controller: turnoController.actualizarTurno
    ↓
Service: turnoService.actualizarTurno
    ↓
MongoDB: TurnoModel.findByIdAndUpdate
    ↓
Response: { success: true, turno: {...} }
```

### Estructura de Archivos

```
backend/src/
├── app.ts                              ← Registro de rutas principales
├── modules/
│   └── calendar/
│       ├── routes/
│       │   ├── calendarRoutes.ts       ← Router principal del módulo
│       │   ├── configuracionRoutes.ts  ← Sub-router de configuración
│       │   └── botRoutes.ts            ← Sub-router del bot
│       ├── controllers/
│       │   ├── turnoController.ts      ← Controlador de turnos
│       │   ├── agenteController.ts     ← Controlador de agentes
│       │   ├── disponibilidadController.ts
│       │   └── notificacionController.ts
│       ├── services/
│       │   ├── turnoService.ts         ← Lógica de negocio
│       │   ├── agenteService.ts
│       │   └── disponibilidadService.ts
│       └── models/
│           ├── Turno.ts                ← Modelo de MongoDB
│           ├── Agente.ts
│           └── ConfiguracionModulo.ts
```

## 🎯 Reglas de Oro

### 1. **SIEMPRE usar `/api/modules/calendar`**
```typescript
// ✅ CORRECTO
fetch(`${API_URL}/api/modules/calendar/turnos`)

// ❌ INCORRECTO
fetch(`${API_URL}/api/calendar/turnos`)
```

### 2. **Usar calendarApi.ts para llamadas**
```typescript
// ✅ CORRECTO - Usar funciones del API
import { obtenerTurnos, crearTurno } from '@/lib/calendarApi';
const turnos = await obtenerTurnos({ estado: 'pendiente' });

// ❌ INCORRECTO - Fetch directo
const response = await fetch(`${API_URL}/api/modules/calendar/turnos`);
```

### 3. **Incluir token de autenticación**
```typescript
// ✅ CORRECTO
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
}

// ❌ INCORRECTO - Sin token
headers: {
  'Content-Type': 'application/json'
}
```

### 4. **Manejar errores correctamente**
```typescript
// ✅ CORRECTO
try {
  const response = await fetch(url, options);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error en la petición');
  }
  return await response.json();
} catch (error) {
  console.error('Error:', error);
  throw error;
}
```

## 🧪 Testing de Rutas

### Verificar que una ruta existe

```bash
# Desde el frontend, abrir DevTools Console
fetch('http://localhost:3000/api/modules/calendar/turnos', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
  }
})
.then(r => r.json())
.then(console.log)
```

### Logs de Debug

```typescript
// En el frontend
console.log('🔧 Actualizando turno:', turnoId);
console.log('📡 URL:', url);
console.log('📤 Body:', body);
console.log('📥 Response status:', response.status);

// En el backend (turnoController.ts)
console.log('📥 Request params:', req.params);
console.log('📥 Request body:', req.body);
console.log('👤 User:', req.user);
```

## 📝 Checklist de Corrección

Cuando agregues una nueva ruta:

- [ ] Definir en el router (`calendarRoutes.ts`)
- [ ] Crear controlador (`turnoController.ts`)
- [ ] Crear servicio (`turnoService.ts`)
- [ ] Agregar función en `calendarApi.ts` (frontend)
- [ ] Verificar ruta completa incluye `/api/modules/calendar`
- [ ] Agregar autenticación si es necesario
- [ ] Documentar en este archivo
- [ ] Probar con Postman o DevTools
- [ ] Agregar manejo de errores
- [ ] Agregar logs de debug

## 🔗 Referencias

- **Backend**: `backend/src/app.ts` (línea 93)
- **Router**: `backend/src/modules/calendar/routes/calendarRoutes.ts`
- **Frontend API**: `front_crm/bot_crm/src/lib/calendarApi.ts`
- **Controladores**: `backend/src/modules/calendar/controllers/`
- **Servicios**: `backend/src/modules/calendar/services/`

---

**Última actualización**: 4 de noviembre de 2025  
**Estado**: ✅ Documentación completa y verificada  
**Problema resuelto**: Error 404 en actualización de turnos
