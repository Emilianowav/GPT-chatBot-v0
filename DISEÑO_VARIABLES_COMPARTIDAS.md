# SISTEMA DE VARIABLES COMPARTIDAS ENTRE NODOS

## 🎯 CONCEPTO

**Nodos "fuente"** declaran variables que otros nodos pueden **consumir** mediante dropdowns.

---

## 📋 TIPOS DE VARIABLES

### **1. Variables Técnicas/Declarativas** (se ocultan después)
- `phoneNumberId` - Declarado en WhatsApp Watch Events
- `verifyToken` - Declarado en WhatsApp Watch Events
- `apiKey` - Declarado en nodos de integración
- Configuraciones de conexión

**Comportamiento:**
- Se configuran UNA VEZ en el nodo fuente
- NO se muestran en modales de nodos subsiguientes
- Se usan automáticamente desde el nodo fuente

### **2. Variables de Negocio** (siempre visibles e interactuables)
- Objetos de respuesta de APIs (productos, clientes, etc.)
- Variables recopiladas del usuario
- Datos estructurados que se transforman

**Comportamiento:**
- Se declaran en nodo fuente
- Se muestran en dropdowns en nodos consumidores
- Usuario puede mapear/transformar

---

## 🔧 IMPLEMENTACIÓN

### **NODOS FUENTE Y SUS VARIABLES**

#### **WhatsApp Watch Events** (Trigger)
```javascript
// Variables que DECLARA:
{
  phoneNumberId: "906667632531979",  // TÉCNICA - se oculta
  verifyToken: "2001-ic",            // TÉCNICA - se oculta
  from: "5493794946066",             // NEGOCIO - visible
  message: "Hola",                   // NEGOCIO - visible
  profileName: "~Emiliano"           // NEGOCIO - visible
}

// Otros nodos WhatsApp usan automáticamente:
// - phoneNumberId del Watch Events
// - verifyToken del Watch Events
```

#### **GPT Conversacional**
```javascript
// Variables que DECLARA:
{
  respuesta_gpt: "Hola, ¿cómo estás?",  // NEGOCIO - visible
  tokens: 150,                           // NEGOCIO - visible
  costo: 0.001,                          // NEGOCIO - visible
  // + variables recopiladas dinámicamente
}

// Otros nodos pueden usar:
// - {{gpt-1.respuesta_gpt}} en mensajes
// - {{gpt-1.titulo}} si fue recopilada
```

#### **WooCommerce Get Products**
```javascript
// Variables que DECLARA:
{
  apiUrl: "https://veoveo.com/wp-json",  // TÉCNICA - se oculta
  consumerKey: "ck_xxx",                 // TÉCNICA - se oculta
  consumerSecret: "cs_xxx",              // TÉCNICA - se oculta
  products: [...],                       // NEGOCIO - visible
  total: 45                              // NEGOCIO - visible
}

// Otros nodos WooCommerce usan automáticamente:
// - apiUrl, consumerKey, consumerSecret del primer nodo
```

---

## 🎨 FRONTEND - COMPORTAMIENTO DE MODALES

### **Ejemplo 1: WhatsApp**

**Nodo 1: WhatsApp Watch Events**
```
┌─────────────────────────────────────┐
│ Configurar WhatsApp Watch Events    │
├─────────────────────────────────────┤
│ Phone Number ID: [906667632531979]  │ ← Usuario configura
│ Verify Token:    [2001-ic]          │ ← Usuario configura
│ Webhook URL:     [auto-generated]   │
└─────────────────────────────────────┘
```

**Nodo 2: WhatsApp Send Message**
```
┌─────────────────────────────────────┐
│ Configurar WhatsApp Send Message    │
├─────────────────────────────────────┤
│ To:      [Dropdown: Variables]      │ ← Selecciona {{1.from}}
│ Message: [Textarea]                 │ ← Escribe mensaje
│                                     │
│ ℹ️ Usando Phone Number ID del nodo  │
│    "WhatsApp Watch Events"          │
└─────────────────────────────────────┘
```
❌ NO se muestra `phoneNumberId` - se usa automáticamente del Watch Events

---

### **Ejemplo 2: WooCommerce**

**Nodo 1: WooCommerce Get Products**
```
┌─────────────────────────────────────┐
│ Configurar WooCommerce              │
├─────────────────────────────────────┤
│ API URL:        [https://...]       │ ← Usuario configura
│ Consumer Key:   [ck_xxx]            │ ← Usuario configura
│ Consumer Secret:[cs_xxx]            │ ← Usuario configura
│ Endpoint:       [/products]         │
│ Filters:        [...]               │
└─────────────────────────────────────┘
```

**Nodo 2: WooCommerce Create Order**
```
┌─────────────────────────────────────┐
│ Configurar WooCommerce Create Order │
├─────────────────────────────────────┤
│ Product ID: [Dropdown: Variables]   │ ← Selecciona {{woo-1.products[0].id}}
│ Quantity:   [1]                     │
│ Customer:   [Dropdown: Variables]   │ ← Selecciona {{1.from}}
│                                     │
│ ℹ️ Usando credenciales del nodo     │
│    "WooCommerce Get Products"       │
└─────────────────────────────────────┘
```
❌ NO se muestran `apiUrl`, `consumerKey`, `consumerSecret` - se usan automáticamente

---

### **Ejemplo 3: GPT**

**Nodo 1: GPT Conversacional (recopila variables)**
```
┌─────────────────────────────────────┐
│ Configurar GPT Conversacional       │
├─────────────────────────────────────┤
│ Variables a Recopilar:              │
│   - titulo (obligatorio)            │
│   - editorial (opcional)            │
│   - edicion (opcional)              │
└─────────────────────────────────────┘
```

**Nodo 2: WooCommerce Search Products**
```
┌─────────────────────────────────────┐
│ Configurar WooCommerce Search       │
├─────────────────────────────────────┤
│ Search Term: [Dropdown: Variables]  │ ← Selecciona {{global.titulo}}
│ Category:    [Dropdown: Variables]  │ ← Selecciona {{global.editorial}}
│                                     │
│ ℹ️ Variables disponibles:           │
│    - global.titulo                  │
│    - global.editorial               │
│    - global.edicion                 │
└─────────────────────────────────────┘
```

---

## 🔍 LÓGICA DE RESOLUCIÓN

### **Backend: FlowExecutor**

```typescript
class FlowExecutor {
  private context: FlowContext = {};
  private globalVariables: Record<string, any> = {};
  private flowConfig: Record<string, any> = {}; // NUEVO
  
  // Al ejecutar el flujo, identificar nodos fuente
  async execute(flow: Flow, input: any) {
    // 1. Identificar nodos fuente por tipo
    const whatsappTrigger = flow.nodes.find(n => 
      n.type === 'whatsapp' && n.data.config.module === 'watch-events'
    );
    
    const wooCommerceSource = flow.nodes.find(n => 
      n.type === 'woocommerce' && n.data.config.isSource === true
    );
    
    // 2. Guardar configuraciones técnicas
    if (whatsappTrigger) {
      this.flowConfig.whatsapp = {
        phoneNumberId: whatsappTrigger.data.config.phoneNumberId,
        verifyToken: whatsappTrigger.data.config.verifyToken
      };
    }
    
    if (wooCommerceSource) {
      this.flowConfig.woocommerce = {
        apiUrl: wooCommerceSource.data.config.apiUrl,
        consumerKey: wooCommerceSource.data.config.consumerKey,
        consumerSecret: wooCommerceSource.data.config.consumerSecret
      };
    }
    
    // 3. Ejecutar nodos normalmente
    // ...
  }
  
  // Al ejecutar nodo WhatsApp Send
  private async executeWhatsAppNode(node: any, input: any) {
    const config = node.data.config;
    
    // Usar phoneNumberId del flowConfig si no está especificado
    const phoneNumberId = config.phoneNumberId || 
                         this.flowConfig.whatsapp?.phoneNumberId;
    
    // ...
  }
}
```

---

## 🎨 FRONTEND: DROPDOWNS INTELIGENTES

### **Componente: VariableSelector**

```tsx
interface VariableOption {
  label: string;
  value: string;
  type: 'node' | 'global' | 'flow';
  nodeId?: string;
  description?: string;
}

function VariableSelector({ 
  nodes, 
  currentNodeId,
  onSelect 
}: Props) {
  // Construir lista de variables disponibles
  const availableVariables: VariableOption[] = [];
  
  // 1. Variables de nodos anteriores
  nodes.forEach(node => {
    if (isBeforeCurrentNode(node.id, currentNodeId)) {
      // Agregar outputs del nodo
      availableVariables.push({
        label: `${node.data.label} - Message`,
        value: `{{${node.id}.message}}`,
        type: 'node',
        nodeId: node.id,
        description: 'Mensaje del usuario'
      });
    }
  });
  
  // 2. Variables globales
  Object.keys(globalVariables).forEach(key => {
    availableVariables.push({
      label: `Global - ${key}`,
      value: `{{global.${key}}}`,
      type: 'global',
      description: 'Variable global recopilada'
    });
  });
  
  return (
    <select onChange={(e) => onSelect(e.target.value)}>
      <option value="">Seleccionar variable...</option>
      {availableVariables.map(v => (
        <option key={v.value} value={v.value}>
          {v.label}
        </option>
      ))}
    </select>
  );
}
```

---

## 📊 ESTRUCTURA DE DATOS

### **Flow con Configuración**

```javascript
{
  _id: "695a156681f6d67f0ae9cf39",
  nombre: "Veo Veo - Test 3 Bloques",
  
  // NUEVO: Metadata de variables declaradas
  variablesDeclaradas: {
    "whatsapp-watch-events": {
      phoneNumberId: { tipo: "tecnica", valor: "906667632531979" },
      verifyToken: { tipo: "tecnica", valor: "2001-ic" },
      from: { tipo: "negocio", path: "1.from" },
      message: { tipo: "negocio", path: "1.message" }
    },
    "gpt-conversacional-3-bloques": {
      respuesta_gpt: { tipo: "negocio", path: "gpt-1.respuesta_gpt" },
      titulo: { tipo: "negocio", path: "global.titulo" },
      editorial: { tipo: "negocio", path: "global.editorial" }
    }
  },
  
  nodes: [...],
  edges: [...]
}
```

---

## ✅ BENEFICIOS

1. **DRY (Don't Repeat Yourself)**
   - Configuración técnica en UN solo lugar
   - Cambios centralizados

2. **UX Mejorada**
   - Menos campos en modales subsiguientes
   - Dropdowns inteligentes con variables disponibles
   - Menos errores de tipeo

3. **Mantenibilidad**
   - Cambiar `phoneNumberId` en un solo lugar
   - Fácil identificar dependencias

4. **Claridad**
   - Variables técnicas ocultas
   - Variables de negocio visibles y mapeables

---

## 🚀 IMPLEMENTACIÓN POR FASES

### **Fase 1: Backend**
- [ ] Agregar `flowConfig` a FlowExecutor
- [ ] Identificar nodos fuente automáticamente
- [ ] Usar configuración técnica de nodos fuente
- [ ] Mantener compatibilidad con flujos existentes

### **Fase 2: Frontend - Ocultar Campos Técnicos**
- [ ] Detectar si ya existe nodo fuente del mismo tipo
- [ ] Ocultar campos técnicos en nodos subsiguientes
- [ ] Mostrar mensaje informativo

### **Fase 3: Frontend - Dropdowns de Variables**
- [ ] Crear componente VariableSelector
- [ ] Listar variables disponibles de nodos anteriores
- [ ] Listar variables globales
- [ ] Insertar variable al seleccionar

### **Fase 4: Metadata de Variables**
- [ ] Guardar metadata de variables declaradas en flow
- [ ] Usar metadata para construir dropdowns
- [ ] Validar referencias a variables

---

## 📝 NOTAS

- Las variables técnicas se resuelven en **tiempo de ejecución** desde el nodo fuente
- Las variables de negocio se resuelven con el sistema existente de `{{variable}}`
- Si no hay nodo fuente, se usa configuración del nodo actual (backward compatibility)
- El frontend debe validar que existe un nodo fuente antes de ocultar campos
