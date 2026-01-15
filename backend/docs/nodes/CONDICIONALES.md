# Condicionales en Conexiones - Documentación Completa

## 📋 Descripción General

Los condicionales permiten controlar el flujo de ejecución mediante condiciones en las **conexiones (edges)** entre nodos. Son el equivalente a `if/else` en programación, pero configurables visualmente.

---

## 🎯 ¿Dónde se Usan?

Los condicionales se configuran en las **conexiones** entre nodos, especialmente:

1. **Desde nodos Router** → Múltiples rutas condicionales
2. **Entre cualquier nodo** → Ejecución condicional
3. **En flujos complejos** → Lógica de negocio

---

## 🔧 Configuración

### Estructura de una Conexión con Condición

```json
{
  "id": "edge-1",
  "source": "router-1",
  "target": "woocommerce-search",
  "data": {
    "condition": "variables_completas equals true",
    "label": "Variables completas"
  }
}
```

**Campos:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `source` | string | ID del nodo origen |
| `target` | string | ID del nodo destino |
| `condition` | string | Condición a evaluar |
| `label` | string | Etiqueta visual (opcional) |

---

## 📊 Operadores Disponibles

### 1. `exists` - Verificar Existencia

**Sintaxis:** `<variable> exists`

**Descripción:** Verifica que la variable exista y tenga valor (no null/undefined/vacío)

**Ejemplos:**
```javascript
titulo exists
variables_completas exists
woocommerce.productos exists
nombre_cliente exists
```

**Evaluación:**
```javascript
const value = getVariableValue(varName);
const exists = value !== undefined && 
               value !== null && 
               value !== '' &&
               !(Array.isArray(value) && value.length === 0);
```

**Casos de Uso:**
```javascript
// Verificar que se recopiló el título
"titulo exists" → true si titulo = "Harry Potter"
                → false si titulo = null

// Verificar que hay productos
"woocommerce.productos exists" → true si productos = [...]
                                → false si productos = []
```

---

### 2. `not exists` - Verificar No Existencia

**Sintaxis:** `<variable> not exists`

**Descripción:** Verifica que la variable NO exista o esté vacía

**Ejemplos:**
```javascript
editorial not exists
variables_faltantes not exists
error not exists
```

**Casos de Uso:**
```javascript
// Verificar que falta la editorial
"editorial not exists" → true si editorial = null
                       → false si editorial = "Salamandra"

// Verificar que no hay errores
"error not exists" → true si no hubo errores
                   → false si error = "Producto no encontrado"
```

---

### 3. `empty` - Verificar Vacío

**Sintaxis:** `<variable> empty`

**Descripción:** Similar a `not exists`, verifica que esté vacío

**Ejemplos:**
```javascript
titulo empty
woocommerce.productos empty
mensaje empty
```

**Casos de Uso:**
```javascript
// Verificar que no hay productos
"woocommerce.productos empty" → true si productos = []
                               → false si productos = [...]
```

---

### 4. `not_empty` - Verificar No Vacío

**Sintaxis:** `<variable> not_empty`

**Descripción:** Verifica que la variable tenga contenido

**Ejemplos:**
```javascript
titulo not_empty
woocommerce.productos not_empty
respuesta not_empty
```

**Casos de Uso:**
```javascript
// Verificar que hay productos
"woocommerce.productos not_empty" → true si productos = [...]
                                   → false si productos = []

// Verificar que el usuario respondió
"respuesta not_empty" → true si respuesta = "Sí"
                      → false si respuesta = ""
```

---

### 5. `equals` - Igualdad

**Sintaxis:** `<variable> equals <valor>`

**Descripción:** Compara el valor de la variable con un valor esperado (case-insensitive)

**Ejemplos:**
```javascript
variables_completas equals true
estado equals "confirmado"
tipo_producto equals "libro"
respuesta equals "si"
cantidad equals 5
```

**Evaluación:**
```javascript
const actualValue = getVariableValue(varName);
const normalizedActual = String(actualValue).toLowerCase().trim();
const normalizedExpected = expectedValue.toLowerCase().trim();

return normalizedActual === normalizedExpected;
```

**Casos de Uso:**
```javascript
// Verificar que las variables están completas
"variables_completas equals true" → true si variables_completas = true
                                   → false si variables_completas = false

// Verificar respuesta del usuario
"respuesta equals si" → true si respuesta = "Sí", "SI", "si"
                      → false si respuesta = "No"

// Verificar tipo de producto
"tipo_producto equals libro" → true si tipo_producto = "Libro", "LIBRO"
                              → false si tipo_producto = "Útil"
```

---

### 6. `not equals` - Desigualdad

**Sintaxis:** `<variable> not equals <valor>`

**Descripción:** Verifica que el valor sea diferente al esperado

**Ejemplos:**
```javascript
estado not equals "cancelado"
tipo_producto not equals "libro"
respuesta not equals "no"
```

**Casos de Uso:**
```javascript
// Verificar que no está cancelado
"estado not equals cancelado" → true si estado = "confirmado"
                               → false si estado = "cancelado"

// Verificar que no es un libro
"tipo_producto not equals libro" → true si tipo_producto = "útil"
                                  → false si tipo_producto = "libro"
```

---

### 7. `contains` - Contiene Texto

**Sintaxis:** `<variable> contains <texto>`

**Descripción:** Verifica que la variable contenga un texto específico (case-insensitive)

**Ejemplos:**
```javascript
titulo contains "harry potter"
mensaje contains "ayuda"
categoria contains "infantil"
respuesta contains "si"
```

**Evaluación:**
```javascript
const actualValue = getVariableValue(varName);
const normalizedActual = String(actualValue).toLowerCase().trim();
const normalizedSearch = searchValue.toLowerCase().trim();

return normalizedActual.includes(normalizedSearch);
```

**Casos de Uso:**
```javascript
// Verificar que es un libro de Harry Potter
"titulo contains harry potter" → true si titulo = "Harry Potter y la Piedra Filosofal"
                                → false si titulo = "El Principito"

// Verificar que el usuario pide ayuda
"mensaje contains ayuda" → true si mensaje = "Necesito ayuda"
                         → false si mensaje = "Busco un libro"

// Verificar categoría
"categoria contains infantil" → true si categoria = "Libros Infantiles"
                               → false si categoria = "Libros Técnicos"
```

---

### 8. `not contains` - No Contiene Texto

**Sintaxis:** `<variable> not contains <texto>`

**Descripción:** Verifica que la variable NO contenga un texto específico

**Ejemplos:**
```javascript
titulo not contains "agotado"
mensaje not contains "cancelar"
estado not contains "error"
```

**Casos de Uso:**
```javascript
// Verificar que no está agotado
"titulo not contains agotado" → true si titulo = "Harry Potter"
                               → false si titulo = "Harry Potter (Agotado)"

// Verificar que no quiere cancelar
"mensaje not contains cancelar" → true si mensaje = "Confirmo el pedido"
                                 → false si mensaje = "Quiero cancelar"
```

---

## 🎯 Ejemplos Completos

### Ejemplo 1: Flujo de Búsqueda de Productos

```
[Formateador] → extrae variables
    ↓
[Router: ¿Variables completas?]
    ├─ [SI: variables_completas equals true] → [WooCommerce: Buscar]
    │                                              ↓
    │                                          [Router: ¿Productos encontrados?]
    │                                              ├─ [SI: woocommerce.productos not_empty] → [GPT: Presentar]
    │                                              └─ [NO: woocommerce.productos empty] → [WhatsApp: No encontrado]
    │
    └─ [NO: variables_completas equals false] → [GPT: Pedir más datos]
```

**Conexiones:**

```json
[
  {
    "source": "router-variables",
    "target": "woocommerce-search",
    "data": {
      "condition": "variables_completas equals true",
      "label": "✅ Completas"
    }
  },
  {
    "source": "router-variables",
    "target": "gpt-pedir-datos",
    "data": {
      "condition": "variables_completas equals false",
      "label": "❌ Incompletas"
    }
  },
  {
    "source": "router-productos",
    "target": "gpt-asistente",
    "data": {
      "condition": "woocommerce.productos not_empty",
      "label": "✅ Productos encontrados"
    }
  },
  {
    "source": "router-productos",
    "target": "whatsapp-no-encontrado",
    "data": {
      "condition": "woocommerce.productos empty",
      "label": "❌ Sin productos"
    }
  }
]
```

---

### Ejemplo 2: Confirmación de Usuario

```
[WhatsApp: Preguntar] → "¿Confirmas el pedido?"
    ↓
[Trigger] → recibe respuesta
    ↓
[Router: ¿Usuario confirma?]
    ├─ [SI: respuesta contains si] → [Crear Pedido]
    │                                    ↓
    │                                [WhatsApp: Confirmación]
    │
    └─ [NO: respuesta contains no] → [WhatsApp: Cancelación]
```

**Conexiones:**

```json
[
  {
    "source": "router-confirmacion",
    "target": "crear-pedido",
    "data": {
      "condition": "respuesta contains si",
      "label": "✅ Confirma"
    }
  },
  {
    "source": "router-confirmacion",
    "target": "whatsapp-cancelacion",
    "data": {
      "condition": "respuesta contains no",
      "label": "❌ Cancela"
    }
  }
]
```

---

### Ejemplo 3: Tipo de Producto

```
[Formateador] → extrae tipo_producto
    ↓
[Router: Tipo de producto]
    ├─ [tipo_producto contains libro] → [Proceso Libros]
    ├─ [tipo_producto contains util] → [Proceso Útiles]
    └─ [Sin condición] → [Proceso General]
```

**Conexiones:**

```json
[
  {
    "source": "router-tipo",
    "target": "proceso-libros",
    "data": {
      "condition": "tipo_producto contains libro",
      "label": "📚 Libros"
    }
  },
  {
    "source": "router-tipo",
    "target": "proceso-utiles",
    "data": {
      "condition": "tipo_producto contains util",
      "label": "✏️ Útiles"
    }
  },
  {
    "source": "router-tipo",
    "target": "proceso-general",
    "data": {
      "label": "🔄 Otros (default)"
    }
  }
]
```

---

## 🔄 Proceso de Evaluación

### 1. Obtener Condición

```javascript
const condition = edge.data?.condition;

if (!condition) {
  console.log('⚠️ Ruta sin condición → Se ejecuta por defecto');
  return true; // Ruta por defecto
}
```

### 2. Detectar Tipo de Condición

```javascript
// Detectar operador
if (condition.includes(' exists')) {
  return evaluateExists(condition);
} else if (condition.includes(' not exists')) {
  return evaluateNotExists(condition);
} else if (condition.includes(' equals ')) {
  return evaluateEquals(condition);
} else if (condition.includes(' contains ')) {
  return evaluateContains(condition);
}
// ... más operadores
```

### 3. Evaluar Condición

```javascript
// Ejemplo: "variables_completas equals true"
const parts = condition.split(' equals ');
const varName = parts[0].trim(); // "variables_completas"
const expectedValue = parts[1].trim(); // "true"

const actualValue = getVariableValue(varName); // true

return String(actualValue).toLowerCase() === expectedValue.toLowerCase();
```

### 4. Logs Detallados

```
🔍 Evaluando ruta 1: woocommerce-search
   Condición: "variables_completas equals true"
   → Detectado 'equals' para variable: "variables_completas"
   🔎 [getVariableValue] Buscando: "variables_completas"
      ✅ Encontrado en globalVariables: true
   → Valor actual: "true"
   → Valor esperado: "true"
   ✅ Condición cumplida
```

---

## 🐛 Debug y Troubleshooting

### Logs de Evaluación

```
🔀 [ROUTER] router-variables: Evaluando condiciones...
   📋 3 ruta(s) posible(s)
   
   🔍 Evaluando ruta 1: woocommerce-search
      Condición: "variables_completas equals true"
      ✅ Condición cumplida
   
   🎯 Ruta seleccionada: woocommerce-search
```

### Verificar Variables

```javascript
// Antes de evaluar condiciones
console.log('🔍 VERIFICACIÓN DE VARIABLES CRÍTICAS:');
console.log(`   titulo exists: ${getVariableValue('titulo') !== undefined}`);
console.log(`   titulo value: ${JSON.stringify(getVariableValue('titulo'))}`);
console.log(`   variables_completas: ${getVariableValue('variables_completas')}`);
```

---

## ⚠️ Errores Comunes

### Error 1: Sintaxis Incorrecta

**Síntoma:**
```
⚠️ ADVERTENCIA: Condición no reconocida
```

**Ejemplos Incorrectos:**
```javascript
// ❌ Usar operadores de programación
"variables_completas == true"
"titulo != null"
"productos.length > 0"

// ❌ Sintaxis incorrecta
"titulo is empty"
"variables_completas is true"
```

**Ejemplos Correctos:**
```javascript
// ✅ Usar operadores del sistema
"variables_completas equals true"
"titulo not exists"
"productos not_empty"
```

---

### Error 2: Variable No Existe

**Síntoma:**
```
❌ No encontrado en globalVariables
```

**Solución:**
```javascript
// Verificar que la variable existe
console.log('Variables disponibles:', Object.keys(globalVariables));

// Usar nombre exacto
"variables_completas equals true" // ✅ Correcto
"variablesCompletas equals true"  // ❌ Incorrecto
```

---

### Error 3: Comparación de Tipos

**Síntoma:** Condición no se cumple aunque los valores parezcan iguales

**Causa:** Comparación de string vs boolean

**Solución:**
```javascript
// El sistema normaliza a string automáticamente
"variables_completas equals true"  // ✅ Funciona con boolean
"cantidad equals 5"                // ✅ Funciona con number

// Comparación case-insensitive
"respuesta equals SI"   // ✅ Funciona con "si", "Si", "SI"
```

---

### Error 4: Ninguna Condición se Cumple

**Síntoma:** Flujo se detiene después del router

**Solución:** Agregar ruta por defecto sin condición

```json
{
  "source": "router-1",
  "target": "nodo-default",
  "data": {
    // Sin condition → Ruta por defecto
    "label": "🔄 Default"
  }
}
```

---

## 🎨 Mejores Prácticas

### 1. Nombres Descriptivos en Labels

```json
// ❌ Mal
{
  "condition": "variables_completas equals true",
  "label": "Ruta 1"
}

// ✅ Bien
{
  "condition": "variables_completas equals true",
  "label": "✅ Variables completas"
}
```

### 2. Orden de Condiciones

Evaluar de más específica a más general:

```javascript
// 1. Más específica
"titulo contains harry potter"

// 2. Menos específica
"titulo not_empty"

// 3. Ruta por defecto (sin condición)
```

### 3. Siempre Incluir Ruta por Defecto

```json
[
  { "condition": "estado equals confirmado", ... },
  { "condition": "estado equals pendiente", ... },
  { /* Sin condition = default */ }
]
```

### 4. Condiciones Simples

```javascript
// ✅ Bien (simple)
"variables_completas equals true"

// ❌ Evitar (complejo)
"variables_completas equals true AND titulo not_empty"
// Usar dos routers en secuencia
```

### 5. Case-Insensitive por Defecto

```javascript
// Todas estas son equivalentes:
"respuesta equals si"
"respuesta equals SI"
"respuesta equals Si"
// Todas evalúan true si respuesta = "sí", "SI", "Si", etc.
```

---

## 📊 Tabla de Referencia Rápida

| Operador | Sintaxis | Ejemplo | Descripción |
|----------|----------|---------|-------------|
| `exists` | `var exists` | `titulo exists` | Variable tiene valor |
| `not exists` | `var not exists` | `editorial not exists` | Variable no tiene valor |
| `empty` | `var empty` | `productos empty` | Variable está vacía |
| `not_empty` | `var not_empty` | `productos not_empty` | Variable tiene contenido |
| `equals` | `var equals valor` | `estado equals confirmado` | Igualdad exacta |
| `not equals` | `var not equals valor` | `estado not equals cancelado` | Desigualdad |
| `contains` | `var contains texto` | `titulo contains harry` | Contiene texto |
| `not contains` | `var not contains texto` | `titulo not contains agotado` | No contiene texto |

---

## 📚 Documentación Relacionada

- `NODO-ROUTER.md` - Nodo Router completo
- `NODO-GPT.md` - Nodos GPT
- `NODO-WOOCOMMERCE.md` - Integración WooCommerce
- `GUIA-DEBUG-FLUJO.md` - Debug de flujos

---

**Creado:** 2026-01-15  
**Última actualización:** 2026-01-15  
**Versión:** 1.0
