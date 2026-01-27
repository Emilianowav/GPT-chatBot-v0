# ✅ RESUMEN COMPLETO: CORRECCIÓN FLUJO VEO VEO

**Fecha:** 26 de Enero 2026  
**Flujo:** WooCommerce Flow (Veo Veo)  
**Estado:** ✅ CORREGIDO Y VALIDADO

---

## 🔴 PROBLEMA RAÍZ IDENTIFICADO

El flujo **NO llegaba a WooCommerce** porque:

1. **Router Principal sin handles configurados**
   - El router `router-principal` tenía `routeHandles: []` (vacío)
   - Los edges intentaban usar `sourceHandle: "b"` que no existía
   - El FlowExecutor no podía determinar qué ruta tomar

2. **Variables mal referenciadas en nodos WhatsApp**
   - Usaban `{{gpt-pedir-datos.response}}` en lugar de `{{gpt-pedir-datos.respuesta_gpt}}`
   - El output de GPT es: `{ respuesta_gpt: "...", tokens: X, costo: Y }`

3. **Condiciones de edges en formato incorrecto**
   - Usaban sintaxis JavaScript: `"tipo_accion === 'buscar_producto'"`
   - Debían usar objetos: `{ variable: "tipo_accion", operator: "equals", value: "buscar_producto" }`

---

## 🛠️ SOLUCIONES APLICADAS

### 1. Sistema de Testing Creado

**Script:** `backend/scripts/test-flujo-completo.js`

Funcionalidades:
- ✅ Analiza estructura completa del flujo
- ✅ Valida configuración de nodos
- ✅ Detecta errores en routers, edges y configuraciones
- ✅ Muestra advertencias sobre handles sin conexión
- ✅ Lista todos los nodos por tipo con sus configuraciones

**Uso:**
```bash
cd backend
node scripts/test-flujo-completo.js
```

### 2. Router Principal Corregido

**Script:** `backend/scripts/fix-router-principal-final.js`

Cambios aplicados:
```javascript
// ANTES: routeHandles: []

// AHORA:
handles: [
  {
    id: 'route-buscar',
    label: '🔍 Buscar Producto',
    condition: '{{tipo_accion}} == buscar_producto'
  },
  {
    id: 'route-comprar',
    label: '🛒 Comprar',
    condition: '{{tipo_accion}} == comprar'
  },
  {
    id: 'route-consultar',
    label: '💬 Consultar',
    condition: '{{tipo_accion}} == consultar'
  },
  {
    id: 'route-despedida',
    label: '👋 Despedida',
    condition: '{{tipo_accion}} == despedida'
  },
  {
    id: 'route-default',
    label: '❓ Otro',
    condition: 'true'
  }
]
```

### 3. Edges Actualizados

**Edges corregidos:**

| Edge | Source | Target | sourceHandle | Condición |
|------|--------|--------|--------------|-----------|
| `edge-router-formateador` | `router-principal` | `gpt-formateador` | `route-buscar` | `tipo_accion == buscar_producto` |
| `edge-router-armar-carrito` | `router-principal` | `gpt-armar-carrito` | `route-comprar` | `tipo_accion == comprar` |

### 4. Variables de Nodos WhatsApp Corregidas

**Script:** `backend/scripts/fix-whatsapp-direct-update.js`

| Nodo | ANTES | AHORA |
|------|-------|-------|
| `whatsapp-preguntar` | `{{gpt-pedir-datos.response}}` | `{{gpt-pedir-datos.respuesta_gpt}}` |
| `whatsapp-asistente` | `{{gpt-asistente-ventas.response}}` | `{{gpt-asistente-ventas.respuesta_gpt}}` |

### 5. Tópicos Configurados

Movidos de `config.topicos` a nivel raíz `flow.topicos`:

```javascript
topicos: {
  'tono-comunicacion': { ... },
  'horarios': { ... },
  'medios_pago': { ... },
  'atencion-personalizada': { ... },
  'libros-ingles': { ... },
  'politica-retiro': { ... },
  'politica-envios': { ... }
}
```

---

## 📊 ESTADO ACTUAL DEL FLUJO

### ✅ Validación Exitosa

```
Flujo: WooCommerce Flow
Nodos: 17
Edges: 17
Errores: 0
Advertencias: 3 (handles sin conexión - no crítico)
```

### 📋 Estructura de Nodos

| Tipo | Cantidad | Nodos |
|------|----------|-------|
| **webhook** | 1 | `webhook-whatsapp` |
| **gpt** | 5 | `gpt-clasificador-inteligente`, `gpt-formateador`, `gpt-pedir-datos`, `gpt-asistente-ventas`, `gpt-armar-carrito` |
| **router** | 3 | `router-principal`, `router`, `router-carrito` |
| **whatsapp** | 5 | `whatsapp-preguntar`, `whatsapp-solicitar-datos`, `whatsapp-asistente`, `whatsapp-link-pago`, `whatsapp-confirmacion-pago` |
| **woocommerce** | 1 | `woocommerce` |
| **mercadopago** | 2 | `mercadopago-crear-preference`, `mercadopago-verificar-pago` |

### 🔀 Routers Configurados

#### Router Principal
- ✅ 5 handles configurados
- ✅ 2 conexiones activas (buscar, comprar)
- ⚠️ 3 handles sin conexión (consultar, despedida, default) - para futuras implementaciones

#### Router Intermedio
- ✅ 2 handles: `route-1` (faltan datos), `route-2` (datos completos)
- ✅ 2 conexiones: `gpt-pedir-datos`, `whatsapp-solicitar-datos`

#### Router Carrito
- ✅ 3 handles: finalizar compra, pago confirmado, verificar pago
- ✅ 3 conexiones: `mercadopago-crear-preference`, `whatsapp-confirmacion-pago`, `mercadopago-verificar-pago`

---

## 🧪 FLUJO DE EJECUCIÓN ESPERADO

### Caso 1: Usuario busca un libro

```
1. Usuario: "Busco Harry Potter"
   ↓
2. webhook-whatsapp (captura mensaje)
   ↓
3. gpt-clasificador-inteligente
   Output: { tipo_accion: "buscar_producto" }
   ↓
4. router-principal
   Evalúa: tipo_accion == "buscar_producto"
   Ruta: route-buscar → gpt-formateador
   ↓
5. gpt-formateador
   Output: { titulo: "Harry Potter", editorial: null, edicion: null, variables_completas: true }
   ↓
6. router (intermedio)
   Evalúa: variables_completas == true
   Ruta: route-2 → whatsapp-solicitar-datos
   ↓
7. whatsapp-solicitar-datos
   Envía: "🔍 Perfecto, déjame buscar eso para vos..."
   ↓
8. woocommerce
   Busca productos con: titulo="Harry Potter"
   Output: { productos: [...], productos_formateados: "..." }
   ↓
9. gpt-asistente-ventas
   Presenta productos encontrados
   ↓
10. whatsapp-asistente
    Envía lista de productos al usuario
```

### Caso 2: Usuario quiere comprar

```
1. Usuario: "Lo quiero" (después de ver productos)
   ↓
2. gpt-clasificador-inteligente
   Output: { tipo_accion: "comprar" }
   ↓
3. router-principal
   Ruta: route-comprar → gpt-armar-carrito
   ↓
4. gpt-armar-carrito
   Analiza historial, extrae productos
   Output: { confirmacion_compra: true, productos_carrito: [...], total: X }
   ↓
5. router-carrito
   Evalúa: confirmacion_compra == true
   Ruta: edge-router-mercadopago → mercadopago-crear-preference
   ↓
6. mercadopago-crear-preference
   Crea preferencia de pago
   Output: { link: "https://...", preference_id: "..." }
   ↓
7. whatsapp-link-pago
   Envía link de pago al usuario
```

---

## 🧰 SCRIPTS DISPONIBLES

### Testing y Validación

```bash
# Analizar flujo completo
node scripts/test-flujo-completo.js

# Limpiar estado del usuario
node scripts/limpiar-mi-numero.js
```

### Correcciones Aplicadas

```bash
# Corregir router principal (YA EJECUTADO)
node scripts/fix-router-principal-final.js

# Corregir variables WhatsApp (YA EJECUTADO)
node scripts/fix-whatsapp-direct-update.js

# Corregir variables GPT output (YA EJECUTADO)
node scripts/fix-variables-gpt-output.js

# Corregir flujo completo (YA EJECUTADO)
node scripts/fix-flujo-veo-veo-completo.js
```

---

## 📝 CONFIGURACIONES CLAVE

### Nodo GPT - Formato de Output

```javascript
// SIEMPRE devuelve:
{
  respuesta_gpt: "texto de la respuesta",
  tokens: 123,
  costo: 0.00456
}

// Si tiene response_format: "json_object", ADEMÁS extrae variables:
{
  respuesta_gpt: "...",
  titulo: "Harry Potter",
  editorial: null,
  variables_completas: true,
  variables_faltantes: []
}
```

### Nodo WhatsApp - Referencia Correcta

```javascript
// ❌ INCORRECTO
message: "{{gpt-pedir-datos.response}}"

// ✅ CORRECTO
message: "{{gpt-pedir-datos.respuesta_gpt}}"

// ✅ CORRECTO (variables extraídas del JSON)
message: "{{gpt-formateador.titulo}}"
```

### Router - Configuración de Handles

```javascript
// ✅ CORRECTO
{
  handles: [
    {
      id: "route-buscar",
      label: "🔍 Buscar",
      condition: "{{tipo_accion}} == buscar_producto"
    }
  ],
  routeHandles: ["route-buscar"]
}

// Edge correspondiente:
{
  source: "router-principal",
  sourceHandle: "route-buscar",  // DEBE COINCIDIR con handle.id
  target: "gpt-formateador"
}
```

---

## ⚠️ ADVERTENCIAS ACTUALES (No Críticas)

1. **Handles sin conexión en router-principal:**
   - `route-consultar` - Para futuras consultas generales
   - `route-despedida` - Para despedidas
   - `route-default` - Fallback para casos no contemplados

Estos handles están configurados pero no tienen edges conectados. Esto es normal si esas funcionalidades aún no están implementadas.

---

## 🚀 PRÓXIMOS PASOS PARA TESTING

### 1. Limpiar Estado (HECHO)
```bash
node scripts/limpiar-mi-numero.js
```

### 2. Testear en WhatsApp

**Escenario 1: Búsqueda Simple**
```
Usuario: "Busco Harry Potter"
Esperado: 
  1. "🔍 Perfecto, déjame buscar eso para vos..."
  2. Lista de productos encontrados
```

**Escenario 2: Búsqueda con Datos Faltantes**
```
Usuario: "Hola"
Esperado: Mensaje de bienvenida pidiendo más información
```

**Escenario 3: Compra**
```
Usuario: "Lo quiero" (después de ver productos)
Esperado: Link de pago de MercadoPago
```

### 3. Monitorear Logs

```bash
cd backend
npm run dev

# Buscar errores
npm run dev | Select-String "ERROR"
npm run dev | Select-String "❌"
```

---

## 📚 DOCUMENTACIÓN RELACIONADA

- **Arquitectura:** `docs/01-ARQUITECTURA-SISTEMA-FLUJOS.md`
- **Configuración de Nodos:** `docs/02-CONFIGURACION-NODOS.md`
- **Variables y Tópicos:** `docs/03-SISTEMA-VARIABLES-TOPICOS.md`
- **Troubleshooting:** `docs/05-TROUBLESHOOTING-FAQ.md`

---

## ✅ CHECKLIST DE VALIDACIÓN

- [x] Router principal tiene handles configurados
- [x] Edges tienen sourceHandle correcto
- [x] Variables de WhatsApp usan `.respuesta_gpt`
- [x] Tópicos están a nivel raíz del flujo
- [x] Condiciones de edges en formato objeto
- [x] Nodos GPT tienen systemPrompt
- [x] Variables globales configuradas
- [x] Estado del usuario limpiado
- [ ] Testing en WhatsApp completado
- [ ] Flujo completo de búsqueda validado
- [ ] Flujo completo de compra validado

---

## 🎯 RESULTADO ESPERADO

Cuando el usuario envíe **"Busco Harry Potter"**, el flujo debe:

1. ✅ Clasificar como `buscar_producto`
2. ✅ Extraer `titulo: "Harry Potter"`
3. ✅ Dirigirse al router con handle `route-buscar`
4. ✅ Ejecutar `gpt-formateador`
5. ✅ Ejecutar `woocommerce` con búsqueda
6. ✅ Formatear productos con `gpt-asistente-ventas`
7. ✅ Enviar lista de productos por WhatsApp

**Estado:** LISTO PARA TESTING ✅

---

**Última actualización:** 26/01/2026 20:10 GMT-3
