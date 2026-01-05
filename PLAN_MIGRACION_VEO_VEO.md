# 📋 PLAN DE MIGRACIÓN - FLUJO VEO VEO

## 🎯 OBJETIVO
Migrar el flujo completo de Veo Veo desde el sistema antiguo (basado en workflows con steps) al nuevo sistema visual de flow-builder estilo Make.com.

---

## 📊 ANÁLISIS DEL FLUJO ACTUAL

### **Empresa:**
- **ID:** `6940a9a181b92bfce970fdb5`
- **Nombre:** Veo Veo
- **Tipo:** Librería de libros

### **API Configurada:**
- **ID:** `695320fda03785dacc8d950b`
- **Nombre:** WooCommerce API - Veo Veo
- **Base URL:** `https://www.veoveolibros.com.ar/wp-json/wc/v3`
- **Autenticación:** Basic Auth
  - **Username:** `ck_1f3a8bcc67796cf3d2d00ea950274bbe651da939`
  - **Password:** `cs_0170ad344d889ae6b305f3d41021f1af4dfd4a41`
  - **Query String:** Sí

### **Endpoints Disponibles:**
1. `listar-productos` - GET /products
2. `buscar-productos` - GET /products?search={{query}}
3. `obtener-producto` - GET /products/{{product_id}}
4. `listar-categorias` - GET /products/categories
5. `productos-por-categoria` - GET /products?category={{category_id}}
6. `crear-pedido` - POST /orders
7. `generar-link-pago` - POST /mercadopago/payment-link

### **Workflows Existentes:**
1. **Menú Principal** (trigger: primer_mensaje)
2. **Consultar Libros** (compra de libros)
3. **Libros de Inglés** (pedidos especiales)
4. **Soporte de Ventas** (menú post-venta)
   - Retiro de libro
   - Compra por error
   - Fallas de fábrica
   - Solicitar envío
5. **Información del Local**
6. **Promociones Vigentes**
7. **Consultas Personalizadas**

---

## 🔄 MAPEO: SISTEMA ANTIGUO → SISTEMA NUEVO

### **1. WORKFLOWS → NODOS**

#### **Sistema Antiguo:**
```json
{
  "workflows": [
    {
      "nombre": "Veo Veo - Menú Principal",
      "steps": [
        {
          "orden": 1,
          "tipo": "recopilar",
          "pregunta": "...",
          "nombreVariable": "opcion_menu"
        }
      ]
    }
  ]
}
```

#### **Sistema Nuevo:**
```typescript
{
  id: "node_1",
  type: "custom",
  position: { x: 100, y: 100 },
  data: {
    label: "Menú Principal",
    subtitle: "Recopilar opción",
    type: "input",
    appName: "WhatsApp",
    executionCount: 1,
    config: {
      tipo: "recopilar",
      pregunta: "...",
      nombreVariable: "opcion_menu",
      validacion: { tipo: "opcion", opciones: ["1","2","3"...] }
    }
  }
}
```

---

### **2. STEPS → CONFIGURACIÓN DE NODOS**

| Tipo Antiguo | Tipo Nuevo | Nodo Visual | Configuración |
|--------------|------------|-------------|---------------|
| `recopilar` | `input` | WhatsApp verde | Pregunta + Variable + Validación |
| `consulta_filtrada` | `api_call` | WooCommerce morado | Endpoint + Parámetros + Mapeo |
| `confirmacion` | `condition` | Router amarillo | Condición SI/NO |
| `validar` | `validation` | Validación turquesa | Reglas de validación |

---

### **3. WORKFLOWSSIGUIENTES → EDGES CON FILTROS**

#### **Sistema Antiguo:**
```json
{
  "workflowsSiguientes": {
    "workflows": [
      { "workflowId": "consultar-libros", "opcion": "1" },
      { "workflowId": "libros-ingles", "opcion": "2" }
    ]
  }
}
```

#### **Sistema Nuevo:**
```typescript
{
  id: "edge_1",
  source: "node_menu",
  target: "node_consultar_libros",
  type: "custom",
  data: {
    filter: {
      label: "Opción = 1",
      conditions: [
        { field: "opcion_menu", operator: "equal", value: "1" }
      ]
    }
  }
}
```

---

### **4. ENDPOINTS → CONFIGURACIÓN DE NODOS API**

#### **Sistema Antiguo:**
```json
{
  "tipo": "consulta_filtrada",
  "endpointId": "buscar-productos",
  "mapeoParametros": {
    "search": { "origen": "variable", "nombreVariable": "titulo" }
  }
}
```

#### **Sistema Nuevo:**
```typescript
{
  type: "api_call",
  appName: "WooCommerce",
  config: {
    apiConfigId: "695320fda03785dacc8d950b",
    endpointId: "buscar-productos",
    parametros: {
      search: "{{titulo}}",
      per_page: 100,
      status: "publish"
    },
    responseConfig: {
      arrayPath: "data",
      idField: "id",
      displayField: "name",
      priceField: "price"
    }
  }
}
```

---

## 📐 ESTRUCTURA DEL FLUJO VEO VEO

### **FLUJO PRINCIPAL:**

```
┌─────────────────┐
│  WhatsApp       │ (Trigger: primer_mensaje)
│  Recibir Mensaje│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  WhatsApp       │ (Menú Principal)
│  Mostrar Menú   │ Pregunta: "Elegí una opción 1-6"
└────────┬────────┘ Variable: opcion_menu
         │
    ┌────┴────┬────────┬────────┬────────┬────────┐
    │         │        │        │        │        │
    ▼         ▼        ▼        ▼        ▼        ▼
  [1]       [2]      [3]      [4]      [5]      [6]
Libros   Inglés  Soporte   Info   Promos  Consultas
```

### **FLUJO DE COMPRA (Opción 1):**

```
┌─────────────────┐
│  WhatsApp       │
│  Solicitar      │ Pregunta: "Título del libro?"
│  Título         │ Variable: titulo
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  WhatsApp       │
│  Solicitar      │ Pregunta: "Editorial?"
│  Editorial      │ Variable: editorial
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  WooCommerce    │
│  Buscar         │ Endpoint: buscar-productos
│  Productos      │ Parámetros: search={{titulo}}
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
 [Encontrado] [No encontrado]
    │         │
    │         └──> Mensaje: "No hay stock"
    │
    ▼
┌─────────────────┐
│  WhatsApp       │
│  Solicitar      │ Pregunta: "¿Cuántos ejemplares?"
│  Cantidad       │ Variable: cantidad
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  WhatsApp       │
│  Confirmar      │ Pregunta: "1) Agregar otro 2) Finalizar"
│  o Agregar      │ Variable: continuar_compra
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
  [1]       [2]
 Volver   Finalizar
  ▲         │
  │         ▼
  │    ┌─────────────────┐
  │    │  WooCommerce    │
  │    │  Crear Pedido   │ Endpoint: crear-pedido
  │    └────────┬────────┘
  │             │
  │             ▼
  │    ┌─────────────────┐
  │    │  MercadoPago    │
  │    │  Generar Link   │ Endpoint: generar-link-pago
  │    └────────┬────────┘
  │             │
  │             ▼
  │    ┌─────────────────┐
  │    │  WhatsApp       │
  │    │  Enviar Link    │ Mensaje: "Link de pago: {{link}}"
  │    └─────────────────┘
  │
  └─────────────┘
```

---

## 🛠️ PASOS DE MIGRACIÓN

### **FASE 1: PREPARACIÓN**

1. **Crear API Config en BD:**
```javascript
{
  _id: "695320fda03785dacc8d950b",
  nombre: "WooCommerce API - Veo Veo",
  baseUrl: "https://www.veoveolibros.com.ar/wp-json/wc/v3",
  empresaId: "6940a9a181b92bfce970fdb5",
  autenticacion: {
    tipo: "basic",
    configuracion: {
      username: "ck_1f3a8bcc67796cf3d2d00ea950274bbe651da939",
      password: "cs_0170ad344d889ae6b305f3d41021f1af4dfd4a41",
      useQueryString: true
    }
  },
  endpoints: [...]
}
```

2. **Crear Flow en BD:**
```javascript
{
  nombre: "Veo Veo - Flujo Principal",
  empresaId: "6940a9a181b92bfce970fdb5",
  activo: true,
  nodes: [],
  edges: []
}
```

---

### **FASE 2: CREACIÓN DE NODOS**

#### **Nodo 1: Trigger WhatsApp**
```javascript
{
  id: "node_trigger",
  type: "custom",
  position: { x: 400, y: 50 },
  data: {
    label: "WhatsApp - Recibir Mensaje",
    subtitle: "Watch Events",
    type: "webhook",
    appName: "WhatsApp",
    executionCount: 1,
    config: {
      tipo: "trigger",
      evento: "primer_mensaje",
      mensajeInicial: "Hola 👋\n¡Bienvenido/a a Librería Veo Veo! 📚✏️"
    }
  }
}
```

#### **Nodo 2: Menú Principal**
```javascript
{
  id: "node_menu",
  type: "custom",
  position: { x: 400, y: 200 },
  data: {
    label: "Menú Principal",
    subtitle: "Recopilar opción",
    type: "input",
    appName: "WhatsApp",
    executionCount: 2,
    config: {
      tipo: "recopilar",
      pregunta: "👉 Por favor, selecciona un ítem de consulta:\n\n1️⃣ Libros escolares u otros títulos\n2️⃣ Libros de Inglés\n3️⃣ Soporte de ventas\n4️⃣ Información del local\n5️⃣ Promociones vigentes\n6️⃣ Consultas personalizadas\n\nEscribí el número",
      nombreVariable: "opcion_menu",
      validacion: {
        tipo: "opcion",
        opciones: ["1", "2", "3", "4", "5", "6"],
        mensajeError: "Por favor, escribí un número del 1 al 6"
      }
    }
  }
}
```

#### **Nodo 3: Solicitar Título**
```javascript
{
  id: "node_titulo",
  type: "custom",
  position: { x: 200, y: 400 },
  data: {
    label: "Solicitar Título",
    subtitle: "Recopilar texto",
    type: "input",
    appName: "WhatsApp",
    executionCount: 3,
    config: {
      tipo: "recopilar",
      pregunta: "Por favor, ingresa los siguientes datos:\n\n📖 *Título:*\n\n⚠️ *No enviar fotografía de libros, únicamente por escrito*",
      nombreVariable: "titulo",
      validacion: {
        tipo: "texto",
        requerido: true
      }
    }
  }
}
```

#### **Nodo 4: Buscar Productos (WooCommerce)**
```javascript
{
  id: "node_buscar",
  type: "custom",
  position: { x: 200, y: 600 },
  data: {
    label: "WooCommerce - Buscar Productos",
    subtitle: "Ejecutar búsqueda",
    type: "api_call",
    appName: "WooCommerce",
    executionCount: 4,
    config: {
      apiConfigId: "695320fda03785dacc8d950b",
      endpointId: "buscar-productos",
      parametros: {
        search: "{{titulo}}",
        per_page: 100,
        status: "publish"
      },
      responseConfig: {
        arrayPath: "data",
        idField: "id",
        displayField: "name",
        priceField: "price",
        stockField: "stock_quantity"
      },
      mensajeSinResultados: "Lo sentimos, este libro parece no encontrarse en stock..."
    }
  }
}
```

#### **Nodo 5: Generar Link de Pago (MercadoPago)**
```javascript
{
  id: "node_pago",
  type: "custom",
  position: { x: 200, y: 1000 },
  data: {
    label: "MercadoPago - Generar Link",
    subtitle: "Crear link de pago",
    type: "api_call",
    appName: "MercadoPago",
    executionCount: 7,
    config: {
      apiConfigId: "695320fda03785dacc8d950b",
      endpointId: "generar-link-pago",
      parametros: {
        product_id: "{{producto_id}}",
        cantidad: "{{cantidad}}",
        cliente_nombre: "{{cliente_nombre}}",
        cliente_telefono: "{{cliente_telefono}}"
      }
    }
  }
}
```

---

### **FASE 3: CREACIÓN DE EDGES**

#### **Edge 1: Trigger → Menú**
```javascript
{
  id: "edge_1",
  source: "node_trigger",
  target: "node_menu",
  type: "custom",
  data: {
    sourceColor: "#25D366",
    targetColor: "#25D366"
  }
}
```

#### **Edge 2: Menú → Consultar Libros (con filtro)**
```javascript
{
  id: "edge_2",
  source: "node_menu",
  target: "node_titulo",
  type: "custom",
  data: {
    sourceColor: "#25D366",
    targetColor: "#25D366",
    filter: {
      label: "Opción = 1",
      conditions: [
        {
          field: "opcion_menu",
          operator: "equal",
          value: "1"
        }
      ]
    }
  }
}
```

#### **Edge 3: Título → Buscar**
```javascript
{
  id: "edge_3",
  source: "node_titulo",
  target: "node_buscar",
  type: "custom",
  data: {
    sourceColor: "#25D366",
    targetColor: "#96588a"
  }
}
```

---

## 📝 REGLAS DE MIGRACIÓN

### **1. TIPOS DE NODOS:**

| Tipo Workflow | Tipo Nodo | App Visual | Color |
|---------------|-----------|------------|-------|
| `trigger` | `webhook` | WhatsApp | Verde #25D366 |
| `recopilar` | `input` | WhatsApp | Verde #25D366 |
| `consulta_filtrada` (WooCommerce) | `api_call` | WooCommerce | Morado #96588a |
| `consulta_filtrada` (MercadoPago) | `api_call` | MercadoPago | Azul #009ee3 |
| `confirmacion` | `condition` | Router | Amarillo #f59e0b |
| `validar` | `validation` | Validación | Turquesa #14b8a6 |

### **2. VARIABLES:**

- Todas las variables se almacenan en `conversationState`
- Formato: `{{nombreVariable}}`
- Ejemplo: `{{titulo}}`, `{{cantidad}}`, `{{producto_id}}`

### **3. VALIDACIONES:**

```javascript
{
  tipo: "opcion" | "texto" | "numero",
  requerido: boolean,
  opciones?: string[],
  min?: number,
  max?: number,
  mensajeError?: string
}
```

### **4. FILTROS EN EDGES:**

```javascript
{
  filter: {
    label: "Descripción legible",
    conditions: [
      {
        field: "nombreVariable",
        operator: "equal" | "not_equal" | "greater_than" | "less_than" | "contains",
        value: "valor"
      }
    ],
    logic: "AND" | "OR"
  }
}
```

### **5. ENDPOINTS API:**

```javascript
{
  apiConfigId: "ID de la API Config",
  endpointId: "ID del endpoint",
  parametros: {
    [key]: "{{variable}}" | "valor_fijo"
  },
  responseConfig: {
    arrayPath: "ruta.al.array",
    idField: "campo_id",
    displayField: "campo_display",
    priceField: "campo_precio"
  }
}
```

---

## 🚀 IMPLEMENTACIÓN

### **Backend:**

1. **Crear colección `api_configs`:**
```javascript
{
  _id: ObjectId,
  nombre: String,
  baseUrl: String,
  empresaId: ObjectId,
  autenticacion: {
    tipo: "basic" | "bearer" | "oauth2",
    configuracion: Object
  },
  endpoints: [
    {
      id: String,
      nombre: String,
      method: "GET" | "POST" | "PUT" | "DELETE",
      path: String,
      parametros: Object
    }
  ]
}
```

2. **Crear colección `flows`:**
```javascript
{
  _id: ObjectId,
  nombre: String,
  empresaId: ObjectId,
  activo: Boolean,
  nodes: [
    {
      id: String,
      type: String,
      position: { x: Number, y: Number },
      data: Object
    }
  ],
  edges: [
    {
      id: String,
      source: String,
      target: String,
      type: String,
      data: Object
    }
  ]
}
```

3. **Endpoints API:**
```
GET    /api/flows/:empresaId
POST   /api/flows
PUT    /api/flows/:flowId
DELETE /api/flows/:flowId

GET    /api/api-configs/:empresaId
POST   /api/api-configs
PUT    /api/api-configs/:configId
DELETE /api/api-configs/:configId
```

### **Frontend:**

1. **Cargar flow desde BD:**
```typescript
const loadFlow = async (empresaId: string) => {
  const response = await fetch(`/api/flows/${empresaId}`);
  const flowData = await response.json();
  
  setNodes(flowData.nodes);
  setEdges(flowData.edges);
};
```

2. **Guardar flow en BD:**
```typescript
const saveFlow = async () => {
  await fetch('/api/flows', {
    method: 'POST',
    body: JSON.stringify({
      nombre: flowName,
      empresaId: EMPRESA_ID,
      nodes,
      edges
    })
  });
};
```

---

## ✅ CHECKLIST DE MIGRACIÓN

### **Preparación:**
- [ ] Crear API Config en BD
- [ ] Crear Flow vacío en BD
- [ ] Verificar credenciales WooCommerce
- [ ] Verificar credenciales MercadoPago

### **Nodos:**
- [ ] Nodo Trigger WhatsApp
- [ ] Nodo Menú Principal
- [ ] Nodo Solicitar Título
- [ ] Nodo Solicitar Editorial
- [ ] Nodo Solicitar Edición
- [ ] Nodo Buscar Productos (WooCommerce)
- [ ] Nodo Solicitar Cantidad
- [ ] Nodo Confirmar/Agregar
- [ ] Nodo Crear Pedido (WooCommerce)
- [ ] Nodo Generar Link (MercadoPago)
- [ ] Nodo Enviar Link

### **Edges:**
- [ ] Trigger → Menú
- [ ] Menú → Consultar Libros (filtro: opcion=1)
- [ ] Menú → Libros Inglés (filtro: opcion=2)
- [ ] Menú → Soporte (filtro: opcion=3)
- [ ] Menú → Info Local (filtro: opcion=4)
- [ ] Menú → Promociones (filtro: opcion=5)
- [ ] Menú → Consultas (filtro: opcion=6)
- [ ] Título → Editorial
- [ ] Editorial → Edición
- [ ] Edición → Buscar
- [ ] Buscar → Cantidad (filtro: encontrado)
- [ ] Buscar → Sin Stock (filtro: no encontrado)
- [ ] Cantidad → Confirmar
- [ ] Confirmar → Título (filtro: agregar otro)
- [ ] Confirmar → Crear Pedido (filtro: finalizar)
- [ ] Crear Pedido → Generar Link
- [ ] Generar Link → Enviar Link

### **Testing:**
- [ ] Probar flujo completo de compra
- [ ] Probar búsqueda sin resultados
- [ ] Probar validaciones
- [ ] Probar filtros en edges
- [ ] Probar generación de link de pago
- [ ] Probar variables entre nodos

---

## 📚 DOCUMENTACIÓN ADICIONAL

### **Variables del Sistema:**
- `opcion_menu`: Opción elegida en menú principal (1-6)
- `titulo`: Título del libro buscado
- `editorial`: Editorial del libro
- `edicion`: Edición del libro
- `productos_encontrados`: Array de productos de WooCommerce
- `producto_id`: ID del producto seleccionado
- `producto_nombre`: Nombre del producto
- `producto_precio`: Precio del producto
- `cantidad`: Cantidad de ejemplares
- `subtotal`: Precio × Cantidad
- `continuar_compra`: 1=Agregar otro, 2=Finalizar
- `link_pago`: URL de Mercado Pago

### **Mensajes del Sistema:**
- Mensaje inicial: "Hola 👋 ¡Bienvenido/a a Librería Veo Veo!"
- Sin resultados: "Lo sentimos, este libro parece no encontrarse en stock..."
- Error de validación: "Por favor, escribí un número del 1 al 6"
- Confirmación: "✅ Libro agregado a tu compra"
- Link de pago: "💳 Link de pago generado..."

---

## 🎯 RESULTADO ESPERADO

Al finalizar la migración, el flujo debe:

1. ✅ Mostrar visualmente en el flow-builder
2. ✅ Permitir editar nodos y edges
3. ✅ Guardar cambios en BD
4. ✅ Ejecutar el flujo completo desde WhatsApp
5. ✅ Conectar con WooCommerce API
6. ✅ Generar links de Mercado Pago
7. ✅ Manejar variables entre nodos
8. ✅ Aplicar filtros en edges
9. ✅ Validar inputs del usuario
10. ✅ Mantener estado de conversación

---

**Documento creado:** 2026-01-04
**Versión:** 1.0
**Autor:** Sistema de Migración Veo Veo
