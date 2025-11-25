# 🔄 Workflows Conversacionales - Nuevo Diseño

## 🎯 Objetivo

Rediseñar el sistema de workflows para que funcione como **conversaciones guiadas paso a paso** que recopilan información del usuario antes de ejecutar consultas a APIs, permitiendo filtrar resultados progresivamente.

---

## 📋 Caso de Uso: Búsqueda de iPhone 14

### Problema
Usuario busca "iPhone 14" pero la API devuelve 100 productos:
- 10 son teléfonos iPhone 14
- 90 son fundas, accesorios, etc.

### Solución con Workflows Conversacionales

**Paso 1: Seleccionar Sucursal**
```
Bot: ¿En qué sucursal te gustaría buscar?
     - Centro
     - Norte  
     - Sur

Usuario: norte

Bot: Perfecto, buscaré en la sucursal Norte
```

**Paso 2: Seleccionar Categoría**
```
Bot: ¿Qué tipo de producto buscás?
     - Teléfonos
     - Fundas
     - Accesorios
     - Auriculares

Usuario: telefonos

Bot: Entendido, buscaré en Teléfonos
```

**Paso 3: Nombre del Producto**
```
Bot: ¿Qué modelo buscás?

Usuario: iphne 14  (con typo)

Bot: Encontré estos modelos:
     📱 iPhone 14 - $899 (Stock: 3)
     📱 iPhone 14 Pro - $1099 (Stock: 1)
     📱 iPhone 14 Pro Max - $1199 (Stock: 2)
```

---

## 🏗️ Arquitectura Implementada

### 1. **Tipos de Pasos**

```typescript
export type WorkflowStepType = 'recopilar' | 'ejecutar' | 'validar';
```

- **`recopilar`**: Hace una pregunta y guarda la respuesta
- **`ejecutar`**: Ejecuta un endpoint con los datos recopilados
- **`validar`**: Valida datos antes de continuar

### 2. **Validaciones**

```typescript
export interface IStepValidation {
  tipo: 'texto' | 'numero' | 'opcion' | 'regex';
  opciones?: string[];
  regex?: string;
  mensajeError?: string;
}
```

**Tipos de validación:**
- **`texto`**: Cualquier texto no vacío
- **`numero`**: Solo números
- **`opcion`**: Debe ser una de las opciones (con normalización)
- **`regex`**: Debe cumplir un patrón regex

### 3. **Triggers de Activación**

```typescript
export interface IWorkflowTrigger {
  tipo: 'keyword' | 'primer_mensaje' | 'manual';
  keywords?: string[];
  primeraRespuesta?: boolean;
}
```

**Tipos de trigger:**
- **`keyword`**: Se activa con palabras clave ("buscar producto", "stock")
- **`primer_mensaje`**: Se activa automáticamente en el primer mensaje
- **`manual`**: Se activa manualmente desde el dashboard

### 4. **Estructura de Workflow**

```typescript
export interface IWorkflow {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  
  // Configuración de activación
  trigger: IWorkflowTrigger;
  prioridad?: number;  // Mayor = más prioridad
  
  // Pasos del workflow
  steps: IWorkflowStep[];
  
  // Mensajes
  mensajeInicial?: string;
  mensajeFinal?: string;
  mensajeAbandonar?: string;
  
  // Configuración
  permitirAbandonar?: boolean;
  timeoutMinutos?: number;
}
```

---

## 🔄 Flujo de Ejecución

### 1. **Detección de Trigger**

```typescript
// universalRouter.ts
const workflowMatch = await this.evaluateWorkflowTriggers(context);

if (workflowMatch) {
  return {
    action: 'execute_workflow',
    priority: FlowPriority.API_WORKFLOW,  // Prioridad 3
    handler: 'workflowKeywordHandler',
    metadata: workflowMatch
  };
}
```

**Prioridades:**
1. EMERGENCY = 1
2. MANDATORY = 2
3. **API_WORKFLOW = 3** ⭐ (Workflows conversacionales)
4. API_KEYWORD = 4 (Keywords simples)
5. GUIDED_FLOW = 5
6. QUICK_QUESTION = 6
7. CONVERSATIONAL = 7 (GPT conversacional)

### 2. **Inicio de Workflow**

```typescript
// workflowConversationManager.ts
await workflowConversationManager.startWorkflow(
  contactoId,
  workflowId,
  apiId
);
```

**Estado guardado en MongoDB:**
```javascript
{
  workflowState: {
    workflowId: "abc123",
    apiId: "api456",
    pasoActual: 0,
    datosRecopilados: {},
    intentosFallidos: 0,
    iniciadoEn: ISODate("..."),
    ultimaActividad: ISODate("...")
  }
}
```

### 3. **Recopilación de Datos**

**Paso de Recopilación:**
```typescript
{
  orden: 1,
  tipo: 'recopilar',
  pregunta: '¿En qué sucursal te gustaría buscar?',
  nombreVariable: 'sucursal',
  validacion: {
    tipo: 'opcion',
    opciones: ['Centro', 'Norte', 'Sur'],
    mensajeError: 'Por favor selecciona una sucursal válida'
  }
}
```

**Validación con Normalización:**
```typescript
// Usuario escribe: "nrte" (con typo)
const resultado = validarInput("nrte", step);

// Normaliza: "norte"
// Compara con opciones: "centro", "norte", "sur"
// Resultado: { valido: true, valor: "Norte" }
```

### 4. **Ejecución de Endpoint**

**Paso de Ejecución:**
```typescript
{
  orden: 4,
  tipo: 'ejecutar',
  endpointId: 'buscar-productos',
  mapeoParametros: {
    'sucursal': 'sucursal',        // Usa dato recopilado
    'categoria': 'categoria',       // Usa dato recopilado
    'query': 'producto'             // Usa dato recopilado
  }
}
```

**Mapeo de Parámetros:**
```typescript
// Datos recopilados:
{
  sucursal: "Norte",
  categoria: "Teléfonos",
  producto: "iPhone 14"
}

// Se mapean a parámetros del endpoint:
GET /api/productos?sucursal=Norte&categoria=Teléfonos&query=iPhone+14
```

### 5. **Finalización**

```typescript
const datosRecopilados = await workflowConversationManager.finalizarWorkflow(contactoId);

// Envía mensaje final con resultados
await enviarMensaje(mensajeFinal + resultadosFormateados);
```

---

## 💾 Estructura en MongoDB

### Workflow en ApiConfiguration

```javascript
{
  "_id": ObjectId("..."),
  "empresaId": ObjectId("..."),
  "nombre": "API de Productos",
  "workflows": [
    {
      "id": "workflow-busqueda",
      "nombre": "Búsqueda de Productos",
      "activo": true,
      "trigger": {
        "tipo": "keyword",
        "keywords": ["buscar", "stock", "producto"],
        "primeraRespuesta": false
      },
      "prioridad": 10,
      "steps": [
        {
          "orden": 1,
          "tipo": "recopilar",
          "pregunta": "¿En qué sucursal?",
          "nombreVariable": "sucursal",
          "validacion": {
            "tipo": "opcion",
            "opciones": ["Centro", "Norte", "Sur"]
          }
        },
        {
          "orden": 2,
          "tipo": "recopilar",
          "pregunta": "¿Qué categoría?",
          "nombreVariable": "categoria",
          "validacion": {
            "tipo": "opcion",
            "opciones": ["Teléfonos", "Fundas", "Accesorios"]
          }
        },
        {
          "orden": 3,
          "tipo": "recopilar",
          "pregunta": "¿Qué producto buscás?",
          "nombreVariable": "producto",
          "validacion": {
            "tipo": "texto"
          }
        },
        {
          "orden": 4,
          "tipo": "ejecutar",
          "endpointId": "buscar-productos",
          "mapeoParametros": {
            "sucursal": "sucursal",
            "categoria": "categoria",
            "query": "producto"
          }
        }
      ],
      "mensajeInicial": "🔍 Te ayudo a buscar productos",
      "mensajeFinal": "✅ Aquí están los resultados:",
      "permitirAbandonar": true,
      "timeoutMinutos": 30
    }
  ]
}
```

### Estado en ContactoEmpresa

```javascript
{
  "_id": ObjectId("..."),
  "telefono": "5491112345678",
  "nombre": "Juan",
  "workflowState": {
    "workflowId": "workflow-busqueda",
    "apiId": "api-productos",
    "pasoActual": 2,
    "datosRecopilados": {
      "sucursal": "Norte",
      "categoria": "Teléfonos"
    },
    "intentosFallidos": 0,
    "iniciadoEn": ISODate("2024-11-17T16:00:00Z"),
    "ultimaActividad": ISODate("2024-11-17T16:02:30Z")
  }
}
```

---

## 🎨 Características Implementadas

### ✅ Normalización de Texto

```typescript
normalizarTexto("iPHóNe 14") 
// → "iphone 14"

normalizarTexto("NÓRTE")
// → "norte"
```

- Quita acentos
- Convierte a minúsculas
- Normaliza espacios

### ✅ Validación Flexible

```typescript
// Usuario escribe: "tel" o "telefono" o "teléfonos"
// Todas coinciden con la opción "Teléfonos"

validarInput("tel", {
  tipo: 'opcion',
  opciones: ['Teléfonos', 'Fundas']
})
// → { valido: true, valor: "Teléfonos" }
```

### ✅ Timeout Automático

```typescript
// Si el usuario no responde en 30 minutos:
const expirado = await verificarTimeout(contactoId, 30);

if (expirado) {
  await enviarMensaje("⏰ La búsqueda ha expirado. Escribe 'buscar' para empezar de nuevo.");
}
```

### ✅ Abandono Manual

```typescript
// Usuario escribe: "cancelar" o "salir"
if (mensaje.toLowerCase().includes('cancelar')) {
  await abandonarWorkflow(contactoId);
  await enviarMensaje("🚫 Búsqueda cancelada");
}
```

### ✅ Reintentos con Límite

```typescript
// Máximo 3 intentos por paso
if (intentosFallidos >= 3) {
  await abandonarWorkflow(contactoId);
  await enviarMensaje("❌ Demasiados intentos. Por favor contacta a soporte.");
}
```

---

## 🔧 Archivos Creados/Modificados

### Backend

**Nuevos:**
1. ✅ `workflowConversationManager.ts` - Gestor de estado conversacional

**Modificados:**
1. ✅ `api.types.ts` - Tipos actualizados para workflows conversacionales
2. ✅ `ApiConfiguration.ts` - Schemas actualizados
3. ✅ `ContactoEmpresa.ts` - Campo `workflowState` agregado
4. ✅ `universalRouter.ts` - Prioridades actualizadas (pendiente)
5. ✅ `workflowKeywordHandler.ts` - Handler conversacional (pendiente)

### Frontend (Pendiente)

1. ⏳ `WorkflowManager.tsx` - UI para crear workflows conversacionales
2. ⏳ `WorkflowStepEditor.tsx` - Editor de pasos con validaciones
3. ⏳ `WorkflowTriggerConfig.tsx` - Configuración de triggers

---

## 📊 Ejemplo Completo: Workflow de Búsqueda

### Configuración del Workflow

```json
{
  "nombre": "Búsqueda Inteligente de Productos",
  "trigger": {
    "tipo": "keyword",
    "keywords": ["buscar", "stock", "disponibilidad", "precio"]
  },
  "prioridad": 10,
  "steps": [
    {
      "orden": 1,
      "tipo": "recopilar",
      "pregunta": "¿En qué sucursal querés buscar?\n- Centro\n- Norte\n- Sur",
      "nombreVariable": "sucursal",
      "validacion": {
        "tipo": "opcion",
        "opciones": ["Centro", "Norte", "Sur"],
        "mensajeError": "Por favor seleccioná una sucursal válida: Centro, Norte o Sur"
      },
      "intentosMaximos": 3
    },
    {
      "orden": 2,
      "tipo": "recopilar",
      "pregunta": "¿Qué tipo de producto buscás?\n- Teléfonos\n- Fundas\n- Accesorios\n- Auriculares",
      "nombreVariable": "categoria",
      "validacion": {
        "tipo": "opcion",
        "opciones": ["Teléfonos", "Fundas", "Accesorios", "Auriculares"]
      }
    },
    {
      "orden": 3,
      "tipo": "recopilar",
      "pregunta": "¿Qué modelo o marca estás buscando?",
      "nombreVariable": "query",
      "validacion": {
        "tipo": "texto",
        "mensajeError": "Por favor ingresá el nombre del producto"
      }
    },
    {
      "orden": 4,
      "tipo": "ejecutar",
      "endpointId": "buscar-productos",
      "mapeoParametros": {
        "sucursal": "sucursal",
        "categoria": "categoria",
        "q": "query"
      }
    }
  ],
  "mensajeInicial": "🔍 Te ayudo a buscar productos en nuestro stock",
  "mensajeFinal": "✅ Aquí están los resultados de tu búsqueda:",
  "mensajeAbandonar": "🚫 Búsqueda cancelada. Escribí 'buscar' cuando quieras empezar de nuevo.",
  "permitirAbandonar": true,
  "timeoutMinutos": 30
}
```

### Conversación Resultante

```
Usuario: buscar iphone

Bot: 🔍 Te ayudo a buscar productos en nuestro stock
     
     ¿En qué sucursal querés buscar?
     - Centro
     - Norte
     - Sur

Usuario: nrte

Bot: Perfecto, buscaré en la sucursal Norte
     
     ¿Qué tipo de producto buscás?
     - Teléfonos
     - Fundas
     - Accesorios
     - Auriculares

Usuario: tel

Bot: Entendido, buscaré en Teléfonos
     
     ¿Qué modelo o marca estás buscando?

Usuario: iphne 14

Bot: ✅ Aquí están los resultados de tu búsqueda:
     
     📱 iPhone 14 128GB - $899
        Stock: 3 unidades
        Sucursal: Norte
     
     📱 iPhone 14 256GB - $999
        Stock: 1 unidad
        Sucursal: Norte
     
     📱 iPhone 14 Pro 128GB - $1099
        Stock: 2 unidades
        Sucursal: Norte
```

---

## 🚀 Próximos Pasos

### Fase 1: Backend (Completado ✅)
- [x] Tipos actualizados
- [x] Schemas actualizados
- [x] Gestor de estado conversacional
- [x] Modelo ContactoEmpresa actualizado

### Fase 2: Integración (Pendiente ⏳)
- [ ] Actualizar universalRouter
- [ ] Actualizar workflowKeywordHandler
- [ ] Integrar con whatsappController
- [ ] Testing de flujo completo

### Fase 3: Frontend (Pendiente ⏳)
- [ ] UI para crear workflows conversacionales
- [ ] Editor de pasos con validaciones
- [ ] Configuración de triggers
- [ ] Preview de conversación

---

**Estado Actual:** Backend completado, listo para integración  
**Fecha:** Noviembre 2024  
**Compilación:** ✅ Exitosa
