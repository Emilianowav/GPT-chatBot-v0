# Nodo Router - Documentación Completa

## 📋 Descripción General

El nodo Router permite dividir el flujo en múltiples caminos basándose en condiciones. Es el equivalente a un `if/else` o `switch` en programación, pero visual y configurable.

---

## 🎯 Propósito

**Evaluar condiciones y dirigir el flujo hacia diferentes rutas según el resultado.**

**Casos de uso:**
- ✅ Verificar si se completaron todas las variables
- ✅ Validar el estado de un pedido
- ✅ Dirigir según el tipo de producto
- ✅ Evaluar respuestas del usuario (Sí/No)

---

## 🔧 Configuración

### Estructura Básica

```json
{
  "id": "router-1",
  "type": "router",
  "data": {
    "label": "¿Variables completas?",
    "config": {
      "tipo": "router",
      "descripcion": "Evalúa si todas las variables están completas"
    }
  }
}
```

### Conexiones (Edges)

Cada conexión desde el router tiene una condición asociada:

```json
{
  "id": "edge-1",
  "source": "router-1",
  "target": "woocommerce-search",
  "data": {
    "condition": "variables_completas equals true"
  }
}
```

---

## 📊 Tipos de Condiciones

### 1. `exists` - Variable Existe

**Sintaxis:** `<variable> exists`

**Descripción:** Verifica que la variable exista y no sea null/undefined/vacío

**Ejemplos:**
```javascript
titulo exists                    // ✅ Si titulo tiene valor
variables_completas exists       // ✅ Si la variable existe
woocommerce.productos exists     // ✅ Si hay productos
```

**Evaluación:**
```javascript
const value = getVariableValue(varName);
const exists = value !== undefined && 
               value !== null && 
               value !== '' &&
               !(Array.isArray(value) && value.length === 0);
```

---

### 2. `not exists` - Variable No Existe

**Sintaxis:** `<variable> not exists`

**Descripción:** Verifica que la variable NO exista o sea null/undefined/vacío

**Ejemplos:**
```javascript
titulo not exists                // ✅ Si titulo no tiene valor
editorial not exists             // ✅ Si editorial está vacía
```

**Evaluación:**
```javascript
const value = getVariableValue(varName);
const notExists = value === undefined || 
                  value === null || 
                  value === '' ||
                  (Array.isArray(value) && value.length === 0);
```

---

### 3. `empty` - Variable Vacía

**Sintaxis:** `<variable> empty`

**Descripción:** Similar a `not exists`, verifica que esté vacía

**Ejemplos:**
```javascript
titulo empty                     // ✅ Si titulo está vacío
woocommerce.productos empty      // ✅ Si no hay productos
```

---

### 4. `not_empty` - Variable No Vacía

**Sintaxis:** `<variable> not_empty`

**Descripción:** Verifica que la variable tenga contenido

**Ejemplos:**
```javascript
titulo not_empty                 // ✅ Si titulo tiene valor
woocommerce.productos not_empty  // ✅ Si hay productos
```

**Evaluación:**
```javascript
const value = getVariableValue(varName);
const notEmpty = value !== undefined && 
                 value !== null && 
                 value !== '' &&
                 !(Array.isArray(value) && value.length === 0);
```

---

### 5. `equals` - Igualdad

**Sintaxis:** `<variable> equals <valor>`

**Descripción:** Compara el valor de la variable con un valor esperado (case-insensitive)

**Ejemplos:**
```javascript
variables_completas equals true
tipo_producto equals "libro"
estado equals "confirmado"
respuesta equals "si"
```

**Evaluación:**
```javascript
const actualValue = getVariableValue(varName);
const normalizedActual = String(actualValue).toLowerCase().trim();
const normalizedExpected = expectedValue.toLowerCase().trim();

return normalizedActual === normalizedExpected;
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

---

### 7. `contains` - Contiene

**Sintaxis:** `<variable> contains <texto>`

**Descripción:** Verifica que la variable contenga un texto específico (case-insensitive)

**Ejemplos:**
```javascript
titulo contains "harry potter"
mensaje contains "ayuda"
categoria contains "infantil"
```

**Evaluación:**
```javascript
const actualValue = getVariableValue(varName);
const normalizedActual = String(actualValue).toLowerCase().trim();
const normalizedSearch = searchValue.toLowerCase().trim();

return normalizedActual.includes(normalizedSearch);
```

---

### 8. `not contains` - No Contiene

**Sintaxis:** `<variable> not contains <texto>`

**Descripción:** Verifica que la variable NO contenga un texto específico

**Ejemplos:**
```javascript
titulo not contains "agotado"
mensaje not contains "cancelar"
```

---

## 🎯 Ejemplos de Uso

### Ejemplo 1: Verificar Variables Completas

**Escenario:** Después del formateador, verificar si se recopilaron todas las variables

**Router:**
```json
{
  "id": "router-variables",
  "data": {
    "label": "¿Variables completas?",
    "config": {
      "tipo": "router"
    }
  }
}
```

**Conexiones:**

```javascript
// Ruta 1: Variables completas → Buscar en WooCommerce
{
  "source": "router-variables",
  "target": "woocommerce-search",
  "data": {
    "condition": "variables_completas equals true"
  }
}

// Ruta 2: Variables incompletas → Pedir más datos
{
  "source": "router-variables",
  "target": "gpt-pedir-datos",
  "data": {
    "condition": "variables_completas equals false"
  }
}
```

**Logs:**
```
🔀 [ROUTER] Evaluando condiciones...
   📋 Condición 1: "variables_completas equals true"
      → variables_completas = true
      ✅ Condición cumplida
   
   🎯 Ruta seleccionada: woocommerce-search
```

---

### Ejemplo 2: Verificar Productos Encontrados

**Escenario:** Después de buscar en WooCommerce, verificar si se encontraron productos

**Router:**
```json
{
  "id": "router-productos",
  "data": {
    "label": "¿Productos encontrados?",
    "config": {
      "tipo": "router"
    }
  }
}
```

**Conexiones:**

```javascript
// Ruta 1: Productos encontrados → Presentar productos
{
  "source": "router-productos",
  "target": "gpt-asistente",
  "data": {
    "condition": "woocommerce.productos not_empty"
  }
}

// Ruta 2: No hay productos → Mensaje de disculpa
{
  "source": "router-productos",
  "target": "whatsapp-no-encontrado",
  "data": {
    "condition": "woocommerce.productos empty"
  }
}
```

---

### Ejemplo 3: Evaluar Respuesta del Usuario

**Escenario:** Usuario responde Sí/No a una pregunta

**Router:**
```json
{
  "id": "router-confirmacion",
  "data": {
    "label": "¿Usuario confirma?",
    "config": {
      "tipo": "router"
    }
  }
}
```

**Conexiones:**

```javascript
// Ruta 1: Usuario confirma
{
  "source": "router-confirmacion",
  "target": "crear-pedido",
  "data": {
    "condition": "respuesta contains si"
  }
}

// Ruta 2: Usuario cancela
{
  "source": "router-confirmacion",
  "target": "cancelar-pedido",
  "data": {
    "condition": "respuesta contains no"
  }
}
```

---

### Ejemplo 4: Múltiples Condiciones (Tipo de Producto)

**Escenario:** Dirigir según el tipo de producto

**Router:**
```json
{
  "id": "router-tipo-producto",
  "data": {
    "label": "Tipo de producto",
    "config": {
      "tipo": "router"
    }
  }
}
```

**Conexiones:**

```javascript
// Ruta 1: Libros
{
  "source": "router-tipo-producto",
  "target": "proceso-libros",
  "data": {
    "condition": "categoria contains libro"
  }
}

// Ruta 2: Útiles escolares
{
  "source": "router-tipo-producto",
  "target": "proceso-utiles",
  "data": {
    "condition": "categoria contains util"
  }
}

// Ruta 3: Otros
{
  "source": "router-tipo-producto",
  "target": "proceso-general",
  "data": {
    "condition": "categoria not contains libro"
  }
}
```

---

## 🔄 Proceso de Evaluación

### 1. Obtener Edges del Router

```javascript
const edgesFromRouter = edges.filter(edge => edge.source === routerId);
console.log(`🔀 [ROUTER] ${edgesFromRouter.length} ruta(s) posible(s)`);
```

### 2. Evaluar Cada Condición

```javascript
for (const edge of edgesFromRouter) {
  const condition = edge.data?.condition;
  
  if (!condition) {
    console.log(`   ⚠️  Ruta sin condición → Se ejecuta por defecto`);
    return edge.target;
  }
  
  const result = evaluateCondition(condition);
  
  if (result) {
    console.log(`   ✅ Condición cumplida: "${condition}"`);
    return edge.target;
  } else {
    console.log(`   ❌ Condición no cumplida: "${condition}"`);
  }
}
```

### 3. Ruta por Defecto

Si ninguna condición se cumple, se puede configurar una ruta por defecto (sin condición):

```javascript
// Ruta sin condición = ruta por defecto
{
  "source": "router-1",
  "target": "nodo-default",
  "data": {
    // Sin condition
  }
}
```

---

## 🐛 Debug y Logs

### Logs Detallados

```
🔀 [ROUTER] router-variables: Evaluando condiciones...
   📋 3 ruta(s) posible(s)
   
   🔍 Evaluando ruta 1: woocommerce-search
      Condición: "variables_completas equals true"
      → Detectado 'equals' para variable: "variables_completas"
      🔎 [getVariableValue] Buscando: "variables_completas"
         ✅ Encontrado en globalVariables: true
      → Valor actual: "true"
      → Valor esperado: "true"
      ✅ Condición cumplida
   
   🎯 Ruta seleccionada: woocommerce-search
   ✅ Siguiente nodo: woocommerce-search
```

### Verificación de Variables

```
🔍 VERIFICACIÓN DE VARIABLES CRÍTICAS:
   titulo exists: true
   titulo value: "Harry Potter y la Cámara Secreta"
   editorial exists: false
   editorial value: null
   variables_completas exists: true
   variables_completas value: false
   Total variables: 5
```

---

## ⚠️ Errores Comunes

### Error 1: Condición Mal Escrita

**Síntoma:**
```
⚠️ ADVERTENCIA: Condición no reconocida, evaluando como booleano genérico
```

**Causa:** Sintaxis incorrecta

**Ejemplos:**
```javascript
// ❌ Incorrecto
"variables_completas == true"      // Usar 'equals', no '=='
"titulo is empty"                  // Usar 'empty', no 'is empty'
"productos.length > 0"             // Usar 'not_empty'

// ✅ Correcto
"variables_completas equals true"
"titulo empty"
"productos not_empty"
```

---

### Error 2: Variable No Existe

**Síntoma:**
```
❌ No encontrado en globalVariables
📋 globalVariables actuales: ["titulo", "editorial"]
```

**Causa:** Variable no fue guardada o nombre incorrecto

**Solución:**
```javascript
// Verificar nombre exacto de la variable
console.log('Variables disponibles:', Object.keys(globalVariables));

// Usar el nombre correcto
"variables_completas equals true"  // ✅ Correcto
"variablesCompletas equals true"   // ❌ Incorrecto (camelCase)
```

---

### Error 3: Ninguna Condición se Cumple

**Síntoma:** El flujo se detiene después del router

**Causa:** Todas las condiciones son falsas y no hay ruta por defecto

**Solución:** Agregar una ruta sin condición como fallback:

```javascript
// Ruta por defecto (sin condición)
{
  "source": "router-1",
  "target": "nodo-error",
  "data": {
    // Sin condition → Se ejecuta si ninguna otra se cumple
  }
}
```

---

### Error 4: Comparación Case-Sensitive

**Síntoma:** Condición no se cumple aunque los valores parezcan iguales

**Causa:** Las comparaciones son case-insensitive, pero hay espacios extra

**Solución:**
```javascript
// El sistema normaliza automáticamente:
"SI" === "si"     // ✅ true
"Si " === "si"    // ✅ true (trim automático)
"  si  " === "si" // ✅ true
```

---

## 🎨 Mejores Prácticas

### 1. Nombres Descriptivos

```javascript
// ❌ Mal
{
  "id": "router-1",
  "data": { "label": "Router" }
}

// ✅ Bien
{
  "id": "router-variables",
  "data": { "label": "¿Variables completas?" }
}
```

### 2. Orden de Condiciones

Evaluar condiciones de más específica a más general:

```javascript
// 1. Más específica
"titulo contains harry potter"

// 2. Menos específica
"titulo not_empty"

// 3. Ruta por defecto
// (sin condición)
```

### 3. Ruta por Defecto

Siempre incluir una ruta sin condición como fallback:

```javascript
// Última ruta: sin condición
{
  "source": "router-1",
  "target": "nodo-default",
  "data": {}
}
```

### 4. Condiciones Simples

Preferir condiciones simples y claras:

```javascript
// ✅ Bien
"variables_completas equals true"

// ❌ Evitar (complejo)
"variables_completas equals true AND titulo not_empty"
// (Usar dos routers en secuencia)
```

---

## 📊 Comparación con Código

### Router Visual vs Código

**Router Visual:**
```
[Formateador] → [Router: ¿Variables completas?]
                    ├─ [SI] → [WooCommerce]
                    └─ [NO] → [Pedir Datos]
```

**Equivalente en Código:**
```javascript
if (variables_completas === true) {
  // Ir a WooCommerce
  executeNode('woocommerce-search');
} else {
  // Pedir más datos
  executeNode('gpt-pedir-datos');
}
```

---

## 📚 Documentación Relacionada

- `NODO-GPT.md` - Nodos GPT (formateador, conversacional)
- `NODO-WOOCOMMERCE.md` - Integración con WooCommerce
- `CONDICIONALES.md` - Condiciones en conexiones
- `GUIA-DEBUG-FLUJO.md` - Debug de flujos

---

**Creado:** 2026-01-15  
**Última actualización:** 2026-01-15  
**Versión:** 1.0
