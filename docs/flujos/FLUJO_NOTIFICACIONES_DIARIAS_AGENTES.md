# 📅 Flujo Automático: Notificaciones Diarias para Agentes

## 📋 Descripción

Se ha implementado un nuevo flujo automático en la sección de **Flujos Automáticos** que envía notificaciones diarias a los agentes con un resumen de todas sus reservas del día. Este recordatorio se envía automáticamente al inicio del horario de trabajo configurado.

## 🎯 Objetivo

Proporcionar a los agentes un recordatorio automático de todas sus reservas programadas para el día, enviado al inicio de su jornada laboral, para que puedan planificar mejor su día.

## ⚙️ Características Principales

### 1. **Configuración Flexible de Envío**

- **Hora de Envío**: Configurable por empresa (ej: 06:00, 07:00, 08:00)
- **Frecuencia**: 
  - Diaria
  - Semanal (días específicos)
  - Mensual (día específico del mes)
  - Personalizada (cada X horas)

### 2. **Destinatarios**

- **Todos los agentes**: Envía a todos los agentes activos
- **Solo agentes con turnos**: Envía solo a agentes que tienen reservas ese día
- **Agentes específicos**: Envía solo a agentes seleccionados

### 3. **Filtros Avanzados**

#### Rango Horario
- **Hoy**: Solo reservas del día actual
- **Mañana**: Reservas del día siguiente
- **Próximos días**: Reservas de los próximos X días
- **Personalizado**: Rango de fechas específico

#### Filtro de Horario del Día
- **Mañana**: 06:00 - 12:00
- **Tarde**: 12:00 - 20:00
- **Noche**: 20:00 - 06:00
- **Personalizado**: Rango horario específico
- **Todo el día**: Sin filtro de horario

#### Filtro por Estado
- Pendiente
- Confirmado
- En curso

#### Filtro por Tipo
- Viaje
- Traslado
- Otros tipos personalizados

### 4. **Detalles Incluidos en el Mensaje**

Configurable qué información incluir:
- ✅ Origen
- ✅ Destino
- ✅ Nombre del cliente
- ✅ Teléfono del cliente
- ✅ Hora de la reserva
- ✅ Notas internas

### 5. **Plantilla de Mensaje Personalizable**

Variables disponibles:
- `{agente}`: Nombre completo del agente
- `{turnos}`: Nomenclatura plural (ej: "viajes", "reservas")
- `{cantidad}`: Número de reservas

Ejemplo de plantilla:
```
Buenos días {agente}! 🌅
Estos son tus {turnos} de hoy:
```

## 🔄 Flujo de Ejecución

### Paso 1: Verificar Frecuencia
El sistema verifica si hoy corresponde enviar notificaciones según la frecuencia configurada.

### Paso 2: Buscar Agentes
Identifica los agentes que deben recibir la notificación:
- Todos los agentes activos, o
- Solo agentes con reservas, o
- Agentes específicos seleccionados

### Paso 3: Obtener Reservas
Para cada agente, obtiene las reservas del día aplicando los filtros configurados:
- Rango horario
- Filtro de horario del día
- Estado de la reserva
- Tipo de reserva

### Paso 4: Generar Mensaje
Construye el mensaje personalizado con:
- Saludo con el nombre del agente
- Cantidad de reservas
- Lista detallada de cada reserva con:
  - Hora
  - Datos del cliente (si está configurado)
  - Origen y destino (si está configurado)
  - Notas internas (si está configurado)

### Paso 5: Enviar Notificación
Envía el mensaje vía WhatsApp al teléfono del agente registrado en el sistema.

## 📊 Ejemplo de Mensaje Enviado

```
Buenos días Juan Pérez! 🌅
Estos son tus viajes de hoy:

📋 *3 Viajes:*

1. 🕐 08:00
   María González
   📞 +5491123456789
   📍 Origen: Av. Corrientes 1234
   🎯 Destino: Aeropuerto Ezeiza

2. 🕐 12:30
   Carlos Rodríguez
   📞 +5491198765432
   📍 Origen: San Martín 567
   🎯 Destino: Terminal de Ómnibus

3. 🕐 18:00
   Ana López
   📞 +5491156781234
   📍 Origen: Hotel Sheraton
   🎯 Destino: Puerto Madero

¡Que tengas un excelente día! 💪
```

## 🔧 Integración Técnica

### Archivos Modificados

1. **`flujosController.ts`**
   - Agregado el flujo de notificación diaria en la respuesta de `obtenerTodosLosFlujos()`
   - Agregado soporte para actualizar configuración en `actualizarFlujo()`
   - Agregado soporte para activar/desactivar en `toggleFlujo()`

2. **`app.ts`**
   - Importado el servicio `enviarNotificacionesDiariasAgentes`
   - Agregado cron job que se ejecuta cada minuto
   - Verifica la hora configurada antes de enviar

3. **`notificacionesDiariasAgentes.ts`**
   - Mejorada la función principal para verificar la hora de envío
   - Solo envía cuando coincide con la hora configurada

### Modelo de Datos

El flujo utiliza el campo `notificacionDiariaAgentes` en el modelo `ConfiguracionModulo`:

```typescript
interface NotificacionDiariaAgentes {
  activa: boolean;
  horaEnvio: string;          // "06:00"
  enviarATodos: boolean;
  plantillaMensaje: string;
  
  frecuencia: {
    tipo: 'diaria' | 'semanal' | 'mensual' | 'personalizada';
    diasSemana?: number[];
    diaMes?: number;
    horasIntervalo?: number;
  };
  
  rangoHorario: {
    activo: boolean;
    tipo: 'hoy' | 'manana' | 'proximos_dias' | 'personalizado';
    diasAdelante?: number;
    fechaInicio?: string;
    fechaFin?: string;
  };
  
  filtroHorario: {
    activo: boolean;
    tipo: 'manana' | 'tarde' | 'noche' | 'personalizado' | 'todo_el_dia';
    horaInicio?: string;
    horaFin?: string;
  };
  
  filtroEstado: {
    activo: boolean;
    estados: ('pendiente' | 'confirmado' | 'en_curso')[];
  };
  
  filtroTipo: {
    activo: boolean;
    tipos: string[];
  };
  
  incluirDetalles: {
    origen: boolean;
    destino: boolean;
    nombreCliente: boolean;
    telefonoCliente: boolean;
    horaReserva: boolean;
    notasInternas: boolean;
  };
  
  agentesEspecificos?: string[];
}
```

## 🚀 Cómo Usar

### Desde el Frontend (Sección de Flujos Automáticos)

1. **Ver el Flujo**
   ```
   GET /api/flujos/:empresaId
   ```
   Retorna todos los flujos incluyendo `notificacionDiariaAgentes`

2. **Activar/Desactivar**
   ```
   PATCH /api/flujos/:empresaId/notificacion_diaria_agentes/toggle
   Body: { tipo: 'notificacion_diaria_agentes', activo: true }
   ```

3. **Actualizar Configuración**
   ```
   PUT /api/flujos/:empresaId/notificacion_diaria_agentes
   Body: { 
     tipo: 'notificacion_diaria_agentes',
     configuracion: {
       horaEnvio: '07:00',
       enviarATodos: false,
       // ... resto de configuración
     }
   }
   ```

## ⏰ Ejecución Automática

El sistema ejecuta el cron job cada minuto:
- Verifica todas las empresas con notificación diaria activa
- Para cada empresa, verifica si es la hora de envío configurada
- Si coincide, procesa y envía las notificaciones

**Ventajas:**
- ✅ No requiere configuración manual de cron
- ✅ Cada empresa puede tener su propia hora de envío
- ✅ Se ejecuta automáticamente al iniciar el servidor
- ✅ Maneja errores sin detener el proceso

## 📝 Notas Importantes

1. **Zona Horaria**: El sistema usa la hora local del servidor
2. **Margen de Envío**: Se envía exactamente en el minuto configurado
3. **Frecuencia**: Respeta la configuración de frecuencia (diaria, semanal, mensual)
4. **Agentes sin Reservas**: Si `enviarATodos` es `false`, no se envía a agentes sin reservas
5. **Teléfono del Agente**: El agente debe tener un teléfono registrado en el sistema

## 🔍 Debugging

Para verificar el funcionamiento:

```bash
# Ver logs del servidor
# Buscar líneas como:
📅 Verificando X empresas con notificaciones diarias activas...
⏰ Es hora de enviar notificaciones para empresa [ID] (07:00)
📤 Enviando notificaciones a X agentes de empresa [ID]
✅ Notificación diaria enviada a [Nombre] (X turnos)
```

## 🎨 Personalización

El mensaje puede ser completamente personalizado:
- Cambiar el saludo
- Agregar emojis
- Modificar el formato de la lista
- Incluir/excluir detalles específicos
- Agregar mensajes de cierre personalizados

## ✅ Estado Actual

- ✅ Servicio implementado y funcional
- ✅ Integrado en el controlador de flujos
- ✅ Cron job configurado en app.ts
- ✅ Verificación de hora de envío
- ✅ Soporte para filtros avanzados
- ✅ Plantillas personalizables
- ✅ Manejo de errores

## 🔮 Mejoras Futuras Sugeridas

1. **Historial de Envíos**: Guardar registro de notificaciones enviadas
2. **Confirmación de Lectura**: Detectar si el agente leyó el mensaje
3. **Respuestas Automáticas**: Permitir que el agente responda para confirmar
4. **Estadísticas**: Dashboard con métricas de envío y lectura
5. **Notificaciones Push**: Además de WhatsApp, enviar notificaciones push
6. **Plantillas Predefinidas**: Biblioteca de plantillas listas para usar
