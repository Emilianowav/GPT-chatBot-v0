# 🎾 Workflow de Reservas - Club Juventus

## Objetivo
Flujo completo automatizado para reservar canchas por WhatsApp con consulta de disponibilidad, gestión de alternativas y pago con Mercado Pago.

---

## 🎯 Flujo Completo

### Trigger
El workflow se activa con palabras clave:
- `reservar`, `turno`, `cancha`, `reserva`
- `precio`, `precios`, `cuanto sale`
- `disponibilidad`

### Mensaje Inicial
```
¡Hola! 👋 Te ayudo a reservar tu cancha en Club Juventus.

¿Qué te gustaría hacer?
```

---

## 📋 Pasos del Workflow

### 1. **Recopilar - Acción Inicial**
Usuario elige entre:
- 🎾 Reservar cancha
- 💰 Consultar precios

**Variable guardada**: `accion_inicial`

---

### 2. **Ejecutar - Obtener Deportes**
Consulta a la API: `GET /deportes`

Obtiene lista de deportes disponibles (Paddle, Fútbol 5, Fútbol 7, Tenis)

**Variable guardada**: `deportes_disponibles`

---

### 3. **Recopilar - Elegir Deporte**
Muestra opciones dinámicas desde `deportes_disponibles`:
```
¿Qué deporte te gustaría jugar?
🎾 Paddle
⚽ Fútbol 5
⚽ Fútbol 7
🎾 Tenis
```

**Variable guardada**: `deporte_elegido`

---

### 4. **Recopilar - Elegir Fecha**
```
¿Para qué día querés reservar?

Podés escribir:
- Una fecha (ej: 25/12)
- "hoy", "mañana"
- Un día de la semana (ej: "viernes")
```

**Validación**:
- Fecha mínima: hoy
- Fecha máxima: +30 días

**Variable guardada**: `fecha_elegida`

---

### 5. **Recopilar - Duración del Partido**
```
¿Cuánto tiempo querés jugar?
⏱️ 1 hora (60 min)
⏱️ 1 hora y media (90 min)
⏱️ 2 horas (120 min)
```

**Variable guardada**: `duracion_elegida`

---

### 6. **Recopilar - Hora Preferida**
```
¿A qué hora preferís jugar? (formato 24hs, ej: 19:00)
```

**Validación**: Formato HH:MM

**Variable guardada**: `hora_elegida`

---

### 7. **Ejecutar - Consultar Disponibilidad**
Consulta a la API: `GET /disponibilidad`

**Parámetros**:
```json
{
  "fecha": "{{fecha_elegida}}",
  "deporte": "{{deporte_elegido}}",
  "duracion": "{{duracion_elegida}}",
  "hora_inicio": "{{hora_elegida}}"
}
```

**Variable guardada**: `canchas_disponibles`

**Si NO hay disponibilidad** → Ir a Paso 8 (Alternativas)

---

### 8. **Recopilar - Alternativas** (Solo si no hay disponibilidad)
```
😔 No hay canchas disponibles para {{fecha_elegida}} a las {{hora_elegida}}.

¿Qué querés hacer?
🕐 Probar otra hora → Vuelve al Paso 6
📅 Elegir otro día → Vuelve al Paso 4
👀 Ver horarios disponibles del día → Continúa al Paso 9
```

**Variable guardada**: `alternativa_elegida`

---

### 9. **Ejecutar - Disponibilidad del Día** (Solo si eligió ver disponibles)
Consulta a la API: `GET /disponibilidad`

**Parámetros**:
```json
{
  "fecha": "{{fecha_elegida}}",
  "deporte": "{{deporte_elegido}}",
  "duracion": "{{duracion_elegida}}"
}
```

Muestra todos los horarios disponibles del día seleccionado.

**Variable guardada**: `horarios_dia`

---

### 10. **Recopilar - Elegir Cancha**
```
¡Perfecto! Estas canchas están disponibles:

🎾 Cancha 1 - Paddle - Techada
💰 $15,000/hora
⏰ Horarios: 08:00, 09:00, 19:00, 20:00

🎾 Cancha 2 - Paddle - Descubierta
💰 $12,000/hora
⏰ Horarios: 08:00, 10:00, 18:00, 21:00

¿Cuál querés reservar?
```

**Variable guardada**: `cancha_elegida`

---

### 11. **Recopilar - Datos del Cliente**
```
Perfecto! Necesito algunos datos para confirmar tu reserva:
```

**Formulario**:
- **Nombre completo** (requerido)
- **Teléfono** con código de área (requerido, formato: 549XXXXXXXXXX)
- **Email** (requerido)

**Variable guardada**: `datos_cliente`

---

### 12. **Ejecutar - Crear Reserva**
Consulta a la API: `POST /bookings`

**Body**:
```json
{
  "cancha_id": "{{cancha_elegida}}",
  "fecha": "{{fecha_elegida}}",
  "hora_inicio": "{{hora_elegida}}",
  "duracion": "{{duracion_elegida}}",
  "cliente": {
    "nombre": "{{datos_cliente.nombre}}",
    "telefono": "{{datos_cliente.telefono}}",
    "email": "{{datos_cliente.email}}"
  },
  "origen": "whatsapp"
}
```

**Mensaje de éxito**:
```
✅ ¡Reserva creada exitosamente!

📋 Resumen:
🎾 Cancha: {{cancha_elegida}}
📅 Fecha: {{fecha_elegida}}
⏰ Hora: {{hora_elegida}}
⏱️ Duración: {{duracion_elegida}} min

💰 Total: ${{reserva_creada.precio_total}}
💵 Seña requerida: ${{reserva_creada.seña}}

Ahora te envío el link de pago...
```

**Variable guardada**: `reserva_creada`

---

### 13. **Ejecutar - Generar Link de Pago MP**
Genera preferencia de pago en Mercado Pago.

**Parámetros**:
```json
{
  "title": "Seña - Reserva Cancha {{deporte_elegido}}",
  "description": "Reserva para {{fecha_elegida}} a las {{hora_elegida}}",
  "unit_price": "{{reserva_creada.seña}}",
  "quantity": 1,
  "external_reference": "{{reserva_creada.id}}",
  "notification_url": "{{WEBHOOK_URL}}/mp/webhooks"
}
```

**Mensaje final**:
```
💳 Link de pago generado:

{{link_pago.init_point}}

⏰ Tenés 10 minutos para completar el pago.

Una vez confirmado el pago, tu reserva quedará confirmada! 🎉
```

**Variable guardada**: `link_pago`

---

## 🔄 Flujo de Alternativas

### Caso 1: No hay disponibilidad en la hora elegida

```
Usuario → Elige fecha y hora
    ↓
API consulta disponibilidad
    ↓
❌ No hay canchas disponibles
    ↓
Sistema ofrece 3 opciones:
    1. Probar otra hora → Vuelve a paso 6
    2. Elegir otro día → Vuelve a paso 4
    3. Ver horarios disponibles → Muestra todos los horarios del día
```

### Caso 2: Usuario elige ver horarios disponibles

```
Sistema consulta disponibilidad del día completo
    ↓
Muestra todas las canchas con sus horarios
    ↓
Usuario elige una cancha y hora
    ↓
Continúa con el flujo normal (paso 11)
```

---

## 💳 Integración Mercado Pago

### Webhook de Confirmación
Cuando el pago es aprobado, Mercado Pago envía una notificación al webhook:

```
POST /mp/webhooks
```

El sistema automáticamente:
1. Verifica el pago
2. Confirma la reserva en la API de Mis Canchas
3. Envía mensaje de confirmación al cliente por WhatsApp

---

## 🎯 Variables del Workflow

| Variable | Tipo | Descripción |
|----------|------|-------------|
| `accion_inicial` | string | "reservar" o "precios" |
| `deportes_disponibles` | array | Lista de deportes desde API |
| `deporte_elegido` | string | ID del deporte seleccionado |
| `fecha_elegida` | string | Fecha en formato YYYY-MM-DD |
| `duracion_elegida` | number | 60, 90 o 120 minutos |
| `hora_elegida` | string | Hora en formato HH:MM |
| `canchas_disponibles` | array | Canchas disponibles desde API |
| `alternativa_elegida` | string | "otra_hora", "otro_dia" o "ver_disponibles" |
| `horarios_dia` | array | Todos los horarios del día |
| `cancha_elegida` | string | ID de la cancha seleccionada |
| `datos_cliente` | object | {nombre, telefono, email} |
| `reserva_creada` | object | Datos de la reserva creada |
| `link_pago` | object | Link de pago de Mercado Pago |

---

## 🚀 Configuración y Pruebas

### 1. Verificar que el workflow esté activo
```bash
# En MongoDB
db.api_configurations.findOne(
  { nombre: /Mis Canchas/i },
  { "workflows.nombre": 1, "workflows.activo": 1 }
)
```

### 2. Reiniciar el backend
```bash
cd backend
npm run dev
```

### 3. Probar desde WhatsApp
Enviar cualquiera de estos mensajes:
- "quiero reservar"
- "turno"
- "cancha"
- "precio"

### 4. Configurar Webhook de Mercado Pago
En el panel de Mercado Pago, configurar:
- URL: `https://tu-dominio.com/api/mp/webhooks`
- Eventos: `payment`

---

## ✅ Estado de Implementación

- [x] Workflow creado con 13 pasos
- [x] Integración con API de Mis Canchas
- [x] Consulta de disponibilidad
- [x] Gestión de alternativas (otra hora/otro día)
- [x] Recopilación de datos del cliente
- [x] Creación de reserva
- [x] Generación de link de pago MP
- [ ] Webhook de confirmación de pago (pendiente)
- [ ] Pruebas end-to-end
- [ ] Configuración de Mercado Pago en producción

---

## 📝 Próximos Pasos

1. **Implementar webhook de Mercado Pago**
   - Recibir notificación de pago
   - Confirmar reserva en API
   - Enviar mensaje de confirmación

2. **Pruebas completas**
   - Probar flujo completo desde WhatsApp
   - Verificar alternativas cuando no hay disponibilidad
   - Probar pago con Mercado Pago

3. **Mejoras futuras**
   - Recordatorios automáticos 24hs antes
   - Cancelación de reservas
   - Reprogramación de turnos
   - Consulta de reservas existentes

---

*Documento creado: 23/12/2024*
*Workflow ID: workflow-juventus-reservas-1766508018188*
