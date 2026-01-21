# SCHEMA COMPLETO DE BASE DE DATOS

## Índice
1. [Colección: flows](#colección-flows)
2. [Colección: conversation_states](#colección-conversation_states)
3. [Colección: historial_conversaciones](#colección-historial_conversaciones)
4. [Colección: contactos](#colección-contactos)
5. [Colección: api_configs](#colección-api_configs)

---

## Colección: flows

### Descripción
Almacena la configuración completa de cada flujo de bot.

### Schema TypeScript

```typescript
interface IFlow {
  _id: ObjectId;                    // ID de MongoDB
  empresaId: string;                // ID de la empresa
  id: string;                       // ID único del flujo (slug)
  nombre: string;                   // Nombre del flujo
  descripcion?: string;             // Descripción opcional
  categoria?: string;               // Categoría: ventas, soporte, etc.
  botType: string;                  // Tipo: visual, code, hybrid
  startNode: string;                // ID del nodo inicial
  activo: boolean;                  // Estado activo/inactivo
  nodes: INode[];                   // Array de nodos
  edges: IEdge[];                   // Array de conexiones
  config: IFlowConfig;              // Configuración del flujo
  createdBy: string;                // Email del creador
  createdAt: Date;                  // Fecha de creación
  updatedAt: Date;                  // Fecha de actualización
}

interface INode {
  id: string;                       // ID único del nodo
  type: string;                     // Tipo: gpt, router, whatsapp, etc.
  category?: string;                // Categoría: trigger, processor, action
  position: {
    x: number;
    y: number;
  };
  data: {
    label: string;                  // Etiqueta visible
    config: any;                    // Configuración específica del nodo
    handles?: IHandle[];            // Handles (solo para routers)
  };
}

interface IHandle {
  id: string;                       // ID único del handle
  label: string;                    // Etiqueta visible
  condition: string;                // Condición para activar esta ruta
}

interface IEdge {
  id: string;                       // ID único de la conexión
  source: string;                   // ID del nodo origen
  target: string;                   // ID del nodo destino
  sourceHandle?: string;            // ID del handle origen (para routers)
  targetHandle?: string;            // ID del handle destino
  type?: string;                    // Tipo: default, animated, simple
  animated?: boolean;               // Si la línea está animada
}

interface IFlowConfig {
  topicos_habilitados?: boolean;    // Si se inyectan tópicos globales
  topicos?: Record<string, any>;    // Tópicos globales
  variables_globales?: Record<string, any>;  // Variables globales iniciales
  configuracion_gpt?: {
    modelo_default?: string;        // Modelo GPT por defecto
    temperatura?: number;           // Temperatura por defecto
    max_tokens?: number;            // Max tokens por defecto
  };
}
```

### Ejemplo Completo

```json
{
  "_id": "696aef0863e98384f9248968",
  "empresaId": "Veo Veo",
  "id": "veo-veo-v2",
  "nombre": "Veo Veo v2",
  "descripcion": "Bot de ventas para Librería Veo Veo",
  "categoria": "ventas",
  "botType": "visual",
  "startNode": "webhook-whatsapp",
  "activo": true,
  "nodes": [
    {
      "id": "webhook-whatsapp",
      "type": "webhook",
      "category": "trigger",
      "position": { "x": 100, "y": 100 },
      "data": {
        "label": "WhatsApp Business Cloud API",
        "config": {
          "webhookType": "whatsapp"
        }
      }
    },
    {
      "id": "gpt-clasificador",
      "type": "gpt",
      "category": "processor",
      "position": { "x": 300, "y": 100 },
      "data": {
        "label": "GPT Clasificador",
        "config": {
          "tipo": "conversacional",
          "modelo": "gpt-4",
          "systemPrompt": "Clasificar intención del usuario..."
        }
      }
    },
    {
      "id": "router-principal",
      "type": "router",
      "category": "processor",
      "position": { "x": 500, "y": 100 },
      "data": {
        "label": "Router Principal",
        "config": {},
        "handles": [
          {
            "id": "route-busqueda",
            "label": "Búsqueda",
            "condition": "{{gpt-clasificador.intencion}} == 'busqueda'"
          },
          {
            "id": "route-carrito",
            "label": "Carrito",
            "condition": "{{gpt-clasificador.intencion}} == 'carrito'"
          }
        ]
      }
    },
    {
      "id": "woocommerce-search",
      "type": "woocommerce",
      "category": "action",
      "position": { "x": 700, "y": 50 },
      "data": {
        "label": "WooCommerce",
        "config": {
          "action": "search",
          "searchTerm": "{{mensaje_usuario}}",
          "maxResults": 10,
          "fieldMappings": [
            { "source": "name", "target": "titulo" },
            { "source": "price", "target": "precio" }
          ]
        }
      }
    },
    {
      "id": "gpt-asistente",
      "type": "gpt",
      "category": "processor",
      "position": { "x": 900, "y": 50 },
      "data": {
        "label": "GPT Asistente Ventas",
        "config": {
          "tipo": "conversacional",
          "modelo": "gpt-4",
          "systemPrompt": "Presentar productos al usuario..."
        }
      }
    },
    {
      "id": "whatsapp-respuesta",
      "type": "whatsapp",
      "category": "action",
      "position": { "x": 1100, "y": 50 },
      "data": {
        "label": "WhatsApp Respuesta",
        "config": {
          "telefono": "{{telefono}}",
          "mensaje": "{{gpt-asistente.respuesta_gpt}}"
        }
      }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "webhook-whatsapp",
      "target": "gpt-clasificador",
      "type": "default"
    },
    {
      "id": "edge-2",
      "source": "gpt-clasificador",
      "target": "router-principal",
      "type": "default"
    },
    {
      "id": "edge-3",
      "source": "router-principal",
      "sourceHandle": "route-busqueda",
      "target": "woocommerce-search",
      "type": "default"
    },
    {
      "id": "edge-4",
      "source": "woocommerce-search",
      "target": "gpt-asistente",
      "type": "default"
    },
    {
      "id": "edge-5",
      "source": "gpt-asistente",
      "target": "whatsapp-respuesta",
      "type": "default"
    }
  ],
  "config": {
    "topicos_habilitados": true,
    "topicos": {
      "empresa": {
        "nombre": "Librería Veo Veo",
        "ubicacion": "San Juan 1037, Corrientes Capital",
        "whatsapp": "5493794732177"
      },
      "horarios": {
        "lunes_viernes": "8:30-12:00 y 17:00-21:00"
      },
      "productos": {
        "libros_ingles": {
          "disponible": true,
          "descripcion": "Amplia variedad de libros en inglés"
        }
      }
    },
    "configuracion_gpt": {
      "modelo_default": "gpt-4",
      "temperatura": 0.7,
      "max_tokens": 500
    }
  },
  "createdBy": "admin@veoveo.com",
  "createdAt": "2026-01-15T10:00:00.000Z",
  "updatedAt": "2026-01-17T02:00:00.000Z"
}
```

### Índices

```javascript
// Índice único compuesto
db.flows.createIndex({ empresaId: 1, id: 1 }, { unique: true });

// Índice para búsqueda por empresa
db.flows.createIndex({ empresaId: 1 });

// Índice para filtrar activos
db.flows.createIndex({ activo: 1 });

// Índice para búsqueda por nombre
db.flows.createIndex({ nombre: 1 });
```

---

## Colección: conversation_states

### Descripción
Almacena el estado actual de cada conversación activa.

### Schema TypeScript

```typescript
interface IConversationState {
  _id: ObjectId;
  telefono: string;                 // Número de teléfono del usuario
  empresaId: string;                // ID de la empresa
  flowId: string;                   // ID del flujo activo
  currentNodeId?: string;           // ID del nodo actual
  context: Record<string, any>;     // Contexto de ejecución
  globalVariables: Record<string, any>;  // Variables globales
  waitingForInput: boolean;         // Si espera input del usuario
  lastMessageAt: Date;              // Timestamp del último mensaje
  createdAt: Date;
  updatedAt: Date;
}
```

### Ejemplo

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "telefono": "5493794946066",
  "empresaId": "Veo Veo",
  "flowId": "696aef0863e98384f9248968",
  "currentNodeId": "gpt-asistente",
  "context": {
    "webhook-whatsapp": {
      "output": {
        "telefono": "5493794946066",
        "mensaje_usuario": "busco harry potter",
        "nombre_contacto": "Emiliano"
      }
    },
    "gpt-clasificador": {
      "output": {
        "respuesta_gpt": "busqueda",
        "intencion": "busqueda"
      }
    },
    "woocommerce-search": {
      "output": {
        "productos": [
          {
            "titulo": "Harry Potter y la Piedra Filosofal",
            "precio": "2000",
            "stock": 10
          }
        ]
      }
    }
  },
  "globalVariables": {
    "telefono": "5493794946066",
    "nombre_contacto": "Emiliano",
    "mensaje_usuario": "busco harry potter",
    "telefono_empresa": "5493794057297"
  },
  "waitingForInput": false,
  "lastMessageAt": "2026-01-17T02:30:00.000Z",
  "createdAt": "2026-01-17T02:00:00.000Z",
  "updatedAt": "2026-01-17T02:30:00.000Z"
}
```

### Índices

```javascript
db.conversation_states.createIndex({ telefono: 1, empresaId: 1 }, { unique: true });
db.conversation_states.createIndex({ lastMessageAt: 1 });
db.conversation_states.createIndex({ flowId: 1 });
```

---

## Colección: historial_conversaciones

### Descripción
Almacena el historial completo de mensajes de cada conversación.

### Schema TypeScript

```typescript
interface IHistorialConversacion {
  _id: ObjectId;
  telefono: string;                 // Número de teléfono del usuario
  empresaId: string;                // ID de la empresa
  flowId?: string;                  // ID del flujo (si aplica)
  mensajes: IMensaje[];             // Array de mensajes
  createdAt: Date;
  updatedAt: Date;
}

interface IMensaje {
  rol: 'user' | 'assistant' | 'system';  // Rol del mensaje
  contenido: string;                // Contenido del mensaje
  timestamp: Date;                  // Timestamp del mensaje
  nodeId?: string;                  // ID del nodo que generó el mensaje
  metadata?: Record<string, any>;   // Metadata adicional
}
```

### Ejemplo

```json
{
  "_id": "507f1f77bcf86cd799439012",
  "telefono": "5493794946066",
  "empresaId": "Veo Veo",
  "flowId": "696aef0863e98384f9248968",
  "mensajes": [
    {
      "rol": "user",
      "contenido": "Hola",
      "timestamp": "2026-01-17T02:00:00.000Z"
    },
    {
      "rol": "assistant",
      "contenido": "¡Hola Emiliano! 👋 Bienvenido a Librería Veo Veo 📚\n\n¿En qué puedo ayudarte hoy?",
      "timestamp": "2026-01-17T02:00:05.000Z",
      "nodeId": "gpt-saludo"
    },
    {
      "rol": "user",
      "contenido": "busco harry potter",
      "timestamp": "2026-01-17T02:01:00.000Z"
    },
    {
      "rol": "assistant",
      "contenido": "Perfecto😊, encontré estos libros:\n\n📚 Resultados:\n\n1. Harry Potter y la Piedra Filosofal\n   💰 Precio: $2000\n   📦 Stock: 10 unidades",
      "timestamp": "2026-01-17T02:01:10.000Z",
      "nodeId": "gpt-asistente"
    }
  ],
  "createdAt": "2026-01-17T02:00:00.000Z",
  "updatedAt": "2026-01-17T02:01:10.000Z"
}
```

### Índices

```javascript
db.historial_conversaciones.createIndex({ telefono: 1, empresaId: 1 });
db.historial_conversaciones.createIndex({ flowId: 1 });
db.historial_conversaciones.createIndex({ updatedAt: -1 });
```

---

## Colección: contactos

### Descripción
Almacena información de los contactos/usuarios.

### Schema TypeScript

```typescript
interface IContacto {
  _id: ObjectId;
  telefono: string;                 // Número de teléfono (único)
  nombre?: string;                  // Nombre del contacto
  email?: string;                   // Email
  empresaId: string;                // ID de la empresa
  metadata?: Record<string, any>;   // Metadata adicional
  tags?: string[];                  // Tags para segmentación
  ultimaInteraccion?: Date;         // Última interacción
  createdAt: Date;
  updatedAt: Date;
}
```

### Ejemplo

```json
{
  "_id": "507f1f77bcf86cd799439013",
  "telefono": "5493794946066",
  "nombre": "Emiliano",
  "email": "emiliano@example.com",
  "empresaId": "Veo Veo",
  "metadata": {
    "ciudad": "Corrientes",
    "preferencias": ["libros", "tecnología"]
  },
  "tags": ["cliente", "activo"],
  "ultimaInteraccion": "2026-01-17T02:30:00.000Z",
  "createdAt": "2026-01-10T00:00:00.000Z",
  "updatedAt": "2026-01-17T02:30:00.000Z"
}
```

### Índices

```javascript
db.contactos.createIndex({ telefono: 1 }, { unique: true });
db.contactos.createIndex({ empresaId: 1 });
db.contactos.createIndex({ email: 1 });
db.contactos.createIndex({ tags: 1 });
```

---

## Colección: api_configs

### Descripción
Almacena configuraciones de APIs externas (WooCommerce, MercadoPago, etc.).

### Schema TypeScript

```typescript
interface IApiConfig {
  _id: ObjectId;
  empresaId: string;                // ID de la empresa
  nombre: string;                   // Nombre de la configuración
  tipo: string;                     // Tipo: woocommerce, mercadopago, custom
  activo: boolean;                  // Estado activo/inactivo
  configuracion: IApiConfigData;    // Configuración específica
  endpoints?: IEndpoint[];          // Endpoints disponibles
  createdAt: Date;
  updatedAt: Date;
}

interface IApiConfigData {
  baseUrl?: string;                 // URL base de la API
  apiKey?: string;                  // API Key (encriptada)
  apiSecret?: string;               // API Secret (encriptada)
  accessToken?: string;             // Access Token (encriptado)
  headers?: Record<string, string>; // Headers personalizados
  timeout?: number;                 // Timeout en ms
}

interface IEndpoint {
  id: string;                       // ID único del endpoint
  nombre: string;                   // Nombre descriptivo
  metodo: 'GET' | 'POST' | 'PUT' | 'DELETE';  // Método HTTP
  ruta: string;                     // Ruta del endpoint
  parametros?: IParametro[];        // Parámetros del endpoint
  headers?: Record<string, string>; // Headers específicos
}

interface IParametro {
  nombre: string;                   // Nombre del parámetro
  tipo: string;                     // Tipo: string, number, boolean, array
  requerido: boolean;               // Si es requerido
  descripcion?: string;             // Descripción
  valorDefault?: any;               // Valor por defecto
}
```

### Ejemplo: WooCommerce

```json
{
  "_id": "507f1f77bcf86cd799439014",
  "empresaId": "Veo Veo",
  "nombre": "WooCommerce Veo Veo",
  "tipo": "woocommerce",
  "activo": true,
  "configuracion": {
    "baseUrl": "https://veoveo.com/wp-json/wc/v3",
    "apiKey": "ck_xxxxxxxxxxxxx",
    "apiSecret": "cs_xxxxxxxxxxxxx",
    "timeout": 30000
  },
  "endpoints": [
    {
      "id": "search-products",
      "nombre": "Buscar Productos",
      "metodo": "GET",
      "ruta": "/products",
      "parametros": [
        {
          "nombre": "search",
          "tipo": "string",
          "requerido": true,
          "descripcion": "Término de búsqueda"
        },
        {
          "nombre": "per_page",
          "tipo": "number",
          "requerido": false,
          "descripcion": "Cantidad de resultados",
          "valorDefault": 10
        },
        {
          "nombre": "status",
          "tipo": "string",
          "requerido": false,
          "descripcion": "Estado del producto",
          "valorDefault": "publish"
        }
      ]
    },
    {
      "id": "get-product",
      "nombre": "Obtener Producto",
      "metodo": "GET",
      "ruta": "/products/{id}",
      "parametros": [
        {
          "nombre": "id",
          "tipo": "number",
          "requerido": true,
          "descripcion": "ID del producto"
        }
      ]
    }
  ],
  "createdAt": "2026-01-10T00:00:00.000Z",
  "updatedAt": "2026-01-15T00:00:00.000Z"
}
```

### Ejemplo: MercadoPago

```json
{
  "_id": "507f1f77bcf86cd799439015",
  "empresaId": "Veo Veo",
  "nombre": "MercadoPago Veo Veo",
  "tipo": "mercadopago",
  "activo": true,
  "configuracion": {
    "baseUrl": "https://api.mercadopago.com",
    "accessToken": "APP_USR-xxxxxxxxxxxxx",
    "timeout": 30000
  },
  "endpoints": [
    {
      "id": "create-preference",
      "nombre": "Crear Preferencia de Pago",
      "metodo": "POST",
      "ruta": "/checkout/preferences",
      "parametros": [
        {
          "nombre": "items",
          "tipo": "array",
          "requerido": true,
          "descripcion": "Items del carrito"
        },
        {
          "nombre": "back_urls",
          "tipo": "object",
          "requerido": false,
          "descripcion": "URLs de retorno"
        },
        {
          "nombre": "external_reference",
          "tipo": "string",
          "requerido": false,
          "descripcion": "Referencia externa"
        }
      ]
    }
  ],
  "createdAt": "2026-01-10T00:00:00.000Z",
  "updatedAt": "2026-01-15T00:00:00.000Z"
}
```

### Índices

```javascript
db.api_configs.createIndex({ empresaId: 1, nombre: 1 }, { unique: true });
db.api_configs.createIndex({ tipo: 1 });
db.api_configs.createIndex({ activo: 1 });
```

---

## Queries Útiles

### Obtener flujo activo de una empresa

```javascript
db.flows.findOne({
  empresaId: "Veo Veo",
  activo: true
});
```

### Obtener estado de conversación

```javascript
db.conversation_states.findOne({
  telefono: "5493794946066",
  empresaId: "Veo Veo"
});
```

### Obtener historial de conversación

```javascript
db.historial_conversaciones.findOne({
  telefono: "5493794946066",
  empresaId: "Veo Veo"
}).sort({ updatedAt: -1 });
```

### Limpiar estado de un usuario

```javascript
// Limpiar conversation_states
db.conversation_states.deleteOne({
  telefono: "5493794946066",
  empresaId: "Veo Veo"
});

// Limpiar historial
db.historial_conversaciones.deleteOne({
  telefono: "5493794946066",
  empresaId: "Veo Veo"
});
```

### Obtener todos los flujos de una empresa

```javascript
db.flows.find({
  empresaId: "Veo Veo"
}).sort({ updatedAt: -1 });
```

### Obtener configuración de API

```javascript
db.api_configs.findOne({
  empresaId: "Veo Veo",
  tipo: "woocommerce",
  activo: true
});
```

---

**Fin de la documentación del schema de base de datos.**
