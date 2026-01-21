# INTERCAPITAL - RESUMEN EJECUTIVO DEL FLUJO

## 🎯 Objetivo

Crear un flujo de WhatsApp seguro y profesional para que clientes de Intercapital puedan realizar operaciones bursátiles (compra, venta, retiros, consultas) directamente desde WhatsApp.

---

## 🔒 Seguridad (Prioridad #1)

### Validación de Teléfono Obligatoria

**Flujo de seguridad:**
```
Usuario envía mensaje → Validar teléfono en BD Intercapital
├─→ NO AUTORIZADO: Bloquear con mensaje + FIN
└─→ AUTORIZADO: Continuar al menú principal
```

**Endpoint necesario en API Intercapital:**
```
GET /usuarios/validate-phone?telefono=5493794946066
Response: {
  "autorizado": true/false,
  "comitente": "12345",
  "nombre": "Juan Pérez",
  "mensaje_bloqueo": "Parece que todavía no configuró..."
}
```

**Mensaje de bloqueo:**
> 🔒 **Acceso Restringido**
> 
> Parece que todavía no configuró su número de teléfono para operar desde WhatsApp. Por favor, acceda a su cuenta en https://app1.intercapital.ar y configure su número en la sección de Seguridad.
> 
> 📞 Soporte: soporte@intercapital.com.ar o +5493794044057

---

## 🏗️ Arquitectura Simplificada

### Total de Nodos: 27 (vs ~80 en diseño complejo)

**Distribución:**
- **Capa de Seguridad:** 4 nodos
- **Menú Principal:** 3 nodos
- **Ruta Comprar:** 5 nodos
- **Ruta Vender:** 5 nodos
- **Ruta Retiro:** 5 nodos
- **Ruta Consultar:** 3 nodos
- **Ruta Ayuda:** 2 nodos

### Simplificación Clave

**Antes (complejo):**
- 5 nodos GPT + 5 nodos WhatsApp por cada dato a recopilar
- Total: ~10 nodos por operación

**Ahora (simple):**
- 1 nodo GPT conversacional que maneja TODO el diálogo
- 1 nodo API para ejecutar la acción final
- Total: ~2-3 nodos por operación

---

## 🤖 GPT Conversacional Único

### Ventajas

1. **Conversación natural:** El GPT maneja todo el diálogo de forma fluida
2. **Recopilación inteligente:** Extrae todos los datos en una sola conversación
3. **Validación en tiempo real:** Valida datos mientras conversa
4. **Menos nodos:** Reduce complejidad del flujo visual

### Datos que Recopila (Ejemplo: Comprar)

```typescript
{
  documento: "12345678",      // DNI del cliente
  symbol: "GGAL",             // Ticker del activo
  cantidad: 100,              // Unidades a comprar
  precio: 150.50,             // Precio por unidad
  accion_confirmada: "1"      // 1=confirmar, 2=cancelar
}
```

### Cálculos Automáticos

```typescript
monto_total = cantidad × precio
// Ejemplo: 100 × 150.50 = $15,050
```

---

## 📊 Variables Globales

### Variables Automáticas del Sistema

```typescript
{
  telefono: "5493794946066",           // Del webhook WhatsApp
  mensaje_usuario: "quiero comprar",   // Mensaje recibido
  nombre_contacto: "Juan Pérez",       // Nombre del contacto
  comitente: "12345",                  // De API validar teléfono
  nombre_cliente: "Juan Pérez"         // De API validar teléfono
}
```

### Variables Recopiladas por GPT

```typescript
{
  documento: "12345678",               // Recopilado en conversación
  symbol: "GGAL",                      // Recopilado en conversación
  cantidad: 100,                       // Recopilado en conversación
  precio: 150.50,                      // Recopilado en conversación
  monto_total: 15050,                  // Calculado automáticamente
  accion_confirmada: "1"               // Recopilado en conversación
}
```

---

## 🎨 Personalidad del Bot

### Tono y Estilo

- **Tono:** Profesional, confiable, claro y preciso
- **Tratamiento:** Formal (usted)
- **Estilo:** Directo y eficiente, sin rodeos innecesarios
- **Emojis:** Uso moderado y profesional: 📊 💰 📋 ✅ ⚠️ 🔒

### Principios

1. Seguridad y transparencia ante todo
2. Claridad en cada operación
3. Confirmación explícita antes de ejecutar
4. Información precisa sobre riesgos y comisiones

### Ejemplo de Mensaje

```
📋 *Resumen de su orden de COMPRA*

🔢 Comitente: 12345
👤 DNI: 12345678
📊 Activo: GGAL
📦 Cantidad: 100 unidades
💰 Precio: $150.50 por unidad
💵 Total estimado: $15,050

⚠️ *Importante:*
• Esta orden quedará PENDIENTE de aprobación
• Se procesará en horario de mercado
• Recibirá notificación de cambios de estado

¿Confirma la operación?
1️⃣ Sí, confirmar orden
2️⃣ No, cancelar
```

---

## 🔗 Endpoints API Necesarios

### 1. Validar Teléfono (CRÍTICO)

```
GET /usuarios/validate-phone
Params: { telefono: "5493794946066" }
Headers: { "x-api-key": "..." }

Response: {
  "autorizado": true,
  "comitente": "12345",
  "nombre": "Juan Pérez",
  "mensaje_bloqueo": null
}
```

### 2. Crear Orden Compra

```
POST /ordenes
Headers: { "x-api-key": "...", "Content-Type": "application/json" }

Body: {
  "comitente": "12345",
  "documento": "12345678",
  "operacion": "COMPRA",
  "symbol": "GGAL",
  "cantidad": 100,
  "precio": 150.50,
  "plazo": "CONTADO",
  "tipo_orden": "MERCADO",
  "metadata": {
    "whatsapp_phone": "5493794946066",
    "nombre_cliente": "Juan Pérez"
  }
}

Response: {
  "orden_id": "ORD-12345",
  "estado": "PENDIENTE",
  "monto": 15050
}
```

### 3. Crear Orden Venta

```
POST /ordenes
(Mismo formato que compra, cambia "operacion": "VENTA")
```

### 4. Crear Solicitud Retiro

```
POST /ordenes
Body: {
  "comitente": "12345",
  "documento": "12345678",
  "operacion": "RETIRO",
  "symbol": "PESOS",
  "cantidad": 50000,
  "precio": 1,
  "cbu_destino": "0170099220000012345678",
  "metadata": { ... }
}
```

### 5. Listar Órdenes

```
GET /ordenes?comitente=12345&limit=10
Headers: { "x-api-key": "..." }

Response: {
  "ordenes": [
    {
      "orden_id": "ORD-12345",
      "operacion": "COMPRA",
      "symbol": "GGAL",
      "cantidad": 100,
      "precio": 150.50,
      "estado": "PENDIENTE",
      "fecha": "2026-01-17T10:00:00Z"
    }
  ]
}
```

---

## 🎨 Frontend: Componentes Creados

### 1. FloatingActionBar

**Ubicación:** Botón flotante en esquina inferior derecha

**Acciones:**
- 🟣 **Agregar Nodo** (morado)
- 🔵 **Variables Globales** (azul)
- 🟢 **Tópicos** (verde)
- ⚪ **Configuración** (gris)

**Comportamiento:**
- Hover → Se expande mostrando texto
- Animación suave de entrada
- Efecto de pulso en botón principal

### 2. VariablesModal

**Funcionalidad:**
- Ver todas las variables globales del flujo
- Agregar nuevas variables
- Editar valores y tipos (string, number, boolean, object)
- Copiar sintaxis `{{variable}}` con un click
- Eliminar variables

**Tipos soportados:**
- `string`: Texto
- `number`: Números
- `boolean`: true/false
- `object`: JSON

### 3. TopicsModal (Por crear)

Similar a VariablesModal pero para tópicos globales.

### 4. WebhookConfigModal (Ya existe)

Modal para configurar nodos webhook desde el frontend.

---

## 📋 Tópicos Globales Configurados

### Categorías

1. **empresa**: Datos de Intercapital
2. **personalidad**: Tono y estilo de comunicación
3. **seguridad**: Políticas de acceso
4. **horarios_operacion**: Horarios de mercado y atención
5. **tipos_operacion**: Descripción de cada operación
6. **politicas**: Políticas de aprobación y ejecución
7. **instrumentos_comunes**: Tickers frecuentes
8. **datos_requeridos**: Formato de cada dato

### Inyección Automática

Cuando `topicos_habilitados = true`, **TODOS** los nodos GPT reciben automáticamente los tópicos en su systemPrompt:

```
SYSTEM PROMPT ORIGINAL
+
═══ INFORMACIÓN DE LA EMPRESA ═══

**EMPRESA:**
  • nombre: Intercapital
  • whatsapp: +5493794044057
  • web: https://app1.intercapital.ar

**PERSONALIDAD:**
  • tono: Profesional, confiable, claro y preciso
  • tratamiento: Formal (usted)
  ...
```

---

## 🚀 Próximos Pasos de Implementación

### Fase 1: Backend (API Intercapital)

1. ✅ Verificar que existe endpoint `/usuarios/validate-phone`
2. ⏳ Si no existe, crear endpoint de validación de teléfono
3. ✅ Verificar endpoints de órdenes existentes
4. ⏳ Ajustar respuestas si es necesario

### Fase 2: Backend (Sistema de Flujos)

1. ⏳ Crear nodo tipo `api` si no existe
2. ⏳ Implementar `executeAPINode()` en FlowExecutor
3. ⏳ Probar integración con api_configurations

### Fase 3: Frontend

1. ✅ Crear FloatingActionBar
2. ✅ Crear VariablesModal
3. ⏳ Crear TopicsModal
4. ⏳ Integrar componentes en flow-builder
5. ⏳ Probar creación de nodos desde UI

### Fase 4: Creación del Flujo

1. ⏳ Generar JSON completo del flujo Intercapital
2. ⏳ Crear script de inserción en MongoDB
3. ⏳ Insertar flujo en BD
4. ⏳ Asignar flujo a empresa Intercapital

### Fase 5: Testing

1. ⏳ Limpiar estado de teléfono de prueba
2. ⏳ Activar flujo
3. ⏳ Probar flujo completo:
   - Teléfono no autorizado → Bloqueo
   - Teléfono autorizado → Menú
   - Comprar activos → Orden creada
   - Vender activos → Orden creada
   - Retiro → Solicitud creada
   - Consultar → Lista de órdenes
   - Ayuda → Información

### Fase 6: Producción

1. ⏳ Deploy a Render
2. ⏳ Configurar número de WhatsApp de Intercapital
3. ⏳ Activar flujo en producción
4. ⏳ Monitorear logs
5. ⏳ Ajustar según feedback

---

## 📊 Métricas de Éxito

### Técnicas

- ✅ Reducción de nodos: 80 → 27 (66% menos)
- ✅ Conversación natural con GPT único
- ✅ Validación de seguridad robusta
- ✅ Variables globales bien definidas

### Negocio

- ⏳ Tiempo promedio de operación < 2 minutos
- ⏳ Tasa de abandono < 10%
- ⏳ Satisfacción del cliente > 4.5/5
- ⏳ Órdenes completadas exitosamente > 95%

---

## 🎯 Ventajas del Diseño

### 1. Seguridad Robusta

- Validación de teléfono ANTES de cualquier operación
- Solo clientes autorizados acceden al flujo
- Mensaje de bloqueo claro y profesional

### 2. Simplicidad

- 27 nodos vs 80 en diseño complejo
- GPT conversacional único por operación
- Flujo visual más limpio y mantenible

### 3. Experiencia de Usuario

- Conversación natural y fluida
- Confirmación explícita antes de ejecutar
- Mensajes claros y profesionales
- Información completa en cada paso

### 4. Mantenibilidad

- Tópicos globales centralizados
- Variables bien definidas
- Fácil de actualizar y extender
- Código limpio y documentado

### 5. Escalabilidad

- Fácil agregar nuevas operaciones
- Sistema de nodos modular
- API bien estructurada
- Frontend componentizado

---

## 📝 Notas Importantes

1. **Seguridad es prioridad #1:** Nunca permitir operaciones sin validar teléfono
2. **Confirmación obligatoria:** Siempre pedir confirmación antes de ejecutar órdenes
3. **Tono profesional:** Mantener formalidad en toda la comunicación
4. **Transparencia:** Informar claramente sobre aprobaciones, tiempos y riesgos
5. **Testing exhaustivo:** Probar todos los flujos antes de producción

---

**Documento creado:** 2026-01-17  
**Última actualización:** 2026-01-17  
**Estado:** En diseño - Listo para implementación
