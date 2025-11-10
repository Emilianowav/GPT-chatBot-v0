# 🤖 Configuración de Bots por Empresa

## 📋 Resumen

El sistema soporta dos tipos de bots para manejar conversaciones de WhatsApp:

1. **🤖 Bot de Pasos** - Sistema estructurado con flujos predefinidos (reserva, consulta, cancelación de turnos)
2. **🧠 Bot GPT** - Sistema inteligente con IA de OpenAI para conversaciones naturales

## 🔧 Cómo Funciona

### Decisión del Tipo de Bot

El sistema decide qué bot usar basándose en la colección `configuracionbots` en MongoDB:

```javascript
// Si ConfiguracionBot.activo === true
// → Usa Bot de Pasos (flujos estructurados)

// Si ConfiguracionBot.activo === false o no existe
// → Usa Bot GPT (conversación con IA)
```

### Flujo de Procesamiento

1. **Mensaje entrante** → `whatsappController.ts`
2. **FlowManager** verifica si hay un flujo activo
3. Si no hay flujo activo, evalúa qué flujo debe activarse:
   - `confirmacionTurnosFlow` (urgente)
   - `notificacionViajesFlow` (urgente)
   - `menuPrincipalFlow` (normal) ← **Solo si ConfiguracionBot.activo === true**
4. Si ningún flujo se activa → **Fallback a GPT** (futuro)

## 📊 Configuración Actual

### San Jose
- **Tipo**: 🤖 Bot de Pasos
- **Estado**: 🟢 ACTIVO
- **Razón**: Necesita flujos estructurados para gestión de turnos de transporte

### Paraná Lodge
- **Tipo**: 🧠 Bot GPT
- **Estado**: 🔴 Bot de pasos DESACTIVADO
- **Razón**: Necesita conversaciones más naturales y flexibles para consultas de alojamiento

### Otras Empresas
- **Tipo**: 🧠 Bot GPT (por defecto)
- **Estado**: 🔴 Bot de pasos DESACTIVADO

## 🛠️ Comandos de Administración

### Verificar y Corregir Configuración

```bash
npm run corregir:bot-empresas
```

Este script:
- ✅ Verifica todas las empresas en la BD
- ✅ Muestra el estado actual de cada bot
- ✅ Corrige automáticamente la configuración según las reglas definidas
- ✅ Crea configuración si no existe

### Resultado Esperado

```
📊 RESUMEN FINAL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Paraná Lodge:
   Tipo: 🧠 GPT
   Estado bot de pasos: 🔴 DESACTIVADO

San Jose:
   Tipo: 🤖 Bot de Pasos
   Estado bot de pasos: 🟢 ACTIVO
```

## 🔄 Cambiar Configuración Manualmente

### Activar Bot de Pasos

```javascript
// En MongoDB
db.configuracionbots.updateOne(
  { empresaId: "NombreEmpresa" },
  { $set: { activo: true } }
)
```

### Desactivar Bot de Pasos (usar GPT)

```javascript
// En MongoDB
db.configuracionbots.updateOne(
  { empresaId: "NombreEmpresa" },
  { $set: { activo: false } }
)
```

### Crear Nueva Configuración

```javascript
// En MongoDB
db.configuracionbots.insertOne({
  empresaId: "NombreEmpresa",
  activo: false, // true para bot de pasos, false para GPT
  mensajeBienvenida: "¡Hola! 👋 ¿En qué puedo ayudarte?",
  mensajeDespedida: "¡Hasta pronto! 👋",
  mensajeError: "❌ No entendí tu respuesta.",
  timeoutMinutos: 10,
  flujos: {
    crearTurno: { nombre: "Crear Turno", pasos: [] },
    consultarTurnos: { nombre: "Consultar Turnos", pasos: [] },
    cancelarTurno: { nombre: "Cancelar Turno", pasos: [] }
  },
  horariosAtencion: {
    activo: false,
    inicio: "00:00",
    fin: "23:59",
    diasSemana: [0,1,2,3,4,5,6]
  },
  requiereConfirmacion: true,
  permiteCancelacion: true,
  notificarAdmin: true
})
```

## 📝 Archivos Relevantes

### Modelos
- `src/modules/calendar/models/ConfiguracionBot.ts` - Modelo de configuración del bot

### Controladores
- `src/controllers/whatsappController.ts` - Punto de entrada de mensajes
- `src/modules/calendar/controllers/botController.ts` - API REST para configuración

### Flujos
- `src/flows/FlowManager.ts` - Motor de gestión de flujos
- `src/flows/menuPrincipalFlow.ts` - Flujo principal del bot de pasos
- `src/flows/confirmacionTurnosFlow.ts` - Flujo de confirmación
- `src/flows/notificacionViajesFlow.ts` - Flujo de notificaciones

### Scripts
- `scripts/corregirBotEmpresas.ts` - Script de corrección automática

## ⚠️ Notas Importantes

1. **empresaId es String (nombre)**: Siempre usar `empresa.nombre`, NUNCA `empresa._id`
2. **Sin configuración = GPT**: Si no existe `ConfiguracionBot`, el sistema usará GPT por defecto
3. **Prioridad de flujos**: Los flujos urgentes (confirmación, notificaciones) siempre tienen prioridad sobre el menú principal
4. **Cambios en tiempo real**: Los cambios en la configuración se aplican inmediatamente sin necesidad de reiniciar el servidor

## ✅ Integración Completa con GPT - IMPLEMENTADO

El sistema ahora incluye un flujo GPT completamente funcional que actúa como fallback.

**Implementación**:
1. ✅ `flows/gptFlow.ts` - Flujo GPT implementado
2. ✅ Registrado con prioridad baja en `flows/index.ts`
3. ✅ Se activa automáticamente cuando ningún otro flujo maneja el mensaje

**Características del GPT Flow**:
- 🧠 Usa OpenAI GPT-3.5-turbo o GPT-4 según configuración de la empresa
- 💾 Mantiene historial de conversación (últimos 20 mensajes)
- 📊 Registra métricas (tokens, costos, interacciones)
- 🎯 Solo se activa si el bot de pasos está desactivado
- 🔄 Cada mensaje es independiente (no tiene estados intermedios)

**Flujo de Activación**:
1. Mensaje entrante → FlowManager
2. Si `ConfiguracionBot.activo === false` → menuPrincipalFlow NO se activa
3. Si ningún flujo urgente maneja el mensaje → gptFlow se activa
4. GPT procesa el mensaje y responde naturalmente

## 📞 Soporte

Si tienes problemas con la configuración de bots:

1. Ejecuta `npm run corregir:bot-empresas` para verificar
2. Revisa los logs del servidor para ver qué flujo se está activando
3. Verifica en MongoDB que la configuración sea correcta
4. Asegúrate de que `empresaId` coincida exactamente con `empresa.nombre`
