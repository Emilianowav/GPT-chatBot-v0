# SOLUCIÓN: Sistema de Estado de Flujo Persistente

## Problema Actual

Cada mensaje del usuario ejecuta el flujo COMPLETO desde el inicio:

```
Mensaje 1: "Hola"
  → Ejecuta: webhook → formateador → router → pedir-datos → whatsapp [STOP]

Mensaje 2: "Busco harry potter 5"
  → Ejecuta: webhook → formateador → router → pedir-datos → whatsapp [STOP]
  ❌ Vuelve a pedir los mismos datos

Mensaje 3: "cualquiera"
  → Ejecuta: webhook → formateador → router → pedir-datos → whatsapp [STOP]
  ❌ Loop infinito
```

## Causa Raíz

En `whatsappController.ts:224-237`, cada webhook crea un nuevo `FlowExecutor` y ejecuta desde el nodo inicial:

```typescript
const executor = new FlowExecutor();
const resultado = await executor.execute(flowVisual._id.toString(), {...});
```

**No hay persistencia del estado entre mensajes.**

## Solución: Sistema de Estado Persistente

### 1. Modelo de Estado de Flujo

Crear un modelo MongoDB para guardar el estado del flujo por contacto:

```typescript
// models/FlowState.ts
interface FlowState {
  contactoId: ObjectId;
  flowId: ObjectId;
  currentNodeId: string;        // Último nodo ejecutado
  waitingForInput: boolean;     // ¿Está esperando respuesta del usuario?
  context: Record<string, any>; // Variables globales + outputs de nodos
  lastUpdated: Date;
}
```

### 2. Modificar FlowExecutor

Agregar métodos para:

```typescript
class FlowExecutor {
  // Guardar estado cuando el flujo se detiene
  async saveState(contactoId: string, currentNodeId: string) {
    await FlowStateModel.updateOne(
      { contactoId, flowId: this.flowId },
      {
        currentNodeId,
        waitingForInput: true,
        context: {
          globalVariables: this.globalVariables,
          nodeOutputs: this.context
        },
        lastUpdated: new Date()
      },
      { upsert: true }
    );
  }

  // Cargar estado al iniciar
  async loadState(contactoId: string) {
    const state = await FlowStateModel.findOne({ contactoId, flowId: this.flowId });
    if (state && state.waitingForInput) {
      this.globalVariables = state.context.globalVariables;
      this.context = state.context.nodeOutputs;
      return state.currentNodeId; // Nodo desde donde reanudar
    }
    return null; // Iniciar desde el principio
  }
}
```

### 3. Lógica de Reanudación

```typescript
// En whatsappController.ts
const executor = new FlowExecutor();

// Cargar estado previo
const resumeFromNode = await executor.loadState(contacto._id.toString());

if (resumeFromNode) {
  console.log(`🔄 Reanudando flujo desde nodo: ${resumeFromNode}`);
  // Ejecutar desde el nodo siguiente al que envió el mensaje
  await executor.executeFromNode(flowVisual._id.toString(), resumeFromNode, {...});
} else {
  console.log('🆕 Iniciando flujo desde el principio');
  // Ejecutar flujo completo
  await executor.execute(flowVisual._id.toString(), {...});
}
```

### 4. Detectar Cuándo Detener el Flujo

En `FlowExecutor.ts`, cuando se ejecuta un nodo de WhatsApp que envía mensaje:

```typescript
private async executeWhatsAppNode(node: any, input: any) {
  // ... enviar mensaje ...
  
  // GUARDAR ESTADO: El flujo se detiene aquí esperando respuesta
  await this.saveState(this.contactoId, node.id);
  
  // Marcar que el flujo debe detenerse
  this.shouldStop = true;
  
  return { output: {...} };
}
```

## Flujo Corregido

```
Mensaje 1: "Hola"
  → Ejecuta: webhook → formateador → router → pedir-datos → whatsapp
  → GUARDA ESTADO: currentNode = "whatsapp-preguntar", waitingForInput = true
  → DETIENE FLUJO

Mensaje 2: "Busco harry potter 5"
  → CARGA ESTADO: currentNode = "whatsapp-preguntar"
  → REANUDA: formateador → router → pedir-datos → whatsapp
  → GUARDA ESTADO: currentNode = "whatsapp-preguntar"
  → DETIENE FLUJO

Mensaje 3: "cualquiera"
  → CARGA ESTADO: currentNode = "whatsapp-preguntar"
  → REANUDA: formateador → router (ahora variables_completas = true) → woocommerce → ...
  → ✅ Continúa al siguiente paso
```

## Implementación Rápida (Sin Modelo)

Si no quieres crear un modelo nuevo, puedes guardar el estado en el Contacto:

```typescript
// En models/Contacto.ts
interface Contacto {
  // ... campos existentes ...
  flowState?: {
    flowId: string;
    currentNodeId: string;
    waitingForInput: boolean;
    context: any;
  };
}
```

## Alternativa Simple: Usar Variables Globales

En lugar de guardar el nodo actual, puedes usar las **variables globales** para determinar en qué paso está:

```typescript
// En FlowExecutor, al inicio del execute()
const hasVariables = this.globalVariables.titulo && 
                     this.globalVariables.editorial && 
                     this.globalVariables.edicion;

if (hasVariables) {
  // Saltar directo al nodo de WooCommerce
  const woocommerceNode = this.flow.nodes.find(n => n.type === 'woocommerce');
  if (woocommerceNode) {
    return await this.executeFromNode(woocommerceNode.id, input);
  }
}
```

## Recomendación

**Implementar el sistema de estado persistente** es la solución correcta y escalable. Te permite:

- ✅ Reanudar flujos en cualquier punto
- ✅ Manejar flujos complejos con múltiples pasos
- ✅ Evitar loops y re-ejecuciones
- ✅ Soportar flujos de larga duración
- ✅ Debugging más fácil (ver en qué nodo está cada contacto)

¿Quieres que implemente esta solución?
