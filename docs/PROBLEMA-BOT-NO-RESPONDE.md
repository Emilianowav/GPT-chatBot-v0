# Problema: Bot No Responde a Saludos

## 🔴 Problema Reportado

**Usuario:** "pero nunca me respondio la concha de tu amdre"

**Contexto:** El usuario escribió "holla" y el bot NO envió ninguna respuesta.

---

## 🔍 Diagnóstico

### Logs del Flujo

```
Usuario: "holla"
Clasificador → tipo_accion: "buscar_producto" ✅
Router Principal → Ruta "b" (Buscar Producto) ✅
Formateador → NO extrae contenido (variables_completas: false) ⚠️
Router Verificar → Ejecuta AMBAS rutas "b" simultáneamente ⚠️
  - WooCommerce → Sin parámetros de búsqueda
  - GPT Pedir Datos → Debería responder
Usuario → NO recibe respuesta ❌
```

### Causa Raíz

**El router "Verificar Datos" ejecuta AMBAS rutas sin condiciones:**

```javascript
// Router tiene 2 conexiones con sourceHandle: "b"
1. router → woocommerce (sin condiciones)
2. router → gpt-pedir-datos (sin condiciones)
```

**Problema:** Ambas rutas se ejecutan simultáneamente:
- WooCommerce intenta buscar sin `contenido` → Falla o devuelve vacío
- GPT Pedir Datos debería responder → Pero algo lo detiene

**Resultado:** El flujo se ejecuta pero **nunca llega a enviar respuesta al usuario**.

---

## ✅ Solución Implementada (Temporal)

### 1. Actualizar Clasificador

**Script:** `backend/scripts/ajustar-clasificador-v2.mjs`

**Cambio:** Los saludos se clasifican como `buscar_producto` (no se agregó `consulta_general` porque el router no tiene esa ruta).

```javascript
// Clasificador ahora maneja:
"Hola" → tipo_accion: "buscar_producto"
"Buenos días" → tipo_accion: "buscar_producto"
"Busco Harry Potter" → tipo_accion: "buscar_producto"
```

**Flujo esperado:**
1. Clasificador → `buscar_producto`
2. Formateador → NO extrae contenido de "hola"
3. Router → Ejecuta ambas rutas
4. WooCommerce → Busca sin parámetros, devuelve vacío
5. **GPT Pedir Datos → Responde: "¡Hola! ¿Qué libros buscás?"**

---

## ⚠️ Problema Pendiente

**El router ejecuta AMBAS rutas sin condiciones.**

Esto causa:
- Ejecución innecesaria de WooCommerce cuando no hay contenido
- Posible conflicto entre respuestas (WooCommerce + GPT Pedir Datos)
- Flujo ineficiente

### Solución Correcta (Requiere Frontend)

**Agregar condiciones al router "Verificar Datos":**

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

---

## 📊 Verificación

### Scripts Creados

1. **`verificar-prompt-clasificador.mjs`** - Verifica el prompt del clasificador
2. **`ver-flujo-verificar-datos.mjs`** - Muestra las conexiones del router
3. **`ver-flujo-completo-busqueda.mjs`** - Traza todo el flujo de búsqueda
4. **`verificar-ruta-consulta-general.mjs`** - Verifica si existe ruta para consultas generales
5. **`ajustar-clasificador-v2.mjs`** - Actualiza el clasificador

### Comandos de Verificación

```bash
# Ver estado del clasificador
node scripts/verificar-prompt-clasificador.mjs

# Ver rutas del router
node scripts/ver-flujo-verificar-datos.mjs

# Ver flujo completo
node scripts/ver-flujo-completo-busqueda.mjs
```

---

## 🎯 Próximos Pasos

1. ✅ Clasificador actualizado (saludos → buscar_producto)
2. ⚠️ **PENDIENTE:** Agregar condiciones al router desde el frontend
3. ⚠️ **PENDIENTE:** Verificar que GPT Pedir Datos responde correctamente
4. ⚠️ **PENDIENTE:** Probar con "hola" y verificar que el bot responde

---

## 📝 Notas Técnicas

### Por Qué No Se Agregó "consulta_general"

El router principal solo tiene la ruta "b" (buscar_producto). Agregar un nuevo tipo de acción `consulta_general` requeriría:
1. Agregar ruta "a" en el router principal
2. Conectar esa ruta a un nodo GPT de saludo
3. Configurar el nodo GPT para responder saludos

**Solución temporal:** Mantener solo 2 tipos (`buscar_producto` y `comprar`) y dejar que el formateador + router manejen los casos sin contenido.

### Arquitectura Actual del Flujo

```
1. WhatsApp → Mensaje del usuario
2. Clasificador → tipo_accion
3. Router Principal → Ruta según tipo_accion
4. Formateador → Extrae contenido
5. Router Verificar → ⚠️ Ejecuta AMBAS rutas sin condiciones
   ├─ WooCommerce → Busca productos
   └─ GPT Pedir Datos → Pide más información
6. GPT Asistente Ventas → Presenta productos
7. WhatsApp → Envía respuesta
```

**Problema:** El paso 5 ejecuta ambas rutas simultáneamente, causando conflictos.

---

## 🔧 Cambios Realizados

### Archivos Modificados

- **Ninguno** (solo se actualizó el prompt en MongoDB)

### Prompts Actualizados en MongoDB

- `gpt-clasificador-inteligente` - Ahora maneja saludos como `buscar_producto`

### Scripts Creados

- `backend/scripts/ajustar-clasificador-v2.mjs`
- `backend/scripts/verificar-prompt-clasificador.mjs`
- `backend/scripts/ver-flujo-verificar-datos.mjs`
- `backend/scripts/ver-flujo-completo-busqueda.mjs`
- `backend/scripts/verificar-ruta-consulta-general.mjs`

---

## ✅ Estado Actual

- ✅ Clasificador actualizado para manejar saludos
- ⚠️ Router ejecuta ambas rutas sin condiciones (requiere fix desde frontend)
- ⚠️ Necesita prueba para confirmar que el bot ahora responde

**Redeploy requerido:** NO (cambios solo en MongoDB)
**Configuración frontend requerida:** SÍ (agregar condiciones al router)
