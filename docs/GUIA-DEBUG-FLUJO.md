# Guía de Debug del Flujo WooCommerce

## 🔍 Logs Críticos para Debug

### 1. **Formateador (Extracción de Variables)**

#### Logs a buscar:
```
📝 CONTEXTO PARA EXTRACCIÓN (historial_completo):
📋 Variables a extraer: titulo*, editorial, edicion
✅ DATOS EXTRAÍDOS POR GPT:
📊 Resumen: 3 variable(s) extraída(s)
💾 Guardando variables globales (con merge):
📋 VARIABLES GLOBALES ACTUALES:
🔍 VALIDANDO VARIABLES (requerido vs opcional):
   📌 titulo: requerido=true, valor=VACÍO
      ⚠️  → FALTANTE (requerida y vacía)
📊 VALIDACIÓN DE VARIABLES:
   variables_completas: false
   variables_faltantes: ["titulo"]
```

#### Qué verificar:
- ✅ **Contexto**: ¿El historial contiene la información necesaria?
- ✅ **Datos extraídos**: ¿GPT extrajo correctamente del contexto?
- ✅ **Variables globales**: ¿Se guardaron correctamente?
- ✅ **Validación**: ¿Las variables requeridas están marcadas correctamente?

#### Problemas comunes:
1. **GPT extrae null cuando debería extraer valor**
   - Revisar prompt del formateador
   - Verificar que el contexto tenga la información

2. **Variables opcionales marcadas como faltantes**
   - Verificar `requerido: false` en `extractionConfig.variables`
   - Buscar log: `✅ → OK (opcional, puede estar vacía)`

3. **Variables no se guardan**
   - Buscar log: `⚠️  ${nombre} = null (no guardado, no existe valor previo)`
   - Verificar que GPT esté devolviendo valores no-null

---

### 2. **Router (Decisiones de Flujo)**

#### Logs a buscar:
```
🔀 NODO ROUTER
📊 VARIABLES GLOBALES DISPONIBLES (TODAS):
🔍 VERIFICACIÓN DE VARIABLES CRÍTICAS:
   titulo exists: true
   titulo value: "Harry Potter y la Orden del Fénix"
📋 Rutas disponibles: 2

🔍 EVALUANDO RUTAS:
   Ruta: Pedir Datos (pedir-datos)
   Condición: variables_faltantes not_empty
   Resultado: ❌ FALSE

   Ruta: WooCommerce (woocommerce)
   Condición: variables_completas = true
   Resultado: ✅ TRUE

✅ RUTA SELECCIONADA: WooCommerce
```

#### Qué verificar:
- ✅ **Variables disponibles**: ¿Están todas las variables necesarias?
- ✅ **Condiciones**: ¿Se evalúan correctamente?
- ✅ **Ruta seleccionada**: ¿Es la esperada?

#### Problemas comunes:
1. **Router va a ruta incorrecta**
   - Verificar condiciones en edges del flujo
   - Buscar log de evaluación de cada ruta

2. **Variables no están disponibles en router**
   - Verificar que el formateador las guardó correctamente
   - Buscar en "VARIABLES GLOBALES DISPONIBLES"

---

### 3. **WooCommerce (Búsqueda de Productos)**

#### Logs a buscar:
```
🛒 NODO WOOCOMMERCE
📦 Parámetros: {"search":"Harry Potter 5",...}
🔍 Búsqueda original: "Harry Potter 5"
🔍 Búsqueda normalizada: "Harry Potter"
✅ Productos encontrados: 7
📊 Productos simplificados para GPT: 7
📋 Campos por producto: titulo, precio, url, stock
🔗 Ejemplo URL generada: https://www.veoveolibros.com.ar/producto/harry-potter-y-la-orden-del-fenix
💰 Ejemplo precio: $49000
```

#### Qué verificar:
- ✅ **Normalización**: ¿Se eliminaron números correctamente?
- ✅ **Productos encontrados**: ¿Hay resultados?
- ✅ **URLs**: ¿Son completas (con https://)?
- ✅ **Simplificación**: ¿Solo tiene campos necesarios?

#### Problemas comunes:
1. **No se encuentran productos**
   ```
   ⚠️  ADVERTENCIA: No se encontraron productos para "..."
   💡 Sugerencia: Verificar que el término de búsqueda coincida con productos en WooCommerce
   ```
   - Verificar que la búsqueda normalizada sea correcta
   - Revisar catálogo de WooCommerce

2. **URLs incompletas (sin https://)**
   - Buscar log: `🔗 Ejemplo URL generada:`
   - Verificar que `connection.eshopUrl` esté configurado

3. **Error en simplificación**
   ```
   ❌ ERROR simplificando productos: ...
   ```
   - Verificar estructura de productos de WooCommerce
   - Revisar método `simplifyProductsForGPT`

---

### 4. **GPT Asistente (Presentación de Productos)**

#### Logs a buscar:
```
🤖 NODO GPT
🔍 [AUDITORÍA] SYSTEM PROMPT DESPUÉS DE RESOLVER VARIABLES:
Eres un asistente de ventas amigable para una librería.

PRODUCTOS DISPONIBLES:
[
  {
    "titulo": "HARRY POTTER Y LA ORDEN DEL FENIX",
    "precio": "49000",
    "url": "https://www.veoveolibros.com.ar/producto/...",
    "stock": "Disponible"
  }
]

🤖 Llamando a OpenAI (gpt-4)...
✅ RESPUESTA DE GPT:
"¡Hola! Encontré exactamente el libro que estás buscando. 🎉..."
Tokens: 490, Costo: $0.01818
```

#### Qué verificar:
- ✅ **Productos en prompt**: ¿Están los productos correctos?
- ✅ **URLs en prompt**: ¿Son completas?
- ✅ **Respuesta GPT**: ¿Es natural y presenta bien los productos?
- ✅ **Tokens**: ¿Está dentro del límite?

#### Problemas comunes:
1. **GPT inventa productos**
   - Verificar que `woocommerce.productos` tenga datos reales
   - Buscar en "PRODUCTOS DISPONIBLES" del prompt

2. **URLs no clickeables en WhatsApp**
   - Verificar formato: `[texto](https://url)`
   - URLs deben empezar con `https://`

3. **Exceso de tokens**
   - Verificar cantidad de productos simplificados
   - Máximo recomendado: 5-10 productos

---

## 🐛 Errores Comunes y Soluciones

### Error 1: "Variables faltantes en saludo"
```
Usuario: "Hola"
variables_faltantes: ["titulo"]
```

**Causa:** Formateador marca variables como faltantes incluso cuando el usuario no menciona nada.

**Solución:**
1. Verificar prompt del formateador
2. Debe devolver `null` para todas las variables si el usuario no menciona libros
3. Ejecutar: `node scripts/fix-formateador-universal.cjs`

---

### Error 2: "WooCommerce no encuentra productos"
```
Búsqueda: "Harry Potter 5"
Productos encontrados: 0
```

**Causa:** Búsqueda literal no coincide con nombres en catálogo.

**Solución:**
1. Verificar normalización en logs: `🔍 Búsqueda normalizada:`
2. Debe eliminar números: "Harry Potter 5" → "Harry Potter"
3. Ya implementado en `FlowExecutor.ts` líneas 1067-1076

---

### Error 3: "URLs sin https://"
```
url: "harry-potter-y-la-orden-del-fenix"
```

**Causa:** WooCommerce devuelve solo slug, no permalink completo.

**Solución:**
1. Verificar log: `🔗 Ejemplo URL generada:`
2. Debe construir URL completa con baseUrl
3. Ya implementado en `simplifyProductsForGPT` líneas 98-105

---

### Error 4: "Conversación robótica"
```
Bot: "¿Me podrías decir el título del libro que estás buscando?"
```

**Causa:** GPT Pedir Datos está en modo extracción en lugar de conversacional.

**Solución:**
1. Verificar tipo del nodo: debe ser `conversacional`
2. `variablesRecopilar` debe estar vacío: `[]`
3. Ejecutar: `node scripts/fix-gpt-pedir-datos-conversacional.cjs`

---

## 📊 Checklist de Debug

### Antes de debuggear:
- [ ] Limpiar estado del usuario: `node scripts/limpiar-mi-numero.js`
- [ ] Compilar backend: `npm run build`
- [ ] Verificar que scripts de MongoDB se ejecutaron

### Durante el debug:
- [ ] Buscar logs del formateador (📝, 📋, 🔍)
- [ ] Buscar logs del router (🔀, ✅ RUTA SELECCIONADA)
- [ ] Buscar logs de WooCommerce (🛒, 🔍 Búsqueda)
- [ ] Buscar logs del GPT Asistente (🤖, PRODUCTOS DISPONIBLES)

### Verificar:
- [ ] Variables extraídas correctamente
- [ ] Router selecciona ruta correcta
- [ ] WooCommerce encuentra productos
- [ ] URLs son completas (https://)
- [ ] Respuesta del bot es natural

---

## 🔧 Scripts de Fix

```bash
# Formateador universal (cualquier estructura)
node scripts/fix-formateador-universal.cjs

# Prompts conversacionales
node scripts/fix-prompts-conversacion-natural.cjs

# GPT Pedir Datos conversacional
node scripts/fix-gpt-pedir-datos-conversacional.cjs

# Limpiar estado de usuario
node scripts/limpiar-mi-numero.js

# Test completo
node scripts/test-conversacion-completa.cjs
```

---

## 📞 Soporte Rápido

**Problema:** No sé qué está fallando

**Solución:** Buscar en logs estos emojis en orden:
1. 📝 (Formateador - extracción)
2. 🔀 (Router - decisión)
3. 🛒 (WooCommerce - búsqueda)
4. 🤖 (GPT - respuesta)

Identificar en cuál de estos 4 pasos está el problema y revisar la sección correspondiente arriba.
