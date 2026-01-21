# Configuración Nodo HTTP - Intercapital

## Endpoint: Perfil por Teléfono

### Configuración Básica

**URL:**
```
http://app1.intercapital.ar/api/account/perfil-por-telefono
```

**Método:** `GET`

**Timeout:** `30000` ms (30 segundos)

### Autenticación

**Tipo:** API Key

**Header:** `x-api-key`

**Valor:** `[TU_API_KEY_AQUI]`

### Query Parameters

| Key | Value | Descripción |
|-----|-------|-------------|
| `telefono` | `{{telefono_usuario}}` | Número de teléfono del usuario capturado por WhatsApp |

### Ejemplo de Request Completo

```http
GET http://app1.intercapital.ar/api/account/perfil-por-telefono?telefono=460227664
Headers:
  x-api-key: [TU_API_KEY]
```

### Ejemplo de Respuesta

```json
{
  "data": {
    "comitente": "12345",
    "nombre": "Juan Pérez",
    "telefono": "+5493794946066",
    "email": "juan@example.com",
    "saldos": {
      "saldo_pesos_disponible": 15000.50,
      "saldo_dolares_disponible": 500.00,
      "saldo_total": 15000.50
    },
    "estado": "activo",
    "fecha_alta": "2024-01-15"
  },
  "success": true
}
```

### Variables Globales Sugeridas

Después de probar el request, selecciona los campos que necesites:

| Campo JSON | Variable Sugerida | Descripción |
|------------|-------------------|-------------|
| `data.comitente` | `comitente` | ID del cliente en Intercapital |
| `data.nombre` | `nombre_cliente` | Nombre completo del cliente |
| `data.telefono` | `telefono_verificado` | Teléfono verificado en Intercapital |
| `data.email` | `email_cliente` | Email del cliente |
| `data.saldos.saldo_pesos_disponible` | `saldo_pesos` | Saldo disponible en pesos |
| `data.saldos.saldo_dolares_disponible` | `saldo_dolares` | Saldo disponible en dólares |
| `data.estado` | `estado_cuenta` | Estado de la cuenta |

### Flujo de Configuración

1. **Crear Nodo HTTP** en el flow builder
2. **Configurar URL y Método**
3. **Agregar Autenticación:**
   - Tipo: API Key
   - Header: `x-api-key`
   - Valor: Tu API key de Intercapital
4. **Agregar Query Parameter:**
   - Key: `telefono`
   - Value: `{{telefono_usuario}}`
5. **Probar Request:**
   - Click en "Probar Request y Mapear Campos"
   - Usar número de prueba: `460227664`
6. **Seleccionar Variables:**
   - Click en los campos que quieres guardar
   - Se crearán automáticamente como variables globales
7. **Guardar Configuración**

### Uso en el Flujo

**Nodo WhatsApp (Webhook):**
- Captura automáticamente `telefono_usuario`

**Nodo HTTP (Intercapital):**
- Consulta perfil con `{{telefono_usuario}}`
- Guarda datos del cliente en variables globales

**Router/Condición:**
- Si `comitente` existe → Cliente registrado
- Si `comitente` no existe → Solicitar registro

**Nodo GPT (Respuesta):**
- "Hola {{nombre_cliente}}, tu saldo disponible es ${{saldo_pesos}}"

### Notas Importantes

- El número de teléfono debe estar en formato internacional
- La API Key debe mantenerse segura (no compartir)
- Verificar que el número de prueba `460227664` sea válido
- Los campos disponibles pueden variar según la respuesta de la API
