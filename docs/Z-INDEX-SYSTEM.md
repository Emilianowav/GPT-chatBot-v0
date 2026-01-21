# Sistema de Z-Index Organizado

## 📋 Estructura de Capas

El sistema de z-index está organizado en rangos de 100 para cada funcionalidad:

### **0-9: Base / Canvas**
- `0` - Canvas background
- `1` - Canvas grid

### **10-99: Nodos y Elementos del Canvas**
- `10` - Nodo base
- `15` - Nodo seleccionado
- `20` - Badge de nodo
- `25` - Label de nodo
- `30` - Nota (NoteNode)

### **100-199: Handles y Controles**
- `100` - Handle base
- `110` - Handle hover
- `120` - Handle plus (+)
- `130` - Handle activo

### **200-299: Edges y Conexiones**
- `200` - Edge base (aplicado actualmente: 1000 → debe cambiarse a 200)
- `210` - Edge seleccionado
- `220` - Edge label

### **300-399: Tooltips y Elementos Flotantes**
- `300` - Tooltip
- `310` - Popover
- `320` - Dropdown pequeño

### **400-499: Paneles Laterales**
- `400` - Panel de configuración (NodeConfigPanel)
- `410` - Panel de variables
- `420` - Sidebar

### **500-599: Modales de Configuración**
- `490` - Modal backdrop
- `500` - Modal de configuración (GPTConfigModal, HTTPConfigModal, WebhookConfigModal, EdgeConfigModal)

### **600-699: Modales de Selección**
- `600` - Modal de selección base
- `610` - AppsModal
- `620` - ModuleSelectionModal

### **700-799: Notificaciones y Toasts**
- `700` - Toast (ToastContainer)
- `710` - Notification

### **800-899: Overlays y Loaders**
- `800` - Overlay
- `810` - Loader

### **900-999: Elementos Críticos**
- `900` - Dropdown crítico (sobre modales)
- `910` - Modal crítico (MercadoPagoConfigModal, WooCommerceConnectionModal)
- `999` - Debug

## 🔧 Componentes a Actualizar

### **Prioridad Alta (valores incorrectos actuales)**

1. **Edges** - Actualmente: `1000` → Debe ser: `200`
   - `page.tsx`: líneas 1044, 1102, 1118
   - `edges.map`: zIndex en todas las instancias

2. **Handles en BaseNode** - Actualmente: `100`, `10000` → Debe ser: `100`, `120`
   - `BaseNode.tsx`: líneas 133, 174
   - `BaseNode.module.css`: líneas 71, 105

3. **Handles en BaseRouterNode** - Similar a BaseNode
   - `BaseRouterNode.tsx`
   - `BaseRouterNode.module.css`

4. **RouterNode handles** - Actualmente: `10001` → Debe ser: `130`
   - `RouterNode.module.css`: línea 99

### **Modales (actualizar a rangos correctos)**

5. **Modales de configuración** → `500`
   - `GPTConfigModal.module.css`: línea 11
   - `HTTPConfigModal.module.css`: línea 15 (actualmente 9999)
   - `WebhookConfigModal.module.css`: línea 12
   - `EdgeConfigModal.module.css`: línea 15
   - `NodeConfigPanel.module.css`: línea 11

6. **Modales de selección** → `600`
   - `ModuleSelectionModal.module.css`: línea 15
   - `NodePalette.module.css`: línea 11

7. **Modales críticos** → `910`
   - `MercadoPagoConfigModal.module.css`: línea 11 (actualmente 10000)
   - `WooCommerceConnectionModal.module.css`: línea 11 (actualmente 10000)

8. **Modales de variables y tópicos** → `700`
   - `VariablesModal.module.css`: línea 12 (actualmente 2000)
   - `TopicsModal.module.css`: línea 12 (actualmente 2000)

### **Paneles**

9. **Paneles laterales** → `400`
   - `NodeConfigPanel.module.css`: línea 12 (actualmente 100)
   - `FlowVariablesPanel.module.css`: línea 13

## 📝 Variables CSS

Usar las variables CSS definidas en `z-index-system.css`:

```css
/* Ejemplo de uso */
.myModal {
  z-index: var(--z-modal-config);
}

.myToast {
  z-index: var(--z-toast);
}

.myHandle {
  z-index: var(--z-handle-base);
}
```

## ✅ Beneficios del Nuevo Sistema

1. **Organización clara**: Cada funcionalidad tiene su rango definido
2. **Escalabilidad**: Espacio suficiente para agregar elementos dentro de cada rango
3. **Mantenibilidad**: Fácil identificar dónde debe ir cada elemento
4. **Sin conflictos**: Rangos separados evitan superposiciones no deseadas
5. **Debugging**: Números más bajos y organizados facilitan el debug

## 🚀 Próximos Pasos

1. Aplicar cambios a todos los componentes listados arriba
2. Probar que no haya regresiones visuales
3. Documentar cualquier caso especial que requiera z-index fuera de rangos
4. Considerar migrar todos los z-index inline a clases CSS con variables
