# 🐛 DEBUG: Flujo de Notificaciones

## 📝 Logs Agregados

He agregado logs detallados en TODO el flujo para rastrear exactamente dónde está fallando:

### 1. **whatsappController.ts**
```typescript
// ANTES de llamar a flowManager.handleMessage
🔍 [DEBUG] Llamando a flowManager.handleMessage con: { telefono, empresaId, mensaje }

// DESPUÉS de llamar a flowManager.handleMessage
🔍 [DEBUG] Resultado de flowManager.handleMessage: { handled, result }

// Si falla
❌ [DEBUG] Ningún flujo manejó el mensaje
❌ [DEBUG] handled: false/true
❌ [DEBUG] result: {...}
❌ [DEBUG] FlowContext usado: {...}
```

### 2. **FlowManager.ts**
```typescript
// Al buscar estado
🔍 [getOrCreateState] Buscando estado: { telefono, empresaId }
✅ [getOrCreateState] Estado encontrado: { _id, flujo_activo, estado_actual }

// Al procesar flujo activo
▶️ Continuando flujo activo: notificacion_viajes
🔍 [DEBUG] Llamando a flow.onInput con: { flujo, estadoAnterior, mensaje, data }
🔍 [DEBUG] Resultado de flow.onInput: { success, error, end, nextState }

// Si tiene éxito
✅ [DEBUG] Estado guardado, retornando handled=true

// Si falla
❌ [DEBUG] Error en flujo: ...
❌ [DEBUG] result.success = false, retornando handled=false

// Si no hay flujo activo
🔍 [DEBUG] No hay flujo activo, verificando si alguno debe activarse...
🔍 Verificando flujo: confirmacion_turnos
   shouldActivate: false
🔍 Verificando flujo: notificacion_viajes
   shouldActivate: false
🔍 Verificando flujo: menu_principal
   shouldActivate: false

// Si ninguno se activa
❌ [DEBUG] Ningún flujo manejó el mensaje
❌ [DEBUG] Retornando handled=false desde FlowManager
```

### 3. **notificacionViajesFlow.ts**
```typescript
// Ya tiene log
📥 [NotificacionViajes] Estado: esperando_opcion_inicial, Mensaje: 1
```

---

## 🚀 PRÓXIMOS PASOS

1. **Reinicia el servidor:**
   ```bash
   npm start
   ```

2. **Limpia la BD (IMPORTANTE):**
   ```bash
   npm run limpiar:completo
   ```

3. **Envía notificación de prueba**

4. **Responde "1"**

5. **Comparte TODOS los logs** desde que envías la notificación hasta que respondes

---

## 🔍 QUÉ BUSCAR EN LOS LOGS

### Escenario 1: Estado no se encuentra
```
🔍 [getOrCreateState] Buscando estado: { telefono: '5493794946066', empresaId: 'San Jose' }
🆕 [getOrCreateState] Estado no encontrado, creando nuevo  // ❌ MAL
```

**Causa:** Teléfono o empresaId diferente entre notificación y respuesta

---

### Escenario 2: Estado se encuentra pero flujo_activo es null
```
✅ [getOrCreateState] Estado encontrado: {
  _id: ...,
  flujo_activo: null,  // ❌ MAL
  estado_actual: null
}
🔍 [DEBUG] No hay flujo activo, verificando si alguno debe activarse...
```

**Causa:** El flujo no se guardó correctamente al enviar la notificación

---

### Escenario 3: Estado se encuentra con flujo activo pero onInput falla
```
✅ [getOrCreateState] Estado encontrado: {
  flujo_activo: 'notificacion_viajes',  // ✅ BIEN
  estado_actual: 'esperando_opcion_inicial'
}
▶️ Continuando flujo activo: notificacion_viajes
🔍 [DEBUG] Llamando a flow.onInput con: {...}
🔍 [DEBUG] Resultado de flow.onInput: {
  success: false,  // ❌ MAL
  error: '...'
}
```

**Causa:** Error en el flujo al procesar la respuesta

---

### Escenario 4: Todo funciona (ESPERADO)
```
✅ [getOrCreateState] Estado encontrado: {
  flujo_activo: 'notificacion_viajes',
  estado_actual: 'esperando_opcion_inicial'
}
▶️ Continuando flujo activo: notificacion_viajes
🔍 [DEBUG] Llamando a flow.onInput con: {
  flujo: 'notificacion_viajes',
  estadoAnterior: 'esperando_opcion_inicial',
  mensaje: '1',
  data: { viajes: [...] }
}
📥 [NotificacionViajes] Estado: esperando_opcion_inicial, Mensaje: 1
🔍 [DEBUG] Resultado de flow.onInput: {
  success: true,  // ✅ BIEN
  end: true
}
✅ Flujo notificacion_viajes finalizado
✅ [DEBUG] Estado guardado, retornando handled=true
🔍 [DEBUG] Resultado de flowManager.handleMessage: {
  handled: true,
  result: { success: true, end: true }
}
✅ Mensaje procesado por sistema de flujos
```

---

## 📊 CHECKLIST DE VERIFICACIÓN

Cuando compartas los logs, verifica:

- [ ] ¿Con qué teléfono se crea el estado al enviar notificación?
- [ ] ¿Con qué teléfono se busca el estado al responder?
- [ ] ¿Con qué empresaId se crea el estado?
- [ ] ¿Con qué empresaId se busca el estado?
- [ ] ¿Se encuentra el estado?
- [ ] ¿El estado tiene flujo_activo?
- [ ] ¿Qué retorna flow.onInput?
- [ ] ¿Qué retorna flowManager.handleMessage?

---

## 🎯 SOLUCIÓN SEGÚN LOGS

Una vez que tengas los logs, sabremos EXACTAMENTE dónde está el problema:

1. **Si telefono o empresaId no coinciden** → Problema de normalización
2. **Si flujo_activo es null** → Problema al guardar el estado
3. **Si flow.onInput retorna success: false** → Problema en el flujo
4. **Si todo está bien pero handled es false** → Problema en FlowManager

---

**REINICIA EL SERVIDOR Y COMPARTE LOS LOGS COMPLETOS** 🚀
