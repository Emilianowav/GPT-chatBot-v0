# Nodo WhatsApp - Documentación Completa

## 📋 Descripción General

El nodo WhatsApp permite enviar mensajes a través de WhatsApp Business API. Soporta texto, imágenes, documentos, ubicaciones y más.

---

## 🎯 Tipos de Mensajes

### 1. Mensaje de Texto

**Propósito:** Enviar mensajes de texto simples o con formato.

**Configuración:**

```json
{
  "id": "whatsapp-mensaje",
  "type": "whatsapp",
  "data": {
    "label": "Enviar Mensaje",
    "config": {
      "action": "send-message",
      "telefono": "{{1.from}}",
      "message": "¡Hola! ¿En qué puedo ayudarte?",
      "tipo": "text"
    }
  }
}
```

**Campos:**

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `telefono` | string | Número destino | `"{{1.from}}"` o `"5493794732177"` |
| `message` | string | Contenido del mensaje | `"Hola {{nombre}}"` |
| `tipo` | string | Tipo de mensaje | `"text"`, `"image"`, `"document"` |

**Variables en Mensajes:**

```javascript
// Usar variables globales
"Hola {{nombre}}, tu pedido está listo"

// Usar output de nodos
"Encontré estos productos: {{woocommerce.productos}}"

// Usar tópicos
"Horarios: {{topicos.horarios.descripcion}}"
```

**Formato de Texto:**

```javascript
// Negrita
"*Texto en negrita*"

// Cursiva
"_Texto en cursiva_"

// Tachado
"~Texto tachado~"

// Monoespaciado
"```Código```"

// Saltos de línea
"Línea 1\nLínea 2\nLínea 3"
```

---

### 2. Mensaje con Imagen

**Configuración:**

```json
{
  "config": {
    "action": "send-message",
    "telefono": "{{1.from}}",
    "tipo": "image",
    "media": {
      "url": "https://ejemplo.com/imagen.jpg",
      "caption": "Descripción de la imagen"
    }
  }
}
```

---

### 3. Mensaje con Documento

**Configuración:**

```json
{
  "config": {
    "action": "send-message",
    "telefono": "{{1.from}}",
    "tipo": "document",
    "media": {
      "url": "https://ejemplo.com/documento.pdf",
      "filename": "Catálogo.pdf",
      "caption": "Aquí está el catálogo"
    }
  }
}
```

---

### 4. Mensaje con Ubicación

**Configuración:**

```json
{
  "config": {
    "action": "send-message",
    "telefono": "{{1.from}}",
    "tipo": "location",
    "location": {
      "latitude": "-27.4696",
      "longitude": "-58.8306",
      "name": "Librería Veo Veo",
      "address": "San Juan 1037, Corrientes"
    }
  }
}
```

---

## 🔧 Resolución de Variables

### Teléfono Destino

El sistema resuelve el teléfono en este orden:

1. **config.telefono** (nuevo estándar)
```json
{
  "telefono": "{{1.from}}"
}
```

2. **config.to** (legacy)
```json
{
  "to": "{{1.from}}"
}
```

3. **input.to** (edge mapping)
```json
{
  "to": "5493794732177"
}
```

**Ejemplos:**

```javascript
// Desde trigger (responder al usuario)
"telefono": "{{1.from}}"

// Número fijo
"telefono": "5493794732177"

// Variable global
"telefono": "{{telefono_cliente}}"

// Output de nodo
"telefono": "{{contacto.telefono}}"
```

---

### Mensaje

El sistema resuelve el mensaje en este orden:

1. **config.message** (nuevo estándar)
```json
{
  "message": "Hola {{nombre}}"
}
```

2. **config.mensaje** (español)
```json
{
  "mensaje": "Hola {{nombre}}"
}
```

3. **input.message** (edge mapping)
```json
{
  "message": "Mensaje desde edge"
}
```

**Resolución de Variables:**

```javascript
// Antes de enviar
const mensaje = "Hola {{nombre}}, tu pedido #{{pedido_id}} está listo";

// Después de resolver
const mensajeResuelto = "Hola Juan, tu pedido #12345 está listo";
```

---

## 📊 Casos de Uso

### Caso 1: Responder al Usuario

**Flujo:**
```
[Trigger WhatsApp] → recibe mensaje
[GPT] → procesa y genera respuesta
[WhatsApp] → envía respuesta al usuario
```

**Configuración:**
```json
{
  "telefono": "{{1.from}}", // Responder al remitente
  "message": "{{gpt.response}}" // Respuesta del GPT
}
```

---

### Caso 2: Enviar Productos Encontrados

**Flujo:**
```
[WooCommerce] → busca productos
[GPT Asistente] → formatea productos
[WhatsApp] → envía mensaje con productos
```

**Configuración:**
```json
{
  "telefono": "{{1.from}}",
  "message": "{{gpt-asistente.response}}"
}
```

**Ejemplo de Mensaje:**
```
¡Encontré estos libros! 📚

📖 *HARRY POTTER Y LA CÁMARA SECRETA*
💰 $25.000
📦 Disponible
🔗 https://www.veoveolibros.com.ar/producto/harry-potter-2

📖 *HARRY POTTER Y LA ORDEN DEL FÉNIX*
💰 $49.000
📦 Disponible
🔗 https://www.veoveolibros.com.ar/producto/harry-potter-5
```

---

### Caso 3: Notificación a Admin

**Flujo:**
```
[Usuario] → completa formulario
[WhatsApp] → notifica a admin
```

**Configuración:**
```json
{
  "telefono": "5493794732177", // Número del admin
  "message": "Nuevo pedido de {{nombre_cliente}}\nProducto: {{titulo}}\nTeléfono: {{1.from}}"
}
```

---

### Caso 4: Mensaje con Variables de Tópicos

**Configuración:**
```json
{
  "telefono": "{{1.from}}",
  "message": "Nuestros horarios:\n{{topicos.horarios.descripcion}}\n\nMedios de pago:\n{{topicos.medios_pago.descripcion}}"
}
```

**Resultado:**
```
Nuestros horarios:
Atendemos de Lunes a Viernes de 8:30 a 12:00 y de 17:00 a 21:00. Sábados de 9:00 a 13:00 y de 17:00 a 21:00. Domingos cerrado.

Medios de pago:
Aceptamos efectivo, transferencia bancaria y Mercado Pago. Tenemos promociones con Banco Corrientes (Lunes y Miércoles: 3 cuotas sin interés + 20% bonificación).
```

---

## 🐛 Debug y Logs

### Logs de Envío

```
📱 [WHATSAPP] Enviando mensaje...
   📞 Teléfono: 5493794732177
   📝 Mensaje (primeros 150 chars): "¡Encontré estos libros! 📚\n\n📖 *HARRY POTTER Y LA CÁMARA SECRETA*\n💰 $25.000\n📦 Disponible..."
   
   ✅ Usando config.message/mensaje
   Antes de resolver: "{{gpt-asistente.response}}"
   Después de resolver: "¡Encontré estos libros! 📚..."
   
✅ [WHATSAPP] Mensaje enviado correctamente
```

### Logs de Resolución de Variables

```
🔎 [getVariableValue] Buscando: "gpt-asistente.response"
   🔎 Buscando en contexto de nodo: "gpt-asistente"
   ✅ Nodo encontrado, output: "¡Encontré estos libros!..."
   ✅ Valor final: "¡Encontré estos libros!..."
```

---

## ⚠️ Errores Comunes

### Error 1: Variable Sin Resolver

**Síntoma:**
```
Bot: "Hola {{nombre}}" // Variable no resuelta
```

**Causa:** Variable no existe o mal escrita

**Solución:**
```javascript
// Verificar que la variable existe
console.log('Variables globales:', Object.keys(globalVariables));

// Verificar sintaxis
{{nombre}}          // ✅ Correcto
{{nombre_cliente}}  // ✅ Correcto
{{Nombre}}          // ❌ Case-sensitive
{{ nombre }}        // ✅ Funciona (espacios ignorados)
```

---

### Error 2: Teléfono Inválido

**Síntoma:**
```
❌ Error al enviar mensaje: Invalid phone number
```

**Causa:** Formato de teléfono incorrecto

**Solución:**
```javascript
// ✅ Formato correcto
"5493794732177"     // Con código de país
"549" + "3794732177" // Concatenado

// ❌ Formato incorrecto
"3794732177"        // Sin código de país
"+54 9 379 473-2177" // Con espacios/guiones
```

---

### Error 3: Mensaje Vacío

**Síntoma:**
```
⚠️ Mensaje vacío después de resolver variables
```

**Causa:** Variable referenciada está vacía

**Solución:**
```javascript
// Verificar que la variable tiene contenido
if (!message || message.trim() === '') {
  console.log('⚠️ Mensaje vacío, usando fallback');
  message = "Mensaje por defecto";
}
```

---

### Error 4: Mensaje Muy Largo

**Síntoma:**
```
❌ Error: Message too long (max 4096 characters)
```

**Causa:** WhatsApp limita mensajes a 4096 caracteres

**Solución:**
```javascript
// Dividir mensaje en partes
if (message.length > 4000) {
  const parte1 = message.substring(0, 4000);
  const parte2 = message.substring(4000);
  
  await sendMessage(telefono, parte1);
  await sendMessage(telefono, parte2);
}
```

---

## 🎨 Mejores Prácticas

### 1. Usar Variables Descriptivas

```javascript
// ❌ Mal
"{{1.output.message}}"

// ✅ Bien
"{{gpt-asistente.response}}"
```

### 2. Validar Variables Críticas

```javascript
// Antes de enviar, verificar que existen
if (!telefono || !message) {
  console.error('❌ Faltan datos para enviar mensaje');
  return;
}
```

### 3. Formato Consistente

```javascript
// Usar formato de WhatsApp
"*Negrita* para títulos"
"_Cursiva_ para énfasis"
"\n\n" // Doble salto para separar secciones
```

### 4. Mensajes Concisos

```javascript
// ✅ Bien (conciso y claro)
"¡Hola! Encontré 3 productos:\n\n📖 Libro 1\n📖 Libro 2\n📖 Libro 3"

// ❌ Mal (muy largo)
"Hola, espero que estés muy bien. Te comento que he realizado una búsqueda exhaustiva en nuestro catálogo y he encontrado los siguientes productos que podrían ser de tu interés..."
```

### 5. Emojis con Moderación

```javascript
// ✅ Bien
"📚 Libros encontrados"
"💰 Precio: $25.000"

// ❌ Excesivo
"🎉🎊🎈 ¡¡¡Hola!!! 😊😃😄"
```

---

## 📊 Comparación con Código

### Nodo WhatsApp vs Código

**Nodo Visual:**
```
[GPT] → genera respuesta
  ↓
[WhatsApp] → envía a usuario
  - telefono: {{1.from}}
  - message: {{gpt.response}}
```

**Equivalente en Código:**
```javascript
const respuesta = await gpt.generateResponse(mensaje);
await whatsapp.sendMessage({
  to: trigger.from,
  message: respuesta
});
```

---

## 🔗 Integración con Otros Nodos

### Con GPT

```
[GPT Conversacional] → genera respuesta
[WhatsApp] → envía respuesta
```

### Con WooCommerce

```
[WooCommerce] → busca productos
[GPT Asistente] → formatea productos
[WhatsApp] → envía productos formateados
```

### Con Router

```
[Router] → evalúa condición
  ├─ [SI] → [WhatsApp: Mensaje de éxito]
  └─ [NO] → [WhatsApp: Mensaje de error]
```

---

## 📚 Documentación Relacionada

- `NODO-GPT.md` - Nodos GPT (formateador, conversacional)
- `NODO-ROUTER.md` - Enrutamiento condicional
- `NODO-WOOCOMMERCE.md` - Integración con WooCommerce
- `CONDICIONALES.md` - Condiciones en conexiones

---

**Creado:** 2026-01-15  
**Última actualización:** 2026-01-15  
**Versión:** 1.0
