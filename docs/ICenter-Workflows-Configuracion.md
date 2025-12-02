# Documentación de Flujos iCenter y Panel de Configuración

## 1. Introducción

Esta documentación describe en detalle cómo está modelada y configurada la integración con **iCenter** dentro del proyecto, incluyendo:

- La estructura de la **integración/API** (`ApiConfiguration`).
- La definición de **endpoints** (sucursales, productos, categorías).
- La estructura y comportamiento de los **workflows conversacionales** de búsqueda de productos.
- La lógica de **ejecución y filtrado** en el backend (`consulta_filtrada`).
- El diseño funcional del **panel de configuración frontend**, desde donde se debe poder configurar *todo* sin tocar el backend:
  - Integraciones y endpoints.
  - Workflows y pasos.
  - Mapeo de parámetros (`mapeoParametros`).
  - **TODOS los mensajes al usuario**, mediante plantillas con selectores de variables.

El objetivo es que cualquier cambio funcional o de copy en los flujos de iCenter se pueda hacer 100% desde el panel de administración (frontend), sin modificaciones manuales en MongoDB ni cambios de código en el backend.

---

## 2. Arquitectura General

### 2.1. Componentes principales

A nivel alto, el sistema se organiza en tres piezas:

- **Integraciones (APIs externas)**
  - Definidas por documentos `ApiConfiguration` en MongoDB.
  - Contienen base URL, autenticación, endpoints y workflows asociados.

- **Workflows conversacionales**
  - Secuencias de pasos (`steps`) que guían la conversación con el usuario.
  - Cada paso puede ser de tipo `recopilar`, `confirmacion`, `consulta_filtrada`, etc.
  - Los workflows viven dentro de `ApiConfiguration.workflows`.

- **Panel de configuración frontend**
  - Permite crear/editar integraciones, endpoints y workflows.
  - Todas las preguntas, mensajes de error y respuestas finales al usuario se definen como **plantillas configurables**.
  - Usa **selectores de variables** para insertar `{{variable}}` y evitar errores de tipeo.

---

## 3. Modelo de Datos Relevante

### 3.1. ApiConfiguration (visión conceptual)

A nivel conceptual, el documento de integración con iCenter contiene estos bloques:

- **Identidad y conexión**
  - `empresaId`
  - `nombre` (ej. "API iCenter")
  - `descripcion`
  - `tipo` ("rest")
  - `estado` (`activo` / `inactivo`)
  - `baseUrl` (ej. `https://icenter.ar/wp-json/wc-whatsapp/v1`)

- **Autenticación**
  - `autenticacion.tipo` (ej. `bearer`).
  - `autenticacion.configuracion.token`.
  - `autenticacion.configuracion.headerName` (ej. `Authorization`).

- **Endpoints** (`endpoints[]`)
  - Cada endpoint define:
    - `id` (UUID interno).
    - `nombre` ("Obtener Productos", "Obtener Sucursales", ...).
    - `metodo` (GET, POST, ...).
    - `path` (`/products`, `/locations`, `/categories`).
    - `parametros.path` / `parametros.query` / `parametros.headers`.

- **Integración con chatbot** (`chatbotIntegration`)
  - `habilitado`: boolean.
  - `chatbotId`.
  - `keywords[]`:
    - `palabra`: keyword que dispara llamada directa a un endpoint.
    - `endpointId`: endpoint a ejecutar.
    - `respuestaTemplate`: plantilla de respuesta al usuario.
  - `mensajeAyuda`: mensaje general de ayuda.

- **Workflows** (`workflows[]`)
  - Flujos conversacionales de varios pasos.
  - Cada workflow tiene:
    - `id`, `nombre`, `descripcion`, `activo`.
    - `trigger` (tipo + keywords + prioridad).
    - `mensajeInicial`, `mensajeFinal`, `mensajeAbandonar`.
    - `respuestaTemplate`: plantilla final para la respuesta del workflow.
    - `workflowsSiguientes`: encadenamiento a otros workflows.
    - `steps[]`: pasos que componen el flujo.

### 3.2. Endpoints clave para iCenter

Los endpoints relevantes para el flujo de búsqueda de productos son:

- **Obtener Sucursales**
  - `metodo`: GET
  - `path`: `/locations`
  - `parametros.query`: ninguno

- **Obtener Categorías**
  - `metodo`: GET
  - `path`: `/categories`
  - `parametros.query`: ninguno

- **Obtener Productos**
  - `metodo`: GET
  - `path`: `/products`
  - `parametros.query` principales:
    - `search` (string): término de búsqueda normalizado.
    - `category` (number): ID de categoría.
    - `include_stock` (boolean, default `true`).
    - `per_page` (number, default `10`).
    - `page` (number, default `1`).

  > Nota: aunque en el modelo actual no se declara `location_id` en `parametros.query`, el flujo lo utiliza como parámetro de filtro de sucursal.

---

## 4. Workflows de iCenter

Actualmente se manejan dos workflows principales para iCenter:

1. **iCenter - Búsqueda de Productos** (trigger por primer mensaje).
2. **iCenter - Búsqueda de Productos (Palabras Clave)** (trigger por keyword).

Ambos comparten la misma lógica conceptual: recopilar sucursal, categoría y nombre de producto, confirmar datos y luego ejecutar una búsqueda filtrada de productos.

### 4.1. Variables de estado del flujo

Las variables más importantes que se generan/usan en estos workflows son:

- `sucursal_id`: ID de sucursal seleccionada.
- `sucursal_id_nombre`: nombre legible de la sucursal (derivado para plantillas).
- `categoria_id`: ID de categoría seleccionada.
- `categoria_id_nombre`: nombre legible de la categoría.
- `nombre_producto`: texto ingresado por el usuario como término de búsqueda.
- `confirmacion`: opción elegida en el paso de confirmación.
- `resultados`: colección de productos devueltos por la API (ya filtrados y normalizados).

Adicionalmente, en las plantillas de respuesta se exponen campos derivados:

- `count`: cantidad de productos.
- `items[]`: array de productos con índices y campos listos para mostrar (por ejemplo: `numero`, `name`, `price`, `permalink`).

### 4.2. Workflow: iCenter - Búsqueda de Productos (Palabras Clave)

Este es el workflow de referencia que ya está funcionando correctamente.

#### 4.2.1. Trigger

- `trigger.tipo`: `keyword`.
- `trigger.keywords`: ["busco", "buscando", "tienen"].
- Al detectar una de estas palabras, el router universal inicia este workflow.

#### 4.2.2. Pasos

1. **Paso 1 – Seleccionar Sucursal (tipo: `recopilar`)**
   - `nombreVariable`: `sucursal_id`.
   - `pregunta`: pregunta configurada al usuario.
   - `endpointId`: `Obtener Sucursales`.
   - `endpointResponseConfig`:
     - `arrayPath`: `data`.
     - `idField`: `id`.
     - `displayField`: `name`.
   - A partir de este paso se derivan:
     - `sucursal_id` (ID elegido).
     - `sucursal_id_nombre` (texto legible para plantillas).

2. **Paso 2 – Seleccionar Categoría (tipo: `recopilar`)**
   - `nombreVariable`: `categoria_id`.
   - `endpointId`: `Obtener Categorias`.
   - `endpointResponseConfig`:
     - `arrayPath`: `data`.
     - `idField`: `id`.
     - `displayField`: `name`.
   - Variables derivadas:
     - `categoria_id` y `categoria_id_nombre`.

3. **Paso 3 – Nombre del Producto (tipo: `recopilar`)**
   - `nombreVariable`: `nombre_producto`.
   - `pregunta`: texto libre, con validación mínima de longitud.

4. **Paso 4 – Confirmar Datos (tipo: `confirmacion`)**
   - `nombreVariable`: `confirmacion`.
   - `pregunta`: una plantilla que muestra:
     - `{{sucursal_id_nombre}}`, `{{categoria_id_nombre}}`, `{{nombre_producto}}`.
   - Opciones típicas:
     - `1`: Confirmar y buscar.
     - `2`: Cambiar sucursal.
     - `3`: Cambiar categoría.
     - `4`: Cambiar producto.
     - `5`: Cancelar búsqueda.

5. **Paso 5 – Buscar Productos (tipo: `consulta_filtrada`)**
   - `nombreVariable`: `resultados`.
   - `endpointId`: `Obtener Productos`.
   - `mapeoParametros` (correcto):

     ```json
     {
       "location_id": "sucursal_id",
       "category": "categoria_id",
       "search": "nombre_producto"
     }
     ```

   - Esto garantiza:
     - Se filtra por sucursal (`location_id`).
     - Se filtra por categoría (`category`).
     - `search` se normaliza en backend y además se usa para filtro local por tokens en el nombre.

   - `endpointsRelacionados` (opcional/avanzado): permiten hacer llamadas adicionales para, por ejemplo, recuperar `permalink` u otros campos.

#### 4.2.3. Plantilla de respuesta del workflow

Ejemplo de `respuestaTemplate` para este workflow:

```mustache
🎧 *Productos encontrados* ({{count}})

{{#items}}
{{numero}}. *{{name}}*
   💰 Precio: ${{price}}
   🔗 Link de compra: {{permalink}}

{{/items}}
```

Variables disponibles aquí:

- `count`: cantidad total de productos.
- Dentro de `{{#items}} ... {{/items}}`:
  - `numero`: índice 1..N.
  - `name`, `price`, `permalink`: campos del producto.

### 4.3. Workflow: iCenter - Búsqueda de Productos (primer mensaje)

Este workflow tiene estructura similar, pero el trigger es de tipo `primer_mensaje`. A nivel de pasos, la lógica es la misma: sucursal → categoría → nombre de producto → confirmación → búsqueda final.

Para mantener consistencia y correcto funcionamiento del filtro, el `mapeoParametros` de su paso final de `consulta_filtrada` debe ser equivalente al workflow de palabras clave:

```json
{
  "location_id": "sucursal_id",
  "category": "categoria_id",
  "search": "nombre_producto"
}
```

---

## 5. Repetición de Workflows (Nueva Funcionalidad)

### 5.1. Problema a resolver

Actualmente, cuando un workflow termina (por ejemplo, después de mostrar los productos encontrados), el usuario tiene dos opciones:

1. **Encadenar a otro workflow** (`workflowsSiguientes`): inicia un workflow diferente desde cero.
2. **Terminar**: el workflow se cierra y el usuario debe volver a dispararlo con un keyword.

Sin embargo, hay casos donde el usuario quiere **repetir el mismo workflow pero desde un paso intermedio**, conservando datos ya recopilados. Por ejemplo:

- En el flujo de búsqueda de productos de iCenter, después de ver los resultados, el usuario quiere **buscar otro producto** pero **manteniendo la misma sucursal y categoría**.
- Solo debería volver al paso 3 ("Escribe el nombre del producto"), no al paso 1.

### 5.2. Solución: `repetirWorkflow`

Se propone añadir una nueva propiedad configurable a nivel de workflow:

```typescript
interface IWorkflow {
  // ... propiedades existentes ...

  // NUEVA: Configuración de repetición
  repetirWorkflow?: {
    habilitado: boolean;              // Si se permite repetir el workflow al finalizar
    desdePaso: number;                // Orden del paso desde el cual repetir (ej: 3)
    variablesALimpiar: string[];      // Variables a limpiar antes de repetir
    pregunta?: string;                // Pregunta para ofrecer repetición (plantilla)
    opcionRepetir?: string;           // Texto de la opción de repetir
    opcionFinalizar?: string;         // Texto de la opción de finalizar
  };
}
```

### 5.3. Ejemplo para iCenter

Para el workflow de búsqueda de productos, la configuración sería:

```json
{
  "repetirWorkflow": {
    "habilitado": true,
    "desdePaso": 3,
    "variablesALimpiar": ["nombre_producto", "confirmacion", "resultados"],
    "pregunta": "¿Deseas buscar otro producto en la misma sucursal y categoría?",
    "opcionRepetir": "Buscar otro producto",
    "opcionFinalizar": "Terminar"
  }
}
```

Con esta configuración:

1. Al terminar el paso `consulta_filtrada`, el backend muestra los resultados + la pregunta de repetición.
2. Si el usuario elige "Buscar otro producto":
   - Se limpian las variables `nombre_producto`, `confirmacion`, `resultados`.
   - Se conservan `sucursal_id`, `sucursal_id_nombre`, `categoria_id`, `categoria_id_nombre`.
   - El workflow vuelve al paso 3 ("Escribe el nombre del producto").
3. Si el usuario elige "Terminar":
   - Se muestra `mensajeFinal` y se cierra el workflow.

### 5.4. Flujo visual con repetición

```
┌─────────────────────────────────────────────────────────────────┐
│  WORKFLOW: Búsqueda de Productos iCenter                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Paso 1: Seleccionar Sucursal ──────────────────────────────┐   │
│       ↓                                                     │   │
│  Paso 2: Seleccionar Categoría ─────────────────────────────┤   │
│       ↓                                                     │   │
│  ┌─────────────────────────────────────────────────────┐    │   │
│  │ Paso 3: Nombre del Producto  ◄───────────────────┐  │    │   │
│  │      ↓                                           │  │    │   │
│  │ Paso 4: Confirmación                             │  │    │   │
│  │      ↓                                           │  │    │   │
│  │ Paso 5: Buscar Productos                         │  │    │   │
│  │      ↓                                           │  │    │   │
│  │ ¿Buscar otro producto?                           │  │    │   │
│  │   [1] Sí ────────────────────────────────────────┘  │    │   │
│  │   [2] No ───────────────────────────────────────────┼────┘   │
│  └─────────────────────────────────────────────────────┘        │
│                                                                 │
│  FIN (mensajeFinal)                                             │
└─────────────────────────────────────────────────────────────────┘
```

### 5.5. Comparación: `repetirWorkflow` vs `workflowsSiguientes`

| Característica | `workflowsSiguientes` | `repetirWorkflow` |
|----------------|----------------------|-------------------|
| **Propósito** | Encadenar a otro workflow diferente | Repetir el mismo workflow desde un paso |
| **Variables** | Se pierden todas (nuevo workflow) | Se conservan las que no están en `variablesALimpiar` |
| **Paso inicial** | Siempre paso 1 del nuevo workflow | Configurable con `desdePaso` |
| **Ejemplo** | "Consultar stock" → "Ver promociones" | "Buscar producto" → "Buscar otro producto" |

Ambas opciones pueden coexistir. El orden de presentación al usuario sería:

1. Primero la opción de repetir (si `repetirWorkflow.habilitado`).
2. Luego las opciones de `workflowsSiguientes`.
3. Finalmente la opción de terminar.

### 5.6. Configuración desde el Frontend

En el `WorkflowForm`, se debe añadir una sección **"Repetición del Workflow"**:

- **Habilitar repetición** (switch): `repetirWorkflow.habilitado`.
- **Repetir desde paso** (selector de pasos del workflow): `repetirWorkflow.desdePaso`.
- **Variables a limpiar** (selector múltiple de variables): `repetirWorkflow.variablesALimpiar`.
- **Pregunta de repetición** (TemplateEditor): `repetirWorkflow.pregunta`.
- **Texto opción repetir** (input): `repetirWorkflow.opcionRepetir`.
- **Texto opción finalizar** (input): `repetirWorkflow.opcionFinalizar`.

El selector de "Repetir desde paso" debe mostrar los pasos del workflow con su `orden` y `nombre`, por ejemplo:

- `1 - Seleccionar Sucursal`
- `2 - Seleccionar Categoría`
- `3 - Nombre del Producto` ← seleccionado
- `4 - Confirmar Datos`

El selector de "Variables a limpiar" debe mostrar todas las variables definidas en pasos con `orden >= desdePaso`, preseleccionando automáticamente las que corresponden a esos pasos.

---

## 6. Lógica de Ejecución y Filtrado en Backend

La lógica principal vive en `workflowConversationalHandler.ts`. Conceptualmente:

1. **Pasos `recopilar`**
   - Muestran la `pregunta` al usuario.
   - Validan el input según `validacion.tipo` y `validacion.opciones`.
   - Si el paso usa un `endpointId`, se llama al endpoint, se procesa la respuesta según `endpointResponseConfig`, y se generan opciones numeradas para el usuario.
   - La selección se convierte en una variable de estado (`nombreVariable`).

2. **Paso `confirmacion`**
   - Usa una plantilla de `pregunta` que ya tiene acceso a variables como `sucursal_id_nombre`, `categoria_id_nombre`, `nombre_producto`.
   - Según la opción elegida (1-5), el backend:
     - Avanza al paso de ejecución (`consulta_filtrada`).
     - O retrocede a un paso anterior, limpiando variables correspondientes.
     - O cancela el workflow.

3. **Paso `consulta_filtrada`**
   - Construye `params.query` a partir de `mapeoParametros`:
     - Por cada entrada `parametroAPI: nombreVariable`, toma el valor de `datosRecopilados[nombreVariable]`.
     - Normaliza `search` (lowercase, trim) y lo guarda como `searchQuery`.
   - Llama al endpoint configurado (`Obtener Productos`).
   - Aplica **filtro local por tokens** si `searchQuery` está presente:
     - Divide el término de búsqueda en tokens.
     - Filtra productos por coincidencias parciales de esos tokens en el nombre.
     - Sobrescribe siempre los datos con el resultado filtrado (aunque haya 0 coincidencias).
   - Pasa los datos filtrados a la capa de **formateo de plantillas**.

4. **Plantillas de respuesta**
   - Se unificó el motor de plantillas para:
     - `respuestaTemplate` de workflows.
     - `plantillaRespuesta` de pasos.
   - Se soportan estructuras como:
     - `{{variable}}` simple.
     - `{{#items}} ... {{/items}}` para iterar.
   - El objetivo es que cualquier mensaje visible al usuario sea configurable, usando estos placeholders.

### 6.5. Implementación en Backend para `repetirWorkflow`

El handler `workflowConversationalHandler.ts` debe modificarse para soportar la repetición. Los cambios necesarios son:

1. **Al finalizar `consulta_filtrada`**, verificar si `workflow.repetirWorkflow?.habilitado`:
   - Si está habilitado, añadir las opciones de repetición al mensaje de respuesta.
   - Marcar el workflow como "esperando decisión de repetición" en el estado.

2. **Nuevo estado intermedio**: `esperandoRepeticion`:
   - Si el usuario responde con la opción de repetir:
     - Limpiar las variables en `variablesALimpiar`.
     - Retroceder el `pasoActual` a `desdePaso`.
     - Mostrar la pregunta del paso `desdePaso`.
   - Si el usuario responde con la opción de finalizar:
     - Mostrar `mensajeFinal` y cerrar el workflow.

3. **Pseudocódigo**:

```typescript
// En procesarPasoEjecucion, después de formatear la respuesta:
if (workflow.repetirWorkflow?.habilitado) {
  // Añadir opciones de repetición
  response += '\n\n';
  response += workflow.repetirWorkflow.pregunta || '¿Deseas repetir la búsqueda?';
  response += '\n\n';
  response += `1: ${workflow.repetirWorkflow.opcionRepetir || 'Repetir'}\n`;
  response += `2: ${workflow.repetirWorkflow.opcionFinalizar || 'Terminar'}\n`;
  
  // Marcar estado como esperando decisión
  await workflowConversationManager.marcarEsperandoRepeticion(contactoId);
  
  return {
    success: true,
    response,
    completed: false,  // NO completar aún
    metadata: { esperandoRepeticion: true }
  };
}

// Nuevo método para manejar la decisión de repetición:
async procesarDecisionRepeticion(opcion: string, contactoId: string, workflow: IWorkflow) {
  if (opcion === '1') {
    // Limpiar variables
    for (const variable of workflow.repetirWorkflow.variablesALimpiar) {
      await workflowConversationManager.limpiarVariable(contactoId, variable);
    }
    // Retroceder al paso indicado
    await workflowConversationManager.irAPaso(contactoId, workflow.repetirWorkflow.desdePaso);
    // Procesar el paso como si fuera nuevo
    const paso = workflow.steps.find(s => s.orden === workflow.repetirWorkflow.desdePaso);
    return await this.procesarPaso(paso, contactoId, workflow, ...);
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

## 7. Panel de Configuración Frontend

El frontend es responsable de toda la configuración. El usuario no debe editar documentos en la base de datos ni tocar código backend.

### 7.1. Pantalla de Integraciones

**Componentes sugeridos:**

- `IntegrationsList`
  - Lista de integraciones: nombre, tipo, estado, empresa.
  - Acción "Editar".

- `IntegrationForm`
  - **Datos básicos**
    - `nombre`, `descripcion`, `tipo` (solo lectura), `estado` (switch).
  - **Conexión**
    - `baseUrl` (input).
  - **Autenticación**
    - Selector de `tipo` (`none`, `bearer`, `basic`, etc.).
    - Para tipo `bearer`:
      - `token` (input tipo password).
      - `headerName`.
  - **Chatbot Integration**
    - `habilitado` (checkbox/switch).
    - `chatbotId`.
    - `mensajeAyuda` (usa `TemplateEditor`).
    - Lista de `keywords`:
      - `palabra` (input).
      - `endpointId` (selector de endpoint).
      - `descripcion`.
      - `respuestaTemplate` (TemplateEditor) con variables específicas (por ejemplo `sucursales[]`).

### 7.2. Pantalla de Endpoints

**Componentes sugeridos:**

- `EndpointsList`
  - Muestra: `nombre`, `metodo`, `path`, `activo`.
  - Permite crear/editar/eliminar endpoints.

- `EndpointForm`
  - Datos básicos: `nombre`, `metodo`, `path`, `activo`.
  - **Parámetros**
    - Editor de `parametros.query` como tabla:
      - `nombre` (input texto).
      - `tipo` (selector: `string`, `number`, `boolean`).
      - `requerido` (checkbox).
      - `valorPorDefecto` (input).
      - `descripcion` (input texto).
    - Estos parámetros se usarán en el editor de mapeo de `consulta_filtrada` como opciones de selección.

### 7.3. Pantalla de Workflows

**Componentes sugeridos:**

- `WorkflowsList`
  - Lista de `workflows` de una integración:
    - `nombre`, `tipoTrigger`, `prioridad`, `activo`.
  - Acciones: crear, editar, duplicar, desactivar.

- `WorkflowForm`
  - **Metadatos**
    - `nombre`, `descripcion`, `activo`, `prioridad`.
  - **Trigger**
    - Selector `trigger.tipo`: `primer_mensaje` o `keyword`.
    - Lista `trigger.keywords` (chips con autocompletado).
    - `primeraRespuesta` (boolean, si aplica).
  - **Mensajes globales (todas plantillas)**
    - `mensajeInicial` → TemplateEditor.
    - `mensajeFinal` → TemplateEditor.
    - `mensajeAbandonar` → TemplateEditor.
    - `respuestaTemplate` → TemplateEditor.
    - Editor de `workflowsSiguientes`:
      - `pregunta` → TemplateEditor.
      - `workflows[]` con campos:
        - `workflowId` (selector de workflow existente).
        - `opcion` (texto mostrado al usuario).
  - **Pasos**
    - `StepsList`: listar todos los pasos con `orden`, `tipo`, `nombre`.
    - Permitir reordenar (drag & drop) y editar cada paso.
  - **Repetición del Workflow** (nueva sección)
    - `habilitado` (switch): activa/desactiva la repetición.
    - `desdePaso` (selector de pasos): muestra lista de pasos del workflow con formato `orden - nombre`.
    - `variablesALimpiar` (selector múltiple): lista de variables definidas en pasos con `orden >= desdePaso`.
    - `pregunta` → TemplateEditor (pregunta de repetición).
    - `opcionRepetir` (input): texto del botón de repetir.
    - `opcionFinalizar` (input): texto del botón de finalizar.

### 7.4. Editor de Pasos (`StepForm`)

Campos comunes para todos los tipos de paso:

- `orden` (number).
- `tipo` (selector: `recopilar`, `confirmacion`, `consulta_filtrada`, ...).
- `nombre`.
- `descripcion`.
- **Variable asociada** (`nombreVariable`):
  - Selector de variable existente (para evitar duplicados o typos).
  - Opción de "Crear nueva variable" con validación del nombre (snake_case).
- **Validación**
  - `validacion.tipo` (selector: `opcion`, `texto`, etc.).
  - `validacion.opciones` (lista editable, si aplica).
  - `validacion.mensajeError` (TemplateEditor simple o texto plano).

#### 7.4.1. Paso `recopilar`

Campos adicionales:

- `pregunta` → TemplateEditor.
  - Variables disponibles: cualquier variable definida en pasos anteriores.
- `endpointId` (opcional) → selector de endpoints.
- `endpointResponseConfig`:
  - `arrayPath` (input, ej. `data`).
  - `idField` (selector de campos, basado en sample de respuesta).
  - `displayField` (selector de campos, idem).

#### 7.4.2. Paso `confirmacion`

Campos específicos:

- `pregunta` → TemplateEditor.
  - Debe poder insertar fácilmente variables como `sucursal_id_nombre`, `categoria_id_nombre`, `nombre_producto`.
- `validacion.opciones` → lista de strings (ej. `"1: Confirmar y buscar"`, ...).

#### 7.4.3. Paso `consulta_filtrada`

Este es el paso crítico para llamadas a `/products` y filtros.

Campos clave:

1. **Endpoint**
   - `endpointId` → selector (ej. "Obtener Productos").

2. **Mapeo de parámetros (`mapeoParametros`)**
   - Componente: `QueryParamMappingEditor`.
   - Por cada fila:
     - **Parámetro API** (selector):
       - Poblado desde `endpoint.parametros.query[].nombre`.
       - Ejemplos: `search`, `category`, `include_stock`, `per_page`, `page`, `location_id`.
     - **Variable de workflow** (selector):
       - Poblado desde la lista de variables definidas (`sucursal_id`, `categoria_id`, `nombre_producto`, ...).
   - Validaciones:
     - Advertir si se usan parámetros no definidos en el endpoint.
     - Recomendar que `search` esté mapeado si el endpoint lo soporta.
   - Para iCenter, mapeo recomendado:

     ```json
     {
       "location_id": "sucursal_id",
       "category": "categoria_id",
       "search": "nombre_producto"
     }
     ```

3. **Endpoints relacionados (`endpointsRelacionados`)**
   - Lista editable con campos:
     - `endpointId` (selector).
     - `origenDatos` (selector: `"variable"`, etc.).
     - `variableOrigen` (selector de variable).
     - `parametroDestino` (selector de parámetros del endpoint).
     - `campos` (lista de paths de respuesta, ej. `data.data[0].permalink`).
     - `prefijo` (string).

4. **Plantilla de respuesta al nivel de paso (opcional)**
   - Campo `plantillaRespuesta` → TemplateEditor.
   - Variables disponibles:
     - `{{resultados}}` / `{{resultado}}`.
     - `{{count}}`.
     - `{{#items}}` con `{{numero}}`, `{{name}}`, `{{price}}`, `{{permalink}}`, etc.

---

## 8. Componente TemplateEditor y Selectores de Variables

El `TemplateEditor` es el corazón de la configuración de mensajes porque garantiza que:

- Todos los textos visibles al usuario final se puedan modificar.
- Las variables se inserten **por selección**, no escribiendo a mano `{{variable}}`.

### 8.1. Características

- Editor de texto (textarea o rich text plano orientado a plantillas).
- Panel lateral o barra superior con:
  - **Listado de variables disponibles** en el contexto actual.
  - Botones para insertar bloques de control (`{{#items}} ... {{/items}}`).

Al hacer clic en una variable, el editor inserta el snippet correcto, por ejemplo:

- Clic en `sucursal_id_nombre` → inserta `{{sucursal_id_nombre}}`.
- Clic en bloque `items` → inserta:

  ```mustache
  {{#items}}
  {{numero}}. *{{name}}*
  {{/items}}
  ```

### 8.2. Contextos de variables

El conjunto de variables disponibles depende de dónde se use la plantilla:

- **Workflow (respuesta final):**
  - Variables globales: `sucursal_id`, `sucursal_id_nombre`, `categoria_id`, `categoria_id_nombre`, `nombre_producto`, `confirmacion`.
  - Resultado de consulta: `count`, `items[]` con `numero`, `name`, `price`, `permalink`, etc.

- **Paso `confirmacion`:**
  - `sucursal_id_nombre`, `categoria_id_nombre`, `nombre_producto`.

- **Keyword `sucursal` en chatbotIntegration:**
  - `sucursales[]` con `name`, `adress`, `phone`, `horario`, etc.

- **Otros pasos `recopilar`:**
  - Variables definidas en pasos anteriores del mismo workflow.

---

## 9. Listado de Mensajes 100% Configurables

Para garantizar que todo lo que ve el usuario es editable desde el front, se deben exponer como plantillas los siguientes campos:

- En `chatbotIntegration`:
  - `mensajeAyuda`.
  - `keywords[].respuestaTemplate`.

- En cada `workflow`:
  - `mensajeInicial`.
  - `mensajeFinal`.
  - `mensajeAbandonar`.
  - `respuestaTemplate` (respuesta final de la búsqueda).
  - `workflowsSiguientes.pregunta`.
  - **`repetirWorkflow.pregunta`** (pregunta de repetición).
  - **`repetirWorkflow.opcionRepetir`** (texto de opción repetir).
  - **`repetirWorkflow.opcionFinalizar`** (texto de opción finalizar).

- En cada `step`:
  - `pregunta` (para pasos `recopilar` y `confirmacion`).
  - `validacion.mensajeError`.
  - `plantillaRespuesta` (si existe, sobre todo en pasos de ejecución/consulta).

Con esto, ningún texto visible al usuario final queda fijo en código.

---

## 10. Buenas Prácticas de Configuración

- **Usar siempre selectores para nombres de variables**
  - Evitar escribir `sucursal_id` o `categoria_id` a mano.
  - El frontend debe ofrecer un selector de variables existentes al configurar `nombreVariable` y `mapeoParametros`.

- **Validar coherencia de mapeos**
  - El panel debe ayudar a detectar:
    - Parámetros de API que no tienen variable asignada.
    - Variables que nunca se usan.
    - Campos de filtro críticos (`search`, `category`, `location_id`) que estén correctamente mapeados.

- **Probar los endpoints desde el panel**
  - Botón de "Probar endpoint" en `EndpointForm` para traer una muestra de respuesta.
  - Usar esa respuesta para sugerir `arrayPath`, `idField`, `displayField` y para prellenar la lista de campos disponibles en plantillas.

- **Separar flujos por intención**
  - Workflow de primer mensaje para casos genéricos.
  - Workflow de palabras clave para usuarios que ya escriben "busco", "tienen", etc.

- **Mantener consistencia de plantillas**
  - Reutilizar estructuras como `{{#items}}` en las respuestas de búsqueda.
  - Mantener el tono y formato (emojis, negritas) homogéneas en todos los mensajes.

---

## 11. Resumen

### 11.1. Capacidades del Backend

El backend de iCenter está preparado para:

- Ejecutar workflows de varios pasos.
- Llamar endpoints de forma parametrizable.
- Aplicar filtros locales por término de búsqueda.
- Renderizar respuestas usando un motor de plantillas unificado.
- **(NUEVO)** Soportar repetición de workflows desde un paso específico, conservando variables previas.

### 11.2. Requisitos del Frontend

El frontend debe proveer un panel donde:

- Se gestionen integraciones, endpoints y workflows sin tocar código.
- **Todas las preguntas y respuestas al usuario sean plantillas configurables**, con variables insertadas mediante **selectores**, no texto libre.
- Se puedan definir y validar correctamente los `mapeoParametros` para pasos de `consulta_filtrada`.
- **(NUEVO)** Se configure la repetición de workflows: paso de reinicio, variables a limpiar, y mensajes de repetición.

### 11.3. Funcionalidades Clave Documentadas

| Funcionalidad | Sección | Estado |
|---------------|---------|--------|
| Integraciones y endpoints | 3, 7.1, 7.2 | Existente |
| Workflows y pasos | 4, 7.3, 7.4 | Existente |
| Mapeo de parámetros | 7.4.3 | Existente |
| Plantillas y TemplateEditor | 8 | Existente |
| **Repetición de workflows** | **5** | **NUEVO** |
| Mensajes configurables | 9 | Actualizado |

Con esta documentación, cualquier desarrollador o configurador de negocio puede entender cómo se relacionan la API de iCenter, los workflows del chatbot y el panel de administración, y cómo extender o modificar los flujos sin riesgo de romper la lógica central del sistema.
