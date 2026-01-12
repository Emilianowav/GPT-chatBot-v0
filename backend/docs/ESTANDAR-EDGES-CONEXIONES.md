# Estándar de Edges (Conexiones) - Sistema de Flujos

## 📋 Resumen

Este documento define el estándar para las conexiones (edges) entre nodos en el sistema de flujos, desde la base de datos hasta el renderizado en el frontend.

---

## 🗄️ Estructura en MongoDB

### Estructura Base (Obligatoria)

```json
{
  "id": "edge-source-to-target",
  "source": "node-id-source",
  "target": "node-id-target",
  "type": "default"
}
```

### Campos Obligatorios

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | ID único del edge. Formato recomendado: `edge-[source]-to-[target]` |
| `source` | string | ID del nodo origen (debe existir en `nodes`) |
| `target` | string | ID del nodo destino (debe existir en `nodes`) |
| `type` | string | Tipo de edge para React Flow. Valores: `default`, `smoothstep`, `step`, `straight` |

### Campos Opcionales

| Campo | Tipo | Descripción | Cuándo usar |
|-------|------|-------------|-------------|
| `sourceHandle` | string | ID del handle de salida del nodo origen | Para routers con múltiples salidas |
| `targetHandle` | string | ID del handle de entrada del nodo destino | Para nodos con múltiples entradas |
| `data` | object | Metadata adicional del edge | Para labels, condiciones, etc. |

### Ejemplo: Edge Simple

```json
{
  "id": "edge-woo-to-asistente",
  "source": "woocommerce",
  "target": "gpt-asistente-ventas",
  "type": "default"
}
```

### Ejemplo: Edge de Router (con sourceHandle)

```json
{
  "id": "edge-router-to-confirmacion",
  "source": "router-intencion",
  "target": "gpt-confirmacion-carrito",
  "type": "default",
  "sourceHandle": "route-agregar"
}
```

### Ejemplo: Edge con Metadata

```json
{
  "id": "router-route-1-gpt-pedir-datos",
  "source": "router",
  "target": "gpt-pedir-datos",
  "type": "default",
  "sourceHandle": "route-1",
  "data": {
    "routeLabel": "Faltan datos",
    "condition": "{{titulo}} not exists OR {{editorial}} not exists"
  }
}
```

---

## 🚫 Campos Prohibidos

**NO incluir estos campos en la BD:**

- ❌ `animated` - Causa problemas de renderizado
- ❌ `style` - Se maneja en el frontend
- ❌ `markerEnd` - Se maneja en el frontend
- ❌ Cualquier campo específico de React Flow que no sea `type`

---

## 🔄 Transformación Frontend → Backend

### Al Guardar (Frontend → MongoDB)

```typescript
// Frontend (React Flow)
const reactFlowEdge = {
  id: "edge-1",
  source: "node-1",
  target: "node-2",
  type: "default",
  sourceHandle: "route-1",
  data: { label: "Condición X" }
};

// Transformar a MongoDB (eliminar campos de React Flow)
const mongoEdge = {
  id: reactFlowEdge.id,
  source: reactFlowEdge.source,
  target: reactFlowEdge.target,
  type: reactFlowEdge.type,
  ...(reactFlowEdge.sourceHandle && { sourceHandle: reactFlowEdge.sourceHandle }),
  ...(reactFlowEdge.targetHandle && { targetHandle: reactFlowEdge.targetHandle }),
  ...(reactFlowEdge.data && Object.keys(reactFlowEdge.data).length > 0 && { data: reactFlowEdge.data })
};
```

---

## 🔄 Transformación Backend → Frontend

### Al Cargar (MongoDB → React Flow)

```typescript
// MongoDB
const mongoEdge = {
  id: "edge-1",
  source: "node-1",
  target: "node-2",
  type: "default",
  sourceHandle: "route-1",
  data: { label: "Condición X" }
};

// Transformar a React Flow
const reactFlowEdge: Edge = {
  id: mongoEdge.id,
  source: mongoEdge.source,
  target: mongoEdge.target,
  type: mongoEdge.type || 'default',
  ...(mongoEdge.sourceHandle && { sourceHandle: mongoEdge.sourceHandle }),
  ...(mongoEdge.targetHandle && { targetHandle: mongoEdge.targetHandle }),
  data: {
    ...mongoEdge.data,
    onConfigClick: handleEdgeConfigClick // Agregar callbacks del frontend
  }
};
```

---

## ⚙️ Configuración en el Frontend

### Registrar Edge Types

```typescript
// En el componente React Flow
const edgeTypes = {
  default: AnimatedLineEdge,
  animated: AnimatedLineEdge,
  smoothstep: SmoothStepEdge,
  // ... otros tipos
};

<ReactFlow
  nodes={nodes}
  edges={edges}
  edgeTypes={edgeTypes}
  // ...
/>
```

---

## ✅ Reglas de Validación

### 1. Validación de Estructura

```typescript
function validateEdge(edge: any): boolean {
  // Campos obligatorios
  if (!edge.id || !edge.source || !edge.target || !edge.type) {
    console.error('Edge inválido: faltan campos obligatorios', edge);
    return false;
  }
  
  // Validar que source y target existan en nodes
  const sourceExists = nodes.find(n => n.id === edge.source);
  const targetExists = nodes.find(n => n.id === edge.target);
  
  if (!sourceExists || !targetExists) {
    console.error('Edge inválido: nodos no existen', edge);
    return false;
  }
  
  return true;
}
```

### 2. Validación de Type

```typescript
const validEdgeTypes = ['default', 'smoothstep', 'step', 'straight', 'animated'];

function validateEdgeType(type: string): boolean {
  if (!validEdgeTypes.includes(type)) {
    console.warn(`Edge type "${type}" no es válido. Usando "default".`);
    return false;
  }
  return true;
}
```

---

## 🐛 Problemas Comunes y Soluciones

### Problema 1: Edges no se visualizan

**Causa:** Campo `animated: true` en la BD

**Solución:** Eliminar campo `animated` de todos los edges

```javascript
// Script de corrección
edges = edges.map(edge => {
  const { animated, ...rest } = edge;
  return rest;
});
```

### Problema 2: Edges con type incorrecto

**Causa:** Frontend fuerza `type: 'animated'` sin registrar el tipo

**Solución:** 
1. Preservar `type` original de la BD
2. Registrar todos los tipos en `edgeTypes`

```typescript
// ❌ Incorrecto
type: 'animated' // Hardcoded

// ✅ Correcto
type: edge.type || 'default' // Preservar original
```

### Problema 3: sourceHandle no se preserva

**Causa:** No se incluye `sourceHandle` en la transformación

**Solución:** Preservar campos opcionales

```typescript
const reactFlowEdge: any = {
  id: edge.id,
  source: edge.source,
  target: edge.target,
  type: edge.type || 'default',
  data: { ... }
};

// Preservar sourceHandle si existe
if (edge.sourceHandle) {
  reactFlowEdge.sourceHandle = edge.sourceHandle;
}
```

---

## 📊 Ejemplo Completo: Flujo con Routers

```json
{
  "nodes": [
    { "id": "webhook", "type": "webhook", ... },
    { "id": "router", "type": "router", ... },
    { "id": "action-1", "type": "gpt", ... },
    { "id": "action-2", "type": "whatsapp", ... }
  ],
  "edges": [
    {
      "id": "edge-webhook-to-router",
      "source": "webhook",
      "target": "router",
      "type": "default"
    },
    {
      "id": "edge-router-to-action1",
      "source": "router",
      "target": "action-1",
      "type": "default",
      "sourceHandle": "route-yes",
      "data": {
        "routeLabel": "Sí",
        "condition": "{{respuesta}} equals 'si'"
      }
    },
    {
      "id": "edge-router-to-action2",
      "source": "router",
      "target": "action-2",
      "type": "default",
      "sourceHandle": "route-no",
      "data": {
        "routeLabel": "No",
        "condition": "{{respuesta}} equals 'no'"
      }
    }
  ]
}
```

---

## 🔧 Scripts de Mantenimiento

### Estandarizar Edges Existentes

```javascript
// backend/scripts/estandarizar-edges.cjs
const edgesEstandarizados = flow.edges.map(edge => {
  const edgeEstandarizado = {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type === 'animatedLine' ? 'default' : edge.type
  };

  if (edge.sourceHandle) {
    edgeEstandarizado.sourceHandle = edge.sourceHandle;
  }

  if (edge.targetHandle) {
    edgeEstandarizado.targetHandle = edge.targetHandle;
  }

  if (edge.data && Object.keys(edge.data).length > 0) {
    edgeEstandarizado.data = edge.data;
  }

  return edgeEstandarizado;
});
```

### Validar Edges

```javascript
// backend/scripts/validar-edges.cjs
function validarEdges(flow) {
  const nodesMap = {};
  flow.nodes.forEach(n => nodesMap[n.id] = n);

  const edgesInvalidos = [];

  flow.edges.forEach(edge => {
    if (!edge.id || !edge.source || !edge.target || !edge.type) {
      edgesInvalidos.push({ edge, razon: 'Faltan campos obligatorios' });
    }

    if (!nodesMap[edge.source]) {
      edgesInvalidos.push({ edge, razon: `Source "${edge.source}" no existe` });
    }

    if (!nodesMap[edge.target]) {
      edgesInvalidos.push({ edge, razon: `Target "${edge.target}" no existe` });
    }
  });

  return edgesInvalidos;
}
```

---

## 📝 Checklist de Implementación

### Backend
- [ ] Edges en MongoDB siguen estructura estándar
- [ ] No hay campos `animated` en la BD
- [ ] Todos los edges tienen `id`, `source`, `target`, `type`
- [ ] `sourceHandle` solo se usa para routers
- [ ] API devuelve edges sin transformación

### Frontend
- [ ] `edgeTypes` incluye todos los tipos usados (`default`, `animated`, etc.)
- [ ] Al cargar, se preserva `type` original de la BD
- [ ] Al cargar, se preserva `sourceHandle` y `targetHandle`
- [ ] Al guardar, se eliminan campos específicos de React Flow
- [ ] Validación de edges antes de renderizar

---

## 🎯 Resultado Esperado

Con este estándar implementado:

✅ Todos los edges se visualizan correctamente en el frontend
✅ Las conexiones de routers funcionan con múltiples salidas
✅ La estructura es consistente en toda la aplicación
✅ Fácil mantenimiento y debugging
✅ Compatible con React Flow sin hacks

---

## 📚 Referencias

- [React Flow Edges Documentation](https://reactflow.dev/docs/api/edges/)
- [React Flow Edge Types](https://reactflow.dev/docs/examples/edges/edge-types/)
- Archivo: `backend/scripts/estandarizar-edges.cjs`
- Archivo: `backend/scripts/auditoria-completa-edges.cjs`
- Archivo: `front_crm/bot_crm/src/app/dashboard/flows/page.tsx` (líneas 114-140)
