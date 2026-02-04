# Documentación de Nodos - Índice General

## 📚 Documentación Disponible

Esta carpeta contiene la documentación completa de todos los tipos de nodos disponibles en el sistema de flujos conversacionales.

---

## 📖 Nodos Principales

### 1. [Nodo GPT](./NODO-GPT.md)
**Tipos:** Conversacional, Formateador, Transform

Integración con modelos de lenguaje de OpenAI para:
- Conversaciones naturales con usuarios
- Extracción de datos estructurados (JSON)
- Transformación de datos
- Recopilación de variables
- Acceso a tópicos de conocimiento

**Casos de uso:**
- Asistente de ventas conversacional
- Extractor de información de conversaciones
- Formateador de datos de productos
- Recopilador de datos de clientes

---

### 2. [Nodo Router](./NODO-ROUTER.md)
**Tipo:** Enrutamiento condicional

Permite dividir el flujo en múltiples caminos basándose en condiciones:
- Evaluación de variables
- Validación de estados
- Lógica de negocio
- Rutas por defecto (fallback)

**Operadores disponibles:**
- `exists`, `not exists`
- `empty`, `not_empty`
- `equals`, `not equals`
- `contains`, `not contains`

**Casos de uso:**
- Verificar si se completaron todas las variables
- Validar si se encontraron productos
- Evaluar respuestas del usuario (Sí/No)
- Dirigir según tipo de producto

---

### 3. [Nodo WooCommerce](./NODO-WOOCOMMERCE.md)
**Módulos:** search-product, get-product, list-products, get-categories

Integración completa con WooCommerce:
- Búsqueda de productos (simple y múltiple)
- Obtención de detalles de productos
- Listado con filtros
- Gestión de categorías
- Simplificación automática para GPT

**Características especiales:**
- Búsqueda múltiple paralela (separador `" | "`)
- Normalización automática de términos
- URLs completas automáticas
- Optimización de tokens

**Casos de uso:**
- Búsqueda de libros por título
- Búsqueda múltiple ("libro 1 y libro 2")
- Filtrado por categoría
- Productos en stock

---

### 4. [Nodo WhatsApp](./NODO-WHATSAPP.md)
**Tipos:** Texto, Imagen, Documento, Ubicación

Envío de mensajes a través de WhatsApp Business API:
- Mensajes de texto con formato
- Imágenes con caption
- Documentos (PDF, etc.)
- Ubicaciones geográficas
- Resolución automática de variables

**Características:**
- Formato de WhatsApp (negrita, cursiva, etc.)
- Variables dinámicas en mensajes
- Tópicos en mensajes
- Validación de teléfonos

**Casos de uso:**
- Responder al usuario
- Enviar productos encontrados
- Notificar a administradores
- Compartir ubicación de tienda

---

### 5. [Nodo Google Sheets](./NODO-GOOGLE-SHEETS.md)
**Tipo:** Integración OAuth con Google Sheets

Integración completa con Google Sheets mediante OAuth 2.0:
- Lectura de datos de hojas de cálculo
- Escritura y actualización de filas
- Búsqueda y filtrado de datos
- Creación de nuevas hojas
- Autorización con un solo botón
- Tokens encriptados y refresh automático

**Módulos disponibles:**
- `read` - Leer datos de rangos
- `write` - Escribir datos
- `append` - Agregar filas
- `update` - Actualizar celdas
- `search` - Buscar en columnas
- `create-sheet` - Crear nueva hoja

**Casos de uso:**
- Guardar leads en hoja de cálculo
- Buscar clientes en base de datos
- Actualizar inventario
- Registrar pedidos automáticamente

---

### 6. [Nodo Google Calendar](./NODO-GOOGLE-CALENDAR.md)
**Tipo:** Integración OAuth con Google Calendar

Gestión completa de calendarios de Google mediante OAuth 2.0:
- Crear eventos automáticamente
- Listar eventos próximos
- Actualizar y eliminar eventos
- Verificar disponibilidad horaria
- Enviar invitaciones automáticas
- Recordatorios configurables

**Módulos disponibles:**
- `create-event` - Crear evento
- `list-events` - Listar eventos
- `update-event` - Actualizar evento
- `delete-event` - Eliminar evento
- `check-availability` - Verificar disponibilidad

**Casos de uso:**
- Sistema de reserva de turnos
- Agendar reuniones automáticamente
- Cancelar/reprogramar citas
- Verificar horarios disponibles
- Enviar recordatorios a clientes

---

### 7. [Condicionales en Conexiones](./CONDICIONALES.md)
**Documentación:** Condiciones en edges/conexiones

Guía completa sobre cómo configurar condiciones en las conexiones entre nodos:
- Sintaxis de operadores
- Evaluación de condiciones
- Ejemplos completos
- Troubleshooting
- Mejores prácticas

**Operadores:**
- `exists` / `not exists`
- `empty` / `not_empty`
- `equals` / `not equals`
- `contains` / `not contains`

---

## 🎯 Flujos de Ejemplo

### Flujo 1: Búsqueda de Productos

```
[Trigger WhatsApp] → Usuario: "Busco harry potter 2 y 5"
    ↓
[GPT Formateador] → Extrae: titulo = "Harry Potter y la Cámara Secreta | Harry Potter y la Orden del Fénix"
    ↓
[Router] → ¿Variables completas?
    ├─ [SI] → [WooCommerce] → Busca ambos libros en paralelo
    │             ↓
    │         [Router] → ¿Productos encontrados?
    │             ├─ [SI] → [GPT Asistente] → Formatea productos
    │             │             ↓
    │             │         [WhatsApp] → Envía productos al usuario
    │             │
    │             └─ [NO] → [WhatsApp] → "No encontré esos libros"
    │
    └─ [NO] → [GPT Pedir Datos] → "¿Qué libro buscas?"
                  ↓
              [WhatsApp] → Envía pregunta
```

### Flujo 2: Confirmación de Pedido

```
[WhatsApp] → "¿Confirmas el pedido?"
    ↓
[Trigger] → Recibe respuesta del usuario
    ↓
[Router] → ¿Usuario confirma?
    ├─ [respuesta contains si] → [Crear Pedido]
    │                                ↓
    │                            [WhatsApp] → "¡Pedido confirmado!"
    │
    └─ [respuesta contains no] → [WhatsApp] → "Pedido cancelado"
```

---

## 🔧 Configuración General

### Variables Globales

Las variables globales están disponibles en todos los nodos mediante la sintaxis `{{variable}}`:

```javascript
{{titulo}}                    // Variable simple
{{variables_completas}}       // Variable de estado
{{woocommerce.productos}}     // Output de nodo
{{topicos.horarios.descripcion}} // Tópico global
```

### Tópicos

Los tópicos son información de conocimiento base disponible en todo momento:

**Tópicos Globales** (nivel flujo):
```javascript
{{topicos.horarios.descripcion}}
{{topicos.medios_pago.descripcion}}
{{topicos.empresa.ubicacion}}
```

**Tópicos Locales** (nivel nodo):
Configurables desde el frontend en cada nodo GPT.

### Conexiones

Las conexiones pueden tener condiciones:

```json
{
  "source": "router-1",
  "target": "nodo-destino",
  "data": {
    "condition": "variables_completas equals true",
    "label": "✅ Completas"
  }
}
```

---

## 🐛 Debug y Logs

### Logs por Nodo

Cada nodo genera logs específicos:

**GPT:**
```
💬 [GPT CONVERSACIONAL] Procesando mensaje...
📚 [TÓPICOS LOCALES] Agregando 2 tópico(s)
✅ [GPT] Respuesta generada (245 tokens)
```

**Router:**
```
🔀 [ROUTER] Evaluando condiciones...
✅ Condición cumplida: "variables_completas equals true"
🎯 Ruta seleccionada: woocommerce-search
```

**WooCommerce:**
```
📦 [WOOCOMMERCE] Ejecutando módulo: search-product
🔍 BÚSQUEDA MÚLTIPLE detectada
✅ Total productos únicos: 7
```

**WhatsApp:**
```
📱 [WHATSAPP] Enviando mensaje...
📞 Teléfono: 5493794732177
✅ Mensaje enviado correctamente
```

---

## ⚠️ Errores Comunes

### 1. Variables Sin Resolver

**Síntoma:** `{{variable}}` aparece literal en el mensaje

**Solución:**
- Verificar que la variable existe
- Verificar sintaxis exacta
- Revisar logs de variables globales

### 2. Condiciones No Reconocidas

**Síntoma:** `⚠️ ADVERTENCIA: Condición no reconocida`

**Solución:**
- Usar operadores correctos (`equals`, no `==`)
- Verificar sintaxis exacta
- Ver [CONDICIONALES.md](./CONDICIONALES.md)

### 3. Búsqueda Múltiple No Funciona

**Síntoma:** Solo encuentra un producto cuando usuario pide varios

**Solución:**
- Formateador debe extraer con separador `" | "`
- Ejemplo: `"Libro 1 | Libro 2 | Libro 3"`
- Ver [NODO-WOOCOMMERCE.md](./NODO-WOOCOMMERCE.md)

### 4. Productos Sin URLs

**Síntoma:** URLs incompletas o faltantes

**Solución:**
- Configurar `eshopUrl` en conexión WooCommerce
- Sistema construye URLs completas automáticamente
- Ver [NODO-WOOCOMMERCE.md](./NODO-WOOCOMMERCE.md)

---

## 🎨 Mejores Prácticas

### 1. Nombres Descriptivos

```javascript
// ❌ Mal
"router-1", "gpt-1", "whatsapp-1"

// ✅ Bien
"router-variables", "gpt-formateador", "whatsapp-respuesta"
```

### 2. Logs Claros

Todos los nodos generan logs descriptivos para facilitar el debug.

### 3. Validación de Variables

Siempre verificar que las variables existen antes de usarlas:

```javascript
// Usar router para validar
"variables_completas equals true"
```

### 4. Rutas por Defecto

Siempre incluir una ruta sin condición como fallback en routers.

### 5. Simplificación de Datos

Simplificar productos de WooCommerce antes de pasarlos a GPT para reducir tokens.

---

## 📚 Documentación Relacionada

### Documentación General
- `../SISTEMA-TOPICOS.md` - Sistema de tópicos de conocimiento
- `../GUIA-DEBUG-FLUJO.md` - Guía completa de debug
- `../FIXES-FLUJO-WOOCOMMERCE.md` - Fixes aplicados al flujo
- `../VEO-VEO-GPT-CONFIGURACION.md` - Configuración de Veo Veo

### Documentación de Nodos
- [NODO-GPT.md](./NODO-GPT.md)
- [NODO-ROUTER.md](./NODO-ROUTER.md)
- [NODO-WOOCOMMERCE.md](./NODO-WOOCOMMERCE.md)
- [NODO-WHATSAPP.md](./NODO-WHATSAPP.md)
- [NODO-GOOGLE-SHEETS.md](./NODO-GOOGLE-SHEETS.md) ⭐ Nuevo
- [NODO-GOOGLE-CALENDAR.md](./NODO-GOOGLE-CALENDAR.md) ⭐ Nuevo
- [CONDICIONALES.md](./CONDICIONALES.md)

### Documentación OAuth
- [../OAUTH-IMPLEMENTATION.md](../OAUTH-IMPLEMENTATION.md) - Guía completa de implementación OAuth 2.0

---

## 🚀 Próximos Pasos

### Para Desarrolladores

1. Leer documentación del nodo que vas a usar
2. Revisar ejemplos de configuración
3. Verificar logs durante ejecución
4. Usar guía de debug si hay problemas

### Para Usuarios

1. Configurar nodos desde el frontend
2. Conectar nodos con condiciones
3. Probar flujo completo
4. Revisar logs si algo falla

---

**Creado:** 2026-01-15  
**Última actualización:** 2026-01-15  
**Versión:** 1.0
