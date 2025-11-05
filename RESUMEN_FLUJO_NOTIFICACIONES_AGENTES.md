# 📅 Resumen: Flujo de Notificaciones Diarias para Agentes

## ✅ Implementación Completada

Se ha creado exitosamente un **flujo automático de notificaciones diarias** para agentes en la sección de Flujos Automáticos del sistema.

## 🎯 Funcionalidad Principal

**Recordatorio automático de reservas diarias**: Los agentes reciben un mensaje de WhatsApp al inicio de su horario de trabajo con todas las reservas programadas para ese día.

## 📋 Características Implementadas

### 1. **Configuración Flexible**
- ⏰ Hora de envío personalizable por empresa
- 📅 Frecuencia configurable (diaria, semanal, mensual, personalizada)
- 👥 Opciones de destinatarios (todos, solo con turnos, específicos)

### 2. **Filtros Avanzados**
- 📆 Rango horario (hoy, mañana, próximos días, personalizado)
- 🕐 Filtro de horario del día (mañana, tarde, noche, personalizado)
- 📊 Filtro por estado (pendiente, confirmado, en curso)
- 🏷️ Filtro por tipo de reserva

### 3. **Personalización del Mensaje**
- 📝 Plantilla editable con variables
- ✅ Detalles configurables (origen, destino, cliente, teléfono, notas)
- 🎨 Formato profesional y claro

### 4. **Integración Completa**
- 🔄 Visible en la sección de Flujos Automáticos
- ⚙️ Configurable desde el frontend
- 🔌 Activación/desactivación con un clic
- 📊 Estadísticas incluidas

## 📁 Archivos Modificados/Creados

### Backend - Controladores
- ✅ `src/modules/calendar/controllers/flujosController.ts`
  - Agregado flujo de notificación diaria en `obtenerTodosLosFlujos()`
  - Soporte para actualizar configuración
  - Soporte para activar/desactivar

### Backend - Aplicación Principal
- ✅ `src/app.ts`
  - Importado servicio de notificaciones diarias
  - Agregado cron job que se ejecuta cada minuto
  - Verifica hora configurada antes de enviar

### Backend - Servicios
- ✅ `src/services/notificacionesDiariasAgentes.ts`
  - Mejorada verificación de hora de envío
  - Optimizado para no saturar logs

### Documentación
- ✅ `backend/FLUJO_NOTIFICACIONES_DIARIAS_AGENTES.md`
  - Documentación completa del flujo
  - Ejemplos de uso
  - Guía de configuración

### Scripts de Utilidad
- ✅ `src/scripts/configurarNotificacionDiariaAgentes.ts`
  - Script para configurar rápidamente el flujo
  - Configuración predeterminada lista para usar

- ✅ `src/scripts/testNotificacionesDiariasAgentes.ts`
  - Script para probar el envío de notificaciones
  - Útil para debugging

### Configuración
- ✅ `package.json`
  - Agregados comandos npm para configurar y probar

## 🚀 Cómo Usar

### Desde la Terminal (Configuración Inicial)

```bash
# 1. Configurar la notificación diaria para una empresa
npm run config:notif-diaria-agentes

# 2. Probar el envío (envía notificaciones reales)
npm run test:notif-diaria-agentes
```

### Desde el Frontend (Gestión Continua)

**Endpoint:** `/api/flujos/:empresaId`

**Acciones disponibles:**
1. **Ver configuración**: GET request muestra el flujo `notificacionDiariaAgentes`
2. **Activar/Desactivar**: PATCH con `tipo: 'notificacion_diaria_agentes'`
3. **Actualizar configuración**: PUT con nueva configuración

## 📊 Estructura del Flujo en la Respuesta API

```json
{
  "flujos": {
    "notificaciones": [...],
    "notificacionDiariaAgentes": {
      "id": "notificacion_diaria_agentes",
      "nombre": "Recordatorio Diario de Reservas para Agentes",
      "descripcion": "Envía un resumen diario a los agentes...",
      "activa": true,
      "envio": {
        "horaEnvio": "06:00",
        "frecuencia": {...},
        "enviarATodos": false,
        "agentesEspecificos": []
      },
      "filtros": {...},
      "incluirDetalles": {...},
      "plantillaMensaje": "Buenos días {agente}!...",
      "flujoEjecucion": {
        "pasos": [...]
      }
    },
    "especiales": [...],
    "estadisticas": {
      "totalNotificaciones": 2,
      "notificacionesActivas": 2,
      "notificacionDiariaAgentesActiva": true,
      "totalFlujos": 4
    }
  }
}
```

## 🔄 Flujo de Ejecución Automática

```
┌─────────────────────────────────────────┐
│  Cron Job (cada minuto)                 │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Buscar empresas con notificación       │
│  diaria activa                          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Para cada empresa:                     │
│  ¿Es la hora configurada?               │
└──────────────┬──────────────────────────┘
               │
         Sí   │   No
      ┌───────┴───────┐
      ▼               ▼
┌─────────┐    ┌──────────┐
│ Enviar  │    │ Saltar   │
└─────────┘    └──────────┘
      │
      ▼
┌─────────────────────────────────────────┐
│  Verificar frecuencia (diaria/semanal)  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Buscar agentes (todos/con turnos)      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Para cada agente:                      │
│  - Obtener reservas del día             │
│  - Aplicar filtros                      │
│  - Generar mensaje personalizado        │
│  - Enviar vía WhatsApp                  │
└─────────────────────────────────────────┘
```

## 💡 Ejemplo de Mensaje Enviado

```
Buenos días Juan Pérez! 🌅
Estos son tus viajes de hoy:

📋 *3 Viajes:*

1. 🕐 08:00
   María González
   📍 Origen: Av. Corrientes 1234
   🎯 Destino: Aeropuerto Ezeiza

2. 🕐 12:30
   Carlos Rodríguez
   📍 Origen: San Martín 567
   🎯 Destino: Terminal de Ómnibus

3. 🕐 18:00
   Ana López
   📍 Origen: Hotel Sheraton
   🎯 Destino: Puerto Madero

¡Que tengas un excelente día! 💪
```

## ⚙️ Configuración Predeterminada

Al ejecutar el script de configuración, se aplican estos valores:

- ✅ **Activa**: Sí
- ⏰ **Hora de envío**: 06:00
- 📅 **Frecuencia**: Diaria (Lunes a Viernes)
- 📆 **Rango**: Solo hoy
- 🕐 **Horario**: Todo el día
- 📊 **Estados**: Pendiente, Confirmado
- 👥 **Destinatarios**: Solo agentes con turnos
- 📝 **Detalles**: Origen, Destino, Nombre cliente, Hora

## 🧪 Testing

### Configurar para Pruebas

1. Editar `src/scripts/configurarNotificacionDiariaAgentes.ts`
2. Cambiar `EMPRESA_ID` por tu empresa
3. Ajustar `HORA_ENVIO` a una hora cercana para probar
4. Ejecutar: `npm run config:notif-diaria-agentes`

### Probar Envío

```bash
npm run test:notif-diaria-agentes
```

**⚠️ ATENCIÓN**: Este comando envía mensajes reales vía WhatsApp

## 📈 Beneficios

1. **Organización**: Los agentes saben exactamente qué tienen programado
2. **Puntualidad**: Recordatorio al inicio del día mejora la puntualidad
3. **Profesionalismo**: Comunicación automática y consistente
4. **Eficiencia**: Reduce consultas manuales sobre horarios
5. **Flexibilidad**: Cada empresa configura según sus necesidades

## 🔐 Seguridad

- ✅ Requiere autenticación para modificar configuración
- ✅ Solo envía a agentes registrados en el sistema
- ✅ Respeta la configuración de privacidad
- ✅ Logs detallados para auditoría

## 🎨 Personalización Disponible

### Desde el Frontend
- Hora de envío
- Frecuencia (diaria, semanal, mensual)
- Destinatarios (todos, con turnos, específicos)
- Filtros de fecha y horario
- Detalles a incluir
- Plantilla del mensaje

### Variables en Plantilla
- `{agente}`: Nombre completo del agente
- `{turnos}`: Nomenclatura plural (viajes, reservas, etc.)
- `{cantidad}`: Número de reservas

## 📞 Soporte

Para modificar o extender la funcionalidad, revisar:
- `backend/FLUJO_NOTIFICACIONES_DIARIAS_AGENTES.md` (documentación completa)
- `src/services/notificacionesDiariasAgentes.ts` (lógica del servicio)
- `src/modules/calendar/controllers/flujosController.ts` (API endpoints)

## ✨ Estado Final

✅ **Implementación completa y funcional**
✅ **Integrado en sección de Flujos Automáticos**
✅ **Documentación completa**
✅ **Scripts de configuración y prueba**
✅ **Listo para producción**

---

**Fecha de implementación**: 5 de noviembre de 2025
**Versión**: 1.0.0
