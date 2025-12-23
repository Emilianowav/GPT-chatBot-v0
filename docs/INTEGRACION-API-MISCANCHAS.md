# 🏟️ Integración API - Mis Canchas

## Objetivo
Integrar el chatbot de WhatsApp con el sistema de gestión de Mis Canchas para:
- Consultar disponibilidad de canchas en tiempo real
- Crear reservas directamente en el sistema
- Generar links de pago de Mercado Pago para señas
- Confirmar reservas automáticamente al recibir el pago

---

## 🌐 URL Base de la API

**Producción (via ngrok):**
```
https://venita-unjailed-multifariously.ngrok-free.dev/api/v1
```

**Local:**
```
http://localhost:8001/api/v1
```

---

## 📋 Flujo de Reserva Completo

```
Usuario                    Bot WhatsApp                API Mis Canchas           Mercado Pago
   │                            │                            │                        │
   │──── "Hola" ───────────────>│                            │                        │
   │<─── Bienvenida + Deportes ─│                            │                        │
   │                            │                            │                        │
   │──── "Paddle" ─────────────>│                            │                        │
   │<─── ¿Qué fecha? ──────────│                            │                        │
   │                            │                            │                        │
   │──── "mañana" ─────────────>│                            │                        │
   │<─── ¿Hora y duración? ────│                            │                        │
   │                            │                            │                        │
   │──── "19:00, 1 hora" ──────>│                            │                        │
   │                            │── GET /disponibilidad ────>│                        │
   │                            │<── Canchas disponibles ────│                        │
   │<─── Canchas disponibles ──│                            │                        │
   │                            │                            │                        │
   │──── "Cancha 1" ───────────>│                            │                        │
   │                            │── POST /reservas/pre-crear >│                        │
   │                            │<── Reserva pre-creada ─────│                        │
   │                            │                            │                        │
   │                            │── POST /mp/payments/preference ────────────────────>│
   │                            │<── Link de pago ───────────────────────────────────│
   │<─── Resumen + Link pago ──│                            │                        │
   │                            │                            │                        │
   │──── [Paga en MP] ─────────────────────────────────────────────────────────────>│
   │                            │                            │                        │
   │                            │<── Webhook pago aprobado ──────────────────────────│
   │                            │── PUT /reservas/:id/confirmar ──>│                  │
   │                            │<── Reserva confirmada ─────│                        │
   │<─── ¡Reserva confirmada! ─│                            │                        │
```

---

## 🔐 Autenticación

Todos los endpoints requieren autenticación via API Key en el header:

```http
X-API-Key: mc_3f9580c86f9529a6f74d48bdacd1764c236bd5c449a40f6510991e6363bc268a
```

La API Key se configura en el establecimiento (campo `apiKey` en la tabla `establishments`).

---

## 🔌 Endpoints Disponibles

### 1. Obtener Deportes Disponibles
```http
GET /api/v1/deportes
```

**Response:**
```json
{
  "success": true,
  "deportes": [
    { "id": "paddle", "nombre": "Paddle", "icono": "🎾" },
    { "id": "futbol5", "nombre": "Fútbol 5", "icono": "⚽" },
    { "id": "futbol7", "nombre": "Fútbol 7", "icono": "⚽" },
    { "id": "tenis", "nombre": "Tenis", "icono": "🎾" }
  ]
}
```

---

### 2. Consultar Disponibilidad
```http
GET /api/v1/disponibilidad
```

**Query Parameters:**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `fecha` | string | ✅ | Fecha en formato `YYYY-MM-DD` |
| `deporte` | string | ✅ | ID del deporte (ej: `paddle`) |
| `hora_inicio` | string | ❌ | Hora específica `HH:MM` (opcional) |
| `duracion` | number | ❌ | Duración en minutos (60, 90, 120). Default: 60 |

**Ejemplo:**
```
GET /api/v1/disponibilidad?fecha=2025-12-23&deporte=paddle&duracion=60
```

**Response - Con disponibilidad:**
```json
{
  "success": true,
  "fecha": "2025-12-23",
  "deporte": "paddle",
  "canchas_disponibles": [
    {
      "id": "uuid-cancha-1",
      "nombre": "Cancha 1 - Paddle",
      "tipo": "techada",
      "horarios_disponibles": [
        { "hora": "08:00", "duraciones": [60, 90, 120] },
        { "hora": "09:00", "duraciones": [60, 90, 120] },
        { "hora": "19:00", "duraciones": [60] },
        { "hora": "20:00", "duraciones": [60, 90, 120] }
      ],
      "precio_hora": 15000,
      "precio_hora_y_media": 20000,
      "precio_dos_horas": 25000
    }
  ]
}
```

**Response - Sin disponibilidad:**
```json
{
  "success": true,
  "fecha": "2025-12-23",
  "deporte": "paddle",
  "canchas_disponibles": []
}
```

---

### 3. Crear Reserva
```http
POST /api/v1/bookings
```

**Headers:**
```
X-API-Key: mc_3f9580c86f9529a6f74d48bdacd1764c236bd5c449a40f6510991e6363bc268a
Content-Type: application/json
```

**Request Body:**
```json
{
  "cancha_id": "9bd901b5-d922-43b8-ba8e-12e0fb983a49",
  "fecha": "2025-12-23",
  "hora_inicio": "19:00",
  "duracion": 60,
  "cliente": {
    "nombre": "Juan Pérez",
    "telefono": "5493794123456",
    "email": "juan@email.com"
  },
  "origen": "whatsapp"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-de-la-reserva",
    "courtId": "9bd901b5-d922-43b8-ba8e-12e0fb983a49",
    "date": "2025-12-23",
    "startTime": "19:00",
    "endTime": "20:00",
    "duration": 60,
    "status": "confirmed",
    "clientName": "Juan Pérez",
    "clientPhone": "5493794123456",
    "clientEmail": "juan@email.com",
    "origin": "whatsapp",
    "createdAt": "2025-12-22T23:00:00.000Z"
  }
}
```

**Errores comunes:**
- **401 Unauthorized**: API Key incorrecta o faltante
- **400 Bad Request**: Datos faltantes o formato incorrecto
- **409 Conflict**: La cancha ya está reservada en ese horario
- **404 Not Found**: La cancha no existe

---

### 4. Confirmar Reserva (Post-Pago)
```http
PUT /api/v1/reservas/:reserva_id/confirmar
```

**Request Body:**
```json
{
  "pago": {
    "id": "mp_payment_123456",
    "monto": 5000,
    "metodo": "mercadopago",
    "estado": "approved"
  }
}
```

**Response:**
```json
{
  "success": true,
  "reserva_id": "uuid-reserva",
  "estado": "confirmada",
  "codigo_reserva": "MC-2025-ABC12345",
  "mensaje": "Reserva confirmada exitosamente"
}
```

---

### 5. Cancelar Reserva
```http
DELETE /api/v1/reservas/:reserva_id
```

**Response:**
```json
{
  "success": true,
  "message": "Reserva cancelada"
}
```

---

### 6. Obtener Precios
```http
GET /api/v1/precios
```

**Query Parameters:**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `deporte` | string | ❌ | Filtrar por deporte |
| `cancha_id` | string | ❌ | Filtrar por cancha específica |

**Response:**
```json
{
  "success": true,
  "precios": [
    {
      "cancha_id": "uuid-cancha-1",
      "cancha_nombre": "Cancha 1 - Paddle",
      "deporte": "Paddle",
      "precios": {
        "60": 15000,
        "90": 20000,
        "120": 25000
      },
      "seña_porcentaje": 33
    }
  ],
  "seña_minima": 5000
}
```

---

## 💳 Integración Mercado Pago

El sistema ya tiene integración con Mercado Pago. Los datos de MP están configurados por establecimiento:

| Campo en Establishment | Descripción |
|------------------------|-------------|
| `mpAccessToken` | Token OAuth de Mercado Pago |
| `mpPublicKey` | Clave pública |
| `mpActive` | Si la integración está activa |

### Webhook de Pago
```http
POST /api/mp/webhooks
```

Este endpoint ya existe y procesa automáticamente las notificaciones de Mercado Pago.

---

## � Manejo de Errores

```json
{
  "success": false,
  "error": {
    "code": "SLOT_NOT_AVAILABLE",
    "message": "El horario seleccionado ya no está disponible"
  }
}
```

**Códigos de error:**
| Código | Descripción |
|--------|-------------|
| `UNAUTHORIZED` | API Key no proporcionada |
| `INVALID_API_KEY` | API Key inválida |
| `INVALID_PARAMS` | Parámetros faltantes o inválidos |
| `SLOT_NOT_AVAILABLE` | Horario ya ocupado |
| `CANCHA_NOT_FOUND` | Cancha no existe |
| `RESERVATION_NOT_FOUND` | Reserva no encontrada |
| `RESERVATION_EXPIRED` | Pre-reserva expiró |
| `SERVER_ERROR` | Error interno del servidor |

---

## 🚀 Configuración Inicial

### 1. Generar API Key para el establecimiento

Ejecutar en la base de datos o via endpoint admin:
```sql
UPDATE establishments 
SET "apiKey" = 'tu-api-key-segura-aqui' 
WHERE id = 'uuid-del-establecimiento';
```

### 2. Configurar en el Bot de WhatsApp

```env
MISCANCHAS_API_URL=https://venita-unjailed-multifariously.ngrok-free.dev/api/v1
MISCANCHAS_API_KEY=tu-api-key-segura-aqui
```

---

## ✅ Estado de Implementación

- [x] GET /api/v1/deportes
- [x] GET /api/v1/disponibilidad
- [x] POST /api/v1/reservas/pre-crear
- [x] PUT /api/v1/reservas/:id/confirmar
- [x] DELETE /api/v1/reservas/:id
- [x] GET /api/v1/precios
- [x] Autenticación por API Key
- [x] Integración con modelo de datos existente

---

*Documento actualizado: 22/12/2024*
*API implementada sobre infraestructura existente de sports-booking-backend*
