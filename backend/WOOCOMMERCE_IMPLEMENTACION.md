# 🛒 Integración de WooCommerce - Implementación Completada

## ✅ Resumen

Se ha implementado exitosamente la integración completa de WooCommerce en el módulo de Marketplace, siguiendo los lineamientos de la guía de integraciones.

---

## 📁 Archivos Creados/Modificados

### Creados
1. **`src/services/woocommerceService.ts`** - Servicio completo de WooCommerce (400+ líneas)
2. **`WOOCOMMERCE_IMPLEMENTACION.md`** - Este archivo

### Modificados
3. **`src/models/MarketplaceIntegration.ts`** - Agregado tipo `woocommerce` y configuración
4. **`src/controllers/marketplaceController.ts`** - 13 nuevos controladores
5. **`src/routes/marketplaceRoutes.ts`** - 12 nuevas rutas
6. **`.env`** - Documentación de configuración

---

## 🎯 Funcionalidades Implementadas

### Autenticación
- ✅ Conexión con Consumer Key/Secret
- ✅ Encriptación de credenciales
- ✅ Verificación de conexión automática
- ✅ Una integración por empresa

### Productos (CRUD Completo)
- ✅ `GET /products` - Listar productos
- ✅ `GET /products/:id` - Obtener producto
- ✅ `POST /products` - Crear producto
- ✅ `PUT /products/:id` - Actualizar producto
- ✅ `DELETE /products/:id` - Eliminar producto

### Órdenes
- ✅ `GET /orders` - Listar órdenes
- ✅ `GET /orders/:id` - Obtener orden
- ✅ `PUT /orders/:id` - Actualizar orden (cambiar estado, agregar notas)

### Clientes
- ✅ `GET /customers` - Listar clientes

### Categorías
- ✅ `GET /categories` - Listar categorías de productos

### Reportes
- ✅ `GET /reports/sales` - Reporte de ventas

---

## 📡 API Endpoints

### Base URL
```
/api/marketplace/:empresaId/woocommerce
```

### 1. Conectar Tienda
```http
POST /:empresaId/woocommerce/connect
Authorization: Bearer {token}
Content-Type: application/json

{
  "storeUrl": "https://tu-tienda.com",
  "consumerKey": "ck_xxxxxxxxxxxxx",
  "consumerSecret": "cs_xxxxxxxxxxxxx"
}
```

**Response:**
```json
{
  "success": true,
  "message": "WooCommerce conectado exitosamente",
  "integration": {
    "id": "...",
    "provider": "woocommerce",
    "connected_account": "https://tu-tienda.com",
    "status": "active"
  }
}
```

### 2. Listar Productos
```http
GET /:empresaId/woocommerce/products?page=1&per_page=10&search=camiseta
Authorization: Bearer {token}
```

**Query Params:**
- `page` - Número de página
- `per_page` - Productos por página (default: 10)
- `search` - Buscar por nombre
- `category` - Filtrar por categoría
- `status` - Filtrar por estado (publish, draft, pending)

### 3. Crear Producto
```http
POST /:empresaId/woocommerce/products
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Producto Nuevo",
  "type": "simple",
  "regular_price": "29.99",
  "description": "Descripción del producto",
  "short_description": "Descripción corta",
  "categories": [
    { "id": 9 }
  ],
  "images": [
    { "src": "https://example.com/image.jpg" }
  ]
}
```

### 4. Actualizar Producto
```http
PUT /:empresaId/woocommerce/products/:productId
Authorization: Bearer {token}
Content-Type: application/json

{
  "regular_price": "39.99",
  "stock_quantity": 100
}
```

### 5. Eliminar Producto
```http
DELETE /:empresaId/woocommerce/products/:productId
Authorization: Bearer {token}
```

### 6. Listar Órdenes
```http
GET /:empresaId/woocommerce/orders?status=processing&per_page=20
Authorization: Bearer {token}
```

**Query Params:**
- `page` - Número de página
- `per_page` - Órdenes por página
- `status` - Filtrar por estado (pending, processing, completed, cancelled)
- `after` - Fecha mínima (ISO 8601)
- `before` - Fecha máxima (ISO 8601)

### 7. Actualizar Orden
```http
PUT /:empresaId/woocommerce/orders/:orderId
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "completed",
  "customer_note": "Pedido entregado exitosamente"
}
```

### 8. Listar Clientes
```http
GET /:empresaId/woocommerce/customers?search=juan
Authorization: Bearer {token}
```

### 9. Listar Categorías
```http
GET /:empresaId/woocommerce/categories
Authorization: Bearer {token}
```

### 10. Reporte de Ventas
```http
GET /:empresaId/woocommerce/reports/sales?period=week
Authorization: Bearer {token}
```

**Query Params:**
- `period` - Período (week, month, year)
- `date_min` - Fecha mínima
- `date_max` - Fecha máxima

---

## 🔧 Configuración

### 1. Generar Credenciales en WooCommerce

1. Ir a tu tienda WooCommerce
2. **WooCommerce > Settings > Advanced > REST API**
3. Click en **"Add Key"**
4. Configurar:
   - **Description**: MomentoIA Integration
   - **User**: Seleccionar usuario administrador
   - **Permissions**: Read/Write
5. Click en **"Generate API Key"**
6. Copiar **Consumer Key** y **Consumer Secret**

### 2. Conectar desde la API

```bash
curl -X POST http://localhost:3000/api/marketplace/MiEmpresa/woocommerce/connect \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "storeUrl": "https://tu-tienda.com",
    "consumerKey": "ck_xxxxxxxxxxxxx",
    "consumerSecret": "cs_xxxxxxxxxxxxx"
  }'
```

---

## 🔐 Seguridad

### Credenciales Encriptadas
```typescript
// Las credenciales se almacenan encriptadas
{
  access_token: encrypt(consumerKey),      // Encriptado
  refresh_token: encrypt(consumerSecret),  // Encriptado
  token_type: 'basic',
  expires_at: Date,  // 1 año
  scope: 'read_write'
}
```

### Autenticación HTTP Basic
```typescript
// Todas las requests a WooCommerce usan HTTP Basic Auth
axios.get(url, {
  auth: {
    username: consumerKey,
    password: consumerSecret
  }
})
```

---

## 📊 Modelo de Datos

### Configuración de WooCommerce
```typescript
{
  woocommerce: {
    store_url: string,         // URL de la tienda
    sync_products: boolean,    // Sincronizar productos
    sync_orders: boolean,      // Sincronizar órdenes
    sync_customers: boolean,   // Sincronizar clientes
    order_statuses: string[],  // Estados a sincronizar
    sync_interval: number,     // Minutos entre sincronizaciones
    auto_sync: boolean         // Sincronización automática
  }
}
```

### Integración Completa
```typescript
{
  _id: ObjectId,
  empresaId: "MiEmpresa",
  usuarioEmpresaId: ObjectId,
  provider: "woocommerce",
  provider_name: "WooCommerce",
  credentials: { ... },  // Encriptado
  status: "active",
  connected_account: "https://tu-tienda.com",
  config: { woocommerce: { ... } },
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🧪 Testing

### Test Manual

```bash
# 1. Conectar tienda
curl -X POST http://localhost:3000/api/marketplace/TestEmpresa/woocommerce/connect \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"storeUrl":"https://test.com","consumerKey":"ck_test","consumerSecret":"cs_test"}'

# 2. Listar productos
curl http://localhost:3000/api/marketplace/TestEmpresa/woocommerce/products \
  -H "Authorization: Bearer $TOKEN"

# 3. Crear producto
curl -X POST http://localhost:3000/api/marketplace/TestEmpresa/woocommerce/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Product","type":"simple","regular_price":"19.99"}'

# 4. Listar órdenes
curl http://localhost:3000/api/marketplace/TestEmpresa/woocommerce/orders \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🚀 Próximos Pasos

### Sincronización Automática (Opcional)
Agregar en `marketplaceSyncService.ts`:

```typescript
export async function syncWooCommerceOrders() {
  const integrations = await MarketplaceIntegrationModel.find({
    provider: 'woocommerce',
    status: 'active',
    'config.woocommerce.auto_sync': true
  });

  for (const integration of integrations) {
    try {
      const orders = await woocommerceService.listOrders(integration, {
        status: 'processing',
        per_page: 50
      });
      
      // Procesar órdenes...
      integration.last_sync = new Date();
      await integration.save();
    } catch (error) {
      console.error(`Error sincronizando WooCommerce: ${error}`);
    }
  }
}
```

### Webhooks (Opcional)
Implementar endpoint para recibir webhooks de WooCommerce:

```typescript
router.post('/:empresaId/woocommerce/webhook', async (req, res) => {
  // Validar webhook signature
  // Procesar evento (order.created, product.updated, etc.)
  // Actualizar datos locales
});
```

---

## 📈 Métricas

### Endpoints Implementados
- **Total**: 12 endpoints
- **Productos**: 5 endpoints (CRUD completo)
- **Órdenes**: 3 endpoints
- **Clientes**: 1 endpoint
- **Categorías**: 1 endpoint
- **Reportes**: 1 endpoint
- **Conexión**: 1 endpoint

### Líneas de Código
- **Servicio**: ~400 líneas
- **Controladores**: ~480 líneas
- **Rutas**: ~80 líneas
- **Total**: ~960 líneas

---

## ✅ Checklist Completado

- [x] Modelo actualizado con WooCommerce
- [x] Configuración de WooCommerce definida
- [x] Servicio creado con 14 métodos
- [x] 13 controladores implementados
- [x] 12 rutas agregadas y documentadas
- [x] Autenticación HTTP Basic
- [x] Encriptación de credenciales
- [x] Verificación de conexión
- [x] Manejo de errores robusto
- [x] Logs descriptivos
- [x] Compilación exitosa
- [x] Variables de entorno documentadas
- [x] Documentación completa

---

## 🎉 Resultado

La integración de WooCommerce está **100% funcional** y lista para usar. Sigue el mismo patrón de Google Calendar y puede servir como referencia para futuras integraciones de e-commerce (Shopify, Mercado Libre, etc.).

**Implementado**: 11 de Noviembre de 2025
**Versión**: 1.0.0
