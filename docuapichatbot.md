# 📘 API INTERCAPITAL - REFERENCIA COMPLETA PARA CHATBOT

## 🎯 Información Crítica

**Base URL:** `https://app1.intercapital.ar/api/chatbot`

**Autenticación:** Header `x-api-key`

**API Key:** `2e590cf1f4fd1144f1ce0622347c046a0fa3e2bd786114273094049b6cd55c0a`

**Content-Type:** `application/json`

---

## 🔌 ENDPOINTS DISPONIBLES

### 1. Health Check (Sin autenticación)

```http
GET /api/chatbot/health
```

**Headers:** Ninguno requerido

**Response 200:**
```json
{
  "status": "OK",
  "service": "chatbot-api",
  "timestamp": "2026-01-02T12:00:00.000Z",
  "version": "1.0.0"
}
```

**Ejemplo cURL:**
```bash
curl https://app1.intercapital.ar/api/chatbot/health
```

---

### 2. Validar Usuario

```http
GET /api/chatbot/usuarios/validate?comitente=NUMERO
```

**Headers:**
```
x-api-key: 2e590cf1f4fd1144f1ce0622347c046a0fa3e2bd786114273094049b6cd55c0a
```

**Query Parameters:**
- `comitente` (required, integer): Número de comitente a validar

**Response 200 (Usuario existe y activo):**
```json
{
  "success": true,
  "data": {
    "comitente": 18728,
    "exists": true,
    "nombre": "Juan Pérez",
    "estado": "ACTIVO",
    "puede_operar": true
  }
}
```

**Response 404 (Usuario no existe):**
```json
{
  "success": false,
  "error": "USER_NOT_FOUND",
  "message": "Comitente no encontrado"
}
```

**Response 200 (Usuario existe pero inactivo):**
```json
{
  "success": true,
  "data": {
    "comitente": 18728,
    "exists": true,
    "nombre": "Juan Pérez",
    "estado": "PENDIENTE",
    "puede_operar": false
  }
}
```

**Ejemplo cURL:**
```bash
curl -H "x-api-key: 2e590cf1f4fd1144f1ce0622347c046a0fa3e2bd786114273094049b6cd55c0a" \
  "https://app1.intercapital.ar/api/chatbot/usuarios/validate?comitente=18728"
```

**Ejemplo Node.js:**
```javascript
const response = await axios.get(
  'https://app1.intercapital.ar/api/chatbot/usuarios/validate',
  {
    params: { comitente: 18728 },
    headers: {
      'x-api-key': '2e590cf1f4fd1144f1ce0622347c046a0fa3e2bd786114273094049b6cd55c0a'
    }
  }
);
```

---

### 3. Obtener Datos de Usuario

```http
GET /api/chatbot/usuarios/:comitente
```

**Headers:**
```
x-api-key: 2e590cf1f4fd1144f1ce0622347c046a0fa3e2bd786114273094049b6cd55c0a
```

**URL Parameters:**
- `comitente` (required, integer): Número de comitente

**Response 200:**
```json
{
  "success": true,
  "data": {
    "comitente": 18728,
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "telefono": "+5491112345678",
    "estado": "ACTIVO",
    "tipo_cuenta": "PERSONA_FISICA",
    "created_at": "2025-01-15T10:00:00.000Z"
  }
}
```

**Response 404:**
```json
{
  "success": false,
  "error": "USER_NOT_FOUND",
  "message": "Usuario no encontrado"
}
```

**Ejemplo cURL:**
```bash
curl -H "x-api-key: 2e590cf1f4fd1144f1ce0622347c046a0fa3e2bd786114273094049b6cd55c0a" \
  "https://app1.intercapital.ar/api/chatbot/usuarios/18728"
```

---

### 4. ⭐ CREAR ORDEN (PRINCIPAL)

```http
POST /api/chatbot/ordenes
```

**Headers:**
```
Content-Type: application/json
x-api-key: 2e590cf1f4fd1144f1ce0622347c046a0fa3e2bd786114273094049b6cd55c0a
```

**⚠️ IMPORTANTE: Los parámetros van en el BODY, NO en query params**

#### Campos del Body

**Campos OBLIGATORIOS:**
```json
{
  "comitente": 18728,           // INTEGER (número, no string)
  "operacion": "COMPRA",        // STRING: "COMPRA", "VENTA", "RETIRO", "DEPOSITO"
  "symbol": "GGAL",             // STRING: símbolo del activo (max 10 caracteres)
  "cantidad": 1,                // NUMBER: cantidad de activos (debe ser > 0)
  "precio": 8370                // NUMBER: precio por unidad (debe ser > 0)
}
```

**Campos OPCIONALES:**
```json
{
  "plazo": "CONTADO",           // STRING: "CONTADO" (default), "24HS", "48HS"
  "tipo_orden": "MERCADO",      // STRING: "MERCADO" (default), "LIMITE"
  "cbu_destino": "1234567...",  // STRING: REQUERIDO solo para operacion="RETIRO"
  "notas": "Orden desde bot",   // STRING: notas adicionales
  "metadata": {                 // OBJECT: metadata del chatbot (opcional)
    "whatsapp_phone": "+549...",
    "conversation_id": "conv_123",
    "message_id": "msg_456"
  }
}
```

#### Request Completo de Ejemplo

```json
{
  "comitente": 18728,
  "operacion": "COMPRA",
  "symbol": "GGAL",
  "cantidad": 1,
  "precio": 8370,
  "plazo": "CONTADO",
  "tipo_orden": "MERCADO",
  "notas": "Orden creada desde WhatsApp",
  "metadata": {
    "whatsapp_phone": "+5491112345678",
    "conversation_id": "conv_abc123",
    "message_id": "msg_xyz789"
  }
}
```

#### Response 201 (Éxito)

```json
{
  "success": true,
  "message": "Orden creada exitosamente. Estado: PENDIENTE",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "orden": 1234,
    "operacion": "COMPRA",
    "estado": "PENDIENTE",
    "symbol": "GGAL",
    "plazo": "CONTADO",
    "cantidad": 1,
    "precio": 8370,
    "monto": 8370,
    "comitente": 18728,
    "nombre_cliente": "Juan Pérez",
    "tipo_orden": "MERCADO",
    "created_at": "2026-01-02T14:30:00.000Z"
  }
}
```

**Campos importantes de la respuesta:**
- `id`: UUID de la orden (para consultas posteriores)
- `orden`: Número secuencial de la orden
- `estado`: Siempre será "PENDIENTE" al crear
- `monto`: Calculado automáticamente (cantidad × precio)
- `nombre_cliente`: Obtenido automáticamente del comitente

#### Response 400 (Error de validación)

```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Error de validación",
  "details": {
    "comitente": "Comitente no encontrado",
    "precio": "Precio debe ser mayor a 0",
    "cantidad": "Cantidad debe ser mayor a 0"
  }
}
```

**Posibles errores de validación:**
- `comitente`: "Comitente es requerido" | "Comitente no encontrado"
- `operacion`: "Operación es requerida" | "Operación debe ser: COMPRA, VENTA, RETIRO, DEPOSITO"
- `symbol`: "Symbol es requerido" | "Symbol demasiado largo (max 10 caracteres)"
- `cantidad`: "Cantidad es requerida" | "Cantidad debe ser mayor a 0"
- `precio`: "Precio es requerido" | "Precio debe ser mayor a 0"
- `plazo`: "Plazo debe ser: CONTADO, 24HS, 48HS"
- `tipo_orden`: "Tipo de orden debe ser: MERCADO, LIMITE"
- `cbu_destino`: "CBU destino es requerido para retiros"
- `monto`: "Monto excede el límite permitido (10M)"

#### Response 403 (Usuario no puede operar)

```json
{
  "success": false,
  "error": "OPERATION_NOT_ALLOWED",
  "message": "Usuario en estado: PENDIENTE"
}
```

#### Response 401 (Error de autenticación)

```json
{
  "success": false,
  "error": "API_KEY_MISSING",
  "message": "API key requerida en header x-api-key"
}
```

```json
{
  "success": false,
  "error": "INVALID_API_KEY",
  "message": "API key inválida o inactiva"
}
```

#### Response 429 (Rate limit excedido)

```json
{
  "success": false,
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Límite de requests excedido",
  "retry_after": 60
}
```

#### Response 500 (Error interno)

```json
{
  "success": false,
  "error": "INTERNAL_ERROR",
  "message": "Error interno del servidor"
}
```

#### Ejemplo cURL CORRECTO

```bash
curl -X POST https://app1.intercapital.ar/api/chatbot/ordenes \
  -H "Content-Type: application/json" \
  -H "x-api-key: 2e590cf1f4fd1144f1ce0622347c046a0fa3e2bd786114273094049b6cd55c0a" \
  -d '{
    "comitente": 18728,
    "operacion": "COMPRA",
    "symbol": "GGAL",
    "cantidad": 1,
    "precio": 8370,
    "plazo": "CONTADO",
    "tipo_orden": "MERCADO",
    "notas": "Orden desde WhatsApp",
    "metadata": {
      "whatsapp_phone": "+5491112345678",
      "conversation_id": "conv_123"
    }
  }'
```

#### Ejemplo Node.js/Axios CORRECTO

```javascript
const axios = require('axios');

async function crearOrden(ordenData) {
  try {
    const response = await axios.post(
      'https://app1.intercapital.ar/api/chatbot/ordenes',
      {
        comitente: 18728,              // NUMBER, no string
        operacion: 'COMPRA',           // STRING uppercase
        symbol: 'GGAL',                // STRING uppercase
        cantidad: 1,                   // NUMBER
        precio: 8370,                  // NUMBER
        plazo: 'CONTADO',              // STRING uppercase (opcional)
        tipo_orden: 'MERCADO',         // STRING uppercase (opcional)
        notas: 'Orden desde WhatsApp', // STRING (opcional)
        metadata: {                    // OBJECT (opcional)
          whatsapp_phone: '+5491112345678',
          conversation_id: 'conv_123'
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': '2e590cf1f4fd1144f1ce0622347c046a0fa3e2bd786114273094049b6cd55c0a'
        }
      }
    );
    
    console.log('✅ Orden creada:', response.data);
    return response.data;
    
  } catch (error) {
    if (error.response) {
      console.error('❌ Error de API:', error.response.data);
      console.error('Status:', error.response.status);
    } else {
      console.error('❌ Error de red:', error.message);
    }
    throw error;
  }
}

// Uso
crearOrden();
```

#### ⚠️ ERRORES COMUNES

**1. Enviar parámetros en query en lugar de body**
```javascript
// ❌ INCORRECTO
axios.post('/ordenes?comitente=18728&symbol=GGAL', {})

// ✅ CORRECTO
axios.post('/ordenes', { comitente: 18728, symbol: 'GGAL' })
```

**2. Enviar comitente como string**
```javascript
// ❌ INCORRECTO
{ "comitente": "18728" }

// ✅ CORRECTO
{ "comitente": 18728 }
```

**3. No enviar Content-Type**
```javascript
// ❌ INCORRECTO
headers: { 'x-api-key': '...' }

// ✅ CORRECTO
headers: {
  'Content-Type': 'application/json',
  'x-api-key': '...'
}
```

**4. Operación en minúsculas**
```javascript
// ❌ INCORRECTO
{ "operacion": "compra" }

// ✅ CORRECTO
{ "operacion": "COMPRA" }
```

---

### 5. Consultar Orden

```http
GET /api/chatbot/ordenes/:id
```

**Headers:**
```
x-api-key: 2e590cf1f4fd1144f1ce0622347c046a0fa3e2bd786114273094049b6cd55c0a
```

**URL Parameters:**
- `id` (required, UUID): ID de la orden

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "orden": 1234,
    "operacion": "COMPRA",
    "estado": "APROBADA",
    "symbol": "GGAL",
    "plazo": "CONTADO",
    "cantidad": 1,
    "precio": 8370,
    "monto": 8370,
    "comitente": 18728,
    "nombre_cliente": "Juan Pérez",
    "nombre_operador": "Facundo Franco",
    "tipo_orden": "MERCADO",
    "cbu_destino": null,
    "notas": "Orden desde WhatsApp...",
    "created_at": "2026-01-02T14:30:00.000Z",
    "updated_at": "2026-01-02T14:35:00.000Z"
  }
}
```

**Estados posibles:**
- `PENDIENTE`: Orden creada, esperando aprobación
- `APROBADA`: Orden aprobada por operador
- `RECHAZADA`: Orden rechazada
- `EJECUTADA`: Orden ejecutada en el mercado
- `CANCELADA`: Orden cancelada

**Response 404:**
```json
{
  "success": false,
  "error": "ORDER_NOT_FOUND",
  "message": "Orden no encontrada"
}
```

**Ejemplo cURL:**
```bash
curl -H "x-api-key: 2e590cf1f4fd1144f1ce0622347c046a0fa3e2bd786114273094049b6cd55c0a" \
  "https://app1.intercapital.ar/api/chatbot/ordenes/550e8400-e29b-41d4-a716-446655440000"
```

---

### 6. Listar Órdenes

```http
GET /api/chatbot/ordenes?comitente=NUMERO&estado=ESTADO&limit=10&offset=0
```

**Headers:**
```
x-api-key: 2e590cf1f4fd1144f1ce0622347c046a0fa3e2bd786114273094049b6cd55c0a
```

**Query Parameters:**
- `comitente` (required, integer): Número de comitente
- `estado` (optional, string): PENDIENTE, APROBADA, RECHAZADA, EJECUTADA, CANCELADA
- `operacion` (optional, string): COMPRA, VENTA, RETIRO, DEPOSITO
- `limit` (optional, integer): Cantidad de resultados (default: 10, max: 50)
- `offset` (optional, integer): Offset para paginación (default: 0)

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "orden": 1234,
      "operacion": "COMPRA",
      "estado": "PENDIENTE",
      "symbol": "GGAL",
      "plazo": "CONTADO",
      "cantidad": 1,
      "precio": 8370,
      "monto": 8370,
      "tipo_orden": "MERCADO",
      "created_at": "2026-01-02T14:30:00.000Z",
      "updated_at": "2026-01-02T14:30:00.000Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "orden": 1235,
      "operacion": "VENTA",
      "estado": "APROBADA",
      "symbol": "AL30",
      "plazo": "CONTADO",
      "cantidad": 100,
      "precio": 850.50,
      "monto": 85050,
      "tipo_orden": "MERCADO",
      "created_at": "2026-01-02T13:00:00.000Z",
      "updated_at": "2026-01-02T13:05:00.000Z"
    }
  ],
  "pagination": {
    "total": 2,
    "limit": 10,
    "offset": 0
  }
}
```

**Response 400:**
```json
{
  "success": false,
  "error": "MISSING_PARAMETER",
  "message": "Parámetro comitente es requerido"
}
```

**Ejemplo cURL:**
```bash
# Listar todas las órdenes pendientes de un comitente
curl -H "x-api-key: 2e590cf1f4fd1144f1ce0622347c046a0fa3e2bd786114273094049b6cd55c0a" \
  "https://app1.intercapital.ar/api/chatbot/ordenes?comitente=18728&estado=PENDIENTE&limit=10"

# Listar últimas 5 órdenes de compra
curl -H "x-api-key: 2e590cf1f4fd1144f1ce0622347c046a0fa3e2bd786114273094049b6cd55c0a" \
  "https://app1.intercapital.ar/api/chatbot/ordenes?comitente=18728&operacion=COMPRA&limit=5"
```

---

## 🔒 CÓDIGOS DE ERROR COMPLETOS

### Errores de Autenticación (401)

| Código | Descripción | Solución |
|--------|-------------|----------|
| `API_KEY_MISSING` | Falta header x-api-key | Agregar header con la API key |
| `INVALID_API_KEY` | API key inválida o inactiva | Verificar que la key sea correcta |
| `API_KEY_EXPIRED` | API key expirada | Solicitar nueva API key |

### Errores de Autorización (403)

| Código | Descripción | Solución |
|--------|-------------|----------|
| `INSUFFICIENT_SCOPE` | Permisos insuficientes | Verificar scopes de la API key |
| `IP_NOT_ALLOWED` | IP no autorizada | Contactar admin para whitelist |
| `OPERATION_NOT_ALLOWED` | Usuario no puede operar | Verificar estado del usuario |

### Errores de Validación (400)

| Código | Descripción | Solución |
|--------|-------------|----------|
| `VALIDATION_ERROR` | Error en datos enviados | Revisar campo `details` |
| `MISSING_PARAMETER` | Falta parámetro requerido | Agregar parámetro faltante |

### Errores de Recursos (404)

| Código | Descripción | Solución |
|--------|-------------|----------|
| `USER_NOT_FOUND` | Usuario/comitente no encontrado | Verificar número de comitente |
| `ORDER_NOT_FOUND` | Orden no encontrada | Verificar UUID de la orden |

### Errores de Rate Limiting (429)

| Código | Descripción | Solución |
|--------|-------------|----------|
| `RATE_LIMIT_EXCEEDED` | Límite de requests excedido | Esperar 60 segundos |

### Errores del Servidor (500)

| Código | Descripción | Solución |
|--------|-------------|----------|
| `INTERNAL_ERROR` | Error interno del servidor | Revisar logs, contactar soporte |
| `AUTH_ERROR` | Error de autenticación | Verificar configuración |
| `CREATE_ERROR` | Error al crear recurso | Revisar datos enviados |

---

## 🧪 FLUJO COMPLETO DE PRUEBA

### Paso 1: Verificar Health

```bash
curl https://app1.intercapital.ar/api/chatbot/health
```

Debe retornar: `{"status":"OK",...}`

### Paso 2: Validar Usuario

```bash
curl -H "x-api-key: 2e590cf1f4fd1144f1ce0622347c046a0fa3e2bd786114273094049b6cd55c0a" \
  "https://app1.intercapital.ar/api/chatbot/usuarios/validate?comitente=18728"
```

Debe retornar: `{"success":true,"data":{"puede_operar":true,...}}`

### Paso 3: Crear Orden

```bash
curl -X POST https://app1.intercapital.ar/api/chatbot/ordenes \
  -H "Content-Type: application/json" \
  -H "x-api-key: 2e590cf1f4fd1144f1ce0622347c046a0fa3e2bd786114273094049b6cd55c0a" \
  -d '{
    "comitente": 18728,
    "operacion": "COMPRA",
    "symbol": "GGAL",
    "cantidad": 1,
    "precio": 8370
  }'
```

Debe retornar: `{"success":true,"message":"Orden creada exitosamente",...}`

### Paso 4: Consultar Orden Creada

```bash
# Usar el ID retornado en el paso anterior
curl -H "x-api-key: 2e590cf1f4fd1144f1ce0622347c046a0fa3e2bd786114273094049b6cd55c0a" \
  "https://app1.intercapital.ar/api/chatbot/ordenes/550e8400-e29b-41d4-a716-446655440000"
```

### Paso 5: Listar Órdenes

```bash
curl -H "x-api-key: 2e590cf1f4fd1144f1ce0622347c046a0fa3e2bd786114273094049b6cd55c0a" \
  "https://app1.intercapital.ar/api/chatbot/ordenes?comitente=18728&limit=10"
```

---

## 💡 TROUBLESHOOTING

### Problema: Error 500 al crear orden

**Posibles causas:**
1. Comitente enviado como string en lugar de número
2. Operación en minúsculas en lugar de mayúsculas
3. Parámetros enviados en query en lugar de body
4. Falta header Content-Type

**Solución:**
```javascript
// ✅ CORRECTO
await axios.post('/ordenes', {
  comitente: 18728,        // NUMBER
  operacion: 'COMPRA',     // UPPERCASE
  symbol: 'GGAL',          // UPPERCASE
  cantidad: 1,
  precio: 8370
}, {
  headers: {
    'Content-Type': 'application/json',  // IMPORTANTE
    'x-api-key': '...'
  }
});
```

### Problema: Body undefined en logs

**Causa:** Express no está parseando el body

**Solución:** Verificar que el cliente envíe:
```javascript
headers: {
  'Content-Type': 'application/json'  // Crítico
}
```

### Problema: Variables {{nombre}} no se reemplazan

**Causa:** Deploy no aplicado o código antiguo ejecutándose

**Solución:**
1. Verificar que el deploy se completó en Render
2. Reiniciar el servicio manualmente
3. Verificar logs para confirmar versión del código

### Problema: Rate limit excedido

**Solución:**
```javascript
// Implementar retry con backoff
async function crearOrdenConRetry(data, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await crearOrden(data);
    } catch (error) {
      if (error.response?.status === 429) {
        await new Promise(r => setTimeout(r, 60000)); // Esperar 1 minuto
        continue;
      }
      throw error;
    }
  }
}
```

---

## 📊 LÍMITES Y RESTRICCIONES

| Límite | Valor |
|--------|-------|
| Rate limit | 100 requests/minuto |
| Timeout | 30 segundos |
| Max cantidad | Sin límite específico |
| Max precio | Sin límite específico |
| Max monto | 10,000,000 |
| Max symbol length | 10 caracteres |
| Max limit (listado) | 50 órdenes |

---

## ✅ CHECKLIST DE INTEGRACIÓN

- [ ] Health check funciona
- [ ] API key configurada correctamente
- [ ] Content-Type: application/json en headers
- [ ] Parámetros van en BODY (no query)
- [ ] comitente es NUMBER (no string)
- [ ] operacion es UPPERCASE
- [ ] symbol es UPPERCASE
- [ ] Validación de usuario antes de crear orden
- [ ] Manejo de errores 400, 401, 403, 429, 500
- [ ] Retry logic para rate limiting
- [ ] Logs de debugging habilitados
- [ ] Variables de respuesta se reemplazan correctamente

---

## 📞 SOPORTE

Si después de seguir esta documentación sigues teniendo problemas:

1. Verifica los logs del backend: `pm2 logs intercapital-new-api`
2. Verifica los logs del chatbot en Render
3. Usa los ejemplos de cURL exactos de este documento
4. Compara tu código con los ejemplos de Node.js

**Última actualización:** 2 de enero de 2026
