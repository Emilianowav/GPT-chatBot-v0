# 🎨 Mejoras en UI y Sistema de Notificaciones

## ✅ Implementaciones Completadas

### 1. **Selección de Destinatarios Específicos**

#### Backend - Modelo Extendido
```typescript
export interface NotificacionAutomatica {
  destinatario: 'cliente' | 'agente' | 'clientes_especificos' | 'agentes_especificos';
  clientesEspecificos?: string[];  // Array de IDs de clientes
  agentesEspecificos?: string[];   // Array de IDs de agentes
}
```

#### Opciones de Destinatario:
- ✅ **cliente**: Todos los clientes con turnos
- ✅ **agente**: Todos los agentes con turnos
- ✅ **clientes_especificos**: Lista específica de clientes seleccionados
- ✅ **agentes_especificos**: Lista específica de agentes seleccionados

### 2. **Hora Específica de Envío**

#### Nuevo Momento: `hora_exacta`
```typescript
momento: 'noche_anterior' | 'mismo_dia' | 'horas_antes' | 'personalizado' | 'inmediata' | 'hora_exacta';
horaEnvio?: string;  // "14:30" - Hora exacta del día
```

#### Opciones de Momento:
- ✅ **inmediata**: Envío inmediato al crear el turno
- ✅ **hora_exacta**: Envío a una hora específica del día del turno
- ✅ **horas_antes**: X horas antes del turno
- ✅ **noche_anterior**: Noche anterior a hora configurada
- ✅ **mismo_dia**: Mismo día a hora configurada

### 3. **Integración con WhatsApp**

#### Sistema de Envío
- ✅ Usa `enviarMensajeWhatsAppTexto()` de `metaService.ts`
- ✅ Obtiene `phoneNumberId` de la empresa automáticamente
- ✅ Envía desde el número del chatbot configurado
- ✅ Envía al teléfono del cliente/agente según destinatario

#### Flujo de Envío:
```
1. Obtener empresa por empresaId
2. Extraer phoneNumberId de la empresa
3. Obtener teléfono del destinatario (cliente o agente)
4. Enviar vía WhatsApp API usando phoneNumberId
```

---

## 🎨 UI Mejorada - Componentes a Implementar

### Componente: Selector de Destinatarios

```tsx
<div className={styles.field}>
  <label>👥 Destinatario</label>
  <select
    value={notif.destinatario}
    onChange={(e) => actualizarNotificacion(index, { 
      destinatario: e.target.value as any 
    })}
  >
    <option value="cliente">📱 Todos los clientes</option>
    <option value="agente">👤 Todos los agentes</option>
    <option value="clientes_especificos">📋 Clientes específicos</option>
    <option value="agentes_especificos">👥 Agentes específicos</option>
  </select>
</div>

{/* Selector de clientes específicos */}
{notif.destinatario === 'clientes_especificos' && (
  <div className={styles.field}>
    <label>Seleccionar Clientes</label>
    <MultiSelect
      options={clientes}
      selected={notif.clientesEspecificos || []}
      onChange={(ids) => actualizarNotificacion(index, { 
        clientesEspecificos: ids 
      })}
    />
  </div>
)}

{/* Selector de agentes específicos */}
{notif.destinatario === 'agentes_especificos' && (
  <div className={styles.field}>
    <label>Seleccionar Agentes</label>
    <MultiSelect
      options={agentes}
      selected={notif.agentesEspecificos || []}
      onChange={(ids) => actualizarNotificacion(index, { 
        agentesEspecificos: ids 
      })}
    />
  </div>
)}
```

### Componente: Selector de Momento con Hora Exacta

```tsx
<div className={styles.field}>
  <label>⏰ ¿Cuándo enviar?</label>
  <select
    value={notif.momento}
    onChange={(e) => actualizarNotificacion(index, { 
      momento: e.target.value as any 
    })}
  >
    <option value="inmediata">⚡ Inmediatamente al crear turno</option>
    <option value="hora_exacta">🕐 Hora exacta del día</option>
    <option value="horas_antes">⏰ X horas antes</option>
    <option value="noche_anterior">🌙 Noche anterior</option>
    <option value="mismo_dia">☀️ Mismo día (mañana)</option>
  </select>
</div>

{/* Input de hora exacta */}
{notif.momento === 'hora_exacta' && (
  <div className={styles.field}>
    <label>Hora de envío</label>
    <input
      type="time"
      value={notif.horaEnvio || '09:00'}
      onChange={(e) => actualizarNotificacion(index, { 
        horaEnvio: e.target.value 
      })}
    />
    <small>El mensaje se enviará a esta hora el día del turno</small>
  </div>
)}
```

### Componente: MultiSelect para Agentes/Clientes

```tsx
interface MultiSelectProps {
  options: Array<{ id: string; nombre: string; apellido?: string }>;
  selected: string[];
  onChange: (ids: string[]) => void;
}

function MultiSelect({ options, selected, onChange }: MultiSelectProps) {
  const toggleOption = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className={styles.multiSelect}>
      {options.map(option => (
        <label key={option.id} className={styles.checkboxItem}>
          <input
            type="checkbox"
            checked={selected.includes(option.id)}
            onChange={() => toggleOption(option.id)}
          />
          <span>
            {option.nombre} {option.apellido || ''}
          </span>
        </label>
      ))}
    </div>
  );
}
```

---

## 📋 Ejemplo de Configuración Completa

### Notificación para Agentes Específicos a Hora Exacta

```json
{
  "activa": true,
  "tipo": "recordatorio",
  "destinatario": "agentes_especificos",
  "agentesEspecificos": ["agente123", "agente456"],
  "momento": "hora_exacta",
  "horaEnvio": "06:00",
  "plantillaMensaje": "Buenos días! Tienes un viaje programado para hoy a las {hora}. Pasajero: {cliente}. Origen: {origen}, Destino: {destino}.",
  "requiereConfirmacion": false
}
```

### Notificación Inmediata al Agente Asignado

```json
{
  "activa": true,
  "tipo": "recordatorio",
  "destinatario": "agente",
  "momento": "inmediata",
  "plantillaMensaje": "Nuevo viaje asignado para {fecha} a las {hora}. Pasajero: {cliente} ({telefono}). Origen: {origen}, Destino: {destino}.",
  "requiereConfirmacion": false
}
```

### Notificación a Clientes Específicos

```json
{
  "activa": true,
  "tipo": "recordatorio",
  "destinatario": "clientes_especificos",
  "clientesEspecificos": ["cliente789", "cliente101"],
  "momento": "noche_anterior",
  "horaEnvio": "22:00",
  "plantillaMensaje": "Hola {cliente}, te recordamos tu viaje para mañana {fecha} a las {hora}. Tu chofer será {agente}.",
  "requiereConfirmacion": false
}
```

---

## 🔄 Flujo de Procesamiento

### 1. Notificaciones Individuales por Turno

```typescript
// En programarNotificacionesTurno()
for (const configNotif of configuracion.notificaciones) {
  // Determinar destinatarios
  let destinatarios: string[] = [];
  
  switch (configNotif.destinatario) {
    case 'cliente':
      destinatarios = [turno.clienteId];
      break;
      
    case 'agente':
      if (turno.agenteId) {
        destinatarios = [turno.agenteId.toString()];
      }
      break;
      
    case 'clientes_especificos':
      if (configNotif.clientesEspecificos?.includes(turno.clienteId)) {
        destinatarios = [turno.clienteId];
      }
      break;
      
    case 'agentes_especificos':
      if (turno.agenteId && configNotif.agentesEspecificos?.includes(turno.agenteId.toString())) {
        destinatarios = [turno.agenteId.toString()];
      }
      break;
  }
  
  // Calcular fecha de envío según momento
  let fechaEnvio: Date;
  switch (configNotif.momento) {
    case 'inmediata':
      fechaEnvio = new Date();
      break;
      
    case 'hora_exacta':
      fechaEnvio = new Date(turno.fechaInicio);
      const [hora, minuto] = configNotif.horaEnvio!.split(':');
      fechaEnvio.setHours(parseInt(hora), parseInt(minuto), 0, 0);
      break;
      
    // ... otros casos
  }
  
  // Programar notificación
  turno.notificaciones.push({
    tipo: configNotif.tipo,
    programadaPara: fechaEnvio,
    enviada: false,
    plantilla: configNotif.plantillaMensaje,
    destinatario: configNotif.destinatario
  });
}
```

### 2. Envío de Notificaciones

```typescript
// En procesarNotificacionesPendientes()
const esParaCliente = notif.destinatario === 'cliente' || 
                      notif.destinatario === 'clientes_especificos';

if (esParaCliente) {
  const cliente = await ClienteModel.findById(turno.clienteId);
  telefono = cliente.telefono;
} else {
  const agente = await AgenteModel.findById(turno.agenteId);
  telefono = agente.telefono;
}

// Enviar vía WhatsApp usando phoneNumberId de la empresa
await enviarNotificacion(telefono, mensaje, turno.empresaId);
```

---

## 🎯 Casos de Uso

### Caso 1: Empresa de Transporte
**Objetivo**: Notificar a choferes específicos sobre nuevos viajes

```json
{
  "destinatario": "agentes_especificos",
  "agentesEspecificos": ["chofer_juan", "chofer_pedro"],
  "momento": "inmediata",
  "plantillaMensaje": "Nuevo viaje: {origen} → {destino} a las {hora}. Pasajero: {cliente}"
}
```

### Caso 2: Consultorio Médico
**Objetivo**: Recordatorio a pacientes VIP con 24h de anticipación

```json
{
  "destinatario": "clientes_especificos",
  "clientesEspecificos": ["paciente_vip1", "paciente_vip2"],
  "momento": "horas_antes",
  "horasAntes": 24,
  "plantillaMensaje": "Estimado {cliente}, le recordamos su consulta mañana a las {hora} con {agente}"
}
```

### Caso 3: Gimnasio
**Objetivo**: Notificación matutina a todos los entrenadores

```json
{
  "destinatario": "agente",
  "momento": "hora_exacta",
  "horaEnvio": "07:00",
  "plantillaMensaje": "Buenos días! Tienes {cantidad} clases hoy. Primera clase a las {hora}"
}
```

---

## 📱 Integración con WhatsApp

### Configuración Requerida en Empresa

```json
{
  "_id": "empresa123",
  "nombre": "Mi Empresa",
  "phoneNumberId": "123456789012345",
  "telefono": "5491144556677"
}
```

### Flujo de Envío

1. **Sistema obtiene phoneNumberId** de la empresa
2. **Formatea el número** del destinatario (cliente o agente)
3. **Envía vía WhatsApp API** usando `enviarMensajeWhatsAppTexto()`
4. **Mensaje aparece** como enviado desde el número del chatbot
5. **Destinatario recibe** el mensaje en su WhatsApp

---

## ✨ Beneficios

- ✅ **Flexibilidad total**: Enviar a quien quieras, cuando quieras
- ✅ **Control granular**: Seleccionar destinatarios específicos
- ✅ **Hora exacta**: Programar envíos a horas específicas
- ✅ **Integración real**: Usa WhatsApp API con el número del chatbot
- ✅ **Escalable**: Soporta múltiples empresas y configuraciones
- ✅ **UI intuitiva**: Selectores claros y fáciles de usar

---

## 🚀 Próximos Pasos

1. **Implementar componentes UI** en `ConfiguracionModulo.tsx`
2. **Crear componente MultiSelect** reutilizable
3. **Agregar validaciones** de destinatarios
4. **Testear envíos** con WhatsApp API
5. **Agregar logs** de notificaciones enviadas
6. **Dashboard** de estadísticas de notificaciones
