# 🔄 Flujo de Notificaciones Cíclicas/Recurrentes

## 📋 Resumen Ejecutivo

Las notificaciones cíclicas permiten enviar mensajes automáticos de forma repetitiva según una programación definida (semanal o mensual), sin necesidad de configurar cada notificación manualmente.

---

## 🎯 Tipos de Recurrencia

### 1. 📆 Semanal
- **Cada X semanas** en días específicos
- Selección múltiple de días (Lun, Mar, Mié, etc.)
- Ideal para: recordatorios semanales, agendas, reportes

### 2. 🗓️ Mensual
- **Cada X meses** en un día específico
- Día del mes (1-31) o **último día del mes**
- Ideal para: facturación, reportes mensuales, recordatorios de pago

---

## 🔄 Flujo Completo del Sistema

### **Fase 1: Configuración (Frontend)**

```
Usuario accede a Configuración → Notificaciones
  ↓
Crea/Edita una notificación
  ↓
Activa checkbox: "🔄 Notificación recurrente"
  ↓
Configura parámetros:
  ├─ Tipo: Semanal o Mensual
  ├─ Intervalo: Cada cuántas semanas/meses
  ├─ Días/Fecha: Cuándo enviar
  ├─ Hora: A qué hora
  ├─ Fecha inicio (opcional)
  └─ Fecha fin (opcional)
  ↓
Guarda configuración en MongoDB
```

**Datos guardados:**
```json
{
  "esRecurrente": true,
  "recurrencia": {
    "tipo": "semanal",
    "intervalo": 1,
    "diasSemana": [1, 3, 5],  // Lun, Mié, Vie
    "horaEnvio": "09:00",
    "fechaInicio": "2025-11-01",
    "fechaFin": "2025-12-31"
  }
}
```

---

### **Fase 2: Procesamiento (Backend - Cron Job)**

```
Cron Job se ejecuta cada hora (o cada 15 min)
  ↓
Lee todas las notificaciones con esRecurrente: true
  ↓
Para cada notificación:
  ├─ Verifica si está activa
  ├─ Verifica si estamos en el rango de fechas (inicio/fin)
  ├─ Verifica si hoy corresponde según la recurrencia
  └─ Verifica si es la hora de envío
  ↓
Si todas las condiciones se cumplen:
  ├─ Genera el mensaje con las variables
  ├─ Obtiene los destinatarios
  ├─ Envía vía WhatsApp/SMS/Email
  └─ Registra en log de envíos
```

---

### **Fase 3: Lógica de Verificación**

#### **Para Semanal:**
```javascript
function debeEnviarHoy(recurrencia) {
  const hoy = new Date();
  const diaSemana = hoy.getDay(); // 0=Dom, 1=Lun, ..., 6=Sáb
  const horaActual = hoy.getHours() + ':' + hoy.getMinutes();
  
  // 1. Verificar si hoy es uno de los días configurados
  if (!recurrencia.diasSemana.includes(diaSemana)) {
    return false;
  }
  
  // 2. Verificar si es la hora correcta
  if (horaActual !== recurrencia.horaEnvio) {
    return false;
  }
  
  // 3. Verificar intervalo de semanas
  const semanaActual = obtenerNumeroSemana(hoy);
  const semanaInicio = obtenerNumeroSemana(recurrencia.fechaInicio);
  const diferenciaSemanas = semanaActual - semanaInicio;
  
  if (diferenciaSemanas % recurrencia.intervalo !== 0) {
    return false;
  }
  
  return true;
}
```

#### **Para Mensual:**
```javascript
function debeEnviarHoy(recurrencia) {
  const hoy = new Date();
  const diaDelMes = hoy.getDate();
  const horaActual = hoy.getHours() + ':' + hoy.getMinutes();
  
  // 1. Verificar si es el día correcto del mes
  if (recurrencia.diaMes === -1) {
    // Último día del mes
    const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
    if (diaDelMes !== ultimoDia) {
      return false;
    }
  } else {
    if (diaDelMes !== recurrencia.diaMes) {
      return false;
    }
  }
  
  // 2. Verificar si es la hora correcta
  if (horaActual !== recurrencia.horaEnvio) {
    return false;
  }
  
  // 3. Verificar intervalo de meses
  const mesActual = hoy.getMonth();
  const mesInicio = recurrencia.fechaInicio.getMonth();
  const diferenciaMeses = mesActual - mesInicio;
  
  if (diferenciaMeses % recurrencia.intervalo !== 0) {
    return false;
  }
  
  return true;
}
```

---

## 📊 Ejemplos Prácticos

### **Ejemplo 1: Recordatorio Semanal**

**Configuración:**
```
Tipo: Semanal
Intervalo: 1 semana
Días: Lunes, Miércoles, Viernes
Hora: 09:00
Mensaje: "Buenos días {cliente}, recuerda tu turno de hoy a las {hora}"
```

**Comportamiento:**
```
Lunes 09:00 → ✅ Envía
Martes 09:00 → ❌ No envía (no es día configurado)
Miércoles 09:00 → ✅ Envía
Jueves 09:00 → ❌ No envía
Viernes 09:00 → ✅ Envía
Sábado 09:00 → ❌ No envía
Domingo 09:00 → ❌ No envía
```

---

### **Ejemplo 2: Reporte Quincenal**

**Configuración:**
```
Tipo: Semanal
Intervalo: 2 semanas
Días: Viernes
Hora: 17:00
Mensaje: "Reporte quincenal de turnos para {agente}"
```

**Comportamiento:**
```
Semana 1 - Viernes 17:00 → ✅ Envía
Semana 2 - Viernes 17:00 → ❌ No envía (intervalo de 2 semanas)
Semana 3 - Viernes 17:00 → ✅ Envía
Semana 4 - Viernes 17:00 → ❌ No envía
```

---

### **Ejemplo 3: Facturación Mensual**

**Configuración:**
```
Tipo: Mensual
Intervalo: 1 mes
Día: Último día del mes
Hora: 18:00
Mensaje: "Resumen de facturación del mes para {agente}"
```

**Comportamiento:**
```
Enero 31 a las 18:00 → ✅ Envía
Febrero 28 a las 18:00 → ✅ Envía (último día de febrero)
Marzo 31 a las 18:00 → ✅ Envía
Abril 30 a las 18:00 → ✅ Envía (último día de abril)
```

---

### **Ejemplo 4: Recordatorio Mensual Específico**

**Configuración:**
```
Tipo: Mensual
Intervalo: 1 mes
Día: 15
Hora: 10:00
Mensaje: "Recordatorio: Pago de cuota el día 15"
```

**Comportamiento:**
```
15 de cada mes a las 10:00 → ✅ Envía
Cualquier otro día → ❌ No envía
```

---

## 🔧 Implementación Backend (Pseudocódigo)

### **Cron Job Principal**

```javascript
// Se ejecuta cada hora
cron.schedule('0 * * * *', async () => {
  console.log('🔄 Verificando notificaciones recurrentes...');
  
  // 1. Obtener todas las notificaciones recurrentes activas
  const notificaciones = await NotificacionModel.find({
    esRecurrente: true,
    activa: true
  });
  
  const ahora = new Date();
  
  for (const notif of notificaciones) {
    try {
      // 2. Verificar rango de fechas
      if (notif.recurrencia.fechaInicio && ahora < notif.recurrencia.fechaInicio) {
        continue; // Aún no ha comenzado
      }
      
      if (notif.recurrencia.fechaFin && ahora > notif.recurrencia.fechaFin) {
        continue; // Ya expiró
      }
      
      // 3. Verificar si debe enviarse hoy
      const debeEnviar = verificarRecurrencia(notif.recurrencia, ahora);
      
      if (debeEnviar) {
        // 4. Obtener destinatarios
        const destinatarios = await obtenerDestinatarios(notif);
        
        // 5. Enviar notificaciones
        for (const destinatario of destinatarios) {
          const mensaje = reemplazarVariables(notif.plantillaMensaje, destinatario);
          await enviarWhatsApp(destinatario.telefono, mensaje);
          
          // 6. Registrar envío
          await RegistroEnvio.create({
            notificacionId: notif._id,
            destinatario: destinatario._id,
            mensaje,
            fechaEnvio: ahora,
            estado: 'enviado'
          });
        }
        
        console.log(`✅ Notificación "${notif.plantillaMensaje}" enviada a ${destinatarios.length} destinatarios`);
      }
    } catch (error) {
      console.error(`❌ Error procesando notificación ${notif._id}:`, error);
    }
  }
});
```

---

## 📈 Ventajas del Sistema

### **Para el Usuario:**
- ✅ **Automatización total:** Configura una vez, funciona siempre
- ✅ **Flexibilidad:** Diferentes frecuencias y horarios
- ✅ **Control:** Fechas de inicio/fin opcionales
- ✅ **Visibilidad:** Resumen claro de la configuración

### **Para el Negocio:**
- ✅ **Recordatorios consistentes:** Nunca olvida enviar
- ✅ **Reducción de no-shows:** Recordatorios automáticos
- ✅ **Engagement:** Comunicación regular con clientes
- ✅ **Escalabilidad:** Funciona con 10 o 10,000 clientes

---

## 🎨 Interfaz de Usuario

### **Vista Configuración:**

```
┌──────────────────────────────────────────────────┐
│ ☑ 🔄 Notificación recurrente                     │
├──────────────────────────────────────────────────┤
│ Tipo: [📆 Semanal ▼]                             │
│ Cada: [1] semanas                                │
│ Hora: [09:00]                                    │
├──────────────────────────────────────────────────┤
│ Días de la semana:                               │
│ ☐ Dom  ☑ Lun  ☐ Mar  ☑ Mié  ☐ Jue  ☑ Vie  ☐ Sáb│
├──────────────────────────────────────────────────┤
│ Fecha inicio: [2025-11-01] (opcional)            │
│ Fecha fin: [2025-12-31] (opcional)               │
├──────────────────────────────────────────────────┤
│ 📋 Resumen:                                      │
│ Esta notificación se enviará cada 1 semana(s)   │
│ los Lun, Mié, Vie a las 09:00                   │
│ desde el 01/11/2025 hasta el 31/12/2025         │
└──────────────────────────────────────────────────┘
```

---

## 🔍 Casos de Uso Reales

### **1. Clínica Médica**
```
Recordatorio de turnos:
- Tipo: Semanal
- Días: Lunes a Viernes
- Hora: 08:00
- Mensaje: "Buenos días {cliente}, tienes turno hoy a las {hora} con {agente}"
```

### **2. Gimnasio**
```
Recordatorio de clases:
- Tipo: Semanal
- Días: Lunes, Miércoles, Viernes
- Hora: 18:00
- Mensaje: "¡Hola {cliente}! Recuerda tu clase de {turno} a las {hora}"
```

### **3. Agencia de Viajes**
```
Ofertas mensuales:
- Tipo: Mensual
- Día: 1
- Hora: 10:00
- Mensaje: "🌴 Nuevas ofertas del mes para {cliente}. Consulta disponibilidad!"
```

### **4. Contador**
```
Recordatorio de vencimientos:
- Tipo: Mensual
- Día: Último día del mes
- Hora: 09:00
- Mensaje: "Recordatorio: Vencimiento de impuestos mañana"
```

---

## ⚠️ Consideraciones Importantes

### **1. Evitar Duplicados**
```javascript
// Verificar que no se haya enviado ya hoy
const yaEnviado = await RegistroEnvio.findOne({
  notificacionId: notif._id,
  destinatario: destinatario._id,
  fechaEnvio: {
    $gte: new Date().setHours(0, 0, 0, 0),
    $lt: new Date().setHours(23, 59, 59, 999)
  }
});

if (yaEnviado) {
  console.log('Ya se envió hoy, saltando...');
  continue;
}
```

### **2. Manejo de Errores**
- Reintentos automáticos si falla el envío
- Log de errores para debugging
- Notificación al admin si hay problemas

### **3. Límites de Envío**
- Respetar límites de API de WhatsApp
- Implementar rate limiting
- Queue system para grandes volúmenes

### **4. Zona Horaria**
- Usar zona horaria del negocio
- Convertir correctamente las horas
- Considerar horario de verano

---

## 🎯 Resumen del Flujo

```
1. CONFIGURACIÓN
   Usuario configura notificación recurrente
   ↓
2. ALMACENAMIENTO
   Se guarda en MongoDB con parámetros de recurrencia
   ↓
3. CRON JOB (cada hora)
   Verifica todas las notificaciones recurrentes
   ↓
4. VALIDACIÓN
   ¿Es el día correcto? ¿Es la hora correcta? ¿Está en el rango?
   ↓
5. EJECUCIÓN
   Obtiene destinatarios → Genera mensajes → Envía
   ↓
6. REGISTRO
   Guarda log de envío para auditoría
   ↓
7. REPETICIÓN
   El proceso se repite automáticamente según configuración
```

---

## ✅ Checklist de Implementación

- [x] Frontend: UI de configuración
- [x] Frontend: Validación de formularios
- [x] Frontend: Preview/Resumen
- [ ] Backend: Modelo de datos
- [ ] Backend: Cron job scheduler
- [ ] Backend: Lógica de verificación
- [ ] Backend: Sistema de envío
- [ ] Backend: Registro de logs
- [ ] Testing: Casos de prueba
- [ ] Testing: Validación de horarios
- [ ] Documentación: Guía de usuario

---

¡Sistema de notificaciones cíclicas listo para automatizar la comunicación con tus clientes! 🚀
