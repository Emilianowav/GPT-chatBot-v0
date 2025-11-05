# 🔔 Sistema Completo de Notificaciones Automáticas

## 🎯 Objetivo

Implementar un sistema completo de notificaciones automáticas que:
1. **Guarda** las configuraciones de notificaciones (incluyendo recurrentes)
2. **Ejecuta** las notificaciones a la hora programada
3. **Relaciona** las notificaciones con los turnos/reservas
4. **Envía** mensajes personalizados a cada cliente con sus propios turnos

---

## ✅ Cambios Implementados

### **1. Modelo de Datos - Soporte para Recurrencia**

**Archivo:** `backend/src/modules/calendar/models/ConfiguracionModulo.ts`

**Interface actualizada:**
```typescript
export interface NotificacionAutomatica {
  // ... campos existentes ...
  
  // ✅ NUEVO: Recurrencia
  esRecurrente?: boolean;
  recurrencia?: {
    tipo: 'semanal' | 'mensual';
    intervalo: number;             // Cada cuántas semanas/meses
    horaEnvio: string;             // Hora de envío
    diasSemana?: number[];         // [0-6] para semanal
    diaMes?: number;               // 1-31 o -1 (último día) para mensual
    fechaInicio?: Date;            // Fecha de inicio (opcional)
    fechaFin?: Date;               // Fecha de fin (opcional)
  };
}
```

**Schema de Mongoose actualizado:**
```typescript
const NotificacionAutomaticaSchema = new Schema({
  // ... campos existentes ...
  
  esRecurrente: {
    type: Boolean,
    default: false
  },
  recurrencia: {
    tipo: {
      type: String,
      enum: ['semanal', 'mensual']
    },
    intervalo: Number,
    horaEnvio: String,
    diasSemana: [Number],
    diaMes: Number,
    fechaInicio: Date,
    fechaFin: Date
  }
});
```

**Resultado:**
- ✅ Las notificaciones recurrentes ahora se GUARDAN correctamente en MongoDB
- ✅ Todos los campos de recurrencia se persisten
- ✅ Compatible con notificaciones existentes (campos opcionales)

---

### **2. Servicio de Procesamiento Automático**

**Archivo:** `backend/src/services/notificacionesAutomaticasService.ts` (NUEVO)

**Funciones principales:**

#### **A. `procesarNotificacionesProgramadas()`**
```typescript
export async function procesarNotificacionesProgramadas() {
  const ahora = new Date();
  const horaActual = "HH:MM";
  const diaActual = 0-6; // Día de la semana

  // 1. Obtener todas las configuraciones activas
  const configuraciones = await ConfiguracionModuloModel.find({ activo: true });

  // 2. Para cada configuración, procesar notificaciones
  for (const config of configuraciones) {
    for (const notif of config.notificaciones) {
      if (!notif.activa) continue;

      // 3. Verificar si es hora de enviar
      const debeEnviar = verificarSiDebeEnviar(notif, horaActual, diaActual);

      if (debeEnviar) {
        // 4. Enviar notificación
        await enviarNotificacion(config.empresaId, notif);
      }
    }
  }
}
```

#### **B. `verificarSiDebeEnviar()`**
```typescript
function verificarSiDebeEnviar(notif, horaActual, diaActual): boolean {
  // Si es recurrente
  if (notif.esRecurrente && notif.recurrencia) {
    // Verificar hora
    if (notif.recurrencia.horaEnvio !== horaActual) return false;

    // Verificar rango de fechas
    if (fechaInicio && ahora < fechaInicio) return false;
    if (fechaFin && ahora > fechaFin) return false;

    // Verificar tipo
    if (tipo === 'semanal') {
      // Verificar si hoy es uno de los días configurados
      if (!diasSemana.includes(diaActual)) return false;
      return true;
    }
  }

  // Si no es recurrente
  if (notif.momento === 'noche_anterior' || notif.momento === 'hora_exacta') {
    return notif.horaEnvio === horaActual;
  }

  return false;
}
```

#### **C. `enviarNotificacion()`**
```typescript
async function enviarNotificacion(empresaId, notif) {
  // 1. Obtener empresa y phoneNumberId
  const empresa = await EmpresaModel.findOne({ nombre: empresaId });
  const phoneNumberId = empresa.phoneNumberId;

  // 2. Obtener turnos según el momento
  const turnos = await obtenerTurnosParaNotificacion(empresaId, notif);

  // 3. Agrupar turnos por cliente
  const turnosPorCliente = new Map();
  for (const turno of turnos) {
    turnosPorCliente.get(turno.clienteId).push(turno);
  }

  // 4. Enviar a cada cliente SUS propios turnos
  for (const [clienteId, turnosCliente] of turnosPorCliente) {
    const cliente = await ClienteModel.findById(clienteId);
    const mensaje = await generarMensaje(notif, turnosCliente, cliente);
    
    await enviarMensajeWhatsAppTexto(cliente.telefono, mensaje, phoneNumberId);

    // 5. Marcar notificación como enviada en el turno
    await TurnoModel.findByIdAndUpdate(turno._id, {
      $push: {
        notificaciones: {
          tipo: notif.tipo,
          enviada: true,
          enviadaEn: new Date()
        }
      }
    });
  }
}
```

#### **D. `obtenerTurnosParaNotificacion()`**
```typescript
async function obtenerTurnosParaNotificacion(empresaId, notif) {
  let fechaInicio, fechaFin;

  // Determinar rango según momento
  if (notif.momento === 'noche_anterior') {
    // Turnos de MAÑANA
    fechaInicio = mañana 00:00:00
    fechaFin = mañana 23:59:59
  } else if (notif.momento === 'mismo_dia') {
    // Turnos de HOY
    fechaInicio = hoy 00:00:00
    fechaFin = hoy 23:59:59
  } else if (notif.momento === 'horas_antes') {
    // Turnos en X horas
    fechaInicio = ahora + X horas
    fechaFin = ahora + X horas + 1 hora
  }

  // Buscar turnos
  const turnos = await TurnoModel.find({
    empresaId,
    fechaInicio: { $gte: fechaInicio, $lte: fechaFin },
    estado: { $in: ['no_confirmado', 'pendiente', 'confirmado'] }
  }).populate('agenteId').populate('clienteId');

  return turnos;
}
```

#### **E. `generarMensaje()`**
```typescript
async function generarMensaje(notif, turnos, cliente): string {
  let mensaje = '';

  // Encabezado si hay múltiples turnos
  if (turnos.length > 1) {
    mensaje = '🚗 *Estos son tus viajes de mañana*\n\n';
  }

  // Agregar cada turno
  for (const turno of turnos) {
    let mensajeTurno = notif.plantillaMensaje;

    // Variables
    const variables = {
      cliente: `${cliente.nombre} ${cliente.apellido}`,
      agente: `${turno.agenteId.nombre} ${turno.agenteId.apellido}`,
      fecha: turno.fechaInicio.toLocaleDateString(),
      hora: turno.fechaInicio.toLocaleTimeString(),
      ...turno.datos  // ✅ Campos personalizados (origen, destino, etc.)
    };

    // Reemplazar variables
    Object.entries(variables).forEach(([clave, valor]) => {
      mensajeTurno = mensajeTurno.replace(`{${clave}}`, valor);
    });

    mensaje += mensajeTurno + '\n\n';
  }

  return mensaje;
}
```

---

### **3. Integración con App.ts - Cron Job**

**Archivo:** `backend/src/app.ts`

**Cron job agregado:**
```typescript
// Importar servicio
import { procesarNotificacionesProgramadas } from "./services/notificacionesAutomaticasService.js";

// En el inicio de la app
async () => {
  // ... conexión a DB ...

  // Iniciar cron job para notificaciones programadas (cada minuto)
  console.log('⏰ Iniciando cron job de notificaciones programadas...');
  setInterval(async () => {
    await procesarNotificacionesProgramadas();
  }, 60 * 1000); // Cada 60 segundos

  // Ejecutar una vez al iniciar (después de 5 segundos)
  setTimeout(async () => {
    await procesarNotificacionesProgramadas();
  }, 5000);

  // ... iniciar servidor ...
}
```

**Resultado:**
- ✅ Cada 60 segundos verifica si hay notificaciones que enviar
- ✅ Compara hora actual con hora configurada
- ✅ Ejecuta automáticamente sin intervención manual

---

## 🔄 Flujo Completo del Sistema

### **Paso 1: Usuario Configura Notificación**

```
Frontend (ConfiguracionModulo.tsx)
  ↓
Usuario crea notificación "Confirmación Diaria"
  ↓
Configura:
  - Destinatario: Todos los clientes
  - Momento: Noche anterior
  - Hora: 22:00
  - Mensaje: "🚗 Recordatorio de viaje para mañana..."
  - Recurrente: ✅ Sí
  - Días: Todos los días
  ↓
Clic en "Guardar Configuración"
  ↓
POST /api/modules/calendar/configuracion/:empresaId
  ↓
Backend guarda en MongoDB:
{
  "notificaciones": [{
    "activa": true,
    "tipo": "confirmacion",
    "momento": "noche_anterior",
    "horaEnvio": "22:00",
    "plantillaMensaje": "🚗 Recordatorio...",
    "esRecurrente": true,
    "recurrencia": {
      "tipo": "semanal",
      "horaEnvio": "22:00",
      "diasSemana": [0,1,2,3,4,5,6]
    }
  }]
}
```

---

### **Paso 2: Cron Job Ejecuta (Cada Minuto)**

```
⏰ Cada 60 segundos:
  ↓
procesarNotificacionesProgramadas()
  ↓
Hora actual: 22:00
Día actual: Lunes (1)
  ↓
Buscar configuraciones activas en MongoDB
  ↓
Para cada configuración:
  Para cada notificación:
    ↓
    verificarSiDebeEnviar()
      ↓
      ¿Es recurrente? ✅ Sí
      ¿Hora coincide? 22:00 === 22:00 ✅ Sí
      ¿Día coincide? Lunes en [0,1,2,3,4,5,6] ✅ Sí
      ↓
      DEBE ENVIAR = true
    ↓
    enviarNotificacion()
```

---

### **Paso 3: Obtener Turnos Relacionados**

```
obtenerTurnosParaNotificacion()
  ↓
Momento: "noche_anterior"
  ↓
Calcular rango:
  fechaInicio = mañana 00:00:00
  fechaFin = mañana 23:59:59
  ↓
Buscar en MongoDB:
  TurnoModel.find({
    empresaId: "San Jose",
    fechaInicio: { $gte: mañana 00:00, $lte: mañana 23:59 },
    estado: { $in: ['no_confirmado', 'pendiente', 'confirmado'] }
  })
  ↓
Resultado:
  [
    { clienteId: "123", hora: "10:45", origen: "...", destino: "..." },
    { clienteId: "123", hora: "16:20", origen: "...", destino: "..." },
    { clienteId: "456", hora: "09:00", origen: "...", destino: "..." },
    { clienteId: "789", hora: "13:00", origen: "...", destino: "..." }
  ]
```

---

### **Paso 4: Agrupar por Cliente**

```
Agrupar turnos por clienteId:
  ↓
Map {
  "123" => [
    { hora: "10:45", origen: "A", destino: "B" },
    { hora: "16:20", origen: "C", destino: "D" }
  ],
  "456" => [
    { hora: "09:00", origen: "E", destino: "F" }
  ],
  "789" => [
    { hora: "13:00", origen: "G", destino: "H" }
  ]
}
```

---

### **Paso 5: Enviar a Cada Cliente**

```
Para cada cliente en el Map:
  ↓
Cliente "123":
  ↓
  Obtener datos: { nombre: "Juan", telefono: "+54..." }
  ↓
  Generar mensaje:
    🚗 *Estos son tus viajes de mañana*

    🚗 Recordatorio de viaje para mañana
    📍 Origen: A
    📍 Destino: B
    🕐 Hora: 10:45
    👥 Pasajeros: 2
    ¿Confirmas tu viaje? Responde SÍ o NO

    🚗 Recordatorio de viaje para mañana
    📍 Origen: C
    📍 Destino: D
    🕐 Hora: 16:20
    👥 Pasajeros: 1
    ¿Confirmas tu viaje? Responde SÍ o NO
  ↓
  enviarMensajeWhatsAppTexto("+54...", mensaje, phoneNumberId)
  ↓
  Marcar en turno:
    TurnoModel.update({
      $push: {
        notificaciones: {
          tipo: "confirmacion",
          enviada: true,
          enviadaEn: new Date()
        }
      }
    })
  ↓
  Esperar 500ms
  ↓
Cliente "456":
  (repetir proceso)
  ↓
Cliente "789":
  (repetir proceso)
```

---

## 📊 Relación con Turnos

### **Cómo se Relacionan:**

**1. Configuración de Notificación:**
```json
{
  "empresaId": "San Jose",
  "notificaciones": [{
    "momento": "noche_anterior",
    "horaEnvio": "22:00"
  }]
}
```

**2. Turnos en la Base de Datos:**
```json
{
  "_id": "turno123",
  "empresaId": "San Jose",
  "clienteId": "cliente456",
  "fechaInicio": "2025-11-02T10:45:00",
  "estado": "no_confirmado",
  "datos": {
    "origen": "Av. Corrientes 1234",
    "destino": "Aeropuerto Ezeiza",
    "pasajeros": 2
  },
  "notificaciones": []  // ← Se llena cuando se envía
}
```

**3. Después de Enviar:**
```json
{
  "_id": "turno123",
  "empresaId": "San Jose",
  "clienteId": "cliente456",
  "fechaInicio": "2025-11-02T10:45:00",
  "estado": "no_confirmado",
  "datos": {
    "origen": "Av. Corrientes 1234",
    "destino": "Aeropuerto Ezeiza",
    "pasajeros": 2
  },
  "notificaciones": [{  // ← ✅ RELACIONADO
    "tipo": "confirmacion",
    "programadaPara": "2025-11-01T22:00:00",
    "enviada": true,
    "enviadaEn": "2025-11-01T22:00:15",
    "plantilla": "🚗 Recordatorio de viaje para mañana..."
  }]
}
```

---

## 🎯 Ventajas del Sistema

### **1. Automatización Completa**
- ✅ No requiere intervención manual
- ✅ Se ejecuta cada minuto automáticamente
- ✅ Procesa todas las empresas y notificaciones

### **2. Precisión de Hora**
- ✅ Verifica cada minuto si es hora de enviar
- ✅ Compara hora exacta (HH:MM)
- ✅ Respeta días de la semana configurados

### **3. Personalización por Cliente**
- ✅ Cada cliente recibe SOLO sus turnos
- ✅ Mensajes personalizados con sus datos
- ✅ Variables reemplazadas automáticamente

### **4. Trazabilidad**
- ✅ Cada turno registra qué notificaciones recibió
- ✅ Fecha y hora de envío guardadas
- ✅ Historial completo de notificaciones

### **5. Escalabilidad**
- ✅ Soporta múltiples empresas
- ✅ Soporta múltiples notificaciones por empresa
- ✅ Soporta recurrencia compleja

---

## 🔧 Configuración y Uso

### **Crear Notificación Recurrente:**

1. Ir a `/dashboard/calendario/configuracion`
2. Tab "Notificaciones"
3. Clic en "+ Agregar Notificación"
4. Seleccionar "Confirmación Diaria"
5. Configurar:
   - Hora: 22:00
   - Mensaje: (personalizar si es necesario)
6. Activar "🔄 Notificación recurrente"
7. Configurar:
   - Tipo: Semanal
   - Días: Todos los días
   - Hora: 22:00 (heredada automáticamente)
8. Guardar

### **Verificar que Funciona:**

**Opción A: Logs del Servidor**
```bash
# Ver logs en tiempo real
npm run dev

# Buscar:
⏰ [22:00] Verificando notificaciones programadas...
📨 Enviando notificación: confirmacion - noche_anterior
📊 Enviando a 3 clientes
✅ Enviado a Juan Pérez (+54...)
✅ Enviado a María González (+54...)
✅ Enviado a Carlos López (+54...)
```

**Opción B: Base de Datos**
```javascript
// Verificar turnos con notificaciones enviadas
db.turnos.find({
  "notificaciones.enviada": true,
  "notificaciones.enviadaEn": {
    $gte: new Date("2025-11-01T22:00:00"),
    $lte: new Date("2025-11-01T22:05:00")
  }
})
```

**Opción C: WhatsApp**
- Verificar que los clientes recibieron los mensajes
- Verificar que cada uno recibió SOLO sus turnos
- Verificar que las variables se reemplazaron correctamente

---

## 📝 Resumen de Archivos Modificados/Creados

| Archivo | Cambio | Estado |
|---------|--------|--------|
| `ConfiguracionModulo.ts` (interface) | Agregar `esRecurrente` y `recurrencia` | ✅ Completado |
| `ConfiguracionModulo.ts` (schema) | Agregar campos al Schema de Mongoose | ✅ Completado |
| `notificacionesAutomaticasService.ts` | Servicio completo de procesamiento | ✅ Creado |
| `app.ts` | Import y cron job cada 60 segundos | ✅ Completado |
| `ConfiguracionModulo.tsx` | Herencia de hora al activar recurrencia | ✅ Completado |
| `SelectorTipoNotificacion.tsx` | Plantilla "Confirmación Diaria" corregida | ✅ Completado |

---

## ✅ Resultado Final

**Antes:**
- ❌ Notificaciones recurrentes no se guardaban
- ❌ No había cron job para ejecutar automáticamente
- ❌ No había relación entre notificaciones y turnos
- ❌ Mensajes no se enviaban a la hora programada

**Ahora:**
- ✅ Notificaciones recurrentes se guardan en MongoDB
- ✅ Cron job ejecuta cada 60 segundos
- ✅ Notificaciones se relacionan con turnos (campo `notificaciones[]`)
- ✅ Mensajes se envían EXACTAMENTE a la hora programada
- ✅ Cada cliente recibe SOLO sus turnos
- ✅ Variables se reemplazan con datos reales
- ✅ Sistema completamente automatizado

¡Sistema de notificaciones automáticas completamente funcional! 🎉
