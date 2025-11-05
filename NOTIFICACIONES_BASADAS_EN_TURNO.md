# ⏰ Notificaciones Basadas en Hora del Turno

## 🎯 Objetivo

Implementar notificaciones que se envíen **basándose en la hora exacta de cada turno**, no en rangos de fechas fijos.

---

## ✅ Sistema Implementado

Ahora puedes configurar notificaciones de dos formas:

### **Opción 1: X Horas Antes de Cada Turno** ⭐ RECOMENDADO
```
Turno A: 10:00 AM → Notificación: 08:00 AM (2h antes)
Turno B: 14:00 PM → Notificación: 12:00 PM (2h antes)
Turno C: 18:00 PM → Notificación: 16:00 PM (2h antes)
```

### **Opción 2: X Días Antes a Hora Específica**
```
Turno A: 10:00 AM del 02/11 → Notificación: 22:00 del 01/11
Turno B: 14:00 PM del 02/11 → Notificación: 22:00 del 01/11
Turno C: 18:00 PM del 02/11 → Notificación: 22:00 del 01/11
```

---

## 📋 Opciones Disponibles

### **1. ⏰ X Horas Antes de Cada Turno** (NUEVO)

**Configuración:**
```
¿Cuándo enviar?: X horas antes de cada turno
Horas antes: 2
```

**Funcionamiento:**
```
Sistema ejecuta cada minuto:
  ↓
Busca turnos que empiecen en exactamente 2 horas
  ↓
Turno encontrado: 10:00 AM
Hora actual: 08:00 AM
  ↓
✅ ENVÍA notificación
```

**Ejemplos:**
| Hora del Turno | Horas Antes | Se Envía a las |
|----------------|-------------|----------------|
| 10:00 AM | 2 | 08:00 AM |
| 14:30 PM | 2 | 12:30 PM |
| 18:15 PM | 24 | 18:15 PM (día anterior) |
| 09:00 AM | 1 | 08:00 AM |

**Ventajas:**
- ✅ Cada turno recibe notificación a su hora exacta
- ✅ No importa si el turno es temprano o tarde
- ✅ Perfecto para recordatorios del mismo día
- ✅ Ideal para confirmaciones 2-3 horas antes

---

### **2. 📅 X Días Antes a Hora Específica** (NUEVO)

**Configuración:**
```
¿Cuándo enviar?: X días antes a hora específica
Días antes: 1
Hora de envío: 22:00
```

**Funcionamiento:**
```
Sistema ejecuta cada minuto:
  ↓
Hora actual: 22:00
  ↓
Busca turnos de mañana (1 día después)
  ↓
Turnos encontrados: 10:00 AM, 14:00 PM, 18:00 PM
  ↓
✅ ENVÍA a todos a las 22:00
```

**Ejemplos:**
| Días Antes | Hora Envío | Turnos del | Se Envía el |
|------------|------------|------------|-------------|
| 1 | 22:00 | 02/11 | 01/11 22:00 |
| 2 | 20:00 | 03/11 | 01/11 20:00 |
| 1 | 08:00 | 02/11 | 01/11 08:00 |

**Ventajas:**
- ✅ Todos los turnos reciben notificación a la misma hora
- ✅ Ideal para confirmaciones diarias
- ✅ Fácil de predecir cuándo se envían
- ✅ Perfecto para notificaciones nocturnas

---

### **3. 🌙 Noche Anterior** (Mantiene Compatibilidad)

**Configuración:**
```
¿Cuándo enviar?: Noche anterior
Hora de envío: 22:00
```

**Funcionamiento:**
```
Igual que "1 día antes a las 22:00"
```

---

### **4. 🕐 Hora Exacta del Día** (Mantiene Compatibilidad)

**Configuración:**
```
¿Cuándo enviar?: Hora exacta del día
Hora de envío: 09:00
```

**Funcionamiento:**
```
Envía a todos los turnos de HOY a las 09:00
```

---

## 🎯 Casos de Uso

### **Caso 1: Confirmación 24 Horas Antes**

**Configuración:**
```yaml
Notificación: "Confirmación 24h Antes"
Momento: X horas antes de cada turno
Horas antes: 24
Recurrente: Sí (Todos los días)
Filtros:
  Estados: [no_confirmado]
  Solo sin notificar: true
```

**Resultado:**
```
Turno A: 02/11 10:00 AM
  → Notificación: 01/11 10:00 AM ✅

Turno B: 02/11 14:00 PM
  → Notificación: 01/11 14:00 PM ✅

Turno C: 02/11 18:00 PM
  → Notificación: 01/11 18:00 PM ✅
```

**Ventajas:**
- ✅ Cada cliente recibe notificación exactamente 24h antes
- ✅ No importa la hora del turno
- ✅ Distribución uniforme de notificaciones

---

### **Caso 2: Recordatorio 2 Horas Antes**

**Configuración:**
```yaml
Notificación: "Recordatorio 2h Antes"
Momento: X horas antes de cada turno
Horas antes: 2
Recurrente: Sí (Todos los días)
Filtros:
  Estados: [confirmado, pendiente]
  Solo sin notificar: false
```

**Resultado:**
```
Turno A: Hoy 10:00 AM
  → Notificación: Hoy 08:00 AM ✅

Turno B: Hoy 14:00 PM
  → Notificación: Hoy 12:00 PM ✅

Turno C: Hoy 18:00 PM
  → Notificación: Hoy 16:00 PM ✅
```

**Ventajas:**
- ✅ Recordatorio justo antes del turno
- ✅ Cliente tiene tiempo de prepararse
- ✅ Reduce no-shows

---

### **Caso 3: Confirmación Nocturna (Todos a las 22:00)**

**Configuración:**
```yaml
Notificación: "Confirmación Nocturna"
Momento: X días antes a hora específica
Días antes: 1
Hora envío: 22:00
Recurrente: Sí (Todos los días)
Filtros:
  Estados: [no_confirmado]
  Hora mínima: 08:00
  Hora máxima: 20:00
  Solo sin notificar: true
```

**Resultado:**
```
Hoy: 01/11 22:00
  ↓
Busca turnos de mañana (02/11)
  ↓
Turno A: 02/11 10:00 AM ✅
Turno B: 02/11 14:00 PM ✅
Turno C: 02/11 18:00 PM ✅
  ↓
Envía a todos a las 22:00 ✅
```

**Ventajas:**
- ✅ Todos reciben a la misma hora
- ✅ Fácil de predecir
- ✅ Ideal para confirmaciones diarias

---

## 🔄 Comparación de Métodos

### **Método 1: X Horas Antes de Cada Turno**

| Turno | Hora Turno | Notificación (2h antes) |
|-------|------------|------------------------|
| A | 08:00 AM | 06:00 AM |
| B | 10:00 AM | 08:00 AM |
| C | 14:00 PM | 12:00 PM |
| D | 18:00 PM | 16:00 PM |
| E | 20:00 PM | 18:00 PM |

**Distribución:** ✅ Uniforme a lo largo del día

---

### **Método 2: 1 Día Antes a las 22:00**

| Turno | Hora Turno | Notificación |
|-------|------------|--------------|
| A | 08:00 AM | 22:00 (día anterior) |
| B | 10:00 AM | 22:00 (día anterior) |
| C | 14:00 PM | 22:00 (día anterior) |
| D | 18:00 PM | 22:00 (día anterior) |
| E | 20:00 PM | 22:00 (día anterior) |

**Distribución:** ✅ Todas a la misma hora

---

## 🎨 Interfaz de Usuario

### **Configuración en el Frontend:**

```
┌─────────────────────────────────────────────┐
│ ⏰ ¿Cuándo enviar?                          │
│ ┌─────────────────────────────────────────┐ │
│ │ ⏰ X horas antes de cada turno     [▼] │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Cuántas horas antes del turno               │
│ ┌─────┐                                     │
│ │  2  │                                     │
│ └─────┘                                     │
│ ℹ️ Ejemplo: Si el turno es a las 10:00 y   │
│   configuras 2 horas, se enviará a las     │
│   08:00                                     │
└─────────────────────────────────────────────┘
```

**O:**

```
┌─────────────────────────────────────────────┐
│ ⏰ ¿Cuándo enviar?                          │
│ ┌─────────────────────────────────────────┐ │
│ │ 📅 X días antes a hora específica  [▼] │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Días antes        Hora de envío            │
│ ┌─────┐          ┌─────────┐               │
│ │  1  │          │  22:00  │               │
│ └─────┘          └─────────┘               │
└─────────────────────────────────────────────┘
```

---

## 🔧 Implementación Técnica

### **Backend - Cálculo de Turnos**

```typescript
// Opción 1: X horas antes de cada turno
if (notif.momento === 'horas_antes_turno' && notif.horasAntesTurno) {
  const horasMs = notif.horasAntesTurno * 60 * 60 * 1000;
  
  // Buscar turnos que empiecen en exactamente X horas (±5 min)
  fechaInicio = new Date(ahora.getTime() + horasMs - 5 * 60 * 1000);
  fechaFin = new Date(ahora.getTime() + horasMs + 5 * 60 * 1000);
}

// Opción 2: X días antes a hora específica
if (notif.momento === 'dia_antes_turno' && notif.diasAntes) {
  // Verificar que sea la hora configurada
  if (horaActual !== notif.horaEnvioDiaAntes) {
    return []; // No es la hora
  }
  
  // Buscar turnos de dentro de X días
  fechaInicio = new Date(ahora);
  fechaInicio.setDate(fechaInicio.getDate() + notif.diasAntes);
  fechaInicio.setHours(0, 0, 0, 0);
  
  fechaFin = new Date(fechaInicio);
  fechaFin.setHours(23, 59, 59, 999);
}
```

---

## 📊 Logs del Sistema

### **Método 1: X Horas Antes**

```bash
⏰ [08:00] Verificando notificaciones programadas...
📨 Enviando notificación: confirmacion - horas_antes_turno
🔍 Buscando turnos que empiecen a las 10:00 (2h después)
🔍 Filtros aplicados: 3 turnos encontrados
  - Estados: ['no_confirmado']
  - Hora: 08:00 - 20:00
  - Solo sin notificar: true
📊 Enviando a 3 clientes
✅ Enviado a Juan Pérez (Turno: 10:00 AM)
✅ Enviado a María González (Turno: 10:15 AM)
✅ Enviado a Carlos López (Turno: 10:30 AM)
```

### **Método 2: Días Antes**

```bash
⏰ [22:00] Verificando notificaciones programadas...
📨 Enviando notificación: confirmacion - dia_antes_turno
🔍 Buscando turnos de mañana (02/11)
🔍 Filtros aplicados: 15 turnos encontrados
  - Estados: ['no_confirmado']
  - Hora: 08:00 - 20:00
  - Solo sin notificar: true
📊 Enviando a 12 clientes
✅ Enviado a Juan Pérez (Turno: 10:00 AM)
✅ Enviado a María González (Turno: 14:00 PM)
...
```

---

## ⚙️ Configuraciones Recomendadas

### **Para Confirmación:**

**Opción A: 24 Horas Antes (Distribuido)**
```yaml
Momento: X horas antes de cada turno
Horas antes: 24
Filtros:
  Estados: [no_confirmado]
  Solo sin notificar: true
```

**Opción B: Noche Anterior (Agrupado)**
```yaml
Momento: X días antes a hora específica
Días antes: 1
Hora envío: 22:00
Filtros:
  Estados: [no_confirmado]
  Solo sin notificar: true
```

---

### **Para Recordatorio:**

**Opción A: 2 Horas Antes (Distribuido)**
```yaml
Momento: X horas antes de cada turno
Horas antes: 2
Filtros:
  Estados: [confirmado, pendiente]
  Solo sin notificar: false
```

**Opción B: Mañana del Día (Agrupado)**
```yaml
Momento: Hora exacta del día
Hora envío: 09:00
Filtros:
  Estados: [confirmado, pendiente]
```

---

## ✅ Ventajas del Sistema

### **Antes:**
- ❌ Solo podías enviar a "todos los turnos de mañana"
- ❌ No consideraba la hora de cada turno
- ❌ Turnos tempranos y tardíos recibían a la misma hora

### **Ahora:**
- ✅ Envía basándose en la hora exacta de cada turno
- ✅ Cada turno recibe notificación en su momento óptimo
- ✅ Dos métodos: distribuido o agrupado
- ✅ Totalmente configurable
- ✅ Compatible con filtros avanzados

---

## 🎯 Resumen

| Método | Cuándo Usar | Ventaja Principal |
|--------|-------------|-------------------|
| **X horas antes de cada turno** | Recordatorios del mismo día | Distribución uniforme |
| **X días antes a hora específica** | Confirmaciones diarias | Todos a la misma hora |
| **Noche anterior** | Confirmaciones simples | Fácil de configurar |
| **Hora exacta del día** | Recordatorios matutinos | Todos juntos |

¡Sistema de notificaciones basadas en hora del turno completamente funcional! 🎉
