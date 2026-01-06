# ARQUITECTURA FLUJO VENTA COMPLETO - VEO VEO

## 🎯 OBJETIVO
Flujo end-to-end desde búsqueda hasta pago con Mercado Pago, 100% configurable desde frontend.

---

## 📊 DIAGRAMA DE FLUJO

```
[1] WhatsApp Watch Events (TRIGGER)
      ↓
[2] GPT Conversacional - Búsqueda
    (Recopila: título, editorial, edición)
      ↓
[3] Router - ¿Info Completa?
      ↓ [INFO_COMPLETA]
[4] GPT Transform - Formatear Búsqueda
    (Output: JSON para WooCommerce)
      ↓
[5] WooCommerce API - Buscar Productos
    (GET /products?search=...)
      ↓
[6] Router - ¿Hay Resultados?
      ↓ [CON_RESULTADOS]
[7] GPT Conversacional - Mostrar Resultados
    (Formatea lista de productos)
      ↓
[8] WhatsApp Send - Enviar Resultados
      ↓
[9] WhatsApp Watch Events - Esperar Selección
      ↓
[10] GPT Conversacional - Validar Selección
     (Valida número de producto)
      ↓
[11] Router - ¿Selección Válida?
      ↓ [VALIDO]
[12] GPT Conversacional - Pedir Cantidad
      ↓
[13] WhatsApp Send - Mensaje Cantidad
      ↓
[14] WhatsApp Watch Events - Esperar Cantidad
      ↓
[15] GPT Conversacional - Validar Cantidad
      ↓
[16] Router - ¿Cantidad Válida?
      ↓ [VALIDO]
[17] GPT Conversacional - Pedir Nombre
      ↓
[18] WhatsApp Send - Mensaje Nombre
      ↓
[19] WhatsApp Watch Events - Esperar Nombre
      ↓
[20] GPT Conversacional - Validar Nombre
      ↓
[21] GPT Conversacional - Pedir Teléfono
      ↓
[22] WhatsApp Send - Mensaje Teléfono
      ↓
[23] WhatsApp Watch Events - Esperar Teléfono
      ↓
[24] GPT Conversacional - Validar Teléfono
      ↓
[25] GPT Transform - Formatear Orden
     (Output: JSON para Mercado Pago)
      ↓
[26] Mercado Pago API - Crear Preferencia
     (POST /checkout/preferences)
      ↓
[27] GPT Conversacional - Mensaje Final
     (Incluye link de pago)
      ↓
[28] WhatsApp Send - Enviar Link de Pago
```

---

## 🧩 NODOS DETALLADOS

### **ETAPA 1: BÚSQUEDA**

#### **[2] GPT Conversacional - Búsqueda**
```json
{
  "id": "gpt-busqueda",
  "type": "gpt",
  "config": {
    "tipo": "conversacional",
    "modelo": "gpt-4",
    "temperatura": 0.7,
    "maxTokens": 500,
    "systemPrompt": "Recopila: título, editorial, edición. Marca [INFO_COMPLETA] cuando tengas al menos el título.",
    "variablesEntrada": ["mensaje_usuario"],
    "variablesSalida": ["respuesta_gpt", "titulo", "editorial", "edicion"]
  }
}
```

**Variables Globales que Guarda:**
- `{{global.titulo}}`
- `{{global.editorial}}`
- `{{global.edicion}}`

---

#### **[4] GPT Transform - Formatear Búsqueda**
```json
{
  "id": "gpt-transform-busqueda",
  "type": "gpt",
  "config": {
    "tipo": "transform",
    "modelo": "gpt-4",
    "temperatura": 0.1,
    "maxTokens": 300,
    "systemPrompt": "Extrae JSON: {titulo, editorial, edicion, search_query}",
    "variablesEntrada": ["gpt-busqueda.respuesta_gpt"],
    "variablesSalida": ["datos_busqueda"],
    "outputFormat": "json"
  }
}
```

**Variables Globales que Guarda:**
- `{{global.search_query}}`

---

### **ETAPA 2: RESULTADOS**

#### **[5] WooCommerce API - Buscar Productos**
```json
{
  "id": "woocommerce-buscar",
  "type": "api",
  "config": {
    "apiConfigId": "woocommerce-veo-veo",
    "endpointId": "buscar-productos",
    "method": "GET",
    "params": {
      "search": "{{global.search_query}}",
      "per_page": 5
    },
    "variablesSalida": ["productos"]
  }
}
```

**Variables Globales que Guarda:**
- `{{global.productos}}` (array de productos)
- `{{global.total_productos}}` (count)

---

#### **[7] GPT Conversacional - Mostrar Resultados**
```json
{
  "id": "gpt-mostrar-resultados",
  "type": "gpt",
  "config": {
    "tipo": "conversacional",
    "modelo": "gpt-4",
    "temperatura": 0.7,
    "maxTokens": 800,
    "systemPrompt": "Formatea lista de productos en formato amigable. Incluye: número, título, precio, stock.",
    "variablesEntrada": ["global.productos", "global.titulo"],
    "variablesSalida": ["mensaje_resultados"]
  }
}
```

**Output Ejemplo:**
```
📚 Resultados encontrados para "Harry Potter":

1. HARRY POTTER Y LA PIEDRA FILOSOFAL
   💰 Precio: $25,000
   📦 Stock: 5 unidades

2. HARRY POTTER Y LA CÁMARA SECRETA
   💰 Precio: $27,000
   📦 Stock: 3 unidades

💡 ¿Cuál libro querés agregar a tu compra?
Escribí el número del libro (1, 2, etc.)
```

---

### **ETAPA 3: SELECCIÓN**

#### **[10] GPT Conversacional - Validar Selección**
```json
{
  "id": "gpt-validar-seleccion",
  "type": "gpt",
  "config": {
    "tipo": "conversacional",
    "modelo": "gpt-4",
    "temperatura": 0.3,
    "maxTokens": 300,
    "systemPrompt": "Valida que el usuario ingresó un número válido entre 1 y {{global.total_productos}}. Si es válido, marca [VALIDO]. Si no, pide que reingrese.",
    "variablesEntrada": ["mensaje_usuario", "global.total_productos"],
    "variablesSalida": ["respuesta_validacion", "producto_seleccionado_index"]
  }
}
```

**Variables Globales que Guarda:**
- `{{global.producto_seleccionado}}` (objeto producto completo)
- `{{global.producto_id}}`
- `{{global.producto_nombre}}`
- `{{global.producto_precio}}`

---

### **ETAPA 4: CANTIDAD**

#### **[12] GPT Conversacional - Pedir Cantidad**
```json
{
  "id": "gpt-pedir-cantidad",
  "type": "gpt",
  "config": {
    "tipo": "conversacional",
    "modelo": "gpt-4",
    "temperatura": 0.7,
    "maxTokens": 200,
    "systemPrompt": "Pregunta cuántos ejemplares de {{global.producto_nombre}} desea. Menciona el stock disponible.",
    "variablesEntrada": ["global.producto_nombre", "global.producto_stock"],
    "variablesSalida": ["mensaje_cantidad"]
  }
}
```

**Output Ejemplo:**
```
📦 ¿Cuántos ejemplares de HARRY POTTER Y LA PIEDRA FILOSOFAL querés?

Stock disponible: 5 unidades
Escribí la cantidad (1-5)
```

---

#### **[15] GPT Conversacional - Validar Cantidad**
```json
{
  "id": "gpt-validar-cantidad",
  "type": "gpt",
  "config": {
    "tipo": "conversacional",
    "modelo": "gpt-4",
    "temperatura": 0.3,
    "maxTokens": 300,
    "systemPrompt": "Valida que la cantidad es un número entre 1 y {{global.producto_stock}}. Si es válido, marca [VALIDO]. Calcula subtotal.",
    "variablesEntrada": ["mensaje_usuario", "global.producto_stock", "global.producto_precio"],
    "variablesSalida": ["respuesta_validacion", "cantidad"]
  }
}
```

**Variables Globales que Guarda:**
- `{{global.cantidad}}`
- `{{global.subtotal}}` (cantidad × precio)

---

### **ETAPA 5: DATOS DE CONTACTO**

#### **[17] GPT Conversacional - Pedir Nombre**
```json
{
  "id": "gpt-pedir-nombre",
  "type": "gpt",
  "config": {
    "tipo": "conversacional",
    "modelo": "gpt-4",
    "temperatura": 0.7,
    "maxTokens": 200,
    "systemPrompt": "Pide el nombre completo del cliente para el pedido.",
    "variablesEntrada": [],
    "variablesSalida": ["mensaje_nombre"]
  }
}
```

**Output Ejemplo:**
```
✅ Libro agregado a tu compra:

📘 HARRY POTTER Y LA PIEDRA FILOSOFAL
📦 Cantidad: 2
💰 Precio unitario: $25,000
💵 Subtotal: $50,000

Para continuar, necesito algunos datos:
👤 ¿Cuál es tu nombre completo?
```

---

#### **[20] GPT Conversacional - Validar Nombre**
```json
{
  "id": "gpt-validar-nombre",
  "type": "gpt",
  "config": {
    "tipo": "conversacional",
    "modelo": "gpt-4",
    "temperatura": 0.3,
    "maxTokens": 200,
    "systemPrompt": "Valida que el nombre tiene al menos 2 palabras y no contiene números. Si es válido, marca [VALIDO].",
    "variablesEntrada": ["mensaje_usuario"],
    "variablesSalida": ["respuesta_validacion", "nombre_cliente"]
  }
}
```

**Variables Globales que Guarda:**
- `{{global.nombre_cliente}}`

---

#### **[21] GPT Conversacional - Pedir Teléfono**
```json
{
  "id": "gpt-pedir-telefono",
  "type": "gpt",
  "config": {
    "tipo": "conversacional",
    "modelo": "gpt-4",
    "temperatura": 0.7,
    "maxTokens": 200,
    "systemPrompt": "Pide el teléfono de contacto del cliente.",
    "variablesEntrada": ["global.nombre_cliente"],
    "variablesSalida": ["mensaje_telefono"]
  }
}
```

**Output Ejemplo:**
```
Gracias, Juan Pérez 👍

📱 ¿Cuál es tu teléfono de contacto?
(Ejemplo: 3794946066)
```

---

#### **[24] GPT Conversacional - Validar Teléfono**
```json
{
  "id": "gpt-validar-telefono",
  "type": "gpt",
  "config": {
    "tipo": "conversacional",
    "modelo": "gpt-4",
    "temperatura": 0.3,
    "maxTokens": 200,
    "systemPrompt": "Valida que el teléfono tiene entre 7 y 15 dígitos. Si es válido, marca [VALIDO].",
    "variablesEntrada": ["mensaje_usuario"],
    "variablesSalida": ["respuesta_validacion", "telefono_cliente"]
  }
}
```

**Variables Globales que Guarda:**
- `{{global.telefono_cliente}}`

---

### **ETAPA 6: PAGO**

#### **[25] GPT Transform - Formatear Orden**
```json
{
  "id": "gpt-transform-orden",
  "type": "gpt",
  "config": {
    "tipo": "transform",
    "modelo": "gpt-4",
    "temperatura": 0.1,
    "maxTokens": 400,
    "systemPrompt": "Crea JSON para Mercado Pago con los datos de la orden.",
    "variablesEntrada": [
      "global.producto_id",
      "global.producto_nombre",
      "global.producto_precio",
      "global.cantidad",
      "global.subtotal",
      "global.nombre_cliente",
      "global.telefono_cliente"
    ],
    "variablesSalida": ["orden_mercadopago"],
    "outputFormat": "json"
  }
}
```

**Output JSON:**
```json
{
  "items": [
    {
      "title": "HARRY POTTER Y LA PIEDRA FILOSOFAL",
      "quantity": 2,
      "unit_price": 25000,
      "currency_id": "ARS"
    }
  ],
  "payer": {
    "name": "Juan Pérez",
    "phone": {
      "number": "3794946066"
    }
  },
  "back_urls": {
    "success": "https://api.momentoia.co/payment/success",
    "failure": "https://api.momentoia.co/payment/failure",
    "pending": "https://api.momentoia.co/payment/pending"
  },
  "auto_return": "approved",
  "external_reference": "VEO-VEO-{{timestamp}}"
}
```

---

#### **[26] Mercado Pago API - Crear Preferencia**
```json
{
  "id": "mercadopago-crear-preferencia",
  "type": "api",
  "config": {
    "apiConfigId": "mercadopago-veo-veo",
    "endpointId": "crear-preferencia",
    "method": "POST",
    "body": "{{gpt-transform-orden.orden_mercadopago}}",
    "variablesSalida": ["preferencia"]
  }
}
```

**Variables Globales que Guarda:**
- `{{global.link_pago}}` (init_point de Mercado Pago)
- `{{global.preference_id}}`

---

#### **[27] GPT Conversacional - Mensaje Final**
```json
{
  "id": "gpt-mensaje-final",
  "type": "gpt",
  "config": {
    "tipo": "conversacional",
    "modelo": "gpt-4",
    "temperatura": 0.7,
    "maxTokens": 400,
    "systemPrompt": "Genera mensaje final con resumen de compra y link de pago.",
    "variablesEntrada": [
      "global.producto_nombre",
      "global.cantidad",
      "global.subtotal",
      "global.link_pago"
    ],
    "variablesSalida": ["mensaje_final"]
  }
}
```

**Output Ejemplo:**
```
✅ ¡Perfecto! Tu pedido está listo:

📘 HARRY POTTER Y LA PIEDRA FILOSOFAL
📦 Cantidad: 2
💵 Total: $50,000

🔗 Link de pago:
https://mpago.la/abc123

👉 Una vez realizado el pago, envianos el comprobante a:
https://wa.me/5493794732177

⏰ Retiro: Podés pasar a retirarlo a partir de las 24hs de confirmado el pago.

📍 San Juan 1037 - Corrientes Capital
🕗 Lunes a Viernes 8:30-12 y 17-21 | Sábados 9-13 y 17-21

¡Gracias por tu compra! 📚✨
```

---

## 🔄 VARIABLES GLOBALES

### **Sistema de Variables:**
```typescript
interface GlobalVariables {
  // Búsqueda
  titulo: string;
  editorial: string | null;
  edicion: string | null;
  search_query: string;
  
  // Resultados
  productos: Product[];
  total_productos: number;
  
  // Selección
  producto_seleccionado: Product;
  producto_id: string;
  producto_nombre: string;
  producto_precio: number;
  producto_stock: number;
  
  // Cantidad
  cantidad: number;
  subtotal: number;
  
  // Cliente
  nombre_cliente: string;
  telefono_cliente: string;
  
  // Pago
  link_pago: string;
  preference_id: string;
}
```

### **Acceso desde Nodos:**
- `{{global.variable_name}}` - Leer variable global
- GPT puede escribir variables con instrucciones en systemPrompt
- Router puede evaluar variables globales

---

## 🔧 IMPLEMENTACIÓN TÉCNICA

### **1. FlowExecutor - Variables Globales**
```typescript
export class FlowExecutor {
  private context: FlowContext = {};
  private globalVariables: Record<string, any> = {};
  
  // Guardar variable global
  setGlobalVariable(key: string, value: any) {
    this.globalVariables[key] = value;
    console.log(`[Global] ${key} = ${JSON.stringify(value)}`);
  }
  
  // Obtener variable global
  getGlobalVariable(key: string): any {
    return this.globalVariables[key];
  }
  
  // Resolver variables en strings (incluyendo globales)
  resolveVariableInString(str: string): string {
    // {{global.variable}}
    str = str.replace(/\{\{global\.(\w+)\}\}/g, (match, varName) => {
      return this.getGlobalVariable(varName) || match;
    });
    
    // {{nodeId.variable}}
    str = str.replace(/\{\{([\w-]+)\.([\w.]+)\}\}/g, (match, nodeId, path) => {
      return this.getVariableValue(`${nodeId}.${path}`) || match;
    });
    
    return str;
  }
}
```

### **2. Frontend - Configuración de Variables**
```typescript
// NodeConfigPanel.tsx
<div className={styles.formGroup}>
  <label>Variables Globales que Guarda</label>
  <input 
    type="text"
    value={config.globalVariablesOutput?.join(', ') || ''}
    onChange={(e) => setConfig({ 
      ...config, 
      globalVariablesOutput: e.target.value.split(',').map(v => v.trim())
    })}
    placeholder="titulo, editorial, edicion"
  />
  <small>Variables que este nodo guardará en el contexto global</small>
</div>
```

---

## 📋 RESUMEN

**Total de Nodos:** 28
- **Triggers:** 4 (WhatsApp Watch Events)
- **GPT Conversacional:** 10 (búsqueda, validaciones, mensajes)
- **GPT Transform:** 2 (formateo búsqueda y orden)
- **Routers:** 4 (decisiones)
- **APIs:** 2 (WooCommerce, Mercado Pago)
- **WhatsApp Send:** 6 (envío de mensajes)

**Variables Globales:** 15+

**100% Configurable desde Frontend:** ✅
