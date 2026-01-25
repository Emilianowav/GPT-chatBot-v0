# 🔧 GUÍA DE CONFIGURACIÓN - NODOS HTTP INTERCAPITAL

## 📋 Información General

**Base URL:** `https://app1.intercapital.ar/api/chatbot`  
**API Key:** `2e590cf1f4fd1144f1ce0622347c046a0fa3e2bd786114273094049b6cd55c0a`  
**Header de autenticación:** `x-api-key`

---

## 🎯 NODO 1: Consultar Perfil por Teléfono

### Configuración del Nodo

**Label:** `Consulta Perfil Intercapital`  
**Método:** `GET`  
**URL:** `https://app1.intercapital.ar/api/account/perfil-por-telefono`

### Headers
```
x-api-key: {{api_key_intercapital}}
```

### Query Parameters
```
telefono: {{telefono_usuario}}
```

### Variables a Guardar (Variable Mappings)

| Response Path | Variable Name | Type |
|--------------|---------------|------|
| `data.comitente` | `comitente` | global |
| `data.nombre` | `nombre_cliente` | global |
| `data.numero_telefono` | `telefono_verificado` | global |
| `data.correo_electronico` | `email_cliente` | global |
| `data.saldos.saldo_pesos_disponible` | `saldo_pesos` | global |
| `data.saldos.saldo_dolares_disponible` | `saldo_dolares` | global |
| `data.habilitado` | `cuenta_habilitada` | global |

### Response Mapping
- **Data Path:** `data`
- **Error Path:** `error`

### Ejemplo de Respuesta
```json
{
  "success": true,
  "data": {
    "comitente": 12345,
    "nombre": "Juan Pérez",
    "numero_telefono": "46027664",
    "correo_electronico": "juan@example.com",
    "saldos": {
      "saldo_pesos_disponible": 50000,
      "saldo_dolares_disponible": 1000
    },
    "habilitado": true
  }
}
```

---

## 🎯 NODO 2: Validar Usuario

### Configuración del Nodo

**Label:** `Validar Usuario Intercapital`  
**Método:** `GET`  
**URL:** `https://app1.intercapital.ar/api/chatbot/usuarios/validate`

### Headers
```
x-api-key: {{api_key_intercapital}}
```

### Query Parameters
```
comitente: {{comitente}}
```

### Variables a Guardar

| Response Path | Variable Name | Type |
|--------------|---------------|------|
| `data.exists` | `usuario_existe` | global |
| `data.nombre` | `nombre_cliente` | global |
| `data.estado` | `estado_cuenta` | global |
| `data.puede_operar` | `puede_operar` | global |

### Ejemplo de Respuesta
```json
{
  "success": true,
  "data": {
    "comitente": 12345,
    "exists": true,
    "nombre": "Juan Pérez",
    "estado": "ACTIVO",
    "puede_operar": true
  }
}
```

---

## 🎯 NODO 3: Crear Orden de Compra

### Configuración del Nodo

**Label:** `Crear Orden Compra`  
**Método:** `POST`  
**URL:** `https://app1.intercapital.ar/api/chatbot/ordenes`

### Headers
```
Content-Type: application/json
x-api-key: {{api_key_intercapital}}
```

### Body (JSON)
```json
{
  "comitente": {{comitente}},
  "operacion": "COMPRA",
  "symbol": "{{symbol}}",
  "cantidad": {{cantidad}},
  "precio": {{precio}},
  "plazo": "CONTADO",
  "tipo_orden": "MERCADO",
  "notas": "Orden desde WhatsApp",
  "metadata": {
    "whatsapp_phone": "{{telefono_usuario}}",
    "conversation_id": "{{conversation_id}}",
    "nombre_cliente": "{{nombre_cliente}}"
  }
}
```

### Variables a Guardar

| Response Path | Variable Name | Type |
|--------------|---------------|------|
| `data.id` | `orden_id` | global |
| `data.orden` | `numero_orden` | global |
| `data.estado` | `estado_orden` | global |
| `data.monto` | `monto_total` | global |
| `data.created_at` | `fecha_orden` | global |

### Ejemplo de Respuesta
```json
{
  "success": true,
  "message": "Orden creada exitosamente. Estado: PENDIENTE",
  "data": {
    "id": "uuid-orden-123",
    "orden": 1234,
    "operacion": "COMPRA",
    "estado": "PENDIENTE",
    "symbol": "AL30",
    "plazo": "CONTADO",
    "cantidad": 100,
    "precio": 850.50,
    "monto": 85050.00,
    "comitente": 12345,
    "nombre_cliente": "Juan Pérez",
    "tipo_orden": "MERCADO",
    "created_at": "2026-01-24T20:00:00.000Z"
  }
}
```

---

## 🎯 NODO 4: Crear Orden de Venta

### Configuración del Nodo

**Label:** `Crear Orden Venta`  
**Método:** `POST`  
**URL:** `https://app1.intercapital.ar/api/chatbot/ordenes`

### Headers
```
Content-Type: application/json
x-api-key: {{api_key_intercapital}}
```

### Body (JSON)
```json
{
  "comitente": {{comitente}},
  "operacion": "VENTA",
  "symbol": "{{symbol}}",
  "cantidad": {{cantidad}},
  "precio": {{precio}},
  "plazo": "CONTADO",
  "tipo_orden": "MERCADO",
  "notas": "Orden desde WhatsApp",
  "metadata": {
    "whatsapp_phone": "{{telefono_usuario}}",
    "conversation_id": "{{conversation_id}}",
    "nombre_cliente": "{{nombre_cliente}}"
  }
}
```

### Variables a Guardar
(Igual que Nodo 3)

---

## 🎯 NODO 5: Solicitar Retiro

### Configuración del Nodo

**Label:** `Solicitar Retiro`  
**Método:** `POST`  
**URL:** `https://app1.intercapital.ar/api/chatbot/ordenes`

### Headers
```
Content-Type: application/json
x-api-key: {{api_key_intercapital}}
```

### Body (JSON)
```json
{
  "comitente": {{comitente}},
  "operacion": "RETIRO",
  "symbol": "PESOS",
  "cantidad": {{monto_retiro}},
  "precio": 1,
  "cbu_destino": "{{cbu_destino}}",
  "notas": "Retiro desde WhatsApp",
  "metadata": {
    "whatsapp_phone": "{{telefono_usuario}}",
    "conversation_id": "{{conversation_id}}",
    "nombre_cliente": "{{nombre_cliente}}"
  }
}
```

### Variables a Guardar

| Response Path | Variable Name | Type |
|--------------|---------------|------|
| `data.id` | `retiro_id` | global |
| `data.orden` | `numero_retiro` | global |
| `data.estado` | `estado_retiro` | global |
| `data.monto` | `monto_retiro_confirmado` | global |

---

## 🎯 NODO 6: Listar Órdenes

### Configuración del Nodo

**Label:** `Listar Órdenes`  
**Método:** `GET`  
**URL:** `https://app1.intercapital.ar/api/chatbot/ordenes`

### Headers
```
x-api-key: {{api_key_intercapital}}
```

### Query Parameters
```
comitente: {{comitente}}
estado: PENDIENTE
limit: 10
offset: 0
```

### Variables a Guardar

| Response Path | Variable Name | Type |
|--------------|---------------|------|
| `data` | `lista_ordenes` | global |
| `pagination.total` | `total_ordenes` | global |

### Response Mapping
- **Data Path:** `data`

### Ejemplo de Respuesta
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "orden": 1234,
      "operacion": "COMPRA",
      "estado": "PENDIENTE",
      "symbol": "AL30",
      "cantidad": 100,
      "precio": 850.50,
      "monto": 85050.00,
      "created_at": "2026-01-24T20:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 10,
    "offset": 0
  }
}
```

---

## 🎯 NODO 7: Consultar Orden Específica

### Configuración del Nodo

**Label:** `Consultar Orden`  
**Método:** `GET`  
**URL:** `https://app1.intercapital.ar/api/chatbot/ordenes/{{orden_id}}`

### Headers
```
x-api-key: {{api_key_intercapital}}
```

### Variables a Guardar

| Response Path | Variable Name | Type |
|--------------|---------------|------|
| `data.estado` | `estado_orden_actual` | global |
| `data.nombre_operador` | `operador_asignado` | global |
| `data.updated_at` | `fecha_actualizacion` | global |

---

## 📝 VARIABLES GLOBALES NECESARIAS

Antes de configurar los nodos, asegúrate de tener estas variables globales:

### Variables de Configuración
```
api_key_intercapital: 2e590cf1f4fd1144f1ce0622347c046a0fa3e2bd786114273094049b6cd55c0a
```

### Variables del Usuario (capturadas automáticamente)
```
telefono_usuario: (capturado del webhook WhatsApp)
mensaje_usuario: (capturado del webhook WhatsApp)
```

### Variables del Flujo (recopiladas por GPT)
```
comitente: (número de comitente)
symbol: (símbolo del activo, ej: AL30, GGAL)
cantidad: (cantidad de activos)
precio: (precio por unidad)
monto_retiro: (monto a retirar)
cbu_destino: (CBU de 22 dígitos)
```

---

## 🧪 TESTING DE NODOS

### Paso 1: Probar Consulta de Perfil

1. Abre el nodo HTTP "Consulta Perfil Intercapital"
2. Click en "🧪 Probar Request"
3. Configura variable de prueba:
   - `telefono_usuario`: `46027664`
4. Click en "Ejecutar Request de Prueba"
5. Verifica que retorne datos del usuario
6. Selecciona los campos que quieres guardar
7. Guarda la configuración

### Paso 2: Probar Validación de Usuario

1. Abre el nodo "Validar Usuario Intercapital"
2. Configura variable de prueba:
   - `comitente`: `12345`
3. Ejecuta el test
4. Verifica que `exists: true`
5. Guarda la configuración

### Paso 3: Probar Creación de Orden

1. Abre el nodo "Crear Orden Compra"
2. Configura variables de prueba:
   - `comitente`: `12345`
   - `symbol`: `AL30`
   - `cantidad`: `100`
   - `precio`: `850.50`
   - `telefono_usuario`: `+5491112345678`
   - `nombre_cliente`: `Juan Pérez`
3. Ejecuta el test
4. Verifica que retorne `success: true` y `estado: PENDIENTE`
5. Guarda la configuración

---

## ⚠️ ERRORES COMUNES Y SOLUCIONES

### Error 401: API_KEY_MISSING
**Causa:** Falta el header `x-api-key`  
**Solución:** Verifica que el header esté configurado correctamente

### Error 401: INVALID_API_KEY
**Causa:** API key incorrecta  
**Solución:** Verifica que la API key sea exactamente:
```
2e590cf1f4fd1144f1ce0622347c046a0fa3e2bd786114273094049b6cd55c0a
```

### Error 400: VALIDATION_ERROR
**Causa:** Datos inválidos en el body  
**Solución:** Verifica que:
- `comitente` sea un número
- `cantidad` sea mayor a 0
- `precio` sea mayor a 0
- `symbol` sea un string válido

### Error 404: USER_NOT_FOUND
**Causa:** Comitente no existe  
**Solución:** Verifica que el número de comitente sea correcto

### Error 429: RATE_LIMIT_EXCEEDED
**Causa:** Demasiados requests  
**Solución:** Espera 60 segundos antes de reintentar

---

## 🔄 FLUJO COMPLETO RECOMENDADO

```
1. Webhook WhatsApp (captura telefono_usuario)
   ↓
2. Nodo HTTP: Consulta Perfil por Teléfono
   ↓
3. Router: ¿cuenta_habilitada == true?
   ├─ NO → GPT: Mensaje de error + FIN
   └─ SÍ → Continuar
       ↓
4. GPT Conversacional: Menú principal
   ↓
5. Router: Según opción seleccionada
   ├─ Opción 1 (Comprar) → GPT recopila datos → HTTP Crear Orden Compra
   ├─ Opción 2 (Vender) → GPT recopila datos → HTTP Crear Orden Venta
   ├─ Opción 3 (Retiro) → GPT recopila datos → HTTP Solicitar Retiro
   ├─ Opción 4 (Consultar) → HTTP Listar Órdenes → GPT muestra lista
   └─ Opción 5 (Ayuda) → GPT muestra ayuda
       ↓
6. WhatsApp: Enviar respuesta al usuario
```

---

## 📊 TIPS DE CONFIGURACIÓN

### 1. Usa Variables Globales para API Key
Guarda la API key como variable global `api_key_intercapital` para reutilizarla en todos los nodos.

### 2. Mapea Siempre las Variables Importantes
Asegúrate de mapear:
- `comitente`
- `nombre_cliente`
- `cuenta_habilitada`
- IDs de órdenes creadas

### 3. Configura Timeout Adecuado
Para requests que pueden tardar, usa timeout de 30000ms (30 segundos).

### 4. Usa Data Path Correctamente
Si la respuesta tiene estructura `{ success: true, data: {...} }`, configura:
- **Data Path:** `data`

### 5. Prueba Antes de Guardar
Siempre usa el botón "🧪 Probar Request" antes de guardar la configuración.

---

## ✅ CHECKLIST DE CONFIGURACIÓN

- [ ] Variable global `api_key_intercapital` creada
- [ ] Nodo "Consulta Perfil" configurado y probado
- [ ] Nodo "Validar Usuario" configurado y probado
- [ ] Nodo "Crear Orden Compra" configurado y probado
- [ ] Nodo "Crear Orden Venta" configurado y probado
- [ ] Nodo "Solicitar Retiro" configurado y probado
- [ ] Nodo "Listar Órdenes" configurado y probado
- [ ] Todos los variableMappings configurados
- [ ] Flujo completo probado en WhatsApp

---

**Fecha de creación:** 24 de enero de 2026  
**Última actualización:** 24 de enero de 2026  
**Estado:** ✅ Lista para usar
