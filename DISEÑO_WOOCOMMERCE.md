# DISEÑO NODO WOOCOMMERCE - ESTILO MAKE.COM

## 🎯 ESTRUCTURA GENERAL

Basado en las capturas de Make.com, el nodo WooCommerce debe tener:

1. **Conexión única** (se configura una vez, se usa en todos los módulos)
2. **Módulos categorizados** por tipo de operación
3. **Interfaz de 2 pasos**: Seleccionar módulo → Configurar módulo

---

## 📊 CATEGORÍAS Y MÓDULOS

### **COUPON**
```
📋 COUPON
├─ Delete a Coupon
│  └─ This module helps you to delete a specified coupon.
```

### **CUSTOMER**
```
👤 CUSTOMER
├─ Search for a Customer
│  └─ This module helps you to find a customer.
├─ Get a Customer
│  └─ This module lets you retrieve a specified customer by its ID.
├─ Create a Customer
│  └─ This module helps you to create a new customer.
├─ Update a Customer
│  └─ This module helps you to modify a customer.
```

### **ORDER**
```
📦 ORDER
├─ Search for an Order
│  └─ This module helps you to find an order.
├─ Get an Order
│  └─ This module lets you retrieve a specified order by its ID.
├─ Create an Order
│  └─ This module helps you to create a new order.
├─ Update an Order
│  └─ This module lets you modify an order.
├─ Update an Order Status
│  └─ This module lets you modify an order status. Order Status Manager plugin is required.
```

### **PRODUCT**
```
📦 PRODUCT
├─ Search for a Product
│  └─ This module helps you find a product.
├─ Get a Product
│  └─ This module lets you retrieve a specified product by its ID.
├─ Create a Product
│  └─ This module helps you to create a new product.
├─ Update a Product
│  └─ This module lets you modify a product.
├─ Delete a Product
│  └─ This module helps you to delete a specified product.
```

---

## 🔧 FLUJO DE CONFIGURACIÓN

### **PASO 1: Agregar Nodo WooCommerce**

Usuario hace click en "+" → Selecciona "WooCommerce" del panel

```
┌─────────────────────────────────────┐
│ APPS IN SCENARIO                    │
├─────────────────────────────────────┤
│ 🟢 WhatsApp Business Cloud          │
│ 🤖 OpenAI (ChatGPT, Sora, DALL-E)   │
│ 🟣 WooCommerce ✓ Verified           │ ← Click aquí
│ 🌐 HTTP                             │
├─────────────────────────────────────┤
│ ALL APPS                            │
│ 📊 Google Sheets                    │
│ ⚙️  Flow Control                    │
└─────────────────────────────────────┘
```

---

### **PASO 2: Seleccionar Módulo**

Se abre modal con categorías y módulos

```
┌─────────────────────────────────────┐
│ ← BACK                              │
├─────────────────────────────────────┤
│         WooCommerce                 │
├─────────────────────────────────────┤
│                                     │
│ 📋 COUPON                           │
│ 🟣 Delete a Coupon                  │
│    This module helps you to delete  │
│    a specified coupon.              │
│                                     │
│ 👤 CUSTOMER                         │
│ 🟣 Search for a Customer            │
│    This module helps you to find a  │
│    customer.                        │
│ 🟣 Get a Customer                   │
│    This module lets you retrieve a  │
│    specified customer by its ID.    │
│ 🟣 Create a Customer                │
│    This module helps you to create  │
│    a new customer.                  │
│ 🟣 Update a Customer                │
│    This module helps you to modify  │
│    a customer.                      │
│                                     │
│ 📦 ORDER                            │
│ 🟣 Search for an Order              │
│ 🟣 Get an Order                     │
│ 🟣 Create an Order                  │
│ 🟣 Update an Order                  │
│ 🟣 Update an Order Status           │
│                                     │
│ 📦 PRODUCT                          │
│ 🟣 Search for a Product             │
│ 🟣 Get a Product                    │
│ 🟣 Create a Product                 │
│ 🟣 Update a Product                 │
│ 🟣 Delete a Product                 │
│                                     │
│ [Search modules]                    │
└─────────────────────────────────────┘
```

---

### **PASO 3: Configurar Conexión (Primera vez)**

Si es el primer nodo WooCommerce, pide crear conexión

```
┌─────────────────────────────────────┐
│ WooCommerce                    ⋮ ⭐ ? ✕│
├─────────────────────────────────────┤
│ ⊙ Connection *                      │
│                                     │
│ 🟣 Create a connection              │
│                                     │
│ For more information on how to      │
│ create a connection to WooCommerce, │
│ see the online Help.                │
│                                     │
│                    [Cancel] [Save]  │
└─────────────────────────────────────┘
```

Click en "Create a connection" → Modal de configuración

```
┌─────────────────────────────────────┐
│ Create a connection            ✕    │
├─────────────────────────────────────┤
│ ⊙ Connection name *                 │
│ [My WooCommerce connection]         │
│                                     │
│ ⊙ Eshop URL *                       │
│ [                                 ] │
│ For example, https://my-eshop.com.  │
│ HTTPS is required.                  │
│                                     │
│ If you encounter an error 404,      │
│ please try reset the permalinks:    │
│ 1. Log in to the WordPress          │
│    dashboard.                       │
│ 2. Navigate to Settings >           │
│    Permalinks.                      │
│ 3. Select a different permalink     │
│    structure and save.              │
│ 4. Change back to the original      │
│    setting and save again.          │
│                                     │
│ ⊙ Consumer Key *                    │
│ [                                 ] │
│                                     │
│ ⊙ Consumer Secret *                 │
│ [                                 ] 👁│
│                                     │
│ ⊙ Self-signed certificate           │
│ [                      ] [Extract]  │
│                                     │
│ If you are using a self-signed      │
│ certificate, you are required to    │
│ provide the public certificate here │
│ for the connection to work. You may │
│ copy or extract the .cr file.       │
│                                     │
│                    [Close] [Save]   │
└─────────────────────────────────────┘
```

---

### **PASO 4: Configurar Módulo Específico**

Ejemplo: "Get a Product"

```
┌─────────────────────────────────────┐
│ WooCommerce                    ⋮ ⭐ ? ✕│
├─────────────────────────────────────┤
│ ⊙ Connection *                      │
│ [My WooCommerce connection     ▼]   │
│                                     │
│ ⊙ Product ID *                      │
│ [Selector de variables @]           │ ← SELECTOR DE VARIABLES
│                                     │
│ Enter the ID of the product to      │
│ retrieve.                           │
│                                     │
│                    [Cancel] [Save]  │
└─────────────────────────────────────┘
```

---

## 💾 ESTRUCTURA DE DATOS

### **Configuración del Nodo WooCommerce**

```typescript
interface WooCommerceConfig {
  // Conexión (se guarda una vez, se reutiliza)
  connection?: {
    id: string;
    name: string;
    eshopUrl: string;
    consumerKey: string;
    consumerSecret: string;
    selfSignedCert?: string;
  };
  
  // Módulo seleccionado
  module: 
    // COUPON
    | 'delete-coupon'
    // CUSTOMER
    | 'search-customer'
    | 'get-customer'
    | 'create-customer'
    | 'update-customer'
    // ORDER
    | 'search-order'
    | 'get-order'
    | 'create-order'
    | 'update-order'
    | 'update-order-status'
    // PRODUCT
    | 'search-product'
    | 'get-product'
    | 'create-product'
    | 'update-product'
    | 'delete-product';
  
  // Parámetros específicos del módulo
  params: Record<string, any>;
}
```

### **Ejemplo: Get a Product**

```typescript
{
  connection: {
    id: 'woo-conn-1',
    name: 'My WooCommerce connection',
    eshopUrl: 'https://veoveo.com',
    consumerKey: 'ck_xxx',
    consumerSecret: 'cs_xxx'
  },
  module: 'get-product',
  params: {
    productId: '{{global.producto_id}}'  // Variable del GPT
  }
}
```

### **Ejemplo: Search for a Product**

```typescript
{
  connection: { /* ... */ },
  module: 'search-product',
  params: {
    search: '{{global.titulo}}',  // Variable del GPT
    category: '{{global.categoria}}',
    limit: 10,
    orderBy: 'relevance'
  }
}
```

### **Ejemplo: Create an Order**

```typescript
{
  connection: { /* ... */ },
  module: 'create-order',
  params: {
    customerId: '{{woo-search-customer.id}}',  // Variable de nodo anterior
    lineItems: [
      {
        productId: '{{woo-get-product.id}}',
        quantity: '{{global.cantidad}}'
      }
    ],
    billing: {
      firstName: '{{global.nombre}}',
      phone: '{{1.from}}'  // Del trigger WhatsApp
    }
  }
}
```

---

## 🎨 COMPONENTES FRONTEND

### **1. WooCommerceModuleSelector.tsx**

Modal para seleccionar módulo (categorizado)

### **2. WooCommerceConnectionModal.tsx**

Modal para crear/editar conexión

### **3. WooCommerceConfigPanel.tsx**

Panel de configuración del módulo seleccionado

---

## 🔄 FLUJO DE EJECUCIÓN BACKEND

```typescript
class FlowExecutor {
  private async executeWooCommerceNode(node: any, input: any) {
    const config = node.data.config;
    
    // 1. Obtener credenciales de conexión
    const connection = config.connection || 
                      this.flowConfig.woocommerce;
    
    // 2. Resolver variables en params
    const params = this.resolveVariables(config.params);
    
    // 3. Ejecutar módulo específico
    switch (config.module) {
      case 'get-product':
        return await this.wooGetProduct(connection, params);
      
      case 'search-product':
        return await this.wooSearchProduct(connection, params);
      
      case 'create-order':
        return await this.wooCreateOrder(connection, params);
      
      // ... otros módulos
    }
  }
  
  private async wooGetProduct(connection: any, params: any) {
    const url = `${connection.eshopUrl}/wp-json/wc/v3/products/${params.productId}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${btoa(`${connection.consumerKey}:${connection.consumerSecret}`)}`
      }
    });
    
    const product = await response.json();
    
    return {
      output: {
        id: product.id,
        name: product.name,
        price: product.price,
        stock: product.stock_quantity,
        image: product.images[0]?.src,
        // ... otros campos
      }
    };
  }
}
```

---

## ✅ CARACTERÍSTICAS CLAVE

1. **Conexión Reutilizable**
   - Se configura UNA vez
   - Todos los nodos WooCommerce la usan
   - Similar al sistema de `phoneNumberId` de WhatsApp

2. **Módulos Categorizados**
   - COUPON, CUSTOMER, ORDER, PRODUCT
   - Fácil de encontrar
   - Descripción clara de cada módulo

3. **Selector de Variables**
   - En cada campo de configuración
   - Botón @ para abrir selector
   - Muestra variables disponibles

4. **Validación de Campos**
   - Campos obligatorios marcados con *
   - Validación antes de guardar
   - Mensajes de error claros

5. **Ayuda Contextual**
   - Descripción de cada campo
   - Link a documentación
   - Ejemplos de uso

---

## 🚀 PRIORIDAD DE IMPLEMENTACIÓN

1. **Fase 1: Estructura Base** ✅
   - Tipos TypeScript
   - Modelo de datos

2. **Fase 2: Conexión**
   - Modal de crear conexión
   - Guardar en flowConfig
   - Reutilizar en nodos subsiguientes

3. **Fase 3: Módulos Básicos**
   - Get a Product
   - Search for a Product
   - Create an Order

4. **Fase 4: Módulos Completos**
   - Todos los módulos de PRODUCT
   - Todos los módulos de ORDER
   - Todos los módulos de CUSTOMER
   - Todos los módulos de COUPON

5. **Fase 5: Integración**
   - Selector de variables en todos los campos
   - Validación completa
   - Testing end-to-end
