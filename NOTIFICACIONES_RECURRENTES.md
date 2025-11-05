# 🔄 Sistema de Notificaciones Recurrentes

## 🎯 Objetivo

Cuando se activa la opción "Notificación recurrente", el sistema debe **heredar TODOS los datos ya configurados** de la notificación (destinatario, tipo, momento, mensaje, hora, etc.) y solo agregar la configuración de recurrencia.

---

## ✅ Cambios Implementados

### **1. Herencia de Datos al Activar Recurrencia**

**Archivo:** `front_crm/bot_crm/src/components/calendar/ConfiguracionModulo.tsx`

**Antes (❌ Problema):**
```typescript
onChange={(e) => actualizarNotificacion(index, { 
  esRecurrente: e.target.checked,
  recurrencia: e.target.checked ? {
    tipo: 'semanal',
    intervalo: 1,
    horaEnvio: '09:00',  // ❌ Hora fija, no toma la configurada
    diasSemana: [1]
  } : undefined
})}
```

**Después (✅ Solución):**
```typescript
onChange={(e) => {
  if (e.target.checked) {
    // Al activar recurrencia, tomar datos ya configurados
    const horaExistente = notif.horaEnvio || '22:00';
    
    actualizarNotificacion(index, { 
      esRecurrente: true,
      recurrencia: {
        tipo: 'semanal',
        intervalo: 1,
        horaEnvio: horaExistente, // ✅ Toma hora ya configurada
        diasSemana: [1]
      }
    });
  } else {
    // Al desactivar, mantener todos los demás datos
    actualizarNotificacion(index, { 
      esRecurrente: false,
      recurrencia: undefined
    });
  }
}}
```

**Resultado:**
- ✅ Si la notificación tiene `horaEnvio: '22:00'`, la recurrencia usa `22:00`
- ✅ Si no tiene hora, usa `22:00` por defecto
- ✅ Al desactivar recurrencia, mantiene todos los datos originales

---

### **2. Corrección de Plantilla "Confirmación Diaria"**

**Archivo:** `front_crm/bot_crm/src/components/calendar/SelectorTipoNotificacion.tsx`

**Antes (❌ Problema):**
```typescript
{
  id: 'confirmacion_diaria',
  nombre: 'Confirmación Diaria',
  descripcion: 'Solicita confirmación a los clientes el día del turno',
  plantillaMensaje: `Hola {cliente}! 👋

Tu {turno} es HOY a las {hora}  // ❌ Dice "HOY" pero debería ser "mañana"

📍 *Origen:* {origen}
📍 *Destino:* {destino}
👤 *Agente:* {agente}

Por favor confirma respondiendo *SÍ* o *NO* 🙏`,
  momento: 'hora_exacta'  // ❌ Debería ser 'noche_anterior'
}
```

**Después (✅ Solución):**
```typescript
{
  id: 'confirmacion_diaria',
  nombre: 'Confirmación Diaria',
  descripcion: 'Solicita confirmación a los clientes la noche anterior (22:00)',
  plantillaMensaje: `🚗 *Recordatorio de viaje para mañana*

📍 *Origen:* {origen}
📍 *Destino:* {destino}
🕐 *Hora:* {hora}
👥 *Pasajeros:* {pasajeros}

¿Confirmas tu viaje? Responde *SÍ* o *NO*`,
  momento: 'noche_anterior'  // ✅ Correcto
}
```

**Resultado:**
- ✅ Mensaje correcto: "para mañana" en vez de "HOY"
- ✅ Momento correcto: `noche_anterior` en vez de `hora_exacta`
- ✅ Se envía a las 22:00 del día anterior
- ✅ Formato consistente con el sistema de confirmación

---

## 📋 Flujo Completo de Datos

### **Paso 1: Crear Notificación desde Plantilla**

```typescript
// Usuario selecciona: "Confirmación Diaria"

crearNotificacionDesdePlantilla(plantilla) {
  nuevaNotificacion = {
    activa: true,
    tipo: 'confirmacion',                    // ✅ Desde plantilla
    destinatario: 'cliente',                 // ✅ Desde plantilla
    momento: 'noche_anterior',               // ✅ Desde plantilla
    horaEnvio: '22:00',                      // ✅ Default para noche_anterior
    plantillaMensaje: '🚗 Recordatorio...',  // ✅ Desde plantilla
    requiereConfirmacion: true,              // ✅ Desde plantilla
    esRecurrente: false,                     // ⏸️ Aún no activada
    recurrencia: undefined                   // ⏸️ Aún no configurada
  }
}
```

**Datos heredados de la plantilla:**
- ✅ `tipo`: 'confirmacion'
- ✅ `destinatario`: 'cliente'
- ✅ `momento`: 'noche_anterior'
- ✅ `horaEnvio`: '22:00'
- ✅ `plantillaMensaje`: Mensaje completo
- ✅ `requiereConfirmacion`: true

---

### **Paso 2: Usuario Configura la Notificación**

```typescript
// Usuario puede modificar:
- Destinatario: cliente → agente
- Hora de envío: 22:00 → 20:00
- Mensaje: Editar el texto
- Agregar/quitar campos personalizados
- etc.

// Estado actual:
{
  activa: true,
  tipo: 'confirmacion',
  destinatario: 'cliente',
  momento: 'noche_anterior',
  horaEnvio: '20:00',  // ✅ Usuario cambió a 20:00
  plantillaMensaje: '🚗 Recordatorio personalizado...',
  requiereConfirmacion: true
}
```

---

### **Paso 3: Usuario Activa Recurrencia**

```typescript
// Usuario marca checkbox: "🔄 Notificación recurrente"

// Sistema ejecuta:
const horaExistente = notif.horaEnvio || '22:00';  // ✅ Toma '20:00'

actualizarNotificacion(index, { 
  esRecurrente: true,
  recurrencia: {
    tipo: 'semanal',
    intervalo: 1,
    horaEnvio: '20:00',  // ✅ HEREDADO de notif.horaEnvio
    diasSemana: [1]      // Lunes por defecto
  }
});

// Estado final:
{
  activa: true,
  tipo: 'confirmacion',
  destinatario: 'cliente',
  momento: 'noche_anterior',
  horaEnvio: '20:00',              // ✅ Mantiene configuración original
  plantillaMensaje: '🚗 ...',      // ✅ Mantiene mensaje original
  requiereConfirmacion: true,      // ✅ Mantiene confirmación
  esRecurrente: true,              // ✅ NUEVO
  recurrencia: {                   // ✅ NUEVO
    tipo: 'semanal',
    intervalo: 1,
    horaEnvio: '20:00',            // ✅ HEREDADO
    diasSemana: [1]
  }
}
```

**Datos heredados a la recurrencia:**
- ✅ `horaEnvio`: '20:00' (del campo `notif.horaEnvio`)
- ✅ Todos los demás datos de la notificación se mantienen intactos

---

### **Paso 4: Usuario Configura Recurrencia**

```typescript
// Usuario puede modificar:
- Tipo: semanal → mensual
- Intervalo: 1 → 2 (cada 2 semanas)
- Días: Lunes → Lunes, Miércoles, Viernes
- Hora: 20:00 → 21:00

// Estado final:
{
  activa: true,
  tipo: 'confirmacion',
  destinatario: 'cliente',
  momento: 'noche_anterior',
  horaEnvio: '20:00',              // ✅ Original se mantiene
  plantillaMensaje: '🚗 ...',
  requiereConfirmacion: true,
  esRecurrente: true,
  recurrencia: {
    tipo: 'semanal',
    intervalo: 2,                  // ✅ Cada 2 semanas
    horaEnvio: '21:00',            // ✅ Usuario cambió en recurrencia
    diasSemana: [1, 3, 5]          // ✅ Lun, Mié, Vie
  }
}
```

---

## 🔍 Datos que se Heredan

### **Datos de la Notificación Original (NO se duplican):**

| Campo | Descripción | Se hereda a recurrencia |
|-------|-------------|------------------------|
| `activa` | Si está activa | ❌ No (es de la notificación) |
| `tipo` | recordatorio/confirmacion | ❌ No (es de la notificación) |
| `destinatario` | cliente/agente | ❌ No (es de la notificación) |
| `momento` | noche_anterior/hora_exacta | ❌ No (es de la notificación) |
| `horaEnvio` | Hora de envío | ✅ **SÍ** (se copia a `recurrencia.horaEnvio`) |
| `plantillaMensaje` | Texto del mensaje | ❌ No (es de la notificación) |
| `requiereConfirmacion` | Si requiere respuesta | ❌ No (es de la notificación) |

### **Datos de la Recurrencia (Nuevos):**

| Campo | Descripción | Valor inicial |
|-------|-------------|---------------|
| `esRecurrente` | Si es recurrente | `true` |
| `recurrencia.tipo` | semanal/mensual | `'semanal'` |
| `recurrencia.intervalo` | Cada cuántas semanas/meses | `1` |
| `recurrencia.horaEnvio` | Hora de envío | ✅ **Heredado de `notif.horaEnvio`** |
| `recurrencia.diasSemana` | Días de la semana | `[1]` (Lunes) |
| `recurrencia.diaMes` | Día del mes | `undefined` |
| `recurrencia.fechaInicio` | Fecha de inicio | `undefined` |
| `recurrencia.fechaFin` | Fecha de fin | `undefined` |

---

## 📊 Ejemplo Completo

### **Caso: Confirmación Diaria Recurrente**

**1. Usuario crea notificación "Confirmación Diaria"**
```json
{
  "activa": true,
  "tipo": "confirmacion",
  "destinatario": "cliente",
  "momento": "noche_anterior",
  "horaEnvio": "22:00",
  "plantillaMensaje": "🚗 *Recordatorio de viaje para mañana*\n\n📍 *Origen:* {origen}\n📍 *Destino:* {destino}\n🕐 *Hora:* {hora}\n👥 *Pasajeros:* {pasajeros}\n\n¿Confirmas tu viaje? Responde *SÍ* o *NO*",
  "requiereConfirmacion": true
}
```

**2. Usuario activa recurrencia**
```json
{
  "activa": true,
  "tipo": "confirmacion",
  "destinatario": "cliente",
  "momento": "noche_anterior",
  "horaEnvio": "22:00",
  "plantillaMensaje": "🚗 *Recordatorio de viaje para mañana*...",
  "requiereConfirmacion": true,
  "esRecurrente": true,
  "recurrencia": {
    "tipo": "semanal",
    "intervalo": 1,
    "horaEnvio": "22:00",  // ✅ HEREDADO
    "diasSemana": [1]
  }
}
```

**3. Usuario configura: Enviar todos los días a las 22:00**
```json
{
  "activa": true,
  "tipo": "confirmacion",
  "destinatario": "cliente",
  "momento": "noche_anterior",
  "horaEnvio": "22:00",
  "plantillaMensaje": "🚗 *Recordatorio de viaje para mañana*...",
  "requiereConfirmacion": true,
  "esRecurrente": true,
  "recurrencia": {
    "tipo": "semanal",
    "intervalo": 1,
    "horaEnvio": "22:00",
    "diasSemana": [0, 1, 2, 3, 4, 5, 6]  // ✅ Todos los días
  }
}
```

**Resultado:**
- ✅ Todos los días a las 22:00
- ✅ Se envía a cada cliente sus turnos de mañana
- ✅ Requiere confirmación (SÍ/NO)
- ✅ Usa el mismo mensaje configurado
- ✅ NO se duplican datos

---

## 🎨 Interfaz de Usuario

### **Vista de Configuración:**

```
┌─────────────────────────────────────────────────┐
│ 📋 Notificación: Confirmación Diaria            │
├─────────────────────────────────────────────────┤
│                                                 │
│ 👥 Destinatario: [Todos los clientes ▼]        │
│                                                 │
│ 📝 Tipo: [Confirmación ▼]                       │
│                                                 │
│ ⏰ ¿Cuándo enviar?: [Noche anterior ▼]          │
│                                                 │
│ 🕐 Hora de envío: [22:00]                       │
│                                                 │
│ 💬 Mensaje:                                     │
│ ┌─────────────────────────────────────────────┐ │
│ │ 🚗 *Recordatorio de viaje para mañana*      │ │
│ │                                             │ │
│ │ 📍 *Origen:* {origen}                       │ │
│ │ 📍 *Destino:* {destino}                     │ │
│ │ 🕐 *Hora:* {hora}                           │ │
│ │ 👥 *Pasajeros:* {pasajeros}                 │ │
│ │                                             │ │
│ │ ¿Confirmas tu viaje? Responde *SÍ* o *NO*  │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ☑️ Requiere confirmación del cliente            │
│                                                 │
│ ☑️ Notificación activa                          │
│                                                 │
├─────────────────────────────────────────────────┤
│ 🔄 RECURRENCIA                                  │
├─────────────────────────────────────────────────┤
│                                                 │
│ ☑️ Notificación recurrente                      │
│                                                 │
│ Tipo: [Semanal ▼]  Intervalo: [1]              │
│                                                 │
│ Hora de envío: [22:00] ← ✅ HEREDADO            │
│                                                 │
│ Días de la semana:                              │
│ ☑️ Dom  ☑️ Lun  ☑️ Mar  ☑️ Mié                   │
│ ☑️ Jue  ☑️ Vie  ☑️ Sáb                           │
│                                                 │
│ 📋 Resumen: Esta notificación se enviará       │
│ cada 1 semana(s) los Dom, Lun, Mar, Mié,       │
│ Jue, Vie, Sáb a las 22:00                      │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## ✅ Ventajas del Sistema

### **1. Sin Duplicación de Datos**
- ✅ No se repite la configuración
- ✅ Un solo lugar para editar el mensaje
- ✅ Cambios se aplican a toda la notificación

### **2. Herencia Inteligente**
- ✅ Hora de envío se hereda automáticamente
- ✅ Mantiene coherencia entre configuración y recurrencia
- ✅ Usuario no tiene que configurar dos veces

### **3. Flexibilidad**
- ✅ Puede cambiar la hora en recurrencia si lo necesita
- ✅ Puede desactivar recurrencia sin perder datos
- ✅ Puede activar/desactivar sin reconfigurar

---

## 🔧 Código Clave

### **Función `actualizarNotificacion`**

```typescript
const actualizarNotificacion = (
  index: number, 
  notif: Partial<NotificacionAutomatica>
) => {
  setFormData(prev => ({
    ...prev,
    notificaciones: prev.notificaciones?.map((n, i) => 
      i === index ? { ...n, ...notif } : n  // ✅ Merge de datos
    )
  }));
};
```

**Características:**
- ✅ Usa spread operator para merge
- ✅ Solo actualiza campos modificados
- ✅ Mantiene todos los demás datos intactos

---

## 📝 Resumen de Cambios

| Archivo | Cambio | Estado |
|---------|--------|--------|
| `ConfiguracionModulo.tsx` | Heredar `horaEnvio` al activar recurrencia | ✅ Completado |
| `ConfiguracionModulo.tsx` | Mantener datos al desactivar recurrencia | ✅ Completado |
| `SelectorTipoNotificacion.tsx` | Corregir plantilla "Confirmación Diaria" | ✅ Completado |
| `SelectorTipoNotificacion.tsx` | Cambiar momento a `noche_anterior` | ✅ Completado |
| `SelectorTipoNotificacion.tsx` | Actualizar mensaje a "para mañana" | ✅ Completado |

---

## ✅ Resultado Final

**Antes:**
- ❌ Al activar recurrencia, perdía la hora configurada
- ❌ Siempre usaba 09:00 por defecto
- ❌ Usuario tenía que configurar dos veces
- ❌ Plantilla decía "HOY" en vez de "mañana"

**Ahora:**
- ✅ Al activar recurrencia, hereda la hora configurada
- ✅ Usa la hora que el usuario ya configuró
- ✅ Usuario solo configura una vez
- ✅ Plantilla correcta: "para mañana"
- ✅ Momento correcto: `noche_anterior`
- ✅ Hora correcta: `22:00`

¡Sistema de notificaciones recurrentes con herencia de datos implementado! 🎉
