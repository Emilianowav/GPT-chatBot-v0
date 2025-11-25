# 🎨 Workflows Conversacionales - Frontend UI Completo

## ✅ Estado: IMPLEMENTADO

El frontend UI para crear workflows conversacionales está **completamente implementado** y listo para usar.

---

## 🎯 ¿Qué se Implementó?

### **1. Editor Visual de Workflows**
- ✅ Formulario completo con todas las opciones
- ✅ Interfaz intuitiva y moderna
- ✅ Validación en tiempo real
- ✅ Preview de configuración

### **2. Componentes Modulares**
- ✅ `WorkflowManager.tsx` - Gestor principal
- ✅ `WorkflowStepEditor.tsx` - Editor de pasos
- ✅ `WorkflowTriggerConfig.tsx` - Configurador de triggers
- ✅ `WorkflowManager.module.css` - Estilos completos

### **3. Características**
- ✅ Crear workflows desde el dashboard
- ✅ Configurar triggers (keyword, primer mensaje, manual)
- ✅ Agregar pasos de recopilación y ejecución
- ✅ Validaciones (texto, número, opciones, regex)
- ✅ Mapeo de parámetros visual
- ✅ Mensajes personalizados
- ✅ Configuración avanzada

---

## 📋 Cómo Usar el Frontend

### Paso 1: Acceder al Editor

1. Ir a: **Dashboard → Integraciones → APIs Configurables**
2. Seleccionar una API existente
3. Click en la pestaña **"Flujos"**
4. Click en **"Nuevo Flujo"**

### Paso 2: Configurar Información Básica

```
📋 Información Básica
├── Nombre: "Búsqueda de Productos"
├── Descripción: "Búsqueda inteligente con filtros"
├── Prioridad: 10 (mayor = más prioridad)
└── Timeout: 30 minutos
```

### Paso 3: Configurar Trigger

**Opción A: Por Palabras Clave**
```
🎯 Activación
├── Tipo: "Por Palabras Clave"
└── Keywords: ["buscar", "stock", "disponibilidad"]
```

**Opción B: Primer Mensaje**
```
🎯 Activación
├── Tipo: "Primer Mensaje"
└── Se activa automáticamente en el primer mensaje
```

**Opción C: Manual**
```
🎯 Activación
├── Tipo: "Manual"
└── Se activa solo manualmente
```

### Paso 4: Agregar Pasos

#### **Paso 1: Recopilar Sucursal**

```
📝 Tipo: Recopilar Información

Pregunta:
"¿En qué sucursal querés buscar?
Centro, Norte o Sur"

Variable: sucursal

Validación:
├── Tipo: Lista de opciones
├── Opciones: ["Centro", "Norte", "Sur"]
└── Intentos Máximos: 3
```

#### **Paso 2: Recopilar Categoría**

```
📝 Tipo: Recopilar Información

Pregunta:
"¿Qué tipo de producto buscás?
Teléfonos, Fundas, Accesorios o Auriculares"

Variable: categoria

Validación:
├── Tipo: Lista de opciones
└── Opciones: ["Teléfonos", "Fundas", "Accesorios", "Auriculares"]
```

#### **Paso 3: Recopilar Producto**

```
📝 Tipo: Recopilar Información

Pregunta: "¿Qué modelo o marca estás buscando?"

Variable: query

Validación:
└── Tipo: Texto libre
```

#### **Paso 4: Ejecutar Búsqueda**

```
⚡ Tipo: Ejecutar Endpoint

Endpoint: GET /productos/buscar

Mapeo de Parámetros:
├── sucursal → sucursal
├── categoria → categoria
└── query → q
```

### Paso 5: Configurar Mensajes

```
💬 Mensajes

Mensaje Inicial:
"🔍 Te ayudo a buscar productos en nuestro stock"

Mensaje Final:
"✅ Aquí están los resultados:"

Mensaje de Abandono:
"🚫 Búsqueda cancelada. Escribí 'buscar' cuando quieras empezar de nuevo."
```

### Paso 6: Configuración Final

```
⚙️ Configuración

☑ Activar workflow inmediatamente
☑ Permitir que el usuario cancele con "cancelar"
```

### Paso 7: Guardar

Click en **"Guardar Workflow"**

---

## 🎨 Características del UI

### **Editor de Pasos Expandible**

Cada paso tiene un header colapsable:

```
┌─────────────────────────────────────────┐
│ Paso 1  📝 Recopilar  sucursal      ▼ 🗑️│
├─────────────────────────────────────────┤
│ [Contenido expandido]                   │
│ - Pregunta                              │
│ - Variable                              │
│ - Validación                            │
│ - Opciones                              │
└─────────────────────────────────────────┘
```

### **Validaciones Visuales**

**Tipo: Opciones**
```
Opciones:
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Centro ✕│ │ Norte  ✕│ │ Sur    ✕│
└─────────┘ └─────────┘ └─────────┘

[Nueva opción...] [Agregar]
```

**Tipo: Regex**
```
Expresión Regular:
┌──────────────────────────────────┐
│ ^[0-9]{10}$                      │
└──────────────────────────────────┘
```

### **Mapeo de Parámetros**

```
Mapeo de Parámetros:
┌─────────────────────────────────────┐
│ sucursal  →  [nombre_parametro]     │
│ categoria →  [nombre_parametro]     │
│ query     →  [nombre_parametro]     │
└─────────────────────────────────────┘
```

### **Triggers con Radio Buttons**

```
┌─────────────────────────────────────┐
│ ○ Por Palabras Clave                │
│   Se activa con ciertas palabras    │
├─────────────────────────────────────┤
│ ● Primer Mensaje                    │
│   Se activa automáticamente         │
├─────────────────────────────────────┤
│ ○ Manual                            │
│   Se activa solo manualmente        │
└─────────────────────────────────────┘
```

---

## 🎯 Tipos de Pasos Disponibles

### **1. Recopilar Información**

Hace una pregunta al usuario y guarda la respuesta.

**Campos:**
- Pregunta (textarea)
- Nombre de Variable (input)
- Tipo de Validación (select)
  - Texto libre
  - Número
  - Lista de opciones
  - Expresión regular
- Opciones (si es lista)
- Mensaje de Error (opcional)
- Intentos Máximos (número)

### **2. Ejecutar Endpoint**

Ejecuta un endpoint con los datos recopilados.

**Campos:**
- Endpoint a Ejecutar (select)
- Mapeo de Parámetros (lista)
  - Variable → Parámetro

### **3. Validar Datos**

Valida datos antes de continuar (futuro).

---

## 🎨 Estilos Implementados

### **Tema Momento**
- ✅ Colores: #FF6B4A (naranja Momento)
- ✅ Gradientes suaves
- ✅ Animaciones fluidas
- ✅ Hover effects
- ✅ Focus states
- ✅ Responsive design

### **Componentes Estilizados**
- ✅ Cards con bordes sutiles
- ✅ Inputs con focus glow
- ✅ Buttons con gradientes
- ✅ Tags para keywords/opciones
- ✅ Info boxes para ayuda
- ✅ Radio buttons personalizados

---

## 📊 Ejemplo Completo: Búsqueda de iPhone 14

### Configuración en el UI

**1. Información Básica**
```
Nombre: Búsqueda de Productos
Descripción: Búsqueda inteligente con filtros progresivos
Prioridad: 10
Timeout: 30 minutos
```

**2. Trigger**
```
Tipo: Por Palabras Clave
Keywords: buscar, stock, disponibilidad
```

**3. Pasos**

**Paso 1:**
```
Tipo: Recopilar
Pregunta: "¿En qué sucursal?"
Variable: sucursal
Validación: Opciones [Centro, Norte, Sur]
```

**Paso 2:**
```
Tipo: Recopilar
Pregunta: "¿Qué categoría?"
Variable: categoria
Validación: Opciones [Teléfonos, Fundas, Accesorios]
```

**Paso 3:**
```
Tipo: Recopilar
Pregunta: "¿Qué producto buscás?"
Variable: query
Validación: Texto
```

**Paso 4:**
```
Tipo: Ejecutar
Endpoint: GET /productos/buscar
Mapeo:
  sucursal → sucursal
  categoria → categoria
  query → q
```

**4. Mensajes**
```
Inicial: "🔍 Te ayudo a buscar productos"
Final: "✅ Aquí están los resultados:"
Abandono: "🚫 Búsqueda cancelada"
```

**5. Configuración**
```
☑ Activar inmediatamente
☑ Permitir cancelar
```

### Resultado en WhatsApp

```
Usuario: buscar iphone

Bot: 🔍 Te ayudo a buscar productos
     
     ¿En qué sucursal?
     Centro, Norte o Sur

Usuario: norte

Bot: ¿Qué categoría?
     Teléfonos, Fundas, Accesorios o Auriculares

Usuario: telefonos

Bot: ¿Qué producto buscás?

Usuario: iphone 14

Bot: ✅ Aquí están los resultados:
     
     📱 iPhone 14 - $899 (Stock: 3)
     📱 iPhone 14 Pro - $1099 (Stock: 1)
```

---

## 🔧 Archivos Implementados

### Frontend (4 archivos nuevos)

1. ✅ `WorkflowManager.tsx` - Gestor principal actualizado
2. ✅ `WorkflowStepEditor.tsx` - Editor de pasos (NUEVO)
3. ✅ `WorkflowTriggerConfig.tsx` - Configurador de triggers (NUEVO)
4. ✅ `WorkflowManager.module.css` - Estilos completos actualizados

### Características de Cada Componente

**WorkflowManager.tsx**
- Gestión de workflows
- CRUD completo
- Integración con API
- Modal de edición

**WorkflowStepEditor.tsx**
- Editor expandible de pasos
- Soporte para todos los tipos
- Validaciones visuales
- Mapeo de parámetros

**WorkflowTriggerConfig.tsx**
- Radio buttons para tipos
- Gestión de keywords
- Info boxes explicativos
- Validación de triggers

---

## 🎯 Validaciones Disponibles

### **1. Texto Libre**
```
Validación: Texto
- Acepta cualquier texto no vacío
- Trim automático
```

### **2. Número**
```
Validación: Número
- Solo acepta números
- Convierte a float automáticamente
```

### **3. Lista de Opciones**
```
Validación: Opciones
- Lista de opciones predefinidas
- Normalización automática de typos
- Coincidencias parciales

Ejemplo:
Opciones: ["Centro", "Norte", "Sur"]
Usuario escribe: "nrte" → Acepta "Norte" ✅
```

### **4. Expresión Regular**
```
Validación: Regex
- Patrón personalizado
- Mensaje de error custom

Ejemplo:
Regex: ^[0-9]{10}$
Mensaje: "Ingresá un teléfono de 10 dígitos"
```

---

## 🚀 Flujo de Uso Completo

### 1. Crear Workflow
```
Dashboard → APIs → [API] → Flujos → Nuevo Flujo
```

### 2. Llenar Formulario
```
├── Información Básica
├── Trigger
├── Mensajes
├── Pasos (agregar uno por uno)
└── Configuración
```

### 3. Guardar
```
Click "Guardar Workflow"
```

### 4. Probar en WhatsApp
```
Usuario escribe keyword → Workflow se activa
```

### 5. Ver en Dashboard
```
El workflow aparece en la lista con:
- Nombre
- Estado (Activo/Inactivo)
- Número de pasos
- Acciones (Editar, Eliminar, Toggle)
```

---

## 📱 Responsive Design

El UI es completamente responsive:

**Desktop (>768px)**
- Formulario en 2 columnas donde aplique
- Modal ancho completo
- Pasos expandidos

**Mobile (<768px)**
- Formulario en 1 columna
- Modal adaptado
- Touch-friendly buttons

---

## ✅ Checklist de Implementación

### Backend ✅
- [x] Tipos actualizados
- [x] Schemas MongoDB
- [x] Gestor de estado
- [x] Handler conversacional
- [x] Router actualizado
- [x] WhatsApp Controller
- [x] Compilación exitosa

### Frontend ✅
- [x] Interfaces TypeScript
- [x] WorkflowManager actualizado
- [x] WorkflowStepEditor creado
- [x] WorkflowTriggerConfig creado
- [x] Estilos CSS completos
- [x] Validaciones visuales
- [x] Mapeo de parámetros
- [x] Responsive design

---

## 🎉 Estado Final

**Backend:** ✅ 100% Completado  
**Frontend:** ✅ 100% Completado  
**UI/UX:** ✅ Moderno y funcional  
**Responsive:** ✅ Mobile-friendly  

**El sistema está COMPLETAMENTE LISTO PARA USAR** 🎉

---

## 📝 Próximos Pasos (Opcionales)

### 1. Mejoras UX
- [ ] Preview en tiempo real de la conversación
- [ ] Drag & drop para reordenar pasos
- [ ] Duplicar workflows
- [ ] Templates predefinidos

### 2. Validaciones Avanzadas
- [ ] Validación de email
- [ ] Validación de teléfono
- [ ] Validación de fecha
- [ ] Validación custom con JavaScript

### 3. Analytics
- [ ] Dashboard de workflows
- [ ] Métricas de conversión
- [ ] Análisis de abandono
- [ ] Heatmap de pasos

---

**Fecha:** Noviembre 2024  
**Estado:** ✅ Completado y Funcional  
**Listo para:** Producción
