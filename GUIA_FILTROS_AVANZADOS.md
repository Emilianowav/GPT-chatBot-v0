# 🔍 Guía de Filtros Avanzados para Notificaciones

## ✅ Sistema Implementado

Ahora tienes **control total** sobre qué turnos reciben notificaciones automáticamente.

---

## 🎯 Filtros Disponibles

### **1. Estados a Incluir**
```
☑️ No confirmado
☑️ Pendiente  
☑️ Confirmado
```

**Uso:**
- Marca solo los estados que quieres incluir
- Si no marcas ninguno, se enviarán a todos los estados activos

**Ejemplo:**
```
Solo "No confirmado" marcado
→ Solo envía a turnos que NO han sido confirmados
→ Ideal para notificación de confirmación diaria
```

---

### **2. Rango Horario de Turnos**
```
Desde: 08:00
Hasta: 20:00
```

**Uso:**
- Solo envía a turnos dentro de este rango horario
- Útil para evitar notificaciones de turnos muy temprano o muy tarde

**Ejemplo:**
```
Desde: 08:00, Hasta: 20:00
→ NO envía a turno de 02:00 AM
→ SÍ envía a turno de 10:00 AM
→ SÍ envía a turno de 18:00 PM
→ NO envía a turno de 22:00 PM
```

---

### **3. Solo Turnos Sin Notificación Previa**
```
☑️ Solo enviar a turnos que NO han recibido notificación
```

**Uso:**
- Evita enviar notificaciones duplicadas
- El sistema marca en cada turno cuando se envió una notificación

**Ejemplo:**
```
Turno A: Nunca recibió notificación → ✅ SE ENVÍA
Turno B: Ya recibió notificación ayer → ❌ NO SE ENVÍA
```

---

### **4. Límite de Envíos**
```
Límite: 50
```

**Uso:**
- Máximo de turnos a enviar en cada ejecución
- Útil para controlar costos o evitar saturación

**Ejemplo:**
```
Tienes 100 turnos mañana
Límite: 50
→ Solo envía a los primeros 50 turnos (ordenados por hora)
```

---

## 📋 Ejemplos de Configuración

### **Ejemplo 1: Confirmación Diaria (Recomendado)**

```
Notificación: "Confirmación Diaria"
├─ Hora: 22:00
├─ Momento: Noche anterior
├─ Recurrente: Sí (Todos los días)
└─ Filtros:
   ├─ Estados: [No confirmado] ✅
   ├─ Hora mínima: 06:00
   ├─ Hora máxima: 22:00
   ├─ Solo sin notificar: ✅
   └─ Límite: (vacío)
```

**Resultado:**
```
Cada día a las 22:00:
  ✅ Busca turnos de mañana
  ✅ Solo turnos NO confirmados
  ✅ Solo turnos entre 6am y 10pm
  ✅ Solo turnos que no recibieron notificación
  ✅ Envía a cada cliente SUS turnos
  ✅ Evita duplicados automáticamente
```

---

### **Ejemplo 2: Recordatorio del Día (Sin Filtros)**

```
Notificación: "Recordatorio del Día"
├─ Hora: 09:00
├─ Momento: Mismo día
├─ Recurrente: Sí (Lunes a Viernes)
└─ Filtros:
   ├─ Estados: (ninguno marcado)
   ├─ Hora mínima: (vacío)
   ├─ Hora máxima: (vacío)
   ├─ Solo sin notificar: ❌
   └─ Límite: (vacío)
```

**Resultado:**
```
Lunes a Viernes a las 09:00:
  ✅ Busca turnos de HOY
  ✅ Todos los estados activos
  ✅ Todas las horas
  ✅ Incluso si ya recibieron notificación
  ✅ Sin límite
```

---

### **Ejemplo 3: Solo Turnos de la Mañana**

```
Notificación: "Turnos de la Mañana"
├─ Hora: 20:00
├─ Momento: Noche anterior
├─ Recurrente: Sí (Todos los días)
└─ Filtros:
   ├─ Estados: [No confirmado, Pendiente]
   ├─ Hora mínima: 06:00
   ├─ Hora máxima: 12:00 ✅ Solo mañana
   ├─ Solo sin notificar: ✅
   └─ Límite: 30
```

**Resultado:**
```
Cada día a las 20:00:
  ✅ Busca turnos de mañana
  ✅ Solo turnos entre 6am y 12pm (MAÑANA)
  ✅ Solo no confirmados y pendientes
  ✅ Solo sin notificación previa
  ✅ Máximo 30 turnos
```

---

## 🔄 Flujo Completo

### **Paso 1: Configurar Notificación**

1. Ir a `/dashboard/calendario/configuracion`
2. Tab "Notificaciones"
3. Crear notificación "Confirmación Diaria"
4. Configurar hora: `22:00`
5. Activar recurrencia: Todos los días

### **Paso 2: Configurar Filtros**

```
🔍 Filtros Avanzados
├─ Estados a incluir:
│  ☑️ No confirmado
│  ☐ Pendiente
│  ☐ Confirmado
│
├─ Rango horario:
│  Desde: 08:00
│  Hasta: 20:00
│
├─ ☑️ Solo sin notificar
│
└─ Límite: (vacío)
```

### **Paso 3: Guardar**

Clic en "💾 Guardar Configuración"

### **Paso 4: Resultado Automático**

```
Hoy: 01/11/2025 22:00
  ↓
Sistema ejecuta automáticamente
  ↓
Busca turnos de mañana (02/11/2025)
  ↓
Aplica filtros:
  ✅ Estado = no_confirmado
  ✅ Hora entre 08:00 y 20:00
  ✅ Sin notificación previa
  ↓
Encuentra 15 turnos
  ↓
Agrupa por cliente:
  - Cliente A: 2 turnos
  - Cliente B: 1 turno
  - Cliente C: 3 turnos
  - ...
  ↓
Envía a cada cliente SUS turnos
  ↓
Marca en cada turno que fue enviado
  ↓
✅ Completado
```

---

## 📊 Logs del Sistema

Cuando se ejecuta, verás en los logs del servidor:

```bash
⏰ [22:00] Verificando notificaciones programadas...
📨 Enviando notificación: confirmacion - noche_anterior
🔍 Filtros aplicados: 15 turnos encontrados
  - Estados: ['no_confirmado']
  - Hora: 08:00 - 20:00
  - Solo sin notificar: true
📊 Enviando a 8 clientes
✅ Enviado a Juan Pérez (+5491112345678)
✅ Enviado a María González (+5491187654321)
✅ Enviado a Carlos López (+5491198765432)
...
```

---

## 🎯 Casos de Uso

### **Caso 1: Evitar Duplicados**

**Problema:**
```
Configuraste notificación a las 22:00
Cron ejecuta a las 22:00 → Envía
Cron ejecuta a las 22:01 → Envía de nuevo ❌
```

**Solución:**
```
Activar: ☑️ Solo sin notificar
→ Segunda ejecución no envía porque ya tienen notificación ✅
```

---

### **Caso 2: Solo Turnos Laborales**

**Problema:**
```
Tienes turnos a las 02:00 AM (emergencias)
No quieres enviar notificación a esa hora
```

**Solución:**
```
Hora mínima: 08:00
Hora máxima: 20:00
→ Turno de 02:00 AM no recibe notificación ✅
→ Turnos de 10:00 AM sí reciben ✅
```

---

### **Caso 3: Solo No Confirmados**

**Problema:**
```
Quieres enviar solo a turnos que NO están confirmados
Los confirmados ya no necesitan recordatorio
```

**Solución:**
```
Estados: [No confirmado] ✅
→ Solo envía a turnos sin confirmar ✅
→ Los confirmados no reciben mensaje ✅
```

---

### **Caso 4: Limitar Envíos**

**Problema:**
```
Tienes 500 turnos mañana
No quieres enviar 500 mensajes de golpe
```

**Solución:**
```
Límite: 100
→ Solo envía a los primeros 100 turnos ✅
→ Próxima ejecución envía los siguientes ✅
```

---

## ⚙️ Configuración Recomendada

### **Para Confirmación Diaria:**

```yaml
Notificación: "Confirmación Diaria"
Hora: 22:00
Momento: noche_anterior
Recurrente: Sí (Todos los días)
Filtros:
  Estados: [no_confirmado]
  Hora mínima: 06:00
  Hora máxima: 22:00
  Solo sin notificar: true
  Límite: (vacío)
```

**Ventajas:**
- ✅ Solo envía a turnos sin confirmar
- ✅ Solo turnos en horario laboral
- ✅ Evita duplicados automáticamente
- ✅ Sin límite (envía a todos los que cumplan)

---

### **Para Recordatorio del Día:**

```yaml
Notificación: "Recordatorio del Día"
Hora: 09:00
Momento: mismo_dia
Recurrente: Sí (Lunes a Viernes)
Filtros:
  Estados: [confirmado, pendiente]
  Hora mínima: 09:00
  Hora máxima: (vacío)
  Solo sin notificar: false
  Límite: (vacío)
```

**Ventajas:**
- ✅ Solo envía a turnos confirmados/pendientes
- ✅ Solo turnos después de las 9am
- ✅ Puede enviar aunque ya recibieron confirmación
- ✅ Recordatorio adicional el mismo día

---

## 🔧 Solución de Problemas

### **Problema: No se envían notificaciones**

**Verificar:**
1. ✅ Notificación está activa
2. ✅ Hora configurada es correcta
3. ✅ Hay turnos que cumplan los filtros
4. ✅ Los turnos no tienen notificación previa (si activaste "solo sin notificar")

**Logs a revisar:**
```bash
⏰ [22:00] Verificando notificaciones programadas...
📨 Enviando notificación: confirmacion - noche_anterior
🔍 Filtros aplicados: 0 turnos encontrados  ← ⚠️ PROBLEMA
```

**Solución:**
- Revisar filtros (quizás son muy restrictivos)
- Verificar que hay turnos en la base de datos
- Verificar estados de los turnos

---

### **Problema: Se envían duplicados**

**Causa:**
```
No activaste "Solo sin notificar"
```

**Solución:**
```
Activar: ☑️ Solo sin notificar
```

---

### **Problema: No envía a todos los turnos**

**Causa:**
```
Tienes límite configurado
```

**Solución:**
```
Límite: (dejar vacío para sin límite)
```

---

## ✅ Resumen

**Antes:**
- ❌ Enviaba a TODOS los turnos sin control
- ❌ No podías filtrar por estado
- ❌ No podías filtrar por hora
- ❌ Enviaba duplicados

**Ahora:**
- ✅ Control total con filtros avanzados
- ✅ Filtra por estado (no_confirmado, pendiente, confirmado)
- ✅ Filtra por rango horario (08:00 - 20:00)
- ✅ Evita duplicados automáticamente
- ✅ Límite de envíos configurable
- ✅ Totalmente automatizado

¡Sistema de filtros avanzados completamente funcional! 🎉
