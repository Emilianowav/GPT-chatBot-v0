# Análisis Fullstack: Pendientes de Implementación y Mejoras

**Fecha de revisión:** 30 Nov 2025  
**Estado:** Revisión completa del proyecto

---

## Resumen Ejecutivo

Tras revisar el código del backend y frontend, se identifican las siguientes áreas:

| Área | Estado | Prioridad |
|------|--------|-----------|
| Repetición de workflows (`repetirWorkflow`) | ❌ No implementado | 🔴 Alta |
| TemplateEditor con loops `{{#items}}` | ⚠️ Parcial | 🟡 Media |
| Selector de variables en plantillas | ✅ Implementado | - |
| Workflows encadenados (`workflowsSiguientes`) | ✅ Implementado | - |
| Mapeo de parámetros (`mapeoParametros`) | ✅ Implementado | - |
| Validación de mapeos en frontend | ⚠️ Parcial | 🟡 Media |
| Manejo de estado `esperandoRepeticion` | ❌ No implementado | 🔴 Alta |

---

## 1. BACKEND: Pendientes de Implementación

### 1.1. ❌ `repetirWorkflow` - NO IMPLEMENTADO

**Archivo:** `backend/src/modules/integrations/types/api.types.ts`

La interfaz `IWorkflow` **NO tiene** la propiedad `repetirWorkflow`. Falta añadir:

```typescript
// En IWorkflow, después de workflowsSiguientes:
repetirWorkflow?: {
  habilitado: boolean;
  desdePaso: number;
  variablesALimpiar: string[];
  pregunta?: string;
  opcionRepetir?: string;
  opcionFinalizar?: string;
};
```

**Archivo:** `backend/src/modules/integrations/models/ApiConfiguration.ts`

Falta añadir el schema de Mongoose para `repetirWorkflow`.

**Archivo:** `backend/src/services/workflowConversationalHandler.ts`

Falta implementar:

1. Lógica para mostrar opciones de repetición al finalizar `consulta_filtrada`.
2. Nuevo estado `esperandoRepeticion` en el workflow.
3. Método `procesarDecisionRepeticion()` para manejar la respuesta del usuario.
4. Lógica para limpiar variables y retroceder al paso indicado.

### 1.2. ⚠️ Manejo de `workflowsSiguientes` incompleto

**Estado actual:** El backend muestra las opciones de workflows siguientes, pero **no procesa la selección del usuario**.

**Archivo:** `backend/src/services/workflowConversationalHandler.ts` (líneas 722-735)

```typescript
// Actualmente solo muestra las opciones:
workflow.workflowsSiguientes.workflows.forEach((wf, index) => {
  response += `${index + 1}: ${wf.opcion}\n`;
});
```

**Falta implementar:**
- Detectar cuando el usuario responde con un número después de ver las opciones.
- Iniciar el workflow seleccionado.
- Manejar el estado intermedio entre workflows.

### 1.3. ⚠️ Validación de `mapeoParametros`

El backend no valida que los parámetros mapeados existan en el endpoint. Esto puede causar errores silenciosos.

**Mejora sugerida:** Añadir validación en `procesarPasoEjecucion()` para advertir si un parámetro no existe en la definición del endpoint.

---

## 2. FRONTEND: Pendientes de Implementación

### 2.1. ❌ Sección `repetirWorkflow` en ModalWorkflow

**Archivo:** `front_crm/bot_crm/src/app/dashboard/integraciones/apis-configurables/[id]/ModalWorkflow.tsx`

**Estado actual:** No existe la sección para configurar `repetirWorkflow`.

**Implementar en Paso 4 (Mensajes):**

```tsx
{/* Después de Workflows Encadenados */}
<div className={styles.divider} style={{margin: '2rem 0 1.5rem'}}>
  <span>🔄 Repetición del Workflow (Opcional)</span>
</div>

<div className={styles.formGroup}>
  <label className={styles.checkboxLabel}>
    <input
      type="checkbox"
      checked={formData.repetirWorkflow?.habilitado || false}
      onChange={(e) => handleChange('repetirWorkflow', {
        ...formData.repetirWorkflow,
        habilitado: e.target.checked,
        desdePaso: formData.repetirWorkflow?.desdePaso || 1,
        variablesALimpiar: formData.repetirWorkflow?.variablesALimpiar || []
      })}
    />
    Permitir repetir el workflow desde un paso específico
  </label>
</div>

{formData.repetirWorkflow?.habilitado && (
  <>
    <div className={styles.formGroup}>
      <label>Repetir desde paso</label>
      <select
        value={formData.repetirWorkflow?.desdePaso || 1}
        onChange={(e) => handleChange('repetirWorkflow', {
          ...formData.repetirWorkflow,
          desdePaso: parseInt(e.target.value)
        })}
        className={styles.select}
      >
        {formData.steps.map((step, idx) => (
          <option key={idx} value={step.orden}>
            {step.orden} - {step.nombre || step.nombreVariable}
          </option>
        ))}
      </select>
    </div>

    <div className={styles.formGroup}>
      <label>Variables a limpiar</label>
      {/* Selector múltiple de variables */}
    </div>

    <div className={styles.formGroup}>
      <label>Pregunta de repetición</label>
      <input
        type="text"
        value={formData.repetirWorkflow?.pregunta || ''}
        onChange={(e) => handleChange('repetirWorkflow', {
          ...formData.repetirWorkflow,
          pregunta: e.target.value
        })}
        placeholder="¿Deseas buscar otro producto?"
        className={styles.input}
      />
    </div>

    <div className={styles.formRow}>
      <div className={styles.formGroup}>
        <label>Texto opción repetir</label>
        <input
          type="text"
          value={formData.repetirWorkflow?.opcionRepetir || ''}
          onChange={(e) => handleChange('repetirWorkflow', {
            ...formData.repetirWorkflow,
            opcionRepetir: e.target.value
          })}
          placeholder="Buscar otro producto"
          className={styles.input}
        />
      </div>
      <div className={styles.formGroup}>
        <label>Texto opción finalizar</label>
        <input
          type="text"
          value={formData.repetirWorkflow?.opcionFinalizar || ''}
          onChange={(e) => handleChange('repetirWorkflow', {
            ...formData.repetirWorkflow,
            opcionFinalizar: e.target.value
          })}
          placeholder="Terminar"
          className={styles.input}
        />
      </div>
    </div>
  </>
)}
```

### 2.2. ⚠️ TemplateBuilder: Falta soporte para loops

**Archivo:** `front_crm/bot_crm/src/app/dashboard/integraciones/apis-configurables/[id]/TemplateBuilder.tsx`

**Estado actual:** Solo inserta variables simples `{{variable}}`.

**Falta implementar:**
- Botón para insertar bloques `{{#items}}...{{/items}}`.
- Preview de campos disponibles dentro del loop (name, price, permalink, etc.).
- Ayuda contextual para sintaxis Mustache.

**Mejora sugerida:**

```tsx
// Añadir sección de bloques de iteración
<div className={styles.blocksSection}>
  <strong>🔁 Bloques de iteración:</strong>
  <button onClick={() => insertBlock('items')}>
    Insertar {{#items}}...{{/items}}
  </button>
</div>

// Función insertBlock
const insertBlock = (blockName: string) => {
  const blockTemplate = `{{#${blockName}}}
{{numero}}. *{{name}}*
   💰 Precio: ${{price}}
   🔗 {{permalink}}

{{/${blockName}}}`;
  // Insertar en posición del cursor
};
```

### 2.3. ⚠️ Validación de mapeoParametros

**Archivo:** `front_crm/bot_crm/src/app/dashboard/integraciones/apis-configurables/[id]/ParameterMapper.tsx`

**Estado actual:** Permite mapear cualquier parámetro sin validar si existe en el endpoint.

**Mejora sugerida:**
- Mostrar warning si el parámetro no está definido en `endpoint.parametros.query`.
- Sugerir parámetros conocidos del endpoint seleccionado.
- Validar que `search`, `category`, `location_id` estén mapeados para endpoints de productos.

### 2.4. ❌ Falta interfaz para `endpointsRelacionados`

**Estado actual:** El backend soporta `endpointsRelacionados` pero el frontend no tiene UI para configurarlo.

**Implementar:** Editor visual para definir endpoints relacionados con campos:
- Selector de endpoint.
- Origen de datos (variable/resultado).
- Campo de origen.
- Parámetro destino.
- Campos a extraer.
- Prefijo.

---

## 3. MODELO DE DATOS: Actualizaciones Necesarias

### 3.1. Tipos TypeScript (Backend)

**Archivo:** `backend/src/modules/integrations/types/api.types.ts`

```typescript
// Añadir después de línea 271 (después de workflowsSiguientes)
repetirWorkflow?: {
  habilitado: boolean;
  desdePaso: number;
  variablesALimpiar: string[];
  pregunta?: string;
  opcionRepetir?: string;
  opcionFinalizar?: string;
};
```

### 3.2. Schema Mongoose (Backend)

**Archivo:** `backend/src/modules/integrations/models/ApiConfiguration.ts`

Añadir al schema de Workflow:

```typescript
repetirWorkflow: {
  habilitado: { type: Boolean, default: false },
  desdePaso: { type: Number, default: 1 },
  variablesALimpiar: [{ type: String }],
  pregunta: { type: String },
  opcionRepetir: { type: String },
  opcionFinalizar: { type: String }
}
```

### 3.3. Tipos TypeScript (Frontend)

**Archivo:** `front_crm/bot_crm/src/app/dashboard/integraciones/apis-configurables/[id]/ModalWorkflow.tsx`

Actualizar interfaz `Workflow`:

```typescript
interface Workflow {
  // ... campos existentes ...
  repetirWorkflow?: {
    habilitado: boolean;
    desdePaso: number;
    variablesALimpiar: string[];
    pregunta?: string;
    opcionRepetir?: string;
    opcionFinalizar?: string;
  };
}
```

---

## 4. LÓGICA DE NEGOCIO: Implementaciones Pendientes

### 4.1. Estado de conversación para repetición

**Archivo:** `backend/src/services/workflowConversationManager.ts`

Añadir métodos:

```typescript
async marcarEsperandoRepeticion(contactoId: string): Promise<void>;
async estaEsperandoRepeticion(contactoId: string): Promise<boolean>;
async limpiarVariables(contactoId: string, variables: string[]): Promise<void>;
async irAPaso(contactoId: string, numeroPaso: number): Promise<void>;
```

### 4.2. Handler de repetición

**Archivo:** `backend/src/services/workflowConversationalHandler.ts`

Añadir método:

```typescript
private async procesarDecisionRepeticion(
  opcion: string,
  contactoId: string,
  workflow: IWorkflow,
  workflowState: any,
  apiConfig: any
): Promise<WorkflowResponse> {
  if (opcion === '1') {
    // Limpiar variables
    for (const variable of workflow.repetirWorkflow!.variablesALimpiar) {
      await workflowConversationManager.limpiarVariable(contactoId, variable);
    }
    // Ir al paso indicado
    await workflowConversationManager.irAPaso(contactoId, workflow.repetirWorkflow!.desdePaso);
    // Procesar ese paso
    const paso = workflow.steps.find(s => s.orden === workflow.repetirWorkflow!.desdePaso);
    return await this.procesarPaso(paso!, contactoId, workflow, workflowState, apiConfig);
  } else {
    // Finalizar
    await workflowConversationManager.finalizarWorkflow(contactoId);
    return {
      success: true,
      response: workflow.mensajeFinal || '¡Gracias por usar nuestro servicio!',
      completed: true
    };
  }
}
```

---

## 5. ORDEN DE IMPLEMENTACIÓN SUGERIDO

### Fase 1: Backend Core (Prioridad Alta)

1. ✏️ Actualizar tipos en `api.types.ts` con `repetirWorkflow`.
2. ✏️ Actualizar schema en `ApiConfiguration.ts`.
3. ✏️ Añadir métodos en `workflowConversationManager.ts`.
4. ✏️ Implementar lógica de repetición en `workflowConversationalHandler.ts`.
5. 🧪 Probar con workflow de iCenter.

### Fase 2: Frontend UI (Prioridad Alta)

1. ✏️ Actualizar tipos en `ModalWorkflow.tsx`.
2. ✏️ Añadir sección de repetición en paso 4 del wizard.
3. ✏️ Añadir selector de paso y variables a limpiar.
4. 🧪 Probar guardado y carga de configuración.

### Fase 3: Mejoras de UX (Prioridad Media)

1. ✏️ Mejorar `TemplateBuilder` con soporte para loops.
2. ✏️ Añadir validación de `mapeoParametros`.
3. ✏️ Añadir preview de respuesta en tiempo real.
4. ✏️ Implementar UI para `endpointsRelacionados`.

### Fase 4: Testing y Documentación (Prioridad Media)

1. 🧪 Tests unitarios para lógica de repetición.
2. 🧪 Tests E2E para flujo completo.
3. 📝 Actualizar documentación con ejemplos.

---

## 6. ARCHIVOS A MODIFICAR

| Archivo | Cambios |
|---------|---------|
| `backend/src/modules/integrations/types/api.types.ts` | Añadir `repetirWorkflow` a `IWorkflow` |
| `backend/src/modules/integrations/models/ApiConfiguration.ts` | Añadir schema para `repetirWorkflow` |
| `backend/src/services/workflowConversationManager.ts` | Añadir métodos de gestión de estado |
| `backend/src/services/workflowConversationalHandler.ts` | Implementar lógica de repetición |
| `front_crm/.../ModalWorkflow.tsx` | Añadir UI para `repetirWorkflow` |
| `front_crm/.../TemplateBuilder.tsx` | Añadir soporte para loops |
| `front_crm/.../ParameterMapper.tsx` | Añadir validaciones |

---

## 7. NOTAS ADICIONALES

### Lo que YA funciona bien:

- ✅ Workflows conversacionales básicos (recopilar → confirmación → consulta_filtrada).
- ✅ Mapeo de parámetros a variables.
- ✅ Filtro local por tokens en búsqueda.
- ✅ Motor de plantillas con Mustache.
- ✅ Workflows encadenados (mostrar opciones).
- ✅ TemplateBuilder con inserción de variables simples.
- ✅ Selector de endpoints y configuración de respuesta.

### Lo que necesita trabajo:

- ❌ Repetición de workflows desde paso específico.
- ❌ Procesamiento de selección en workflows encadenados.
- ⚠️ Validación de mapeos de parámetros.
- ⚠️ Soporte para loops en TemplateBuilder.
- ⚠️ UI para endpoints relacionados.
