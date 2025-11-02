# 🔄 Sistema de Flujos Dinámicos - Documentación Completa

## 📋 Índice
1. [Arquitectura General](#arquitectura-general)
2. [Componentes Principales](#componentes-principales)
3. [Flujos Implementados](#flujos-implementados)
4. [Gestión de Estados](#gestión-de-estados)
5. [Sistema de Prioridades](#sistema-de-prioridades)
6. [Logging y Debugging](#logging-y-debugging)
7. [Integración con Servicios](#integración-con-servicios)
8. [Casos de Uso](#casos-de-uso)

---

## 🏗️ Arquitectura General

El sistema de flujos dinámicos implementa una **Conversational State Machine** que permite gestionar múltiples flujos de conversación en un solo número de WhatsApp.

### Concepto Base

```
Usuario → Middleware → FlowManager → Motor de Flujo → Acción → Respuesta
```

Cada usuario tiene un **estado de conversación** almacenado en MongoDB que define:
- En qué flujo está actualmente
- En qué paso del flujo se encuentra
- Datos temporales del flujo
- Flujos pendientes en cola
- Prioridad del flujo activo

---

## 🧩 Componentes Principales

### 1. **ConversationState** (Modelo)
**Ubicación:** `src/models/ConversationState.ts`

Almacena el estado de conversación de cada usuario:

```typescript
{
  telefono: string;
  empresaId: string;
  flujo_activo: string | null;
  estado_actual: string | null;
  data: Record<string, any>;
  flujos_pendientes: string[];
  prioridad: 'normal' | 'urgente' | 'baja';
  ultima_interaccion: Date;
}
```

### 2. **FlowManager** (Motor Central)
**Ubicación:** `src/flows/FlowManager.ts`

Responsabilidades:
- ✅ Registrar flujos disponibles
- ✅ Detectar qué flujo debe activarse
- ✅ Gestionar transiciones de estado
- ✅ Manejar prioridades y colas
- ✅ Limpiar estados antiguos

**Métodos principales:**
```typescript
- registerFlow(flow: Flow): void
- handleMessage(context: FlowContext): Promise<{handled, result}>
- startFlow(telefono, empresaId, flowName, data): Promise<FlowResult>
- enqueueFlow(telefono, empresaId, flowName): Promise<void>
- cancelFlow(telefono, empresaId): Promise<void>
```

### 3. **Flow Interface** (Contrato de Flujos)
**Ubicación:** `src/flows/types.ts`

Cada flujo debe implementar:

```typescript
interface Flow {
  name: string;
  priority: 'urgente' | 'normal' | 'baja';
  version: string;
  
  shouldActivate(context: FlowContext): Promise<boolean>;
  start(context: FlowContext): Promise<FlowResult>;
  onInput(context, state, data): Promise<FlowResult>;
  onEnd?(context, data): Promise<void>;
}
```

---

## 🔄 Flujos Implementados

### 1. **Confirmación de Turnos** (Urgente)
**Archivo:** `src/flows/confirmacionTurnosFlow.ts`

- **Activación:** Programática (notificaciones automáticas)
- **Prioridad:** Urgente
- **Estados:**
  - `esperando_confirmacion`: Esperando respuesta del usuario
  
**Flujo:**
```
Inicio → Enviar botones (Confirmar/Cancelar/Reprogramar)
       ↓
Esperando confirmación
       ↓
Procesar respuesta → Fin
```

### 2. **Notificaciones de Viajes** (Urgente)
**Archivo:** `src/flows/notificacionesViajesFlow.ts`

- **Activación:** Por respuestas interactivas
- **Prioridad:** Urgente
- **Estados:**
  - `esperando_seleccion_viaje`
  - `esperando_tipo_modificacion`
  - `esperando_origen/destino/horario`
  - `esperando_respuesta_final`

**Flujo:**
```
Inicio → Confirmar todos / Modificar viaje
       ↓
Seleccionar viaje a modificar
       ↓
Elegir qué modificar (origen/destino/horario)
       ↓
Ingresar nuevo valor
       ↓
Confirmar o hacer otra modificación → Fin
```

### 3. **Reserva de Turnos** (Normal)
**Archivo:** `src/flows/reservaTurnosFlow.ts`

- **Activación:** Detección de keywords (turno, reserva, agendar, etc.)
- **Prioridad:** Normal
- **Estados:**
  - `esperando_fecha`
  - `esperando_seleccion`

**Flujo:**
```
Inicio → Detectar intención de reservar
       ↓
Procesar con bot de turnos
       ↓
Interacción hasta completar reserva → Fin
```

### 4. **Conversación General** (Baja - Fallback)
**Archivo:** `src/flows/conversacionGeneralFlow.ts`

- **Activación:** Siempre (fallback)
- **Prioridad:** Baja
- **Estados:** Ninguno (one-shot)

**Flujo:**
```
Inicio → Procesar con OpenAI
       ↓
Responder → Fin
```

---

## 📊 Gestión de Estados

### Pipeline de Procesamiento

```
1️⃣ Usuario envía mensaje
    ↓
2️⃣ FlowManager obtiene estado actual
    ↓
3️⃣ ¿Hay flujo activo?
    ├─ SÍ → Continuar con flujo activo
    │         ↓
    │    Ejecutar onInput()
    │         ↓
    │    Actualizar estado
    │         ↓
    │    ¿Flujo terminó?
    │    ├─ SÍ → Limpiar estado, verificar cola
    │    └─ NO → Guardar nuevo estado
    │
    └─ NO → Detectar nuevo flujo
              ↓
         ¿Algún flujo se activa?
         ├─ SÍ → Iniciar flujo
         │        ↓
         │   Ejecutar start()
         │        ↓
         │   Guardar estado
         │
         └─ NO → Respuesta genérica
```

### Persistencia

Los estados se guardan en MongoDB en la colección `conversation_states`:
- **Índices:** `telefono + empresaId` (único)
- **TTL:** Estados sin interacción por 24h se eliminan automáticamente

---

## ⚡ Sistema de Prioridades

### Niveles de Prioridad

1. **Urgente** (3): Confirmaciones, notificaciones críticas
2. **Normal** (2): Reservas, consultas específicas
3. **Baja** (1): Conversación general, fallback

### Manejo de Colisiones

**Caso 1:** Flujo activo + Nueva notificación urgente
```
Acción: Pausar flujo actual, iniciar urgente, encolar el pausado
```

**Caso 2:** Flujo activo + Usuario inicia nuevo flujo de menor prioridad
```
Acción: Continuar con flujo activo, ignorar nuevo
```

**Caso 3:** Flujo activo + Usuario inicia nuevo flujo de mayor prioridad
```
Acción: Pausar flujo actual, iniciar nuevo, encolar el pausado
```

### Cola de Flujos

Los flujos pendientes se almacenan en `flujos_pendientes` (array):
- Se procesan en orden FIFO
- Al finalizar un flujo, se activa el siguiente en cola
- Se pueden cancelar todos los flujos pendientes

---

## 📝 Logging y Debugging

### FlowLogger
**Ubicación:** `src/utils/flowLogger.ts`

Registra todas las acciones de los flujos en MongoDB (`flow_logs`):

**Tipos de logs:**
- `inicio`: Flujo iniciado
- `transicion`: Cambio de estado
- `fin`: Flujo completado
- `error`: Error en flujo
- `cancelacion`: Flujo cancelado

**Métodos:**
```typescript
FlowLogger.logInicio(telefono, empresaId, flujo, mensaje, data)
FlowLogger.logTransicion(telefono, empresaId, flujo, estadoAnterior, estadoNuevo)
FlowLogger.logFin(telefono, empresaId, flujo, mensaje, data)
FlowLogger.logError(telefono, empresaId, flujo, estado, error)
FlowLogger.logCancelacion(telefono, empresaId, flujo, estado, razon)
```

**Consultas:**
```typescript
// Historial de un usuario
const logs = await FlowLogger.obtenerHistorial(telefono, empresaId, 50);

// Estadísticas de empresa
const stats = await FlowLogger.obtenerEstadisticas(empresaId, fechaInicio, fechaFin);
```

**Limpieza automática:**
- Logs mayores a 30 días se eliminan automáticamente cada 24h

---

## 🔗 Integración con Servicios

### FlowIntegrationService
**Ubicación:** `src/services/flowIntegrationService.ts`

Permite a otros servicios interactuar con el sistema de flujos:

```typescript
// Iniciar flujo de confirmación
await iniciarFlujoConfirmacionTurno(telefono, empresaId, turnoId, mensaje);

// Iniciar flujo de notificaciones de viajes
await iniciarFlujoNotificacionViajes(telefono, empresaId, viajes);

// Verificar si usuario tiene flujos activos
const activo = await tieneFlujosActivos(telefono, empresaId);

// Obtener información del flujo activo
const info = await obtenerFlujoActivo(telefono, empresaId);

// Cancelar flujos activos
await cancelarFlujosActivos(telefono, empresaId);

// Encolar flujo para después
await encolarFlujo(telefono, empresaId, 'nombre_flujo');
```

### Integración con WhatsApp Controller

El `whatsappController` ahora usa el FlowManager:

```typescript
const flowContext: FlowContext = {
  telefono,
  empresaId,
  mensaje,
  respuestaInteractiva,
  phoneNumberId,
  profileName
};

const { handled, result } = await flowManager.handleMessage(flowContext);

if (handled && result?.success) {
  // Flujo manejó el mensaje
  // Actualizar métricas y notificar
}
```

---

## 💡 Casos de Uso

### Caso 1: Notificación de Confirmación de Turno

```typescript
// Servicio de notificaciones automáticas
import { iniciarFlujoConfirmacionTurno } from './flowIntegrationService';

// Al detectar turno que necesita confirmación
await iniciarFlujoConfirmacionTurno(
  clienteTelefono,
  empresaId,
  turnoId,
  '¿Confirmás tu turno para mañana a las 15:00?'
);

// El usuario recibe botones interactivos
// Al responder, el flujo procesa automáticamente
```

### Caso 2: Usuario Reserva Turno Mientras Tiene Notificación Pendiente

```
1. Usuario tiene notificación de confirmación activa (urgente)
2. Usuario escribe "quiero un turno"
3. Sistema detecta:
   - Flujo activo: confirmacion_turnos (urgente)
   - Nuevo flujo: reserva_turnos (normal)
4. Decisión: Continuar con confirmación (mayor prioridad)
5. Respuesta: "Primero confirmá tu turno pendiente, luego podés reservar otro"
```

### Caso 3: Múltiples Notificaciones

```
1. Sistema envía notificación de viaje (urgente)
2. Usuario no responde inmediatamente
3. Sistema envía notificación de turno (urgente)
4. Decisión: Encolar segunda notificación
5. Usuario responde a primera notificación
6. Al finalizar, se activa automáticamente la segunda
```

### Caso 4: Usuario Cancela Todo

```
Usuario escribe: "limpiar"

Sistema:
1. Cancela flujo activo
2. Limpia cola de flujos pendientes
3. Resetea estado de conversación
4. Limpia historial de chat
5. Responde: "Todo limpiado, empezamos de nuevo"
```

---

## 🚀 Agregar un Nuevo Flujo

### Paso 1: Crear el archivo del flujo

```typescript
// src/flows/miNuevoFlujo.ts
import type { Flow, FlowContext, FlowResult } from './types.js';

export const miNuevoFlujo: Flow = {
  name: 'mi_nuevo_flujo',
  priority: 'normal',
  version: '1.0.0',
  
  async shouldActivate(context: FlowContext): Promise<boolean> {
    // Lógica para detectar si este flujo debe activarse
    return context.mensaje.includes('palabra_clave');
  },
  
  async start(context: FlowContext): Promise<FlowResult> {
    // Lógica de inicio del flujo
    return {
      success: true,
      nextState: 'esperando_respuesta',
      data: { paso: 1 }
    };
  },
  
  async onInput(context, state, data): Promise<FlowResult> {
    // Lógica para procesar input del usuario
    if (state === 'esperando_respuesta') {
      // Procesar respuesta
      return {
        success: true,
        end: true // Finalizar flujo
      };
    }
    
    return { success: false, error: 'Estado no reconocido' };
  },
  
  async onEnd(context, data): Promise<void> {
    // Limpieza opcional al finalizar
    console.log('Flujo finalizado');
  }
};
```

### Paso 2: Registrar el flujo

```typescript
// src/flows/index.ts
import { miNuevoFlujo } from './miNuevoFlujo.js';

export function initializeFlows(): void {
  flowManager.registerFlow(confirmacionTurnosFlow);
  flowManager.registerFlow(notificacionesViajesFlow);
  flowManager.registerFlow(reservaTurnosFlow);
  flowManager.registerFlow(miNuevoFlujo); // ← Agregar aquí
  flowManager.registerFlow(conversacionGeneralFlow);
}
```

### Paso 3: ¡Listo!

El flujo ahora está activo y se evaluará automáticamente en cada mensaje.

---

## 🔧 Mantenimiento

### Monitoreo

```typescript
// Ver estadísticas de flujos
const stats = await FlowLogger.obtenerEstadisticas(empresaId);

// Ver historial de un usuario
const logs = await FlowLogger.obtenerHistorial(telefono, empresaId);

// Ver estado actual
const state = await flowManager.getState(telefono, empresaId);
```

### Limpieza

```typescript
// Limpiar estados antiguos (automático cada hora)
await flowManager.cleanupOldStates();

// Limpiar logs antiguos (automático cada día)
await FlowLogger.limpiarLogsAntiguos();
```

---

## 📚 Referencias

- **Modelo de estados:** `src/models/ConversationState.ts`
- **Motor de flujos:** `src/flows/FlowManager.ts`
- **Tipos:** `src/flows/types.ts`
- **Flujos:** `src/flows/*.ts`
- **Logger:** `src/utils/flowLogger.ts`
- **Integración:** `src/services/flowIntegrationService.ts`
- **Controller:** `src/controllers/whatsappController.ts`

---

## ✅ Ventajas del Sistema

1. **Modularidad:** Cada flujo es independiente
2. **Escalabilidad:** Agregar flujos es trivial
3. **Mantenibilidad:** Código organizado y documentado
4. **Debugging:** Logs completos de todas las interacciones
5. **Prioridades:** Manejo inteligente de colisiones
6. **Persistencia:** Estados guardados en MongoDB
7. **Recuperación:** Retoma conversaciones después de horas
8. **Versionado:** Cada flujo tiene su versión

---

## 🎯 Próximos Pasos

- [ ] Implementar flujo de encuestas
- [ ] Agregar flujo de seguimiento post-turno
- [ ] Implementar flujo de recordatorios personalizados
- [ ] Dashboard de visualización de flujos
- [ ] Exportar métricas a analytics
- [ ] Tests unitarios para cada flujo
- [ ] Tests de integración end-to-end

---

**Última actualización:** 2 de noviembre de 2025
**Versión del sistema:** 1.0.0
