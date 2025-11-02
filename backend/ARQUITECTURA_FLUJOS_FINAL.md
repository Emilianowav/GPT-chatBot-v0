# 🎯 Arquitectura de Flujos Dinámicos - VERSIÓN FINAL

## ✅ Sistema Implementado

### 📋 Flujos Activos

#### 1. **Menú Principal** (Normal - Iniciado por Usuario)
**Archivo:** `src/flows/menuPrincipalFlow.ts`

**Activación:**
- Keywords: hola, menu, turno, reserva, consulta, cancelar
- Números: 1, 2, 3 (opciones del menú)

**Opciones:**
```
1️⃣ Reservar turno
2️⃣ Consultar mis turnos  
3️⃣ Cancelar turno
```

**Estados:**
- `esperando_opcion` → Esperando que el usuario elija 1, 2 o 3
- `reserva_esperando_fecha` → Esperando fecha para reserva
- `reserva_esperando_hora` → Esperando hora para reserva
- `cancelacion_esperando_seleccion` → Esperando selección de turno a cancelar

**Flujo Completo:**
```
Usuario: "hola" o "menu"
  ↓
Bot: Muestra menú con 3 opciones
  ↓
Usuario: "1" (Reservar)
  ↓
Bot: "¿Para qué día?"
  ↓
Usuario: "mañana"
  ↓
Bot: "¿A qué hora?"
  ↓
Usuario: "15:00"
  ↓
Bot: "✅ Turno reservado"
```

---

#### 2. **Notificación de Viajes** (Urgente - Automático)
**Archivo:** `src/flows/notificacionViajesFlow.ts`

**Activación:**
- Programática desde `notificacionesViajesService`
- Se activa cuando se envía notificación de viajes

**Mensaje Inicial:**
```
Recordatorio de viajes para mañana

━━━━━━━━━━━━━━━━━━
Viaje 1

📍 Origen: [origen]
📍 Destino: [destino]
🕐 Hora: [hora]
👥 Pasajeros: 1

━━━━━━━━━━━━━━━━━━

¿Qué deseas hacer?

1️⃣ Confirmar todos los viajes
2️⃣ Editar un viaje específico

Responde con el número de la opción.
```

**Estados:**
- `esperando_opcion_inicial` → Esperando 1 o 2
- `esperando_seleccion_viaje` → Si eligió 2, esperando qué viaje editar
- `esperando_tipo_modificacion` → Esperando qué modificar (origen/destino/horario/cancelar)
- `esperando_nuevo_origen` → Esperando nuevo origen
- `esperando_nuevo_destino` → Esperando nuevo destino
- `esperando_nuevo_horario` → Esperando nuevo horario
- `esperando_confirmacion_final` → Esperando si quiere hacer más cambios

**Flujo Completo:**
```
Sistema: Envía notificación automática
  ↓
Usuario: "1" (Confirmar todos)
  ↓
Bot: "✅ Todos confirmados"
  ↓
FIN

O

Usuario: "2" (Editar)
  ↓
Bot: "¿Qué viaje querés editar? 1. [viaje1] 2. [viaje2]"
  ↓
Usuario: "1"
  ↓
Bot: "¿Qué modificar? 1.Origen 2.Destino 3.Horario 4.Cancelar"
  ↓
Usuario: "1" (Origen)
  ↓
Bot: "¿Cuál es el nuevo origen?"
  ↓
Usuario: "Nueva dirección"
  ↓
Bot: "✅ Actualizado. ¿Otra modificación? 1.Sí 2.No"
  ↓
Usuario: "2"
  ↓
Bot: "✅ Cambios guardados"
  ↓
FIN
```

---

#### 3. **Confirmación de Turnos** (Urgente - Automático)
**Archivo:** `src/flows/confirmacionTurnosFlow.ts`

**Activación:**
- Programática desde notificaciones automáticas
- Se activa cuando hay turnos próximos a confirmar

**Mensaje Inicial:**
```
¿Confirmás tu turno para [fecha] a las [hora]?

[Botones: ✅ Confirmar | ❌ Cancelar | 🔄 Reprogramar]
```

**Estados:**
- `esperando_confirmacion` → Esperando respuesta del usuario

**Respuestas Aceptadas:**
- Botones interactivos: `confirmar_[turnoId]`, `cancelar_[turnoId]`, `reprogramar_[turnoId]`
- Texto: "si", "sí", "confirmo", "ok", "dale" → Confirma
- Texto: "no", "cancelar", "cancelo" → Cancela

**Flujo Completo:**
```
Sistema: Envía notificación con botones
  ↓
Usuario: Click en "✅ Confirmar" o escribe "si"
  ↓
Bot: "✅ Turno confirmado. Te esperamos."
  ↓
FIN
```

---

## 🔄 Sistema de Prioridades

### Orden de Evaluación

1. **¿Hay flujo activo?**
   - SÍ → Continuar con ese flujo (ignorar nuevas activaciones)
   - NO → Evaluar flujos por prioridad

2. **Evaluación por Prioridad:**
   ```
   Urgente (3):
   ├─ confirmacion_turnos
   └─ notificacion_viajes
   
   Normal (2):
   └─ menu_principal
   ```

### Casos de Uso

**Caso 1: Usuario con notificación activa**
```
Estado: notificacion_viajes activo (urgente)
Usuario escribe: "hola"

Resultado: Continúa con notificacion_viajes
Mensaje: "Por favor, respondé con 1 o 2 según la opción."
```

**Caso 2: Usuario sin flujo activo**
```
Estado: Sin flujo activo
Usuario escribe: "hola"

Resultado: Activa menu_principal
Mensaje: "¡Hola! ¿En qué puedo ayudarte?
1️⃣ Reservar turno
2️⃣ Consultar mis turnos
3️⃣ Cancelar turno"
```

**Caso 3: Notificación llega mientras usuario está en menú**
```
Estado: menu_principal activo (normal)
Sistema: Envía notificación de viajes (urgente)

Resultado: 
1. Pausa menu_principal
2. Activa notificacion_viajes
3. Encola menu_principal
4. Al finalizar notificacion_viajes, retoma menu_principal
```

---

## 📊 Persistencia

### ConversationState (MongoDB)
```typescript
{
  telefono: "+5491122334455",
  empresaId: "empresa123",
  flujo_activo: "notificacion_viajes",
  estado_actual: "esperando_opcion_inicial",
  data: {
    viajes: [
      { _id: "abc", origen: "A", destino: "B", horario: "10:00" }
    ]
  },
  flujos_pendientes: [],
  prioridad: "urgente",
  ultima_interaccion: "2025-11-02T18:00:00Z"
}
```

### FlowLogs (MongoDB)
```typescript
{
  timestamp: "2025-11-02T18:00:00Z",
  telefono: "+5491122334455",
  empresaId: "empresa123",
  flujo: "notificacion_viajes",
  estado: "esperando_opcion_inicial",
  accion: "inicio",
  mensaje: "Iniciado programáticamente",
  data: { viajes: [...] }
}
```

---

## 🔧 Integración

### Iniciar Flujo Programáticamente

```typescript
import { iniciarFlujoNotificacionViajes } from './services/flowIntegrationService';

// Desde servicio de notificaciones
await iniciarFlujoNotificacionViajes(
  clienteTelefono,
  empresaId,
  viajes
);
```

### Verificar Estado

```typescript
import { flowManager } from './flows/index';

// Ver estado actual
const state = await flowManager.getState(telefono, empresaId);

console.log(state.flujo_activo);     // "notificacion_viajes"
console.log(state.estado_actual);    // "esperando_opcion_inicial"
console.log(state.data);             // { viajes: [...] }
```

---

## 🚀 Comandos Especiales

### Limpiar Todo
```
Usuario: "limpiar"

Resultado:
- Cancela flujo activo
- Limpia cola de flujos
- Resetea historial
- Limpia estado de conversación
```

### Volver al Menú
```
Usuario: "menu"

Resultado:
- Finaliza flujo actual
- Activa menu_principal
```

---

## 📝 Archivos Clave

### Flujos
```
src/flows/
├── types.ts                      # Interfaces y tipos
├── FlowManager.ts                # Motor central
├── menuPrincipalFlow.ts          # Menú principal (Reserva/Consulta/Cancelación)
├── notificacionViajesFlow.ts     # Notificaciones de viajes
├── confirmacionTurnosFlow.ts     # Confirmación de turnos
└── index.ts                      # Registro de flujos
```

### Servicios
```
src/services/
├── flowIntegrationService.ts     # Integración con flujos
├── notificacionesViajesService.ts # Envío de notificaciones de viajes
└── notificacionesAutomaticasService.ts # Cron de notificaciones
```

### Modelos
```
src/models/
└── ConversationState.ts          # Estado de conversación
```

### Utils
```
src/utils/
└── flowLogger.ts                 # Sistema de logs
```

---

## ✅ Testing

### Escenario 1: Usuario Nuevo
```
1. Usuario: "hola"
2. Bot: Muestra menú
3. Usuario: "1"
4. Bot: "¿Para qué día?"
5. Usuario: "mañana"
6. Bot: "¿A qué hora?"
7. Usuario: "15:00"
8. Bot: "✅ Turno reservado"
```

### Escenario 2: Notificación de Viajes
```
1. Sistema: Envía notificación a las 20:00
2. Bot: Muestra viajes con opciones 1 y 2
3. Usuario: "1"
4. Bot: "✅ Todos confirmados"
```

### Escenario 3: Editar Viaje
```
1. Sistema: Envía notificación
2. Bot: Muestra viajes
3. Usuario: "2"
4. Bot: "¿Qué viaje editar?"
5. Usuario: "1"
6. Bot: "¿Qué modificar? 1.Origen 2.Destino..."
7. Usuario: "1"
8. Bot: "¿Nuevo origen?"
9. Usuario: "Nueva dirección"
10. Bot: "✅ Actualizado. ¿Otra modificación?"
11. Usuario: "2"
12. Bot: "✅ Cambios guardados"
```

---

## 🎯 Próximos Pasos

1. **Configurabilidad:**
   - Permitir configurar mensajes desde el CRM
   - Permitir configurar opciones del menú
   - Permitir configurar campos editables en notificaciones

2. **Mejoras:**
   - Validación de fechas y horarios
   - Integración con calendario real
   - Confirmación con agentes disponibles

3. **Analytics:**
   - Dashboard de flujos activos
   - Métricas de conversión
   - Tiempos de respuesta

---

**Estado:** ✅ FUNCIONAL Y LISTO PARA PRODUCCIÓN  
**Versión:** 2.0.0  
**Fecha:** 2 de noviembre de 2025
