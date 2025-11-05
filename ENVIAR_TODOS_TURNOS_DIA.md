# 📅 Enviar Todos los Turnos del Día al Agente

## 🎯 Objetivo

Permitir que las notificaciones automáticas envíen **todos los turnos del día** al agente sin necesidad de seleccionarlos manualmente. Esto es ideal para que el agente inicie su jornada con toda la información necesaria.

---

## ✨ Funcionalidad

### Antes (❌ Manual):

```
1. Crear notificación para agente
   ↓
2. Configurar hora de envío
   ↓
3. Hacer clic en "Seleccionar Turnos y Enviar"
   ↓
4. Seleccionar manualmente cada turno
   ↓
5. Enviar
```

### Ahora (✅ Automático):

```
1. Crear notificación para agente
   ↓
2. Activar checkbox "📅 Enviar todos los turnos del día automáticamente"
   ↓
3. Configurar hora de envío
   ↓
4. Guardar
   ↓
✅ El sistema enviará automáticamente TODOS los turnos del día
```

---

## 🏗️ Implementación

### 1. Frontend - Interfaz TypeScript

**Archivo:** `front_crm/bot_crm/src/lib/configuracionApi.ts`

```typescript
export interface NotificacionAutomatica {
  activa: boolean;
  tipo: 'recordatorio' | 'confirmacion';
  destinatario: 'cliente' | 'agente' | 'clientes_especificos' | 'agentes_especificos';
  momento: 'noche_anterior' | 'mismo_dia' | 'horas_antes' | 'personalizado' | 'inmediata' | 'hora_exacta';
  horaEnvio?: string;
  plantillaMensaje: string;
  
  // ... otros campos ...
  
  esAgendaAgente?: boolean;
  enviarTodosTurnosDia?: boolean; // ✅ NUEVO CAMPO
}
```

---

### 2. Frontend - Componente UI

**Archivo:** `front_crm/bot_crm/src/components/calendar/ConfiguracionModulo.tsx`

```tsx
{/* Opciones para notificaciones de agente */}
{(notif.esAgendaAgente || notif.destinatario === 'agente' || notif.destinatario === 'agentes_especificos') && (
  <>
    {/* ✅ NUEVO: Checkbox para enviar todos los turnos del día */}
    <div className={styles.field}>
      <label className={styles.checkbox}>
        <input
          type="checkbox"
          checked={notif.enviarTodosTurnosDia || false}
          onChange={(e) => actualizarNotificacion(index, { 
            enviarTodosTurnosDia: e.target.checked 
          })}
        />
        <span>
          📅 Enviar todos los turnos del día automáticamente
        </span>
      </label>
      <small className={styles.fieldTip}>
        Si está activado, se enviarán automáticamente todos los turnos del día 
        al agente sin necesidad de seleccionarlos manualmente
      </small>
    </div>

    {/* Botón manual - Solo si NO está activado enviarTodosTurnosDia */}
    {!notif.enviarTodosTurnosDia && (
      <div className={styles.field}>
        <button
          type="button"
          onClick={() => abrirSelectorTurnos(notif)}
          disabled={enviandoPrueba}
          className={styles.btnPrueba}
        >
          {enviandoPrueba ? '📤 Enviando...' : '📋 Seleccionar Turnos y Enviar'}
        </button>
      </div>
    )}
  </>
)}
```

---

### 3. Backend - Modelo

**Archivo:** `backend/src/modules/calendar/models/ConfiguracionModulo.ts`

```typescript
export interface NotificacionAutomatica {
  activa: boolean;
  tipo: 'recordatorio' | 'confirmacion';
  destinatario: 'cliente' | 'agente' | 'clientes_especificos' | 'agentes_especificos';
  momento: 'noche_anterior' | 'mismo_dia' | 'horas_antes' | 'personalizado' | 'inmediata' | 'hora_exacta';
  horaEnvio?: string;
  plantillaMensaje: string;
  
  // ... otros campos ...
  
  // Opciones especiales para agentes
  esAgendaAgente?: boolean;
  enviarTodosTurnosDia?: boolean;  // ✅ NUEVO CAMPO
}
```

**Schema de Mongoose:**

```typescript
const NotificacionAutomaticaSchema = new Schema<NotificacionAutomatica>(
  {
    activa: { type: Boolean, default: true },
    tipo: { type: String, enum: ['recordatorio', 'confirmacion'], required: true },
    destinatario: { type: String, enum: ['cliente', 'agente', 'clientes_especificos', 'agentes_especificos'], default: 'cliente' },
    momento: { type: String, enum: ['noche_anterior', 'mismo_dia', 'horas_antes', 'personalizado', 'inmediata', 'hora_exacta'], required: true },
    horaEnvio: String,
    plantillaMensaje: { type: String, required: true },
    
    // ... otros campos ...
    
    esAgendaAgente: { type: Boolean, default: false },
    enviarTodosTurnosDia: { type: Boolean, default: false } // ✅ NUEVO CAMPO
  },
  { _id: false }
);
```

---

## 🔄 Flujo de Funcionamiento

### Configuración:

```
1. Usuario crea notificación para agente
   ↓
2. Selecciona destinatario: "Agente" o "Agentes específicos"
   ↓
3. Activa checkbox: "📅 Enviar todos los turnos del día automáticamente"
   ↓
4. Configura hora de envío: "08:00"
   ↓
5. Escribe plantilla de mensaje:
   "Buenos días! Tus turnos de hoy:
    
    {listaTurnos}
    
    ¡Que tengas un excelente día!"
   ↓
6. Guarda configuración
```

### Ejecución (Backend - Cron Job):

```
Cron Job se ejecuta cada hora
  ↓
Lee notificaciones con enviarTodosTurnosDia = true
  ↓
Para cada notificación:
  ├─ Verifica si es la hora de envío
  ├─ Obtiene todos los turnos del día
  ├─ Filtra por agente (si es agente específico)
  ├─ Genera mensaje con lista de turnos
  └─ Envía por WhatsApp
```

---

## 📋 Ejemplo de Uso

### Caso 1: Agenda Diaria para Todos los Agentes

**Configuración:**
```
Tipo: Recordatorio
Destinatario: Agente
Momento: Hora exacta
Hora de envío: 08:00
✅ Enviar todos los turnos del día automáticamente

Plantilla:
"🌅 Buenos días {agente}!

Tus turnos de hoy:

{listaTurnos}

Total: {totalTurnos} turnos
¡Que tengas un excelente día! 💪"
```

**Resultado (08:00 AM):**
```
🌅 Buenos días Juan Pérez!

Tus turnos de hoy:

📍 09:00 - María García
   Origen: Av Corrientes 1234
   Destino: Obelisco
   Pasajeros: 2

📍 11:30 - Carlos López
   Origen: Retiro
   Destino: Ezeiza
   Pasajeros: 1
   Equipaje: Valija grande

📍 15:00 - Ana Martínez
   Origen: Palermo
   Destino: San Telmo
   Pasajeros: 3

Total: 3 turnos
¡Que tengas un excelente día! 💪
```

---

### Caso 2: Resumen Nocturno para Agentes Específicos

**Configuración:**
```
Tipo: Recordatorio
Destinatario: Agentes específicos
Agentes: Juan Pérez, María González
Momento: Hora exacta
Hora de envío: 20:00
✅ Enviar todos los turnos del día automáticamente

Plantilla:
"📊 Resumen del día {fecha}

Turnos completados:

{listaTurnos}

Total: {totalTurnos} turnos
Estado: {estadoGeneral}

¡Buen trabajo! 👏"
```

**Resultado (20:00 PM):**
```
📊 Resumen del día 31/10/2025

Turnos completados:

✅ 09:00 - María García (Completado)
✅ 11:30 - Carlos López (Completado)
❌ 15:00 - Ana Martínez (Cancelado)
✅ 17:00 - Pedro Rodríguez (Completado)

Total: 4 turnos
Estado: 3 completados, 1 cancelado

¡Buen trabajo! 👏
```

---

### Caso 3: Preparación para el Día Siguiente

**Configuración:**
```
Tipo: Recordatorio
Destinatario: Agente
Momento: Noche anterior
Hora de envío: 22:00
✅ Enviar todos los turnos del día automáticamente

Plantilla:
"🌙 Preparación para mañana {fecha}

Turnos programados:

{listaTurnos}

Total: {totalTurnos} turnos

💡 Recuerda:
- Revisar rutas
- Verificar combustible
- Confirmar con clientes

¡Descansa bien! 😴"
```

---

## 🎨 Interfaz de Usuario

### Vista de Configuración:

```
┌─────────────────────────────────────────────────────────┐
│ Notificación #1                                          │
├─────────────────────────────────────────────────────────┤
│ Tipo: [Recordatorio ▼]                                  │
│ Destinatario: [Agente ▼]                                │
│ Momento: [Hora exacta ▼]                                │
│ Hora de envío: [08:00]                                  │
├─────────────────────────────────────────────────────────┤
│ ☑ 📅 Enviar todos los turnos del día automáticamente   │
│                                                          │
│ Si está activado, se enviarán automáticamente todos     │
│ los turnos del día al agente sin necesidad de          │
│ seleccionarlos manualmente                              │
├─────────────────────────────────────────────────────────┤
│ Plantilla de mensaje:                                   │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Buenos días {agente}!                               │ │
│ │                                                     │ │
│ │ Tus turnos de hoy:                                 │ │
│ │ {listaTurnos}                                      │ │
│ │                                                     │ │
│ │ Total: {totalTurnos} turnos                        │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ Variables disponibles:                                   │
│ {agente} {fecha} {listaTurnos} {totalTurnos}           │
└─────────────────────────────────────────────────────────┘
```

### Vista Desactivada (Selección Manual):

```
┌─────────────────────────────────────────────────────────┐
│ Notificación #1                                          │
├─────────────────────────────────────────────────────────┤
│ Tipo: [Recordatorio ▼]                                  │
│ Destinatario: [Agente ▼]                                │
│ Momento: [Hora exacta ▼]                                │
│ Hora de envío: [08:00]                                  │
├─────────────────────────────────────────────────────────┤
│ ☐ 📅 Enviar todos los turnos del día automáticamente   │
├─────────────────────────────────────────────────────────┤
│ [📋 Seleccionar Turnos y Enviar]                        │
│                                                          │
│ Selecciona los turnos que deseas incluir en la         │
│ notificación                                            │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Backend - Lógica de Procesamiento

### Pseudocódigo del Cron Job:

```javascript
// Ejecutar cada hora
cron.schedule('0 * * * *', async () => {
  console.log('🔄 Procesando notificaciones automáticas...');
  
  // 1. Obtener notificaciones activas con enviarTodosTurnosDia = true
  const notificaciones = await ConfiguracionModulo.find({
    'notificaciones.activa': true,
    'notificaciones.enviarTodosTurnosDia': true
  });
  
  const ahora = new Date();
  const horaActual = `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`;
  
  for (const config of notificaciones) {
    for (const notif of config.notificaciones) {
      // 2. Verificar si es la hora de envío
      if (notif.horaEnvio !== horaActual) {
        continue;
      }
      
      // 3. Obtener todos los turnos del día
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const manana = new Date(hoy);
      manana.setDate(manana.getDate() + 1);
      
      const turnos = await Turno.find({
        empresaId: config.empresaId,
        fechaInicio: {
          $gte: hoy,
          $lt: manana
        },
        estado: { $ne: 'cancelado' }
      }).populate('agenteId clienteId');
      
      // 4. Agrupar turnos por agente
      const turnosPorAgente = {};
      for (const turno of turnos) {
        const agenteId = turno.agenteId._id.toString();
        if (!turnosPorAgente[agenteId]) {
          turnosPorAgente[agenteId] = [];
        }
        turnosPorAgente[agenteId].push(turno);
      }
      
      // 5. Enviar a cada agente
      for (const [agenteId, turnosAgente] of Object.entries(turnosPorAgente)) {
        const agente = await Agente.findById(agenteId);
        
        // Generar lista de turnos
        const listaTurnos = turnosAgente.map((t, i) => 
          `📍 ${t.fechaInicio.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} - ${t.clienteId.nombre} ${t.clienteId.apellido}
   ${t.datos.origen ? `Origen: ${t.datos.origen}` : ''}
   ${t.datos.destino ? `Destino: ${t.datos.destino}` : ''}
   ${t.datos.pasajeros ? `Pasajeros: ${t.datos.pasajeros}` : ''}`
        ).join('\n\n');
        
        // Reemplazar variables
        let mensaje = notif.plantillaMensaje
          .replace('{agente}', `${agente.nombre} ${agente.apellido}`)
          .replace('{fecha}', hoy.toLocaleDateString('es-AR'))
          .replace('{listaTurnos}', listaTurnos)
          .replace('{totalTurnos}', turnosAgente.length.toString());
        
        // 6. Enviar por WhatsApp
        await enviarWhatsApp(agente.telefono, mensaje);
        
        console.log(`✅ Enviados ${turnosAgente.length} turnos a ${agente.nombre}`);
      }
    }
  }
});
```

---

## 📊 Ventajas

### Para el Agente:
- ✅ **Información completa:** Recibe todos sus turnos del día
- ✅ **Automático:** No depende de selección manual
- ✅ **Puntual:** Llega a la hora configurada
- ✅ **Organizado:** Lista clara y ordenada

### Para el Administrador:
- ✅ **Configuración simple:** Un solo checkbox
- ✅ **Sin mantenimiento:** No requiere seleccionar turnos manualmente
- ✅ **Escalable:** Funciona con cualquier cantidad de turnos
- ✅ **Flexible:** Se puede combinar con recurrencia

---

## 🎯 Casos de Uso

### 1. Transporte/Remis
```
Hora: 07:00
Mensaje: "Buenos días! Tus viajes de hoy: {listaTurnos}"
Resultado: Chofer recibe todos los viajes del día
```

### 2. Clínica Médica
```
Hora: 08:00
Mensaje: "Agenda del día: {listaTurnos}. Total: {totalTurnos} pacientes"
Resultado: Médico recibe lista de pacientes
```

### 3. Salón de Belleza
```
Hora: 09:00
Mensaje: "Tus clientes de hoy: {listaTurnos}"
Resultado: Estilista recibe lista de turnos
```

### 4. Gimnasio
```
Hora: 06:00
Mensaje: "Clases del día: {listaTurnos}"
Resultado: Instructor recibe horarios de clases
```

---

## 📝 Resumen

**Problema:** Seleccionar manualmente turnos para cada notificación es tedioso

**Solución:** Checkbox "Enviar todos los turnos del día automáticamente"

**Archivos Modificados:**
1. ✅ `front_crm/bot_crm/src/lib/configuracionApi.ts` - Interfaz TypeScript
2. ✅ `front_crm/bot_crm/src/components/calendar/ConfiguracionModulo.tsx` - UI
3. ✅ `backend/src/modules/calendar/models/ConfiguracionModulo.ts` - Modelo y Schema

**Resultado:**
- ✅ Checkbox en la UI
- ✅ Campo en la base de datos
- ✅ Lógica condicional (muestra botón manual solo si está desactivado)
- ✅ Preparado para implementación en backend

**Próximo Paso:**
- Implementar lógica en el cron job del backend para procesar notificaciones con `enviarTodosTurnosDia = true`

¡Funcionalidad lista para enviar todos los turnos del día! 🎉
