# 🔔 Sistema de Confirmación Interactiva de Turnos

## 🎯 Objetivo

Crear un sistema robusto de confirmación de turnos que permita al cliente:
1. Confirmar todos los turnos con un solo mensaje
2. Editar turnos individuales (origen, destino, hora)
3. Cancelar turnos específicos
4. Todo a través de WhatsApp de forma conversacional

## ✅ Implementación Completa

### 📦 Archivos Creados/Modificados:

#### **Backend:**

1. **`confirmacionTurnosService.ts`** (NUEVO - 500+ líneas)
   - Manejo de sesiones de confirmación
   - Procesamiento de respuestas del cliente
   - Edición de campos (origen, destino, hora)
   - Confirmación/cancelación de turnos
   - Limpieza automática de sesiones antiguas

2. **`flujoNotificacionesService.ts`** (MODIFICADO)
   - Integración del nuevo sistema de confirmación
   - Fallback al sistema antiguo si falla

#### **Frontend:**

3. **`ModalNotificacion.tsx`** (MODIFICADO)
   - Plantilla actualizada con opciones 1️⃣ y 2️⃣
   - Mensaje optimizado para múltiples turnos

## 🔄 Flujo Completo

### 1. **Notificación Inicial** (22:00 noche anterior)

```
🚗 Recordatorio de viaje para mañana

📍 Origen: Av. Corrientes 1234
📍 Destino: Av. Santa Fe 5678
🕐 Hora: 14:30
👥 Pasajeros: 2

━━━━━━━━━━━━━━━━━━

¿Qué deseas hacer?

1️⃣ Confirmar el viaje
2️⃣ Editar este viaje

Responde con el número de la opción.
```

### 2. **Múltiples Turnos**

```
🚗 Recordatorio de viajes para mañana

━━━━━━━━━━━━━━━━━━
Viaje 1

📍 Origen: Av. Corrientes 1234
📍 Destino: Av. Santa Fe 5678
🕐 Hora: 14:30
👥 Pasajeros: 2

━━━━━━━━━━━━━━━━━━
Viaje 2

📍 Origen: Palermo
📍 Destino: Belgrano
🕐 Hora: 18:00
👥 Pasajeros: 1

━━━━━━━━━━━━━━━━━━

¿Qué deseas hacer?

1️⃣ Confirmar todos los viajes
2️⃣ Editar un viaje específico

Responde con el número de la opción.
```

### 3. **Respuestas del Cliente**

#### Opción 1: Confirmar Todos
```
Cliente: 1
Bot: ✅ ¡Perfecto! Todos tus 2 viajes han sido confirmados.

¡Nos vemos pronto! 🚗
```

#### Opción 2: Editar Viaje
```
Cliente: 2
Bot: ✏️ Editando Viaje #1

📍 Origen actual: Av. Corrientes 1234
📍 Destino actual: Av. Santa Fe 5678
🕐 Hora actual: 14:30

¿Qué deseas modificar?

1️⃣ Cambiar origen
2️⃣ Cambiar destino
3️⃣ Cambiar hora
4️⃣ Confirmar este viaje
5️⃣ Cancelar este viaje
0️⃣ Volver atrás

Escribe el número de la opción.
```

### 4. **Edición de Campos**

#### Cambiar Origen:
```
Cliente: 1
Bot: 📍 Nuevo origen

Escribe la dirección de origen del viaje:

Cliente: Av. Libertador 2000
Bot: ✅ Origen actualizado a: Av. Libertador 2000

[Vuelve a mostrar menú de edición]
```

#### Cambiar Hora:
```
Cliente: 3
Bot: 🕐 Nueva hora

Escribe la hora en formato HH:MM (ej: 14:30):

Cliente: 15:00
Bot: ✅ Hora actualizada a: 15:00

[Vuelve a mostrar menú de edición]
```

## 🛠️ Características Técnicas

### Manejo de Sesiones

```typescript
interface SesionConfirmacion {
  clienteId: string;
  telefono: string;
  turnos: any[];
  paso: 'inicial' | 'seleccion_turno' | 'edicion_campo';
  turnoEditando?: number;
  campoEditando?: 'origen' | 'destino' | 'hora';
  timestamp: Date;
}
```

- **Almacenamiento**: Map en memoria (migrar a Redis en producción)
- **Timeout**: 10 minutos de inactividad
- **Limpieza**: Automática cada 5 minutos

### Validaciones

1. **Formato de Hora**: Regex `/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/`
2. **Números de Opción**: Validación de rango según contexto
3. **Turnos Existentes**: Verificación de estado y permisos

### Estados del Turno

```typescript
enum EstadoTurno {
  PENDIENTE = 'pendiente',
  CONFIRMADO = 'confirmado',
  NO_CONFIRMADO = 'no_confirmado',
  COMPLETADO = 'completado',
  CANCELADO = 'cancelado'
}
```

## 📊 Registro de Notificaciones

Cada turno guarda un historial de notificaciones:

```typescript
turno.notificaciones.push({
  tipo: 'confirmacion',
  enviada: true,
  fechaEnvio: new Date(),
  respuesta: 'CONFIRMADO', // o 'EDITADO', 'CANCELADO'
  fechaRespuesta: new Date()
});
```

## 🔐 Seguridad

1. **Validación de Cliente**: Solo el cliente dueño del turno puede editarlo
2. **Timeout de Sesión**: 10 minutos máximo
3. **Limpieza Automática**: Previene acumulación de memoria
4. **Validación de Datos**: Todos los inputs son validados

## 🚀 Integración

### En el Webhook de WhatsApp:

```typescript
// 1. Procesar confirmación PRIMERO
const resultadoConfirmacion = await confirmacionTurnosService
  .procesarRespuestaConfirmacion(telefono, mensaje, empresaId);

if (resultadoConfirmacion.procesado) {
  // El sistema manejó el mensaje
  return true;
}

// 2. Continuar con flujo normal si no fue procesado
```

### Enviar Notificación:

```typescript
await confirmacionTurnosService.enviarNotificacionConfirmacion(
  clienteId,
  turnos, // Array de turnos
  empresaId
);
```

## 📈 Mejoras Implementadas

### Antes:
- ❌ Solo "SÍ" o "NO"
- ❌ No se podía editar
- ❌ Mensaje genérico sin opciones
- ❌ Confusión con múltiples turnos

### Después:
- ✅ Opciones numeradas claras (1️⃣, 2️⃣)
- ✅ Edición completa de campos
- ✅ Manejo de múltiples turnos
- ✅ Confirmación turno por turno
- ✅ Cancelación individual
- ✅ Validaciones robustas
- ✅ Sesiones con timeout

## 🎯 Casos de Uso

### Caso 1: Cliente Confirma Todo
```
Notificación → Cliente: "1" → Todos confirmados → Fin
```

### Caso 2: Cliente Edita Origen
```
Notificación → Cliente: "2" → Menú edición → Cliente: "1" 
→ Solicita origen → Cliente: "Nueva dirección" → Origen actualizado 
→ Menú edición → Cliente: "4" → Confirmado → Fin
```

### Caso 3: Cliente Cancela Viaje
```
Notificación → Cliente: "2" → Menú edición → Cliente: "5" 
→ Viaje cancelado → Fin
```

### Caso 4: Múltiples Turnos
```
Notificación (2 turnos) → Cliente: "2" → Lista turnos 
→ Cliente: "1" (selecciona turno 1) → Menú edición 
→ Cliente: "3" (cambiar hora) → Solicita hora 
→ Cliente: "15:00" → Hora actualizada → Menú edición 
→ Cliente: "4" → Confirmado → Pregunta si editar otro 
→ Cliente: "1" → Confirma todos los restantes → Fin
```

## 🔧 Configuración

### Variables de Entorno:
```env
# No requiere configuración adicional
# Usa la configuración existente de WhatsApp
```

### Dependencias:
- `TurnoModel`: Modelo de turnos
- `ClienteModel`: Modelo de clientes
- `EmpresaModel`: Configuración de empresa
- `metaService`: Envío de mensajes WhatsApp

## 📝 Notas Importantes

1. **Horario 24h**: Todas las horas en formato 24 horas (HH:MM)
2. **Timezone**: Se respeta el timezone de la empresa
3. **Múltiples Turnos**: Se agrupan por cliente automáticamente
4. **Sesiones**: Se limpian automáticamente después de 10 minutos
5. **Fallback**: Si el nuevo sistema falla, continúa con el flujo antiguo

## ✅ Testing

### Casos a Probar:

1. ✅ Confirmar un solo turno con "1"
2. ✅ Confirmar múltiples turnos con "1"
3. ✅ Editar origen de un turno
4. ✅ Editar destino de un turno
5. ✅ Editar hora de un turno (validar formato)
6. ✅ Cancelar un turno
7. ✅ Timeout de sesión (esperar 10 minutos)
8. ✅ Respuestas inválidas (números fuera de rango)
9. ✅ Formato de hora inválido
10. ✅ Cliente sin turnos pendientes

## 🎉 Resultado Final

Un sistema completo, robusto y user-friendly que permite a los clientes:
- ✅ Confirmar turnos fácilmente
- ✅ Editar detalles sin llamar
- ✅ Cancelar si es necesario
- ✅ Todo desde WhatsApp
- ✅ Experiencia conversacional natural
- ✅ Sin errores ni confusiones

**Estado**: ✅ Implementado y listo para usar
