# 🔔 Flujo de Confirmación de Turnos

## 📋 Descripción General

El flujo de confirmación de turnos permite enviar recordatorios automáticos a los clientes antes de sus turnos agendados, solicitando confirmación de asistencia.

## 🏗️ Arquitectura

### 1. Configuración (ConfiguracionModulo)

El flujo se configura en `ConfiguracionModulo` dentro del array `notificaciones`:

```typescript
{
  empresaId: "San Jose",
  notificaciones: [
    {
      activa: true,                    // ✅ Flujo activado
      tipo: 'confirmacion',            // Tipo de notificación
      destinatario: 'cliente',         // A quién se envía
      momento: 'noche_anterior',       // Cuándo se envía
      horaEnvio: '22:00',             // Hora específica
      plantillaMensaje: '...',        // Mensaje a enviar
      requiereConfirmacion: true,     // Si espera respuesta
      mensajeConfirmacion: '...',     // Mensaje al confirmar
      mensajeCancelacion: '...'       // Mensaje al cancelar
    }
  ]
}
```

### 2. Flujo (confirmacionTurnosFlow.ts)

**Ubicación**: `backend/src/flows/confirmacionTurnosFlow.ts`

**Características**:
- **Prioridad**: `urgente` (se ejecuta antes que otros flujos)
- **Activación**: Programática (no se activa por palabras clave)
- **Estados**: `esperando_confirmacion`

**Flujo de ejecución**:

```
1. Script/Servicio → Activa flujo con turnoId
2. Flujo → Envía mensaje con botones interactivos
   ├─ ✅ Confirmar
   ├─ ❌ Cancelar
   └─ 🔄 Reprogramar
3. Usuario → Responde (botón o texto)
4. Flujo → Procesa respuesta y actualiza turno
5. Flujo → Envía mensaje de confirmación
6. Flujo → Finaliza
```

### 3. Servicio (confirmacionTurnosService.ts)

**Ubicación**: `backend/src/modules/calendar/services/confirmacionTurnosService.ts`

**Funciones principales**:
- `enviarNotificacionesConfirmacion()`: Busca turnos que necesitan confirmación y envía notificaciones
- `procesarConfirmacion()`: Procesa la respuesta del cliente
- `actualizarEstadoTurno()`: Actualiza el estado del turno según la respuesta

### 4. Script de Envío Automático

**Ubicación**: `backend/src/scripts/enviarNotificacionesDiarias.ts`

**Ejecución**: Cron job diario (configurado en servidor)

**Lógica**:
1. Se ejecuta a la hora configurada (ej: 22:00)
2. Busca turnos del día siguiente
3. Filtra turnos que no han sido confirmados
4. Envía notificación a cada cliente
5. Registra el envío en el turno

## 🎯 Momentos de Envío

### Opciones disponibles:

1. **`noche_anterior`**: 22:00 del día anterior
2. **`mismo_dia`**: Hora específica del mismo día
3. **`horas_antes_turno`**: X horas antes del turno (ej: 2h antes)
4. **`dia_antes_turno`**: X días antes a hora específica
5. **`hora_exacta`**: Hora exacta configurada
6. **`personalizado`**: Configuración custom

## 📱 Frontend

### Página de Administración

**Ubicación**: `front_crm/bot_crm/src/app/dashboard/calendario/flujos-activos/page.tsx`

**Características**:
- ✅ Muestra estado del flujo (activo/inactivo)
- ✅ Lee configuración desde `ConfiguracionModulo.notificaciones`
- ✅ Permite ver detalles del flujo
- ✅ Permite editar configuración (próximamente)

**Corrección implementada**:
```typescript
// ANTES (❌ Incorrecto):
activo: configuracion?.horariosAtencion?.activo ?? false

// AHORA (✅ Correcto):
const notificacionConfirmacion = configModulo?.notificaciones?.find(n => n.tipo === 'confirmacion');
activo: notificacionConfirmacion?.activa ?? false
```

## 🔍 Verificación

### Comando de verificación:

```bash
npm run verificar:flujo-confirmacion
```

**Script**: `backend/scripts/verificarFlujoConfirmacion.ts`

**Verifica**:
1. ✅ Existencia de `ConfiguracionBot`
2. ✅ Estado de `ConfiguracionBot.activo`
3. ✅ Existencia de `ConfiguracionModulo`
4. ✅ Estado de `ConfiguracionModulo.activo`
5. ✅ Notificaciones configuradas
6. ✅ Notificación de tipo `confirmacion`
7. ✅ Estado de la notificación (`activa`)

### Salida esperada:

```
✅ ConfiguracionBot ACTIVO
✅ ConfiguracionModulo ACTIVO
✅ Notificación de confirmación ACTIVA
```

## 📝 Edición del Flujo

### Backend

**Archivo**: `backend/src/flows/confirmacionTurnosFlow.ts`

**Puedes editar**:
- Mensajes de respuesta
- Lógica de procesamiento
- Estados del flujo
- Botones interactivos

**Ejemplo - Cambiar mensaje de confirmación**:

```typescript
// Línea 73-77
await enviarMensajeWhatsAppTexto(
  telefono,
  '✅ ¡Perfecto! Tu turno ha sido confirmado. Te esperamos.', // ← Editar aquí
  context.phoneNumberId
);
```

### Configuración (Base de datos)

**Editar notificación**:

```javascript
// Conectar a MongoDB
use neural_chatbot

// Actualizar notificación
db.configuraciones_modulo.updateOne(
  { 
    empresaId: "San Jose",
    "notificaciones.tipo": "confirmacion"
  },
  {
    $set: {
      "notificaciones.$.plantillaMensaje": "Nuevo mensaje aquí",
      "notificaciones.$.horaEnvio": "21:00",
      "notificaciones.$.activa": true
    }
  }
)
```

## 🚀 Activar/Desactivar Flujo

### Opción 1: Desde MongoDB

```javascript
// Desactivar
db.configuraciones_modulo.updateOne(
  { 
    empresaId: "San Jose",
    "notificaciones.tipo": "confirmacion"
  },
  {
    $set: { "notificaciones.$.activa": false }
  }
)

// Activar
db.configuraciones_modulo.updateOne(
  { 
    empresaId: "San Jose",
    "notificaciones.tipo": "confirmacion"
  },
  {
    $set: { "notificaciones.$.activa": true }
  }
)
```

### Opción 2: Desde Frontend (próximamente)

En la página de "Flujos Activos" habrá un toggle para activar/desactivar.

## 🐛 Troubleshooting

### Problema: Flujo aparece desactivado en frontend

**Causa**: Frontend estaba leyendo campo incorrecto

**Solución**: ✅ Ya corregido en commit `a8c1de5`

### Problema: No se envían notificaciones

**Verificar**:
1. ✅ Notificación está activa en BD
2. ✅ Cron job está corriendo
3. ✅ Hay turnos para el día siguiente
4. ✅ Turnos no están confirmados
5. ✅ Clientes tienen teléfono válido

**Comando de verificación**:
```bash
npm run verificar:flujo-confirmacion
```

### Problema: Flujo no responde a confirmaciones

**Verificar**:
1. ✅ FlowManager está registrando el flujo
2. ✅ Estado de conversación está guardado
3. ✅ Respuesta del usuario es válida

**Logs a revisar**:
```
🔔 [ConfirmacionTurnos] Iniciando flujo para {telefono}
📥 [ConfirmacionTurnos] Estado: esperando_confirmacion, Mensaje: {mensaje}
✅ [ConfirmacionTurnos] Flujo finalizado para {telefono}
```

## 📚 Archivos Relacionados

### Backend
- `src/flows/confirmacionTurnosFlow.ts` - Flujo principal
- `src/modules/calendar/services/confirmacionTurnosService.ts` - Servicio
- `src/modules/calendar/models/ConfiguracionModulo.ts` - Modelo de configuración
- `src/scripts/enviarNotificacionesDiarias.ts` - Script de envío automático
- `scripts/verificarFlujoConfirmacion.ts` - Script de verificación

### Frontend
- `src/app/dashboard/calendario/flujos-activos/page.tsx` - Página de administración
- `src/hooks/useConfiguracion.ts` - Hook para configuración del módulo
- `src/lib/configuracionApi.ts` - API de configuración

## 🎯 Próximas Mejoras

1. ✅ Verificación de estado implementada
2. ✅ Corrección de frontend implementada
3. 🔄 Editor visual de flujo (en desarrollo)
4. 🔄 Toggle de activación desde frontend (en desarrollo)
5. 🔄 Configuración de horarios desde frontend (en desarrollo)
6. 🔄 Historial de notificaciones enviadas (en desarrollo)

## 📞 Comandos Útiles

```bash
# Verificar estado del flujo
npm run verificar:flujo-confirmacion

# Ver configuración de empresa
npm run corregir:bot-empresas

# Limpiar estados de conversación
npm run limpiar:estados

# Ver historial de contacto
npm run ver:historial
```

---

**Última actualización**: 4 de noviembre de 2025
**Estado**: ✅ Funcionando correctamente
