# 🏗️ ARQUITECTURA MODULAR Y ESCALABLE - VEO VEO

## 📋 PRINCIPIOS DE DISEÑO

### 1. **SEPARACIÓN DE RESPONSABILIDADES**
Cada nodo tiene UNA responsabilidad clara y bien definida.

### 2. **MODULARIDAD**
Los nodos son independientes y reutilizables.

### 3. **ESCALABILIDAD**
Fácil agregar nuevos flujos sin modificar los existentes.

### 4. **CONFIGURABILIDAD**
Todo es configurable sin tocar código.

---

## 🔄 ARQUITECTURA PROPUESTA

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO MODULAR VEO VEO                        │
└─────────────────────────────────────────────────────────────────┘

1. WhatsApp Trigger
   ↓ [mensaje_usuario, telefono, nombre_contacto]
   
2. GPT Conversacional (Personalidad Veo Veo)
   Responsabilidad: Conversar naturalmente, entender intención
   ↓ [contexto_conversacion, intencion_usuario]
   
3. GPT Formateador (Extractor de Datos)
   Responsabilidad: Extraer datos estructurados del contexto
   ↓ [datos_estructurados, datos_faltantes[]]
   
4. Validador de Datos
   Responsabilidad: Verificar si hay datos faltantes
   ↓ SI faltan datos → WhatsApp (solicitar datos)
   ↓ SI completo → Continuar
   
5. Router de Intención
   Responsabilidad: Dirigir a la API/acción correcta
   ↓ Ruta 1: WooCommerce (buscar productos)
   ↓ Ruta 2: Información estática (horarios, promociones)
   ↓ Ruta 3: Atención humana
   
6. Ejecutor de API (WooCommerce, etc.)
   Responsabilidad: Llamar API y obtener resultados
   ↓ [resultados_api]
   
7. Formateador de Respuesta
   Responsabilidad: Formatear resultados para WhatsApp
   ↓ [mensaje_formateado]
   
8. WhatsApp Send
   Responsabilidad: Enviar mensaje al usuario
```

---

## 📦 NODOS DETALLADOS

### **NODO 1: WhatsApp Trigger**
```json
{
  "tipo": "trigger",
  "output": {
    "mensaje_usuario": "string",
    "telefono": "string",
    "nombre_contacto": "string",
    "timestamp": "datetime"
  }
}
```

---

### **NODO 2: GPT Conversacional**
**Responsabilidad:** Conversar naturalmente y entender la intención del usuario

**Configuración:**
```json
{
  "tipo": "conversacional",
  "modelo": "gpt-4",
  "temperatura": 0.7,
  "personalidad": "Eres el asistente virtual de Librería Veo Veo...",
  "topicos_estaticos": [
    {
      "titulo": "Información del Local",
      "contenido": "📍 San Juan 1037 - Corrientes Capital\n🕗 Lunes a Viernes: 8:30-12 y 17-21\n🕗 Sábados: 9-13 y 17-21",
      "keywords": ["horario", "direccion", "ubicacion", "donde", "cuando"]
    },
    {
      "titulo": "Promociones Bancarias",
      "contenido": "Banco de Corrientes: Lunes y Miércoles 3 cuotas sin interés...",
      "keywords": ["promocion", "descuento", "cuotas", "banco"]
    },
    {
      "titulo": "Libros de Inglés",
      "contenido": "Los libros de inglés se realizan únicamente a pedido con seña.",
      "keywords": ["ingles", "english", "idioma"]
    },
    {
      "titulo": "Política de Cambios",
      "contenido": "Después de corroborar que el libro está en el mismo estado...",
      "keywords": ["cambio", "devolucion", "error", "equivocado"]
    }
  ],
  "output": {
    "contexto_conversacion": "string",
    "intencion_detectada": "buscar_libro | info_local | promociones | atencion_humana | cambios"
  }
}
```

**Prompt del Sistema:**
```
Eres el asistente virtual de Librería Veo Veo 📚✏️

PERSONALIDAD:
- Amigable, profesional y servicial
- Usas emojis apropiadamente
- Respondes de forma clara y concisa
- Siempre ayudas al usuario a encontrar lo que busca

INFORMACIÓN ESTÁTICA (acceso innato):
{topicos_estaticos}

TU OBJETIVO:
1. Entender qué necesita el usuario
2. Proporcionar información estática si la tienes
3. Si necesita buscar un libro, recopilar: título, editorial, edición
4. Ser conversacional y natural

IMPORTANTE:
- NO inventes información de productos
- Si el usuario busca un libro, necesitas: título, editorial, edición
- Si falta información, pregunta de forma natural
```

---

### **NODO 3: GPT Formateador (Extractor)**
**Responsabilidad:** Extraer datos estructurados de la conversación

**Configuración:**
```json
{
  "tipo": "formateador",
  "modelo": "gpt-4",
  "temperatura": 0.3,
  "schema_objetivo": {
    "tipo": "busqueda_libro",
    "campos_requeridos": ["titulo", "editorial", "edicion"],
    "campos_opcionales": ["autor", "isbn"]
  },
  "validaciones": {
    "titulo": { "min_length": 3, "required": true },
    "editorial": { "required": true },
    "edicion": { "required": true }
  },
  "output": {
    "datos_extraidos": {
      "titulo": "string | null",
      "editorial": "string | null",
      "edicion": "string | null"
    },
    "datos_faltantes": ["string"],
    "completitud": "number (0-100)",
    "listo_para_api": "boolean"
  }
}
```

**Prompt del Sistema:**
```
Tu tarea es extraer información estructurada de la conversación.

SCHEMA OBJETIVO:
{
  "titulo": "string (requerido)",
  "editorial": "string (requerido)",
  "edicion": "string (requerido)"
}

INSTRUCCIONES:
1. Analiza el contexto de la conversación
2. Extrae los campos del schema
3. Si un campo falta, márcalo como null
4. Lista los campos faltantes
5. Calcula el % de completitud

EJEMPLOS:

Conversación: "Busco Harry Potter de Salamandra"
Output:
{
  "datos_extraidos": {
    "titulo": "Harry Potter",
    "editorial": "Salamandra",
    "edicion": null
  },
  "datos_faltantes": ["edicion"],
  "completitud": 66,
  "listo_para_api": false
}

Conversación: "Harry Potter y la Piedra Filosofal, editorial Salamandra, primera edición"
Output:
{
  "datos_extraidos": {
    "titulo": "Harry Potter y la Piedra Filosofal",
    "editorial": "Salamandra",
    "edicion": "primera"
  },
  "datos_faltantes": [],
  "completitud": 100,
  "listo_para_api": true
}
```

---

### **NODO 4: Validador de Datos**
**Responsabilidad:** Verificar si los datos están completos

**Configuración:**
```json
{
  "tipo": "validador",
  "reglas": {
    "campos_requeridos": ["titulo", "editorial", "edicion"],
    "umbral_completitud": 100
  },
  "mensajes_dinamicos": {
    "falta_titulo": "📚 ¿Cuál es el título del libro que buscas?",
    "falta_editorial": "✏️ ¿De qué editorial es el libro?",
    "falta_edicion": "📖 ¿Qué edición necesitas?",
    "multiple_faltantes": "📚 Para ayudarte mejor, necesito:\n{lista_faltantes}\n\n¿Podrías proporcionarme esta información?"
  },
  "output": {
    "datos_completos": "boolean",
    "mensaje_solicitud": "string | null",
    "siguiente_accion": "continuar | solicitar_datos | error"
  }
}
```

---

### **NODO 5: Router de Intención**
**Responsabilidad:** Dirigir al flujo correcto según la intención

**Configuración:**
```json
{
  "tipo": "router",
  "rutas": [
    {
      "id": "route-1",
      "label": "Buscar Libro",
      "condition": "intencion_detectada == 'buscar_libro' && listo_para_api == true",
      "destino": "woocommerce-search"
    },
    {
      "id": "route-2",
      "label": "Información Estática",
      "condition": "intencion_detectada in ['info_local', 'promociones']",
      "destino": "respuesta-estatica"
    },
    {
      "id": "route-3",
      "label": "Atención Humana",
      "condition": "intencion_detectada == 'atencion_humana'",
      "destino": "whatsapp-derivar-humano"
    },
    {
      "id": "route-4",
      "label": "Datos Incompletos",
      "condition": "listo_para_api == false",
      "destino": "whatsapp-solicitar-datos"
    }
  ]
}
```

---

### **NODO 6: WooCommerce Search**
**Responsabilidad:** Buscar productos en WooCommerce

**Configuración:**
```json
{
  "tipo": "api_call",
  "api": "woocommerce",
  "endpoint": "search-products",
  "parametros_entrada": {
    "search": "{{titulo}} {{editorial}} {{edicion}}"
  },
  "transformacion_respuesta": {
    "arrayPath": "products",
    "mapeo": {
      "id": "id",
      "nombre": "name",
      "precio_lista": "regular_price",
      "precio_efectivo": "sale_price",
      "stock": "stock_quantity"
    }
  },
  "output": {
    "productos": "array",
    "total_encontrados": "number",
    "tiene_resultados": "boolean"
  }
}
```

---

### **NODO 7: Formateador de Respuesta**
**Responsabilidad:** Formatear resultados para WhatsApp

**Configuración:**
```json
{
  "tipo": "formateador_respuesta",
  "templates": {
    "productos_encontrados": "Perfecto😊, estos son los resultados:\n\n{{#each productos}}\n{{add @index 1}}. {{this.nombre}}\n   💰Precio de lista ${{this.precio_lista}}\n   💰Efectivo o transferencia ${{this.precio_efectivo}}\n   📦 Stock: {{this.stock}}\n\n{{/each}}\n💡 ¿Cuál libro querés agregar a tu compra?\n\n-> Escribí el número del libro\n-> Escribí 0 para volver al menú",
    "sin_resultados": "Lo sentimos, este libro parece no encontrarse en stock en este momento...\n\n👉 Elegí una opción:\n1️⃣ Buscar otro título\n2️⃣ Volver al menú principal"
  }
}
```

---

## 🎯 VENTAJAS DE ESTA ARQUITECTURA

### ✅ **Modularidad**
- Cada nodo es independiente
- Fácil de testear individualmente
- Reutilizable en otros flujos

### ✅ **Escalabilidad**
- Agregar nuevas intenciones: solo agregar ruta en Router
- Agregar nuevas APIs: solo agregar nodo ejecutor
- Agregar nuevos tópicos: solo actualizar GPT Conversacional

### ✅ **Mantenibilidad**
- Cambios en un nodo no afectan otros
- Configuración centralizada
- Fácil debugging

### ✅ **Flexibilidad**
- Schema dinámico en Formateador
- Validaciones configurables
- Mensajes personalizables

---

## 🔄 FLUJO DE DATOS EJEMPLO

**Usuario:** "Hola, busco Harry Potter"

1. **WhatsApp Trigger** → `{mensaje: "Hola, busco Harry Potter"}`

2. **GPT Conversacional** → 
   ```json
   {
     "contexto": "Usuario busca libro Harry Potter",
     "intencion": "buscar_libro"
   }
   ```

3. **GPT Formateador** →
   ```json
   {
     "datos_extraidos": {
       "titulo": "Harry Potter",
       "editorial": null,
       "edicion": null
     },
     "datos_faltantes": ["editorial", "edicion"],
     "completitud": 33,
     "listo_para_api": false
   }
   ```

4. **Validador** → `datos_completos: false`
   → Genera mensaje: "📚 Para ayudarte mejor, necesito:\n- Editorial\n- Edición"

5. **Router** → Ruta 4 (Datos Incompletos)

6. **WhatsApp Send** → Envía mensaje solicitando datos

**Usuario:** "Salamandra, primera edición"

7. **GPT Formateador** (segunda pasada) →
   ```json
   {
     "datos_extraidos": {
       "titulo": "Harry Potter",
       "editorial": "Salamandra",
       "edicion": "primera"
     },
     "datos_faltantes": [],
     "completitud": 100,
     "listo_para_api": true
   }
   ```

8. **Router** → Ruta 1 (Buscar Libro)

9. **WooCommerce** → Busca productos

10. **Formateador Respuesta** → Formatea resultados

11. **WhatsApp Send** → Envía productos encontrados

---

## 🛠️ IMPLEMENTACIÓN

Para implementar esta arquitectura, necesitamos:

1. **Actualizar GPT Conversacional** con tópicos estáticos
2. **Configurar GPT Formateador** con schema dinámico
3. **Crear nodo Validador** de datos
4. **Actualizar Router** con múltiples rutas
5. **Crear templates** de mensajes dinámicos

¿Procedemos con la implementación?
