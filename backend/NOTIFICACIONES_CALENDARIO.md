# 📅 Sistema de Notificaciones del Módulo de Calendario

## 🎯 Descripción General

El sistema de notificaciones del módulo de calendario permite enviar mensajes automáticos tanto a **clientes** como a **agentes**, de forma individual o grupal, relacionados directamente con las reservas/turnos.

---

## ✨ Funcionalidades Implementadas

### 1. **Notificaciones a Clientes** (Existente - Mejorado)
- ✅ Recordatorios de turnos próximos
- ✅ Solicitudes de confirmación
- ✅ Notificaciones personalizables con variables dinámicas
- ✅ Programación flexible (noche anterior, mismo día, X horas antes)

### 2. **Notificaciones a Agentes** (NUEVO)
- ✅ Notificación inmediata cuando se crea una reserva
- ✅ Notificaciones individuales por turno
- ✅ Resumen diario de turnos del día
- ✅ Configuración de detalles a incluir (origen, destino, cliente, teléfono, etc.)

### 3. **Notificaciones Diarias para Agentes** (NUEVO)
- ✅ Envío automático a una hora configurada (ej: 6:00 AM)
- ✅ Listado de todos los turnos/viajes del día
- ✅ Detalles configurables por empresa:
  - Origen
  - Destino
  - Nombre del cliente
  - Teléfono del cliente
  - Hora de búsqueda/reserva
  - Notas internas

---

## 🔧 Configuración

### Modelo de Datos

#### `NotificacionAutomatica`
```typescript
{
  activa: boolean;
  tipo: 'recordatorio' | 'confirmacion';
  destinatario: 'cliente' | 'agente';  // NUEVO
  momento: 'noche_anterior' | 'mismo_dia' | 'horas_antes' | 'personalizado' | 'inmediata';  // 'inmediata' es NUEVO
  horaEnvio?: string;
  horasAntes?: number;
  plantillaMensaje: string;
  requiereConfirmacion: boolean;
}
```

#### `NotificacionDiariaAgentes` (NUEVO)
```typescript
{
  activa: boolean;
  horaEnvio: string;  // "06:00"
  enviarATodos: boolean;  // true = todos los agentes, false = solo con turnos
  plantillaMensaje: string;
  incluirDetalles: {
    origen: boolean;
    destino: boolean;
    nombreCliente: boolean;
    telefonoCliente: boolean;
    horaReserva: boolean;
    notasInternas: boolean;
  };
}
```

### Ejemplo de Configuración para Empresa de Transporte

```javascript
{
  empresaId: "empresa123",
  nomenclatura: {
    turno: "Viaje",
    turnos: "Viajes",
    agente: "Chofer",
    agentes: "Choferes",
    cliente: "Pasajero",
    clientes: "Pasajeros"
  },
  
  // Notificaciones individuales por turno
  notificaciones: [
    {
      activa: true,
      tipo: "recordatorio",
      destinatario: "cliente",
      momento: "noche_anterior",
      horaEnvio: "22:00",
      plantillaMensaje: "Hola {cliente}, te recordamos tu viaje para mañana {fecha} a las {hora}. Origen: {origen}, Destino: {destino}. Tu chofer será {agente}.",
      requiereConfirmacion: false
    },
    {
      activa: true,
      tipo: "recordatorio",
      destinatario: "agente",
      momento: "inmediata",
      plantillaMensaje: "Nuevo viaje asignado para {fecha} a las {hora}. Pasajero: {cliente} ({telefono}). Origen: {origen}, Destino: {destino}.",
      requiereConfirmacion: false
    }
  ],
  
  // Resumen diario para agentes
  notificacionDiariaAgentes: {
    activa: true,
    horaEnvio: "06:00",
    enviarATodos: false,  // Solo a choferes con viajes
    plantillaMensaje: "Buenos días! Estos son tus {turnos} de hoy:",
    incluirDetalles: {
      origen: true,
      destino: true,
      nombreCliente: true,
      telefonoCliente: true,
      horaReserva: true,
      notasInternas: false
    }
  }
}
```

---

## 📱 Ejemplo de Mensajes

### Notificación Diaria al Chofer (6:00 AM)
```
Buenos días! Estos son tus viajes de hoy:

📋 *3 Viajes:*

1. 🕐 08:00
   Juan Pérez
   📞 +54 9 11 1234-5678
   📍 Origen: Av. Corrientes 1234
   🎯 Destino: Aeropuerto Ezeiza

2. 🕐 14:30
   María González
   📞 +54 9 11 8765-4321
   📍 Origen: Belgrano 567
   🎯 Destino: Retiro

3. 🕐 18:00
   Carlos López
   📞 +54 9 11 5555-6666
   📍 Origen: Palermo 890
   🎯 Destino: San Telmo

¡Que tengas un excelente día! 💪
```

### Notificación Inmediata al Chofer (cuando se crea reserva)
```
Nuevo viaje asignado para 15/11/2024 a las 14:30. 
Pasajero: Juan Pérez (+54 9 11 1234-5678). 
Origen: Av. Corrientes 1234
Destino: Aeropuerto Ezeiza
```

### Recordatorio al Cliente (noche anterior)
```
Hola Juan, te recordamos tu viaje para mañana 15/11/2024 a las 14:30. 
Origen: Av. Corrientes 1234
Destino: Aeropuerto Ezeiza
Tu chofer será Roberto García.
```

---

## 🔄 Flujo Completo

### Flujo de Reserva desde Chatbot

1. **Cliente inicia conversación** por WhatsApp
2. **Bot guía al cliente** a través del flujo:
   - Selecciona fecha
   - Selecciona hora
   - Ingresa origen
   - Ingresa destino
   - Confirma datos
3. **Se crea la reserva** en el backend
4. **Notificaciones automáticas**:
   - ✅ Confirmación inmediata al cliente
   - ✅ Notificación inmediata al chofer asignado
   - ✅ Se programan recordatorios para ambos
5. **Al día siguiente a las 6:00 AM**:
   - ✅ El chofer recibe resumen con todos sus viajes del día

---

## 🛠️ Archivos Modificados/Creados

### Modelos
- ✅ `ConfiguracionModulo.ts` - Extendido con soporte para notificaciones a agentes

### Servicios
- ✅ `notificacionesService.ts` - Actualizado para soportar destinatario 'agente'
- ✅ `notificacionesDiariasAgentes.ts` - NUEVO servicio para resúmenes diarios
- ✅ `turnoService.ts` - Actualizado para usar datos dinámicos

### Controladores
- ✅ `turnoController.ts` - Ya integrado con programación de notificaciones
- ✅ `botTurnosService.ts` - Crea reservas desde chatbot

---

## 📋 Variables Disponibles en Plantillas

### Variables Básicas
- `{fecha}` - Fecha del turno (formato: DD/MM/YYYY)
- `{hora}` - Hora del turno (formato: HH:MM)
- `{duracion}` - Duración en minutos
- `{turno}` - Nomenclatura del turno (ej: "viaje", "reserva")
- `{turnos}` - Nomenclatura plural (ej: "viajes", "reservas")

### Variables de Cliente
- `{cliente}` - Nombre completo del cliente
- `{telefono}` - Teléfono del cliente

### Variables de Agente
- `{agente}` - Nombre completo del agente

### Variables Dinámicas (según configuración)
- `{origen}` - Origen del viaje
- `{destino}` - Destino del viaje
- `{pasajeros}` - Cantidad de pasajeros
- `{vehiculo}` - Tipo de vehículo
- ... cualquier campo personalizado configurado

---

## 🚀 Próximos Pasos

### Para Activar el Sistema Completo:

1. **Instalar node-cron**:
   ```bash
   npm install node-cron
   npm install @types/node-cron --save-dev
   ```

2. **Descomentar código de cron** en `notificacionesService.ts`:
   ```typescript
   import cron from 'node-cron';
   
   // Ejecutar cada 5 minutos para notificaciones generales
   cron.schedule('*/5 * * * *', async () => {
     await procesarNotificacionesPendientes();
   });
   
   // Ejecutar a las 6:00 AM para notificaciones diarias
   cron.schedule('0 6 * * *', async () => {
     await enviarNotificacionesDiariasAgentes();
   });
   ```

3. **Integrar con API de WhatsApp**:
   - Reemplazar la función `enviarNotificacion()` con tu integración real
   - Ejemplo con Twilio, WhatsApp Business API, etc.

4. **Configurar desde el CRM**:
   - Actualizar la interfaz de configuración para incluir las nuevas opciones
   - Permitir configurar notificaciones a agentes
   - Permitir configurar resumen diario

---

## 🎨 Interfaz de Usuario (Pendiente)

Se debe actualizar el componente `ConfiguracionModulo.tsx` para incluir:

1. **Selector de destinatario** en cada notificación (cliente/agente)
2. **Opción "inmediata"** en el selector de momento
3. **Sección nueva** para configurar notificación diaria de agentes:
   - Toggle activa/inactiva
   - Selector de hora (06:00 por defecto)
   - Checkbox "Enviar a todos los agentes"
   - Checkboxes para detalles a incluir
   - Editor de plantilla de mensaje

---

## 📞 Soporte

Para dudas o mejoras, contactar al equipo de desarrollo.
