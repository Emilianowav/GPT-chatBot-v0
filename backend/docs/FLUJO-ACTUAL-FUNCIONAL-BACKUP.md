# 🔒 FLUJO ACTUAL FUNCIONAL - BACKUP COMPLETO

**FECHA:** 2026-01-15  
**ESTADO:** ✅ FUNCIONAL Y PROBADO  
**PROPÓSITO:** Documentación completa del flujo actual antes de agregar funcionalidad de carrito

---

## ⚠️ ADVERTENCIA CRÍTICA

**ESTE FLUJO NO DEBE SER MODIFICADO SIN ANTES CREAR UN BACKUP COMPLETO**

Este documento sirve como referencia para restaurar el flujo en caso de que las modificaciones causen problemas.

---

## 📊 Arquitectura Visual del Flujo Actual

```
PASO 1: ENTRADA
═══════════════════════════════════════════════════════════════════

    [WhatsApp Business Cloud Trigger]
    ID: whatsapp-trigger-1
    Recibe mensaje del usuario
           │
           ▼

PASO 2: EXTRACCIÓN DE VARIABLES
═══════════════════════════════════════════════════════════════════

    [OpenAI (ChatGPT) - Formateador]
    ID: gpt-formateador
    Tipo: GPT Formateador
    
    Extrae variables del mensaje:
    - titulo (libro buscado)
    - editorial (opcional)
    - edicion (opcional)
    
    Soporta búsqueda múltiple con separador " | "
    Ejemplo: "Harry Potter 2 | Harry Potter 5"
           │
           ▼

PASO 3: VALIDACIÓN DE VARIABLES
═══════════════════════════════════════════════════════════════════

    [Router]
    ID: router-variables
    
    Evalúa: variables_completas equals true
           │
           ├─────────────────────────────────────────┐
           │                                         │
    variables_completas                      variables_completas
         = TRUE                                   = FALSE
           │                                         │
           ▼                                         ▼

PASO 4A: BÚSQUEDA EN WOOCOMMERCE          PASO 4B: PEDIR MÁS DATOS
═══════════════════════════════════        ═══════════════════════

[WooCommerce]                              [WhatsApp Business Cloud]
ID: woocommerce-search                     ID: whatsapp-pedir-datos
Tipo: WooCommerce                          
Module: search-product                     Mensaje: "¿Qué libro estás
                                           buscando?"
Busca productos con:                       
- search: {{titulo}}                       (Vuelve a Paso 1)
- per_page: 10
- Búsqueda múltiple si contiene " | "
    │
    ▼

PASO 5: FORMATEO DE PRODUCTOS
═══════════════════════════════════════════════════════════════════

[OpenAI (ChatGPT) - Asistente de Ventas]
ID: gpt-asistente-ventas
Tipo: GPT Conversacional

Recibe:
- {{woocommerce.productos}} (productos encontrados)
- {{topicos.*}} (información de la empresa)

Genera respuesta formateada con:
- Título del libro
- Precio
- Stock
- URL completa y clickeable
    │
    ▼

PASO 6: ENVÍO DE RESPUESTA
═══════════════════════════════════════════════════════════════════

[WhatsApp Business Cloud]
ID: whatsapp-respuesta
Tipo: WhatsApp

Envía mensaje con:
- telefono: {{1.from}}
- message: {{gpt-asistente-ventas.response}}

Ejemplo de mensaje:
"¡Excelente elección! Aquí te dejo la información del libro:

📖 HARRY POTTER Y LA CÁMARA SECRETA
💰 $25.000
📦 Disponible
🔗 [Hacé clic aquí para verlo](https://www.veoveolibros.com.ar/producto/...)

¿Puedo ayudarte con algo más?"
    │
    ▼

[FIN] ✅
```

---

## 🔧 Configuración Detallada de Cada Nodo

### **Nodo 1: WhatsApp Trigger**

```json
{
  "id": "whatsapp-trigger-1",
  "type": "trigger",
  "data": {
    "label": "WhatsApp Business Cloud",
    "config": {
      "type": "whatsapp",
      "event": "message.received"
    }
  },
  "position": { "x": 100, "y": 100 }
}
```

**Output:**
```json
{
  "from": "5493794732177",
  "message": "Busco harry potter 2 y 5",
  "timestamp": "2026-01-15T10:00:00Z",
  "messageId": "wamid.xxx"
}
```

---

### **Nodo 2: GPT Formateador**

```json
{
  "id": "gpt-formateador",
  "type": "gpt",
  "data": {
    "label": "OpenAI (ChatGPT) - Formateador",
    "config": {
      "tipo": "formateador",
      "modelo": "gpt-4",
      "temperatura": 0.3,
      "extractionConfig": {
        "systemPrompt": "Eres un asistente experto que extrae información estructurada...",
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
  },
  "position": { "x": 300, "y": 100 }
}
```

**System Prompt (Actual):**
```
Eres un asistente experto que extrae información estructurada de conversaciones.

Tu trabajo es extraer las variables definidas en {{extractionConfig.variablesToExtract}} del contexto de la conversación.

REGLA CRÍTICA:
Si el usuario NO menciona información relevante → Devuelve null para esas variables

BÚSQUEDA MÚLTIPLE:
Si el usuario menciona VARIOS items → Extrae TODOS separados por " | "

NORMALIZACIÓN INTELIGENTE:
Para series conocidas como Harry Potter, normaliza el número al título completo:
- "Harry Potter 2" → "Harry Potter y la Cámara Secreta"
- "Harry Potter 5" → "Harry Potter y la Orden del Fénix"

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

**Output:**
```json
{
  "datos_extraidos": {
    "titulo": "Harry Potter y la Cámara Secreta | Harry Potter y la Orden del Fénix",
    "editorial": null
  },
  "variables_completas": true,
  "variables_faltantes": []
}
```

---

### **Nodo 3: Router Variables**

```json
{
  "id": "router-variables",
  "type": "router",
  "data": {
    "label": "Router",
    "config": {
      "tipo": "router",
      "descripcion": "Evalúa si todas las variables están completas"
    }
  },
  "position": { "x": 500, "y": 100 }
}
```

**Conexiones:**

```json
[
  {
    "id": "edge-router-woocommerce",
    "source": "router-variables",
    "target": "woocommerce-search",
    "data": {
      "condition": "variables_completas equals true",
      "label": "✅ Variables completas"
    }
  },
  {
    "id": "edge-router-pedir",
    "source": "router-variables",
    "target": "whatsapp-pedir-datos",
    "data": {
      "condition": "variables_completas equals false",
      "label": "❌ Variables incompletas"
    }
  }
]
```

---

### **Nodo 4A: WooCommerce Search**

```json
{
  "id": "woocommerce-search",
  "type": "woocommerce",
  "data": {
    "label": "WooCommerce",
    "config": {
      "module": "search-product",
      "connectionId": "woocommerce-veo-veo",
      "params": {
        "search": "{{titulo}}",
        "per_page": 10,
        "status": "publish"
      },
      "productFieldMappings": {
        "titulo": "name",
        "precio": "price",
        "stock": "stock_status",
        "url": "permalink"
      }
    }
  },
  "position": { "x": 700, "y": 50 }
}
```

**Lógica de Búsqueda Múltiple (Backend):**

```typescript
// En FlowExecutor.ts - executeWooCommerceNode()
case 'search-product':
  // Detectar búsqueda múltiple (separada por " | ")
  if (params.search && params.search.includes(' | ')) {
    console.log(`   🔍 BÚSQUEDA MÚLTIPLE detectada`);
    const terminos = params.search.split(' | ').map((t: string) => t.trim());
    console.log(`   📚 Buscando ${terminos.length} libro(s): ${terminos.join(', ')}`);
    
    // Buscar cada término por separado
    const resultadosPorTermino = await Promise.all(
      terminos.map(async (termino: string) => {
        // Normalizar cada término
        const terminoNormalizado = termino
          .replace(/\s*\d+\s*$/, '') // Eliminar números al final
          .replace(/\s+/g, ' ')       // Normalizar espacios
          .trim();
        
        console.log(`   🔍 Buscando: "${termino}" → "${terminoNormalizado}"`);
        
        const productos = await wooService.searchProducts({
          ...params,
          search: terminoNormalizado
        });
        
        console.log(`      ✅ ${productos.length} producto(s) encontrado(s)`);
        return productos;
      })
    );
    
    // Combinar todos los resultados (sin duplicados)
    const productosUnicos = new Map();
    resultadosPorTermino.flat().forEach((producto: any) => {
      productosUnicos.set(producto.id, producto);
    });
    
    result = Array.from(productosUnicos.values());
    console.log(`   ✅ Total productos únicos: ${result.length}`);
    
  } else {
    // Búsqueda simple (un solo término)
    // Normalizar término de búsqueda: "Harry Potter 5" -> "Harry Potter"
    if (params.search) {
      const searchNormalized = String(params.search)
        .replace(/\s*\d+\s*$/, '') // Eliminar números al final
        .replace(/\s+/g, ' ')       // Normalizar espacios
        .trim();
      
      console.log(`   🔍 Búsqueda original: "${params.search}"`);
      console.log(`   🔍 Búsqueda normalizada: "${searchNormalized}"`);
      
      params.search = searchNormalized;
    }
    
    result = await wooService.searchProducts(params);
    console.log(`   ✅ Productos encontrados: ${result.length}`);
  }
```

**Output:**
```json
{
  "productos": [
    {
      "id": 124,
      "titulo": "Harry Potter y la Cámara Secreta",
      "precio": "$25.000",
      "stock": "Disponible",
      "url": "https://www.veoveolibros.com.ar/producto/harry-potter-2"
    },
    {
      "id": 127,
      "titulo": "Harry Potter y la Orden del Fénix",
      "precio": "$49.000",
      "stock": "Disponible",
      "url": "https://www.veoveolibros.com.ar/producto/harry-potter-5"
    }
  ]
}
```

---

### **Nodo 4B: WhatsApp Pedir Datos**

```json
{
  "id": "whatsapp-pedir-datos",
  "type": "whatsapp",
  "data": {
    "label": "WhatsApp Business Cloud",
    "config": {
      "action": "send-message",
      "telefono": "{{1.from}}",
      "message": "¿Qué libro estás buscando? 📚"
    }
  },
  "position": { "x": 700, "y": 150 }
}
```

---

### **Nodo 5: GPT Asistente de Ventas**

```json
{
  "id": "gpt-asistente-ventas",
  "type": "gpt",
  "data": {
    "label": "OpenAI (ChatGPT) - Asistente",
    "config": {
      "tipo": "conversacional",
      "modelo": "gpt-4",
      "temperatura": 0.7,
      "systemPrompt": "Eres un asistente de ventas de Librería Veo Veo...",
      "topicos": []
    }
  },
  "position": { "x": 900, "y": 50 }
}
```

**System Prompt (Actual):**
```
Eres un asistente de ventas amigable y profesional de Librería Veo Veo.

PRODUCTOS ENCONTRADOS:
{{woocommerce.productos}}

INFORMACIÓN DE LA EMPRESA:
Horarios: {{topicos.horarios.descripcion}}
Medios de pago: {{topicos.medios_pago.descripcion}}
Ubicación: {{topicos.empresa.ubicacion}}
WhatsApp: {{topicos.empresa.whatsapp_link}}

TU TRABAJO:
1. Presentar los productos encontrados de forma atractiva
2. Incluir TODA la información: título, precio, stock, URL
3. Asegurarte que las URLs sean completas y clickeables
4. Ser conversacional y amigable
5. NO inventar información que no tengas

FORMATO DE RESPUESTA:
¡Excelente elección! Aquí te dejo la información del libro que tenemos disponible:

📖 [TÍTULO EN MAYÚSCULAS]
💰 $[PRECIO]
📦 [STOCK]
🔗 [Hacé clic aquí para verlo]([URL_COMPLETA])

¿Puedo ayudarte con algo más?

REGLAS CRÍTICAS:
- ❌ NO inventes información
- ✅ USA SOLO la información disponible en {{woocommerce.productos}}
- ✅ Si no encontraste productos, sugiere revisar la web o contactar por WhatsApp
- ✅ Las URLs deben ser completas (https://www.veoveolibros.com.ar/...)
- ✅ Si hay múltiples productos, presenta todos
```

**Output:**
```json
{
  "response": "¡Excelente elección! Aquí te dejo la información del libro que tenemos disponible:\n\n📖 HARRY POTTER Y LA CÁMARA SECRETA\n💰 $25.000\n📦 Disponible\n🔗 [Hacé clic aquí para verlo](https://www.veoveolibros.com.ar/producto/harry-potter-y-la-camara-secreta)\n\n¿Puedo ayudarte con algo más?"
}
```

---

### **Nodo 6: WhatsApp Respuesta**

```json
{
  "id": "whatsapp-respuesta",
  "type": "whatsapp",
  "data": {
    "label": "WhatsApp Business Cloud",
    "config": {
      "action": "send-message",
      "telefono": "{{1.from}}",
      "message": "{{gpt-asistente-ventas.response}}"
    }
  },
  "position": { "x": 1100, "y": 50 }
}
```

---

## 🔑 Variables Globales Utilizadas

### **Variables del Sistema:**

```javascript
{
  // Del trigger
  "1.from": "5493794732177",
  "1.message": "Busco harry potter 2 y 5",
  
  // Del formateador
  "titulo": "Harry Potter y la Cámara Secreta | Harry Potter y la Orden del Fénix",
  "editorial": null,
  "variables_completas": true,
  "variables_faltantes": [],
  
  // De WooCommerce
  "woocommerce.productos": [
    {
      "id": 124,
      "titulo": "Harry Potter y la Cámara Secreta",
      "precio": "$25.000",
      "stock": "Disponible",
      "url": "https://www.veoveolibros.com.ar/producto/harry-potter-2"
    }
  ],
  
  // Del GPT Asistente
  "gpt-asistente-ventas.response": "¡Excelente elección!..."
}
```

### **Tópicos Globales:**

```javascript
{
  "topicos": {
    "horarios": {
      "titulo": "Horarios de Atención",
      "descripcion": "Atendemos de Lunes a Viernes de 8:30 a 12:00 y de 17:00 a 21:00. Sábados de 9:00 a 13:00 y de 17:00 a 21:00. Domingos cerrado.",
      "keywords": ["horario", "hora", "abierto", "cerrado"]
    },
    "medios_pago": {
      "titulo": "Medios de Pago",
      "descripcion": "Aceptamos efectivo, transferencia bancaria y Mercado Pago. Tenemos promociones con Banco Corrientes (Lunes y Miércoles: 3 cuotas sin interés + 20% bonificación).",
      "keywords": ["pago", "efectivo", "transferencia", "mercado pago"]
    },
    "empresa": {
      "ubicacion": "San Juan 1037, Corrientes Capital",
      "whatsapp_link": "https://wa.me/5493794732177"
    }
  }
}
```

---

## 🎯 Casos de Uso Probados

### **Caso 1: Búsqueda Simple**

```
Usuario: "Busco Harry Potter 2"

Flujo:
1. Trigger recibe mensaje
2. Formateador extrae: titulo = "Harry Potter y la Cámara Secreta"
3. Router: variables_completas = true
4. WooCommerce busca "Harry Potter"
5. GPT Asistente formatea productos
6. WhatsApp envía respuesta

Resultado: ✅ Funciona correctamente
```

---

### **Caso 2: Búsqueda Múltiple**

```
Usuario: "Busco Harry Potter 2 y 5"

Flujo:
1. Trigger recibe mensaje
2. Formateador extrae: titulo = "Harry Potter y la Cámara Secreta | Harry Potter y la Orden del Fénix"
3. Router: variables_completas = true
4. WooCommerce detecta " | " y busca ambos en paralelo
5. GPT Asistente formatea ambos productos
6. WhatsApp envía respuesta con ambos

Resultado: ✅ Funciona correctamente
```

---

### **Caso 3: Variables Incompletas**

```
Usuario: "Hola"

Flujo:
1. Trigger recibe mensaje
2. Formateador extrae: titulo = null
3. Router: variables_completas = false
4. WhatsApp pide datos: "¿Qué libro estás buscando?"

Resultado: ✅ Funciona correctamente
```

---

## 🔒 Configuración de MongoDB

### **Colección: flows**

```javascript
{
  "_id": ObjectId("695a156681f6d67f0ae9cf40"),
  "nombre": "Flujo Veo Veo - Búsqueda de Libros",
  "empresaId": "5493794732177",
  "activo": true,
  "nodes": [
    // Nodos descritos arriba
  ],
  "edges": [
    // Conexiones descritas arriba
  ],
  "config": {
    "topicos_habilitados": true,
    "topicos": {
      // Tópicos descritos arriba
    }
  }
}
```

---

### **Colección: api_configurations**

```javascript
{
  "_id": ObjectId("..."),
  "empresaId": "5493794732177",
  "tipo": "woocommerce",
  "nombre": "WooCommerce Veo Veo",
  "config": {
    "eshopUrl": "https://www.veoveolibros.com.ar",
    "consumerKey": "ck_...",
    "consumerSecret": "cs_...",
    "version": "wc/v3"
  },
  "activo": true
}
```

---

## 📝 Scripts de Configuración Aplicados

### **1. fix-gpt-con-topicos.cjs**

Actualiza prompts de GPT para usar tópicos de conocimiento.

**Ubicación:** `backend/scripts/fix-gpt-con-topicos.cjs`

---

### **2. fix-busqueda-multiple-libros.cjs**

Actualiza formateador para soportar búsqueda múltiple con " | ".

**Ubicación:** `backend/scripts/fix-busqueda-multiple-libros.cjs`

---

### **3. fix-formateador-universal-multiple.cjs**

Generaliza el formateador para cualquier tipo de producto.

**Ubicación:** `backend/scripts/fix-formateador-universal-multiple.cjs`

---

## 🐛 Logs de Ejecución Exitosa

```
🚀 Ejecutando flujo: 695a156681f6d67f0ae9cf40
📚 [TÓPICOS] Cargados: horarios, medios_pago, empresa
📊 Flujo: Flujo Veo Veo (6 nodos, 5 edges)

🔍 [FORMATEADOR] Extrayendo datos...
   📝 Variables a extraer: titulo, editorial
   ✅ titulo = "Harry Potter y la Cámara Secreta | Harry Potter y la Orden del Fénix"
   ⚠️  editorial = null
   ✅ variables_completas = true

🔀 [ROUTER] Evaluando condiciones...
   ✅ Condición cumplida: "variables_completas equals true"
   🎯 Ruta seleccionada: woocommerce-search

📦 [WOOCOMMERCE] Ejecutando módulo: search-product
   🔍 BÚSQUEDA MÚLTIPLE detectada
   📚 Buscando 2 libro(s)
   ✅ Total productos únicos: 2

💬 [GPT ASISTENTE] Procesando...
   📚 [TÓPICOS LOCALES] Agregando 0 tópico(s)
   ✅ Respuesta generada (245 tokens)

📱 [WHATSAPP] Enviando mensaje...
   ✅ Mensaje enviado correctamente
```

---

## ✅ Checklist de Funcionalidades

- [x] Búsqueda simple de productos
- [x] Búsqueda múltiple con separador " | "
- [x] Normalización de términos (elimina números)
- [x] Normalización inteligente (Harry Potter 2 → título completo)
- [x] Validación de variables completas/incompletas
- [x] Integración con WooCommerce
- [x] Simplificación de productos para GPT
- [x] URLs completas y clickeables
- [x] Uso de tópicos de conocimiento
- [x] Resolución de variables en prompts
- [x] Historial de conversación
- [x] Manejo de productos no encontrados

---

## 🚨 IMPORTANTE: Antes de Modificar

### **1. Crear Backup de MongoDB**

```bash
# Backup del flujo actual
mongodump --uri="mongodb+srv://..." --db=neural_chatbot --collection=flows --query='{"_id": ObjectId("695a156681f6d67f0ae9cf40")}' --out=backup-flujo-$(date +%Y%m%d)
```

### **2. Crear Branch de Git**

```bash
git checkout -b feature/carrito-ecommerce
git add .
git commit -m "backup: Flujo actual funcional antes de agregar carrito"
```

### **3. Documentar Cambios**

Mantener este documento actualizado con cualquier modificación.

---

## 🔄 Plan de Restauración

Si algo sale mal, seguir estos pasos:

### **Paso 1: Restaurar desde Git**

```bash
git checkout main
git reset --hard [commit_hash_del_backup]
```

### **Paso 2: Restaurar MongoDB**

```bash
mongorestore --uri="mongodb+srv://..." --db=neural_chatbot --collection=flows backup-flujo-YYYYMMDD/neural_chatbot/flows.bson
```

### **Paso 3: Verificar Funcionamiento**

```bash
# Limpiar estado del teléfono de prueba
node backend/scripts/limpiar-mi-numero.js

# Probar flujo completo
# Enviar mensaje: "Busco Harry Potter 2 y 5"
```

---

## 📞 Contactos de Emergencia

- **Desarrollador:** Emiliano
- **Teléfono de Prueba:** 5493794946066
- **Empresa:** Veo Veo Libros (5493794732177)

---

**ÚLTIMA ACTUALIZACIÓN:** 2026-01-15 10:10:00  
**ESTADO:** ✅ DOCUMENTADO Y RESPALDADO  
**PRÓXIMO PASO:** Implementar extensión de carrito sin modificar nodos existentes

---

## 🎯 Resumen Ejecutivo

**Este flujo funciona perfectamente y NO debe ser modificado directamente.**

Para agregar funcionalidad de carrito:
1. ✅ Agregar nodos NUEVOS después del nodo 6 (whatsapp-respuesta)
2. ✅ NO modificar nodos 1-6 existentes
3. ✅ Usar variables globales para mantener contexto
4. ✅ Crear backup antes de cualquier cambio

**FIN DEL DOCUMENTO DE BACKUP**
