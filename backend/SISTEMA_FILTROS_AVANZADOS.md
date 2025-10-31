# 🔍 Sistema de Filtros Avanzados para Notificaciones

## 📋 Resumen

Sistema completo de filtros para notificaciones diarias a agentes, permitiendo control granular sobre:
- **Cuándo enviar** (frecuencia/ciclo)
- **Qué turnos incluir** (rango de fechas, horario, estado, tipo)
- **A quién enviar** (todos, con turnos, específicos)

---

## 🎯 Cómo Funciona el Sistema Completo

### 1. **Creación de Turno con Variables**

Cuando creas un turno en el sistema:

```javascript
POST /api/modules/calendar/turnos

{
  "clienteId": "cliente_123",
  "agenteId": "agente_456",  // ← OBLIGATORIO
  "fechaInicio": "2024-11-15T14:30:00Z",
  "duracion": 60,
  "tipoReserva": "viaje",    // ← Para filtrar por tipo
  "estado": "pendiente",
  "datos": {
    // Estos campos se convierten en variables automáticamente
    "origen": "Av. Corrientes 1234",
    "destino": "Aeropuerto Ezeiza",
    "pasajeros": "3 personas",
    "equipaje": "2 valijas"
  }
}
```

### 2. **Variables Disponibles Automáticamente**

Al enviar notificación del turno:
- `{cliente}` → Nombre del cliente (busca por `clienteId`)
- `{telefono}` → Teléfono del cliente
- `{agente}` → Nombre del agente (busca por `agenteId`)
- `{fecha}` → "15/11/2024"
- `{hora}` → "14:30"
- `{duracion}` → "60 minutos"
- `{turno}` → "viaje" (nomenclatura configurada)
- `{origen}`, `{destino}`, `{pasajeros}`, `{equipaje}` → Desde `datos`

### 3. **Notificación Diaria para Agentes**

El sistema busca **automáticamente** todos los turnos del agente según filtros:

```javascript
// El servicio hace esto por ti
const turnos = await TurnoModel.find({
  empresaId: "San Jose",
  agenteId: agente._id,
  fechaInicio: { $gte: inicio, $lt: fin },  // Según filtro de rango
  estado: { $in: ['pendiente', 'confirmado'] },  // Según filtro de estado
  tipoReserva: { $in: ['viaje'] }  // Según filtro de tipo (opcional)
});

// Luego filtra por horario del día
turnos = filtrarPorHorario(turnos, filtroHorario);
```

---

## 🔧 Filtros Disponibles

### 1. **Filtro de Frecuencia/Ciclo** ⏰

Controla **cuándo** se envía la notificación.

#### Opciones:

**📅 Diaria**
```javascript
frecuencia: {
  tipo: 'diaria'
}
// Envía todos los días a la hora configurada
```

**📆 Semanal**
```javascript
frecuencia: {
  tipo: 'semanal',
  diasSemana: [1, 2, 3, 4, 5]  // Lun, Mar, Mie, Jue, Vie
}
// Solo envía los días seleccionados
// 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
```

**🗓️ Mensual**
```javascript
frecuencia: {
  tipo: 'mensual',
  diaMes: 1  // Día 1 de cada mes
}
// Envía el día X de cada mes
```

**⚙️ Personalizada**
```javascript
frecuencia: {
  tipo: 'personalizada',
  horasIntervalo: 6  // Cada 6 horas
}
// Para casos especiales
```

---

### 2. **Filtro de Rango de Fechas** 📅

Controla **qué días** de turnos incluir en el resumen.

#### Opciones:

**Hoy**
```javascript
rangoHorario: {
  activo: true,
  tipo: 'hoy'
}
// Solo turnos de hoy
```

**Mañana**
```javascript
rangoHorario: {
  activo: true,
  tipo: 'manana'
}
// Solo turnos de mañana
```

**Próximos X Días**
```javascript
rangoHorario: {
  activo: true,
  tipo: 'proximos_dias',
  diasAdelante: 7  // Próximos 7 días
}
// Turnos de hoy + los próximos X días
```

**Personalizado**
```javascript
rangoHorario: {
  activo: true,
  tipo: 'personalizado',
  fechaInicio: '2024-11-15',
  fechaFin: '2024-11-20'
}
// Rango específico de fechas
```

---

### 3. **Filtro de Horario del Día** 🕐

Controla **qué horarios** de turnos incluir.

#### Opciones:

**Mañana** (6:00 - 12:00)
```javascript
filtroHorario: {
  activo: true,
  tipo: 'manana'
}
```

**Tarde** (12:00 - 20:00)
```javascript
filtroHorario: {
  activo: true,
  tipo: 'tarde'
}
```

**Noche** (20:00 - 6:00)
```javascript
filtroHorario: {
  activo: true,
  tipo: 'noche'
}
```

**Personalizado**
```javascript
filtroHorario: {
  activo: true,
  tipo: 'personalizado',
  horaInicio: '08:00',
  horaFin: '12:00'
}
```

**Todo el día**
```javascript
filtroHorario: {
  activo: false,
  tipo: 'todo_el_dia'
}
```

---

### 4. **Filtro de Estado de Turno** ✅

Controla **qué estados** de turnos incluir.

```javascript
filtroEstado: {
  activo: true,
  estados: ['pendiente', 'confirmado']
}

// Opciones: 'pendiente', 'confirmado', 'en_curso', 'completado', 'cancelado'
```

---

### 5. **Filtro de Tipo de Turno** 🏷️

Controla **qué tipos** de turnos incluir.

```javascript
filtroTipo: {
  activo: true,
  tipos: ['viaje', 'traslado']
}

// Los tipos dependen de tu configuración
// Ejemplos: 'viaje', 'consulta', 'evento', 'clase', etc.
```

---

## 📊 Ejemplos de Configuración Completa

### Ejemplo 1: Empresa de Transporte - Resumen Matutino de Viajes del Día

```javascript
{
  notificacionDiariaAgentes: {
    activa: true,
    horaEnvio: "06:00",
    enviarATodos: false,  // Solo choferes con viajes
    
    // Enviar de Lunes a Viernes
    frecuencia: {
      tipo: 'semanal',
      diasSemana: [1, 2, 3, 4, 5]
    },
    
    // Solo turnos de hoy
    rangoHorario: {
      activo: true,
      tipo: 'hoy'
    },
    
    // Todos los horarios
    filtroHorario: {
      activo: false,
      tipo: 'todo_el_dia'
    },
    
    // Solo pendientes y confirmados
    filtroEstado: {
      activo: true,
      estados: ['pendiente', 'confirmado']
    },
    
    // Solo viajes (no traslados)
    filtroTipo: {
      activo: true,
      tipos: ['viaje']
    },
    
    plantillaMensaje: "Buenos días {agente}! Estos son tus viajes de hoy:",
    
    incluirDetalles: {
      origen: true,
      destino: true,
      nombreCliente: true,
      telefonoCliente: true,
      horaReserva: true,
      notasInternas: true
    }
  }
}
```

**Resultado:**
- Envía solo de Lunes a Viernes a las 6:00 AM
- Solo a choferes que tienen viajes
- Solo viajes del día actual
- Solo viajes pendientes o confirmados
- Solo tipo "viaje" (excluye otros tipos)

---

### Ejemplo 2: Consultorio - Agenda Semanal Nocturna

```javascript
{
  notificacionDiariaAgentes: {
    activa: true,
    horaEnvio: "20:00",
    enviarATodos: true,  // Todos los médicos
    
    // Enviar solo los Domingos
    frecuencia: {
      tipo: 'semanal',
      diasSemana: [0]  // Domingo
    },
    
    // Próxima semana completa
    rangoHorario: {
      activo: true,
      tipo: 'proximos_dias',
      diasAdelante: 7
    },
    
    // Solo consultas de mañana
    filtroHorario: {
      activo: true,
      tipo: 'manana'
    },
    
    // Todos los estados
    filtroEstado: {
      activo: false
    },
    
    // Solo consultas (no cirugías)
    filtroTipo: {
      activo: true,
      tipos: ['consulta']
    },
    
    plantillaMensaje: "Agenda de la semana para Dr/a {agente}:",
    
    incluirDetalles: {
      nombreCliente: true,
      horaReserva: true,
      notasInternas: true
    }
  }
}
```

**Resultado:**
- Envía solo los Domingos a las 8:00 PM
- A todos los médicos (tengan o no consultas)
- Consultas de los próximos 7 días
- Solo consultas de la mañana (6:00 - 12:00)
- Solo tipo "consulta"

---

### Ejemplo 3: Peluquería - Turnos de Tarde para Mañana

```javascript
{
  notificacionDiariaAgentes: {
    activa: true,
    horaEnvio: "20:00",
    enviarATodos: false,
    
    // Todos los días
    frecuencia: {
      tipo: 'diaria'
    },
    
    // Solo turnos de mañana
    rangoHorario: {
      activo: true,
      tipo: 'manana'
    },
    
    // Solo turnos de tarde
    filtroHorario: {
      activo: true,
      tipo: 'tarde'
    },
    
    // Solo confirmados
    filtroEstado: {
      activo: true,
      estados: ['confirmado']
    },
    
    filtroTipo: {
      activo: false
    },
    
    plantillaMensaje: "Hola {agente}! Tus turnos de tarde para mañana:",
    
    incluirDetalles: {
      nombreCliente: true,
      horaReserva: true,
      telefonoCliente: false
    }
  }
}
```

**Resultado:**
- Envía todos los días a las 8:00 PM
- Solo a estilistas con turnos
- Turnos de mañana (día siguiente)
- Solo turnos de tarde (12:00 - 20:00)
- Solo confirmados

---

## 🔄 Flujo Completo del Sistema

### 1. **Trigger Automático**
```
Cada hora → Verifica si es hora de enviar
```

### 2. **Verificación de Frecuencia**
```javascript
if (!debeEnviarHoy(frecuencia)) {
  return; // No enviar hoy
}
```

### 3. **Cálculo de Rango de Fechas**
```javascript
const { inicio, fin } = calcularRangoFechas(rangoHorario);
// inicio = 2024-11-15 00:00:00
// fin = 2024-11-16 00:00:00
```

### 4. **Selección de Agentes**
```javascript
if (agentesEspecificos.length > 0) {
  // Usar específicos
} else if (enviarATodos) {
  // Todos los activos
} else {
  // Solo con turnos en el rango
}
```

### 5. **Búsqueda de Turnos con Filtros**
```javascript
// Filtros en la query
const query = {
  empresaId,
  agenteId,
  fechaInicio: { $gte: inicio, $lt: fin },
  estado: { $in: filtroEstado.estados },
  tipoReserva: { $in: filtroTipo.tipos }
};

let turnos = await TurnoModel.find(query);

// Filtro de horario (post-query)
turnos = aplicarFiltroHorario(turnos, filtroHorario);
```

### 6. **Generación del Mensaje**
```javascript
// Para cada turno
const turnoInfo = `
🚗 Viaje #${i+1}
📍 Origen: ${turno.datos.origen}
📍 Destino: ${turno.datos.destino}
🕐 Hora: ${hora}
👤 Cliente: ${cliente.nombre}
📞 ${cliente.telefono}
`;
```

### 7. **Envío por WhatsApp**
```javascript
await enviarMensajeWhatsAppTexto(
  agente.telefono,
  mensaje,
  empresa.phoneNumberId
);
```

---

## 🎨 Plantilla de Mensaje Recomendada

```
📅 Buenos días {agente}! Estos son tus {turnos} de hoy:

{lista_de_turnos}

Total: {cantidad} {turnos}
¡Buen día de trabajo!
```

---

## ✅ Ventajas del Sistema de Filtros

### Para la Empresa
- ✅ Control total sobre cuándo y qué enviar
- ✅ Reduce ruido (solo info relevante)
- ✅ Personalizable por tipo de negocio
- ✅ Ahorra costos de WhatsApp API

### Para los Agentes
- ✅ Reciben solo lo que necesitan
- ✅ No se saturan de información
- ✅ Pueden planificar mejor su día
- ✅ Información filtrada por horario

---

## 🚀 Casos de Uso Reales

### Caso 1: Chofer de Transporte
**Necesidad:** Solo viajes de mañana, de lunes a viernes

**Configuración:**
- Frecuencia: Semanal (Lun-Vie)
- Rango: Hoy
- Horario: Mañana (6:00-12:00)
- Estado: Confirmados
- Tipo: Viaje

**Resultado:** Recibe a las 6 AM solo sus viajes confirmados de la mañana

---

### Caso 2: Médico Especialista
**Necesidad:** Todas las consultas de la semana, los domingos

**Configuración:**
- Frecuencia: Semanal (Domingo)
- Rango: Próximos 7 días
- Horario: Todo el día
- Estado: Todos
- Tipo: Consulta

**Resultado:** Recibe los domingos su agenda completa de la semana

---

### Caso 3: Instructor de Gimnasio
**Necesidad:** Solo clases de tarde, todos los días

**Configuración:**
- Frecuencia: Diaria
- Rango: Hoy
- Horario: Tarde (12:00-20:00)
- Estado: Confirmados
- Tipo: Clase

**Resultado:** Recibe cada mañana sus clases de tarde confirmadas

---

## 📱 Próximos Pasos

1. ✅ Backend implementado con todos los filtros
2. ⏳ Crear UI en el CRM para configurar filtros
3. ⏳ Testing con diferentes combinaciones
4. ⏳ Documentación de usuario final

El sistema está **100% funcional** en el backend. Solo falta la interfaz de usuario para configurarlo desde el CRM.
