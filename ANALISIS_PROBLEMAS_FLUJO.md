# Análisis de Problemas del Flujo WooCommerce

## 🔍 Problemas Identificados

### **Problema 1: Primera búsqueda con placeholder sin resolver**
```
Usuario: "Estoy buscando la dos de Harry Potter"
Bot: "📚 Encontré 0 resultados para '{{titulo_libro}}': []"
```

**Causa Root**:
El flujo ejecuta los nodos en este orden:
1. `gpt-conversacional` → Responde al usuario
2. `whatsapp-respuesta-gpt` → Envía respuesta
3. `gpt-formateador` → Extrae datos (AQUÍ se crea `titulo_libro`)
4. `validador-datos` → Valida si existe `titulo_libro`
5. `router-validacion` → Decide si buscar
6. `woocommerce-search` → **BUSCA CON EL VALOR ACTUAL**

**El problema**: En el PRIMER mensaje, cuando llega a `woocommerce-search`, el `titulo_libro` todavía no existe en `globalVariables` porque el `gpt-formateador` se ejecuta EN EL MISMO CICLO pero ANTES de que WooCommerce busque.

**Evidencia en logs**:
```
🔄 3. OpenAI (ChatGPT) [gpt-formateador]
   ✅ Datos extraídos: {"titulo_libro":"Harry Potter y la cámara secreta"}
   💾 Guardando variable global: titulo_libro = "Harry Potter y la cámara secreta"
   
🔄 6. WooCommerce
   📦 Parámetros: {"search":"Harry Potter y la cámara secreta"}
```

**¿Por qué busca con placeholder?**: Porque el mensaje de WhatsApp usa `{{titulo_libro}}` pero cuando se RESUELVE la expresión, la variable aún no existe o tiene un valor anterior.

---

### **Problema 2: Búsquedas múltiples innecesarias**

Cada mensaje del usuario dispara TODO el flujo de nuevo:
- Mensaje 1: Ejecuta 9 nodos
- Mensaje 2: Ejecuta 9 nodos OTRA VEZ
- Mensaje 3: Ejecuta 9 nodos OTRA VEZ

**Causa Root**: 
El flujo NO tiene estado persistente. Cada mensaje es tratado como una conversación nueva, por lo que:
1. El `gpt-formateador` vuelve a analizar TODO el historial
2. El `validador-datos` vuelve a validar
3. El `router-validacion` vuelve a decidir
4. WooCommerce vuelve a buscar

**Evidencia**:
```
Mensaje 1: "Estoy buscando la dos de Harry Potter"
→ Extrae: "Harry Potter y la cámara secreta"
→ Busca en WooCommerce
→ Encuentra 1 producto

Mensaje 2: "Cualquiera está bien"
→ Extrae OTRA VEZ: "Harry Potter y la cámara secreta"
→ Busca OTRA VEZ en WooCommerce
→ Encuentra OTRA VEZ 1 producto

Mensaje 3: "Si"
→ Extrae OTRA VEZ: "Harry Potter y la cámara secreta"
→ Busca OTRA VEZ en WooCommerce
→ Encuentra OTRA VEZ 1 producto
```

---

### **Problema 3: Falta de lógica de "ya completado"**

El flujo no tiene un mecanismo para saber si ya completó la búsqueda y debe pasar a la siguiente etapa (ej: confirmar compra, agregar al carrito, etc.).

**Solución esperada**:
- Primera vez: Buscar en WooCommerce
- Siguientes veces: NO buscar de nuevo, usar resultados anteriores

---

## 💡 Soluciones Propuestas

### **Solución 1: Validar que `titulo_libro` NO sea un placeholder**

**Implementación**:
Modificar la condición del `router-validacion` para que verifique:
```javascript
// ANTES
"{{titulo_libro}} exists"

// DESPUÉS
"{{titulo_libro}} exists AND {{titulo_libro}} not contains '{{'"
```

Esto evita que busque si `titulo_libro` contiene literalmente `{{`.

---

### **Solución 2: Agregar flag de "búsqueda_completada"**

**Implementación**:
1. Cuando WooCommerce busca exitosamente, guardar:
   ```javascript
   globalVariables.busqueda_completada = true
   globalVariables.productos_encontrados = [...productos]
   ```

2. Modificar `router-validacion` para que verifique:
   ```javascript
   "{{titulo_libro}} exists AND {{busqueda_completada}} not exists"
   ```

3. Si `busqueda_completada` existe, saltar WooCommerce y usar `productos_encontrados` directamente.

---

### **Solución 3: Optimizar flujo con routers condicionales**

**Nuevo flujo propuesto**:
```
1. Webhook → gpt-conversacional → whatsapp-respuesta-gpt
2. gpt-formateador (extrae datos)
3. router-estado:
   - Si busqueda_completada exists → ir a router-siguiente-accion
   - Si busqueda_completada not exists → ir a validador-datos
4. validador-datos → router-validacion → woocommerce-search
5. Guardar busqueda_completada = true
6. router-productos → whatsapp-resultados
7. router-siguiente-accion:
   - "quiero comprar" → proceso-compra
   - "dame más info" → detalle-producto
   - otro → gpt-conversacional (loop)
```

---

## 🔧 Implementación Inmediata

### **Paso 1: Modificar condición del router-validacion**

Cambiar de:
```
"{{titulo_libro}} exists"
```

A:
```
"{{titulo_libro}} exists AND {{titulo_libro}} length > 5"
```

Esto asegura que `titulo_libro` tenga un valor real, no un placeholder vacío.

---

### **Paso 2: Agregar logging detallado**

En `FlowExecutor.ts`, agregar logs para rastrear:
```typescript
console.log('🔍 [ROUTER] Evaluando condición:', condition);
console.log('   Variable titulo_libro:', this.getGlobalVariable('titulo_libro'));
console.log('   Tipo:', typeof this.getGlobalVariable('titulo_libro'));
console.log('   Existe en globalVariables:', 'titulo_libro' in this.globalVariables);
```

---

### **Paso 3: Modificar resolución de variables en WhatsApp**

En `resolveWhatsAppMessage`, agregar validación:
```typescript
// Si la variable no existe, NO reemplazar el placeholder
if (variableValue === undefined || variableValue === null) {
  console.warn(`⚠️ Variable ${varName} no existe, manteniendo placeholder`);
  return match; // Mantener {{titulo_libro}} sin resolver
}
```

---

## 🧪 Plan de Testing

1. **Limpiar estado**: `node scripts/limpiar-mi-numero.js`
2. **Mensaje 1**: "Hola"
   - ✅ Debe responder sin buscar en WooCommerce
3. **Mensaje 2**: "Estoy buscando la dos de Harry Potter"
   - ✅ Debe extraer "Harry Potter y la cámara secreta"
   - ✅ Debe buscar UNA SOLA VEZ en WooCommerce
   - ✅ Debe mostrar resultados
4. **Mensaje 3**: "Cualquiera está bien"
   - ✅ NO debe buscar de nuevo en WooCommerce
   - ✅ Debe usar resultados anteriores
5. **Mensaje 4**: "Si"
   - ✅ NO debe buscar de nuevo en WooCommerce
   - ✅ Debe pasar a siguiente acción (compra/info)

---

## 📋 Checklist de Correcciones

- [ ] Modificar condición de `router-validacion`
- [ ] Agregar flag `busqueda_completada` en WooCommerce node
- [ ] Agregar router de estado antes de validador
- [ ] Mejorar logging en FlowExecutor
- [ ] Validar que variables existan antes de resolver placeholders
- [ ] Testear flujo completo
- [ ] Documentar cambios en README
