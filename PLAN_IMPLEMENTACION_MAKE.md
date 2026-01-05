# 📋 PLAN DE IMPLEMENTACIÓN - SISTEMA DE FLUJOS ESTILO MAKE.COM

## 🎯 OBJETIVO
Implementar desde cero un sistema de flujos exactamente como Make.com, basado en las capturas proporcionadas.

---

## 📊 ANÁLISIS DE CAPTURAS

### **Imagen 1: Estado Inicial**
- ✅ Nodo circular morado grande con "+"
- ✅ Al hacer click: modal de apps a la derecha
- ✅ Lista de apps: Google Sheets, Flow Control, Tools, Webhooks, OpenAI, HTTP, Gmail
- ✅ Búsqueda en la parte inferior

### **Imagen 2: Selección de App**
- ✅ Nodo + sigue visible a la izquierda
- ✅ Modal muestra "WhatsApp Business Cloud" con badge "Verified"
- ✅ Categorías: MESSAGE, MEDIA
- ✅ Opciones: Watch Events (INSTANT, ACID), Send a Message, Send a Template Message
- ✅ Botón "BACK" arriba

### **Imagen 3: Nodo Creado**
- ✅ Nodo verde de WhatsApp con icono
- ✅ Badge rojo "1" arriba derecha
- ✅ Icono rayo verde abajo izquierda
- ✅ Handle verde a la derecha (semicírculo)
- ✅ Label: "WhatsApp Business Cloud"
- ✅ Subtitle: "Watch Events"
- ✅ Modal de configuración: "Create a webhook"

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### **1. COMPONENTES DE NODOS**

#### **A. PlusNode (Nodo Inicial)**
```typescript
// Nodo circular morado con "+"
// Al hacer click: abre modal de apps
// Se mantiene visible hasta que se selecciona una app

Props:
- onAddClick: () => void
- position: { x, y }

Estilo:
- Círculo 120px morado (#8b5cf6)
- Icono + blanco grande
- Sombra suave
- Hover: scale(1.05)
```

#### **B. AppNode (Nodo con App)**
```typescript
// Nodo circular con app seleccionada
// Tiene handle + a la derecha
// Badge de ejecución arriba derecha
// Badge de app abajo izquierda

Props:
- id: string
- appName: string
- appIcon: ReactNode
- color: string
- label: string
- subtitle: string
- executionCount: number
- onHandleClick: () => void
- onNodeClick: () => void

Estilo:
- Círculo 100px con color de app
- Handle semicircular 40px a la derecha
- Badge rojo arriba derecha
- Badge app abajo izquierda
- Label y subtitle debajo
```

---

### **2. MODALES**

#### **A. AppsModal**
```typescript
// Modal de selección de apps (Imagen 1)

Props:
- isOpen: boolean
- onClose: () => void
- onSelectApp: (app: App) => void
- position: { x, y }

Estructura:
- Header: "ALL APPS"
- Lista de apps con iconos
- Búsqueda: "Search apps or modules"
- Scroll vertical

Apps disponibles:
- Google Sheets
- Flow Control
- Tools
- Webhooks
- OpenAI (ChatGPT, Sora, DALL-E, Whisper)
- HTTP
- Gmail
- WhatsApp Business Cloud
- WooCommerce
```

#### **B. ModuleSelectionModal**
```typescript
// Modal de selección de módulo (Imagen 2)

Props:
- isOpen: boolean
- onClose: () => void
- app: App
- onSelectModule: (module: Module) => void

Estructura:
- Header: App name + "Verified" badge
- Botón "BACK"
- Categorías: MESSAGE, MEDIA, etc.
- Lista de módulos por categoría
- Búsqueda: "Search modules"

Ejemplo WhatsApp:
MESSAGE:
- Watch Events (INSTANT, ACID)
- Send a Message
- Send a Template Message

MEDIA:
- Upload a Media
```

#### **C. ModuleConfigModal**
```typescript
// Modal de configuración de módulo (Imagen 3)

Props:
- isOpen: boolean
- onClose: () => void
- module: Module
- onSave: (config: any) => void

Estructura:
- Header: App name + iconos (settings, help, close)
- Sección: Webhook
- Botón: "Create a webhook"
- Botones: "Cancel", "Save" (morado)
```

---

### **3. SISTEMA DE HANDLES**

#### **Reglas:**
1. **Nodo Inicial (+):** No tiene handles
2. **Nodo con App:** Un handle + a la derecha (fijo)
3. **Handle Conectado:** Se convierte en handle normal (sin +)
4. **Nuevo Handle +:** Aparece cuando se conecta

#### **Implementación:**
```typescript
// Handle siempre a la derecha del nodo
// Posición fija: NODE_RADIUS (50px) desde centro

const handlePosition = {
  left: `calc(50% + 50px)`,
  top: '50%',
  transform: 'translate(-50%, -50%)'
};

// Handle con + (no conectado)
<div className="handle-plus">
  <Plus size={20} />
</div>

// Handle conectado (sin +)
<div className="handle-connected" />
```

---

### **4. LÍNEAS CONECTORAS**

#### **Estilo Make.com:**
```typescript
// Círculos verdes espaciados
// No línea sólida, solo círculos

const circles = [];
for (let i = 0; i < numCircles; i++) {
  const t = i / (numCircles - 1);
  const x = sourceX + (targetX - sourceX) * t;
  const y = sourceY + (targetY - sourceY) * t;
  
  circles.push({
    x, y,
    color: nodeColor, // Color del nodo source
    size: 10
  });
}

// Render
circles.map(circle => (
  <circle
    cx={circle.x}
    cy={circle.y}
    r={circle.size}
    fill={circle.color}
    stroke="#fff"
    strokeWidth={3}
  />
))
```

---

## 🔄 FLUJO DE INTERACCIÓN

### **Paso 1: Estado Inicial**
```
Canvas vacío
    ↓
Renderizar PlusNode en centro
    ↓
Usuario ve nodo morado con +
```

### **Paso 2: Click en Nodo +**
```
Usuario click en PlusNode
    ↓
Abrir AppsModal
    ↓
Mostrar lista de apps
```

### **Paso 3: Seleccionar App**
```
Usuario selecciona "WhatsApp"
    ↓
Abrir ModuleSelectionModal
    ↓
Mostrar módulos de WhatsApp
```

### **Paso 4: Seleccionar Módulo**
```
Usuario selecciona "Watch Events"
    ↓
Abrir ModuleConfigModal
    ↓
Usuario configura webhook
    ↓
Click "Save"
    ↓
Cerrar modales
    ↓
Convertir PlusNode → AppNode
    ↓
AppNode tiene handle + a la derecha
```

### **Paso 5: Agregar Segundo Nodo**
```
Usuario click en handle + del AppNode
    ↓
Abrir AppsModal en posición del handle
    ↓
Usuario selecciona app (ej: OpenAI)
    ↓
Selecciona módulo
    ↓
Configura módulo
    ↓
Crear nuevo AppNode
    ↓
Conectar con línea (círculos verdes)
    ↓
Handle + del primer nodo desaparece
    ↓
Nuevo nodo tiene handle + a la derecha
```

---

## 📁 ESTRUCTURA DE ARCHIVOS

```
src/components/flow-builder/
├── nodes/
│   ├── PlusNode.tsx          # Nodo + inicial
│   ├── PlusNode.module.css
│   ├── AppNode.tsx            # Nodo con app
│   └── AppNode.module.css
├── modals/
│   ├── AppsModal.tsx          # Modal de apps
│   ├── AppsModal.module.css
│   ├── ModuleSelectionModal.tsx
│   ├── ModuleSelectionModal.module.css
│   ├── ModuleConfigModal.tsx
│   └── ModuleConfigModal.module.css
├── edges/
│   ├── SimpleEdge.tsx         # Línea con círculos
│   └── SimpleEdge.module.css
└── FlowCanvas.tsx             # Canvas principal

src/app/dashboard/flow-builder/
└── page.tsx                   # Página principal
```

---

## 🎨 ESTILOS Y COLORES

### **Colores de Apps:**
```typescript
const appColors = {
  'WhatsApp': '#25D366',
  'OpenAI': '#10a37f',
  'WooCommerce': '#96588a',
  'HTTP': '#0ea5e9',
  'Webhooks': '#c13584',
  'Gmail': '#ea4335',
  'Google Sheets': '#34a853',
  'Flow Control': '#a3e635',
  'Tools': '#6366f1',
};
```

### **Nodo Inicial (+):**
```css
.plusNode {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  box-shadow: 0 10px 30px rgba(139, 92, 246, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s;
}

.plusNode:hover {
  transform: scale(1.05);
}

.plusIcon {
  color: white;
  font-size: 48px;
  font-weight: 300;
}
```

### **Nodo con App:**
```css
.appNode {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 4px solid #f5f5f7;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s;
  position: relative;
}

.appNode:hover {
  transform: scale(1.05);
}

.executionBadge {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #ef4444;
  color: white;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid #f5f5f7;
}

.appBadge {
  position: absolute;
  bottom: -8px;
  left: -8px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid #f5f5f7;
}

.handle {
  position: absolute;
  right: -20px;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid #f5f5f7;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
}

.handlePlus {
  background: var(--node-color);
}

.handleConnected {
  background: var(--node-color);
  opacity: 0.8;
}
```

---

## 🔧 IMPLEMENTACIÓN TÉCNICA

### **1. Estado Global**
```typescript
interface FlowState {
  nodes: Node[];
  edges: Edge[];
  selectedNode: Node | null;
  showAppsModal: boolean;
  showModuleModal: boolean;
  showConfigModal: boolean;
  selectedApp: App | null;
  selectedModule: Module | null;
}
```

### **2. Funciones Principales**

#### **handlePlusNodeClick**
```typescript
const handlePlusNodeClick = () => {
  setShowAppsModal(true);
  setAppsModalPosition({ x: centerX, y: centerY });
};
```

#### **handleAppSelect**
```typescript
const handleAppSelect = (app: App) => {
  setSelectedApp(app);
  setShowAppsModal(false);
  setShowModuleModal(true);
};
```

#### **handleModuleSelect**
```typescript
const handleModuleSelect = (module: Module) => {
  setSelectedModule(module);
  setShowModuleModal(false);
  setShowConfigModal(true);
};
```

#### **handleConfigSave**
```typescript
const handleConfigSave = (config: any) => {
  // Convertir PlusNode a AppNode
  const newNode = {
    id: generateId(),
    type: 'app',
    position: plusNodePosition,
    data: {
      appName: selectedApp.name,
      appIcon: selectedApp.icon,
      color: selectedApp.color,
      label: selectedApp.name,
      subtitle: selectedModule.name,
      executionCount: 1,
      config: config,
      hasConnection: false,
    }
  };
  
  setNodes([newNode]);
  setShowConfigModal(false);
};
```

#### **handleHandlePlusClick**
```typescript
const handleHandlePlusClick = (sourceNodeId: string) => {
  setSourceNodeForConnection(sourceNodeId);
  setShowAppsModal(true);
  
  // Posición del modal: junto al handle
  const sourceNode = nodes.find(n => n.id === sourceNodeId);
  setAppsModalPosition({
    x: sourceNode.position.x + 150,
    y: sourceNode.position.y
  });
};
```

#### **createConnectedNode**
```typescript
const createConnectedNode = (sourceNodeId: string, app: App, module: Module, config: any) => {
  const sourceNode = nodes.find(n => n.id === sourceNodeId);
  
  // Crear nuevo nodo a la derecha
  const newNode = {
    id: generateId(),
    type: 'app',
    position: {
      x: sourceNode.position.x + 250,
      y: sourceNode.position.y
    },
    data: {
      appName: app.name,
      appIcon: app.icon,
      color: app.color,
      label: app.name,
      subtitle: module.name,
      executionCount: 1,
      config: config,
      hasConnection: false,
    }
  };
  
  // Crear edge
  const newEdge = {
    id: `${sourceNodeId}-${newNode.id}`,
    source: sourceNodeId,
    target: newNode.id,
    type: 'simple',
    data: {
      color: sourceNode.data.color
    }
  };
  
  // Actualizar nodo source: marcar como conectado
  setNodes(prev => [
    ...prev.map(n => 
      n.id === sourceNodeId 
        ? { ...n, data: { ...n.data, hasConnection: true } }
        : n
    ),
    newNode
  ]);
  
  setEdges(prev => [...prev, newEdge]);
};
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### **Fase 1: Componentes Base**
- [ ] Crear PlusNode.tsx
- [ ] Crear PlusNode.module.css
- [ ] Crear AppNode.tsx
- [ ] Crear AppNode.module.css
- [ ] Crear SimpleEdge.tsx
- [ ] Crear SimpleEdge.module.css

### **Fase 2: Modales**
- [ ] Crear AppsModal.tsx
- [ ] Crear AppsModal.module.css
- [ ] Crear ModuleSelectionModal.tsx
- [ ] Crear ModuleSelectionModal.module.css
- [ ] Crear ModuleConfigModal.tsx
- [ ] Crear ModuleConfigModal.module.css

### **Fase 3: Lógica**
- [ ] Implementar handlePlusNodeClick
- [ ] Implementar handleAppSelect
- [ ] Implementar handleModuleSelect
- [ ] Implementar handleConfigSave
- [ ] Implementar handleHandlePlusClick
- [ ] Implementar createConnectedNode

### **Fase 4: Integración**
- [ ] Integrar componentes en FlowCanvas
- [ ] Configurar ReactFlow
- [ ] Probar flujo completo
- [ ] Ajustar estilos

### **Fase 5: Testing**
- [ ] Crear primer nodo desde +
- [ ] Crear segundo nodo desde handle +
- [ ] Crear tercer nodo
- [ ] Verificar líneas conectoras
- [ ] Verificar badges
- [ ] Verificar modales

---

## 🎯 RESULTADO ESPERADO

Al finalizar, el sistema debe:

1. ✅ Mostrar nodo + morado inicial
2. ✅ Al click: abrir modal de apps
3. ✅ Seleccionar app → modal de módulos
4. ✅ Seleccionar módulo → modal de configuración
5. ✅ Guardar → convertir + a nodo con app
6. ✅ Nodo tiene handle + a la derecha
7. ✅ Click en handle + → crear nuevo nodo conectado
8. ✅ Líneas con círculos verdes
9. ✅ Badges de ejecución y app
10. ✅ **Exactamente como Make.com**

---

**Documento creado:** 2026-01-04
**Versión:** 1.0
**Basado en:** Capturas de Make.com
