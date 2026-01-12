# Configuración de Output Mapping para Nodos de API

## Descripción

El sistema de **Output Mapping** permite configurar desde el frontend qué campos extraer de las respuestas de APIs externas (como WooCommerce) y cómo renombrarlos.

## Estructura de Configuración

```typescript
{
  type: 'woocommerce',
  config: {
    apiConfigId: '695320fda03785dacc8d950b',
    endpointId: 'buscar-productos',
    parametros: {
      search: '{{titulo}}',
      per_page: '100'
    },
    // Output Mapping (OPCIONAL)
    outputMapping: {
      enabled: true,  // Si false, devuelve todos los campos normalizados
      fields: [
        { source: 'id', target: 'producto_id' },
        { source: 'name', target: 'nombre' },
        { source: 'price', target: 'precio' },
        { source: 'stock_status', target: 'stock' },
        { source: 'permalink', target: 'link' }
      ]
    }
  }
}
```

## Campos Disponibles de WooCommerce (Normalizados)

Después de la normalización automática, estos son los campos disponibles:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | number | ID del producto |
| `name` | string | Nombre del producto |
| `price` | string | Precio actual |
| `regular_price` | string | Precio regular |
| `sale_price` | string | Precio de oferta |
| `stock_status` | string | Estado del stock: "instock" o "outofstock" |
| `stock_quantity` | number | Cantidad en stock |
| `permalink` | string | URL del producto |
| `image` | string | URL de la imagen |
| `sku` | string | SKU del producto |
| `categories` | array | Categorías del producto |
| `on_sale` | boolean | Si está en oferta |

## Ejemplo de Uso

### Sin Output Mapping (todos los campos)
```json
[
  {
    "id": 2877,
    "name": "LA SOLEDAD",
    "price": "39900",
    "regular_price": "49875",
    "sale_price": "",
    "stock_status": "instock",
    "stock_quantity": 8,
    "permalink": "https://www.veoveolibros.com.ar/la-soledad/",
    "image": "https://...",
    "sku": "61110005",
    "categories": [...],
    "on_sale": false
  }
]
```

### Con Output Mapping (solo campos seleccionados)
```json
[
  {
    "producto_id": 2877,
    "nombre": "LA SOLEDAD",
    "precio": "39900",
    "stock": "instock",
    "link": "https://www.veoveolibros.com.ar/la-soledad/"
  }
]
```

## Implementación en el Frontend

El frontend debe permitir:
1. Activar/desactivar el output mapping
2. Seleccionar qué campos extraer (checkboxes)
3. Renombrar campos (input para el target)

## Notas

- Si `outputMapping.enabled = false` o no existe, se devuelven todos los campos normalizados
- Los campos no mapeados se omiten de la respuesta
- El mapeo se aplica DESPUÉS de la normalización automática de WooCommerce
