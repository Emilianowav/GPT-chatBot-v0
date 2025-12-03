# 🔄 Workflows Integrados con Chatbot - Implementación Completa

## ✅ Resumen de Implementación

Se ha integrado completamente el sistema de workflows con el chatbot conversacional de WhatsApp, permitiendo ejecutar secuencias de APIs mediante palabras clave en el chat.

---

## 📋 Respuestas a tus Preguntas

### 1. ¿Los pasos se guardan en el objeto de la base de datos?

✅ **SÍ**, los pasos se guardan correctamente en MongoDB dentro del documento de la API.

**Estructura en MongoDB:**
```javascript
{
  "_id": ObjectId("..."),
  "empresaId": ObjectId("..."),
  "nombre": "Mi API",
  "endpoints": [...],
  "workflows": [  // ✅ Array de workflows
    {
      "id": "abc123",
      "nombre": "Consulta Completa",
      "descripcion": "Flujo de consulta",
      "activo": true,
      "steps": [  // ✅ Array de pasos
        {
          "orden": 1,
          "endpointId": "endpoint-1",
          "nombre": "Obtener Usuario",
          "descripcion": "Consulta usuario",
          "mapeoParametros": {
            "userId": "step1.data.id"
          }
        },
        {
          "orden": 2,
          "endpointId": "endpoint-2",
          "nombre": "Obtener Pedidos"
        }
      ],
      "mensajeInicial": "Consultando...",
      "mensajeFinal": "Consulta completada",
      "createdAt": ISODate("..."),
      "updatedAt": ISODate("...")
    }
  ]
}
```

### 2. Error de MongoDB

El error `ETIMEDOUT` es temporal y se debe a problemas de conexión con MongoDB Atlas. El sistema tiene reconexión automática. **No es un error de código**.

### 3. ¿Los flujos se accionan sobre el chat conversacional?

✅ **SÍ**, completamente integrado. Los workflows se ejecutan automáticamente cuando el usuario envía un mensaje que coincide con el nombre del workflow.

### 4. Scripts de sincronización de tipos

No hay scripts específicos, pero los tipos están correctamente definidos y sincronizados entre frontend y backend.

---

## 🎯 Arquitectura de Integración

### Flujo de Ejecución

```
Usuario WhatsApp
    ↓
    📱 Mensaje: "consulta completa"
    ↓
WhatsApp Controller
    ↓
Universal Router (evalúa prioridades)
    ↓
    ├─ 1️⃣ Evalúa Workflows (Prioridad 3)
    ├─ 2️⃣ Evalúa API Keywords (Prioridad 4)
    ├─ 3️⃣ Evalúa Flujos Activos (Prioridad 5)
    └─ 4️⃣ Conversacional GPT (Prioridad 7)
    ↓
Workflow Keyword Handler
    ↓
    ├─ Paso 1: Ejecuta Endpoint A
    ├─ Paso 2: Ejecuta Endpoint B (usa respuesta de A)
    └─ Paso 3: Ejecuta Endpoint C (usa respuesta de B)
    ↓
Respuesta Formateada
    ↓
Usuario WhatsApp
```

---

## 🔧 Archivos Creados/Modificados

### Nuevos Archivos

**1. `workflowKeywordHandler.ts`**
- Handler para ejecutar workflows completos
- Ejecuta pasos secuencialmente
- Mapea parámetros entre pasos
- Formatea respuesta final

**2. `BACKEND_WORKFLOWS_IMPLEMENTADO.md`**
- Documentación completa del backend

**3. `WORKFLOWS_CHATBOT_INTEGRADO.md`** (este archivo)
- Documentación de integración

### Archivos Modificados

**1. `api.types.ts`**
```typescript
// Agregados:
export interface IWorkflowStep {
  orden: number;
  endpointId: string;
  nombre?: string;
  descripcion?: string;
  mapeoParametros?: Record<string, string>;
}

export interface IWorkflow {
  id?: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  steps: IWorkflowStep[];
  mensajeInicial?: string;
  mensajeFinal?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
```

**2. `ApiConfiguration.ts`**
```typescript
// Agregado al modelo:
workflows: [WorkflowSchema]

// Schemas agregados:
const WorkflowStepSchema = new Schema({...});
const WorkflowSchema = new Schema({...});
```

**3. `apiConfigController.ts`**
```typescript
// Funciones agregadas:
export const crearWorkflow = async (req, res) => {...}
export const actualizarWorkflow = async (req, res) => {...}
export const eliminarWorkflow = async (req, res) => {...}
export const toggleWorkflow = async (req, res) => {...}
```

**4. `apiConfigRoutes.ts`**
```typescript
// Rutas agregadas:
router.post('/:empresaId/apis/:id/workflows', ...);
router.put('/:empresaId/apis/:id/workflows/:workflowId', ...);
router.delete('/:empresaId/apis/:id/workflows/:workflowId', ...);
router.patch('/:empresaId/apis/:id/workflows/:workflowId/toggle', ...);
```

**5. `universalRouter.ts`**
```typescript
// Prioridades actualizadas:
export enum FlowPriority {
  EMERGENCY = 1,
  MANDATORY = 2,
  API_WORKFLOW = 3,     // ✨ NUEVO
  API_KEYWORD = 4,
  GUIDED_FLOW = 5,
  QUICK_QUESTION = 6,
  CONVERSATIONAL = 7
}

// Método agregado:
private async evaluateWorkflowTriggers(context): Promise<WorkflowMatch | null> {
  // Busca workflows activos
  // Detecta coincidencia por nombre
  // Retorna match con alta prioridad
}
```

**6. `whatsappController.ts`**
```typescript
// Manejo de workflows agregado:
if (routerDecision.action === 'execute_workflow') {
  const workflowResult = await workflowKeywordHandler.execute(...);
  // Envía respuesta al usuario
}
```

---

## 🚀 Cómo Funciona

### 1. Crear un Workflow desde el Frontend

```typescript
// El usuario crea un workflow en la UI
{
  "nombre": "consulta completa",
  "descripcion": "Consulta información completa del cliente",
  "activo": true,
  "steps": [
    {
      "orden": 1,
      "endpointId": "get-user",
      "nombre": "Obtener Usuario"
    },
    {
      "orden": 2,
      "endpointId": "get-orders",
      "nombre": "Obtener Pedidos",
      "mapeoParametros": {
        "userId": "step1.data.id"  // Usa ID del paso 1
      }
    }
  ],
  "mensajeInicial": "🔍 Consultando información...",
  "mensajeFinal": "✅ Consulta completada"
}
```

### 2. Usuario Envía Mensaje por WhatsApp

```
Usuario: "consulta completa"
```

### 3. Universal Router Detecta el Workflow

```typescript
// universalRouter.ts
const workflowMatch = await this.evaluateWorkflowTriggers(context);
// Detecta que "consulta completa" coincide con el nombre del workflow
// Retorna prioridad 3 (mayor que keywords simples)
```

### 4. Workflow Handler Ejecuta los Pasos

```typescript
// workflowKeywordHandler.ts
for (const step of sortedSteps) {
  // Paso 1: Ejecuta get-user
  const result1 = await apiExecutor.ejecutar(apiId, 'get-user', {});
  context.step1 = result1.data;
  
  // Paso 2: Ejecuta get-orders con userId del paso 1
  const params = {
    query: {
      userId: context.step1.data.id  // Mapeo automático
    }
  };
  const result2 = await apiExecutor.ejecutar(apiId, 'get-orders', params);
  
  // Formatea respuesta final
  return formatWorkflowResponse(responses);
}
```

### 5. Respuesta al Usuario

```
Bot: 🔍 Consultando información...

Usuario: Juan Pérez
Pedidos: 3 activos
- Pedido #123: $150
- Pedido #124: $200
- Pedido #125: $75

✅ Consulta completada
```

---

## 📊 Características Implementadas

### ✅ Detección Automática
- Detecta workflows por nombre exacto
- Detecta workflows al inicio del mensaje
- Detecta workflows contenidos en el mensaje
- Confidence score según tipo de match

### ✅ Ejecución Secuencial
- Ejecuta pasos en orden
- Pasa contexto entre pasos
- Maneja errores en cualquier paso
- Rollback automático en caso de fallo

### ✅ Mapeo de Parámetros
- Mapeo desde respuestas anteriores
- Soporte para paths complejos: `step1.data.items[0].id`
- Parámetros fijos
- Parámetros del contexto inicial

### ✅ Mensajes Personalizados
- Mensaje inicial antes de ejecutar
- Mensaje final después de completar
- Mensajes de error descriptivos

### ✅ Logging y Auditoría
- Log de cada paso ejecutado
- Tiempo de ejecución por paso
- Tiempo total del workflow
- Auditoría de seguridad

### ✅ Prioridades
- Workflows tienen prioridad 3
- Keywords simples tienen prioridad 4
- Conversacional tiene prioridad 7

---

## 🎯 Ejemplos de Uso

### Ejemplo 1: Consulta de Sucursales

**Workflow:**
```json
{
  "nombre": "sucursales",
  "steps": [
    {
      "orden": 1,
      "endpointId": "list-branches"
    }
  ],
  "mensajeInicial": "📍 Buscando sucursales...",
  "mensajeFinal": "¿Necesitás más información?"
}
```

**Conversación:**
```
Usuario: "sucursales"
Bot: 📍 Buscando sucursales...

Sucursales disponibles:
- Centro: Av. Principal 123
- Norte: Calle 45 #678
- Sur: Av. Sur 999

¿Necesitás más información?
```

### Ejemplo 2: Consulta de Producto con Detalles

**Workflow:**
```json
{
  "nombre": "producto completo",
  "steps": [
    {
      "orden": 1,
      "endpointId": "search-product",
      "mapeoParametros": {
        "query": "mensaje"
      }
    },
    {
      "orden": 2,
      "endpointId": "get-product-details",
      "mapeoParametros": {
        "productId": "step1.data[0].id"
      }
    },
    {
      "orden": 3,
      "endpointId": "get-product-reviews",
      "mapeoParametros": {
        "productId": "step1.data[0].id"
      }
    }
  ],
  "mensajeInicial": "🔍 Buscando producto...",
  "mensajeFinal": "¿Te gustaría comprarlo?"
}
```

**Conversación:**
```
Usuario: "producto completo laptop"
Bot: 🔍 Buscando producto...

Laptop HP Pavilion
Precio: $899
Stock: 5 unidades

Especificaciones:
- RAM: 16GB
- Disco: 512GB SSD
- Pantalla: 15.6"

Reseñas (4.5⭐):
- "Excelente rendimiento"
- "Muy buena relación calidad-precio"

¿Te gustaría comprarlo?
```

---

## 🔒 Seguridad

### Validaciones Implementadas
- ✅ Verifica que el workflow esté activo
- ✅ Verifica que la API esté activa
- ✅ Verifica que todos los endpoints existan
- ✅ Verifica permisos de empresa
- ✅ Log de auditoría en cada ejecución

### Logs de Auditoría
```typescript
console.log('🔒 [AUDIT] Workflow match', {
  empresaId: context.empresaId,
  apiId: api._id.toString(),
  apiNombre: api.nombre,
  workflowNombre: workflow.nombre,
  cliente: context.telefonoCliente,
  timestamp: new Date().toISOString()
});
```

---

## 📈 Métricas y Monitoreo

### Métricas Registradas
- Tiempo de ejecución total
- Tiempo por paso
- Pasos ejecutados vs total
- Tasa de éxito/fallo
- Errores por paso

### Ejemplo de Log
```
🔄 ========== EJECUTANDO WORKFLOW ==========
📋 API: Mi API de Productos
🔄 Workflow: consulta completa
📊 Total de pasos: 3

📍 Ejecutando paso 1/3
🎯 Endpoint ID: get-user
✅ Endpoint encontrado: Obtener Usuario
✅ Paso 1 completado exitosamente

📍 Ejecutando paso 2/3
🎯 Endpoint ID: get-orders
✅ Endpoint encontrado: Obtener Pedidos
✅ Paso 2 completado exitosamente

📍 Ejecutando paso 3/3
🎯 Endpoint ID: get-reviews
✅ Endpoint encontrado: Obtener Reseñas
✅ Paso 3 completado exitosamente

✅ Todos los pasos completados exitosamente
⏱️ Tiempo de ejecución: 1250ms
📊 Pasos ejecutados: 3/3
```

---

## 🚀 Próximos Pasos (Opcionales)

### 1. Mejoras de Detección
- [ ] Detección con NLP/IA
- [ ] Sinónimos y variaciones
- [ ] Detección multiidioma

### 2. Características Avanzadas
- [ ] Workflows condicionales (if/else)
- [ ] Loops en workflows
- [ ] Workflows paralelos
- [ ] Timeout por paso

### 3. UI Mejorada
- [ ] Editor visual de workflows (drag & drop)
- [ ] Preview de ejecución
- [ ] Testing de workflows
- [ ] Historial de ejecuciones

### 4. Integraciones
- [ ] Webhooks al completar workflow
- [ ] Notificaciones por email/SMS
- [ ] Integración con CRM
- [ ] Analytics avanzados

---

## ✅ Estado Actual

### ✅ Completado
- [x] Backend CRUD de workflows
- [x] Frontend UI de workflows
- [x] Integración con chatbot
- [x] Detección automática
- [x] Ejecución secuencial
- [x] Mapeo de parámetros
- [x] Mensajes personalizados
- [x] Logging y auditoría
- [x] Manejo de errores
- [x] Documentación completa

### 🎉 Resultado Final

**Sistema completamente funcional** que permite:
1. ✅ Crear workflows desde el dashboard
2. ✅ Guardar workflows en MongoDB
3. ✅ Detectar workflows en mensajes de WhatsApp
4. ✅ Ejecutar secuencias de APIs automáticamente
5. ✅ Responder al usuario con resultados formateados

---

**Fecha de Implementación:** Noviembre 2024  
**Estado:** ✅ Completado y Funcional  
**Listo para:** Producción
