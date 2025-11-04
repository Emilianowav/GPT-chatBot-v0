# 🔄 Sistema de Flujos Dinámicos - Documentación Completa

## 📋 Índice
1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Flujos Registrados](#flujos-registrados)
3. [Ciclo de Vida de un Flujo](#ciclo-de-vida-de-un-flujo)
4. [Problema Identificado y Solución](#problema-identificado-y-solución)
5. [Cómo Funciona la Notificación de Viajes](#cómo-funciona-la-notificación-de-viajes)
6. [Guía de Desarrollo](#guía-de-desarrollo)

---

## 🏗️ Arquitectura del Sistema

### Componentes Principales

```
┌─────────────────────────────────────────────────────────┐
│                    FlowManager                          │
│  - Gestiona todos los flujos                           │
│  - Mantiene estado de conversaciones                   │
│  - Prioriza flujos (urgente > normal > baja)          │
└─────────────────────────────────────────────────────────┘
                          │
                          ├─── registerFlow()
                          ├─── handleMessage()
                          ├─── startFlow()
                          └─── cancelFlow()
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
┌───────▼────────┐              ┌──────────▼──────────┐
│  Flujos        │              │  ConversationState  │
│  Registrados   │              │  (MongoDB)          │
│                │              │                     │
│ • confirmacion │              │ - flujo_activo      │
│   _turnos      │              │ - estado_actual     │
│ • notificacion │              │ - data              │
│   _viajes      │              │ - flujos_pendientes │
│ • menu         │              │ - prioridad         │
│   _principal   │              │ - ultima_interaccion│
└────────────────┘              └─────────────────────┘
```

### Flujo de Datos

```
WhatsApp → Webhook → whatsappController → FlowManager → Flow específico
                                              ↓
                                    ConversationState (DB)
                                              ↓
                                    Flow.onInput() → Respuesta
                                              ↓
                                    metaService → WhatsApp
```

---

## 📚 Flujos Registrados

### 1. **confirmacion_turnos** (Prioridad: Urgente)
- **Propósito**: Confirmar turnos programados
- **Activación**: Programática (desde notificaciones automáticas)
- **Estados**: 
  - `esperando_confirmacion`
  - `confirmado` / `cancelado`

### 2. **notificacion_viajes** (Prioridad: Urgente)
- **Propósito**: Gestionar confirmación/edición de viajes
- **Activación**: Programática (desde servicio de notificaciones)
- **Estados**:
  - `esperando_opcion_inicial` → Usuario elige 1 o 2
  - `esperando_seleccion_viaje` → Usuario elige qué viaje editar
  - `esperando_tipo_modificacion` → Usuario elige qué modificar
  - `esperando_nuevo_origen/destino/horario` → Usuario ingresa nuevo valor
  - `esperando_confirmacion_final` → Usuario confirma cambios

### 3. **menu_principal** (Prioridad: Normal)
- **Propósito**: Reservar, consultar o cancelar turnos
- **Activación**: Automática (palabras clave: "reservar", "turno", etc.)
- **Estados**:
  - `esperando_fecha`
  - `esperando_horario`
  - `esperando_confirmacion`

---

## 🔄 Ciclo de Vida de un Flujo

### 1. **Inicio del Flujo**

#### A. Inicio Automático (desde mensaje del usuario)
```typescript
// Usuario envía mensaje → whatsappController
const flowContext: FlowContext = {
  telefono: '+543794946066',
  empresaId: 'San Jose',
  mensaje: 'Quiero reservar un turno',
  phoneNumberId: '768730689655171'
};

// FlowManager evalúa todos los flujos
for (const flow of flowsOrdenados) {
  if (await flow.shouldActivate(context)) {
    // Activar flujo
    await flow.start(context);
  }
}
```

#### B. Inicio Programático (desde servicio)
```typescript
// Servicio de notificaciones
await flowManager.startFlow(
  telefono,
  empresaId,
  'notificacion_viajes',
  { viajes: [...] }  // Datos iniciales
);
```

### 2. **Procesamiento de Respuestas**

```typescript
// Usuario responde → whatsappController → FlowManager
const state = await getOrCreateState(telefono, empresaId);

if (state.flujo_activo) {
  const flow = this.flows[state.flujo_activo];
  const result = await flow.onInput(context, state.estado_actual, state.data);
  
  if (result.success) {
    if (result.end) {
      // Flujo terminado
      state.flujo_activo = null;
      state.estado_actual = null;
      state.data = {};
    } else {
      // Continuar flujo
      state.estado_actual = result.nextState;
      state.data = { ...state.data, ...result.data };
    }
  }
}
```

### 3. **Finalización del Flujo**

```typescript
// Cuando result.end = true
if (flow.onEnd) {
  await flow.onEnd(context, state.data);
}

// Limpiar estado
state.flujo_activo = null;
state.estado_actual = null;
state.data = {};

// Verificar si hay flujos pendientes
const siguienteFlujo = state.flujos_pendientes.shift();
if (siguienteFlujo) {
  await startFlow(telefono, empresaId, siguienteFlujo);
}
```

---

## ❌ Problema Identificado y Solución

### Problema Original

Cuando se enviaba una notificación de prueba:
1. ✅ El mensaje llegaba correctamente a WhatsApp
2. ✅ El flujo se iniciaba correctamente
3. ❌ Cuando el usuario respondía "1", el sistema **no procesaba la respuesta dentro del flujo**
4. ❌ En su lugar, activaba el flujo de reserva de turnos

### Causa Raíz

**1. Inconsistencia en `empresaId`:**
```typescript
// ❌ ANTES: Se pasaba ObjectId
await iniciarFlujoNotificacionViajes(
  clienteTelefono,
  empresaDoc._id.toString(),  // ObjectId como string
  viajes
);

// Pero el whatsappController usa:
empresaId: empresa.nombre  // Nombre de la empresa
```

**Resultado**: El estado del flujo se guardaba con un `empresaId` diferente al que llegaba en los mensajes posteriores, por lo que el FlowManager no encontraba el flujo activo.

**2. Falta de `phoneNumberId`:**
```typescript
// ❌ ANTES: phoneNumberId vacío
const context: FlowContext = {
  telefono,
  empresaId,
  mensaje: '',
  phoneNumberId: '',  // ❌ Vacío
  data: initialData
};
```

**Resultado**: El flujo no podía enviar mensajes de respuesta porque no tenía el `phoneNumberId` de la empresa.

### Solución Implementada

**1. Usar nombre de empresa consistentemente:**
```typescript
// ✅ DESPUÉS: Usar nombre de empresa
await iniciarFlujoNotificacionViajes(
  clienteTelefono,
  empresaDoc.nombre,  // ✅ Nombre, igual que whatsappController
  viajes
);
```

**2. Obtener `phoneNumberId` de la empresa:**
```typescript
// ✅ DESPUÉS: Buscar phoneNumberId en MongoDB
let phoneNumberId = '';
try {
  const empresa = await EmpresaModel.findOne({ nombre: empresaId });
  if (empresa && empresa.phoneNumberId) {
    phoneNumberId = empresa.phoneNumberId;
  }
} catch (error) {
  console.error('⚠️ Error obteniendo phoneNumberId:', error);
}

const context: FlowContext = {
  telefono,
  empresaId,
  mensaje: '',
  phoneNumberId,  // ✅ Ahora tiene el phoneNumberId correcto
  data: initialData
};
```

---

## 🚗 Cómo Funciona la Notificación de Viajes

### Flujo Completo (Modo Prueba y Modo Real)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. INICIO: Botón "Enviar Notificación de Prueba" (CRM)     │
│    o Cron Job (automático)                                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. configuracionController.enviarNotificacionPrueba()       │
│    - Busca cliente de prueba                                │
│    - Busca empresa por nombre                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. enviarNotificacionConfirmacionViajes()                   │
│    - Busca empresa en MongoDB (EmpresaModel)                │
│    - Busca cliente por teléfono (ClienteModel)              │
│    - Busca turnos por clienteId (TurnoModel)                │
│    - Construye mensaje con viajes                           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. enviarMensajeWhatsAppTexto()                             │
│    - Formatea número de teléfono                            │
│    - Llama a Meta WhatsApp API                              │
│    - Envía mensaje al cliente                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. iniciarFlujoNotificacionViajes()                         │
│    - Llama a flowManager.startFlow()                        │
│    - Pasa datos: { viajes: [...] }                          │
│    - Guarda estado en ConversationState                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. notificacionViajesFlow.start()                           │
│    - Estado inicial: 'esperando_opcion_inicial'             │
│    - Guarda viajes en state.data                            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. USUARIO RESPONDE "1" o "2"                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. Webhook de Meta → whatsappController                     │
│    - Extrae mensaje del usuario                             │
│    - Crea FlowContext con phoneNumberId                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 9. flowManager.handleMessage()                              │
│    - Busca estado en ConversationState                      │
│    - Encuentra flujo_activo: 'notificacion_viajes'          │
│    - Llama a flow.onInput()                                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 10. notificacionViajesFlow.onInput()                        │
│     - Si mensaje = "1": Confirmar todos los viajes          │
│     - Si mensaje = "2": Mostrar lista para editar           │
│     - Actualiza estado en MongoDB                           │
│     - Envía respuesta por WhatsApp                          │
└─────────────────────────────────────────────────────────────┘
```

### Ejemplo de Conversación

```
[Sistema] 🚗 Recordatorio de viajes para mañana

━━━━━━━━━━━━━━━━━━
Viaje 1

📍 Origen: Corrientes 1234
📍 Destino: Av. Libertad 5678
🕐 Hora: 01:05
👥 Pasajeros: 1

━━━━━━━━━━━━━━━━━━

¿Qué deseas hacer?

1️⃣ Confirmar todos los viajes
2️⃣ Editar un viaje específico

Responde con el número de la opción.

[Usuario] 1

[Sistema] ✅ ¡Perfecto! Todos tus viajes han sido confirmados. Te esperamos mañana.

---

[Usuario] 2

[Sistema] ¿Qué viaje querés editar?

1. Corrientes 1234 → Av. Libertad 5678 (01:05)
2. San Martín 999 → Plaza Central (15:45)

Respondé con el número del viaje.

[Usuario] 1

[Sistema] Viaje seleccionado:
📍 Corrientes 1234 → Av. Libertad 5678
🕐 01:05

¿Qué querés modificar?

1️⃣ Origen
2️⃣ Destino
3️⃣ Horario
4️⃣ Cancelar este viaje

Respondé con el número.

[Usuario] 1

[Sistema] 📍 ¿Cuál es el nuevo origen?

[Usuario] Av. Costanera 100

[Sistema] ✅ Origen actualizado a: Av. Costanera 100

¿Querés hacer otra modificación?

1️⃣ Sí
2️⃣ No, confirmar cambios

[Usuario] 2

[Sistema] ✅ ¡Perfecto! Tus cambios han sido guardados. Te esperamos mañana.
```

---

## 👨‍💻 Guía de Desarrollo

### Crear un Nuevo Flujo

```typescript
// 1. Crear archivo en src/flows/miNuevoFlujo.ts
import type { Flow, FlowContext, FlowResult } from './types.js';

export const miNuevoFlujo: Flow = {
  name: 'mi_nuevo_flujo',
  priority: 'normal',  // 'urgente' | 'normal' | 'baja'
  version: '1.0.0',
  
  // ¿Cuándo debe activarse este flujo?
  async shouldActivate(context: FlowContext): Promise<boolean> {
    const mensaje = context.mensaje.toLowerCase();
    return mensaje.includes('palabra_clave');
  },
  
  // Inicio del flujo
  async start(context: FlowContext): Promise<FlowResult> {
    // Enviar mensaje inicial
    await enviarMensajeWhatsAppTexto(
      context.telefono,
      '¡Hola! Iniciando flujo...',
      context.phoneNumberId
    );
    
    return {
      success: true,
      nextState: 'esperando_respuesta',
      data: { /* datos iniciales */ }
    };
  },
  
  // Procesar respuestas del usuario
  async onInput(
    context: FlowContext,
    state: string,
    data: Record<string, any>
  ): Promise<FlowResult> {
    const mensaje = context.mensaje.trim();
    
    if (state === 'esperando_respuesta') {
      // Procesar respuesta
      
      if (/* condición de finalización */) {
        return {
          success: true,
          end: true  // Terminar flujo
        };
      }
      
      return {
        success: true,
        nextState: 'siguiente_estado',
        data: { /* actualizar datos */ }
      };
    }
    
    return {
      success: false,
      error: 'Estado no reconocido'
    };
  },
  
  // Limpieza al finalizar (opcional)
  async onEnd(context: FlowContext, data: Record<string, any>): Promise<void> {
    console.log('Flujo finalizado');
  }
};
```

```typescript
// 2. Registrar en src/flows/index.ts
import { miNuevoFlujo } from './miNuevoFlujo.js';

export function initializeFlows(): void {
  flowManager.registerFlow(miNuevoFlujo);
  // ...
}
```

### Iniciar Flujo Programáticamente

```typescript
// Desde cualquier servicio
import { flowManager } from '../flows/index.js';

await flowManager.startFlow(
  telefono,
  empresaId,
  'mi_nuevo_flujo',
  { /* datos iniciales */ }
);
```

### Debugging

```typescript
// Ver estado actual de un usuario
const state = await flowManager.getState(telefono, empresaId);
console.log('Estado:', {
  flujo_activo: state?.flujo_activo,
  estado_actual: state?.estado_actual,
  data: state?.data
});

// Cancelar flujo activo
await flowManager.cancelFlow(telefono, empresaId);
```

---

## 📊 Base de Datos

### Modelo ConversationState

```typescript
{
  telefono: string;           // +543794946066
  empresaId: string;          // "San Jose"
  flujo_activo: string;       // "notificacion_viajes"
  estado_actual: string;      // "esperando_opcion_inicial"
  data: Record<string, any>;  // { viajes: [...] }
  flujos_pendientes: string[]; // ["otro_flujo"]
  prioridad: string;          // "urgente"
  ultima_interaccion: Date;   // 2025-11-02T18:40:00Z
}
```

---

## ✅ Checklist de Verificación

### Antes de Probar

- [ ] Servidor backend corriendo (`npm start`)
- [ ] `MODO_DEV=false` en `.env` (para envíos reales)
- [ ] MongoDB conectado
- [ ] Token de WhatsApp válido
- [ ] `phoneNumberId` configurado en la empresa

### Al Probar Notificación

- [ ] Logs muestran "✅ Empresa encontrada"
- [ ] Logs muestran "✅ Cliente encontrado"
- [ ] Logs muestran "✅ Encontrados X turnos"
- [ ] Logs muestran "✅ Flujo de notificación iniciado"
- [ ] Mensaje llega a WhatsApp
- [ ] Al responder "1" o "2", el flujo continúa (no inicia nuevo flujo)

### Logs Esperados (Respuesta del Usuario)

```
🔄 [FlowManager] Procesando mensaje de +543794946066
📊 Estado actual: {
  flujo_activo: 'notificacion_viajes',
  estado_actual: 'esperando_opcion_inicial',
  flujos_pendientes: [],
  prioridad: 'urgente'
}
▶️ Continuando flujo activo: notificacion_viajes
   Estado actual: esperando_opcion_inicial
   Mensaje: "1"
📥 [NotificacionViajes] Estado: esperando_opcion_inicial, Mensaje: 1
✅ Mensaje procesado por sistema de flujos
```

---

## 🎯 Conclusión

El sistema de flujos dinámicos permite:

✅ **Gestionar conversaciones complejas** con múltiples estados  
✅ **Priorizar flujos urgentes** sobre normales  
✅ **Mantener contexto** entre mensajes  
✅ **Iniciar flujos programáticamente** desde servicios  
✅ **Encolar flujos** cuando hay uno activo  
✅ **Logging completo** de todas las transiciones  

Las correcciones implementadas aseguran que:

✅ El `empresaId` sea consistente (nombre de empresa)  
✅ El `phoneNumberId` esté disponible en todos los contextos  
✅ Los flujos iniciados programáticamente funcionen igual que los automáticos  
✅ Las notificaciones de prueba sigan el mismo flujo que las reales  
