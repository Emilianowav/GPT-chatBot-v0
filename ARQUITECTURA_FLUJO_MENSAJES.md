# 🔄 ARQUITECTURA COMPLETA DEL FLUJO DE MENSAJES

## 📍 FLUJO ACTUAL (De Inicio a Fin)

### 1️⃣ **ENTRADA: Webhook de WhatsApp**
```
POST /api/whatsapp/webhook
├─ Middleware: deduplicateWebhook (evita duplicados)
└─ Controller: recibirMensaje()
```

**Archivo:** `backend/src/routes/whatsappRoutes.ts` → `backend/src/controllers/whatsappController.ts`

---

### 2️⃣ **EXTRACCIÓN DE DATOS**
```javascript
extraerDatosDePayloadWhatsApp(entrada)
├─ telefonoCliente
├─ telefonoEmpresa
├─ mensaje
├─ profileName
├─ phoneNumberId
└─ tipoMensaje
```

**Archivo:** `backend/src/utils/whatsappUtils.js`

---

### 3️⃣ **BÚSQUEDA DE EMPRESA Y CONTACTO**
```javascript
// Buscar empresa por teléfono
buscarEmpresaPorTelefono(telefonoEmpresa) → EmpresaConfig

// Buscar o crear contacto
buscarOCrearContacto({
  telefono: telefonoCliente,
  profileName,
  empresaId: empresa.nombre,
  empresaTelefono: telefonoEmpresa
}) → Contacto
```

**Archivos:** 
- `backend/src/utils/empresaUtilsMongo.js`
- `backend/src/services/contactoService.js`

---

### 4️⃣ **DECISIÓN DE FLUJO (4 Sistemas Paralelos)**

#### **A) Sistema de Nodos (NUEVO - Prioridad 1)**
```javascript
if (flowNodos activo) {
  nodeEngine.handleUserInput(empresaId, contactoId, mensaje)
  └─ Ejecuta nodos configurados visualmente
}
```
**Archivo:** `backend/src/services/nodeEngine.js`

#### **B) Router Universal (Prioridad 2)**
```javascript
universalRouter.route({mensaje, telefonoCliente, empresaId})
├─ continue_workflow → workflowConversationalHandler
├─ start_workflow → workflowConversationalHandler
└─ execute_api → apiKeywordHandler
```
**Archivo:** `backend/src/services/universalRouter.js`

#### **C) GPT Conversacional (Prioridad 3)**
```javascript
if (!usarBotDePasos) {
  obtenerRespuestaChat({modelo, historial, tools})
  ├─ Prompt base + instrucciones
  ├─ Historial completo
  ├─ Tools (si tiene MercadoPago)
  └─ Function calling para pagos
}
```
**Archivo:** `backend/src/services/openaiService.js`

#### **D) Bot de Pasos (Prioridad 4 - Legacy)**
```javascript
if (usarBotDePasos) {
  flowManager.handleMessage(flowContext)
  └─ Sistema de flujos por pasos
}
```
**Archivo:** `backend/src/flows/index.js`

---

## 🔧 BLOQUES DE CÓDIGO REUTILIZABLES

### **1. Conversacional → GPT → Formato Objeto**
```javascript
// PASO 1: Recopilar info conversacional
workflowConversationalHandler.continueWorkflow(mensaje, metadata)
├─ Recopila datos paso a paso
└─ Guarda en workflowState.datosRecopilados

// PASO 2: Enviar a GPT para formatear
const prompt = `Convierte estos datos en formato JSON:
${JSON.stringify(datosRecopilados)}

Formato esperado:
{
  "producto": "...",
  "cantidad": ...,
  "precio": ...
}`;

const respuestaGPT = await obtenerRespuestaChat({
  modelo: 'gpt-4',
  historial: [{ role: 'user', content: prompt }]
});

const objetoFormateado = JSON.parse(respuestaGPT.texto);
```

**Archivos reutilizables:**
- `backend/src/services/workflowConversationalHandler.ts` (recopilar)
- `backend/src/services/openaiService.js` (formatear)

---

### **2. Filtro de Validación**
```javascript
// Validar datos antes de enviar a API externa
function validarDatosParaAPI(datos: any, schema: any): boolean {
  // Validar campos requeridos
  for (const campo of schema.required) {
    if (!datos[campo]) return false;
  }
  
  // Validar tipos
  for (const [key, tipo] of Object.entries(schema.types)) {
    if (typeof datos[key] !== tipo) return false;
  }
  
  return true;
}
```

**Nuevo archivo:** `backend/src/utils/dataValidator.ts`

---

### **3. Consulta a WooCommerce**
```javascript
// Ejecutar consulta a API externa
apiExecutor.execute({
  endpoint: apiConfig.endpoints.find(e => e.id === 'consultar-productos'),
  params: objetoFormateado,
  headers: apiConfig.headers
})
├─ Hace request HTTP
├─ Maneja errores
└─ Devuelve productos
```

**Archivo reutilizable:** `backend/src/modules/integrations/services/apiExecutor.ts`

---

### **4. Conversacional → Respuesta al Cliente**
```javascript
// Formatear productos para respuesta conversacional
function formatearProductosParaWhatsApp(productos: any[]): string {
  let mensaje = "📦 *Productos disponibles:*\n\n";
  
  productos.forEach((prod, i) => {
    mensaje += `${i+1}. *${prod.nombre}*\n`;
    mensaje += `   💰 $${prod.precio}\n`;
    mensaje += `   📝 ${prod.descripcion}\n\n`;
  });
  
  return mensaje;
}

// Enviar respuesta
await enviarMensajeWhatsAppTexto(
  telefonoCliente,
  formatearProductosParaWhatsApp(productos),
  phoneNumberId
);
```

**Archivo reutilizable:** `backend/src/services/metaService.js`

---

### **5. MercadoPago (Pago Final)**
```javascript
// Generar link de pago
generateDynamicPaymentLink({
  empresaId: empresaIdStr,
  title: `Pedido ${producto.nombre}`,
  amount: producto.precio * cantidad,
  description: `${cantidad}x ${producto.nombre}`,
  clientePhone: telefonoCliente
})
├─ Crea payment link en MercadoPago
├─ Guarda en BD
└─ Devuelve URL de pago
```

**Archivo reutilizable:** `backend/src/services/paymentLinkService.js`

---

## 🎯 ARQUITECTURA PROPUESTA: NODOS GENÉRICOS

### **Tipos de Nodos Reutilizables**

```javascript
// 1. NODO CONVERSACIONAL (Recopilar Info)
{
  type: "conversational_collect",
  config: {
    pregunta: "¿Qué producto buscás?",
    variable: "producto",
    validacion: "texto_no_vacio"
  }
}

// 2. NODO GPT (Formatear/Transformar)
{
  type: "gpt_transform",
  config: {
    prompt: "Convierte {{datosRecopilados}} a formato JSON",
    outputVariable: "objetoFormateado",
    modelo: "gpt-4"
  }
}

// 3. NODO FILTRO (Validar)
{
  type: "filter",
  config: {
    conditions: [
      { field: "{{producto}}", operator: "not_empty" },
      { field: "{{cantidad}}", operator: "greater_than", value: 0 }
    ],
    onSuccess: "siguiente_nodo",
    onFail: "nodo_error"
  }
}

// 4. NODO API (Consultar Externa)
{
  type: "api_call",
  config: {
    endpointId: "woocommerce_productos",
    method: "GET",
    params: "{{objetoFormateado}}",
    outputVariable: "productos"
  }
}

// 5. NODO CONVERSACIONAL (Responder)
{
  type: "conversational_response",
  config: {
    mensaje: "{{formatearProductos(productos)}}",
    esperarRespuesta: true,
    siguienteVariable: "seleccion"
  }
}

// 6. NODO MERCADOPAGO (Pago)
{
  type: "mercadopago_payment",
  config: {
    title: "{{producto.nombre}}",
    amount: "{{producto.precio * cantidad}}",
    outputVariable: "paymentUrl"
  }
}
```

---

## 📊 FLUJO COMPLETO EJEMPLO: Veo Veo

```
[Webhook WhatsApp]
    ↓
[Nodo 1: Conversacional] → "¿Qué libro buscás?"
    ↓ (respuesta: "Quiero el libro de Python")
[Nodo 2: GPT Transform] → Extrae: {libro: "Python", categoria: "programacion"}
    ↓
[Nodo 3: Filtro] → Valida que libro no esté vacío
    ↓
[Nodo 4: API WooCommerce] → GET /productos?search=Python
    ↓ (respuesta: [{id: 1, nombre: "Python Pro", precio: 2500}])
[Nodo 5: Conversacional] → "Encontré: Python Pro - $2500. ¿Cuántos querés?"
    ↓ (respuesta: "2")
[Nodo 6: GPT Transform] → Extrae cantidad: 2
    ↓
[Nodo 7: Filtro] → Valida cantidad > 0
    ↓
[Nodo 8: MercadoPago] → Genera link de pago por $5000
    ↓
[Nodo 9: Conversacional] → "Tu link de pago: https://mpago.la/xxx"
```

---

## 🔄 COLECCIONES BD NECESARIAS

### **Colección: `workflows`**
```javascript
{
  _id: ObjectId,
  id: "veo-veo-compra",
  empresaId: "Veo Veo",
  nombre: "Flujo de Compra",
  activo: true,
  nodes: [
    {
      id: "node-1",
      type: "conversational_collect",
      position: {x: 100, y: 100},
      config: {...},
      connections: [{targetNodeId: "node-2", filter: {...}}]
    }
  ]
}
```

### **Colección: `workflow_sessions`**
```javascript
{
  workflowId: "veo-veo-compra",
  contactoId: ObjectId,
  empresaId: "Veo Veo",
  currentNodeId: "node-3",
  variables: {
    producto: "Python Pro",
    cantidad: 2,
    precio: 2500
  },
  startedAt: Date,
  lastActivity: Date
}
```

---

## ✅ PRÓXIMOS PASOS

1. **Crear tipos de nodos genéricos** (conversational, gpt_transform, filter, api_call, mercadopago)
2. **Implementar NodeEngine mejorado** que ejecute estos nodos
3. **Migrar flujo Veo Veo** a la nueva arquitectura
4. **Eliminar sistemas legacy** (flows, flujos, etc.)
5. **Todo configurable desde el editor visual**
