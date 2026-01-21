# DOCUMENTACIÓN COMPLETA - NODOS FLUJO VEO VEO

## ESTRUCTURA DEL FLUJO

```
webhook-whatsapp 
  → gpt-clasificador-inteligente 
  → router-principal
    ├─ [buscar_producto] → gpt-formateador → router
    │                                          ├─ [route-1] → gpt-pedir-datos → whatsapp-preguntar
    │                                          └─ [route-2] → whatsapp-solicitar-datos → woocommerce → gpt-asistente-ventas → whatsapp-asistente
    └─ [comprar] → gpt-armar-carrito → router-carrito
                                         ├─ [edge-router-mercadopago] → mercadopago-crear-preference → whatsapp-link-pago
                                         ├─ [edge-router-verificar] → mercadopago-verificar-pago → gpt-armar-carrito (loop)
                                         └─ [edge-router-confirmacion] → whatsapp-confirmacion-pago
```

---

## 1. WEBHOOK-WHATSAPP (webhook)

**Tipo:** `webhook`  
**Propósito:** Punto de entrada del flujo. Recibe mensajes de WhatsApp.

**Configuración requerida:**
```json
{
  "label": "WhatsApp Business Cloud API",
  "config": {
    "tipo": "listener",
    "webhookUrl": "/api/webhook/whatsapp"
  }
}
```

**Conexiones:**
- **Salida:** → `gpt-clasificador-inteligente`

---

## 2. GPT-CLASIFICADOR-INTELIGENTE (gpt)

**Tipo:** `gpt`  
**Propósito:** Clasificar la intención del usuario (buscar, comprar, consultar, despedida).

**Configuración requerida:**
```json
{
  "label": "GPT Clasificador",
  "config": {
    "systemPrompt": "Sos un asistente de la Librería Veo Veo 📚.\n\nTU TAREA:\nAnalizar el mensaje del usuario y clasificar su intención.\n\nTIPOS DE ACCIÓN:\n- \"comprar\" → Usuario quiere buscar/comprar libros\n- \"consultar\" → Usuario hace preguntas generales\n- \"despedida\" → Usuario se despide\n\nOUTPUT (solo la palabra):\ncomprar | consultar | despedida",
    "model": "gpt-3.5-turbo",
    "temperature": 0.3,
    "response_format": "text",
    "variables_a_extraer": [
      {
        "nombre": "tipo_accion",
        "tipo": "string",
        "descripcion": "Tipo de acción: comprar, consultar, despedida",
        "obligatoria": true
      }
    ],
    "topics": ["tono-comunicacion"]
  }
}
```

**Conexiones:**
- **Entrada:** ← `webhook-whatsapp`
- **Salida:** → `router-principal`

---

## 3. ROUTER-PRINCIPAL (router)

**Tipo:** `router`  
**Propósito:** Dirigir el flujo según la intención clasificada.

**Configuración requerida:**
```json
{
  "label": "Router Principal",
  "config": {
    "variable": "tipo_accion",
    "routes": [
      {
        "condition": "equals",
        "value": "buscar_producto",
        "label": "🔍 Buscar Producto"
      },
      {
        "condition": "equals",
        "value": "comprar",
        "label": "🛒 Comprar"
      },
      {
        "condition": "equals",
        "value": "consultar",
        "label": "💬 Consultar"
      },
      {
        "condition": "equals",
        "value": "despedida",
        "label": "👋 Despedida"
      }
    ]
  },
  "routeHandles": []
}
```

**Conexiones:**
- **Entrada:** ← `gpt-clasificador-inteligente`
- **Salidas:**
  - → `gpt-formateador` (buscar_producto)
  - → `gpt-armar-carrito` (comprar)
  - → `gpt-asistente-ventas` (consultar) - FALTA AGREGAR
  - → `whatsapp-asistente` (despedida) - FALTA AGREGAR

---

## 4. GPT-FORMATEADOR (gpt)

**Tipo:** `gpt`  
**Propósito:** Extraer variables de búsqueda (título, editorial, edición) del mensaje del usuario.

**Configuración requerida:**
```json
{
  "label": "OpenAI (ChatGPT, Sera...",
  "subtitle": "formateador",
  "config": {
    "systemPrompt": "Eres un extractor de variables para búsqueda de libros en WooCommerce.\n\nVARIABLES A EXTRAER:\n- titulo: Título del libro (string) - **OBLIGATORIO**\n- editorial: Editorial del libro (string) - OPCIONAL\n- edicion: Edición del libro (string) - OPCIONAL\n\nSi el usuario no menciona editorial o edición, devolver null.\n\nOUTPUT (JSON):\n{\n  \"titulo\": \"Harry Potter 3\",\n  \"editorial\": null,\n  \"edicion\": null,\n  \"variables_completas\": true,\n  \"variables_faltantes\": []\n}",
    "model": "gpt-4o-mini",
    "temperature": 0.1,
    "response_format": "json_object"
  }
}
```

**Conexiones:**
- **Entrada:** ← `router-principal`
- **Salida:** → `router`

---

## 5. ROUTER (router)

**Tipo:** `router`  
**Propósito:** Decidir si pedir más datos o buscar directamente en WooCommerce.

**Configuración requerida:**
```json
{
  "label": "Router",
  "subtitle": "Búsqueda Inicial",
  "config": {
    "routes": [
      {
        "id": "route-1",
        "label": "Pedir Datos",
        "condition": "{{gpt-formateador.variables_faltantes}} not_empty"
      },
      {
        "id": "route-2",
        "label": "Buscar en WooCommerce",
        "condition": "{{gpt-formateador.variables_completas}} equals true"
      }
    ]
  },
  "routeHandles": ["route-1", "route-2"]
}
```

**Conexiones:**
- **Entrada:** ← `gpt-formateador`
- **Salidas:**
  - [route-1] → `gpt-pedir-datos`
  - [route-2] → `whatsapp-solicitar-datos`

---

## 6. GPT-PEDIR-DATOS (gpt)

**Tipo:** `gpt`  
**Propósito:** Solicitar al usuario los datos faltantes de forma conversacional.

**Configuración requerida:**
```json
{
  "label": "OpenAI (ChatGPT, Sera...",
  "subtitle": "conversacional",
  "config": {
    "systemPrompt": "Eres un asistente amigable de Librería Veo Veo.\n\nINFORMACIÓN DISPONIBLE (NO INVENTES, USA ESTO):\n{{topicos.horarios.descripcion}}\n{{topicos.medios_pago.descripcion}}\n{{topicos.productos.libros_ingles.descripcion}}\n\nTU TAREA:\nPedir los datos faltantes de forma amigable.\n\nVariables faltantes: {{gpt-formateador.variables_faltantes}}\n\nEjemplo:\n\"¿Me podés decir la editorial del libro que buscás? 📚\"",
    "model": "gpt-3.5-turbo",
    "temperature": 0.7
  }
}
```

**Conexiones:**
- **Entrada:** ← `router` [route-1]
- **Salida:** → `whatsapp-preguntar`

---

## 7. WHATSAPP-PREGUNTAR (whatsapp)

**Tipo:** `whatsapp`  
**Propósito:** Enviar mensaje pidiendo datos faltantes al usuario.

**Configuración requerida:**
```json
{
  "label": "WhatsApp Business Clo...",
  "config": {
    "action": "send_message",
    "message": "{{gpt-pedir-datos.response}}",
    "to": "{{1.from}}"
  }
}
```

**Conexiones:**
- **Entrada:** ← `gpt-pedir-datos`
- **Salida:** NINGUNA (espera respuesta del usuario que vuelve al webhook)

---

## 8. WHATSAPP-SOLICITAR-DATOS (whatsapp)

**Tipo:** `whatsapp`  
**Propósito:** Mensaje de transición antes de buscar en WooCommerce.

**Configuración requerida:**
```json
{
  "label": "WhatsApp Buscar Productos",
  "config": {
    "action": "send_message",
    "message": "🔍 Perfecto, déjame buscar eso para vos...",
    "to": "{{1.from}}"
  }
}
```

**Conexiones:**
- **Entrada:** ← `router` [route-2]
- **Salida:** → `woocommerce`

---

## 9. WOOCOMMERCE (woocommerce)

**Tipo:** `woocommerce`  
**Propósito:** Buscar productos en WooCommerce según las variables extraídas.

**Configuración requerida:**
```json
{
  "label": "WooCommerce",
  "config": {
    "tipo": "buscar_productos",
    "empresaId": "Veo Veo",
    "searchParams": {
      "titulo": "{{gpt-formateador.titulo}}",
      "editorial": "{{gpt-formateador.editorial}}",
      "edicion": "{{gpt-formateador.edicion}}"
    }
  }
}
```

**Conexiones:**
- **Entrada:** ← `whatsapp-solicitar-datos`
- **Salida:** → `gpt-asistente-ventas`

---

## 10. GPT-ASISTENTE-VENTAS (gpt)

**Tipo:** `gpt`  
**Propósito:** Presentar resultados de búsqueda de forma atractiva y ayudar al cliente.

**Configuración requerida:**
```json
{
  "label": "OpenAI (ChatGPT, Sera...",
  "subtitle": "conversacional",
  "config": {
    "systemPrompt": "Sos un asistente de ventas de la Librería Veo Veo 📚.\n\nTU TAREA:\nPresentar los resultados de búsqueda de libros de forma atractiva y ayudar al cliente a elegir.\n\nFORMATO DE PRESENTACIÓN:\nPerfecto😊, encontré estos libros:\n\n📚 [Título]\nEditorial: [Editorial]\nPrecio: $[Precio]\nStock: [Disponible/Agotado]\n\n¿Te interesa alguno?",
    "model": "gpt-4o-mini",
    "temperature": 0.7,
    "topics": [
      "tono-comunicacion",
      "atencion-personalizada",
      "libros-ingles"
    ]
  }
}
```

**Conexiones:**
- **Entrada:** ← `woocommerce`
- **Salida:** → `whatsapp-asistente`

---

## 11. WHATSAPP-ASISTENTE (whatsapp)

**Tipo:** `whatsapp`  
**Propósito:** Enviar respuesta del asistente de ventas al usuario.

**Configuración requerida:**
```json
{
  "label": "WhatsApp Business Clo...",
  "config": {
    "action": "send_message",
    "message": "{{gpt-asistente-ventas.response}}",
    "to": "{{1.from}}"
  }
}
```

**Conexiones:**
- **Entrada:** ← `gpt-asistente-ventas`
- **Salida:** NINGUNA (nodo final)

---

## 12. GPT-ARMAR-CARRITO (gpt)

**Tipo:** `gpt`  
**Propósito:** Analizar historial y extraer información del carrito o generar mensaje de confirmación de pago.

**Configuración requerida:**
```json
{
  "label": "GPT Armar Carrito",
  "config": {
    "systemPrompt": "Sos un asistente de ventas de la Librería Veo Veo 📚.\n\nTU TAREA:\nAnalizar el historial completo y el mensaje actual para extraer información del carrito O generar mensaje de confirmación de pago.\n\nREGLAS:\n1. PAGO CONFIRMADO AUTOMÁTICO (webhook):\n   - Si mercadopago_estado = \"approved\" Y mensaje contiene \"✅ pago confirmado\"\n   - tipo_mensaje = \"pago_confirmado_automatico\"\n   - Generar mensaje_confirmacion personalizado\n\n2. VERIFICAR PAGO:\n   - Si usuario dice \"ya pagué\", \"pagué\", \"hice el pago\"\n   - tipo_mensaje = \"verificar_pago\"\n\n3. PRODUCTOS DEL CARRITO:\n   - Extraer del historial los productos que el usuario confirmó\n   - Si el usuario dijo \"lo quiero\", \"agregar al carrito\", \"sí\", \"confirmo\" → agregar ese producto\n\n4. CONFIRMACIÓN DE COMPRA:\n   - true SOLO si el usuario confirmó explícitamente: \"sí\", \"lo quiero\", \"confirmo\", \"comprar\"\n   - false si es una pregunta o consulta\n\n5. DATOS DEL CLIENTE:\n   - Extraer del historial si el usuario ya los proporcionó\n   - Si no están → null\n\nFORMATO DE SALIDA (JSON estricto):\n{\n  \"tipo_mensaje\": \"pago_confirmado_automatico\" | \"verificar_pago\" | \"confirmar_compra\" | \"consulta\",\n  \"mensaje_confirmacion\": \"MENSAJE PERSONALIZADO AQUÍ (solo si tipo_mensaje = pago_confirmado_automatico)\",\n  \"productos_carrito\": [{\"id\": 126, \"nombre\": \"...\", \"cantidad\": 1, \"precio\": 49000}],\n  \"total\": 49000,\n  \"confirmacion_compra\": true,\n  \"nombre_cliente\": null,\n  \"email_cliente\": null,\n  \"telefono_cliente\": \"{{1.from}}\"\n}",
    "model": "gpt-3.5-turbo",
    "temperature": 0.7,
    "response_format": "json_object",
    "contextSource": "historial_completo",
    "variables_a_extraer": [
      {
        "nombre": "tipo_mensaje",
        "tipo": "string",
        "descripcion": "Tipo de mensaje: verificar_pago, confirmar_compra, consulta",
        "obligatoria": true
      },
      {
        "nombre": "mensaje_confirmacion",
        "tipo": "string",
        "descripcion": "Mensaje personalizado de confirmación de pago (solo si pago aprobado)",
        "obligatoria": false
      }
    ],
    "topics": [
      "tono-comunicacion",
      "politica-retiro",
      "politica-envios"
    ]
  }
}
```

**Conexiones:**
- **Entrada:** ← `router-principal` O ← `mercadopago-verificar-pago`
- **Salida:** → `router-carrito`

---

## 13. ROUTER-CARRITO (router)

**Tipo:** `router`  
**Propósito:** Dirigir según si hay confirmación de compra y datos completos.

**Configuración requerida:**
```json
{
  "label": "Router Carrito",
  "config": {
    "variable": "confirmacion_compra",
    "routes": [
      {
        "condition": "equals",
        "value": "true",
        "label": "✅ Datos Completos",
        "additionalConditions": [
          {
            "variable": "nombre_cliente",
            "condition": "exists"
          },
          {
            "variable": "email_cliente",
            "condition": "exists"
          }
        ]
      },
      {
        "condition": "equals",
        "value": "false",
        "label": "❌ Sin Confirmación"
      },
      {
        "condition": "default",
        "label": "⚠️ Faltan Datos"
      }
    ]
  },
  "routeHandles": [
    "edge-router-mercadopago",
    "edge-router-verificar",
    "edge-router-confirmacion"
  ]
}
```

**Conexiones:**
- **Entrada:** ← `gpt-armar-carrito`
- **Salidas:**
  - [edge-router-mercadopago] → `mercadopago-crear-preference` (confirmacion_compra = true + datos completos)
  - [edge-router-verificar] → `mercadopago-verificar-pago` (tipo_mensaje = verificar_pago)
  - [edge-router-confirmacion] → `whatsapp-confirmacion-pago` (pago_confirmado_automatico)

---

## 14. MERCADOPAGO-CREAR-PREFERENCE (mercadopago)

**Tipo:** `mercadopago`  
**Propósito:** Crear link de pago de MercadoPago.

**Configuración requerida:**
```json
{
  "config": {
    "linkId": "",
    "linkType": "dynamic",
    "action": "create_payment_link",
    "mercadoPagoConnected": true,
    "empresaId": "Veo Veo"
  }
}
```

**Conexiones:**
- **Entrada:** ← `router-carrito` [edge-router-mercadopago]
- **Salida:** → `whatsapp-link-pago`

---

## 15. WHATSAPP-LINK-PAGO (whatsapp)

**Tipo:** `whatsapp`  
**Propósito:** Enviar link de pago al usuario.

**Configuración requerida:**
```json
{
  "label": "WhatsApp Link Pago",
  "config": {
    "module": "send-message",
    "message": "{{mercadopago-crear-preference.mensaje}}",
    "to": "{{1.from}}"
  }
}
```

**Conexiones:**
- **Entrada:** ← `mercadopago-crear-preference`
- **Salida:** NINGUNA (nodo final)

---

## 16. MERCADOPAGO-VERIFICAR-PAGO (mercadopago)

**Tipo:** `mercadopago`  
**Propósito:** Verificar si el pago fue aprobado.

**Configuración requerida:**
```json
{
  "label": "Verificar Pago MP",
  "config": {
    "action": "verificar_pago"
  }
}
```

**Conexiones:**
- **Entrada:** ← `router-carrito` [edge-router-verificar]
- **Salida:** → `gpt-armar-carrito` (loop para procesar resultado)

---

## 17. WHATSAPP-CONFIRMACION-PAGO (whatsapp)

**Tipo:** `whatsapp`  
**Propósito:** Enviar mensaje de confirmación de pago aprobado.

**Configuración requerida:**
```json
{
  "label": "WhatsApp Confirmación",
  "config": {
    "module": "send-message",
    "message": "{{gpt-armar-carrito.mensaje_confirmacion}}",
    "to": "{{1.from}}"
  }
}
```

**Conexiones:**
- **Entrada:** ← `router-carrito` [edge-router-confirmacion]
- **Salida:** NINGUNA (nodo final)

---

## TÓPICOS DEL FLUJO (flow.config.topicos)

Los tópicos deben estar configurados en `flow.config.topicos`:

```json
{
  "empresa": {
    "nombre": "Librería Veo Veo",
    "ubicacion": "San Juan 1037, Corrientes Capital",
    "whatsapp": "5493794732177"
  },
  "horarios": {
    "lunes_viernes": "8:30-12:00 y 17:00-21:00",
    "sabados": "9:00-13:00 y 17:00-21:00",
    "domingos": "Cerrado",
    "descripcion": "Atendemos de Lunes a Viernes de 8:30 a 12:00 y de 17:00 a 21:00. Sábados de 9:00 a 13:00 y de 17:00 a 21:00. Domingos cerrado."
  },
  "tono-comunicacion": {
    "estilo": "Amigable, profesional, cercano",
    "uso_emojis": true,
    "tratamiento": "vos (argentino)"
  },
  "atencion-personalizada": {
    "descripcion": "Siempre preguntar qué busca el cliente, ofrecer alternativas, ser proactivo"
  },
  "libros-ingles": {
    "descripcion": "Tenemos amplia variedad de libros en inglés para todos los niveles"
  },
  "politica-retiro": {
    "descripcion": "Retiro en local sin cargo. Horarios: Lunes a Viernes 8:30-12 y 17-21, Sábados 9-13 y 17-21"
  },
  "politica-envios": {
    "descripcion": "Envíos a todo el país. Costo según destino."
  }
}
```

---

## CONEXIONES FALTANTES

1. **router-principal** → **gpt-asistente-ventas** (route: consultar)
2. **router-principal** → **whatsapp-asistente** (route: despedida)

---

## PROBLEMAS IDENTIFICADOS

1. ❌ **router-principal** tiene `routeHandles: []` vacío
   - Debe tener handles para las 4 rutas
   
2. ❌ Faltan 2 conexiones desde **router-principal**
   - route-consultar → gpt-asistente-ventas
   - route-despedida → whatsapp-asistente

3. ⚠️ **whatsapp-preguntar** no tiene salida
   - Debe esperar respuesta del usuario que vuelve al webhook
