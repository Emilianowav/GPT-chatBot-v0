# 🔄 FLUJO MODULAR VEO VEO - DISEÑO VISUAL

## 📊 ARQUITECTURA COMPLETA

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLUJO MODULAR VEO VEO                               │
│                    Arquitectura Escalable y Mantenible                      │
└─────────────────────────────────────────────────────────────────────────────┘


    ┌──────────────────────┐
    │  WhatsApp Trigger    │  ← Usuario envía mensaje
    │   (Watch Events)     │
    └──────────┬───────────┘
               │ mensaje_usuario, telefono, nombre_contacto
               ↓
    ┌──────────────────────┐
    │ GPT Conversacional   │  ← Personalidad + Tópicos Estáticos
    │  (Veo Veo 📚✏️)      │     • Horarios del local
    └──────────┬───────────┘     • Promociones bancarias
               │                 • Libros de inglés
               │                 • Política de cambios
               │                 • Retiro y envío
               │
               │ contexto_conversacion, intencion_detectada
               ↓
    ┌──────────────────────┐
    │  GPT Formateador     │  ← Extractor de Datos Estructurados
    │  (Schema Dinámico)   │     Schema: {titulo, editorial, edicion}
    └──────────┬───────────┘     Output: datos_extraidos, datos_faltantes[]
               │
               │ datos_extraidos, completitud (0-100%), listo_para_api
               ↓
    ┌──────────────────────┐
    │  Validador de Datos  │  ← Verifica Completitud
    │   (Router Lógico)    │
    └─────┬──────────┬─────┘
          │          │
          │          │ listo_para_api == false
          │          ↓
          │   ┌──────────────────────┐
          │   │ WhatsApp Solicitar   │  ← Mensajes Dinámicos
          │   │   Datos Faltantes    │     "Necesito: editorial, edicion"
          │   └──────────────────────┘
          │          │
          │          └──────┐ (Loop hasta completar)
          │                 │
          │ listo_para_api == true
          ↓
    ┌──────────────────────┐
    │ Router de Búsqueda   │  ← Dirige según Intención
    │  (Condicional)       │
    └─────┬──────────┬─────┘
          │          │
          │          │ completitud < 100
          │          ↓
          │   ┌──────────────────────┐
          │   │ WhatsApp Sin Búsq.   │  ← Mensaje de Ayuda
          │   │  (Mensaje Ayuda)     │
          │   └──────────────────────┘
          │
          │ completitud == 100
          ↓
    ┌──────────────────────┐
    │  WooCommerce Search  │  ← Busca Productos en API
    │   (API Call)         │     Parámetros: titulo + editorial + edicion
    └──────────┬───────────┘
               │ productos[], total_encontrados
               ↓
    ┌──────────────────────┐
    │ WhatsApp Resultados  │  ← Envía Productos Formateados
    │  (Send Message)      │     Template con productos y precios
    └──────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                          FLUJO DE DATOS                                     │
└─────────────────────────────────────────────────────────────────────────────┘

ENTRADA:
  mensaje_usuario: "Busco Harry Potter de Salamandra"
  telefono: "5493794946066"
  nombre_contacto: "Juan Pérez"

PASO 1 - Conversacional:
  → Analiza mensaje
  → Consulta tópicos estáticos (no aplica)
  → Detecta intención: "buscar_libro"
  → Output: {contexto: "Usuario busca Harry Potter Salamandra", intencion: "buscar_libro"}

PASO 2 - Formateador:
  → Extrae datos estructurados
  → Output: {
      datos_extraidos: {titulo: "Harry Potter", editorial: "Salamandra", edicion: null},
      datos_faltantes: ["edicion"],
      completitud: 66,
      listo_para_api: false
    }

PASO 3 - Validador:
  → Verifica: listo_para_api == false
  → Ruta: "Faltan Datos"
  → Siguiente: WhatsApp Solicitar Datos

PASO 4 - WhatsApp Solicitar:
  → Genera mensaje dinámico
  → Envía: "📚 Para ayudarte mejor, necesito:\n- edicion\n\n¿Podrías proporcionarme esta información?"

ENTRADA (segunda iteración):
  mensaje_usuario: "Primera edición"

PASO 5 - Conversacional:
  → Mantiene contexto previo
  → Output: {contexto: "Usuario especifica primera edición", intencion: "buscar_libro"}

PASO 6 - Formateador:
  → Combina con datos previos
  → Output: {
      datos_extraidos: {titulo: "Harry Potter", editorial: "Salamandra", edicion: "primera"},
      datos_faltantes: [],
      completitud: 100,
      listo_para_api: true
    }

PASO 7 - Validador:
  → Verifica: listo_para_api == true
  → Ruta: "Datos Completos"
  → Siguiente: Router de Búsqueda

PASO 8 - Router:
  → Verifica: completitud == 100
  → Ruta: "Buscar en WooCommerce"
  → Siguiente: WooCommerce Search

PASO 9 - WooCommerce:
  → Busca: "Harry Potter Salamandra primera"
  → Output: {productos: [{id: 123, nombre: "Harry Potter...", precio: 25000, stock: 5}], total: 1}

PASO 10 - WhatsApp Resultados:
  → Formatea con template
  → Envía: "Perfecto😊, estos son los resultados:\n\n1. Harry Potter...\n   💰$25000\n   📦 Stock: 5"

SALIDA:
  Mensaje enviado con productos encontrados


┌─────────────────────────────────────────────────────────────────────────────┐
│                    CASOS DE USO ESPECIALES                                  │
└─────────────────────────────────────────────────────────────────────────────┘

CASO 1: Usuario pregunta por horarios
─────────────────────────────────────
Usuario: "¿Cuál es el horario?"

1. Conversacional:
   → Consulta tópico "Información del Local"
   → Responde directamente: "📍 Estamos en San Juan 1037..."
   → intencion: "info_estatica"

2. Formateador:
   → No extrae datos (no es búsqueda de libro)
   → Output: {listo_para_api: false, intencion: "info_estatica"}

3. Validador:
   → Detecta que no es búsqueda
   → Ruta: "Información Estática"

4. WhatsApp:
   → Envía respuesta del Conversacional
   → FIN (no llama API)


CASO 2: Usuario pregunta por promociones
─────────────────────────────────────────
Usuario: "¿Tienen descuentos?"

1. Conversacional:
   → Consulta tópico "Promociones Bancarias"
   → Responde con todas las promos
   → intencion: "info_estatica"

2-4. Similar al Caso 1
   → No llama API
   → Responde con información estática


CASO 3: Usuario da información incompleta múltiples veces
──────────────────────────────────────────────────────────
Usuario: "Busco un libro"

1-3. Conversacional → Formateador → Validador
   → Faltan: titulo, editorial, edicion
   → WhatsApp: "Necesito: titulo, editorial, edicion"

Usuario: "Harry Potter"

4-6. Conversacional → Formateador → Validador
   → Faltan: editorial, edicion
   → WhatsApp: "Necesito: editorial, edicion"

Usuario: "Salamandra primera"

7-10. Conversacional → Formateador → Validador → Router → WooCommerce
   → Todos los datos completos
   → Busca y envía resultados


CASO 4: Usuario quiere atención humana
───────────────────────────────────────
Usuario: "Quiero hablar con alguien"

1. Conversacional:
   → Detecta: intencion: "atencion_humana"

2. Router:
   → Ruta: "Derivar a Humano"

3. WhatsApp:
   → Envía link: "Comunicate con un asesor: https://wa.me/5493794732177"


┌─────────────────────────────────────────────────────────────────────────────┐
│                     CONFIGURACIÓN DE NODOS                                  │
└─────────────────────────────────────────────────────────────────────────────┘

NODO: GPT Conversacional
─────────────────────────
Tipo: conversacional
Modelo: GPT-4
Temperatura: 0.7 (natural)
Max Tokens: 800

Tópicos Estáticos:
  1. info-local: Dirección y horarios
  2. promociones: Todas las promos bancarias
  3. libros-ingles: Pedidos con seña
  4. cambios-devoluciones: Política completa
  5. retiro-envio: Opciones de entrega

Variables Entrada: [mensaje_usuario]
Variables Salida: [contexto_conversacion, intencion_detectada]


NODO: GPT Formateador
─────────────────────
Tipo: formateador
Modelo: GPT-4
Temperatura: 0.3 (preciso)
Max Tokens: 300

Schema Objetivo:
  {
    "titulo": "string (requerido)",
    "editorial": "string (requerido)",
    "edicion": "string (requerido)"
  }

Variables Entrada: [contexto_conversacion]
Variables Salida: [datos_extraidos, datos_faltantes, completitud, listo_para_api]


NODO: Validador de Datos
────────────────────────
Tipo: router
Condiciones:
  - Ruta 1: listo_para_api == true → Router de Búsqueda
  - Ruta 2: listo_para_api == false → WhatsApp Solicitar Datos

Mensajes Dinámicos:
  - falta_titulo: "📚 ¿Cuál es el título del libro que buscas?"
  - falta_editorial: "✏️ ¿De qué editorial es el libro?"
  - falta_edicion: "📖 ¿Qué edición necesitas?"
  - multiple_faltantes: "📚 Para ayudarte mejor, necesito:\n{lista}"


NODO: Router de Búsqueda
────────────────────────
Tipo: router
Condiciones:
  - Ruta 1: completitud == 100 → WooCommerce Search
  - Ruta 2: completitud < 100 → WhatsApp Sin Búsqueda


NODO: WooCommerce Search
────────────────────────
Tipo: api_call
API: woocommerce
Endpoint: search-products
Parámetros: {search: "{{titulo}} {{editorial}} {{edicion}}"}

Response Mapping:
  - arrayPath: "products"
  - idField: "id"
  - displayField: "name"
  - priceField: "price"
  - stockField: "stock_quantity"


┌─────────────────────────────────────────────────────────────────────────────┐
│                        VENTAJAS DEL DISEÑO                                  │
└─────────────────────────────────────────────────────────────────────────────┘

✅ MODULARIDAD
   • Cada nodo tiene una responsabilidad única
   • Fácil de testear individualmente
   • Reutilizable en otros flujos

✅ ESCALABILIDAD
   • Agregar nuevas intenciones: solo actualizar Router
   • Agregar nuevas APIs: solo agregar nodo ejecutor
   • Agregar nuevos tópicos: solo actualizar Conversacional

✅ MANTENIBILIDAD
   • Cambios aislados en cada nodo
   • No hay efectos colaterales
   • Fácil debugging

✅ FLEXIBILIDAD
   • Schema dinámico configurable
   • Validaciones personalizables
   • Mensajes adaptables

✅ EXPERIENCIA DE USUARIO
   • Conversación natural
   • Información estática instantánea
   • Solicitud clara de datos faltantes
   • Loop conversacional hasta completar


┌─────────────────────────────────────────────────────────────────────────────┐
│                         MÉTRICAS Y KPIs                                     │
└─────────────────────────────────────────────────────────────────────────────┘

NODOS: 8
EDGES: 7
PROFUNDIDAD MÁXIMA: 10 pasos
LOOPS POSIBLES: 1 (solicitar datos faltantes)

TIEMPO ESTIMADO POR FLUJO:
  - Info estática: 2-3 segundos (1 nodo GPT)
  - Búsqueda completa: 8-12 segundos (2-3 nodos GPT + API)
  - Con datos faltantes: +3-5 segundos por iteración

TOKENS ESTIMADOS:
  - Conversacional: ~500 tokens/llamada
  - Formateador: ~200 tokens/llamada
  - Total flujo completo: ~1000-1500 tokens


┌─────────────────────────────────────────────────────────────────────────────┐
│                      PRÓXIMAS MEJORAS                                       │
└─────────────────────────────────────────────────────────────────────────────┘

🔮 FASE 2: Agregar más intenciones
   • Rastreo de pedidos
   • Consulta de stock sin compra
   • Reserva de libros

🔮 FASE 3: Memoria conversacional
   • Recordar búsquedas previas del usuario
   • Sugerencias personalizadas
   • Historial de compras

🔮 FASE 4: Integración con más APIs
   • Sistema de pagos (MercadoPago)
   • Sistema de envíos
   • CRM para seguimiento

🔮 FASE 5: Analytics
   • Dashboard de métricas
   • Intenciones más comunes
   • Tasa de conversión
   • Tiempo promedio de respuesta
