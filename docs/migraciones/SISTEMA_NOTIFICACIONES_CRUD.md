# 🔔 Sistema Completo de Notificaciones con CRUD

## 📋 Descripción General

El sistema permite a los clientes crear, editar, eliminar y gestionar completamente sus notificaciones automáticas desde el frontend, sin necesidad de tocar código.

## 🎯 Características Principales

### ✅ CRUD Completo desde Frontend

1. **Crear** notificaciones personalizadas
2. **Leer** y visualizar todas las notificaciones
3. **Actualizar** configuración de notificaciones existentes
4. **Eliminar** notificaciones
5. **Activar/Desactivar** notificaciones con un toggle
6. **Enviar Prueba** para testing

### 🎨 Plantillas Predefinidas

El sistema incluye 4 plantillas listas para usar:

#### 1. **Confirmación Interactiva** (⭐ Recomendada)
```
Tipo: confirmacion
Destinatario: cliente
Momento: noche_anterior (22:00)
Características:
  ✅ Sistema completo de confirmación
  ✅ Permite editar turnos (origen, destino, hora)
  ✅ Permite cancelar turnos
  ✅ Manejo de múltiples turnos
  ✅ Sesiones interactivas
```

**Mensaje**:
```
🚗 *Recordatorio de {turnos} para mañana*

{lista_turnos}

━━━━━━━━━━━━━━━━━━

*¿Qué deseas hacer?*

1️⃣ Confirmar {todos_o_el}
2️⃣ Editar {un_turno}

Responde con el número de la opción.
```

**Flujo Interactivo**:
```
Cliente responde "2" (Editar)
    ↓
Bot muestra opciones:
    1️⃣ Cambiar origen
    2️⃣ Cambiar destino
    3️⃣ Cambiar hora
    4️⃣ Confirmar este viaje
    5️⃣ Cancelar este viaje
    0️⃣ Volver atrás
    ↓
Cliente selecciona opción
    ↓
Bot solicita nuevo valor
    ↓
Cliente ingresa valor
    ↓
Bot actualiza turno y confirma
```

#### 2. **Recordatorio 2 Horas Antes**
```
Tipo: recordatorio
Destinatario: cliente
Momento: 2 horas antes del turno
```

#### 3. **Agenda del Agente**
```
Tipo: recordatorio
Destinatario: agente
Momento: noche_anterior (21:00)
```

#### 4. **Notificación Personalizada**
```
Tipo: personalizada
Destinatario: configurable
Momento: configurable
Mensaje: desde cero
```

## 🖥️ Frontend - Componentes

### 1. **ModalNotificacion.tsx** (693 líneas)

Modal completo con 3 pasos:

**Paso 1: Selección de Plantilla**
- Grid visual con 4 plantillas predefinidas
- Cada plantilla muestra icono, nombre, descripción y badges
- Click para seleccionar y auto-completar formulario

**Paso 2: Configuración del Mensaje**
- Tipo de notificación (confirmación, recordatorio, cancelación, personalizada)
- Destinatario (todos los clientes, todos los agentes, específicos)
- Momento de envío:
  - X horas antes del turno
  - X días antes a hora específica
  - Noche anterior (22:00)
  - Mismo día a hora específica
  - Hora exacta
- Plantilla del mensaje con variables dinámicas
- Checkbox para requerir confirmación
- Mensajes de confirmación/cancelación

**Paso 3: Filtros y Opciones Avanzadas**
- Filtros por estado de turnos (pendiente, confirmado, etc.)
- Rango de horas (mínima y máxima)
- Solo turnos sin notificar previa
- Límite de envíos por ejecución
- Tipo de ejecución (automática o manual)
- Toggle activa/inactiva

**Variables Disponibles**:
```
{cliente}      - Nombre del cliente
{agente}       - Nombre del agente
{fecha}        - Fecha del turno
{hora}         - Hora del turno
{origen}       - Origen del viaje
{destino}      - Destino del viaje
{pasajeros}    - Cantidad de pasajeros
{telefono}     - Teléfono del cliente
{turnos}       - "viaje" o "viajes" según cantidad
{todos_o_el}   - "todos los viajes" o "el viaje"
{un_turno}     - "un viaje específico" o "este viaje"
{lista_turnos} - Lista formateada de turnos
```

### 2. **ListaNotificaciones.tsx** (221 líneas)

Lista visual de todas las notificaciones:

**Características**:
- Cards expandibles/colapsables
- Badges de estado (activa/inactiva, manual/automática)
- Iconos por tipo de notificación
- Información resumida en header
- Detalles completos al expandir:
  - Mensaje completo
  - Configuración de confirmación
  - Filtros aplicados
- Botones de acción:
  - ⏸️ Activar/Desactivar
  - 📤 Enviar Prueba
  - ✏️ Editar
  - 🗑️ Eliminar

**Estado Vacío**:
```
🔔
No hay notificaciones configuradas
Crea tu primera notificación para comenzar
```

### 3. **ConfiguracionModulo.tsx**

Componente principal que integra todo:
- Gestiona estado de notificaciones
- Conecta con API del backend
- Maneja CRUD completo
- Muestra mensajes de éxito/error

## 🔧 Backend - API

### Endpoints Disponibles

#### 1. **Obtener Configuración**
```typescript
GET /api/configuracion/:empresaId

Response:
{
  empresaId: "San Jose",
  notificaciones: [
    {
      tipo: "confirmacion",
      activa: true,
      destinatario: "cliente",
      momento: "noche_anterior",
      horaEnvio: "22:00",
      plantillaMensaje: "...",
      requiereConfirmacion: true,
      mensajeConfirmacion: "...",
      mensajeCancelacion: "...",
      filtros: {
        estados: ["pendiente", "confirmado"],
        soloSinNotificar: true
      }
    }
  ]
}
```

#### 2. **Guardar Configuración**
```typescript
POST /api/configuracion/:empresaId

Body:
{
  notificaciones: [...]  // Array completo de notificaciones
}

Response:
{
  success: true,
  configuracion: {...}
}
```

### Modelo de Datos

**ConfiguracionModulo** (`ConfiguracionModulo.ts`):

```typescript
interface NotificacionAutomatica {
  activa: boolean;
  tipo: 'recordatorio' | 'confirmacion';
  destinatario: 'cliente' | 'agente' | 'clientes_especificos' | 'agentes_especificos';
  momento: 'noche_anterior' | 'mismo_dia' | 'horas_antes_turno' | 'dia_antes_turno' | 'hora_exacta' | 'personalizado';
  horaEnvio?: string;
  horasAntesTurno?: number;
  diasAntes?: number;
  horaEnvioDiaAntes?: string;
  plantillaMensaje: string;
  requiereConfirmacion: boolean;
  mensajeConfirmacion?: string;
  mensajeCancelacion?: string;
  
  // Destinatarios específicos
  clientesEspecificos?: string[];
  agentesEspecificos?: string[];
  
  // Tipo de ejecución
  ejecucion?: 'automatica' | 'manual';
  
  // Filtros avanzados
  filtros?: {
    estados?: string[];
    horaMinima?: string;
    horaMaxima?: string;
    agenteIds?: string[];
    tipoReserva?: string[];
    limite?: number;
    soloSinNotificar?: boolean;
  };
}
```

## 🔄 Flujo Completo de Uso

### 1. Cliente Crea Notificación

```
Usuario en Frontend
    ↓
Click "Nueva Notificación"
    ↓
Modal se abre - Paso 1: Plantillas
    ↓
Selecciona "Confirmación Interactiva"
    ↓
Formulario se auto-completa
    ↓
Paso 2: Ajusta mensaje y configuración
    ↓
Paso 3: Configura filtros
    ↓
Click "Crear Notificación"
    ↓
POST /api/configuracion/:empresaId
    ↓
Backend guarda en MongoDB
    ↓
Frontend actualiza lista
    ↓
✅ Notificación creada y activa
```

### 2. Sistema Envía Notificación

```
Cron Job (22:00)
    ↓
Script: enviarNotificacionesDiarias.ts
    ↓
Busca turnos de mañana
    ↓
Filtra según configuración:
  - Estados: pendiente, confirmado
  - Solo sin notificar previa
  - Rango de horas (si configurado)
    ↓
Agrupa por cliente
    ↓
Para cada cliente:
  - Obtiene turnos
  - Construye mensaje con variables
  - Envía vía WhatsApp
  - Crea sesión interactiva
  - Marca como notificado
```

### 3. Cliente Responde

```
Cliente recibe mensaje
    ↓
Responde "2" (Editar)
    ↓
whatsappController recibe mensaje
    ↓
procesarRespuestaConfirmacion()
    ↓
Busca sesión activa
    ↓
Procesa según paso:
  - Selección de turno
  - Selección de campo
  - Ingreso de valor
  - Confirmación/Cancelación
    ↓
Actualiza turno en BD
    ↓
Envía mensaje de confirmación
    ↓
✅ Turno actualizado
```

## 🎨 Personalización Completa

### Campos Dinámicos

El sistema soporta campos personalizados configurables:

```typescript
// En ConfiguracionModulo
camposPersonalizados: [
  {
    clave: 'origen',
    etiqueta: 'Origen',
    tipo: 'texto',
    requerido: true,
    orden: 1,
    mostrarEnLista: true,
    usarEnNotificacion: true
  },
  {
    clave: 'destino',
    etiqueta: 'Destino',
    tipo: 'texto',
    requerido: true,
    orden: 2,
    mostrarEnLista: true,
    usarEnNotificacion: true
  },
  {
    clave: 'pasajeros',
    etiqueta: 'Cantidad de Pasajeros',
    tipo: 'numero',
    requerido: false,
    orden: 3,
    mostrarEnLista: true,
    usarEnNotificacion: true
  }
]
```

Estos campos:
- ✅ Aparecen automáticamente en las notificaciones
- ✅ Son editables en el flujo interactivo
- ✅ Se validan según su tipo
- ✅ Se muestran con iconos apropiados

### Nomenclatura Personalizada

```typescript
nomenclatura: {
  turno: 'Viaje',      // o 'Turno', 'Reserva', 'Cita'
  turnos: 'Viajes',    // o 'Turnos', 'Reservas', 'Citas'
  agente: 'Chofer',    // o 'Médico', 'Estilista', 'Instructor'
  agentes: 'Choferes', // o 'Médicos', 'Estilistas', 'Instructores'
  cliente: 'Pasajero', // o 'Paciente', 'Cliente', 'Alumno'
  clientes: 'Pasajeros' // o 'Pacientes', 'Clientes', 'Alumnos'
}
```

Esto hace que los mensajes se adapten automáticamente:
- "Tu **viaje** de mañana" (San Jose)
- "Tu **turno** de mañana" (Consultorio)
- "Tu **reserva** de mañana" (Restaurante)

## 📊 Casos de Uso

### Caso 1: Empresa de Viajes (San Jose)

**Notificación 1: Confirmación Interactiva**
```
Tipo: confirmacion
Momento: noche_anterior (22:00)
Destinatario: cliente
Requiere confirmación: true
Permite edición: true (origen, destino, hora)
```

**Notificación 2: Agenda del Chofer**
```
Tipo: recordatorio
Momento: noche_anterior (21:00)
Destinatario: agente
Lista todos los viajes del día siguiente
```

### Caso 2: Consultorio Médico

**Notificación 1: Recordatorio 24h Antes**
```
Tipo: recordatorio
Momento: dia_antes_turno (1 día, 18:00)
Destinatario: cliente
Mensaje: "Recordatorio de tu consulta mañana..."
```

**Notificación 2: Recordatorio 2h Antes**
```
Tipo: recordatorio
Momento: horas_antes_turno (2h)
Destinatario: cliente
Mensaje: "Tu consulta es en 2 horas..."
```

### Caso 3: Restaurante

**Notificación 1: Confirmación de Reserva**
```
Tipo: confirmacion
Momento: dia_antes_turno (1 día, 12:00)
Destinatario: cliente
Requiere confirmación: true
Permite edición: true (comensales, hora)
```

**Notificación 2: Recordatorio Mismo Día**
```
Tipo: recordatorio
Momento: mismo_dia (10:00)
Destinatario: cliente
Mensaje: "Tu reserva es hoy a las {hora}..."
```

## 🧪 Testing

### Enviar Prueba desde Frontend

1. Ve a la lista de notificaciones
2. Expande la notificación que quieres probar
3. Click en "📤 Enviar Prueba"
4. Ingresa tu número de teléfono
5. Recibirás el mensaje inmediatamente

### Enviar Prueba desde Backend

```bash
npm run enviar:notificacion-prueba
```

Esto:
- Busca turnos de mañana
- Envía notificaciones a todos los clientes con turnos
- Muestra resumen de envíos

## 📁 Archivos del Sistema

### Frontend
```
src/components/calendar/
├── ModalNotificacion.tsx          (693 líneas) - Modal CRUD
├── ModalNotificacion.module.css   - Estilos del modal
├── ListaNotificaciones.tsx        (221 líneas) - Lista visual
├── ListaNotificaciones.module.css - Estilos de la lista
└── ConfiguracionModulo.tsx        - Integración principal
```

### Backend
```
src/modules/calendar/
├── models/
│   └── ConfiguracionModulo.ts     (544 líneas) - Modelo de datos
├── services/
│   └── confirmacionTurnosService.ts (636 líneas) - Lógica del flujo
├── controllers/
│   └── configuracionController.ts  - API endpoints
└── routes/
    └── configuracionRoutes.ts      - Rutas

src/controllers/
└── whatsappController.ts           - Integración con WhatsApp

src/scripts/
├── enviarNotificacionesDiarias.ts  - Cron job
└── enviarNotificacionPrueba.ts     - Testing manual
```

## 🎯 Ventajas del Sistema

1. **Sin Código**: Cliente crea notificaciones sin tocar código
2. **Visual**: Interfaz intuitiva con plantillas predefinidas
3. **Flexible**: Soporta cualquier tipo de negocio
4. **Interactivo**: Flujo completo de confirmación y edición
5. **Dinámico**: Campos personalizables por empresa
6. **Escalable**: Fácil agregar nuevas plantillas
7. **Testeable**: Envío de pruebas antes de activar
8. **Robusto**: Validaciones y manejo de errores
9. **Documentado**: Variables y opciones bien explicadas
10. **Mantenible**: Código modular y bien estructurado

## 🚀 Roadmap

### Implementado ✅
- [x] CRUD completo de notificaciones
- [x] Plantillas predefinidas
- [x] Flujo interactivo de confirmación
- [x] Edición de turnos (origen, destino, hora)
- [x] Campos dinámicos configurables
- [x] Filtros avanzados
- [x] Envío de pruebas
- [x] Toggle activar/desactivar
- [x] Variables dinámicas en mensajes
- [x] Nomenclatura personalizada

### Próximas Mejoras 🔄
- [ ] Editor visual de flujos (drag & drop)
- [ ] Historial de notificaciones enviadas
- [ ] Estadísticas de confirmación
- [ ] A/B testing de mensajes
- [ ] Plantillas compartidas entre empresas
- [ ] Notificaciones recurrentes (semanal, mensual)
- [ ] Integración con calendario para fechas específicas
- [ ] Webhooks para eventos de notificación
- [ ] Multi-idioma
- [ ] Emojis personalizables

## 📞 Comandos Útiles

```bash
# Verificar configuración
npm run verificar:flujo-confirmacion

# Enviar notificación de prueba
npm run enviar:notificacion-prueba

# Ver historial de contacto
npm run ver:historial

# Limpiar estados de conversación
npm run limpiar:estados
```

---

**Última actualización**: 4 de noviembre de 2025
**Estado**: ✅ Sistema completo y funcional
**Documentación**: Completa con ejemplos
