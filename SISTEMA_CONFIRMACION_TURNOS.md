# ✅ Sistema de Confirmación de Turnos

## 🎯 Objetivo

Implementar un sistema automático de confirmación de turnos que:
1. Envía notificaciones el día anterior a cada cliente con sus turnos
2. Los turnos inician en estado "NO_CONFIRMADO"
3. El cliente puede confirmar respondiendo SÍ o NO
4. La confirmación actualiza el estado del turno en la base de datos

---

## 🔧 Cambios Implementados

### **1. Nuevo Estado "NO_CONFIRMADO" en Turnos**

**Archivo:** `backend/src/modules/calendar/models/Turno.ts`

**Cambios:**
```typescript
export enum EstadoTurno {
  NO_CONFIRMADO = 'no_confirmado',  // ✅ NUEVO - Estado inicial
  PENDIENTE = 'pendiente',
  CONFIRMADO = 'confirmado',
  EN_CURSO = 'en_curso',
  COMPLETADO = 'completado',
  CANCELADO = 'cancelado',
  NO_ASISTIO = 'no_asistio'
}

// Estado por defecto cambiado
estado: {
  type: String,
  enum: Object.values(EstadoTurno),
  default: EstadoTurno.NO_CONFIRMADO,  // ✅ Antes era PENDIENTE
  index: true
}
```

**Impacto:**
- ✅ Todos los turnos nuevos se crean con estado `no_confirmado`
- ✅ Permite diferenciar entre turnos sin confirmar y turnos pendientes
- ✅ Facilita el seguimiento de confirmaciones

---

### **2. Corrección del Envío de Notificaciones**

**Archivo:** `front_crm/bot_crm/src/components/calendar/ConfiguracionModulo.tsx`

**Problema Anterior:**
```typescript
// ❌ ANTES: Enviaba TODOS los turnos al MISMO número
turnos.forEach((turno) => {
  mensajeFinal += generarMensaje(turno);
});
enviarA(unSoloTelefono, mensajeFinal);
```

**Solución Implementada:**
```typescript
// ✅ AHORA: Agrupa por cliente y envía a cada uno sus propios turnos

// 1. Agrupar turnos por cliente
const turnosPorCliente = new Map<string, Turno[]>();
turnos.forEach(turno => {
  const clienteId = turno.clienteId;
  if (!turnosPorCliente.has(clienteId)) {
    turnosPorCliente.set(clienteId, []);
  }
  turnosPorCliente.get(clienteId)!.push(turno);
});

// 2. Enviar a cada cliente SUS propios turnos
for (const [clienteId, turnosCliente] of turnosPorCliente.entries()) {
  const telefono = obtenerTelefonoCliente(turnosCliente[0]);
  const mensaje = generarMensajePersonalizado(turnosCliente);
  await enviarA(telefono, mensaje);
  
  // Esperar 500ms entre envíos
  await new Promise(resolve => setTimeout(resolve, 500));
}
```

**Características:**
- ✅ Agrupa turnos por `clienteId`
- ✅ Genera mensaje personalizado para cada cliente
- ✅ Envía al teléfono correcto de cada cliente
- ✅ Muestra contador: "✅ Notificaciones enviadas: X | ❌ Errores: Y"
- ✅ Espera 500ms entre envíos para no saturar la API

---

### **3. Plantilla de Confirmación Predefinida**

**Archivo:** `backend/src/modules/calendar/controllers/configuracionController.ts`

**Plantilla para Viajes:**
```typescript
notificaciones: [
  {
    activa: true,
    tipo: 'confirmacion',
    momento: 'noche_anterior',
    horaEnvio: '22:00',
    diasAntes: 1,
    plantillaMensaje: '🚗 *Recordatorio de viaje para mañana*\n\n📍 *Origen:* {origen}\n📍 *Destino:* {destino}\n🕐 *Hora:* {hora}\n👥 *Pasajeros:* {pasajeros}\n\n¿Confirmas tu viaje? Responde *SÍ* o *NO*',
    requiereConfirmacion: true,
    mensajeConfirmacion: '✅ ¡Perfecto! Tu viaje está confirmado. Nos vemos mañana.',
    mensajeCancelacion: '❌ Viaje cancelado. Si necesitas reprogramar, contáctanos.'
  }
]
```

**Variables Disponibles:**
- `{origen}` - Dirección de origen
- `{destino}` - Dirección de destino
- `{hora}` - Hora del viaje
- `{pasajeros}` - Cantidad de pasajeros
- `{fecha}` - Fecha del viaje
- `{agente}` - Nombre del chofer
- `{cliente}` - Nombre del cliente
- `{turno}` - Nomenclatura (Viaje/Turno/Reserva)

---

## 📱 Flujo de Confirmación

### **Paso 1: Envío Automático (Noche Anterior a las 22:00)**

```
Sistema → Cliente (WhatsApp)

🚗 Recordatorio de viaje para mañana

📍 Origen: Av. Corrientes 1234
📍 Destino: Aeropuerto Ezeiza
🕐 Hora: 10:45
👥 Pasajeros: 2

¿Confirmas tu viaje? Responde SÍ o NO
```

**Si el cliente tiene múltiples turnos:**
```
🚗 Estos son tus viajes de mañana

🚗 Recordatorio de viaje para mañana

📍 Origen: Av. Corrientes 1234
📍 Destino: Aeropuerto Ezeiza
🕐 Hora: 10:45
👥 Pasajeros: 2

¿Confirmas tu viaje? Responde SÍ o NO

🚗 Recordatorio de viaje para mañana

📍 Origen: Aeropuerto Ezeiza
📍 Destino: Av. Corrientes 1234
🕐 Hora: 16:20
👥 Pasajeros: 2

¿Confirmas tu viaje? Responde SÍ o NO
```

---

### **Paso 2: Respuesta del Cliente**

**Opción A: Cliente responde "SÍ"**
```
Cliente → Sistema: SÍ

Sistema → Cliente: ✅ ¡Perfecto! Tu viaje está confirmado. Nos vemos mañana.

Base de Datos:
  estado: "no_confirmado" → "confirmado" ✅
  confirmado: true
  confirmadoEn: 2025-11-01 22:15:00
```

**Opción B: Cliente responde "NO"**
```
Cliente → Sistema: NO

Sistema → Cliente: ❌ Viaje cancelado. Si necesitas reprogramar, contáctanos.

Base de Datos:
  estado: "no_confirmado" → "cancelado" ❌
  canceladoEn: 2025-11-01 22:15:00
  motivoCancelacion: "Cliente canceló por WhatsApp"
```

**Opción C: Cliente no responde**
```
(Sin respuesta hasta el día del viaje)

Base de Datos:
  estado: "no_confirmado" (permanece sin confirmar)
  
Acción del Agente:
  - Puede confirmar manualmente desde el CRM
  - Puede llamar al cliente para confirmar
  - Puede cancelar si no hay respuesta
```

---

## 🔄 Estados del Turno

```
CREACIÓN
   ↓
NO_CONFIRMADO (default)
   ↓
   ├─→ CONFIRMADO (cliente responde SÍ o agente confirma)
   │      ↓
   │   PENDIENTE (día del turno)
   │      ↓
   │   EN_CURSO (turno iniciado)
   │      ↓
   │   COMPLETADO (turno finalizado)
   │
   ├─→ CANCELADO (cliente responde NO o agente cancela)
   │
   └─→ NO_ASISTIO (cliente no se presentó)
```

---

## 🎨 Interfaz de Usuario

### **Configuración de Notificaciones**

**Ubicación:** `/dashboard/calendario/configuracion` → Tab "Notificaciones"

**Características:**
1. **Botón "Enviar Prueba"** en cada notificación
   - Abre selector de turnos
   - Agrupa por cliente automáticamente
   - Envía a cada cliente sus propios turnos
   - Muestra contador de enviados/errores

2. **Plantilla Personalizable**
   ```
   Mensaje de la Notificación:
   🚗 *Recordatorio de viaje para mañana*
   
   📍 *Origen:* {origen}
   📍 *Destino:* {destino}
   🕐 *Hora:* {hora}
   👥 *Pasajeros:* {pasajeros}
   
   ¿Confirmas tu viaje? Responde *SÍ* o *NO*
   ```

3. **Variables Disponibles**
   - Muestra todas las variables que se pueden usar
   - Incluye campos personalizados (origen, destino, pasajeros, etc.)

---

## 🔧 Configuración del Sistema

### **1. Crear Notificación de Confirmación**

1. Ir a: `/dashboard/calendario/configuracion`
2. Tab: "Notificaciones"
3. Clic en: "+ Agregar Notificación"
4. Seleccionar: "Confirmación diaria de turnos"
5. Configurar:
   - **Destinatario:** Todos los clientes
   - **Tipo:** Confirmación
   - **Cuándo enviar:** Noche anterior
   - **Hora:** 22:00
   - **Mensaje:** (usar plantilla predefinida)
   - **Requiere confirmación:** ✅ Activado
6. Guardar configuración

---

### **2. Probar el Sistema**

1. Crear turnos de prueba para mañana
2. Asignar a diferentes clientes
3. En la notificación, clic en "📤 Enviar Prueba"
4. Seleccionar los turnos de prueba
5. Verificar que cada cliente recibe SUS turnos
6. Responder SÍ o NO desde WhatsApp
7. Verificar que el estado se actualiza en la BD

---

## 📊 Monitoreo y Reportes

### **Consultas Útiles en MongoDB:**

**Turnos sin confirmar:**
```javascript
db.turnos.find({
  estado: 'no_confirmado',
  fechaInicio: { 
    $gte: new Date(),
    $lte: new Date(Date.now() + 24*60*60*1000)
  }
})
```

**Turnos confirmados hoy:**
```javascript
db.turnos.find({
  estado: 'confirmado',
  confirmadoEn: {
    $gte: new Date(new Date().setHours(0,0,0,0))
  }
})
```

**Tasa de confirmación:**
```javascript
db.turnos.aggregate([
  {
    $match: {
      fechaInicio: { $gte: new Date() }
    }
  },
  {
    $group: {
      _id: '$estado',
      count: { $sum: 1 }
    }
  }
])
```

---

## 🚀 Próximos Pasos (Pendientes)

### **1. Implementar Handler de Respuestas**

**Archivo a crear:** `backend/src/services/confirmacionTurnosService.ts`

```typescript
export async function procesarConfirmacionWhatsApp(
  telefono: string,
  mensaje: string,
  empresaId: string
) {
  // 1. Buscar turnos no confirmados del cliente para mañana
  const turnos = await TurnoModel.find({
    clienteId: telefono,
    empresaId,
    estado: 'no_confirmado',
    fechaInicio: {
      $gte: manana,
      $lte: finDia
    }
  });

  // 2. Detectar respuesta (SÍ/NO)
  const respuesta = mensaje.trim().toUpperCase();
  
  if (respuesta === 'SI' || respuesta === 'SÍ' || respuesta === 'YES') {
    // Confirmar todos los turnos
    await TurnoModel.updateMany(
      { _id: { $in: turnos.map(t => t._id) } },
      {
        estado: 'confirmado',
        confirmado: true,
        confirmadoEn: new Date(),
        confirmadoPor: 'cliente_whatsapp'
      }
    );
    
    return {
      accion: 'confirmado',
      mensaje: '✅ ¡Perfecto! Tu viaje está confirmado. Nos vemos mañana.'
    };
  }
  
  if (respuesta === 'NO') {
    // Cancelar todos los turnos
    await TurnoModel.updateMany(
      { _id: { $in: turnos.map(t => t._id) } },
      {
        estado: 'cancelado',
        canceladoEn: new Date(),
        motivoCancelacion: 'Cliente canceló por WhatsApp'
      }
    );
    
    return {
      accion: 'cancelado',
      mensaje: '❌ Viaje cancelado. Si necesitas reprogramar, contáctanos.'
    };
  }
  
  return null; // No es una respuesta de confirmación
}
```

---

### **2. Integrar con WhatsApp Controller**

**Archivo:** `backend/src/controllers/whatsappController.ts`

```typescript
import { procesarConfirmacionWhatsApp } from '../services/confirmacionTurnosService.js';

// En la función recibirMensaje, ANTES del bot de turnos:

// 🔔 FLUJO DE CONFIRMACIÓN DE TURNOS
try {
  const resultadoConfirmacion = await procesarConfirmacionWhatsApp(
    telefonoCliente,
    mensaje,
    empresa.empresaId || empresa.nombre
  );

  if (resultadoConfirmacion) {
    // El mensaje era una confirmación
    await enviarMensajeWhatsAppTexto(
      telefonoCliente,
      resultadoConfirmacion.mensaje,
      phoneNumberId
    );

    usuario.num_mensajes_recibidos += 1;
    usuario.num_mensajes_enviados += 1;
    usuario.interacciones += 1;
    usuario.ultimo_status = 'confirmacion_turno';
    await actualizarUsuario(usuario);

    res.sendStatus(200);
    return;
  }
} catch (errorConfirmacion) {
  console.error('⚠️ Error en confirmación de turnos:', errorConfirmacion);
  // Continuar con flujo normal si falla
}
```

---

### **3. Crear Cron Job para Envío Automático**

**Archivo:** `backend/src/scripts/enviarConfirmacionesDiarias.ts`

```typescript
import cron from 'node-cron';
import { TurnoModel } from '../modules/calendar/models/Turno.js';
import { enviarMensajeWhatsAppTexto } from '../services/metaService.js';

// Ejecutar todos los días a las 22:00
cron.schedule('0 22 * * *', async () => {
  console.log('📅 Iniciando envío de confirmaciones diarias...');
  
  // Obtener turnos para mañana
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  manana.setHours(0, 0, 0, 0);
  
  const finDia = new Date(manana);
  finDia.setHours(23, 59, 59, 999);
  
  const turnos = await TurnoModel.find({
    fechaInicio: { $gte: manana, $lte: finDia },
    estado: 'no_confirmado'
  }).populate('empresaId');
  
  // Agrupar por cliente
  const turnosPorCliente = agruparPorCliente(turnos);
  
  // Enviar a cada cliente
  for (const [clienteId, turnosCliente] of turnosPorCliente) {
    await enviarConfirmacion(clienteId, turnosCliente);
    await sleep(500); // Esperar entre envíos
  }
  
  console.log('✅ Confirmaciones enviadas');
});
```

---

## 📝 Resumen de Cambios

| Archivo | Cambio | Estado |
|---------|--------|--------|
| `Turno.ts` | Agregar estado `NO_CONFIRMADO` | ✅ Completado |
| `Turno.ts` | Cambiar default a `NO_CONFIRMADO` | ✅ Completado |
| `ConfiguracionModulo.tsx` | Agrupar turnos por cliente | ✅ Completado |
| `ConfiguracionModulo.tsx` | Enviar a cada cliente sus turnos | ✅ Completado |
| `ConfiguracionModulo.tsx` | Contador de enviados/errores | ✅ Completado |
| `configuracionController.ts` | Plantilla de confirmación | ✅ Ya existía |
| `confirmacionTurnosService.ts` | Handler de respuestas | ⏳ Pendiente |
| `whatsappController.ts` | Integración con webhook | ⏳ Pendiente |
| `enviarConfirmacionesDiarias.ts` | Cron job automático | ⏳ Pendiente |

---

## ✅ Resultado Final

**Antes:**
- ❌ Turnos iniciaban en "pendiente"
- ❌ Enviaba todos los turnos al mismo número
- ❌ No había flujo de confirmación automático

**Ahora:**
- ✅ Turnos inician en "no_confirmado"
- ✅ Cada cliente recibe SOLO sus propios turnos
- ✅ Sistema de confirmación por WhatsApp (pendiente integración)
- ✅ Plantilla predefinida lista para usar
- ✅ Botón de prueba funcional

¡Sistema de confirmación de turnos implementado! 🎉
