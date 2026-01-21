# ARQUITECTURA DEL SISTEMA DE FLUJOS

## Índice
1. [Visión General](#visión-general)
2. [Modelo de Datos](#modelo-de-datos)
3. [Tipos de Nodos](#tipos-de-nodos)
4. [Sistema de Conexiones](#sistema-de-conexiones)
5. [Ejecución de Flujos](#ejecución-de-flujos)

---

## Visión General

El sistema de flujos permite crear bots de WhatsApp completamente configurables desde el frontend, sin necesidad de tocar código. Similar a Make.com o n8n.

### Componentes Principales

```
┌─────────────────────────────────────────────────────────┐
│                    FLOW BUILDER                         │
│  (Frontend - Editor Visual de Flujos)                   │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ Guarda/Carga flujos
                  ↓
┌─────────────────────────────────────────────────────────┐
│                   MongoDB (flows)                       │
│  - Nodos (nodes)                                        │
│  - Conexiones (edges)                                   │
│  - Configuración (config)                               │
│  - Tópicos (topicos)                                    │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ Lee flujo activo
                  ↓
┌─────────────────────────────────────────────────────────┐
│                  FLOW EXECUTOR                          │
│  (Backend - Ejecuta flujos en tiempo real)             │
│  - Procesa mensajes de WhatsApp                        │
│  - Ejecuta nodos según tipo                            │
│  - Maneja variables y contexto                         │
│  - Evalúa condiciones de routers                       │
└─────────────────────────────────────────────────────────┘
```

---

## Modelo de Datos

### Schema de Flow en MongoDB

```typescript
interface IFlow {
  // Identificación
  _id: ObjectId;                    // ID de MongoDB
  empresaId: string;                // ID de la empresa
  id: string;                       // ID único del flujo
  nombre: string;                   // Nombre del flujo
  descripcion?: string;             // Descripción
  
  // Tipo de bot
  botType: 'conversacional' | 'pasos' | 'visual';
  
  // Nodos del flujo (CRÍTICO)
  nodes: Array<{
    id: string;                     // ID único del nodo
    type: string;                   // Tipo: 'gpt', 'whatsapp', 'router', etc.
    category?: string;              // 'trigger', 'processor', 'action'
    position: { x: number; y: number };
    data: {
      label: string;                // Nombre visible
      config: any;                  // Configuración específica del nodo
      handles?: Array<{             // Handles para routers
        id: string;
        label: string;
        condition?: string;
      }>;
    };
  }>;
  
  // Conexiones entre nodos
  edges: Array<{
    id: string;                     // ID único de la conexión
    source: string;                 // ID del nodo origen
    target: string;                 // ID del nodo destino
    sourceHandle?: string;          // Handle de salida (para routers)
    targetHandle?: string;          // Handle de entrada
    type: string;                   // 'default', 'animated', etc.
    data?: {
      condition?: string;           // Condición para evaluar
      label?: string;               // Etiqueta visible
    };
  }>;
  
  // Configuración global del flujo
  config?: {
    topicos_habilitados?: boolean;  // Habilitar tópicos globales
    topicos?: Record<string, any>;  // Tópicos de conocimiento
  };
  
  // Metadata
  startNode: string;                // ID del nodo inicial
  activo: boolean;                  // Si el flujo está activo
  createdBy: string;                // Usuario creador
  createdAt: Date;
  updatedAt: Date;
}
```

### Ejemplo Real de Flow en BD

```json
{
  "_id": "696aef0863e98384f9248968",
  "empresaId": "Veo Veo",
  "id": "veo-veo-libreria-v2",
  "nombre": "Veo Veo - Librería v2",
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
          "systemPrompt": "Clasifica la intención del usuario..."
        }
      }
    }
  ],
  
  "edges": [
    {
      "id": "edge-webhook-gpt",
      "source": "webhook-whatsapp",
      "target": "gpt-clasificador",
      "type": "default"
    }
  ],
  
  "config": {
    "topicos_habilitados": true,
    "topicos": {
      "empresa": {
        "nombre": "Librería Veo Veo",
        "ubicacion": "San Juan 1037, Corrientes Capital"
      },
      "horarios": {
        "lunes_viernes": "8:30-12:00 y 17:00-21:00"
      }
    }
  }
}
```

---

## Tipos de Nodos

### 1. Webhook (Trigger)
**Propósito:** Punto de entrada del flujo cuando llega un mensaje de WhatsApp.

```typescript
{
  id: "webhook-whatsapp",
  type: "webhook",
  category: "trigger",
  data: {
    label: "WhatsApp Business Cloud API",
    config: {
      webhookType: "whatsapp"
    }
  }
}
```

**Output:**
```json
{
  "telefono": "5493794946066",
  "mensaje_usuario": "Hola",
  "nombre_contacto": "Emiliano",
  "timestamp": "2026-01-17T02:00:00Z"
}
```

### 2. GPT (Processor)
**Propósito:** Procesar texto con IA (clasificar, extraer datos, generar respuestas).

**Tipos de GPT:**
- `conversacional`: Mantiene historial, responde al usuario
- `formateador`: Extrae datos estructurados
- `transform`: Transforma datos sin historial

```typescript
{
  id: "gpt-clasificador",
  type: "gpt",
  category: "processor",
  data: {
    label: "GPT Clasificador",
    config: {
      tipo: "conversacional",
      modelo: "gpt-4",
      systemPrompt: "Clasifica la intención del usuario en: busqueda, carrito, consulta",
      topicos: []  // Tópicos locales (opcional)
    }
  }
}
```

**Output:**
```json
{
  "respuesta_gpt": "busqueda",
  "intencion": "busqueda"
}
```

### 3. Router (Processor)
**Propósito:** Dirigir el flujo según condiciones.

```typescript
{
  id: "router-principal",
  type: "router",
  category: "processor",
  data: {
    label: "Router Principal",
    handles: [
      {
        id: "route-busqueda",
        label: "Búsqueda",
        condition: "{{gpt-clasificador.intencion}} == 'busqueda'"
      },
      {
        id: "route-carrito",
        label: "Carrito",
        condition: "{{gpt-clasificador.intencion}} == 'carrito'"
      }
    ]
  }
}
```

**Conexiones desde Router:**
```json
[
  {
    "source": "router-principal",
    "sourceHandle": "route-busqueda",
    "target": "woocommerce-search"
  },
  {
    "source": "router-principal",
    "sourceHandle": "route-carrito",
    "target": "gpt-armar-carrito"
  }
]
```

### 4. WhatsApp (Action)
**Propósito:** Enviar mensaje al usuario.

```typescript
{
  id: "whatsapp-respuesta",
  type: "whatsapp",
  category: "action",
  data: {
    label: "WhatsApp Respuesta",
    config: {
      telefono: "{{telefono}}",
      mensaje: "{{gpt-asistente.respuesta_gpt}}"
    }
  }
}
```

### 5. WooCommerce (Action)
**Propósito:** Buscar productos en WooCommerce.

```typescript
{
  id: "woocommerce-search",
  type: "woocommerce",
  category: "action",
  data: {
    label: "WooCommerce",
    config: {
      action: "search",
      searchTerm: "{{mensaje_usuario}}",
      maxResults: 10
    }
  }
}
```

**Output:**
```json
{
  "productos": [
    {
      "id": 123,
      "name": "Harry Potter",
      "price": "2000",
      "stock_quantity": 10
    }
  ]
}
```

### 6. MercadoPago (Action)
**Propósito:** Crear preferencia de pago.

```typescript
{
  id: "mercadopago-crear-preference",
  type: "mercadopago",
  category: "action",
  data: {
    label: "MercadoPago",
    config: {
      items: "{{carrito.items}}",
      total: "{{carrito.total}}"
    }
  }
}
```

**Output:**
```json
{
  "preference_id": "182716364-xxx",
  "init_point": "https://www.mercadopago.com.ar/checkout/..."
}
```

---

## Sistema de Conexiones

### Estructura de Edge

```typescript
{
  id: string;              // ID único: "edge-{source}-{target}"
  source: string;          // ID del nodo origen
  target: string;          // ID del nodo destino
  sourceHandle?: string;   // Handle de salida (para routers)
  targetHandle?: string;   // Handle de entrada
  type: string;            // 'default', 'animated'
  data?: {
    condition?: string;    // Condición para evaluar
    label?: string;        // Etiqueta visible
  }
}
```

### Tipos de Conexiones

#### 1. Conexión Simple
```json
{
  "id": "edge-webhook-gpt",
  "source": "webhook-whatsapp",
  "target": "gpt-clasificador",
  "type": "default"
}
```

#### 2. Conexión con Router
```json
{
  "id": "edge-router-woo",
  "source": "router-principal",
  "sourceHandle": "route-busqueda",
  "target": "woocommerce-search",
  "type": "default"
}
```

#### 3. Conexión con Condición
```json
{
  "id": "edge-conditional",
  "source": "gpt-extractor",
  "target": "whatsapp-confirmacion",
  "type": "default",
  "data": {
    "condition": "{{gpt-extractor.datos_completos}} == true",
    "label": "Datos completos"
  }
}
```

---

## Ejecución de Flujos

### FlowExecutor - Proceso de Ejecución

```
1. Mensaje de WhatsApp llega
   ↓
2. FlowExecutor carga el flujo activo desde BD
   ↓
3. Inicializa variables globales:
   - telefono
   - mensaje_usuario
   - nombre_contacto
   ↓
4. Carga tópicos si topicos_habilitados = true
   ↓
5. Ejecuta nodo inicial (startNode)
   ↓
6. Para cada nodo:
   a. Ejecuta según tipo (executeGPTNode, executeWhatsAppNode, etc.)
   b. Guarda output en contexto: context[nodeId].output
   c. Evalúa conexiones salientes
   d. Si es router, evalúa condiciones de handles
   e. Continúa al siguiente nodo
   ↓
7. Termina cuando:
   - No hay más conexiones
   - Se ejecuta nodo WhatsApp (acción final)
   - Ocurre un error
```

### Contexto de Ejecución

```typescript
{
  // Contexto de nodos ejecutados
  context: {
    "webhook-whatsapp": {
      output: {
        telefono: "5493794946066",
        mensaje_usuario: "Hola"
      }
    },
    "gpt-clasificador": {
      output: {
        respuesta_gpt: "busqueda",
        intencion: "busqueda"
      }
    }
  },
  
  // Variables globales
  globalVariables: {
    telefono: "5493794946066",
    mensaje_usuario: "Hola",
    nombre_contacto: "Emiliano"
  },
  
  // Tópicos cargados
  topicos: {
    empresa: { nombre: "Librería Veo Veo" },
    horarios: { lunes_viernes: "8:30-12:00" }
  }
}
```

### Resolución de Variables

El sistema soporta variables en formato `{{variable}}`:

```typescript
// Variables globales
"{{telefono}}" → "5493794946066"
"{{mensaje_usuario}}" → "Hola"

// Output de nodos
"{{gpt-clasificador.intencion}}" → "busqueda"
"{{woocommerce-search.productos}}" → [...]

// Tópicos
"{{topicos.empresa.nombre}}" → "Librería Veo Veo"

// Propiedades
"{{woocommerce-search.productos.length}}" → 5

// Fallbacks
"{{variable || 'default'}}" → "default" si variable no existe
"{{productos.length || 0}}" → 0 si productos no existe
```

---

Continúa en: `02-CONFIGURACION-NODOS.md`
