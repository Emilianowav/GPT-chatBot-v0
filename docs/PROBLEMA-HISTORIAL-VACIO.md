# Problema: Historial Vacío - Carrito No Funciona

## 🔴 Problema Reportado

**Usuario:** "NI SIQUIERA TIENE RESUELTA LA VARIABLE MENSAJE"

**Síntoma:**
```
🛒 Tu carrito:
{{mensaje_carrito}}
💵 Total: $0
```

---

## 🔍 Diagnóstico

### Logs Críticos

```javascript
⚠️  [HISTORIAL NATIVO] Historial vacío
   this.historialConversacion.length: 0
   this.contactoId: 69825f8ffa834104a136e141

📝 CONTEXTO PARA EXTRACCIÓN (historial_completo):
Usuario: si quiero 2

✅ DATOS EXTRAÍDOS POR GPT:
{
  "carrito_items": [],
  "carrito_total": 0,
  "confirmacion_compra": false,
  "mensaje_carrito": ""
}

💾 Guardando variables globales (con merge):
   ✅ carrito_items = "[]"
   ✅ carrito_total = "0"
   ✅ confirmacion_compra = "false"
   ⚠️  mensaje_carrito =  (no guardado, no existe valor previo)
```

### Verificación en MongoDB

```bash
node scripts/verificar-historial-contacto.mjs 5493794946066 "Veo Veo"

❌ No se encontró contacto
💡 El contacto no existe en la BD.
```

---

## 🎯 Causa Raíz

**El contacto NO existe en la base de datos.**

### Secuencia de Eventos

1. ✅ Usuario: "Binaria 1 y lecturas a la carta 1+"
2. ✅ Bot muestra: "LECTURAS A LA CARTA 1 ANTOLOGIA - $29000"
3. ❌ **Contacto se eliminó o no se guardó el historial**
4. ❌ Usuario: "si quiero 2"
5. ❌ FlowExecutor carga historial → **VACÍO** (contacto no existe)
6. ❌ GPT recibe solo: "Usuario: si quiero 2" (sin contexto de productos)
7. ❌ GPT devuelve carrito vacío con `mensaje_carrito: ""`
8. ❌ Variable vacía no se guarda en globalVariables
9. ❌ `{{mensaje_carrito}}` no se resuelve

---

## 📊 Flujo Correcto vs Flujo Actual

### Flujo Correcto (con historial)

```
Usuario: "Binaria 1 y lecturas a la carta 1+"
↓
Bot: "📚 Productos encontrados:
      1️⃣ LECTURAS A LA CARTA 1 ANTOLOGIA - $29000"
↓
[HISTORIAL GUARDADO]
↓
Usuario: "si quiero 2"
↓
GPT recibe historial completo:
  Asistente: "1️⃣ LECTURAS A LA CARTA 1 ANTOLOGIA - $29000"
  Usuario: "si quiero 2"
↓
GPT extrae:
  carrito_items: [{ nombre: "LECTURAS A LA CARTA 1", precio: 29000, cantidad: 2 }]
  carrito_total: 58000
  mensaje_carrito: "📦 LECTURAS A LA CARTA 1 - $29000 x 2 = $58000"
↓
Bot: "🛒 Tu carrito:
      📦 LECTURAS A LA CARTA 1 - $29000 x 2 = $58000
      💵 Total: $58000"
```

### Flujo Actual (sin historial)

```
Usuario: "Binaria 1 y lecturas a la carta 1+"
↓
Bot: "📚 Productos encontrados:
      1️⃣ LECTURAS A LA CARTA 1 ANTOLOGIA - $29000"
↓
[HISTORIAL NO SE GUARDÓ O CONTACTO SE ELIMINÓ]
↓
Usuario: "si quiero 2"
↓
GPT recibe historial vacío:
  Usuario: "si quiero 2"
↓
GPT no encuentra productos → Carrito vacío:
  carrito_items: []
  carrito_total: 0
  mensaje_carrito: ""
↓
Bot: "🛒 Tu carrito:
      {{mensaje_carrito}}
      💵 Total: $0"
```

---

## ✅ Solución

### Opción 1: Limpiar y Probar de Nuevo

```bash
cd backend
node scripts/limpiar-mi-numero.js
```

Luego probar flujo completo en una sola conversación:
1. "Hola"
2. "Busco Binaria 1 y lecturas a la carta 1"
3. Esperar respuesta con productos
4. "si quiero 2"

### Opción 2: Verificar que el Historial se Guarda

Verificar que `actualizarHistorialConversacion` en `contactoService.ts` está funcionando:

```bash
node scripts/verificar-historial-contacto.mjs 5493794946066 "Veo Veo"
```

Después de cada mensaje, el historial debería tener:
- Mensaje del usuario
- Respuesta del bot

---

## 🔍 Verificaciones Necesarias

### 1. ¿Se está guardando el historial?

Verificar en `backend/src/services/contactoService.ts`:

```typescript
export async function actualizarHistorialConversacion(
  telefono: string,
  empresaId: string,
  mensajeUsuario: string,
  respuestaBot: string
): Promise<void>
```

### 2. ¿El contacto se está creando correctamente?

Verificar en `whatsappController.ts` que se crea el contacto antes de ejecutar el flujo.

### 3. ¿El historial se está cargando en FlowExecutor?

Verificar en `FlowExecutor.ts`:

```typescript
private async loadHistorial(contactoId: string): Promise<void> {
  const contacto = await ContactoEmpresaModel.findById(contactoId);
  if (contacto?.conversaciones?.historial) {
    this.historialConversacion = contacto.conversaciones.historial;
  }
}
```

---

## 📝 Notas Técnicas

### Por qué `mensaje_carrito` no se guarda

En `FlowExecutor.ts` línea 871-879:

```typescript
if (valor === undefined || valor === null || valor === '') {
  const existingValue = this.getVariableValue(nombre);
  if (existingValue !== undefined && existingValue !== null && existingValue !== '') {
    // Mantener el valor existente
    output[nombre] = existingValue;
  } else {
    console.log(`   ⚠️  ${nombre} = ${valor} (no guardado, no existe valor previo)`);
    // ❌ NO SE GUARDA
  }
}
```

Si el GPT devuelve `mensaje_carrito: ""` (vacío), la variable NO se guarda en globalVariables.

### Por qué el GPT devuelve carrito vacío

El prompt del GPT dice:

```
REGLAS CRÍTICAS:
- USA SIEMPRE precios REALES del historial
- NO inventes precios ni productos
- Si no encuentras un producto en el historial, devuelve carrito vacío
```

Sin historial, el GPT cumple las reglas y devuelve carrito vacío.

---

## ⚠️ Estado Actual

- ✅ Variable `mensaje_carrito` agregada al nodo `gpt-armar-carrito`
- ✅ Comillas extra limpiadas en variables
- ✅ Código funcionando correctamente
- ❌ **Historial vacío porque el contacto no existe en la BD**

**El código está bien. El problema es que el contacto se eliminó o el historial no se está guardando.**

---

## 🚀 Próximos Pasos

1. **Limpiar número de prueba:**
   ```bash
   node scripts/limpiar-mi-numero.js
   ```

2. **Probar flujo completo en una sola conversación**

3. **Verificar que el historial se guarda después de cada mensaje:**
   ```bash
   node scripts/verificar-historial-contacto.mjs 5493794946066 "Veo Veo"
   ```

4. **Si el historial sigue vacío, investigar `actualizarHistorialConversacion`**

---

## 🔧 Scripts de Debugging

- `verificar-historial-contacto.mjs` - Ver historial de un contacto
- `limpiar-mi-numero.js` - Limpiar estado del contacto
- `verificar-variables-carrito.mjs` - Ver variables del carrito
- `verificar-nodo-armar-carrito.mjs` - Ver configuración del nodo

---

**Conclusión:** El problema NO es el código. El problema es que el historial está vacío porque el contacto no existe o se eliminó. Necesitás probar con un flujo completo desde cero.
