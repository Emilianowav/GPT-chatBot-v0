# 🔍 ANÁLISIS DE PROBLEMAS EN RECEPCIÓN Y ASIGNACIÓN DE MENSAJES

## 🎯 PROBLEMA ACTUAL

Cuando el usuario responde "1" a la notificación:
- ✅ La notificación se envía correctamente
- ✅ El flujo se inicia y se guarda en MongoDB
- ❌ **NO hay logs del webhook cuando el usuario responde**
- ❌ El sistema envía mensaje de error

---

## 🔍 POSIBLES PROBLEMAS IDENTIFICADOS

### 1. ❌ WEBHOOK NO RECIBE MENSAJES

**Síntoma:** No aparecen logs cuando el usuario responde

**Causas posibles:**

#### A. Webhook de Meta mal configurado
```
Meta Developer Console → WhatsApp → Configuration → Webhook
- URL incorrecta
- Token de verificación incorrecto
- Suscripciones no activadas (messages, messaging_postbacks)
```

#### B. Servidor no expuesto públicamente
```
- ngrok no está corriendo
- ngrok URL cambió
- Firewall bloqueando puerto 3000
```

#### C. Ruta del webhook incorrecta
```typescript
// app.ts - Verificar que la ruta esté registrada
app.post('/api/whatsapp/webhook', recibirMensaje);
```

---

### 2. ⚠️ TELÉFONO CON FORMATO DIFERENTE

**Síntoma:** Estado se crea pero no se encuentra al responder

**Problema detectado en logs:**
```
Al enviar notificación:
  telefono: '543794946066'  // ❌ Sin el 9 después del 54

Webhook debería recibir:
  telefono: '5493794946066'  // ✅ Con el 9
```

**Causa:** El cliente en la BD tiene teléfono `543794946066` (incorrecto para Argentina)

**Solución:**
```javascript
// En MongoDB
db.clientes.updateOne(
  { telefono: "543794946066" },
  { $set: { telefono: "5493794946066" } }
)
```

---

### 3. ⚠️ ESTADO SE GUARDA PERO NO SE PERSISTE

**Síntoma:** `startFlow` retorna success pero estado queda con `flujo_activo: null`

**Código actual:**
```typescript
// FlowManager.ts línea 330-353
state.flujo_activo = flowName;
state.estado_actual = result.nextState || null;
state.data = { ...initialData, ...result.data };
state.prioridad = flow.priority;
state.ultima_interaccion = new Date();

if (result.end) {
  // Si el flujo termina inmediatamente
  state.flujo_activo = null;  // ❌ Se limpia
  state.estado_actual = null;
  state.data = {};
}

await state.save();  // ✅ Se guarda
```

**Problema:** Si `result.end` es `true`, el flujo se limpia inmediatamente

**Verificar en notificacionViajesFlow.ts:**
```typescript
async start(context: FlowContext): Promise<FlowResult> {
  return {
    success: true,
    nextState: 'esperando_opcion_inicial',
    end: false  // ❌ Si esto es true, se limpia el flujo
  };
}
```

---

### 4. ⚠️ BÚSQUEDA DE ESTADO CON PARÁMETROS DIFERENTES

**Síntoma:** Se crea nuevo estado en lugar de encontrar el existente

**Posibles diferencias:**

| Parámetro | Al enviar notificación | Al recibir respuesta |
|-----------|------------------------|----------------------|
| telefono | `543794946066` | `5493794946066` ❌ |
| empresaId | `San Jose` | `San Jose` ✅ |

**Logs para verificar:**
```
Al enviar:
🔍 [getOrCreateState] Buscando estado: { telefono: '543794946066', empresaId: 'San Jose' }

Al responder (FALTA ESTE LOG):
🔍 [getOrCreateState] Buscando estado: { telefono: '???', empresaId: '???' }
```

---

### 5. ⚠️ FLUJO NO SE ACTIVA PORQUE NO HAY ESTADO

**Síntoma:** `flowManager.handleMessage` retorna `handled: false`

**Flujo de ejecución:**
```typescript
// FlowManager.handleMessage()

1. Busca estado → ✅ Encuentra
2. Verifica flujo_activo → ❌ Es null
3. Intenta activar flujos:
   - confirmacion_turnos.shouldActivate() → false
   - notificacion_viajes.shouldActivate() → false (siempre false)
   - menu_principal.shouldActivate() → false
4. Ninguno se activa → handled: false
5. whatsappController envía mensaje de error
```

**Problema:** `notificacion_viajes.shouldActivate()` siempre retorna `false`:
```typescript
// notificacionViajesFlow.ts línea 11-20
async shouldActivate(context: FlowContext): Promise<boolean> {
  // Este flujo se activa programáticamente desde notificaciones
  // O cuando el usuario responde a una notificación de viajes
  
  // Detectar si es respuesta a notificación (números 1 o 2)
  const mensaje = context.mensaje.trim();
  
  // Solo activar si es exactamente "1" o "2" y NO hay otro flujo activo
  // Esto se manejará mejor en el FlowManager
  return false; // ❌ SIEMPRE RETORNA FALSE
}
```

---

## 🎯 PROBLEMA PRINCIPAL IDENTIFICADO

### ❌ EL FLUJO NO CONTINÚA PORQUE `flujo_activo` ES NULL

**Secuencia de eventos:**

1. **Envío de notificación:**
   ```
   ✅ Cancela flujo anterior → flujo_activo: null
   ✅ Llama a startFlow
   ✅ startFlow guarda estado con flujo_activo: 'notificacion_viajes'
   ```

2. **Usuario responde "1":**
   ```
   ❌ Webhook NO llega al servidor (no hay logs)
   O
   ❌ Webhook llega pero busca con teléfono diferente
   O
   ❌ Encuentra estado pero flujo_activo es null
   ```

---

## 🔧 SOLUCIONES PROPUESTAS

### Solución 1: Verificar Webhook
```bash
# Verificar que ngrok esté corriendo
ngrok http 3000

# Verificar URL en Meta Developer Console
# Debe ser: https://xxxx.ngrok.io/api/whatsapp/webhook
```

### Solución 2: Corregir Teléfono en BD
```javascript
db.clientes.updateOne(
  { telefono: "543794946066" },
  { $set: { telefono: "5493794946066" } }
)
```

### Solución 3: Verificar que el Flujo NO Termina Inmediatamente
```typescript
// notificacionViajesFlow.ts - start()
return {
  success: true,
  nextState: 'esperando_opcion_inicial',
  end: false,  // ✅ DEBE SER FALSE
  data: { viajes: data.viajes }
};
```

### Solución 4: Agregar Logs al Webhook
```typescript
// Ya agregado en whatsappController.ts
console.log('\n🔔 [WEBHOOK] Mensaje recibido');
console.log('🔔 [WEBHOOK] Body:', JSON.stringify(req.body, null, 2));
```

---

## 📋 CHECKLIST DE VERIFICACIÓN

### Paso 1: Verificar Webhook
- [ ] ngrok está corriendo
- [ ] URL en Meta coincide con ngrok
- [ ] Suscripciones activadas en Meta
- [ ] Token de verificación correcto

### Paso 2: Verificar Datos en MongoDB
```javascript
// Ver estados actuales
db.conversation_states.find({ empresaId: "San Jose" })

// Ver clientes
db.clientes.find({ empresaId: "San Jose" })
```

### Paso 3: Enviar Notificación y Verificar Logs
- [ ] Flujo se inicia correctamente
- [ ] Estado se guarda con flujo_activo: 'notificacion_viajes'
- [ ] estado_actual: 'esperando_opcion_inicial'

### Paso 4: Responder "1" y Verificar Logs
- [ ] Aparece log: `🔔 [WEBHOOK] Mensaje recibido`
- [ ] Aparece log: `🔍 [DEBUG] Llamando a flowManager.handleMessage`
- [ ] Aparece log: `🔍 [getOrCreateState] Buscando estado`
- [ ] Encuentra el estado con flujo_activo
- [ ] Llama a flow.onInput
- [ ] Retorna handled: true

---

## 🚨 ACCIÓN INMEDIATA

1. **Reiniciar servidor con logs agregados**
2. **Enviar notificación de prueba**
3. **Responder "1" en WhatsApp**
4. **Compartir TODOS los logs** (incluyendo si NO aparece nada)

Si NO aparecen logs del webhook:
- **Problema:** Configuración de webhook en Meta
- **Solución:** Verificar ngrok y configuración en Meta Developer Console

Si aparecen logs pero handled es false:
- **Problema:** Estado no se encuentra o flujo_activo es null
- **Solución:** Verificar teléfono en BD y que el flujo no termine inmediatamente

---

## 📊 LOGS ESPERADOS (COMPLETOS)

### Al Enviar Notificación:
```
📨 Enviando notificación de prueba a 543794946066
🔄 Iniciando flujo con: { telefono: '543794946066', empresaId: 'San Jose' }
🧹 Cancelando flujos anteriores...
✅ Flujos anteriores cancelados
🎬 [FlowManager.startFlow] Iniciando flujo programático
🔍 [getOrCreateState] Buscando estado: { telefono: '543794946066', empresaId: 'San Jose' }
✅ [getOrCreateState] Estado encontrado
📊 Estado obtenido: { flujo_activo: null, estado_actual: null }
🚗 [NotificacionViajes] Iniciando flujo
✅ flowManager.startFlow completado: { success: true, nextState: 'esperando_opcion_inicial' }
```

### Al Responder "1":
```
🔔 [WEBHOOK] Mensaje recibido en /api/whatsapp/webhook
🔔 [WEBHOOK] Body: { ... }
📋 Datos extraídos del webhook: { telefonoCliente: '5493794946066', mensaje: '1' }
🔍 [DEBUG] Llamando a flowManager.handleMessage con: { telefono: '5493794946066', empresaId: 'San Jose', mensaje: '1' }
🔍 [getOrCreateState] Buscando estado: { telefono: '5493794946066', empresaId: 'San Jose' }
✅ [getOrCreateState] Estado encontrado: { flujo_activo: 'notificacion_viajes', estado_actual: 'esperando_opcion_inicial' }
▶️ Continuando flujo activo: notificacion_viajes
🔍 [DEBUG] Llamando a flow.onInput
📥 [NotificacionViajes] Estado: esperando_opcion_inicial, Mensaje: 1
🔍 [DEBUG] Resultado de flow.onInput: { success: true, end: true }
✅ Flujo notificacion_viajes finalizado
✅ [DEBUG] Estado guardado, retornando handled=true
🔍 [DEBUG] Resultado de flowManager.handleMessage: { handled: true, result: { success: true } }
✅ Mensaje procesado por sistema de flujos
```

---

**ESTADO:** Esperando logs completos para diagnóstico final
