# Configuración de Veo Veo - WooCommerce + Mercado Pago

## ✅ Configuración Completada

### 1. API de WooCommerce
- **URL Base:** `https://www.veoveolibros.com.ar/wp-json/wc/v3`
- **Autenticación:** Basic Auth (credenciales encriptadas)
- **Consumer Key:** `ck_1f3a8bcc67796cf3d2d00ea950274bbe651da939`
- **Consumer Secret:** `cs_0170ad344d889ae6b305f3d41021f1af4dfd4a41`

### 2. Endpoints Configurados (7 endpoints)
1. `listar-productos` - GET /products
2. `buscar-productos` - GET /products?search={{query}}
3. `obtener-producto` - GET /products/{{product_id}}
4. `listar-categorias` - GET /products/categories
5. `productos-por-categoria` - GET /products?category={{category_id}}
6. `crear-pedido` - POST /orders
7. `generar-link-pago` - Interno (Mercado Pago)

### 3. Workflow Conversacional (8 pasos)

#### Paso 1: Elegir acción
- Catálogo completo / Buscar libro / Ver categorías
- Validación: opciones 1, 2, 3
- Mapeo: 1→catalogo, 2→buscar, 3→categorias

#### Paso 2: Mostrar productos
- Tipo: `consulta_filtrada`
- Endpoint: `listar-productos`
- Muestra lista de libros con precio

#### Paso 3: Cantidad
- Validación: número entre 1 y 10

#### Paso 4: Nombre del cliente
- Validación: texto

#### Paso 5: Teléfono
- Validación: texto
- Formato: 5493794123456

#### Paso 6: Email
- Validación: email
- Para confirmación del pedido

#### Paso 7: Confirmación
- Resumen del pedido con total
- Validación: SI/NO

#### Paso 8: Generar link de pago
- Endpoint: `generar-link-pago`
- Integración con Mercado Pago
- Pago 100% del total

### 4. Configuración de Pago
```javascript
configPago: {
  seña: 1,              // Monto mínimo (no se usa, se cobra el total)
  porcentajeSeña: 1.0,  // 100% - pago completo
  tiempoExpiracion: 15, // Minutos
  moneda: 'ARS'
}
```

### 5. Empresa Configurada
- **Empresa ID:** `veo-veo`
- **Nombre:** Veo Veo Libros
- **Mensaje de bienvenida:** Configurado
- **Timeout:** 15 minutos
- **Workflows habilitados:** ✅

### 6. Trigger Keywords
- comprar
- libro / libros
- catalogo / catálogo
- tienda
- hola
- menu

---

## ⚠️ Pendiente de Configuración

### 1. Número de WhatsApp de Veo Veo
**IMPORTANTE:** Necesitas proporcionar el número de WhatsApp de Veo Veo para:
- Asociar la empresa con el número
- Activar el bot en ese número
- Recibir mensajes de clientes

**Formato:** 549XXXXXXXXXX (con código de país y área)

### 2. Configuración de Mercado Pago
Verificar que las credenciales de Mercado Pago de Veo Veo estén configuradas en el sistema.

### 3. Testing del Flujo Completo
Una vez configurado el número de WhatsApp:
1. Limpiar estado del número de prueba
2. Enviar "Hola" por WhatsApp
3. Seguir el flujo completo hasta el pago
4. Verificar que se cree el pedido en WooCommerce
5. Verificar que se genere el link de Mercado Pago

---

## 📋 Estructura en BD

### Colección: `api_configurations`
```javascript
{
  _id: ObjectId("695308366153c23dee668739"),
  nombre: "WooCommerce API - Veo Veo",
  baseUrl: "https://www.veoveolibros.com.ar/wp-json/wc/v3",
  autenticacion: {
    tipo: "basic",
    configuracion: {
      username: "[ENCRIPTADO]",
      password: "[ENCRIPTADO]"
    }
  },
  endpoints: [...],
  workflows: [...]
}
```

### Colección: `configuracionbots`
```javascript
{
  _id: ObjectId("695308d735db8e71b1cc3279"),
  empresaId: "veo-veo",
  nombre: "Veo Veo Libros",
  activo: true,
  mensajeBienvenida: "¡Hola! 📚...",
  configuracion: {
    usarWorkflows: true,
    usarMenuPrincipal: true,
    usarHistorial: true
  }
}
```

---

## 🔧 Scripts Disponibles

### Crear/Actualizar Configuración
- `crear-api-veo-veo-woocommerce.js` - Crea la API y workflow
- `ajustar-workflow-veo-veo.js` - Ajusta configuración del workflow
- `fix-auth-veo-veo.js` - Actualiza autenticación
- `crear-empresa-veo-veo.js` - Crea empresa en BD

### Testing
- `test-woocommerce-veo-veo.js` - Testea conexión con WooCommerce

---

## 🚀 Próximos Pasos

1. **Proporcionar número de WhatsApp de Veo Veo**
2. **Configurar credenciales de Mercado Pago** (si no están configuradas)
3. **Testear flujo completo** en WhatsApp
4. **Ajustar mensajes** según feedback del cliente
5. **Configurar webhook de WooCommerce** para sincronizar pedidos

---

## 📊 Comparación con Juventus

| Característica | Juventus | Veo Veo |
|----------------|----------|---------|
| Tipo de API | REST personalizada | WooCommerce REST API |
| Autenticación | API Token | Basic Auth |
| Pasos del workflow | 9 pasos | 8 pasos |
| Integración MP | ✅ Seña 50% | ✅ Pago 100% |
| Productos dinámicos | Canchas por API | Libros por WooCommerce |
| Configuración en BD | ✅ 100% | ✅ 100% |
| Código hardcodeado | ❌ Mínimo | ❌ Mínimo |

---

## ✅ Ventajas de la Implementación

1. **Reutilización de código** - Usa la misma infraestructura que Juventus
2. **Configuración en BD** - Todo configurable sin tocar código
3. **Escalable** - Fácil agregar más productos/categorías
4. **Mantenible** - Cambios en mensajes/flujo desde BD
5. **Integración nativa** - WooCommerce + Mercado Pago
