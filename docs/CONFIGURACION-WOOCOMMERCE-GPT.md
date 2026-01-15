# Configuración WooCommerce + GPT - Variables Simplificadas

## 📋 Resumen

El sistema ahora permite configurar qué campos de WooCommerce se envían al GPT Asistente, reduciendo el uso de tokens de ~9000 a ~500 tokens por búsqueda.

---

## 🎯 Configuración por Defecto

Si **NO** se configura `productFieldMappings`, el sistema usa estos campos automáticamente:

```json
{
  "titulo": "HARRY POTTER Y LA ORDEN DEL FENIX",
  "precio": "49000",
  "url": "https://www.veoveolibros.com.ar/producto/harry-potter-5",
  "stock": "Disponible"
}
```

---

## 🔧 Configuración Personalizada desde el Frontend

### Nodo WooCommerce

Agregar el campo `productFieldMappings` en la configuración del nodo:

```json
{
  "type": "woocommerce",
  "data": {
    "config": {
      "apiConfigId": "695320fda03785dacc8d950b",
      "module": "search-product",
      "params": {
        "search": "{{titulo}}",
        "per_page": "10"
      },
      "productFieldMappings": [
        { "source": "name", "target": "titulo" },
        { "source": "price", "target": "precio" },
        { "source": "permalink", "target": "url" },
        { "source": "sku", "target": "codigo" }
      ]
    }
  }
}
```

---

## 📊 Campos Disponibles de WooCommerce

### Campos Estándar

| Campo | Descripción | Tipo | Ejemplo |
|-------|-------------|------|---------|
| `name` | Nombre del producto | string | "HARRY POTTER Y LA ORDEN DEL FENIX" |
| `price` | Precio actual | string | "49000" |
| `regular_price` | Precio regular | string | "55000" |
| `sale_price` | Precio en oferta | string | "49000" |
| `permalink` | URL del producto | string | "https://..." |
| `stock_status` | Estado del stock | string | "instock" / "outofstock" |
| `stock_quantity` | Cantidad en stock | number | 5 |
| `sku` | Código SKU | string | "9789878000138" |
| `image` | URL de la imagen | string | "https://..." |

### Campos Complejos

| Campo | Descripción | Tipo |
|-------|-------------|------|
| `categories` | Categorías del producto | Array<{id, name}> |
| `on_sale` | Si está en oferta | boolean |

---

## 🎨 Implementación en el Frontend

### 1. Agregar Select Múltiple en la Configuración del Nodo

```tsx
// Componente de configuración del nodo WooCommerce
const WooCommerceNodeConfig = () => {
  const [selectedFields, setSelectedFields] = useState([
    'name',
    'price',
    'permalink'
  ]);

  const availableFields = [
    { value: 'name', label: 'Nombre del producto', default: 'titulo' },
    { value: 'price', label: 'Precio', default: 'precio' },
    { value: 'regular_price', label: 'Precio regular', default: 'precio_regular' },
    { value: 'sale_price', label: 'Precio oferta', default: 'precio_oferta' },
    { value: 'permalink', label: 'URL del producto', default: 'url' },
    { value: 'stock_status', label: 'Estado de stock', default: 'stock' },
    { value: 'stock_quantity', label: 'Cantidad en stock', default: 'cantidad' },
    { value: 'sku', label: 'Código SKU', default: 'codigo' },
    { value: 'image', label: 'Imagen', default: 'imagen' }
  ];

  const handleSave = () => {
    const mappings = selectedFields.map(field => {
      const fieldConfig = availableFields.find(f => f.value === field);
      return {
        source: field,
        target: fieldConfig.default
      };
    });

    // Guardar en la configuración del nodo
    updateNodeConfig({
      ...nodeConfig,
      productFieldMappings: mappings
    });
  };

  return (
    <div>
      <h3>Campos para GPT</h3>
      <p>Selecciona qué información del producto enviar al GPT:</p>
      
      <MultiSelect
        options={availableFields}
        value={selectedFields}
        onChange={setSelectedFields}
        placeholder="Seleccionar campos..."
      />
      
      <button onClick={handleSave}>Guardar</button>
    </div>
  );
};
```

### 2. Guardar en MongoDB

El frontend debe guardar la configuración en este formato:

```json
{
  "nodes": [
    {
      "id": "woocommerce",
      "type": "woocommerce",
      "data": {
        "config": {
          "productFieldMappings": [
            { "source": "name", "target": "titulo" },
            { "source": "price", "target": "precio" },
            { "source": "permalink", "target": "url" }
          ]
        }
      }
    }
  ]
}
```

---

## 🤖 Configuración del GPT Asistente

El prompt del GPT debe usar las variables simplificadas:

```
Eres un asistente de ventas profesional para una librería.

PRODUCTOS DISPONIBLES:
{{woocommerce.productos}}

INSTRUCCIONES:
1. Presenta los productos de manera clara y atractiva
2. Cada producto tiene: titulo, precio, url, stock
3. Muestra máximo 5 productos para no saturar al cliente
4. Incluye el precio en formato argentino (ej: $25.000)
5. Indica si hay stock disponible
6. Proporciona el link directo al catálogo (url)
7. Sé amable y profesional

FORMATO DE RESPUESTA:
📚 *[Título del libro]*
💰 Precio: $[precio]
📦 Stock: [Disponible/Sin stock]
🔗 Ver en catálogo: [url]

IMPORTANTE:
- NO inventes productos que no están en la lista
- Si no hay productos, informa que no se encontraron resultados
- Ofrece ayuda para buscar con otros términos
```

---

## 📈 Comparación de Tokens

### Antes (con todos los campos)

```json
{
  "id": 2084,
  "name": "HARRY POTTER Y LA ORDEN DEL FENIX",
  "slug": "harry-potter-y-la-orden-del-fenix",
  "price": "49000",
  "regular_price": "55000",
  "sale_price": "",
  "stock_quantity": 1,
  "stock_status": "instock",
  "categories": [...],
  "images": [
    {
      "id": 2087,
      "src": "https://...",
      "srcset": "//www.veoveolibros.com.ar/wp-content/uploads/harry_potter_y_la_orden_del_fenix_1.jpg 2028w, //www.veoveolibros.com.ar/wp-content/uploads/harry_potter_y_la_orden_del_fenix_1-100x100.jpg 100w, ...",
      "sizes": "(max-width: 2028px) 100vw, 2028px"
    }
  ],
  "description": "",
  "short_description": "",
  "sku": "9789878000138"
}
```

**Tokens:** ~1300 tokens por producto × 7 productos = **~9100 tokens** ❌

### Después (solo campos esenciales)

```json
{
  "titulo": "HARRY POTTER Y LA ORDEN DEL FENIX",
  "precio": "49000",
  "url": "https://www.veoveolibros.com.ar/producto/harry-potter-5",
  "stock": "Disponible"
}
```

**Tokens:** ~70 tokens por producto × 7 productos = **~500 tokens** ✅

**Reducción:** 94% menos tokens

---

## ✅ Ventajas

1. **Reducción masiva de tokens:** De 9000 a 500 tokens
2. **Configurable desde el frontend:** Sin tocar código backend
3. **Estándar para todos los WooCommerce:** Mismos campos disponibles
4. **Flexible:** Permite agregar/quitar campos según necesidad
5. **Mejor UX:** Respuestas más rápidas y económicas

---

## 🔄 Flujo Completo

```
Usuario: "Busco harry potter"
  ↓
GPT Formateador: Extrae {"titulo": "harry potter"}
  ↓
Router: variables_completas = true → WooCommerce
  ↓
WooCommerce: Busca productos con search="harry potter"
  ↓
Backend: Simplifica productos (solo titulo, precio, url, stock)
  ↓
GPT Asistente: Presenta productos con formato profesional
  ↓
WhatsApp: Envía mensaje al usuario
  ↓
Flujo termina (espera respuesta del usuario)
```

---

## 📝 Notas para Desarrollo

1. El campo `productFieldMappings` es **opcional**
2. Si no se configura, usa los 4 campos por defecto
3. El backend valida que los campos existan en el producto
4. Si un campo no existe, se omite del resultado
5. Los productos completos se guardan en `woocommerce.productos_completos` por si se necesitan

---

## 🚀 Próximos Pasos

1. Implementar el select múltiple en el frontend
2. Permitir personalizar los nombres de los campos (`target`)
3. Agregar previsualización de cómo se verá el mensaje
4. Guardar configuraciones predefinidas (ej: "Mínimo", "Completo", "Con imágenes")
