# 🌊 Arquitectura Unificada de Flows

## 📋 Visión General

Sistema centralizado que maneja **2 tipos de bots** desde una única interfaz de gestión de flujos:

### **Tipo 1: Bot Conversacional (GPT)**
- Respuestas dinámicas con IA
- Sin pasos predefinidos
- Contexto libre y adaptativo
- `botType: 'conversacional'`

### **Tipo 2: Bot de Pasos**
- Flujo estructurado paso a paso
- Dos subtipos:
  - **API**: Integración con sistemas externos (WooCommerce, APIs REST)
    - `botType: 'pasos'` + `pasosSubType: 'api'`
  - **CRM**: Gestión interna (reservas, datos del CRM)
    - `botType: 'pasos'` + `pasosSubType: 'crm'`

---

## 🗂️ Estructura de Datos

### **Colección: `flows`**
Contenedor principal del flujo

```typescript
{
  empresaId: string,
  id: string,
  nombre: string,
  descripcion: string,
  categoria: 'ventas' | 'soporte' | 'reservas' | 'informacion' | 'otro',
  
  // TIPO DE BOT
  botType: 'conversacional' | 'pasos',
  pasosSubType: 'api' | 'crm', // Solo si botType === 'pasos'
  
  // CONFIGURACIÓN DE API (solo para pasos + api)
  apiConfig: {
    apiConfigurationId: ObjectId, // Referencia a api_configurations
    workflowId: string,
    baseUrl: string,
    endpoints: [
      { id: string, nombre: string, metodo: string, path: string }
    ]
  },
  
  startNode: string,
  triggers: {
    keywords: string[],
    patterns: string[],
    priority: number,
    primeraRespuesta: boolean
  },
  
  settings: {
    timeout: number,
    maxRetries: number,
    enableGPT: boolean,
    permitirAbandonar: boolean,
    timeoutMinutos: number
  },
  
  activo: boolean
}
```

### **Colección: `flownodes`**
Nodos individuales del flujo

```typescript
{
  empresaId: string,
  flowId: string,
  id: string,
  type: 'menu' | 'input' | 'message' | 'condition' | 'action' | 
        'api_call' | 'gpt' | 'recopilar' | 'consulta_filtrada' | 'confirmacion',
  name: string,
  message: string,
  
  // Para nodos tipo menu
  options: [
    { text: string, value: string, next: string }
  ],
  
  // Para nodos tipo input/recopilar
  nombreVariable: string,
  validation: {
    type: 'texto' | 'numero' | 'opcion' | 'email' | 'phone',
    min: number,
    max: number,
    opciones: string[],
    mensajeError: string
  },
  
  // Para nodos tipo api_call/consulta_filtrada
  endpointId: string,
  endpointResponseConfig: {
    arrayPath: string,
    idField: string,
    displayField: string,
    priceField: string,
    stockField: string
  },
  
  // Para nodos tipo action
  action: {
    type: 'create_payment_link' | 'api_call' | 'save_data',
    endpointId: string,
    parameterMapping: {
      [param]: { source: 'variable' | 'fixed', variableName: string }
    }
  },
  
  next: string,
  metadata: {
    orden: number, // Orden del paso en el workflow
    position: { x: number, y: number }
  },
  
  activo: boolean
}
```

---

## 🔄 Migración desde `api_configurations`

### **Mapeo de Tipos**

| Workflow Step (api_configurations) | FlowNode Type |
|-----------------------------------|---------------|
| `recopilar` | `recopilar` o `input` |
| `input` | `input` |
| `confirmacion` | `confirmacion` o `menu` |
| `consulta_filtrada` | `consulta_filtrada` o `api_call` |
| `validar` | `input` con validación |

### **Proceso de Migración**

1. **Crear Flow** desde workflow de `api_configurations`:
   ```typescript
   {
     botType: 'pasos',
     pasosSubType: 'api',
     apiConfig: {
       apiConfigurationId: api._id,
       workflowId: workflow.id,
       baseUrl: api.baseUrl,
       endpoints: api.endpoints.map(...)
     },
     triggers: {
       keywords: workflow.trigger.keywords,
       primeraRespuesta: workflow.trigger.primeraRespuesta
     }
   }
   ```

2. **Crear FlowNodes** desde steps del workflow:
   ```typescript
   workflow.steps.forEach((step, index) => {
     {
       type: mapStepTypeToNodeType(step.tipo),
       name: step.nombre,
       message: step.pregunta,
       nombreVariable: step.nombreVariable,
       endpointId: step.endpointId,
       endpointResponseConfig: step.endpointResponseConfig,
       validation: step.validacion,
       metadata: { orden: step.orden },
       next: getNextNodeId(steps, index)
     }
   })
   ```

---

## 🎯 Ventajas del Sistema Unificado

### **Para el Usuario (Frontend)**
✅ Una sola interfaz para gestionar todos los flujos
✅ Visualización clara del tipo de bot
✅ Editor visual de nodos para ambos tipos
✅ Configuración de APIs integrada

### **Para el Backend**
✅ Modelo de datos consistente
✅ Reutilización de lógica de ejecución
✅ Migración gradual desde `api_configurations`
✅ Mantiene compatibilidad con sistema antiguo

### **Para el Negocio**
✅ Escalabilidad para nuevos tipos de bots
✅ Mantenimiento simplificado
✅ Documentación centralizada
✅ Auditoría y versionado unificado

---

## 🚀 Próximos Pasos

1. ✅ Modelos extendidos (`Flow` y `FlowNode`)
2. 🔄 Script de migración de `api_configurations` → `flows`
3. 📝 API REST para gestión de flows unificados
4. 🎨 Frontend actualizado con selector de tipo de bot
5. 🔧 Handler unificado que ejecute ambos tipos
6. 📊 Dashboard de monitoreo de flujos

---

## 📝 Notas Técnicas

- **Compatibilidad**: El sistema antiguo (`api_configurations`) seguirá funcionando
- **Migración**: Gradual, sin downtime
- **Rollback**: Posible en cualquier momento
- **Performance**: Índices optimizados para ambos tipos
- **Seguridad**: Aislamiento por `empresaId` mantenido
