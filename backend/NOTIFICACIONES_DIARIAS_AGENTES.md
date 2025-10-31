# 📅 Sistema de Notificaciones Diarias para Agentes

## 🎯 Funcionalidad

El sistema envía automáticamente a cada agente un resumen de sus turnos/viajes asignados, con filtros configurables de rango horario.

---

## ✅ Implementaciones Completadas

### 1. **Agente Obligatorio en Turnos**
- ✅ Campo `agenteId` ahora es **obligatorio** en el modelo `Turno`
- ✅ Todos los turnos deben tener un agente asignado
- ✅ Garantiza que cada turno tenga responsable

### 2. **Filtros de Rango Horario**
Configurables para determinar qué turnos incluir en la notificación:

#### Tipos de Filtro:
- **📅 Hoy**: Solo turnos del día actual
- **🌅 Mañana**: Solo turnos del día siguiente
- **📆 Próximos X días**: Turnos de los próximos 1, 2, 7 días, etc.
- **🗓️ Personalizado**: Rango de fechas específico (inicio - fin)

### 3. **Selección de Agentes**
Tres modos de envío:
- **Todos los agentes**: Envía a todos los agentes activos (incluso sin turnos)
- **Solo agentes con turnos**: Envía solo a agentes que tienen turnos en el rango
- **Agentes específicos**: Envía solo a agentes seleccionados manualmente

---

## 📋 Estructura de Datos

### Configuración en MongoDB

```typescript
{
  notificacionDiariaAgentes: {
    activa: true,
    horaEnvio: "06:00",              // Hora de envío diario
    enviarATodos: false,             // false = solo agentes con turnos
    
    // Filtro de rango horario
    rangoHorario: {
      activo: true,
      tipo: "proximos_dias",         // hoy | manana | proximos_dias | personalizado
      diasAdelante: 1,               // Para tipo "proximos_dias"
      fechaInicio: "2024-11-15",     // Para tipo "personalizado"
      fechaFin: "2024-11-20"         // Para tipo "personalizado"
    },
    
    // Plantilla del mensaje
    plantillaMensaje: "Buenos días {agente}! Estos son tus {turnos} de hoy:",
    
    // Qué detalles incluir en cada turno
    incluirDetalles: {
      origen: true,
      destino: true,
      nombreCliente: true,
      telefonoCliente: false,
      horaReserva: true,
      notasInternas: false
    },
    
    // Agentes específicos (opcional)
    agentesEspecificos: ["agente_id_1", "agente_id_2"]
  }
}
```

---

## 🔄 Flujo de Funcionamiento

### 1. **Trigger Automático**
El servicio se ejecuta cada hora (configurado en `server.ts`):
```typescript
setInterval(enviarNotificacionesDiariasAgentes, 60 * 60 * 1000); // Cada hora
```

### 2. **Verificación de Hora**
Compara la hora actual con `horaEnvio` configurada (ej: "06:00")

### 3. **Cálculo de Rango de Fechas**
Según el filtro configurado:
```typescript
// Ejemplo: "proximos_dias" con diasAdelante = 1
inicio = hoy 00:00:00
fin = hoy + 1 día 23:59:59
```

### 4. **Selección de Agentes**
```typescript
if (agentesEspecificos.length > 0) {
  // Usar solo agentes específicos
} else if (enviarATodos) {
  // Todos los agentes activos
} else {
  // Solo agentes con turnos en el rango
}
```

### 5. **Búsqueda de Turnos por Agente**
```typescript
const turnos = await TurnoModel.find({
  empresaId,
  agenteId: agente._id,
  fechaInicio: { $gte: inicio, $lt: fin },
  estado: { $in: ['pendiente', 'confirmado'] }
}).populate('clienteId');
```

### 6. **Generación del Mensaje**
```
📅 Buenos días María! Estos son tus viajes de hoy:

🚗 Viaje #1
📍 Origen: Av. Corrientes 1234
📍 Destino: Aeropuerto Ezeiza
🕐 Hora: 14:30
👤 Cliente: Juan Pérez

🚗 Viaje #2
📍 Origen: Microcentro
📍 Destino: Palermo
🕐 Hora: 18:00
👤 Cliente: Ana García

Total: 2 viajes
```

### 7. **Envío por WhatsApp**
Usa el mismo sistema de `enviarMensajeWhatsAppTexto()` con el `phoneNumberId` de la empresa

---

## 📊 Ejemplos de Uso

### Ejemplo 1: Empresa de Transporte - Resumen Diario
```javascript
{
  activa: true,
  horaEnvio: "06:00",
  enviarATodos: false,  // Solo choferes con viajes
  rangoHorario: {
    activo: true,
    tipo: "hoy"
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
```

### Ejemplo 2: Consultorio - Agenda Semanal
```javascript
{
  activa: true,
  horaEnvio: "08:00",
  enviarATodos: true,  // Todos los médicos
  rangoHorario: {
    activo: true,
    tipo: "proximos_dias",
    diasAdelante: 7  // Próxima semana
  },
  plantillaMensaje: "Agenda de la semana para Dr/a {agente}:",
  incluirDetalles: {
    nombreCliente: true,
    horaReserva: true,
    notasInternas: true
  }
}
```

### Ejemplo 3: Peluquería - Solo Mañana
```javascript
{
  activa: true,
  horaEnvio: "20:00",  // Noche anterior
  enviarATodos: false,
  rangoHorario: {
    activo: true,
    tipo: "manana"  // Solo turnos de mañana
  },
  plantillaMensaje: "Hola {agente}! Tus turnos para mañana:",
  incluirDetalles: {
    nombreCliente: true,
    horaReserva: true,
    telefonoCliente: false
  }
}
```

---

## 🔧 Configuración en el CRM

### Paso 1: Acceder a Configuración
1. Dashboard → Calendario → Configuración
2. Tab "Notificaciones"
3. Sección "Notificación Diaria para Agentes"

### Paso 2: Activar y Configurar
```
✅ Activar notificación diaria

⏰ Hora de envío: [06:00]

👥 Enviar a:
   ○ Todos los agentes
   ● Solo agentes con turnos
   ○ Agentes específicos: [Seleccionar...]

📅 Rango de turnos:
   ✅ Usar filtro de rango
   
   Tipo: [Próximos días ▼]
   Días adelante: [1]

📝 Mensaje:
   [Buenos días {agente}! Estos son tus {turnos} de hoy:]

✅ Incluir detalles:
   ✅ Origen
   ✅ Destino
   ✅ Nombre del cliente
   ☐ Teléfono del cliente
   ✅ Hora de reserva
   ☐ Notas internas
```

### Paso 3: Guardar
Click en "Guardar Configuración"

---

## 🧪 Testing

### Test Manual
1. Configura la notificación con `horaEnvio` en 5 minutos
2. Crea turnos de prueba para un agente
3. Espera a que se ejecute el servicio
4. Verifica que el agente reciba el WhatsApp

### Logs a Verificar
```
📅 Procesando notificaciones diarias para agentes...
📋 Encontradas 1 empresas con notificaciones diarias activas
📅 Rango de fechas: 2024-11-15T00:00:00.000Z - 2024-11-16T00:00:00.000Z
📤 Enviando notificaciones a 3 agentes de empresa San Jose
📤 Enviando notificación diaria a agente: María González
📋 Encontrados 2 turnos para el agente
📨 Enviando mensaje vía Meta WhatsApp API...
✅ Mensaje enviado
```

---

## 🚀 Ventajas del Sistema

### Para Agentes
- ✅ Reciben automáticamente su agenda del día
- ✅ No necesitan entrar al CRM para ver sus turnos
- ✅ Pueden planificar su día desde temprano
- ✅ Tienen toda la información necesaria (origen, destino, cliente, etc.)

### Para la Empresa
- ✅ Reduce consultas de agentes sobre su agenda
- ✅ Mejora la organización y puntualidad
- ✅ Disminuye errores por falta de información
- ✅ Aumenta la satisfacción de agentes y clientes

### Flexibilidad
- ✅ Configurable por empresa
- ✅ Filtros de rango horario adaptables
- ✅ Selección de agentes específicos
- ✅ Personalización de mensaje y detalles
- ✅ Horario de envío configurable

---

## 📱 Formato del Mensaje Enviado

### Plantilla Base
```
{plantillaMensaje}

{turno_emoji} {nomenclatura.turno} #{numero}
{detalles según configuración}

Total: {cantidad} {nomenclatura.turnos}
```

### Ejemplo Real (Empresa de Transporte)
```
📅 Buenos días María! Estos son tus viajes de hoy:

🚗 Viaje #1
📍 Origen: Av. Corrientes 1234
📍 Destino: Aeropuerto Ezeiza
🕐 Hora: 14:30
👤 Cliente: Juan Pérez
📞 Teléfono: +5491144556677

🚗 Viaje #2
📍 Origen: Microcentro
📍 Destino: Palermo
🕐 Hora: 18:00
👤 Cliente: Ana García
📞 Teléfono: +5491155667788

Total: 2 viajes
¡Buen día de trabajo!
```

---

## 🔐 Seguridad

- ✅ Solo se envía a agentes activos
- ✅ Solo turnos confirmados o pendientes
- ✅ Respeta permisos de la empresa
- ✅ Usa el `phoneNumberId` correcto de cada empresa
- ✅ Logs detallados para auditoría

---

## 🔄 Próximas Mejoras

- [ ] Botón "Confirmar todos los turnos" en el mensaje
- [ ] Resumen estadístico (km totales, ingresos estimados)
- [ ] Notificación de cambios en turnos ya notificados
- [ ] Integración con Google Calendar
- [ ] Exportar agenda a PDF
