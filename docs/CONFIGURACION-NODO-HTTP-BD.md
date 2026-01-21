# Configuración del Nodo HTTP en Base de Datos

## Estructura en MongoDB

### Colección: `flows`

El nodo HTTP se guarda dentro del array `nodes` del documento de flow:

```json
{
  "_id": "696c30a24f0cc6c0ada138f5",
  "empresaId": "Intercapital",
  "nombre": "Nuevo Flow",
  "activo": true,
  "nodes": [
    {
      "id": "http-node-1",
      "type": "http",
      "position": { "x": 300, "y": 100 },
      "data": {
        "label": "Consulta Perfil Intercapital",
        "config": {
          "module": "http-request",
          "url": "http://app1.intercapital.ar/api/account/perfil-por-telefono",
          "method": "GET",
          "headers": {
            "x-api-key": "TU_API_KEY_AQUI"
          },
          "queryParams": {
            "telefono": "{{telefono_usuario}}"
          },
          "body": "",
          "timeout": 30000,
          "auth": {
            "type": "api-key",
            "apiKey": "TU_API_KEY_AQUI",
            "apiKeyHeader": "x-api-key"
          },
          "responseMapping": {
            "dataPath": "data",
            "errorPath": "error"
          },
          "variableMappings": [
            {
              "responsePath": "data.comitente",
              "variableName": "comitente",
              "variableType": "global"
            },
            {
              "responsePath": "data.nombre",
              "variableName": "nombre_cliente",
              "variableType": "global"
            },
            {
              "responsePath": "data.saldos.saldo_pesos_disponible",
              "variableName": "saldo_pesos",
              "variableType": "global"
            },
            {
              "responsePath": "data.saldos.saldo_dolares_disponible",
              "variableName": "saldo_dolares",
              "variableType": "global"
            },
            {
              "responsePath": "data.estado",
              "variableName": "estado_cuenta",
              "variableType": "global"
            }
          ],
          "saveApiKeyAsVariable": false
        }
      }
    }
  ],
  "config": {
    "variables_globales": {
      "telefono_usuario": "",
      "comitente": "",
      "nombre_cliente": "",
      "saldo_pesos": "",
      "saldo_dolares": "",
      "estado_cuenta": ""
    }
  }
}
```

## Script de Configuración Automática

He creado el script `backend/scripts/configurar-nodo-http-intercapital.js` que:

1. Busca el flow activo de Intercapital
2. Encuentra el nodo HTTP
3. Aplica la configuración completa
4. Configura las variables globales

### Uso del Script:

```bash
cd backend
node scripts/configurar-nodo-http-intercapital.js
```

### Variables de Entorno Necesarias:

Agregar en `backend/.env`:

```bash
INTERCAPITAL_API_KEY=tu_api_key_real_aqui
```

## Endpoint de Intercapital

### URL Base:
```
http://app1.intercapital.ar/api
```

### Endpoint: Perfil por Teléfono
```
GET /account/perfil-por-telefono
```

### Headers Requeridos:
```
x-api-key: [TU_API_KEY]
```

### Query Parameters:
```
telefono: [NUMERO_TELEFONO]
```

### Ejemplo de Request:
```bash
curl -X GET \
  'http://app1.intercapital.ar/api/account/perfil-por-telefono?telefono=460227664' \
  -H 'x-api-key: TU_API_KEY'
```

### Ejemplo de Respuesta:
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

## Flujo de Datos: Backend → Frontend

### 1. Guardado en BD (Backend)

Cuando guardas el flow desde el frontend:

```javascript
// frontend/page.tsx - handleSaveFlow()
const flowData = {
  nombre: flowName,
  empresaId: 'Intercapital',
  nodes: nodes, // Incluye el nodo HTTP con su config
  edges: edges,
  config: {
    variables_globales: globalVariables
  }
};

// POST/PUT a /api/flows
```

### 2. Almacenamiento en MongoDB

```javascript
// backend/routes/flows.js
router.post('/', async (req, res) => {
  const flow = new Flow({
    ...req.body,
    nodes: req.body.nodes, // Aquí se guarda el config del nodo HTTP
    config: req.body.config
  });
  await flow.save();
});
```

### 3. Carga desde BD (Backend → Frontend)

```javascript
// backend/routes/flows.js
router.get('/:id', async (req, res) => {
  const flow = await Flow.findById(req.params.id);
  res.json(flow); // Incluye nodes con config completo
});
```

### 4. Renderizado en Frontend

```javascript
// frontend/page.tsx - fetchFlow()
const flow = await response.json();
setNodes(flow.nodes); // Cada nodo tiene su data.config

// Al hacer click en el nodo HTTP:
handleNodeClick(nodeId) {
  const node = nodes.find(n => n.id === nodeId);
  setSelectedNode(node);
  setShowHTTPConfigModal(true);
}

// El modal recibe:
<HTTPConfigModal
  initialConfig={selectedNode?.data?.config} // ← Aquí llega el config de la BD
/>
```

### 5. Carga en el Modal (Frontend)

```javascript
// HTTPConfigModal.tsx - useEffect
useEffect(() => {
  if (isOpen && initialConfig) {
    // Cargar todos los campos desde initialConfig
    setUrl(initialConfig.url);
    setMethod(initialConfig.method);
    setHeaders(initialConfig.headers);
    setQueryParams(initialConfig.queryParams);
    setAuthType(initialConfig.auth?.type);
    // ... etc
  }
}, [isOpen, initialConfig]);
```

## Verificación

### 1. Verificar en MongoDB:

```javascript
db.flows.findOne({ empresaId: 'Intercapital' })
```

Buscar en el array `nodes` el nodo con `type: 'http'` y verificar que `data.config` tenga:
- ✅ `url` con el endpoint de Intercapital
- ✅ `headers` con `x-api-key`
- ✅ `queryParams` con `telefono`
- ✅ `auth.type` = `'api-key'`
- ✅ `variableMappings` con los campos a mapear

### 2. Verificar en Frontend:

Abrir la consola del navegador y buscar:
```
✅ Cargando configuración guardada: { ... }
```

El JSON debe mostrar todos los campos configurados.

## Troubleshooting

### Problema: Modal muestra campos vacíos

**Causa:** El `data.config` del nodo está vacío en la BD.

**Solución:**
1. Ejecutar el script de configuración:
   ```bash
   node scripts/configurar-nodo-http-intercapital.js
   ```
2. O configurar manualmente desde el frontend y guardar el flow.

### Problema: API Key no funciona

**Causa:** La API Key no está configurada o es incorrecta.

**Solución:**
1. Configurar en `backend/.env`:
   ```
   INTERCAPITAL_API_KEY=tu_api_key_real
   ```
2. Reiniciar el servidor backend.

### Problema: Variables no se guardan

**Causa:** El `variableMappings` no se está guardando correctamente.

**Solución:**
Verificar que al guardar el nodo HTTP, el `handleSave` incluya:
```javascript
onSave({
  ...config,
  variableMappings: variableMappings // ← Debe estar incluido
});
```

## Número de Teléfono de Prueba

Para probar el endpoint de Intercapital:
```
460227664
```

Este número debe retornar datos de un cliente de prueba.
