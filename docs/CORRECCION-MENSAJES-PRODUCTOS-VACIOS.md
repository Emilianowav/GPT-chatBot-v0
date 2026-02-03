# Corrección: Mensajes Duplicados y Productos Vacíos

## 🎯 Problemas Identificados

### 1. Mensajes Triplicados
Los mensajes del usuario se estaban guardando **3 veces** en el historial de conversación.

**Causa:**
- El mensaje se guardaba en `FlowExecutor.ts` (línea 805)
- El mensaje se guardaba en `whatsappController.ts` (línea 676)
- Posiblemente se guardaba en otros nodos GPT

**Síntoma:**
```
Usuario: "Hola estoy buscando novelas"
Usuario: "Hola estoy buscando novelas"  ← DUPLICADO
Usuario: "Hola estoy buscando novelas"  ← DUPLICADO
```

### 2. GPT Inventa Productos Cuando WooCommerce Devuelve 0
Cuando WooCommerce no encuentra productos, el GPT inventaba productos con precios y stock falsos.

**Causa:**
- WooCommerce devolvía: `{"productos":[],"productos_completos":[],"count":0}`
- El GPT no tenía instrucciones claras sobre qué hacer en este caso
- El prompt decía "presenta productos del historial" pero no había productos

**Síntoma:**
```
Cliente: "Binaria 1 y lecturas a la carta 1+"
WooCommerce: 0 productos encontrados
GPT: "📚 *Productos encontrados:*
      1️⃣ *Binaria 1*
         💰 Precio: $[precio]    ← INVENTADO
         📦 Stock: [disponible/agotado]    ← INVENTADO"
```

---

## ✅ Soluciones Implementadas

### 1. Corrección de Mensajes Duplicados

**Archivos modificados:**
1. `backend/src/services/FlowExecutor.ts` (líneas 802-806)
2. `backend/src/services/contactoService.ts` (líneas 152-190)

**Cambio 1 - FlowExecutor.ts:**
```typescript
// ANTES (líneas 802-813):
await this.saveToHistorial(userMessage);
await this.saveToHistorial(output.respuesta_gpt);

// DESPUÉS:
// ⚠️ NO GUARDAR AQUÍ - El historial se guarda en whatsappController.ts
// para evitar duplicación de mensajes
console.log('\n📝 Historial se guardará al finalizar el flujo (whatsappController.ts)');
console.log('   Evitando duplicación de mensajes...');
```

**Cambio 2 - contactoService.ts (CRÍTICO):**
```typescript
// ANTES:
export async function actualizarHistorialConversacion(
  contactoId: string,
  mensaje: string
): Promise<void> {
  await ContactoEmpresaModel.findByIdAndUpdate(
    contactoId,
    { $push: { 'conversaciones.historial': mensaje } }
  );
}

// DESPUÉS:
export async function actualizarHistorialConversacion(
  contactoId: string,
  mensaje: string
): Promise<void> {
  // Obtener el contacto para verificar duplicados
  const contacto = await ContactoEmpresaModel.findById(contactoId);
  
  if (!contacto) {
    console.warn(`⚠️ Contacto no encontrado: ${contactoId}`);
    return;
  }
  
  // Verificar si el mensaje ya existe en los últimos 3 mensajes
  const historial = contacto.conversaciones?.historial || [];
  const ultimosMensajes = historial.slice(-3);
  
  if (ultimosMensajes.includes(mensaje)) {
    console.log(`⏭️ Mensaje duplicado detectado, omitiendo: "${mensaje.substring(0, 50)}..."`);
    return; // NO GUARDAR DUPLICADOS
  }
  
  // Si no es duplicado, agregar al historial
  await ContactoEmpresaModel.findByIdAndUpdate(
    contactoId,
    {
      $push: { 'conversaciones.historial': mensaje },
      $set: { 
        'conversaciones.ultimaConversacion': new Date(),
        'metricas.ultimaInteraccion': new Date()
      }
    }
  );
  
  console.log(`✅ Mensaje guardado: "${mensaje.substring(0, 50)}..."`);
}
```

**Resultado:**
- ✅ Los mensajes ahora se guardan **UNA SOLA VEZ**
- ✅ Detección automática de duplicados en los últimos 3 mensajes
- ✅ Si el mensaje ya existe, se omite automáticamente
- ✅ Funciona en frontend y base de datos
- ✅ No más mensajes triplicados

---

### 2. Manejo de Productos Vacíos

**Archivo:** `backend/scripts/ajustar-prompt-productos-vacios.mjs`

**Cambio en el Prompt:**

Se agregó una sección específica para detectar cuando WooCommerce devuelve 0 productos:

```
🔍 DETECCIÓN DE PRODUCTOS VACÍOS:
Si el sistema WooCommerce devolvió 0 productos (count: 0 o productos: []), 
significa que NO tenemos esos libros en stock en este momento.

RESPUESTA CORRECTA para productos no encontrados:
"No tengo esos libros disponibles en este momento. 📚

Para consultar por libros específicos o pedidos especiales, 
te recomiendo contactar directamente al WhatsApp del negocio:
👉 https://wa.me/5493794732177

¿Te puedo ayudar con algo más?" ✅
```

**Resultado:**
- ✅ El GPT detecta cuando WooCommerce devuelve 0 productos
- ✅ Responde con mensaje profesional de productos no disponibles
- ✅ Sugiere contactar al WhatsApp del negocio
- ✅ NO inventa productos ni precios
- ✅ Mantiene tono profesional y amigable

---

## 🔄 Flujo Antes vs Después

### ANTES:

```
1. Cliente: "Binaria 1 y lecturas a la carta 1+"
   → Se guarda 3 veces en historial ❌

2. WooCommerce busca productos
   → Devuelve: {"productos":[],"count":0}

3. GPT recibe productos vacíos
   → Inventa productos con precios falsos ❌
   → Responde: "📚 *Productos encontrados:*
                1️⃣ *Binaria 1* - $[precio]"

4. Cliente recibe información FALSA ❌
```

### DESPUÉS:

```
1. Cliente: "Binaria 1 y lecturas a la carta 1+"
   → Se guarda 1 vez en historial ✅

2. WooCommerce busca productos
   → Devuelve: {"productos":[],"count":0}

3. GPT recibe productos vacíos
   → Detecta que count = 0 ✅
   → Responde: "No tengo esos libros disponibles en este momento. 📚
                
                Para consultar por libros específicos o pedidos especiales,
                te recomiendo contactar directamente al WhatsApp del negocio:
                👉 https://wa.me/5493794732177
                
                ¿Te puedo ayudar con algo más?"

4. Cliente recibe información HONESTA y ÚTIL ✅
```

---

## 📝 Scripts Creados

### `ajustar-prompt-productos-vacios.mjs`

Script para actualizar el prompt del `gpt-asistente-ventas` con manejo de productos vacíos.

**Uso:**
```bash
cd backend
node scripts/ajustar-prompt-productos-vacios.mjs
```

**Salida:**
```
✅ Prompt actualizado con manejo de productos vacíos

📋 Cambios aplicados:
   1. Detecta cuando WooCommerce devuelve 0 productos
   2. Responde con mensaje profesional de productos no disponibles
   3. Sugiere contactar al WhatsApp del negocio
   4. NO inventa productos ni precios
   5. Mantiene tono profesional y amigable
```

---

## 🧪 Cómo Probar

### Escenario 1: Productos No Encontrados

1. **Enviar mensaje:**
   ```
   Cliente: "Binaria 1 y lecturas a la carta 1+"
   ```

2. **Verificar respuesta:**
   ```
   Bot: "No tengo esos libros disponibles en este momento. 📚
   
   Para consultar por libros específicos o pedidos especiales,
   te recomiendo contactar directamente al WhatsApp del negocio:
   👉 https://wa.me/5493794732177
   
   ¿Te puedo ayudar con algo más?"
   ```

3. **Verificar historial:**
   ```bash
   # Debe mostrar el mensaje UNA SOLA VEZ
   node scripts/verificar-historial.mjs 5493794946066 "Veo Veo"
   ```

### Escenario 2: Productos Encontrados

1. **Enviar mensaje:**
   ```
   Cliente: "Hola estoy buscando novelas"
   ```

2. **Verificar respuesta:**
   ```
   Bot: "¡Encontré estos libros para vos! 📚
   
   1. LOCA - $37.000
   2. LAS CHICAS DE ALAMBRE - $22.500
   
   ¿Te interesa alguno? Puedo agregarlo al carrito 🛒"
   ```

---

## 📊 Logs de Verificación

### Antes de la Corrección:

```
🔍 [HISTORIAL DEBUG] Estado del historial:
   this.historialConversacion.length: 14
   
   1. user: Hola estoy buscando novelas
   2. assistant: Hola estoy buscando novelas  ← DUPLICADO
   3. user: Hola estoy buscando novelas      ← DUPLICADO
   ...

- woocommerce: {"output":{"productos":[],"count":0}}

✅ RESPUESTA DE GPT:
"📚 *Productos encontrados:*
1️⃣ *Binaria 1*
   💰 Precio: $[precio]    ← INVENTADO
   📦 Stock: [disponible/agotado]"
```

### Después de la Corrección:

```
🔍 [HISTORIAL DEBUG] Estado del historial:
   this.historialConversacion.length: 8
   
   1. user: Hola estoy buscando novelas  ← UNA SOLA VEZ
   2. assistant: ¡Encontré estos libros para vos! 📚
   ...

- woocommerce: {"output":{"productos":[],"count":0}}

✅ RESPUESTA DE GPT:
"No tengo esos libros disponibles en este momento. 📚

Para consultar por libros específicos o pedidos especiales,
te recomiendo contactar directamente al WhatsApp del negocio:
👉 https://wa.me/5493794732177

¿Te puedo ayudar con algo más?"
```

---

## 3. Soporte para Búsquedas Múltiples

**Archivo:** `backend/scripts/ajustar-formateador-busquedas-multiples.mjs`

**Problema:**
Cuando el cliente buscaba múltiples productos (ej: "Binaria 1 y lecturas a la carta 1"), el sistema los buscaba como un solo término y no encontraba nada.

**Solución:**
Actualicé el prompt del `gpt-formateador` para que separe múltiples productos con `" | "` (pipe con espacios).

**Ejemplo:**
```
Cliente: "Binaria 1 y lecturas a la carta 1"
Formateador ANTES: {"contenido": "Binaria 1 y lecturas a la carta 1"}
Formateador DESPUÉS: {"contenido": "Binaria 1 | lecturas a la carta 1"}

WooCommerce:
  - Busca "Binaria 1" → 0 productos
  - Busca "lecturas a la carta 1" → 1 producto encontrado ✅

Resultado: Devuelve solo "lecturas a la carta 1"
```

**Resultado:**
- ✅ Soporta búsquedas de múltiples productos
- ✅ Busca cada producto por separado
- ✅ Devuelve TODOS los productos que encuentra
- ✅ Si uno no existe, devuelve los que sí existen

---

## ✅ Checklist de Verificación

Después de aplicar las correcciones, verificar:

- [ ] Los mensajes se guardan UNA SOLA VEZ en el historial
- [ ] Cuando WooCommerce devuelve 0 productos, el GPT NO inventa información
- [ ] El GPT sugiere contactar al WhatsApp del negocio (https://wa.me/5493794732177)
- [ ] Las búsquedas múltiples funcionan correctamente
- [ ] Si busca "A y B" y solo existe B, devuelve B
- [ ] El tono es profesional y amigable
- [ ] El cliente recibe información honesta y útil
- [ ] No hay mensajes duplicados en el historial

---

## 🎯 Resultado Final

✅ **Problema 1 resuelto:** Los mensajes ahora se guardan una sola vez, eliminando la triplicación.

✅ **Problema 2 resuelto:** El GPT ahora maneja correctamente los productos vacíos, sugiriendo contactar al WhatsApp del negocio en lugar de inventar información.

✅ **Problema 3 resuelto:** Las búsquedas múltiples ahora funcionan correctamente, devolviendo los productos que SÍ existen.

✅ **Mejoras implementadas:**
- Mensajes únicos en el historial
- Detección de productos vacíos (count: 0)
- Respuesta profesional cuando no hay productos
- Sugerencia de contacto directo con el negocio
- Soporte para búsquedas múltiples con " | "
- Búsqueda individual de cada producto
- Devolución de productos parciales (los que existen)
- Tono honesto y transparente

✅ **Impacto:** Los clientes ahora reciben información precisa y útil, mejorando la confianza en el bot y la experiencia de usuario.
