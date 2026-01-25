# 🔧 VALIDADORES CON NODOS ANTERIORES - IMPLEMENTACIÓN

## 📋 Objetivo

Permitir que los validadores (filtros en conexiones/edges) puedan acceder a los **outputs de nodos anteriores** además de variables globales. Esto es esencial para el flujo de Intercapital donde el Router necesita leer el output del GPT Procesador.

---

## 🎯 Caso de Uso: Intercapital

**Flujo:**
```
GPT Procesador → Router → 5 Ramas (COMPRA, VENTA, PORTFOLIO, CONSULTA, AYUDA)
```

**Problema:**
- El GPT Procesador genera `topico_identificado` con valores: COMPRA, VENTA, PORTFOLIO, CONSULTA, AYUDA
- El Router necesita leer este valor para dirigir el flujo a la rama correcta
- Actualmente solo puede usar variables globales

**Solución:**
- Los validadores ahora pueden acceder a `{{node-id.output}}` o `{{node-id.topico_identificado}}`
- El Router puede leer directamente el output del GPT Procesador

---

## ✅ Cambios Implementados

### 1. **Frontend - EdgeConfigModal**

**Archivo:** `page.tsx` (líneas 1977-2002)

**Cambio:** Calcular nodos anteriores disponibles para el edge

```typescript
availableNodes={(() => {
  // Calcular nodos anteriores (source nodes) que alimentan este edge
  const edge = edges.find(e => e.id === selectedEdgeId);
  if (!edge) return [];
  
  const sourceNodeId = edge.source;
  const previousNodes: string[] = [];
  
  // Función recursiva para encontrar todos los nodos anteriores
  const findPreviousNodes = (nodeId: string, visited = new Set<string>()) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    previousNodes.push(nodeId);
    
    // Encontrar edges que llegan a este nodo
    const incomingEdges = edges.filter(e => e.target === nodeId);
    incomingEdges.forEach(e => findPreviousNodes(e.source, visited));
  };
  
  findPreviousNodes(sourceNodeId);
  
  // Retornar solo los nodos anteriores con su información
  return nodes
    .filter(n => previousNodes.includes(n.id))
    .map(n => ({ id: n.id, label: n.data.label, type: n.type || 'default' }));
})()}
```

**Beneficio:** El modal ahora solo muestra nodos que realmente pueden alimentar datos al edge actual.

---

### 2. **Frontend - VariableSelector**

**Archivo:** `VariableSelector.tsx` (líneas 71-84)

**Cambio:** Agregar variables específicas para nodos GPT y HTTP

```typescript
if (node.type === 'gpt' || node.type === 'openai') {
  baseVars.push(
    { name: 'respuesta_gpt', value: `{{${node.id}.respuesta_gpt}}`, nodeId: node.id, nodeLabel: node.label },
    { name: 'topico_identificado', value: `{{${node.id}.topico_identificado}}`, nodeId: node.id, nodeLabel: node.label },
    { name: 'outputVariable', value: `{{${node.id}.outputVariable}}`, nodeId: node.id, nodeLabel: node.label },
    { name: 'tokens', value: `{{${node.id}.tokens}}`, nodeId: node.id, nodeLabel: node.label },
    { name: 'costo', value: `{{${node.id}.costo}}`, nodeId: node.id, nodeLabel: node.label }
  );
} else if (node.type === 'http') {
  baseVars.push(
    { name: 'response', value: `{{${node.id}.response}}`, nodeId: node.id, nodeLabel: node.label },
    { name: 'status', value: `{{${node.id}.status}}`, nodeId: node.id, nodeLabel: node.label },
    { name: 'data', value: `{{${node.id}.data}}`, nodeId: node.id, nodeLabel: node.label }
  );
}
```

**Beneficio:** Ahora el selector muestra variables específicas del tipo de nodo, incluyendo `topico_identificado` para GPT.

---

### 3. **Frontend - GPTConfigPanel**

**Archivo:** `GPTConfigPanel.tsx` (líneas 6-15, 620-684)

**Cambios:**
1. Actualizada interfaz `Topico` para soportar formato Intercapital
2. Corregido warning de React keys
3. Soporte para ambos formatos: antiguo (titulo/contenido) y nuevo (nombre/descripcion)

```typescript
interface Topico {
  id?: string;
  titulo?: string;
  contenido?: string;
  keywords?: string[];
  // Formato Intercapital
  nombre?: string;
  descripcion?: string;
  categoria?: string;
}
```

**Beneficio:** Los tópicos de Intercapital se muestran correctamente en el panel de configuración.

---

## 🔄 Próximos Pasos (Backend)

### 4. **Backend - FlowExecutor** (PENDIENTE)

**Archivo:** `FlowExecutor.ts`

**Cambio necesario:** Actualizar evaluación de condiciones para soportar outputs de nodos

**Formato actual:**
```
{{variable_global}} == "valor"
```

**Formato nuevo:**
```
{{node-id.output}} == "COMPRA"
{{node-id.topico_identificado}} == "VENTA"
```

**Implementación:**
1. Detectar si la variable tiene formato `node-id.property`
2. Buscar el resultado del nodo en el contexto de ejecución
3. Extraer la propiedad específica
4. Evaluar la condición

**Código propuesto:**
```typescript
private evaluateCondition(condition: string, variables: Record<string, any>, nodeResults: Map<string, any>): boolean {
  // Detectar si es una variable de nodo: {{node-id.property}}
  const nodeVarMatch = condition.match(/\{\{([^.]+)\.([^}]+)\}\}/);
  
  if (nodeVarMatch) {
    const [, nodeId, property] = nodeVarMatch;
    const nodeResult = nodeResults.get(nodeId);
    
    if (nodeResult && nodeResult[property] !== undefined) {
      return nodeResult[property];
    }
  }
  
  // Fallback a variables globales
  return variables[condition];
}
```

---

## 📊 Ejemplo de Uso: Router de Intercapital

**Configuración del Router:**

**Rama 1 - COMPRA:**
```
Condición: {{node-1768863064253.topico_identificado}} == "COMPRA"
```

**Rama 2 - VENTA:**
```
Condición: {{node-1768863064253.topico_identificado}} == "VENTA"
```

**Rama 3 - PORTFOLIO:**
```
Condición: {{node-1768863064253.topico_identificado}} == "PORTFOLIO"
```

**Rama 4 - CONSULTA:**
```
Condición: {{node-1768863064253.topico_identificado}} == "CONSULTA"
```

**Rama 5 - AYUDA:**
```
Condición: {{node-1768863064253.topico_identificado}} == "AYUDA"
```

Donde `node-1768863064253` es el ID del GPT Procesador.

---

## ✅ Ventajas de esta Solución

1. **Más flexible:** Los validadores pueden acceder a cualquier output de nodos anteriores
2. **Menos complejidad:** No necesitas crear variables globales dinámicamente
3. **Más intuitivo:** El flujo es claro visualmente
4. **Escalable:** Funciona para cualquier tipo de nodo (GPT, HTTP, MercadoPago, etc.)
5. **Mantenible:** El código es más limpio y fácil de entender

---

## 🧪 Testing

**Pasos para probar:**

1. Crear un flujo: `GPT Procesador → Router → 5 Ramas`
2. Configurar GPT Procesador con output `topico_identificado`
3. Hacer click derecho en cada conexión del Router
4. Seleccionar "Set up a filter"
5. En el selector de variables, buscar "GPT Procesador"
6. Seleccionar `topico_identificado`
7. Configurar operador "Equal to"
8. Ingresar valor: "COMPRA", "VENTA", etc.
9. Guardar y probar el flujo

---

## 📝 Notas Importantes

- Los nodos anteriores se calculan recursivamente siguiendo el grafo del flujo
- Solo se muestran nodos que realmente pueden alimentar datos al edge actual
- El sistema soporta múltiples niveles de profundidad (nodos anteriores de nodos anteriores)
- Las variables de nodos tienen formato: `{{node-id.property}}`
- El backend necesita actualización para evaluar estas condiciones correctamente

---

**Fecha de implementación:** 2026-01-25  
**Versión:** 1.0  
**Estado:** Frontend completado, Backend pendiente
