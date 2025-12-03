# 🔗 Módulo de Integraciones

Sistema completo para gestionar APIs externas e integraciones nativas.

## 📁 Estructura

```
integrations/
├── models/              # Modelos de Mongoose
├── controllers/         # Controladores de rutas
├── services/           # Lógica de negocio
├── routes/             # Definición de rutas
├── utils/              # Utilidades (encriptación, etc)
├── types/              # Tipos TypeScript
└── scripts/            # Scripts de utilidad
```

## 🚀 Inicio Rápido

### 1. Generar Clave de Encriptación

```bash
npm run tsx src/modules/integrations/scripts/generateEncryptionKey.ts
```

Copia la clave generada en tu archivo `.env`:

```env
ENCRYPTION_KEY=tu_clave_de_64_caracteres_aqui
```

### 2. Crear una API Configurable

```bash
POST /api/modules/integrations/:empresaId/apis
```

**Body:**
```json
{
  "nombre": "API iCenter",
  "tipo": "rest",
  "baseUrl": "https://icenter.ar/wp-json/wc-whatsapp/v1",
  "autenticacion": {
    "tipo": "bearer",
    "configuracion": {
      "token": "5cb3afa29c70e175ea9c5a736df61096d02b9aa68ef56245c2a342769ff43fd7"
    }
  }
}
```

### 3. Configurar un Endpoint

```bash
POST /api/modules/integrations/:empresaId/apis/:apiId/endpoints
```

**Body:**
```json
{
  "nombre": "Buscar Productos",
  "metodo": "GET",
  "path": "/products",
  "parametros": {
    "query": [
      {
        "nombre": "search",
        "tipo": "string",
        "requerido": false
      },
      {
        "nombre": "category",
        "tipo": "number",
        "requerido": false
      }
    ]
  },
  "cache": {
    "habilitado": true,
    "ttl": 300
  }
}
```

### 4. Ejecutar el Endpoint

```bash
POST /api/modules/integrations/:empresaId/apis/:apiId/ejecutar/:endpointId
```

**Body:**
```json
{
  "parametros": {
    "query": {
      "search": "iphone 15",
      "category": 21
    }
  }
}
```

## 📡 Endpoints Disponibles

### APIs Configurables

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/:empresaId/apis` | Listar todas las APIs |
| GET | `/:empresaId/apis/:id` | Obtener API por ID |
| POST | `/:empresaId/apis` | Crear nueva API |
| PUT | `/:empresaId/apis/:id` | Actualizar API |
| DELETE | `/:empresaId/apis/:id` | Eliminar API |
| POST | `/:empresaId/apis/:id/endpoints` | Crear endpoint |
| PUT | `/:empresaId/apis/:id/endpoints/:epId` | Actualizar endpoint |
| DELETE | `/:empresaId/apis/:id/endpoints/:epId` | Eliminar endpoint |
| POST | `/:empresaId/apis/:id/ejecutar/:epId` | Ejecutar endpoint |
| GET | `/:empresaId/apis/:id/logs` | Ver logs |
| GET | `/:empresaId/apis/:id/estadisticas` | Ver estadísticas |

## 🔐 Seguridad

### Encriptación de Credenciales

Todas las credenciales sensibles se encriptan automáticamente usando AES-256-CBC:

- Tokens Bearer
- API Keys
- Passwords
- Client Secrets

### Tipos de Autenticación Soportados

- **Bearer Token**: `Authorization: Bearer {token}`
- **API Key**: Header, Query o Body
- **Basic Auth**: Usuario y contraseña
- **OAuth2**: Con refresh token automático
- **Custom**: Headers personalizados

## 📊 Características

### ✅ Sistema de Cache

```json
{
  "cache": {
    "habilitado": true,
    "ttl": 300,
    "estrategia": "simple"
  }
}
```

### ✅ Rate Limiting

```json
{
  "rateLimiting": {
    "habilitado": true,
    "maxRequests": 100,
    "ventanaTiempo": 60
  }
}
```

### ✅ Reintentos Automáticos

```json
{
  "configuracion": {
    "reintentos": 3,
    "reintentarEn": [1000, 2000, 4000]
  }
}
```

### ✅ Transformación de Datos

```json
{
  "mapeo": {
    "salida": {
      "productos": "data.items",
      "total": "data.count"
    }
  }
}
```

### ✅ Logs Completos

Todos los requests se registran automáticamente con:
- Request completo (método, URL, headers, body)
- Response (status, headers, body, tiempo)
- Errores detallados
- Contexto de ejecución

Los logs se eliminan automáticamente después de 30 días (TTL Index).

## 🎯 Ejemplo Completo: API iCenter

```typescript
// 1. Crear configuración de API
const api = await fetch('/api/modules/integrations/empresaId/apis', {
  method: 'POST',
  body: JSON.stringify({
    nombre: 'API iCenter',
    tipo: 'rest',
    baseUrl: 'https://icenter.ar/wp-json/wc-whatsapp/v1',
    autenticacion: {
      tipo: 'bearer',
      configuracion: {
        token: 'tu_token_aqui'
      }
    }
  })
});

// 2. Crear endpoint "Buscar Productos"
const endpoint = await fetch(`/api/modules/integrations/empresaId/apis/${api.id}/endpoints`, {
  method: 'POST',
  body: JSON.stringify({
    nombre: 'Buscar Productos',
    metodo: 'GET',
    path: '/products',
    parametros: {
      query: [
        { nombre: 'search', tipo: 'string', requerido: false },
        { nombre: 'category', tipo: 'number', requerido: false },
        { nombre: 'per_page', tipo: 'number', requerido: false, valorPorDefecto: 10 }
      ]
    },
    cache: { habilitado: true, ttl: 300 }
  })
});

// 3. Ejecutar búsqueda
const resultado = await fetch(
  `/api/modules/integrations/empresaId/apis/${api.id}/ejecutar/${endpoint.id}`,
  {
    method: 'POST',
    body: JSON.stringify({
      parametros: {
        query: {
          search: 'iphone 15',
          category: 21,
          per_page: 10
        }
      }
    })
  }
);

console.log(resultado.data); // Productos encontrados
```

## 🔧 Uso Programático

```typescript
import { apiExecutor } from './services/apiExecutor';

// Ejecutar endpoint desde código
const resultado = await apiExecutor.ejecutar(
  apiConfigId,
  endpointId,
  {
    query: { search: 'iphone' },
    path: { id: '123' },
    body: { data: 'value' }
  },
  {
    usuarioId: req.usuario.id,
    clienteId: cliente._id
  }
);

if (resultado.success) {
  console.log('Datos:', resultado.data);
  console.log('Tiempo:', resultado.metadata.tiempoRespuesta);
} else {
  console.error('Error:', resultado.error);
}
```

## 📈 Monitoreo

### Ver Estadísticas

```bash
GET /api/modules/integrations/:empresaId/apis/:id/estadisticas
```

**Respuesta:**
```json
{
  "totalLlamadas": 1523,
  "llamadasExitosas": 1489,
  "llamadasFallidas": 34,
  "tiempoPromedioRespuesta": 245,
  "ultimaLlamada": "2025-11-11T23:30:00Z"
}
```

### Ver Logs

```bash
GET /api/modules/integrations/:empresaId/apis/:id/logs?limit=50&page=1&estado=error
```

## 🚧 Próximas Características

- [ ] Sistema de cache con Redis
- [ ] Rate limiting distribuido
- [ ] Integraciones nativas (Google Calendar, Outlook)
- [ ] Webhooks entrantes
- [ ] Dashboard de monitoreo en tiempo real
- [ ] Alertas automáticas
- [ ] Exportación de logs

## 📝 Notas Importantes

1. **Seguridad**: Nunca expongas la `ENCRYPTION_KEY` en el código o repositorio
2. **Logs**: Se eliminan automáticamente después de 30 días
3. **Cache**: Implementar Redis para producción
4. **Rate Limiting**: Configurar según las limitaciones de cada API externa
5. **Reintentos**: Solo se reintentan errores de red y 5xx

## 🆘 Troubleshooting

### Error: "ENCRYPTION_KEY no está configurada"

Genera una clave y agrégala al `.env`:

```bash
npm run tsx src/modules/integrations/scripts/generateEncryptionKey.ts
```

### Error: "API no encontrada"

Verifica que el `apiConfigId` sea correcto y que la API pertenezca a la empresa.

### Error: "Endpoint no encontrado"

Verifica que el `endpointId` exista en la configuración de la API.

### Timeout en requests

Aumenta el timeout en la configuración:

```json
{
  "configuracion": {
    "timeout": 60000
  }
}
```
