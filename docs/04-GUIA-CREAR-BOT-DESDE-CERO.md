# GUÍA PASO A PASO: CREAR UN BOT DESDE CERO

## Índice
1. [Preparación Inicial](#preparación-inicial)
2. [Crear el Flujo Base](#crear-el-flujo-base)
3. [Configurar Tópicos](#configurar-tópicos)
4. [Diseñar el Flujo](#diseñar-el-flujo)
5. [Configurar Nodos](#configurar-nodos)
6. [Probar el Flujo](#probar-el-flujo)
7. [Activar en Producción](#activar-en-producción)

---

## Preparación Inicial

### 1. Definir el Propósito del Bot

Antes de empezar, responde estas preguntas:

- **¿Qué hace el bot?** (ventas, soporte, reservas, información)
- **¿Qué información necesita del usuario?** (nombre, teléfono, dirección, etc.)
- **¿Qué acciones realiza?** (buscar productos, crear pedidos, enviar información)
- **¿Qué integraciones necesita?** (WooCommerce, MercadoPago, APIs externas)

### 2. Mapear el Flujo en Papel

Dibuja el flujo completo antes de implementarlo:

```
Usuario envía mensaje
    ↓
Webhook WhatsApp
    ↓
GPT Clasificador (¿qué quiere el usuario?)
    ↓
Router Principal
    ├─→ Búsqueda → WooCommerce → GPT Asistente → WhatsApp
    ├─→ Carrito → GPT Armar Carrito → Router Carrito
    │                                    ├─→ Pagar → MercadoPago → WhatsApp Link
    │                                    └─→ Modificar → WooCommerce
    └─→ Consulta → GPT Responder → WhatsApp
```

### 3. Preparar Información de la Empresa

Recopila toda la información que el bot necesitará:

```json
{
  "empresa": {
    "nombre": "Tu Empresa",
    "ubicacion": "Dirección completa",
    "whatsapp": "54937940XXXXX",
    "email": "info@empresa.com"
  },
  "horarios": {
    "lunes_viernes": "9:00-18:00",
    "sabados": "9:00-13:00",
    "domingos": "Cerrado"
  },
  "productos_servicios": {
    "categoria_1": {
      "descripcion": "Descripción detallada",
      "precio_desde": 1000
    }
  },
  "politicas": {
    "envios": "Descripción de política de envíos",
    "devoluciones": "Descripción de política de devoluciones",
    "pagos": "Medios de pago aceptados"
  }
}
```

---

## Crear el Flujo Base

### 1. Crear Flujo desde el Frontend

```typescript
// En /dashboard/flows
1. Click en "Nuevo Flujo"
2. Completar formulario:
   - Nombre: "Mi Bot v1"
   - Descripción: "Bot de ventas/soporte/etc"
   - Categoría: "ventas" | "soporte" | "reservas" | "informacion"
   - Tipo: "visual"
3. Click en "Crear"
```

### 2. Estructura Inicial en BD

Al crear el flujo, se guarda en MongoDB con esta estructura:

```json
{
  "_id": "auto-generado",
  "empresaId": "Tu Empresa",
  "id": "mi-bot-v1",
  "nombre": "Mi Bot v1",
  "descripcion": "Bot de ventas/soporte/etc",
  "categoria": "ventas",
  "botType": "visual",
  "startNode": "webhook-whatsapp",
  "activo": false,
  "nodes": [],
  "edges": [],
  "config": {
    "topicos_habilitados": false,
    "topicos": {}
  },
  "createdBy": "usuario@email.com",
  "createdAt": "2026-01-17T00:00:00Z",
  "updatedAt": "2026-01-17T00:00:00Z"
}
```

---

## Configurar Tópicos

### 1. Habilitar Tópicos Globales

```typescript
// En el flow-builder, configuración del flujo
{
  "config": {
    "topicos_habilitados": true,
    "topicos": {}
  }
}
```

### 2. Agregar Tópicos

```json
{
  "config": {
    "topicos_habilitados": true,
    "topicos": {
      "empresa": {
        "nombre": "Librería Veo Veo",
        "ubicacion": "San Juan 1037, Corrientes Capital",
        "whatsapp": "5493794732177",
        "email": "info@veoveo.com",
        "redes_sociales": {
          "instagram": "@veoveo",
          "facebook": "LibreriaVeoVeo"
        }
      },
      "horarios": {
        "lunes_viernes": "8:30-12:00 y 17:00-21:00",
        "sabados": "9:00-13:00 y 17:00-21:00",
        "domingos": "Cerrado",
        "feriados": "Consultar por WhatsApp"
      },
      "tono_comunicacion": {
        "estilo": "Amigable, cercano, usa emojis",
        "tratamiento": "Vos (argentino)",
        "emojis_frecuentes": "📚 📖 ✨ 💰 📦"
      },
      "productos": {
        "categorias": ["Libros", "Útiles escolares", "Juguetes educativos"],
        "libros_ingles": {
          "disponible": true,
          "descripcion": "Amplia variedad de libros en inglés para todos los niveles",
          "niveles": ["Principiante", "Intermedio", "Avanzado"]
        },
        "libros_infantiles": {
          "disponible": true,
          "edades": "0-12 años",
          "destacados": ["Cuentos clásicos", "Libros ilustrados", "Primeros lectores"]
        }
      },
      "politica_envios": {
        "descripcion": "Envíos a todo el país",
        "corrientes_capital": "Envío gratis en compras mayores a $10000",
        "interior": "Costo según destino y peso",
        "tiempo_entrega": "3-5 días hábiles",
        "correo": "Correo Argentino y OCA"
      },
      "politica_retiro": {
        "disponible": true,
        "ubicacion": "San Juan 1037, Corrientes Capital",
        "horarios": "Lunes a viernes 8:30-12:00 y 17:00-21:00"
      },
      "medios_pago": {
        "efectivo": true,
        "transferencia": true,
        "mercadopago": true,
        "tarjetas": ["Visa", "Mastercard", "Naranja"],
        "descuento_efectivo": 10,
        "cuotas_sin_interes": 3
      },
      "atencion_personalizada": {
        "whatsapp": "Respuesta en minutos",
        "consultas_especiales": "Podemos conseguir libros bajo pedido",
        "recomendaciones": "Nuestro equipo puede recomendarte libros según tus gustos"
      }
    }
  }
}
```

### 3. Verificar Tópicos

Los tópicos se inyectarán automáticamente en TODOS los nodos GPT cuando `topicos_habilitados = true`.

---

## Diseñar el Flujo

### Paso 1: Agregar Nodo Webhook (Trigger)

```typescript
// Nodo inicial - SIEMPRE es un webhook
{
  id: "webhook-whatsapp",
  type: "webhook",
  category: "trigger",
  position: { x: 100, y: 100 },
  data: {
    label: "WhatsApp Business Cloud API",
    config: {
      webhookType: "whatsapp"
    }
  }
}
```

**Configuración:**
- No requiere configuración adicional
- Es el punto de entrada del flujo
- Output: `{ telefono, mensaje_usuario, nombre_contacto }`

### Paso 2: Agregar GPT Clasificador

```typescript
{
  id: "gpt-clasificador",
  type: "gpt",
  category: "processor",
  position: { x: 300, y: 100 },
  data: {
    label: "GPT Clasificador",
    config: {
      tipo: "conversacional",
      modelo: "gpt-4",
      systemPrompt: `Sos un clasificador de intenciones para una librería.

TU TAREA:
Clasificar la intención del usuario en UNA de estas categorías:
- busqueda: El usuario busca un producto específico
- carrito: El usuario quiere comprar, agregar al carrito, o pagar
- consulta: El usuario pregunta por horarios, ubicación, envíos, etc.
- saludo: El usuario saluda o inicia conversación

IMPORTANTE:
- Respondé SOLO con la categoría (busqueda, carrito, consulta, o saludo)
- NO agregues explicaciones
- NO uses variables

EJEMPLOS:
Usuario: "Hola" → saludo
Usuario: "busco harry potter" → busqueda
Usuario: "quiero comprar" → carrito
Usuario: "cuál es el horario?" → consulta`
    }
  }
}
```

**Conexión:**
```json
{
  "source": "webhook-whatsapp",
  "target": "gpt-clasificador"
}
```

### Paso 3: Agregar Router Principal

```typescript
{
  id: "router-principal",
  type: "router",
  category: "processor",
  position: { x: 500, y: 100 },
  data: {
    label: "Router Principal",
    config: {},
    handles: [
      {
        id: "route-saludo",
        label: "Saludo",
        condition: "{{gpt-clasificador.respuesta_gpt}} == 'saludo'"
      },
      {
        id: "route-busqueda",
        label: "Búsqueda",
        condition: "{{gpt-clasificador.respuesta_gpt}} == 'busqueda'"
      },
      {
        id: "route-carrito",
        label: "Carrito",
        condition: "{{gpt-clasificador.respuesta_gpt}} == 'carrito'"
      },
      {
        id: "route-consulta",
        label: "Consulta",
        condition: "{{gpt-clasificador.respuesta_gpt}} == 'consulta'"
      }
    ]
  }
}
```

**Conexión:**
```json
{
  "source": "gpt-clasificador",
  "target": "router-principal"
}
```

### Paso 4: Agregar Ramas del Router

#### Rama 1: Saludo

```typescript
// GPT Saludo
{
  id: "gpt-saludo",
  type: "gpt",
  position: { x: 700, y: 50 },
  data: {
    label: "GPT Saludo",
    config: {
      tipo: "conversacional",
      modelo: "gpt-4",
      systemPrompt: `Sos el asistente de la librería.

TU TAREA:
- Saludar al usuario de forma amigable
- Presentar brevemente la librería
- Preguntar en qué podés ayudar

IMPORTANTE:
- Usá emojis
- Sé breve y directo
- Mencioná que pueden buscar libros, consultar horarios, o hacer pedidos`
    }
  }
}

// WhatsApp Saludo
{
  id: "whatsapp-saludo",
  type: "whatsapp",
  position: { x: 900, y: 50 },
  data: {
    label: "WhatsApp Saludo",
    config: {
      telefono: "{{telefono}}",
      mensaje: "{{gpt-saludo.respuesta_gpt}}"
    }
  }
}
```

**Conexiones:**
```json
[
  {
    "source": "router-principal",
    "sourceHandle": "route-saludo",
    "target": "gpt-saludo"
  },
  {
    "source": "gpt-saludo",
    "target": "whatsapp-saludo"
  }
]
```

#### Rama 2: Búsqueda

```typescript
// WooCommerce Search
{
  id: "woocommerce-search",
  type: "woocommerce",
  position: { x: 700, y: 150 },
  data: {
    label: "WooCommerce",
    config: {
      action: "search",
      searchTerm: "{{mensaje_usuario}}",
      maxResults: 10,
      fieldMappings: [
        { source: "name", target: "titulo" },
        { source: "price", target: "precio" },
        { source: "regular_price", target: "precio_lista" },
        { source: "stock_quantity", target: "stock" }
      ]
    }
  }
}

// GPT Asistente Ventas
{
  id: "gpt-asistente",
  type: "gpt",
  position: { x: 900, y: 150 },
  data: {
    label: "GPT Asistente Ventas",
    config: {
      tipo: "conversacional",
      modelo: "gpt-4",
      systemPrompt: `Sos el asistente de ventas de la librería.

TU TAREA:
- Presentar los resultados de búsqueda de forma atractiva
- Ayudar al cliente a elegir
- Ofrecer agregar productos al carrito

FORMATO cuando tenés resultados:
Perfecto😊, encontré estos libros:

📚 Resultados:

1. [Título]
   💰 Precio de lista: $[precio_lista]
   💰 Efectivo o transferencia: $[precio] (10% OFF)
   📦 Stock: [stock] unidades

¿Te interesa alguno? Decime el número o nombre para agregarlo al carrito.

FORMATO cuando NO hay resultados:
No encontré resultados para "[búsqueda]" 😔

Pero puedo ayudarte:
- Buscá por autor, título o tema
- Consultá por libros bajo pedido
- Explorá nuestras categorías: [categorías]

¿Qué te gustaría buscar?`
    }
  }
}

// WhatsApp Asistente
{
  id: "whatsapp-asistente",
  type: "whatsapp",
  position: { x: 1100, y: 150 },
  data: {
    label: "WhatsApp Asistente",
    config: {
      telefono: "{{telefono}}",
      mensaje: "{{gpt-asistente.respuesta_gpt}}"
    }
  }
}
```

**Conexiones:**
```json
[
  {
    "source": "router-principal",
    "sourceHandle": "route-busqueda",
    "target": "woocommerce-search"
  },
  {
    "source": "woocommerce-search",
    "target": "gpt-asistente"
  },
  {
    "source": "gpt-asistente",
    "target": "whatsapp-asistente"
  }
]
```

#### Rama 3: Carrito

```typescript
// GPT Armar Carrito
{
  id: "gpt-armar-carrito",
  type: "gpt",
  position: { x: 700, y: 250 },
  data: {
    label: "GPT Armar Carrito",
    config: {
      tipo: "conversacional",
      modelo: "gpt-4",
      systemPrompt: `Sos el asistente de carrito de la librería.

TU TAREA:
- Procesar el pedido del usuario
- Armar el carrito con los productos solicitados
- Calcular el total
- Preguntar si quiere pagar o modificar

IMPORTANTE:
- Guardá los items en formato JSON
- Calculá el total correctamente
- Aplicá descuentos si corresponde`
    }
  }
}

// Router Carrito
{
  id: "router-carrito",
  type: "router",
  position: { x: 900, y: 250 },
  data: {
    label: "Router Carrito",
    handles: [
      {
        id: "route-pagar",
        label: "Pagar",
        condition: "{{gpt-armar-carrito.accion}} == 'pagar'"
      },
      {
        id: "route-modificar",
        label: "Modificar",
        condition: "{{gpt-armar-carrito.accion}} == 'modificar'"
      }
    ]
  }
}

// MercadoPago
{
  id: "mercadopago",
  type: "mercadopago",
  position: { x: 1100, y: 200 },
  data: {
    label: "MercadoPago",
    config: {
      items: "{{gpt-armar-carrito.items}}",
      total: "{{gpt-armar-carrito.total}}"
    }
  }
}

// WhatsApp Link Pago
{
  id: "whatsapp-link-pago",
  type: "whatsapp",
  position: { x: 1300, y: 200 },
  data: {
    label: "WhatsApp Link Pago",
    config: {
      telefono: "{{telefono}}",
      mensaje: `💳 ¡Listo para pagar!

Tu pedido:
{{gpt-armar-carrito.resumen}}

💰 Total: ${{gpt-armar-carrito.total}}

👇 Pagá de forma segura con Mercado Pago:
{{mercadopago.init_point}}

⏰ Este link expira en 24 horas`
    }
  }
}
```

**Conexiones:**
```json
[
  {
    "source": "router-principal",
    "sourceHandle": "route-carrito",
    "target": "gpt-armar-carrito"
  },
  {
    "source": "gpt-armar-carrito",
    "target": "router-carrito"
  },
  {
    "source": "router-carrito",
    "sourceHandle": "route-pagar",
    "target": "mercadopago"
  },
  {
    "source": "mercadopago",
    "target": "whatsapp-link-pago"
  },
  {
    "source": "router-carrito",
    "sourceHandle": "route-modificar",
    "target": "woocommerce-search"
  }
]
```

#### Rama 4: Consulta

```typescript
// GPT Responder Consulta
{
  id: "gpt-consulta",
  type: "gpt",
  position: { x: 700, y: 350 },
  data: {
    label: "GPT Consulta",
    config: {
      tipo: "conversacional",
      modelo: "gpt-4",
      systemPrompt: `Sos el asistente de atención al cliente de la librería.

TU TAREA:
- Responder consultas sobre horarios, ubicación, envíos, pagos, etc.
- Usar la información de los tópicos
- Ser claro y completo

IMPORTANTE:
- Usá la información que tenés en tu contexto directamente
- NO inventes información
- Si no sabés algo, ofrecé contactar por WhatsApp`
    }
  }
}

// WhatsApp Consulta
{
  id: "whatsapp-consulta",
  type: "whatsapp",
  position: { x: 900, y: 350 },
  data: {
    label: "WhatsApp Consulta",
    config: {
      telefono: "{{telefono}}",
      mensaje: "{{gpt-consulta.respuesta_gpt}}"
    }
  }
}
```

**Conexiones:**
```json
[
  {
    "source": "router-principal",
    "sourceHandle": "route-consulta",
    "target": "gpt-consulta"
  },
  {
    "source": "gpt-consulta",
    "target": "whatsapp-consulta"
  }
]
```

---

## Configurar Nodos

### Checklist de Configuración

Para cada nodo, verificar:

#### ✅ Nodos GPT
- [ ] `tipo` está definido: `conversacional`, `formateador`, o `transform`
- [ ] `modelo` está definido: `gpt-4` o `gpt-3.5-turbo`
- [ ] `systemPrompt` es claro y específico
- [ ] No usa variables en el prompt (usa información directa)
- [ ] Si es formateador, tiene `extractionConfig` completo

#### ✅ Nodos Router
- [ ] Tiene al menos 2 `handles`
- [ ] Cada handle tiene `id`, `label`, y `condition`
- [ ] Las condiciones son válidas y usan variables correctas
- [ ] Hay una ruta por defecto con `condition: "true"`
- [ ] Cada handle tiene una conexión con `sourceHandle`

#### ✅ Nodos WhatsApp
- [ ] `telefono` usa variable: `"{{telefono}}"`
- [ ] `mensaje` usa variable o texto fijo
- [ ] Las variables existen en el contexto

#### ✅ Nodos WooCommerce
- [ ] `action` está definido: `search`
- [ ] `searchTerm` usa variable: `"{{mensaje_usuario}}"`
- [ ] `maxResults` es razonable: `10-20`
- [ ] `fieldMappings` simplifica los productos

#### ✅ Nodos MercadoPago
- [ ] `items` usa variable del carrito
- [ ] `total` usa variable del carrito
- [ ] Las variables existen en el output del nodo anterior

---

## Probar el Flujo

### 1. Limpiar Estado del Usuario

Antes de cada prueba, limpiar el estado:

```bash
cd backend
node scripts/limpiar-mi-numero.js
```

### 2. Activar el Flujo

En el flow-builder:
1. Click en el botón "Activar" (▶️)
2. Verificar que el indicador muestre "🟢 Activo"

### 3. Enviar Mensajes de Prueba

Enviar mensajes al bot de WhatsApp:

```
Prueba 1: Saludo
Usuario: "Hola"
Esperado: Saludo amigable + presentación

Prueba 2: Búsqueda
Usuario: "busco harry potter"
Esperado: Lista de libros de Harry Potter

Prueba 3: Carrito
Usuario: "quiero el 1 y el 3"
Esperado: Confirmación de productos agregados

Prueba 4: Pago
Usuario: "quiero pagar"
Esperado: Link de MercadoPago

Prueba 5: Consulta
Usuario: "cuál es el horario?"
Esperado: Horarios de atención
```

### 4. Revisar Logs del Backend

```bash
# Ver logs en tiempo real
cd backend
npm run dev

# Buscar errores
grep "ERROR" logs/app.log
grep "❌" logs/app.log
```

### 5. Verificar en MongoDB

```javascript
// Conectar a MongoDB
use chatbot_db

// Ver el flujo
db.flows.findOne({ nombre: "Mi Bot v1" })

// Ver estados de conversación
db.conversation_states.find({ telefono: "5493794946066" })

// Ver historial
db.historial_conversaciones.find({ telefono: "5493794946066" })
```

---

## Activar en Producción

### 1. Verificar Configuración

- [ ] Todos los nodos están configurados correctamente
- [ ] Todas las conexiones están bien definidas
- [ ] Los tópicos están completos y actualizados
- [ ] El flujo fue probado exhaustivamente
- [ ] No hay errores en los logs

### 2. Deployar Cambios

```bash
# Hacer commit de cambios
git add .
git commit -m "feat: Nuevo bot Mi Bot v1"
git push origin main

# Esperar deploy en Render (5-10 min)
```

### 3. Activar en Producción

Desde el flow-builder en producción:
1. Cargar el flujo
2. Verificar configuración
3. Click en "Activar"
4. Verificar estado: "🟢 Activo"

### 4. Monitorear

- Revisar logs del backend en Render
- Probar con usuarios reales
- Monitorear errores
- Ajustar según feedback

---

Continúa en: `05-TROUBLESHOOTING-FAQ.md`
