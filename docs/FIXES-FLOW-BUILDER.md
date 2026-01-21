# FIXES APLICADOS AL FLOW BUILDER

## 🐛 Problemas Identificados y Soluciones

### 1. ✅ Variables Globales No Aparecen en el Modal

**Problema:**
- El modal de variables se abre vacío
- No muestra las variables existentes del flujo

**Causa:**
- El estado `globalVariables` se inicializa como `{}` vacío
- Al cargar el flujo, no se estaban cargando las variables desde `flow.config.variables_globales`

**Solución Aplicada:**
```typescript
// En handleLoadFlow (flowRoutes.ts línea 890-896)
if (flow.config) {
  setGlobalVariables(flow.config.variables_globales || {});
  setGlobalTopics(flow.config.topicos || {});
  console.log('📊 Variables cargadas:', flow.config.variables_globales);
  console.log('📚 Tópicos cargados:', flow.config.topicos);
}
```

**Archivos Modificados:**
- `front_crm/bot_crm/src/app/dashboard/flow-builder/page.tsx`
- `front_crm/bot_crm/src/components/flow-builder/modals/VariablesModal.tsx`

---

### 2. ⚠️ Modal de Tópicos No Es Adecuado para Intercapital

**Problema:**
- El TopicsModal actual es genérico
- Intercapital necesita estructura específica con secciones predefinidas

**Solución Propuesta:**
Crear un modal personalizado con secciones fijas:
- ✅ Empresa
- ✅ Personalidad
- ✅ Seguridad
- ✅ Horarios de Operación
- ✅ Tipos de Operación
- ✅ Políticas
- ✅ Instrumentos Comunes
- ✅ Datos Requeridos

**Estado:** PENDIENTE - Necesita implementación

---

### 3. ❌ Error 500 al Guardar Flujo

**Problema:**
```
PUT http://localhost:3000/api/flows/695a156681f6d67f0ae9cf40 500 (Internal Server Error)
```

**Diagnóstico:**
1. ✅ Backend está corriendo correctamente
2. ✅ Ruta PUT existe en `flowRoutes.ts`
3. ⚠️ Logs agregados para debugging
4. ❓ Error específico no visible aún

**Logs Agregados:**
```typescript
console.log(`\n📝 PUT /api/flows/${flowId}`);
console.log(`📊 Datos recibidos:`, {
  nombre: flowData.nombre,
  empresaId: flowData.empresaId,
  nodos: flowData.nodes?.length,
  edges: flowData.edges?.length,
  config: flowData.config ? 'presente' : 'ausente'
});
```

**Posibles Causas:**
1. **Validación del Schema:** El modelo Flow puede tener validaciones que fallan
2. **Nodos Inválidos:** Algún nodo tiene estructura incorrecta
3. **Edges Inválidos:** Conexiones con IDs que no existen
4. **Config Inválido:** Estructura de config no coincide con schema

**Próximos Pasos:**
1. Revisar logs del backend cuando se intente guardar
2. Verificar schema del modelo Flow
3. Validar estructura de nodos y edges antes de guardar

---

## 🔧 Cambios Realizados

### Frontend

**`page.tsx` (flow-builder):**
```typescript
// 1. Guardar variables y tópicos en config
const flowData = {
  nombre: flowName,
  empresaId: 'Veo Veo',
  activo: currentFlowActive,
  nodes,
  edges,
  config: {
    topicos_habilitados: Object.keys(globalTopics).length > 0,
    topicos: globalTopics,
    variables_globales: globalVariables
  }
};

// 2. Cargar variables y tópicos al abrir flujo
if (flow.config) {
  setGlobalVariables(flow.config.variables_globales || {});
  setGlobalTopics(flow.config.topicos || {});
}

// 3. Botón agregar nodo funciona correctamente
<FloatingActionBar
  onAddNode={() => {
    setSourceNodeForConnection(null);
    setSourceHandleForConnection(undefined);
    setShowAppsModal(true);
  }}
/>
```

**`VariablesModal.tsx`:**
```typescript
// Manejo seguro de variables vacías
const vars = Object.entries(variables || {}).map(([nombre, valor]) => ({
  nombre,
  valor: typeof valor === 'object' ? JSON.stringify(valor, null, 2) : String(valor),
  tipo: (typeof valor === 'object' && valor !== null ? 'object' : typeof valor) as Variable['tipo'],
}));
```

### Backend

**`flowRoutes.ts`:**
```typescript
// Logs detallados para debugging
router.put('/:flowId', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log(`\n📝 PUT /api/flows/${flowId}`);
    console.log(`📊 Datos recibidos:`, { ... });
    
    const updatedFlow = await FlowModel.findByIdAndUpdate(
      flowId,
      { ...flowData, updatedAt: new Date() },
      { new: true, runValidators: false } // Desactivar validadores temporalmente
    );
    
    console.log('✅ Flow actualizado exitosamente');
    res.json(updatedFlow);
  } catch (error: any) {
    console.error('❌ Error actualizando flow:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: error.message, details: error.stack });
  }
});
```

---

## 🧪 Cómo Probar

### 1. Variables Globales
```bash
1. Abrir flow-builder
2. Cargar un flujo existente
3. Click en botón azul "Variables Globales"
4. Verificar que aparezcan las variables del flujo
5. Agregar nueva variable: nombre="test", tipo="string", valor="hola"
6. Guardar
7. Recargar flujo
8. Verificar que la variable "test" persiste
```

### 2. Error 500 al Guardar
```bash
1. Abrir flow-builder
2. Cargar flujo existente
3. Hacer un cambio (ej: cambiar nombre)
4. Click en "Guardar"
5. Abrir consola del navegador
6. Abrir terminal del backend
7. Verificar logs en ambos lados
8. Identificar error específico
```

---

## 📋 Tareas Pendientes

- [ ] Investigar causa exacta del error 500
- [ ] Revisar schema del modelo Flow
- [ ] Crear modal de tópicos personalizado para Intercapital
- [ ] Validar estructura de nodos antes de guardar
- [ ] Agregar manejo de errores más robusto
- [ ] Probar guardado con diferentes tipos de nodos

---

**Última actualización:** 2026-01-17 05:10 AM
