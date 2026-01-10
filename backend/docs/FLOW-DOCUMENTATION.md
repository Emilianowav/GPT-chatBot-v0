# Documentación del Flujo: undefined

**ID del Flujo:** 695a156681f6d67f0ae9cf40
**Generado:** 1/10/2026, 7:01:53 AM

## Descripción General

Este flujo maneja la conversación con clientes de Veo Veo Libros para ayudarles a buscar libros.

## Nodos del Flujo

### 1. WhatsApp Business Cloud

- **ID:** `webhook-whatsapp`
- **Tipo:** `webhook`
- **Propósito:** Recibe mensajes de WhatsApp vía webhook de Meta

**Configuración:**

```json
{
  "module": "watch-events",
  "phoneNumberId": "906667632531979",
  "empresaId": "6940a9a181b92bfce970fdb5"
}
```

**Salidas:**
- message (texto del mensaje)
- from (teléfono del cliente)
- to (teléfono de la empresa)
- phoneNumberId
- timestamp
- profileName

---

### 2. OpenAI (ChatGPT, Sera...

- **ID:** `gpt-conversacional`
- **Tipo:** `gpt`
- **Propósito:** Conversa con el usuario y recopila información

**Configuración:**

```json
{
  "tipo": "conversacional",
  "modelo": "gpt-3.5-turbo",
  "temperatura": 0.7,
  "maxTokens": 500,
  "instrucciones": "Eres un asistente de ventas de Veo Veo Libros, una librería especializada en libros de inglés.\n\nTU MISIÓN PRINCIPAL:\nAyudar al cliente a encontrar libros recopilando EXACTAMENTE esta información en orden:\n\n1. TÍTULO del libro (OBLIGATORIO)\n2. EDITORIAL (OBLIGATORIO - no aceptes \"no sé\" o \"cualquiera\")\n3. EDICIÓN (OBLIGATORIO - no aceptes \"no sé\" o \"cualquiera\")\n\nREGLAS ESTRICTAS:\n- Si el cliente ya mencionó el título, NO vuelvas a preguntarlo\n- Si el cliente dice \"no sé\" la editorial, INSISTE amablemente: \"Es importante que me des la editorial para encontrar el libro exacto que buscas\"\n- Si el cliente dice \"no sé\" la edición, INSISTE amablemente: \"Necesito la edición específica para asegurarme de que sea el libro correcto\"\n- NO busques el libro hasta tener los 3 datos completos\n- NO pidas fotografías de libros, solo información por escrito\n- Sé conversacional pero FIRME en recopilar los 3 datos\n\nINFORMACIÓN ESTÁTICA (menciona solo si el cliente pregunta):\n- Especialidad: Libros en inglés\n- Formas de pago: Efectivo, transferencia, tarjeta de crédito/débito\n- Envíos: A todo el país\n- Consultas: WhatsApp, email, tienda física\n\nEJEMPLO CORRECTO:\nCliente: \"Quiero harry potter 3\"\nTú: \"¡Perfecto! Para buscar el libro exacto que necesitas, ¿podrías decirme la editorial y la edición? Por ejemplo: Salamandra, edición 2020.\"\n\nCliente: \"No sé la editorial\"\nTú: \"Entiendo. Es importante que me des la editorial para encontrar el libro exacto. ¿Podrías revisar si tienes esa información? Si no, puedo ayudarte a identificarla.\"",
  "personalidad": "Eres amigable, profesional y persistente. Ayudas a los clientes de manera conversacional pero SIEMPRE recopilas los 3 datos: título, editorial, edición.",
  "topicos": [
    {
      "id": "topico-1",
      "titulo": "Especialidad en Libros de Inglés",
      "contenido": "Veo Veo Libros es una librería especializada en libros en inglés. Ofrecemos una amplia variedad de títulos, desde clásicos hasta novedades.",
      "keywords": [
        "libros",
        "inglés",
        "especialidad",
        "variedad"
      ]
    },
    {
      "id": "topico-2",
      "titulo": "Formas de Pago",
      "contenido": "Aceptamos efectivo, transferencia bancaria, tarjeta de crédito y débito. Ofrecemos facilidades de pago para compras mayores.",
      "keywords": [
        "pago",
        "efectivo",
        "transferencia",
        "tarjeta"
      ]
    },
    {
      "id": "topico-3",
      "titulo": "Envíos",
      "contenido": "Realizamos envíos a todo el país. El costo y tiempo de entrega dependen de la ubicación. Envíos gratis en compras mayores a $50000.",
      "keywords": [
        "envíos",
        "entrega",
        "país",
        "gratis"
      ]
    },
    {
      "id": "topico-4",
      "titulo": "Búsqueda de Libros",
      "contenido": "Para buscar un libro necesitamos: Título (obligatorio), Editorial (obligatorio), Edición (obligatorio). No aceptamos fotografías, solo información por escrito.",
      "keywords": [
        "búsqueda",
        "título",
        "editorial",
        "edición"
      ]
    }
  ]
}
```

**Salidas:**
- respuesta_gpt
- tokens
- costo
- titulo
- editorial
- edicion

**Variables a Recopilar:**

| Variable | Tipo | Obligatorio | Descripción |
|----------|------|-------------|-------------|
| titulo | texto | ✅ | Título del libro que busca el cliente |
| editorial | texto | ✅ | Editorial del libro - OBLIGATORIO, no aceptar "no sé" |
| edicion | texto | ✅ | Edición del libro - OBLIGATORIO, no aceptar "no sé" |

---

### 3. OpenAI (ChatGPT, Sera...

- **ID:** `gpt-formateador`
- **Tipo:** `gpt`
- **Propósito:** Extrae y estructura datos del historial de conversación

**Configuración:**

```json
{
  "tipo": "formateador",
  "modelo": "gpt-3.5-turbo",
  "configuracionExtraccion": {
    "instruccionesExtraccion": "Analiza el historial de conversación y extrae la información de búsqueda del cliente.\n\nCAMPOS A EXTRAER:\n1. \"titulo\": Título del libro mencionado por el cliente (OBLIGATORIO)\n2. \"editorial\": Editorial del libro si fue mencionada (OPCIONAL)\n3. \"edicion\": Edición del libro si fue mencionada (OPCIONAL)\n\nREGLAS:\n- Si el cliente mencionó el título, extráelo aunque no sea exacto\n- Si no mencionó editorial o edición, deja esos campos como null\n- NO inventes información que el cliente no proporcionó\n- Devuelve SOLO el JSON, sin texto adicional\n\nFORMATO DE SALIDA:\n{\n  \"titulo\": \"título mencionado por el cliente o null\",\n  \"editorial\": \"editorial mencionada o null\",\n  \"edicion\": \"edición mencionada o null\"\n}",
    "fuenteDatos": "historial_completo",
    "cantidadMensajes": 10,
    "formatoSalida": {
      "tipo": "json",
      "estructura": "{ \"titulo\": string, \"editorial\": string | null, \"edicion\": string | null }",
      "ejemplo": "{ \"titulo\": \"Harry Potter 3\", \"editorial\": \"Salamandra\", \"edicion\": \"2020\" }"
    },
    "camposEsperados": [
      {
        "nombre": "titulo",
        "descripcion": "Título del libro que busca el cliente",
        "tipoDato": "string",
        "requerido": true,
        "valorPorDefecto": null
      },
      {
        "nombre": "editorial",
        "descripcion": "Editorial del libro",
        "tipoDato": "string",
        "requerido": false,
        "valorPorDefecto": null
      },
      {
        "nombre": "edicion",
        "descripcion": "Edición del libro",
        "tipoDato": "string",
        "requerido": false,
        "valorPorDefecto": null
      }
    ]
  }
}
```

**Salidas:**
- respuesta_gpt
- tokens
- costo
- titulo
- editorial
- edicion

**Variables a Recopilar:**

| Variable | Tipo | Obligatorio | Descripción |
|----------|------|-------------|-------------|
| titulo | texto | ✅ | Título del libro |
| editorial | texto | ❌ | Editorial del libro |
| edicion | texto | ❌ | Edición del libro |

---

### 4. Router

- **ID:** `router`
- **Tipo:** `router`
- **Propósito:** Evalúa condiciones y dirige el flujo por diferentes rutas

**Configuración:**

```json
{
  "routes": [
    {
      "id": "route-1",
      "label": "Faltan datos",
      "condition": "{{titulo}} not exists",
      "descripcion": "Si no se extrajo el título del libro"
    },
    {
      "id": "route-2",
      "label": "Datos completos",
      "condition": "{{titulo}} exists",
      "descripcion": "Si ya tenemos al menos el título para buscar"
    }
  ]
}
```

**Salidas:**
- _routerPath
- _routerLabel

---

### 5. OpenAI (ChatGPT, Sera...

- **ID:** `gpt-pedir-datos`
- **Tipo:** `gpt`
- **Propósito:** Conversa con el usuario y recopila información

**Configuración:**

```json
{
  "tipo": "conversacional",
  "modelo": "gpt-3.5-turbo",
  "temperatura": 0.7,
  "maxTokens": 200,
  "instrucciones": "El cliente no ha especificado el título del libro que busca.\n\nCONTEXTO:\n- Título: {{titulo}}\n- Editorial: {{editorial}}\n- Edición: {{edicion}}\n\nTU TAREA:\nPregunta de manera amable y específica qué libro está buscando. Pide el título del libro.\n\nIMPORTANTE:\n- Sé amigable y conversacional\n- NO pidas fotografías, solo información por escrito\n- Si ya tiene el título, pregunta por editorial y edición de manera opcional\n\nEJEMPLO:\n\"¡Hola! Para ayudarte a encontrar el libro que buscas, ¿podrías decirme el título? Y si recuerdas la editorial y edición, también me ayudaría mucho 😊\""
}
```

**Salidas:**
- respuesta_gpt
- tokens
- costo

---

### 6. WhatsApp Business Cloud

- **ID:** `whatsapp-preguntar`
- **Tipo:** `whatsapp`
- **Propósito:** Envía mensaje de WhatsApp al cliente

**Configuración:**

```json
{
  "message": "{{gpt-pedir-datos.respuesta_gpt}}",
  "telefono": "{{telefono_cliente}}"
}
```

**Entradas:**
- message
- telefono

**Salidas:**
- status
- to
- message

---

### 7. WooCommerce

- **ID:** `woocommerce`
- **Tipo:** `woocommerce`
- **Propósito:** Consulta productos en WooCommerce

**Configuración:**

```json
{
  "apiConfigId": "695320fda03785dacc8d950b",
  "endpointId": "buscar-productos",
  "parametros": {
    "search": "{{busqueda}}",
    "category": "{{categoria}}",
    "per_page": "5",
    "orderby": "relevance"
  }
}
```

**Entradas:**
- titulo
- editorial
- edicion

**Salidas:**
- productos
- total_encontrados

---

### 8. OpenAI (ChatGPT, Sera...

- **ID:** `gpt-resultados`
- **Tipo:** `gpt`
- **Propósito:** Extrae y estructura datos del historial de conversación

**Configuración:**

```json
{
  "tipo": "formateador",
  "modelo": "gpt-3.5-turbo",
  "temperatura": 0.7,
  "maxTokens": 800,
  "instrucciones": "Toma los productos de WooCommerce (variable {{productos}}) y genera un mensaje amigable para WhatsApp mostrando las opciones disponibles. Para cada libro muestra: título, precio y si hay stock. Usa emojis para hacerlo más atractivo. Si no hay resultados, usa el mensaje de {{mensajeSinResultados}}."
}
```

**Salidas:**
- respuesta_gpt
- tokens
- costo

---

### 9. WhatsApp Business Cloud

- **ID:** `whatsapp-resultados`
- **Tipo:** `whatsapp`
- **Propósito:** Envía mensaje de WhatsApp al cliente

**Configuración:**

```json
{
  "message": "{{gpt-resultados.respuesta_gpt}}",
  "telefono": "{{telefono_cliente}}"
}
```

**Entradas:**
- message
- telefono

**Salidas:**
- status
- to
- message

---

## Conexiones (Edges)

| # | Desde | Hacia | Ruta |
|---|-------|-------|------|
| 1 | WhatsApp Business Cloud | OpenAI (ChatGPT, Sera... | - |
| 2 | OpenAI (ChatGPT, Sera... | OpenAI (ChatGPT, Sera... | - |
| 3 | OpenAI (ChatGPT, Sera... | Router | - |
| 4 | Router | OpenAI (ChatGPT, Sera... | Faltan datos (route-1) |
| 5 | OpenAI (ChatGPT, Sera... | WhatsApp Business Cloud | - |
| 6 | Router | WooCommerce | Datos completos (route-2) |
| 7 | WooCommerce | OpenAI (ChatGPT, Sera... | - |
| 8 | OpenAI (ChatGPT, Sera... | WhatsApp Business Cloud | - |

## Flujo de Ejecución

1. **Webhook WhatsApp** recibe mensaje del cliente
2. **GPT Conversacional** conversa y recopila: título, editorial, edición
3. **GPT Formateador** extrae datos estructurados del historial
4. **Router** evalúa si tiene los datos completos
   - ❌ Si faltan datos → GPT Pedir Datos → WhatsApp (vuelve al paso 2)
   - ✅ Si tiene datos → WooCommerce busca productos
5. **GPT Resultados** formatea los productos encontrados
6. **WhatsApp** envía resultados al cliente

## Variables Globales

- `telefono_cliente`: Teléfono del cliente que envía el mensaje
- `telefono_empresa`: Teléfono de la empresa (Veo Veo)
- `phoneNumberId`: ID del número de WhatsApp Business
- `mensaje_usuario`: Último mensaje enviado por el usuario
- `titulo`: Título del libro (extraído por GPT)
- `editorial`: Editorial del libro (extraído por GPT)
- `edicion`: Edición del libro (extraído por GPT)

