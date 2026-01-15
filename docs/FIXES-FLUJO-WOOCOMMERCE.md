# Fixes Aplicados al Flujo WooCommerce

## 📋 Problemas Identificados y Solucionados

### 1. ❌ WooCommerce no encontraba productos

**Problema:**
```
Usuario: "Busco harry potter 5"
WooCommerce busca: "Harry Potter 5" (literal)
Resultado: 0 productos encontrados
```

Los productos en la tienda se llaman "HARRY POTTER Y LA ORDEN DEL FENIX", no "Harry Potter 5".

**Solución:**
Normalización automática de búsqueda en `FlowExecutor.ts`:

```typescript
// Normalizar término de búsqueda: "Harry Potter 5" -> "Harry Potter"
if (params.search) {
  const searchNormalized = String(params.search)
    .replace(/\s*\d+\s*$/, '') // Eliminar números al final
    .replace(/\s+/g, ' ')       // Normalizar espacios
    .trim();
  
  params.search = searchNormalized;
}
```

**Resultado:**
```
🔍 Búsqueda original: "Harry Potter 5"
🔍 Búsqueda normalizada: "Harry Potter"
✅ Productos encontrados: 7
```

---

### 2. ❌ Conversación muy robótica y tosca

**Problema:**
```
Usuario: "Hola"
Bot: "¿Me podrías decir el título del libro que estás buscando?"
```

El bot pedía datos inmediatamente sin saludar ni manejar tópicos generales.

**Solución:**
Prompts mejorados para conversación natural:

#### GPT Formateador
- Extrae SOLO si el usuario menciona libros
- Si solo saluda → devuelve todo `null`
- Normaliza títulos automáticamente

#### GPT Pedir Datos
- Cambió de modo "extracción" a modo "conversacional"
- Maneja tópicos generales
- Saluda amigablemente
- No pide datos si el usuario no busca libros

#### GPT Asistente
- Más entusiasta y amigable
- Ofrece alternativas si no hay productos
- Usa emojis con moderación

**Resultado:**
```
Usuario: "Hola"
Bot: "¡Hola! 😊 Me alegra verte por aquí. ¿Estás buscando algún libro en particular o necesitas alguna recomendación?"
```

---

### 3. ❌ Variables opcionales tratadas como obligatorias

**Problema:**
El nodo `gpt-pedir-datos` tenía `variablesRecopilar` configurado, lo que hacía que:
1. Entrara al modo legacy de extracción
2. Marcara TODAS las variables como faltantes
3. Pidiera datos incluso cuando el usuario solo saludaba

**Solución:**
```javascript
// Configuración corregida
{
  "tipo": "conversacional",  // Antes: "formateador"
  "variablesRecopilar": []   // Antes: [titulo, editorial, edicion]
}
```

**Resultado:**
El nodo ahora SOLO genera mensajes conversacionales, NO extrae variables.

---

## ✅ Flujo Correcto Actual

### Conversación 1: Saludo Simple

```
Usuario: "Hola"
  ↓
Formateador: {"titulo": null, "editorial": null, "edicion": null}
  variables_faltantes: ["titulo"]
  ↓
Router: variables_faltantes not_empty = TRUE
  ↓
GPT Pedir Datos: Genera mensaje conversacional
  "¡Hola! 😊 ¿En qué puedo ayudarte?"
  ↓
WhatsApp: Envía mensaje
  ↓
FIN (espera respuesta)
```

### Conversación 2: Búsqueda de Libro

```
Usuario: "Busco harry potter 5 puede ser ?"
  ↓
Formateador: {"titulo": "Harry Potter y la Orden del Fénix", ...}
  variables_completas: true
  variables_faltantes: []
  ↓
Router: variables_completas = TRUE
  ↓
WooCommerce: Normaliza búsqueda "Harry Potter 5" → "Harry Potter"
  Encuentra: 7 productos
  Simplifica: Solo titulo, precio, url, stock
  ↓
GPT Asistente: Presenta productos de forma atractiva
  ↓
WhatsApp: Envía mensaje con productos
  ↓
FIN
```

---

## 📊 Comparación Antes/Después

### Tokens Usados

| Aspecto | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Productos WooCommerce | ~9300 tokens | ~500 tokens | 94% ↓ |
| Respuesta GPT | Error (límite) | 788 tokens | ✅ |

### Experiencia de Usuario

| Aspecto | Antes | Después |
|---------|-------|---------|
| Saludo | "¿Título del libro?" | "¡Hola! 😊 ¿En qué puedo ayudarte?" |
| Búsqueda | 0 productos | 7 productos encontrados |
| Tono | Robótico | Natural y amigable |
| Tópicos | No maneja | Maneja conversación general |

---

## 🔧 Archivos Modificados

### Backend

1. **`src/services/FlowExecutor.ts`**
   - Líneas 1038-1050: Normalización de búsqueda WooCommerce
   - Líneas 81-103: Método `simplifyProductsForGPT()`

### MongoDB (Nodos del Flujo)

1. **`gpt-formateador`**
   - `extractionConfig.systemPrompt`: Nuevo prompt que NO marca variables faltantes en saludos

2. **`gpt-pedir-datos`**
   - `tipo`: "conversacional" (antes: "formateador")
   - `variablesRecopilar`: [] (antes: [titulo, editorial, edicion])
   - `systemPrompt`: Prompt conversacional con manejo de tópicos

3. **`gpt-asistente-ventas`**
   - `systemPrompt`: Prompt más amigable y entusiasta

---

## 🚀 Scripts de Fix Aplicados

```bash
# 1. Normalización de búsqueda (ya en código)
npm run build

# 2. Prompts conversacionales
node scripts/fix-prompts-conversacion-natural.cjs

# 3. GPT Pedir Datos conversacional
node scripts/fix-gpt-pedir-datos-conversacional.cjs

# 4. Formateador no marca faltantes en saludos
node scripts/fix-formateador-no-marcar-faltantes.cjs

# 5. Compilar cambios
npm run build
```

---

## 📝 Configuración para el Frontend

### Nodo WooCommerce

El nodo ahora soporta `productFieldMappings` para elegir qué campos enviar al GPT:

```json
{
  "productFieldMappings": [
    { "source": "name", "target": "titulo" },
    { "source": "price", "target": "precio" },
    { "source": "permalink", "target": "url" },
    { "source": "stock_status", "target": "stock" }
  ]
}
```

**Campos disponibles:**
- `name`, `price`, `regular_price`, `sale_price`
- `permalink`, `stock_status`, `stock_quantity`
- `sku`, `image`, `categories`

Ver documentación completa en: `docs/CONFIGURACION-WOOCOMMERCE-GPT.md`

---

## ✅ Testing

### Test 1: Saludo Simple
```bash
node scripts/test-solo-saludo.cjs
```

**Resultado esperado:**
- Formateador: `titulo = null`
- Bot: Saludo amigable sin pedir datos específicos

### Test 2: Búsqueda de Producto
```bash
node scripts/test-conversacion-completa.cjs
```

**Resultado esperado:**
- Normalización: "Harry Potter 5" → "Harry Potter"
- WooCommerce: 7 productos encontrados
- Bot: Presenta productos con formato profesional

---

## 🎯 Próximos Pasos

1. **Frontend:** Implementar select múltiple para `productFieldMappings`
2. **Tópicos:** Expandir manejo de conversaciones generales
3. **Carrito:** Implementar fase de agregar al carrito y checkout
4. **Personalización:** Permitir configurar personalidad del bot desde el frontend

---

## 📞 Soporte

Si el flujo no funciona correctamente:

1. Verificar que todos los scripts de fix se ejecutaron
2. Compilar el backend: `npm run build`
3. Limpiar estado del usuario: `node scripts/limpiar-mi-numero.js`
4. Revisar logs del backend para errores específicos
