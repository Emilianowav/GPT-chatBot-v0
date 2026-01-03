# 🧩 Arquitectura de Nodos Configurables

## 🎯 Problema Resuelto

### ❌ Antes: Flujos Hardcodeados
```typescript
// Código no editable, cambios requieren deploy
if (paso === 1) {
  enviarMensaje("Hola, bienvenido a Veo Veo");
} else if (paso === 2) {
  enviarMensaje("¿Qué libro buscas?");
}
```

**Problemas:**
- ❌ Cambiar un texto requiere tocar código
- ❌ Agregar un paso rompe la numeración
- ❌ No reutilizable entre empresas
- ❌ Imposible de editar por no-técnicos

### ✅ Después: Nodos Configurables
```json
{
  "id": "bienvenida",
  "type": "message",
  "message": "Hola, bienvenido a Veo Veo",
  "next": "buscar_libro"
}
```

**Beneficios:**
- ✅ Editable desde un formulario web
- ✅ Sin deploys para cambios de contenido
- ✅ Reutilizable y versionable
- ✅ Configurable por admins de empresa

---

## 📦 Modelos de Datos

### 1. Flow (Contenedor)
```typescript
{
  empresaId: "Veo Veo",
  id: "consultar_libros",
  nombre: "Consulta de Libros",
  categoria: "ventas",
  startNode: "main_menu",
  variables: {
    ATENCION_WA: "https://wa.me/549379...",
    HORARIO: "Lun-Vie 9-18hs"
  },
  triggers: {
    keywords: ["libro", "comprar", "catálogo"],
    priority: 10
  },
  settings: {
    timeout: 300,
    enableGPT: true
  }
}
```

### 2. FlowNode (Nodo Individual)
```typescript
{
  empresaId: "Veo Veo",
  flowId: "consultar_libros",
  id: "main_menu",
  type: "menu",
  name: "Menú Principal",
  message: "Hola 👋 ¿Qué necesitas?",
  options: [
    { text: "Libros escolares", next: "buscar_libro" },
    { text: "Libros de inglés", next: "ingles_info" },
    { text: "Hablar con asesor", url: "{{ATENCION_WA}}" }
  ]
}
```

---

## 🧩 Tipos de Nodos

### 1. MENU - Opciones múltiples
```json
{
  "id": "main_menu",
  "type": "menu",
  "message": "¿Qué necesitas?",
  "options": [
    { "text": "Opción 1", "value": "opt1", "next": "nodo_1" },
    { "text": "Opción 2", "value": "opt2", "next": "nodo_2" }
  ]
}
```

**Uso:** Menús, categorías, selección de productos

---

### 2. INPUT - Captura de datos
```json
{
  "id": "buscar_libro",
  "type": "input",
  "message": "Ingresá: Título - Editorial - Edición",
  "validation": {
    "type": "text",
    "min": 3,
    "max": 200,
    "errorMessage": "Por favor ingresá al menos 3 caracteres"
  },
  "next": "procesar_busqueda"
}
```

**Validaciones disponibles:**
- `text` - Texto libre
- `number` - Solo números
- `email` - Email válido
- `phone` - Teléfono
- `regex` - Patrón personalizado

---

### 3. MESSAGE - Mensaje simple
```json
{
  "id": "sin_stock",
  "type": "message",
  "message": "No tenemos stock de {{producto}} 😕\n\nHorario: {{HORARIO}}",
  "next": "main_menu"
}
```

**Uso:** Confirmaciones, avisos, información

---

### 4. CONDITION - Lógica condicional
```json
{
  "id": "verificar_stock",
  "type": "condition",
  "conditions": [
    { 
      "if": "stock", 
      "operator": "gt", 
      "value": 0, 
      "next": "mostrar_precio" 
    },
    { 
      "else": "sin_stock" 
    }
  ]
}
```

**Operadores:**
- `eq` - Igual
- `neq` - Diferente
- `gt` / `lt` - Mayor/Menor
- `gte` / `lte` - Mayor o igual / Menor o igual
- `contains` - Contiene
- `exists` - Existe

---

### 5. ACTION - Ejecutar acción
```json
{
  "id": "generar_pago",
  "type": "action",
  "action": {
    "type": "create_payment_link",
    "config": {
      "title": "{{producto}}",
      "amount": "{{precio}}",
      "description": "Compra de {{producto}}"
    },
    "onSuccess": "pago_generado",
    "onError": "error_pago"
  }
}
```

**Acciones disponibles:**
- `create_payment_link` - Mercado Pago
- `api_call` - Llamar API externa
- `save_data` - Guardar en BD
- `send_email` - Enviar email
- `webhook` - Llamar webhook
- `assign_agent` - Derivar a agente

---

### 6. API_CALL - Llamar API externa
```json
{
  "id": "buscar_producto",
  "type": "api_call",
  "action": {
    "type": "api_call",
    "config": {
      "endpoint": "buscar-productos",
      "params": {
        "query": "{{buscar_libro}}"
      }
    },
    "onSuccess": "mostrar_resultados",
    "onError": "error_busqueda"
  }
}
```

---

### 7. GPT - Respuesta con IA
```json
{
  "id": "consulta_libre",
  "type": "gpt",
  "message": "Pregúntame lo que quieras sobre nuestros productos",
  "action": {
    "type": "gpt_response",
    "config": {
      "context": "Eres un asesor de {{empresa}}",
      "maxTokens": 150
    }
  },
  "next": "main_menu"
}
```

---

## 🔄 Motor de Nodos (NodeEngine)

### Flujo de Ejecución

```
Usuario envía mensaje
    ↓
NodeEngine identifica sesión activa
    ↓
Obtiene nodo actual
    ↓
Procesa según tipo:
  - MENU → Busca opción seleccionada
  - INPUT → Valida y guarda
  - CONDITION → Evalúa condiciones
  - ACTION → Ejecuta acción
    ↓
Determina siguiente nodo
    ↓
Procesa siguiente nodo
    ↓
Devuelve mensaje al usuario
```

### Gestión de Sesiones

```typescript
{
  empresaId: "Veo Veo",
  contactId: "5493794946066",
  flowId: "consultar_libros",
  currentNode: "buscar_libro",
  variables: {
    producto: "Manual Santillana 5",
    precio: 15000,
    stock: 3
  },
  history: [
    { nodeId: "main_menu", timestamp: "...", userInput: "1" },
    { nodeId: "buscar_libro", timestamp: "...", userInput: "Manual..." }
  ]
}
```

---

## 📝 Ejemplo Completo: Veo Veo

### Flow Principal
```json
{
  "empresaId": "Veo Veo",
  "id": "consultar_libros",
  "nombre": "Consulta de Libros",
  "startNode": "main_menu",
  "variables": {
    "ATENCION_WA": "https://wa.me/5493794946066",
    "HORARIO": "Lun-Vie 9-18hs, Sáb 9-13hs"
  }
}
```

### Nodo 1: Menú Principal
```json
{
  "id": "main_menu",
  "type": "menu",
  "message": "Hola 👋 Bienvenido a Librería Veo Veo\n\n¿Qué necesitas?",
  "options": [
    { "text": "Libros escolares", "next": "buscar_libro" },
    { "text": "Libros de inglés", "next": "ingles_info" },
    { "text": "Hablar con asesor", "url": "{{ATENCION_WA}}" }
  ]
}
```

### Nodo 2: Buscar Libro
```json
{
  "id": "buscar_libro",
  "type": "input",
  "message": "Ingresá el libro que buscas:\nTítulo - Editorial - Edición",
  "validation": {
    "type": "text",
    "min": 3,
    "errorMessage": "Por favor ingresá al menos 3 caracteres"
  },
  "next": "procesar_busqueda"
}
```

### Nodo 3: Procesar Búsqueda (API)
```json
{
  "id": "procesar_busqueda",
  "type": "api_call",
  "action": {
    "type": "api_call",
    "config": {
      "endpoint": "buscar-productos",
      "params": {
        "search": "{{buscar_libro}}"
      }
    },
    "onSuccess": "verificar_resultados",
    "onError": "error_busqueda"
  }
}
```

### Nodo 4: Verificar Resultados
```json
{
  "id": "verificar_resultados",
  "type": "condition",
  "conditions": [
    { "if": "resultados.length", "operator": "gt", "value": 0, "next": "mostrar_resultados" },
    { "else": "sin_resultados" }
  ]
}
```

### Nodo 5: Mostrar Resultados
```json
{
  "id": "mostrar_resultados",
  "type": "message",
  "message": "Encontré estos libros:\n\n{{resultados}}\n\n¿Querés comprarlo?",
  "options": [
    { "text": "Sí, comprar", "next": "generar_pago" },
    { "text": "Buscar otro", "next": "buscar_libro" },
    { "text": "Volver al menú", "next": "main_menu" }
  ]
}
```

### Nodo 6: Generar Pago
```json
{
  "id": "generar_pago",
  "type": "action",
  "action": {
    "type": "create_payment_link",
    "config": {
      "title": "{{producto.nombre}}",
      "amount": "{{producto.precio}}",
      "description": "Compra de {{producto.nombre}}"
    },
    "onSuccess": "pago_generado",
    "onError": "error_pago"
  }
}
```

### Nodo 7: Pago Generado
```json
{
  "id": "pago_generado",
  "type": "message",
  "message": "¡Perfecto! 🎉\n\nAquí está tu link de pago:\n{{payment_link}}\n\nHorario de atención: {{HORARIO}}",
  "next": "main_menu"
}
```

---

## 🔧 Variables Globales

### Definición en Flow
```json
{
  "variables": {
    "ATENCION_WA": "https://wa.me/549379...",
    "HORARIO": "Lun-Vie 9-18hs",
    "EMAIL_SOPORTE": "soporte@veoveo.com",
    "PROMOCION_ACTIVA": "20% OFF en libros de inglés"
  }
}
```

### Uso en Nodos
```json
{
  "message": "Horario: {{HORARIO}}\nPromo: {{PROMOCION_ACTIVA}}"
}
```

**Ventajas:**
- ✅ Cambiar horario en UN solo lugar
- ✅ Actualizar promociones sin tocar nodos
- ✅ Reutilizar valores en múltiples nodos

---

## 🎨 Frontend Minimalista (Propuesto)

### Formulario de Edición de Nodo

```
┌─────────────────────────────────────┐
│ Editar Nodo                         │
├─────────────────────────────────────┤
│                                     │
│ ID: [buscar_libro              ]    │
│                                     │
│ Nombre: [Buscar Libro          ]    │
│                                     │
│ Tipo: ( ) Menú                      │
│       (•) Input                     │
│       ( ) Mensaje                   │
│       ( ) Condición                 │
│       ( ) Acción                    │
│                                     │
│ Mensaje:                            │
│ ┌─────────────────────────────┐    │
│ │ Ingresá el libro que buscas │    │
│ │ Título - Editorial - Edición│    │
│ └─────────────────────────────┘    │
│                                     │
│ Validación:                         │
│ Tipo: [Texto ▼]                     │
│ Mínimo: [3    ]  Máximo: [200  ]    │
│                                     │
│ Siguiente nodo: [procesar_busqueda▼]│
│                                     │
│ [Guardar] [Cancelar] [Eliminar]     │
└─────────────────────────────────────┘
```

### Lista de Nodos

```
┌─────────────────────────────────────┐
│ Flujo: Consultar Libros             │
├─────────────────────────────────────┤
│                                     │
│ 1. main_menu (Menú)                 │
│    ├─ Libros escolares → buscar_... │
│    ├─ Libros inglés → ingles_info   │
│    └─ Asesor → [URL]                │
│                                     │
│ 2. buscar_libro (Input)             │
│    └─ → procesar_busqueda           │
│                                     │
│ 3. procesar_busqueda (API)          │
│    ├─ Success → verificar_resultados│
│    └─ Error → error_busqueda        │
│                                     │
│ [+ Agregar Nodo]                    │
└─────────────────────────────────────┘
```

---

## 🚀 Migración de Workflows Existentes

### Workflow Actual (Hardcodeado)
```typescript
const pasos = [
  { tipo: 'recopilar', mensaje: '¿Qué libro buscas?' },
  { tipo: 'consulta_filtrada', endpointId: 'buscar-productos' },
  { tipo: 'confirmacion', mensaje: '¿Confirmas la compra?' },
  { tipo: 'consulta_filtrada', endpointId: 'generar-link-pago' }
];
```

### Nuevo Formato (Nodos)
```json
[
  {
    "id": "buscar_libro",
    "type": "input",
    "message": "¿Qué libro buscas?",
    "next": "procesar_busqueda"
  },
  {
    "id": "procesar_busqueda",
    "type": "api_call",
    "action": {
      "type": "api_call",
      "config": { "endpoint": "buscar-productos" }
    },
    "next": "confirmar_compra"
  },
  {
    "id": "confirmar_compra",
    "type": "menu",
    "message": "¿Confirmas la compra?",
    "options": [
      { "text": "Sí", "next": "generar_pago" },
      { "text": "No", "next": "main_menu" }
    ]
  },
  {
    "id": "generar_pago",
    "type": "action",
    "action": {
      "type": "create_payment_link"
    }
  }
]
```

---

## 📊 Comparación

| Aspecto | Workflows Actuales | Nodos Configurables |
|---------|-------------------|---------------------|
| **Edición** | Código TypeScript | JSON desde UI |
| **Deploy** | Requiere deploy | Sin deploy |
| **Reutilización** | Copiar/pegar código | Clonar flujo |
| **Variables** | Hardcodeadas | Configurables |
| **Condiciones** | `if/else` en código | Nodos condition |
| **Testing** | Difícil | Fácil (JSON) |
| **Versionado** | Git | BD + Git |
| **Editable por** | Devs | Admins |

---

## ✅ Beneficios Clave

1. **🎯 Sin código para cambios de contenido**
   - Cambiar texto → Editar JSON
   - Agregar opción → Agregar objeto
   - Modificar flujo → Reordenar nodos

2. **📦 Reutilizable**
   - Clonar flujo para otra empresa
   - Compartir nodos entre flujos
   - Templates predefinidos

3. **🔧 Mantenible**
   - Variables globales
   - Cambios centralizados
   - Historial de versiones

4. **🚀 Escalable**
   - Agregar tipos de nodos
   - Extender validaciones
   - Nuevas acciones

5. **👥 Accesible**
   - UI simple
   - Sin conocimiento técnico
   - Documentación clara

---

## 🔄 Próximos Pasos

### Fase 1: Core (Actual)
- [x] Modelo FlowNode
- [x] Modelo Flow
- [x] NodeEngine básico
- [ ] Integración con whatsappController
- [ ] Migrar 1 workflow de prueba

### Fase 2: Acciones
- [ ] Integrar create_payment_link
- [ ] Integrar api_call con apiExecutor
- [ ] Implementar save_data
- [ ] Implementar send_email

### Fase 3: Frontend
- [ ] CRUD de Flows
- [ ] CRUD de Nodes
- [ ] Editor visual simple
- [ ] Preview de flujos

### Fase 4: Avanzado
- [ ] Versionado de flujos
- [ ] A/B testing
- [ ] Analytics por nodo
- [ ] Templates marketplace

---

## 📚 Referencias

- **Modelos:** `src/models/FlowNode.ts`, `src/models/Flow.ts`
- **Motor:** `src/services/nodeEngine.ts`
- **Ejemplos:** `docs/ejemplos-nodos/`
- **API:** `docs/API-NODOS.md` (próximamente)
