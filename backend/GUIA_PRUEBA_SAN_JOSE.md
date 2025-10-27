# 🚀 Guía de Prueba - San Jose Viajes

## ✅ Onboarding Completado

La empresa **San Jose** ha sido dada de alta exitosamente con todas las configuraciones necesarias.

---

## 📊 Configuración Actual

### 🏢 Empresa
- **Nombre:** San Jose
- **Categoría:** Viajes
- **Teléfono:** +5493794044092
- **Email:** contacto@sanjoseviajes.com
- **Plan:** Standard

### 📱 WhatsApp Business
- **Number ID:** 888481464341184
- **WABA ID:** 772636765924023
- **Verify Code:** 643175

### 👤 Usuario Administrador
- **Username:** `sanjose_admin`
- **Password:** `SanJose2025!`
- **Email:** admin@sanjoseviajes.com
- **Rol:** Admin

### 📅 Módulo de Calendario
- ✅ **Activo**
- **Tipo:** Viajes
- **Nomenclatura:**
  - Turno → Viaje
  - Agente → Chofer
  - Cliente → Pasajero

#### Campos Personalizados:
1. **Origen** (texto, requerido)
2. **Destino** (texto, requerido)
3. **Cantidad de pasajeros** (número, requerido, 1-50)
4. **Tipo de viaje** (select, requerido)
   - Solo ida
   - Ida y vuelta
   - Excursión
5. **Observaciones** (textarea, opcional)

#### Choferes Creados:
1. **Juan Pérez** - Especialidad: Viajes largos
2. **María González** - Especialidad: Excursiones

### 🤖 Bot de Pasos
- ✅ **Activo**
- **Horario de atención:** 06:00 - 22:00 (todos los días)
- **Timeout:** 15 minutos de inactividad
- **Funciones disponibles:**
  1. Reservar un viaje
  2. Consultar mis viajes
  3. Cancelar un viaje

#### Notificaciones:
- Recordatorio 24 horas antes del viaje (20:00)
- Requiere confirmación del pasajero

---

## 🧪 Cómo Probar el Bot

### 1. Acceso al Dashboard

1. Ir a: https://gpt-chatbot-v0.onrender.com
2. Hacer login con:
   - Username: `sanjose_admin`
   - Password: `SanJose2025!`
3. Navegar al módulo de Calendario

### 2. Probar el Bot de WhatsApp

#### Paso 1: Enviar mensaje inicial
Envía cualquier mensaje al número: **+5493794044092**

**Respuesta esperada:**
```
¡Hola! 👋 Soy el asistente virtual de *San Jose Viajes* 🚌

¿En qué puedo ayudarte?

1️⃣ Reservar un viaje
2️⃣ Consultar mis viajes
3️⃣ Cancelar un viaje

Escribe el número de la opción que necesites.
```

#### Paso 2: Reservar un viaje (Opción 1)

**Tú escribes:** `1`

**Bot responde:**
```
📅 Perfecto! Vamos a agendar tu Viaje.

📆 Por favor, envíame la fecha deseada en formato DD/MM/AAAA
Ejemplo: 25/10/2025
```

**Tú escribes:** `30/10/2025`

**Bot responde:**
```
🕐 Excelente! Ahora dime la hora deseada en formato HH:MM
Ejemplo: 14:30
```

**Tú escribes:** `08:00`

**Bot responde:**
```
👤 Selecciona un Chofer:

1️⃣ Juan Pérez - Viajes largos
2️⃣ María González - Excursiones

Escribe el número de tu elección.
```

**Tú escribes:** `1`

**Bot responde:**
```
📝 Origen *
💡 Ej: Buenos Aires
```

**Tú escribes:** `Buenos Aires`

**Bot responde:**
```
📝 Destino *
💡 Ej: Córdoba
```

**Tú escribes:** `Córdoba`

**Bot responde:**
```
📝 Cantidad de pasajeros *
💡 Ej: 2
```

**Tú escribes:** `3`

**Bot responde:**
```
📝 Tipo de viaje *
```

**Tú escribes:** `Ida y vuelta`

**Bot responde:**
```
📝 Observaciones
💡 Información adicional sobre el viaje
```

**Tú escribes:** `Viaje familiar`

**Bot responde:**
```
📋 *Resumen de tu turno:*

📅 Fecha: 30/10/2025
🕐 Hora: 08:00
👤 Chofer: Juan Pérez

📝 *Detalles:*
• Origen: Buenos Aires
• Destino: Córdoba
• Cantidad de pasajeros: 3
• Tipo de viaje: Ida y vuelta
• Observaciones: Viaje familiar

¿Confirmas estos datos?
1️⃣ Sí, confirmar
2️⃣ No, cancelar
```

**Tú escribes:** `1`

**Bot responde:**
```
✅ *¡Listo!* Tu Viaje ha sido agendado.

📅 30/10/2025 a las 08:00

📱 Recibirás una confirmación antes de tu Viaje.

¡Hasta pronto! 👋
```

#### Paso 3: Consultar viajes (Opción 2)

**Tú escribes:** `2`

**Bot responde:**
```
📅 *Tus próximos turnos:*

1️⃣ 30/10/2025 - 08:00
   Estado: pendiente
```

#### Paso 4: Cancelar viaje (Opción 3)

**Tú escribes:** `3`

**Bot responde:**
```
❌ *Cancelar turno*

Selecciona el turno que deseas cancelar:

1️⃣ 30/10/2025 - 08:00

Escribe el número del turno a cancelar.
```

**Tú escribes:** `1`

**Bot responde:**
```
✅ Turno cancelado exitosamente.

¡Hasta pronto! 👋
```

---

## 🔍 Verificar en el Dashboard

1. Ir a **Calendario** en el dashboard
2. Deberías ver el viaje creado con todos los datos:
   - Fecha y hora
   - Chofer asignado (Juan Pérez)
   - Cliente (con el número de WhatsApp)
   - Datos personalizados (Origen, Destino, Pasajeros, etc.)

---

## 🐛 Solución de Problemas

### El bot no responde
1. Verificar que el webhook esté configurado en Meta
2. Verificar que el servidor backend esté corriendo
3. Revisar los logs del servidor

### El bot responde pero no guarda los turnos
1. Verificar conexión a MongoDB
2. Revisar logs del servicio `botTurnosService`
3. Verificar que la configuración del módulo esté activa

### Errores de validación
1. Verificar formato de fecha: DD/MM/AAAA
2. Verificar formato de hora: HH:MM
3. Verificar que los campos requeridos estén completos

---

## 📝 Notas Importantes

1. **Horario de atención:** El bot solo responde entre 06:00 y 22:00. Fuera de ese horario, enviará un mensaje informativo.

2. **Timeout:** Si el usuario no responde en 15 minutos, la conversación se reinicia.

3. **Notificaciones:** El sistema enviará recordatorios automáticos 24 horas antes del viaje a las 20:00.

4. **Confirmación:** Los viajes requieren confirmación del pasajero antes de la fecha programada.

---

## 🚀 Próximos Pasos

1. ✅ Empresa creada
2. ✅ Módulo de calendario configurado
3. ✅ Bot de pasos activo
4. ✅ Choferes creados
5. ⏳ **Configurar webhook en Meta** (pendiente)
6. ⏳ **Probar flujo completo** (pendiente)
7. ⏳ **Verificar guardado de turnos** (pendiente)

---

## 📞 Soporte

Si tienes algún problema o pregunta:
- Email: soporte@neural-crm.com
- Documentación: https://docs.neural-crm.com

---

**¡Listo para probar! 🎉**
