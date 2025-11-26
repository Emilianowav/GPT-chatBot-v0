# 📘 EXPLICACIÓN: MAPEO DE PARÁMETROS EN CONSULTA FILTRADA

## 🎯 ¿Qué es el Mapeo de Parámetros?

El **Mapeo de Parámetros** conecta los datos que ya recopilaste con los parámetros que necesita la API para hacer la búsqueda final.

---

## 🔄 FLUJO COMPLETO

### **Paso 1: Recopilar Datos**
```
Usuario interactúa → Sistema guarda variables
```

**Ejemplo:**
- Paso 1: Usuario elige "Buenos Aires" → `sucursal_id = 5`
- Paso 2: Usuario escribe "samsung galaxy" → `nombre_producto = "samsung galaxy"`
- Paso 3: Usuario elige "Celulares" → `categoria_id = 15`

### **Paso 2: Mapear Variables a Parámetros**
```
Variable Recopilada  →  Parámetro del Endpoint
sucursal_id         →  location_id
nombre_producto     →  search
categoria_id        →  category
```

### **Paso 3: Ejecutar Consulta**
```
GET /api/productos?location_id=5&search=samsung galaxy&category=15
```

---

## 📊 COMPONENTES DEL MAPEO

### **1. Variable Recopilada** (Lado Izquierdo)

**¿Qué es?**
- Datos que YA tienes guardados de pasos anteriores
- Valores que el usuario ya proporcionó

**Ejemplos:**
- `sucursal_id` → El ID de la sucursal que eligió
- `nombre_producto` → El texto que escribió
- `categoria_id` → La categoría que seleccionó

**Valor actual:**
```
sucursal_id = 5
nombre_producto = "samsung galaxy"
categoria_id = 15
```

---

### **2. Parámetro del Endpoint** (Lado Derecho)

**¿Qué es?**
- Nombres de parámetros que ESPERA la API
- Definidos por el backend/API externa

**Ejemplos:**
- `location_id` → Nombre del parámetro en la API
- `search` → Nombre del parámetro en la API
- `category` → Nombre del parámetro en la API

**Documentación de la API:**
```
GET /api/productos
Parámetros:
  - location_id: ID de la sucursal
  - search: Texto de búsqueda
  - category: ID de categoría
```

---

## 🎨 INTERFAZ VISUAL

### **Antes (Input Manual):**
```
┌────────────────────────────────┐
│ sucursal_id → [location_id   ] │  ← Escribir a mano
│ nombre_producto → [search    ] │  ← Propenso a errores
│ categoria_id → [category     ] │  ← Sin validación
└────────────────────────────────┘
```

### **Ahora (Selectores Visuales):**
```
┌──────────────────────────────────────────────┐
│ Variable Recopilada  →  Parámetro Endpoint   │
│ [sucursal_id ▼] 📝   →  [location_id ▼]     │
│ Preview: 5 (Buenos Aires)                    │
│                                              │
│ [nombre_producto ▼] ✍️ →  [search ▼]        │
│ Preview: "samsung galaxy"                    │
│                                              │
│ [categoria_id ▼] 📝  →  [category ▼]        │
│ Preview: 15 (Celulares)                      │
│                                              │
│ [+ Agregar Filtro]                          │
└──────────────────────────────────────────────┘
```

---

## 🔗 ENDPOINTS RELACIONADOS

### **¿Qué son?**
Llamadas adicionales para enriquecer cada resultado con más datos.

### **Ejemplo Práctico:**

**Resultado Principal:**
```json
GET /api/productos?location_id=5&search=samsung
Respuesta:
[
  { "id": 2976, "name": "Samsung Galaxy S23", "price": 899 },
  { "id": 2977, "name": "Samsung Galaxy A54", "price": 449 }
]
```

**Endpoint Relacionado:**
```json
GET /api/productos/detalles?product_id=2976
Respuesta:
{
  "link_compra": "https://...",
  "stock": 15,
  "garantia": "12 meses"
}
```

**Resultado Final para el Usuario:**
```
📱 Samsung Galaxy S23 - $899
🔗 Comprar: https://...
📦 Stock: 15 unidades
✅ Garantía: 12 meses
```

---

## ⚙️ CONFIGURACIÓN DE ENDPOINTS RELACIONADOS

### **1. Campo ID del Resultado Principal**
**¿Qué es?**
- El campo del resultado principal que contiene el ID
- Se usa para hacer la llamada al endpoint relacionado

**Ejemplo:**
```
Resultado principal: { "id": 2976, "name": "Samsung..." }
                       ↑
                    Este campo
```

**Ahora con selector visual:**
```
🔑 Campo ID del Resultado Principal
[Seleccionar campo ▼]
  - id
  - product_id
  - item_id
  - sku
```

---

### **2. Parámetro del Endpoint Relacionado**
**¿Qué es?**
- Nombre del parámetro que espera el endpoint relacionado

**Ejemplo:**
```
GET /api/productos/detalles?product_id=2976
                            ↑
                    Este parámetro
```

---

### **3. Campos a Extraer**
**¿Qué es?**
- Campos de la respuesta del endpoint relacionado que quieres mostrar

**Antes (Input Manual):**
```
Campos a Extraer:
[link_compra    ] ✕
[stock          ] ✕
[garantia       ] ✕
```

**Ahora (Selector Visual):**
```
Campo #1
[Seleccionar campo ▼]
  - link_compra
  - stock
  - garantia
  - precio_especial
  - descuento

Campo #2
[Seleccionar campo ▼]
  - stock
  - disponibilidad
  - tiempo_entrega
```

---

## 📝 EJEMPLO COMPLETO

### **Configuración:**

**Paso 1: Recopilar Sucursal**
- Variable: `sucursal_id`
- Valor: 5

**Paso 2: Input Búsqueda**
- Variable: `nombre_producto`
- Valor: "samsung"

**Paso 3: Consulta Filtrada**

**Endpoint Principal:**
```
GET /api/productos
```

**Mapeo de Parámetros:**
```
sucursal_id     → location_id
nombre_producto → search
```

**Endpoint Relacionado:**
```
Endpoint: GET /api/productos/detalles
Campo ID: id
Parámetro: product_id
Campos a Extraer:
  - link_compra
  - stock
```

---

### **Ejecución:**

**1. Llamada Principal:**
```
GET /api/productos?location_id=5&search=samsung

Respuesta:
[
  { "id": 2976, "name": "Samsung Galaxy S23", "price": 899 },
  { "id": 2977, "name": "Samsung Galaxy A54", "price": 449 }
]
```

**2. Llamadas Relacionadas (automáticas):**
```
GET /api/productos/detalles?product_id=2976
Respuesta: { "link_compra": "https://...", "stock": 15 }

GET /api/productos/detalles?product_id=2977
Respuesta: { "link_compra": "https://...", "stock": 8 }
```

**3. Resultado Final:**
```
📱 PRODUCTOS ENCONTRADOS

1. Samsung Galaxy S23 - $899
   🔗 Comprar: https://...
   📦 Stock: 15 unidades

2. Samsung Galaxy A54 - $449
   🔗 Comprar: https://...
   📦 Stock: 8 unidades
```

---

## ✅ BENEFICIOS DE LOS SELECTORES VISUALES

### **Antes:**
- ❌ Escribir nombres a mano
- ❌ Errores de tipeo
- ❌ No saber qué campos existen
- ❌ Sin preview de valores

### **Ahora:**
- ✅ Selectores visuales
- ✅ Sin errores de tipeo
- ✅ Ver todos los campos disponibles
- ✅ Preview de valores en tiempo real
- ✅ Validación automática

---

## 🎯 RESUMEN

1. **Variables Recopiladas** = Datos que YA tienes
2. **Parámetros del Endpoint** = Lo que ESPERA la API
3. **Mapeo** = Conectar ambos
4. **Endpoints Relacionados** = Enriquecer resultados con más datos
5. **Selectores Visuales** = Configuración fácil y sin errores

---

**¡Ahora la configuración es mucho más intuitiva y visual! 🚀**
