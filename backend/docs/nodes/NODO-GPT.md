# Nodo GPT - Documentación Completa

## 📋 Descripción General

El nodo GPT permite integrar modelos de lenguaje de OpenAI en el flujo conversacional. Soporta tres modos de operación: **Conversacional**, **Formateador** y **Transform**.

---

## 🎯 Tipos de Nodo GPT

### 1. GPT Conversacional

**Propósito:** Mantener conversaciones naturales con el usuario, respondiendo preguntas y recopilando información de forma dinámica.

**Características:**
- ✅ Mantiene historial de conversación
- ✅ Acceso a tópicos globales y locales
- ✅ Puede recopilar variables de forma natural
- ✅ Responde en lenguaje natural

**Configuración:**

```json
{
  "tipo": "conversacional",
  "systemPrompt": "Eres un asistente amigable...",
  "temperatura": 0.7,
  "maxTokens": 500,
  "modelo": "gpt-4",
  "personalidad": "Amigable y profesional",
  "topicos": [
    {
      "id": "topico-1",
      "titulo": "Horarios",
      "contenido": "Lun-Vie 9-18hs",
      "keywords": ["horario", "hora"]
    }
  ],
  "variablesRecopilar": [
    {
      "nombre": "nombre",
      "descripcion": "Nombre del cliente",
      "obligatorio": true,
      "tipo": "texto"
    }
  ]
}
```

**System Prompt:**

```
Eres un asistente de [EMPRESA].

INFORMACIÓN DISPONIBLE (NO INVENTES):
{{topicos.horarios.descripcion}}
{{topicos.medios_pago.descripcion}}

UBICACIÓN: {{topicos.empresa.ubicacion}}
WHATSAPP: {{topicos.empresa.whatsapp_link}}

TU TRABAJO:
1. Responde preguntas del usuario usando la información disponible
2. Recopila información de forma natural (no forzada)
3. Sé conversacional y amigable

REGLAS:
- ❌ NO inventes información
- ✅ USA SOLO la información disponible arriba
- ✅ Si no sabes algo, deriva a WhatsApp
```

**Variables Disponibles:**
- `{{topicos.*}}` - Tópicos globales del flujo
- `{{variable_nombre}}` - Variables globales recopiladas
- `{{nodo_id.campo}}` - Output de nodos anteriores

**Output:**
```json
{
  "response": "¡Hola! ¿En qué puedo ayudarte?",
  "variables_recopiladas": {
    "nombre": "Juan"
  }
}
```

---

### 2. GPT Formateador (Extracción de Datos)

**Propósito:** Extraer información estructurada de conversaciones en formato JSON.

**Características:**
- ✅ Extrae datos en formato JSON
- ✅ Valida variables requeridas vs opcionales
- ✅ Genera `variables_completas` y `variables_faltantes`
- ✅ Soporta búsqueda múltiple (separador `" | "`)

**Configuración:**

```json
{
  "tipo": "formateador",
  "extractionConfig": {
    "systemPrompt": "Extrae información estructurada...",
    "variablesToExtract": [
      {
        "nombre": "titulo",
        "tipo": "string",
        "descripcion": "Título del libro",
        "requerido": true
      },
      {
        "nombre": "editorial",
        "tipo": "string",
        "descripcion": "Editorial del libro",
        "requerido": false
      }
    ]
  }
}
```

**System Prompt (Universal):**

```
Eres un asistente experto que extrae información estructurada de conversaciones.

Tu trabajo es extraer las variables definidas en {{extractionConfig.variablesToExtract}} del contexto de la conversación.

REGLA CRÍTICA:
Si el usuario NO menciona información relevante → Devuelve null para esas variables

BÚSQUEDA MÚLTIPLE:
Si el usuario menciona VARIOS items → Extrae TODOS separados por " | "

EJEMPLOS:

Usuario: "Hola"
→ {"titulo": null, "editorial": null}

Usuario: "Busco Harry Potter 2"
→ {"titulo": "Harry Potter y la Cámara Secreta", "editorial": null}

Usuario: "Busco Harry Potter 2 y 5"
→ {"titulo": "Harry Potter y la Cámara Secreta | Harry Potter y la Orden del Fénix", "editorial": null}

IMPORTANTE:
- Responde ÚNICAMENTE con JSON válido
- Si hay múltiples items, sepáralos con " | "
- No inventes información que el usuario no mencionó
```

**Proceso de Extracción:**

1. **Construcción del contexto:**
```javascript
const contexto = `
HISTORIAL DE CONVERSACIÓN:
${historialConversacion.join('\n')}

MENSAJE ACTUAL:
${mensajeUsuario}

VARIABLES A EXTRAER:
${JSON.stringify(variablesToExtract)}
`;
```

2. **Llamada a GPT:**
```javascript
const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: contexto }
  ],
  temperature: 0.3 // Baja temperatura para extracción precisa
});
```

3. **Validación y guardado:**
```javascript
const datosExtraidos = JSON.parse(response.content);

// Guardar en variables globales
for (const [nombre, valor] of Object.entries(datosExtraidos)) {
  if (valor !== null && valor !== undefined && valor !== '') {
    setGlobalVariable(nombre, valor);
  }
}

// Generar variables_completas y variables_faltantes
const requeridas = variablesToExtract.filter(v => v.requerido);
const completas = requeridas.filter(v => getGlobalVariable(v.nombre));
const faltantes = requeridas.filter(v => !getGlobalVariable(v.nombre));

setGlobalVariable('variables_completas', completas.length === requeridas.length);
setGlobalVariable('variables_faltantes', faltantes.map(v => v.nombre).join(', '));
```

**Output:**
```json
{
  "datos_extraidos": {
    "titulo": "Harry Potter y la Cámara Secreta | Harry Potter y la Orden del Fénix",
    "editorial": null
  },
  "variables_completas": false,
  "variables_faltantes": []
}
```

---

### 3. GPT Transform (Transformación de Datos)

**Propósito:** Transformar datos de un formato a otro usando GPT.

**Características:**
- ✅ Transforma JSON a JSON
- ✅ Útil para normalizar datos
- ✅ No mantiene historial

**Configuración:**

```json
{
  "tipo": "transform",
  "systemPrompt": "Transforma los datos de entrada...",
  "inputMapping": {
    "productos": "{{woocommerce.productos}}"
  }
}
```

**System Prompt:**

```
Transforma los siguientes productos de WooCommerce a un formato simplificado.

INPUT:
{{input.productos}}

OUTPUT (JSON):
{
  "productos_simplificados": [
    {
      "titulo": "...",
      "precio": "...",
      "url": "..."
    }
  ]
}
```

**Output:**
```json
{
  "productos_simplificados": [...]
}
```

---

## 🔧 Configuración Avanzada

### Tópicos Locales

Los tópicos locales son información específica del nodo que se agrega automáticamente al prompt:

```json
{
  "topicos": [
    {
      "id": "topico-1",
      "titulo": "Promociones Especiales",
      "contenido": "20% OFF en libros de matemática",
      "keywords": ["promocion", "descuento"]
    }
  ]
}
```

**Resultado en el prompt:**
```
═══ INFORMACIÓN ADICIONAL (TÓPICOS DEL NODO) ═══

**Promociones Especiales:**
20% OFF en libros de matemática
Keywords: promocion, descuento
```

### Variables Recopilar

Define qué variables debe recopilar el GPT conversacional:

```json
{
  "variablesRecopilar": [
    {
      "nombre": "nombre",
      "descripcion": "Nombre del cliente",
      "obligatorio": true,
      "tipo": "texto",
      "validacion": {
        "minLength": 2,
        "maxLength": 50
      },
      "ejemplos": ["Juan", "María"]
    }
  ]
}
```

### Acciones al Completar

Define qué hacer cuando se completan todas las variables:

```json
{
  "accionesCompletado": [
    {
      "tipo": "guardar_contacto",
      "config": {}
    },
    {
      "tipo": "enviar_notificacion",
      "config": {
        "destinatario": "admin@empresa.com"
      }
    }
  ]
}
```

---

## 📊 Variables Disponibles en Prompts

### Tópicos Globales
```
{{topicos.horarios.descripcion}}
{{topicos.medios_pago.descripcion}}
{{topicos.empresa.ubicacion}}
{{topicos.empresa.whatsapp_link}}
```

### Variables Globales
```
{{titulo}}
{{editorial}}
{{nombre_cliente}}
{{variables_completas}}
{{variables_faltantes}}
```

### Output de Nodos
```
{{woocommerce.productos}}
{{formateador.datos_extraidos}}
{{router.ruta_seleccionada}}
```

---

## 🎯 Casos de Uso

### Caso 1: Asistente de Ventas (Conversacional)

```json
{
  "tipo": "conversacional",
  "systemPrompt": "Eres un asistente de ventas...",
  "topicos": [
    {
      "titulo": "Productos",
      "contenido": "Tenemos libros, útiles escolares..."
    }
  ]
}
```

### Caso 2: Extractor de Datos (Formateador)

```json
{
  "tipo": "formateador",
  "extractionConfig": {
    "variablesToExtract": [
      { "nombre": "titulo", "requerido": true },
      { "nombre": "editorial", "requerido": false }
    ]
  }
}
```

### Caso 3: Simplificador de Productos (Transform)

```json
{
  "tipo": "transform",
  "systemPrompt": "Simplifica los productos de WooCommerce...",
  "inputMapping": {
    "productos": "{{woocommerce.productos}}"
  }
}
```

---

## 🐛 Debug y Logs

### Logs del Formateador

```
🔍 [FORMATEADOR] Extrayendo datos...
   📝 Variables a extraer: titulo, editorial, edicion
   📚 Contexto: 3 mensajes de historial
   
✅ [FORMATEADOR] Datos extraídos:
   ✅ titulo = "Harry Potter y la Cámara Secreta | Harry Potter y la Orden del Fénix"
   ⚠️  editorial = null (no mencionado)
   
📊 [FORMATEADOR] Validación:
   ✅ variables_completas = false
   📋 variables_faltantes = ""
```

### Logs del Conversacional

```
💬 [GPT CONVERSACIONAL] Procesando mensaje...
📚 [TÓPICOS LOCALES] Agregando 2 tópico(s) del nodo
   1. Horarios
   2. Medios de Pago
   
🔍 [AUDITORÍA] SYSTEM PROMPT DESPUÉS DE RESOLVER VARIABLES:
────────────────────────────────────────────────────────────
Eres un asistente de Librería Veo Veo.

INFORMACIÓN DISPONIBLE:
Horarios: Atendemos de Lunes a Viernes de 8:30 a 12:00...
Medios de pago: Aceptamos efectivo, transferencia...
────────────────────────────────────────────────────────────

✅ [GPT] Respuesta generada (245 tokens)
```

---

## ⚠️ Errores Comunes

### Error 1: Variables sin resolver

**Síntoma:**
```
Bot: "Contacto: {{topicos.empresa.whatsapp_link}}"
```

**Causa:** Variable no existe en tópicos o mal escrita

**Solución:**
```javascript
// Verificar que el tópico existe
console.log('Tópicos cargados:', Object.keys(topicos));

// Verificar sintaxis
{{topicos.empresa.whatsapp_link}} // ✅ Correcto
{{topico.empresa.whatsapp_link}}  // ❌ Incorrecto (singular)
```

### Error 2: Formateador no extrae múltiples items

**Síntoma:**
```
Usuario: "Busco libro 1 y libro 2"
Extraído: "libro 1" (solo uno)
```

**Causa:** Prompt no instruye sobre búsqueda múltiple

**Solución:** Agregar al prompt:
```
Si el usuario menciona VARIOS items → Extrae TODOS separados por " | "
```

### Error 3: Temperatura muy alta

**Síntoma:** Respuestas inconsistentes o inventadas

**Solución:**
- Conversacional: `temperatura: 0.7`
- Formateador: `temperatura: 0.3` (más preciso)
- Transform: `temperatura: 0.5`

---

## 📚 Documentación Relacionada

- `NODO-ROUTER.md` - Enrutamiento condicional
- `NODO-WOOCOMMERCE.md` - Integración con WooCommerce
- `CONDICIONALES.md` - Condiciones en conexiones
- `SISTEMA-TOPICOS.md` - Sistema de tópicos

---

**Creado:** 2026-01-15  
**Última actualización:** 2026-01-15  
**Versión:** 1.0
