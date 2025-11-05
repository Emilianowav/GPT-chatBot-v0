# 📋 Condiciones de Envío de Notificaciones

## 🎯 Estado Actual del Sistema

### **¿Cuándo se Envía una Notificación?**

Una notificación se envía cuando se cumplen **TODAS** estas condiciones:

#### **1. Condiciones de Tiempo:**
```typescript
// Verificar hora exacta
horaActual === notificacion.horaEnvio  // Ej: "22:00" === "22:00"

// Si es recurrente, verificar día de la semana
diaActual in notificacion.recurrencia.diasSemana  // Ej: Lunes(1) in [0,1,2,3,4,5,6]
```

#### **2. Condiciones de la Notificación:**
```typescript
notificacion.activa === true  // Debe estar activa
configuracion.activo === true  // La configuración debe estar activa
```

#### **3. Condiciones de los Turnos:**

**A. Rango de Fechas (según `momento`):**

| Momento | Turnos que Busca | Ejemplo |
|---------|------------------|---------|
| `noche_anterior` | Turnos de **MAÑANA** (00:00 a 23:59) | Hoy 22:00 → Busca turnos del 02/11 |
| `mismo_dia` | Turnos de **HOY** (00:00 a 23:59) | Hoy 09:00 → Busca turnos del 01/11 |
| `hora_exacta` | Turnos de **HOY** (00:00 a 23:59) | Hoy 09:00 → Busca turnos del 01/11 |
| `horas_antes` | Turnos en **X horas** | Hoy 10:00 + 2h → Busca turnos ~12:00 |

**B. Estado del Turno:**
```typescript
turno.estado in ['no_confirmado', 'pendiente', 'confirmado']
```

❌ **NO** se envían notificaciones para turnos:
- `cancelado`
- `completado`
- `no_asistio`
- `en_curso`

**C. Empresa:**
```typescript
turno.empresaId === configuracion.empresaId
```

**D. Destinatarios (opcional):**

| Destinatario | Condición |
|--------------|-----------|
| `cliente` | **TODOS** los clientes con turnos |
| `clientes_especificos` | Solo clientes en `clientesEspecificos[]` |
| `agente` | **TODOS** los agentes con turnos |
| `agentes_especificos` | Solo agentes en `agentesEspecificos[]` |

---

## 🚨 Problema Actual

### **No se Puede Seleccionar Turnos Específicos**

**Escenario:**
```
Empresa tiene 100 turnos para mañana
Usuario quiere enviar notificación solo a 5 clientes específicos
```

**Comportamiento Actual:**
```typescript
// ❌ PROBLEMA: Envía a TODOS los turnos que cumplan condiciones
const turnos = await TurnoModel.find({
  empresaId: "San Jose",
  fechaInicio: { $gte: mañana, $lte: mañana },
  estado: { $in: ['no_confirmado', 'pendiente', 'confirmado'] }
});

// Resultado: Envía a los 100 clientes ❌
```

**Lo que el Usuario Necesita:**
```typescript
// ✅ SOLUCIÓN: Poder seleccionar turnos específicos
const turnosSeleccionados = [turno1, turno5, turno23, turno45, turno67];

// Resultado: Envía solo a esos 5 clientes ✅
```

---

## 💡 Soluciones Propuestas

### **Opción 1: Filtro por Clientes Específicos (Ya Existe)**

**Uso Actual:**
```
1. Crear notificación
2. Destinatario: "Clientes específicos"
3. Seleccionar clientes: [Cliente A, Cliente B, Cliente C]
4. Guardar
```

**Resultado:**
```typescript
const query = {
  empresaId: "San Jose",
  fechaInicio: { $gte: mañana, $lte: mañana },
  estado: { $in: ['no_confirmado', 'pendiente', 'confirmado'] },
  clienteId: { $in: ['clienteA', 'clienteB', 'clienteC'] }  // ✅ Filtro
};
```

✅ **Ventaja:** Ya está implementado
❌ **Limitación:** Solo filtra por cliente, no por turno específico

---

### **Opción 2: Botón "Enviar Prueba" con Selector de Turnos (Ya Existe)**

**Uso Actual:**
```
1. Ir a notificación configurada
2. Clic en "📤 Enviar Prueba"
3. Se abre selector de turnos
4. Seleccionar turnos específicos
5. Enviar
```

**Código Actual:**
```typescript
// front_crm/bot_crm/src/components/calendar/ConfiguracionModulo.tsx
const enviarNotificacionConTurnos = async (turnos: Turno[]) => {
  // Agrupa por cliente
  const turnosPorCliente = new Map();
  
  // Envía solo los turnos seleccionados ✅
  for (const [clienteId, turnosCliente] of turnosPorCliente) {
    await enviarMensaje(clienteId, turnosCliente);
  }
}
```

✅ **Ventaja:** Permite seleccionar turnos específicos
❌ **Limitación:** Es manual, no automático

---

### **Opción 3: Filtros Avanzados en Notificación (NUEVA - Recomendada)**

**Propuesta:**
```typescript
interface NotificacionAutomatica {
  // ... campos existentes ...
  
  // ✅ NUEVO: Filtros avanzados
  filtros?: {
    // Filtrar por estado específico
    estados?: ('no_confirmado' | 'pendiente' | 'confirmado')[];
    
    // Filtrar por rango horario
    horaMinima?: string;  // "08:00"
    horaMaxima?: string;  // "18:00"
    
    // Filtrar por agente
    agenteIds?: string[];
    
    // Filtrar por tipo de turno
    tipoReserva?: string[];  // ['viaje', 'traslado']
    
    // Filtrar por campos personalizados
    camposPersonalizados?: {
      [key: string]: any;  // { pasajeros: { $gte: 2 } }
    };
    
    // Límite de turnos a enviar
    limite?: number;  // Enviar máximo 50 turnos
    
    // Solo turnos sin notificación previa
    soloSinNotificar?: boolean;
  };
}
```

**Uso:**
```
1. Crear notificación "Confirmación Diaria"
2. Configurar filtros:
   - Estados: [no_confirmado]  ✅ Solo turnos sin confirmar
   - Hora mínima: 08:00
   - Hora máxima: 20:00  ✅ Solo turnos entre 8am y 8pm
   - Solo sin notificar: true  ✅ No enviar duplicados
3. Guardar
```

**Resultado:**
```typescript
const query = {
  empresaId: "San Jose",
  fechaInicio: { $gte: mañana, $lte: mañana },
  estado: { $in: ['no_confirmado'] },  // ✅ Solo no confirmados
  $expr: {
    $and: [
      { $gte: [{ $hour: "$fechaInicio" }, 8] },   // ✅ Después de 8am
      { $lte: [{ $hour: "$fechaInicio" }, 20] }   // ✅ Antes de 8pm
    ]
  },
  'notificaciones.enviada': { $ne: true }  // ✅ Sin notificación previa
};
```

✅ **Ventajas:**
- Control granular sobre qué turnos enviar
- Evita duplicados
- Permite segmentación por horario, estado, etc.
- Totalmente automático

---

### **Opción 4: Notificaciones Manuales vs Automáticas (NUEVA)**

**Propuesta:**
```typescript
interface NotificacionAutomatica {
  // ... campos existentes ...
  
  // ✅ NUEVO: Tipo de ejecución
  ejecucion: 'automatica' | 'manual';
}
```

**Notificación Automática:**
```
- Se ejecuta cada minuto según cron job
- Busca turnos automáticamente
- Envía sin intervención
```

**Notificación Manual:**
```
- NO se ejecuta automáticamente
- Usuario debe ir a "Enviar Prueba"
- Selecciona turnos manualmente
- Envía cuando quiere
```

**Uso:**
```
Notificación "Confirmación Diaria":
  - Ejecución: Automática
  - Hora: 22:00
  - Filtros: Estado = no_confirmado
  → Se envía automáticamente a las 22:00 a todos los turnos no confirmados

Notificación "Recordatorio Especial":
  - Ejecución: Manual
  - Mensaje: "Recordatorio especial..."
  → Usuario selecciona turnos cuando quiera enviar
```

---

## 📊 Comparación de Opciones

| Opción | Control | Automático | Implementación |
|--------|---------|------------|----------------|
| **Opción 1:** Clientes específicos | Medio | ✅ Sí | ✅ Ya existe |
| **Opción 2:** Enviar prueba | Alto | ❌ No | ✅ Ya existe |
| **Opción 3:** Filtros avanzados | Alto | ✅ Sí | ⏳ Pendiente |
| **Opción 4:** Manual vs Auto | Alto | Configurable | ⏳ Pendiente |

---

## 🎯 Recomendación

### **Implementar Opción 3 + Opción 4**

**Razón:**
- ✅ Máximo control sobre qué turnos enviar
- ✅ Evita enviar notificaciones duplicadas
- ✅ Permite segmentación avanzada
- ✅ Mantiene automatización
- ✅ Permite envíos manuales cuando sea necesario

**Ejemplo de Uso:**

**Caso 1: Confirmación Diaria Automática**
```
Notificación: "Confirmación Diaria"
- Ejecución: Automática
- Hora: 22:00
- Momento: noche_anterior
- Filtros:
  - Estados: [no_confirmado]
  - Solo sin notificar: true
  - Hora mínima: 06:00
  - Hora máxima: 22:00

Resultado:
- Cada día a las 22:00
- Envía a turnos de mañana
- Solo turnos no confirmados
- Solo turnos entre 6am y 10pm
- No envía duplicados
```

**Caso 2: Recordatorio Manual**
```
Notificación: "Recordatorio Especial VIP"
- Ejecución: Manual
- Mensaje: "Estimado cliente VIP..."

Resultado:
- Usuario va a "Enviar Prueba"
- Selecciona 5 clientes VIP específicos
- Envía cuando quiera
```

---

## 🔧 Implementación Necesaria

### **1. Actualizar Modelo**
```typescript
// backend/src/modules/calendar/models/ConfiguracionModulo.ts
export interface NotificacionAutomatica {
  // ... campos existentes ...
  
  ejecucion?: 'automatica' | 'manual';
  
  filtros?: {
    estados?: string[];
    horaMinima?: string;
    horaMaxima?: string;
    agenteIds?: string[];
    tipoReserva?: string[];
    limite?: number;
    soloSinNotificar?: boolean;
  };
}
```

### **2. Actualizar Servicio**
```typescript
// backend/src/services/notificacionesAutomaticasService.ts
async function obtenerTurnosParaNotificacion(empresaId, notif) {
  const query: any = {
    empresaId,
    fechaInicio: { $gte: fechaInicio, $lte: fechaFin }
  };

  // ✅ Aplicar filtros
  if (notif.filtros) {
    if (notif.filtros.estados) {
      query.estado = { $in: notif.filtros.estados };
    }
    
    if (notif.filtros.soloSinNotificar) {
      query['notificaciones.enviada'] = { $ne: true };
    }
    
    if (notif.filtros.horaMinima || notif.filtros.horaMaxima) {
      // Filtrar por hora del turno
    }
  }

  const turnos = await TurnoModel.find(query).limit(notif.filtros?.limite || 1000);
  return turnos;
}
```

### **3. Actualizar Frontend**
```tsx
// Agregar sección de filtros en ConfiguracionModulo.tsx
{notif.ejecucion === 'automatica' && (
  <div className={styles.filtrosSection}>
    <h4>🔍 Filtros Avanzados</h4>
    
    <div className={styles.field}>
      <label>Estados a incluir</label>
      <MultiSelect
        options={['no_confirmado', 'pendiente', 'confirmado']}
        value={notif.filtros?.estados}
        onChange={(estados) => actualizarNotificacion(index, {
          filtros: { ...notif.filtros, estados }
        })}
      />
    </div>
    
    <label className={styles.checkbox}>
      <input
        type="checkbox"
        checked={notif.filtros?.soloSinNotificar}
        onChange={(e) => actualizarNotificacion(index, {
          filtros: { ...notif.filtros, soloSinNotificar: e.target.checked }
        })}
      />
      <span>Solo enviar a turnos que no han recibido notificación</span>
    </label>
  </div>
)}
```

---

## ✅ Resumen

**Estado Actual:**
- ❌ Envía a TODOS los turnos que cumplan condiciones básicas
- ❌ No se puede seleccionar turnos específicos automáticamente
- ❌ Puede enviar duplicados
- ✅ Funciona con "Enviar Prueba" manual

**Con Mejoras Propuestas:**
- ✅ Control granular con filtros avanzados
- ✅ Evita duplicados automáticamente
- ✅ Segmentación por estado, hora, agente, etc.
- ✅ Modo manual para casos especiales
- ✅ Totalmente automatizado

¿Quieres que implemente estas mejoras?
