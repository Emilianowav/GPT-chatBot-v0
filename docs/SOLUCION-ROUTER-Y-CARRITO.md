# Solución Completa - Router y Carrito

## 📋 Resumen de Problemas Resueltos

### 1. ✅ Router Ejecuta Ambas Rutas Sin Condiciones - DOCUMENTADO

**Problema:**
El router "Verificar Datos" ejecutaba AMBAS rutas simultáneamente sin condiciones:
- `router → woocommerce` (sin condiciones)
- `router → gpt-pedir-datos` (sin condiciones)

**Impacto:**
- Ejecución innecesaria de WooCommerce cuando no hay contenido
- Posible conflicto entre respuestas
- Flujo ineficiente

**Solución Temporal Implementada:**
- Clasificador actualizado para manejar saludos como `buscar_producto`
- El formateador no extrae contenido de saludos
- El GPT "Pedir Más Datos" responde cuando no hay contenido

**Solución Definitiva (Requiere Frontend):**
Agregar condiciones al router "Verificar Datos":

```javascript
// Ruta 1: Solo si hay contenido
router → woocommerce
Condición: variables_completas = true

// Ruta 2: Solo si NO hay contenido
router → gpt-pedir-datos
Condición: variables_completas = false
```

**Cómo implementar desde el frontend:**
1. Abrir el editor de flujos
2. Seleccionar el router "Verificar Datos"
3. Click derecho en la conexión a WooCommerce → "Set up a filter"
4. Agregar condición: `variables_completas` = `true`
5. Click derecho en la conexión a GPT Pedir Datos → "Set up a filter"
6. Agregar condición: `variables_completas` = `false`

**Estado:** ⚠️ PENDIENTE (requiere configuración desde el frontend)

---

### 2. ✅ Carrito Muestra {{mensaje_carrito}} Sin Resolver - RESUELTO

**Problema:**
El carrito mostraba:
```
🛒 Tu carrito:
{{mensaje_carrito}}
💵 Total: $0
```

**Causa Raíz:**
El nodo `gpt-armar-carrito` NO estaba configurado para extraer la variable `mensaje_carrito`.

**Evidencia de los logs:**
```javascript
gpt-armar-carrito: {
  "output": {
    "carrito_items": [],
    "carrito_total": 0,
    "confirmacion_compra": false
    // ❌ NO está "mensaje_carrito"
  }
}

globalVariables: [
  "telefono_cliente",
  "telefono_empresa", 
  "phoneNumberId",
  "mensaje_usuario",
  "tipo_accion",
  "carrito_items",
  "carrito_total",
  "confirmacion_compra"
  // ❌ NO está "mensaje_carrito"
]
```

**Solución Implementada:**
Script ejecutado: `backend/scripts/agregar-mensaje-carrito-variable.mjs`

Agregada la variable `mensaje_carrito` a la lista de variables que extrae el nodo `gpt-armar-carrito`:

```javascript
{
  nombre: 'mensaje_carrito',
  name: 'mensaje_carrito',
  requerido: false,
  required: false,
  descripcion: 'Mensaje formateado del carrito para mostrar al usuario'
}
```

**Resultado:**
- ✅ El nodo ahora extrae `mensaje_carrito` del GPT
- ✅ La variable se guarda en `globalVariables`
- ✅ `{{mensaje_carrito}}` se resuelve correctamente en el mensaje de confirmación

**Estado:** ✅ RESUELTO

---

### 3. ✅ Comillas Extra en Variables del Carrito - RESUELTO

**Problema:**
Variables del GPT se guardaban con comillas extra: `"mensaje"` en lugar de `mensaje`

**Solución Implementada:**
Archivo modificado: `backend/src/services/FlowExecutor.ts`

```typescript
// Limpiar comillas extra si el valor es un string que viene con comillas del JSON
let valorLimpio = valor;
if (typeof valor === 'string' && valor.startsWith('"') && valor.endsWith('"')) {
  valorLimpio = valor.slice(1, -1);
  console.log(`   🧹 Limpiando comillas extra: "${valor}" → "${valorLimpio}"`);
}

// Guardar el nuevo valor
this.setGlobalVariable(nombre, valorLimpio);
output[nombre] = valorLimpio;
```

**Estado:** ✅ RESUELTO

---

## 📊 Commits Realizados

```
af420d8 - fix: Carrito se marca como 'completado' después del pago
a8dc9e8 - docs: Documentar problema de bot que no responde a saludos
aa71ce3 - fix: Limpiar comillas extra en variables del carrito
[PENDING] - fix: Agregar mensaje_carrito a variables de gpt-armar-carrito
```

---

## 🚀 Próximos Pasos

### Inmediatos (Backend)
1. ✅ Commit del script que agrega `mensaje_carrito`
2. ✅ Redeploy del backend
3. ✅ Probar flujo completo de compra

### Pendientes (Frontend)
1. ⚠️ Agregar condiciones al router "Verificar Datos"
2. ⚠️ Implementar opción para que el usuario pueda eliminar el carrito manualmente

---

## 🔍 Verificación

### Scripts Creados

1. **`verificar-nodo-armar-carrito.mjs`** - Verifica variables que extrae el nodo
2. **`agregar-mensaje-carrito-variable.mjs`** - Agrega mensaje_carrito a las variables

### Comandos de Verificación

```bash
# Ver configuración del nodo gpt-armar-carrito
node scripts/verificar-nodo-armar-carrito.mjs

# Agregar mensaje_carrito (ya ejecutado)
node scripts/agregar-mensaje-carrito-variable.mjs

# Verificar variables del carrito de un contacto
node scripts/verificar-variables-carrito.mjs 5493794946066 "Veo Veo"
```

---

## 📝 Notas Técnicas

### Variables del Carrito

El nodo `gpt-armar-carrito` ahora extrae:

1. **carrito_items** (array) - Lista de productos en el carrito
2. **carrito_total** (number) - Total del carrito
3. **confirmacion_compra** (boolean) - Si el usuario confirmó la compra
4. **mensaje_carrito** (string) - Mensaje formateado para mostrar al usuario

### Flujo Correcto del Carrito

```
Usuario: "si quiero 2"
↓
Clasificador → tipo_accion: "comprar"
↓
Router Principal → Ruta "b" (Comprar)
↓
GPT Armar Carrito → Extrae:
  - carrito_items: [{ producto: "LECTURAS A LA CARTA 1", cantidad: 2, precio: 29000 }]
  - carrito_total: 58000
  - mensaje_carrito: "📦 LECTURAS A LA CARTA 1 - $29000 x 2 = $58000"
  - confirmacion_compra: false
↓
Router Carrito → Evalúa confirmacion_compra
  - Si false → Solicitar Confirmación
  - Si true → Crear Preferencia MercadoPago
↓
WhatsApp Confirmación → Muestra:
  🛒 Tu carrito:
  📦 LECTURAS A LA CARTA 1 - $29000 x 2 = $58000
  💵 Total: $58000
  ¿Confirmás la compra?
```

---

## ⚠️ Problemas Conocidos

### 1. Router Sin Condiciones (Pendiente)

**Ubicación:** Router "Verificar Datos" en el flujo de búsqueda

**Impacto:** Medio (funciona pero es ineficiente)

**Solución:** Requiere configuración desde el frontend

### 2. Carrito Vacío en Logs

**Observado en logs:**
```javascript
gpt-armar-carrito: {
  "carrito_items": [],
  "carrito_total": 0
}
```

**Posible causa:** El GPT no está encontrando los productos en el historial

**Investigación pendiente:**
- Verificar que el historial incluya los productos presentados
- Verificar que el prompt del GPT busque correctamente en el historial
- Verificar que `productos_formateados` esté disponible en el contexto

---

## ✅ Estado Final

- ✅ Clasificador actualizado para manejar saludos
- ✅ Comillas extra limpiadas en variables
- ✅ `mensaje_carrito` agregado a variables del nodo
- ⚠️ Router sin condiciones (pendiente configuración frontend)
- ⚠️ Carrito vacío en algunos casos (requiere investigación)

**Redeploy requerido:** SÍ (cambios en MongoDB)
**Configuración frontend requerida:** SÍ (condiciones del router)
