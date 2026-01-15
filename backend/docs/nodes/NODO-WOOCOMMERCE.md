# Nodo WooCommerce - Documentación Completa

## 📋 Descripción General

El nodo WooCommerce permite integrar tu tienda WooCommerce con el flujo conversacional. Soporta búsqueda de productos, obtención de detalles, gestión de carritos y más.

---

## 🎯 Módulos Disponibles

### 1. `search-product` - Búsqueda de Productos

**Propósito:** Buscar productos en WooCommerce por término de búsqueda.

**Características:**
- ✅ Búsqueda simple (un producto)
- ✅ Búsqueda múltiple (varios productos separados por `" | "`)
- ✅ Normalización automática de términos
- ✅ Búsquedas paralelas para mejor performance

**Configuración:**

```json
{
  "id": "woocommerce-search",
  "type": "woocommerce",
  "data": {
    "label": "Buscar Productos",
    "config": {
      "module": "search-product",
      "connectionId": "woocommerce-veo-veo",
      "params": {
        "search": "{{titulo}}",
        "per_page": 10,
        "status": "publish"
      },
      "productFieldMappings": {
        "titulo": "name",
        "precio": "price",
        "stock": "stock_status",
        "url": "permalink"
      }
    }
  }
}
```

**Parámetros:**

| Parámetro | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `search` | string | Término de búsqueda | `"{{titulo}}"` |
| `per_page` | number | Productos por página | `10` |
| `status` | string | Estado del producto | `"publish"` |
| `category` | string | ID de categoría | `"15"` |
| `tag` | string | ID de etiqueta | `"23"` |

**Búsqueda Simple:**

```javascript
// Input
params.search = "Harry Potter"

// WooCommerce API
GET /products?search=Harry Potter&per_page=10

// Output
{
  "productos": [
    {
      "id": 123,
      "name": "Harry Potter y la Piedra Filosofal",
      "price": "25000",
      "stock_status": "instock",
      "permalink": "https://tienda.com/producto/harry-potter-1"
    }
  ]
}
```

**Búsqueda Múltiple:**

```javascript
// Input (detecta " | ")
params.search = "Harry Potter y la Cámara Secreta | Harry Potter y la Orden del Fénix"

// Sistema detecta búsqueda múltiple
console.log('🔍 BÚSQUEDA MÚLTIPLE detectada');
console.log('📚 Buscando 2 libro(s)');

// Búsquedas paralelas
await Promise.all([
  wooService.searchProducts({ search: "Harry Potter y la Cámara Secreta" }),
  wooService.searchProducts({ search: "Harry Potter y la Orden del Fénix" })
]);

// Output combinado (sin duplicados)
{
  "productos": [
    { "id": 124, "name": "Harry Potter y la Cámara Secreta", ... },
    { "id": 127, "name": "Harry Potter y la Orden del Fénix", ... }
  ]
}
```

**Normalización Automática:**

```javascript
// Entrada: "Harry Potter 5"
// Normalizado: "Harry Potter" (elimina números al final)

const searchNormalized = params.search
  .replace(/\s*\d+\s*$/, '')  // Eliminar números al final
  .replace(/\s+/g, ' ')        // Normalizar espacios
  .trim();

console.log('🔍 Búsqueda original: "Harry Potter 5"');
console.log('🔍 Búsqueda normalizada: "Harry Potter"');
```

**Logs:**

```
📦 [WOOCOMMERCE] Ejecutando módulo: search-product
   🔗 Usando conexión: woocommerce-veo-veo
   📦 Parámetros: {"search":"Harry Potter","per_page":10}
   
🔍 BÚSQUEDA MÚLTIPLE detectada
📚 Buscando 2 libro(s): Harry Potter y la Cámara Secreta, Harry Potter y la Orden del Fénix

🔍 Buscando: "Harry Potter y la Cámara Secreta" → "Harry Potter"
   ✅ 1 producto(s) encontrado(s)
   
🔍 Buscando: "Harry Potter y la Orden del Fénix" → "Harry Potter"
   ✅ 7 producto(s) encontrado(s)
   
✅ Total productos únicos: 7
```

---

### 2. `get-product` - Obtener Producto por ID

**Propósito:** Obtener detalles completos de un producto específico.

**Configuración:**

```json
{
  "config": {
    "module": "get-product",
    "params": {
      "productId": "{{producto_id}}"
    }
  }
}
```

**Ejemplo:**

```javascript
// Input
params.productId = 123

// WooCommerce API
GET /products/123

// Output
{
  "producto": {
    "id": 123,
    "name": "Harry Potter y la Piedra Filosofal",
    "price": "25000",
    "regular_price": "30000",
    "sale_price": "25000",
    "stock_status": "instock",
    "stock_quantity": 15,
    "description": "...",
    "short_description": "...",
    "images": [...],
    "categories": [...],
    "tags": [...]
  }
}
```

---

### 3. `list-products` - Listar Productos

**Propósito:** Obtener lista de productos con filtros.

**Configuración:**

```json
{
  "config": {
    "module": "list-products",
    "params": {
      "per_page": 20,
      "page": 1,
      "category": "15",
      "orderby": "popularity",
      "order": "desc"
    }
  }
}
```

**Parámetros:**

| Parámetro | Descripción | Valores |
|-----------|-------------|---------|
| `per_page` | Productos por página | `1-100` |
| `page` | Número de página | `1, 2, 3...` |
| `category` | ID de categoría | `"15"` |
| `tag` | ID de etiqueta | `"23"` |
| `orderby` | Ordenar por | `date`, `popularity`, `price` |
| `order` | Orden | `asc`, `desc` |
| `status` | Estado | `publish`, `draft` |
| `featured` | Solo destacados | `true`, `false` |
| `on_sale` | Solo en oferta | `true`, `false` |

---

### 4. `get-categories` - Obtener Categorías

**Propósito:** Listar categorías de productos.

**Configuración:**

```json
{
  "config": {
    "module": "get-categories",
    "params": {
      "per_page": 50,
      "hide_empty": true
    }
  }
}
```

**Output:**

```json
{
  "categorias": [
    {
      "id": 15,
      "name": "Libros",
      "slug": "libros",
      "count": 245
    },
    {
      "id": 16,
      "name": "Útiles Escolares",
      "slug": "utiles-escolares",
      "count": 89
    }
  ]
}
```

---

## 🔧 Configuración de Conexión

### Crear Conexión WooCommerce

La conexión se configura en la colección `api_configurations`:

```json
{
  "_id": ObjectId("..."),
  "empresaId": "5493794732177",
  "tipo": "woocommerce",
  "nombre": "WooCommerce Veo Veo",
  "config": {
    "eshopUrl": "https://www.veoveolibros.com.ar",
    "consumerKey": "ck_...",
    "consumerSecret": "cs_...",
    "version": "wc/v3"
  },
  "activo": true
}
```

### Usar Conexión en Nodo

```json
{
  "config": {
    "connectionId": "woocommerce-veo-veo",
    // o
    "connection": {
      "eshopUrl": "https://www.veoveolibros.com.ar",
      "consumerKey": "ck_...",
      "consumerSecret": "cs_..."
    }
  }
}
```

---

## 📊 Simplificación de Productos para GPT

### Problema: Productos Muy Grandes

Los productos de WooCommerce tienen muchos campos que consumen tokens:

```json
{
  "id": 123,
  "name": "...",
  "description": "...", // ❌ Muy largo
  "short_description": "...", // ❌ Muy largo
  "images": [...], // ❌ Muchas imágenes
  "attributes": [...], // ❌ Muchos atributos
  "meta_data": [...] // ❌ Metadata innecesaria
}
```

### Solución: Simplificación Automática

El sistema simplifica automáticamente los productos antes de pasarlos a GPT:

```javascript
const productosSimplificados = this.simplifyProductsForGPT(
  productos,
  config.productFieldMappings,
  connection.eshopUrl
);
```

**Producto Simplificado:**

```json
{
  "titulo": "Harry Potter y la Piedra Filosofal",
  "precio": "$25.000",
  "stock": "Disponible",
  "url": "https://www.veoveolibros.com.ar/producto/harry-potter-1",
  "image": "https://www.veoveolibros.com.ar/wp-content/uploads/harry-potter-1.jpg",
  "sku": "HP-001",
  "categories": ["Libros", "Infantil"],
  "on_sale": false
}
```

### Configurar Mapeo de Campos

```json
{
  "productFieldMappings": {
    "titulo": "name",
    "precio": "price",
    "stock": "stock_status",
    "url": "permalink",
    "imagen": "images[0].src",
    "sku": "sku",
    "categorias": "categories",
    "en_oferta": "on_sale"
  }
}
```

---

## 🔗 Construcción de URLs Completas

### Problema: URLs Incompletas

WooCommerce a veces devuelve URLs relativas o incompletas:

```json
{
  "permalink": "/producto/harry-potter-1" // ❌ Incompleta
}
```

### Solución: URLs Completas Automáticas

El sistema construye URLs completas automáticamente:

```javascript
// Si la URL no tiene protocolo, agregar baseUrl
if (!url.startsWith('http')) {
  url = `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

// Resultado
"https://www.veoveolibros.com.ar/producto/harry-potter-1" // ✅ Completa
```

---

## 🎯 Casos de Uso

### Caso 1: Búsqueda Simple

**Flujo:**
```
[Formateador] → extrae: titulo = "Harry Potter"
[Router] → variables_completas = true
[WooCommerce] → busca "Harry Potter"
[GPT Asistente] → presenta productos
```

**Configuración WooCommerce:**
```json
{
  "module": "search-product",
  "params": {
    "search": "{{titulo}}"
  }
}
```

---

### Caso 2: Búsqueda Múltiple

**Flujo:**
```
Usuario: "Busco harry potter 2 y 5"
[Formateador] → extrae: titulo = "Harry Potter y la Cámara Secreta | Harry Potter y la Orden del Fénix"
[WooCommerce] → detecta " | " → busca ambos en paralelo
[GPT Asistente] → presenta ambos productos
```

**Logs:**
```
🔍 BÚSQUEDA MÚLTIPLE detectada
📚 Buscando 2 libro(s)
✅ Total productos únicos: 2
```

---

### Caso 3: Filtrar por Categoría

**Configuración:**
```json
{
  "module": "search-product",
  "params": {
    "search": "{{titulo}}",
    "category": "15" // Categoría "Libros"
  }
}
```

---

### Caso 4: Solo Productos en Stock

**Configuración:**
```json
{
  "module": "search-product",
  "params": {
    "search": "{{titulo}}",
    "stock_status": "instock"
  }
}
```

---

## 🐛 Debug y Logs

### Logs Completos

```
📦 [WOOCOMMERCE] Ejecutando módulo: search-product
   🔗 Usando conexión del nodo fuente
   📦 Parámetros: {"search":"Harry Potter | El Principito","per_page":10}
   
🔍 BÚSQUEDA MÚLTIPLE detectada
📚 Buscando 2 libro(s): Harry Potter, El Principito

🔍 Buscando: "Harry Potter" → "Harry Potter"
   ✅ 7 producto(s) encontrado(s)
   
🔍 Buscando: "El Principito" → "El Principito"
   ✅ 3 producto(s) encontrado(s)
   
✅ Total productos únicos: 10

📦 [SIMPLIFICACIÓN] Simplificando 10 productos para GPT...
   ✅ Producto 1: Harry Potter y la Piedra Filosofal
      - titulo: "Harry Potter y la Piedra Filosofal"
      - precio: "$25.000"
      - stock: "Disponible"
      - url: "https://www.veoveolibros.com.ar/producto/harry-potter-1"
   
   ✅ Producto 2: Harry Potter y la Cámara Secreta
      - titulo: "Harry Potter y la Cámara Secreta"
      - precio: "$25.000"
      - stock: "Disponible"
      - url: "https://www.veoveolibros.com.ar/producto/harry-potter-2"
   
   [... más productos ...]
   
✅ Productos simplificados: 10
💾 Guardado en variable global: woocommerce.productos
```

---

## ⚠️ Errores Comunes

### Error 1: No se Encuentran Productos

**Síntoma:**
```
⚠️ ADVERTENCIA: No se encontraron productos para "Harry Potter 5"
```

**Causas:**
1. Término de búsqueda no coincide con productos
2. Productos no están publicados
3. Categoría incorrecta

**Solución:**
```javascript
// Verificar en WooCommerce
1. Producto existe y está publicado
2. Nombre del producto coincide con búsqueda
3. No hay filtros que excluyan el producto

// Probar búsqueda directa
GET https://tienda.com/wp-json/wc/v3/products?search=Harry Potter
```

---

### Error 2: URLs Incompletas

**Síntoma:**
```
Bot: "🔗 /producto/harry-potter-1" // ❌ URL incompleta
```

**Causa:** `baseUrl` no configurado en conexión

**Solución:**
```json
{
  "config": {
    "eshopUrl": "https://www.veoveolibros.com.ar" // ✅ Agregar baseUrl
  }
}
```

---

### Error 3: Búsqueda Múltiple No Funciona

**Síntoma:** Solo encuentra un producto cuando usuario pide varios

**Causa:** Formateador no extrae múltiples items con separador `" | "`

**Solución:**
```javascript
// Formateador debe extraer así:
{
  "titulo": "Producto 1 | Producto 2 | Producto 3"
}

// NO así:
{
  "titulo": "Producto 1, Producto 2, Producto 3" // ❌ Coma
}
```

---

### Error 4: Demasiados Tokens

**Síntoma:** Error de límite de tokens en GPT

**Causa:** Productos muy grandes sin simplificar

**Solución:**
```json
{
  "productFieldMappings": {
    "titulo": "name",
    "precio": "price",
    "stock": "stock_status",
    "url": "permalink"
    // ✅ Solo campos esenciales
  }
}
```

---

## 🎨 Mejores Prácticas

### 1. Simplificar Productos

Solo incluir campos necesarios para GPT:

```json
{
  "productFieldMappings": {
    "titulo": "name",
    "precio": "price",
    "stock": "stock_status",
    "url": "permalink"
  }
}
```

### 2. Limitar Resultados

```json
{
  "params": {
    "per_page": 10 // ✅ Máximo 10 productos
  }
}
```

### 3. Filtrar por Stock

```json
{
  "params": {
    "stock_status": "instock" // ✅ Solo productos disponibles
  }
}
```

### 4. Normalizar Búsquedas

El sistema normaliza automáticamente:
- `"Harry Potter 5"` → `"Harry Potter"`
- `"  libro  "` → `"libro"`

### 5. Usar Búsqueda Múltiple

Para mejor experiencia de usuario:
```
Usuario: "Busco libro 1, libro 2 y libro 3"
→ Formateador: "Libro 1 | Libro 2 | Libro 3"
→ WooCommerce: Busca los 3 en paralelo
```

---

## 📚 Documentación Relacionada

- `NODO-GPT.md` - Nodos GPT (formateador, conversacional)
- `NODO-ROUTER.md` - Enrutamiento condicional
- `CONDICIONALES.md` - Condiciones en conexiones
- `GUIA-DEBUG-FLUJO.md` - Debug de flujos

---

**Creado:** 2026-01-15  
**Última actualización:** 2026-01-15  
**Versión:** 1.0
