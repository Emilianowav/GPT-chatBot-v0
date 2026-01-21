# TROUBLESHOOTING Y FAQ

## Índice
1. [Problemas Comunes](#problemas-comunes)
2. [Errores de Configuración](#errores-de-configuración)
3. [Debugging](#debugging)
4. [FAQ](#faq)
5. [Mejores Prácticas](#mejores-prácticas)

---

## Problemas Comunes

### 1. El GPT genera variables literales `{{variable}}`

**Síntoma:**
```
Usuario: "tienen libros de inglés?"
Bot: "{{topicos.productos.libros_ingles.descripcion}}"
```

**Causa:**
El prompt del GPT le indica que use variables en lugar de usar la información directamente.

**Solución:**
```typescript
// ❌ MAL - Prompt que genera variables
systemPrompt: `Responde usando: {{topicos.productos.libros_ingles.descripcion}}`

// ✅ BIEN - Prompt que usa información directa
systemPrompt: `Sos el asistente de la librería.

IMPORTANTE:
- Usá la información que tenés en tu contexto directamente
- NO uses variables como {{variable}}, usá el texto directamente
- Si tenés información sobre libros en inglés, mencionala directamente`
```

### 2. Router no dirige correctamente

**Síntoma:**
El flujo siempre toma la misma ruta, sin importar la condición.

**Causa:**
- Handles no configurados correctamente
- Condiciones mal escritas
- Variables no existen en el contexto

**Solución:**
```typescript
// ✅ Verificar que el router tenga handles
{
  id: "router-principal",
  type: "router",
  data: {
    handles: [  // ← CRÍTICO: debe tener handles
      {
        id: "route-busqueda",
        label: "Búsqueda",
        condition: "{{gpt-clasificador.respuesta_gpt}} == 'busqueda'"
      }
    ]
  }
}

// ✅ Verificar que las conexiones usen sourceHandle
{
  source: "router-principal",
  sourceHandle: "route-busqueda",  // ← CRÍTICO: debe coincidir con handle.id
  target: "woocommerce-search"
}

// ✅ Verificar que la variable existe
// En logs del backend, buscar:
// "🔎 [getVariableValue] Buscando: gpt-clasificador.respuesta_gpt"
// "✅ Valor final: busqueda"
```

### 3. Variables no se resuelven

**Síntoma:**
```
Mensaje enviado: "Hola {{nombre_contacto}}"
En lugar de: "Hola Juan"
```

**Causa:**
- Variable no existe en el contexto
- Nombre de variable incorrecto
- Nodo anterior no ejecutó correctamente

**Solución:**
```typescript
// 1. Verificar que la variable existe en globalVariables
console.log(this.globalVariables);
// { telefono: "...", nombre_contacto: "Juan", ... }

// 2. Verificar que el nodo anterior se ejecutó
console.log(this.context);
// { "gpt-clasificador": { output: { ... } } }

// 3. Usar el nombre correcto
"{{nombre_contacto}}"  // ✅ Correcto
"{{nombreContacto}}"   // ❌ Incorrecto (camelCase)
"{{nombre}}"           // ❌ Incorrecto (nombre diferente)
```

### 4. Error 500 al guardar flujo

**Síntoma:**
```
PUT http://localhost:3000/api/flows/xxx 500 (Internal Server Error)
```

**Causa:**
- Falta campo requerido en el flujo
- Validación de Mongoose falla
- Campo `config` no definido

**Solución:**
```typescript
// Asegurar que el flujo tenga todos los campos requeridos
const flowData = {
  nombre: flowName,
  empresaId: 'Tu Empresa',
  activo: currentFlowActive,
  nodes,
  edges,
  config: {}  // ← CRÍTICO: siempre incluir config
};

// Si el error persiste, usar updateOne en lugar de save
await FlowModel.updateOne(
  { _id: flowId },
  { $set: { nodes, edges, updatedAt: new Date() } }
);
```

### 5. Toggle de flujo retorna 404

**Síntoma:**
```
PATCH http://localhost:3000/api/flows/xxx/toggle 404 (Not Found)
```

**Causa:**
Rutas en `flowRoutes.ts` están en orden incorrecto.

**Solución:**
```typescript
// ✅ CORRECTO - Rutas específicas ANTES de genéricas
router.get('/by-id/:flowId', ...);
router.patch('/:flowId/toggle', ...);
router.get('/', ...);
router.post('/', ...);
router.put('/:flowId', ...);
router.delete('/:flowId', ...);
router.get('/:empresaId', ...);  // ← Al final

// ❌ INCORRECTO - Ruta genérica captura todas las requests
router.get('/:empresaId', ...);  // ← Captura /by-id/xxx y /:flowId/toggle
router.get('/by-id/:flowId', ...);  // ← Nunca se alcanza
```

### 6. Tópicos no se inyectan en GPT

**Síntoma:**
El GPT no tiene acceso a la información de los tópicos.

**Causa:**
- `topicos_habilitados` está en `false`
- Tópicos no están definidos en `flow.config`
- FlowExecutor no carga los tópicos

**Solución:**
```typescript
// 1. Verificar configuración del flujo
{
  "config": {
    "topicos_habilitados": true,  // ← Debe ser true
    "topicos": {
      "empresa": { ... }
    }
  }
}

// 2. Verificar logs del backend
// "📚 [TÓPICOS] Cargados: empresa, horarios, productos"
// "📚 [TÓPICOS GLOBALES] Inyectando automáticamente 9 tópico(s)"

// 3. Reiniciar backend para cargar cambios
```

---

## Errores de Configuración

### Error: "Path `startNode` is required"

```typescript
// ❌ Falta startNode
{
  nombre: "Mi Bot",
  nodes: [...],
  edges: [...]
}

// ✅ Incluir startNode
{
  nombre: "Mi Bot",
  startNode: "webhook-whatsapp",  // ← ID del primer nodo
  nodes: [...],
  edges: [...]
}
```

### Error: "Path `createdBy` is required"

```typescript
// ❌ Falta createdBy
{
  nombre: "Mi Bot",
  startNode: "webhook-whatsapp"
}

// ✅ Incluir createdBy
{
  nombre: "Mi Bot",
  startNode: "webhook-whatsapp",
  createdBy: "usuario@email.com"  // ← Email del usuario
}
```

### Error: "Duplicate key error: empresaId_1_id_1"

```typescript
// ❌ Ya existe un flujo con el mismo empresaId e id
{
  empresaId: "Veo Veo",
  id: "veo-veo-v1"  // ← Ya existe
}

// ✅ Usar id diferente o eliminar campo id
{
  empresaId: "Veo Veo",
  id: "veo-veo-v2"  // ← Nuevo id
}

// O usar _id de MongoDB
{
  empresaId: "Veo Veo"
  // id se genera automáticamente
}
```

---

## Debugging

### 1. Logs del Backend

**Activar logs detallados:**
```typescript
// FlowExecutor.ts
console.log('\n═══════════════════════════════════════════════════════════');
console.log(`📝 NODO GPT: ${node.data.label}`);
console.log('═══════════════════════════════════════════════════════════');
console.log('\n📥 INPUT RECIBIDO:');
console.log(JSON.stringify(input, null, 2));
```

**Buscar errores:**
```bash
# En Windows PowerShell
cd backend
npm run dev | Select-String "ERROR"
npm run dev | Select-String "❌"

# Ver logs completos
npm run dev > logs.txt
```

### 2. Inspeccionar Flujo en BD

```javascript
// Conectar a MongoDB
use chatbot_db

// Ver flujo completo
db.flows.findOne({ nombre: "Mi Bot v1" })

// Ver solo nodos
db.flows.findOne(
  { nombre: "Mi Bot v1" },
  { nodes: 1 }
)

// Ver solo edges
db.flows.findOne(
  { nombre: "Mi Bot v1" },
  { edges: 1 }
)

// Ver configuración
db.flows.findOne(
  { nombre: "Mi Bot v1" },
  { config: 1 }
)
```

### 3. Verificar Contexto de Ejecución

```typescript
// En FlowExecutor, agregar logs
console.log('\n📋 CONTEXTO ACTUAL:');
console.log(JSON.stringify(this.context, null, 2));

console.log('\n🌍 VARIABLES GLOBALES:');
console.log(JSON.stringify(this.globalVariables, null, 2));

console.log('\n📚 TÓPICOS:');
console.log(JSON.stringify(this.topicos, null, 2));
```

### 4. Probar Resolución de Variables

```typescript
// En FlowExecutor
const test = this.resolveVariableInString("{{telefono}}");
console.log('Test resolución:', test);
// → "5493794946066"

const test2 = this.resolveVariableInString("{{gpt-clasificador.intencion}}");
console.log('Test resolución 2:', test2);
// → "busqueda"
```

### 5. Scripts de Debugging

```javascript
// backend/scripts/debug-flujo.mjs
import fetch from 'node-fetch';

async function debugFlujo() {
  const response = await fetch('http://localhost:3000/api/flows/by-id/xxx');
  const flow = await response.json();
  
  console.log('📋 FLUJO:', flow.nombre);
  console.log('\n=== NODOS ===');
  flow.nodes.forEach(node => {
    console.log(`${node.id} (${node.type})`);
    if (node.type === 'router') {
      console.log(`  Handles: ${node.data.handles?.length || 0}`);
    }
  });
  
  console.log('\n=== CONEXIONES ===');
  flow.edges.forEach(edge => {
    console.log(`${edge.source} → ${edge.target}`);
    if (edge.sourceHandle) {
      console.log(`  Handle: ${edge.sourceHandle}`);
    }
  });
  
  console.log('\n=== CONFIGURACIÓN ===');
  console.log('Tópicos habilitados:', flow.config?.topicos_habilitados);
  console.log('Tópicos:', Object.keys(flow.config?.topicos || {}));
}

debugFlujo();
```

---

## FAQ

### ¿Cómo agregar un nuevo tipo de nodo?

1. **Crear componente en frontend:**
```typescript
// front_crm/bot_crm/src/components/flow-builder/nodes/MiNodoCustom.tsx
export const MiNodoCustom = ({ data, id }: NodeProps) => {
  return (
    <div className={styles.customNode}>
      <div className={styles.header}>
        <span>{data.label}</span>
      </div>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};
```

2. **Registrar en nodeTypes:**
```typescript
// flow-builder/page.tsx
const nodeTypes = useMemo(() => ({
  gpt: CustomNode,
  whatsapp: CustomNode,
  router: RouterNode,
  miNodoCustom: MiNodoCustom  // ← Nuevo tipo
}), []);
```

3. **Agregar a paleta:**
```typescript
// NodePalette.tsx
const nodeCategories = {
  actions: [
    { type: 'whatsapp', label: 'WhatsApp' },
    { type: 'miNodoCustom', label: 'Mi Nodo Custom' }
  ]
};
```

4. **Implementar ejecución en backend:**
```typescript
// FlowExecutor.ts
private async executeNode(node: any, input: any): Promise<NodeExecutionResult> {
  switch (node.type) {
    case 'gpt':
      return await this.executeGPTNode(node, input);
    case 'miNodoCustom':
      return await this.executeMiNodoCustom(node, input);
    // ...
  }
}

private async executeMiNodoCustom(node: any, input: any): Promise<NodeExecutionResult> {
  const config = node.data.config;
  
  // Implementar lógica del nodo
  const output = {
    resultado: 'Mi resultado'
  };
  
  return { output };
}
```

### ¿Cómo hacer que un nodo ejecute código personalizado?

Usar el nodo de tipo `api-call` para llamar a endpoints personalizados:

```typescript
{
  id: "mi-api-custom",
  type: "api-call",
  data: {
    config: {
      apiConfigId: "xxx",
      endpointId: "mi-endpoint",
      parametros: {
        dato1: "{{variable1}}",
        dato2: "{{variable2}}"
      }
    }
  }
}
```

### ¿Cómo agregar validaciones a las conexiones?

En el frontend, al crear una conexión:

```typescript
const onConnect = useCallback((params: Connection) => {
  const sourceNode = nodes.find(n => n.id === params.source);
  const targetNode = nodes.find(n => n.id === params.target);
  
  // Validación 1: No conectar trigger a trigger
  if (sourceNode?.category === 'trigger' && targetNode?.category === 'trigger') {
    alert('No se puede conectar un trigger a otro trigger');
    return;
  }
  
  // Validación 2: Router debe tener sourceHandle
  if (sourceNode?.type === 'router' && !params.sourceHandle) {
    alert('Debes seleccionar una ruta del router');
    return;
  }
  
  // Crear conexión
  setEdges((eds) => addEdge(params, eds));
}, [nodes]);
```

### ¿Cómo manejar errores en la ejecución?

```typescript
// FlowExecutor.ts
try {
  const result = await this.executeNode(node, input);
  this.context[node.id] = { output: result.output };
} catch (error) {
  console.error(`❌ Error ejecutando nodo ${node.id}:`, error);
  
  // Guardar error en contexto
  this.context[node.id] = {
    output: null,
    error: error.message
  };
  
  // Enviar mensaje de error al usuario
  await this.executeWhatsAppNode({
    data: {
      config: {
        telefono: this.getGlobalVariable('telefono'),
        mensaje: 'Lo siento, ocurrió un error. Por favor intenta nuevamente.'
      }
    }
  }, {});
  
  // Detener ejecución
  throw error;
}
```

### ¿Cómo implementar un flujo con múltiples idiomas?

```typescript
// Agregar idioma a tópicos
{
  "config": {
    "topicos": {
      "idioma_actual": "es",
      "mensajes": {
        "es": {
          "saludo": "¡Hola! ¿En qué puedo ayudarte?",
          "despedida": "¡Hasta luego!"
        },
        "en": {
          "saludo": "Hello! How can I help you?",
          "despedida": "Goodbye!"
        }
      }
    }
  }
}

// Usar en nodos
{
  config: {
    mensaje: "{{topicos.mensajes.{{topicos.idioma_actual}}.saludo}}"
  }
}
```

---

## Mejores Prácticas

### 1. Estructura de Flujos

```
✅ BUENO:
- Un flujo por funcionalidad principal
- Máximo 20-30 nodos por flujo
- Routers para separar lógica
- Nombres descriptivos de nodos

❌ MALO:
- Un solo flujo gigante con todo
- Más de 50 nodos en un flujo
- Nombres genéricos: "nodo1", "gpt2"
```

### 2. Configuración de GPT

```typescript
✅ BUENO:
systemPrompt: `Sos el asistente de ventas.

TU TAREA:
- Presentar productos
- Ayudar a elegir
- Ofrecer agregar al carrito

IMPORTANTE:
- Usá emojis
- Sé breve
- NO uses variables`

❌ MALO:
systemPrompt: `Responde con {{variable}} y usa {{otra_variable}}`
```

### 3. Manejo de Variables

```typescript
✅ BUENO:
- Usar nombres descriptivos: {{nombre_contacto}}, {{precio_total}}
- Verificar existencia con fallbacks: {{variable || 'default'}}
- Documentar variables en comentarios

❌ MALO:
- Nombres genéricos: {{var1}}, {{x}}
- No verificar existencia
- Asumir que variables siempre existen
```

### 4. Routers

```typescript
✅ BUENO:
- Siempre tener ruta por defecto con condition: "true"
- Condiciones claras y específicas
- Máximo 5-6 rutas por router

❌ MALO:
- Sin ruta por defecto
- Condiciones complejas con múltiples operadores
- Más de 10 rutas en un router
```

### 5. Testing

```
✅ BUENO:
- Limpiar estado antes de cada prueba
- Probar todos los caminos del flujo
- Verificar logs del backend
- Probar con datos reales

❌ MALO:
- Probar sin limpiar estado
- Solo probar el camino feliz
- No revisar logs
- Probar solo con datos de ejemplo
```

---

**Documentación completa del sistema de flujos finalizada.**

Para más información, consultar:
- `01-ARQUITECTURA-SISTEMA-FLUJOS.md`
- `02-CONFIGURACION-NODOS.md`
- `03-SISTEMA-VARIABLES-TOPICOS.md`
- `04-GUIA-CREAR-BOT-DESDE-CERO.md`
- `05-TROUBLESHOOTING-FAQ.md`
