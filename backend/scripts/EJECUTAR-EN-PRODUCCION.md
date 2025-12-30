# Script para ejecutar en producción

El problema es que `useQueryString` no está configurado en la BD de producción.

## Opción 1: Ejecutar script localmente conectado a producción

1. Asegurate que `.env` tenga el `MONGODB_URI` de producción
2. Ejecutá:
```bash
node scripts/fix-auth-woocommerce-querystring.js
```

## Opción 2: Actualizar directamente en MongoDB Atlas

Conectate a MongoDB Atlas y ejecutá este comando en la colección `api_configurations`:

```javascript
db.api_configurations.updateOne(
  { nombre: /veo veo/i },
  { 
    $set: { 
      'autenticacion.configuracion.useQueryString': true,
      updatedAt: new Date()
    } 
  }
)
```

## Opción 3: Usar MongoDB Compass

1. Abrí MongoDB Compass
2. Conectate a la BD de producción
3. Buscá la colección `api_configurations`
4. Encontrá el documento de "WooCommerce API - Veo Veo"
5. Editá el campo `autenticacion.configuracion` y agregá:
   ```json
   "useQueryString": true
   ```
6. Guardá

---

Una vez actualizado, el log debería mostrar:
```
🔐 [DEBUG] Basic Auth config: { useQueryString: true, ... }
✅ [DEBUG] Usando query string para WooCommerce
```
