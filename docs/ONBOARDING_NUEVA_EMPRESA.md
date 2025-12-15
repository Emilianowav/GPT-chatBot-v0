# 🚀 Guía de Onboarding: Nueva Empresa (0 a 100)

Esta guía documenta el proceso completo para dar de alta una nueva empresa en el sistema de chatbot, incluyendo configuración de base de datos, backend y frontend.

---

## 📋 Índice

1. [Requisitos Previos](#1-requisitos-previos)
2. [Paso 1: Crear la Empresa en MongoDB](#2-paso-1-crear-la-empresa-en-mongodb)
3. [Paso 2: Crear Agentes (Canchas/Choferes/etc)](#3-paso-2-crear-agentes)
4. [Paso 3: Configurar el Módulo de Calendario](#4-paso-3-configurar-el-módulo-de-calendario)
5. [Paso 4: Activar el Bot de Pasos](#5-paso-4-activar-el-bot-de-pasos)
6. [Paso 5: Configurar WhatsApp Business API](#6-paso-5-configurar-whatsapp-business-api)
7. [Paso 6: Verificar y Testear](#7-paso-6-verificar-y-testear)
8. [Tipos de Negocio Soportados](#8-tipos-de-negocio-soportados)
9. [Scripts de Automatización](#9-scripts-de-automatización)

---

## 1. Requisitos Previos

### Accesos necesarios:
- MongoDB Atlas (cluster: `ClusterMomento`)
- Panel de administración del chatbot
- Meta Business Suite (para WhatsApp Business API)

### Datos de la empresa a recopilar:
- Nombre de la empresa
- Categoría/tipo de negocio
- Teléfono de WhatsApp Business
- Email de contacto
- Horarios de atención
- Lista de agentes/recursos (canchas, choferes, profesionales, etc.)

---

## 2. Paso 1: Crear la Empresa en MongoDB

### Colección: `neural_chatbot.empresas`

```javascript
{
  nombre: "Club Juventus",           // Identificador único
  categoria: "deportes",             // otro, salud, deportes, transporte, etc.
  telefono: "+5493794057395",        // Número de WhatsApp Business
  email: "contacto@empresa.com",
  derivarA: [],                      // Números para derivar consultas
  prompt: "Sos el asistente virtual de Club Juventus...", // Prompt del GPT
  saludos: [],
  catalogoPath: "data/empresa_catalogo.json",
  modelo: "gpt-3.5-turbo",
  plan: "basico",                    // basico, profesional, enterprise
  modulos: [],
  limites: {
    mensajesMensuales: 1000,
    usuariosActivos: 100,
    almacenamiento: 250,
    integraciones: 1,
    exportacionesMensuales: 0,
    agentesSimultaneos: 0,
    maxUsuarios: 5,
    maxAdmins: 1
  },
  uso: {
    mensajesEsteMes: 0,
    usuariosActivos: 0,
    almacenamientoUsado: 0,
    exportacionesEsteMes: 0,
    ultimaActualizacion: new Date()
  },
  facturacion: {
    ultimoPago: new Date(),
    proximoPago: new Date(Date.now() + 30*24*60*60*1000),
    estado: "activo"
  },
  ubicaciones: [],
  createdAt: new Date(),
  updatedAt: new Date()
}
```

---

## 3. Paso 2: Crear Agentes

### Colección: `neural_chatbot.agentes`

Los agentes representan los recursos reservables: canchas, choferes, profesionales, etc.

```javascript
{
  empresaId: "Club Juventus",        // Debe coincidir con empresa.nombre
  nombre: "Cancha",
  apellido: "Central",               // nombre + apellido = "Cancha Central"
  email: "central@clubjuventus.com", // Único por empresa
  telefono: "",
  especialidad: "Padel",             // Tipo de servicio
  descripcion: "Cancha central de padel - Techada",
  modoAtencion: "turnos_programados",
  disponibilidad: [
    // Configurar para cada día de la semana (0=Domingo, 6=Sábado)
    { diaSemana: 0, horaInicio: "08:00", horaFin: "23:00", activo: true },
    { diaSemana: 1, horaInicio: "08:00", horaFin: "23:00", activo: true },
    { diaSemana: 2, horaInicio: "08:00", horaFin: "23:00", activo: true },
    { diaSemana: 3, horaInicio: "08:00", horaFin: "23:00", activo: true },
    { diaSemana: 4, horaInicio: "08:00", horaFin: "23:00", activo: true },
    { diaSemana: 5, horaInicio: "08:00", horaFin: "23:00", activo: true },
    { diaSemana: 6, horaInicio: "08:00", horaFin: "23:00", activo: true }
  ],
  duracionTurnoPorDefecto: 60,       // Minutos
  bufferEntreturnos: 0,              // Minutos entre turnos
  activo: true,
  creadoEn: new Date(),
  actualizadoEn: new Date()
}
```

### Ejemplo: 4 canchas de padel
```javascript
const canchas = [
  { nombre: "Cancha", apellido: "Central", especialidad: "Padel" },
  { nombre: "Cancha", apellido: "Este", especialidad: "Padel" },
  { nombre: "Cancha", apellido: "Norte", especialidad: "Padel" },
  { nombre: "Cancha", apellido: "Sur", especialidad: "Padel" }
];
```

---

## 4. Paso 3: Configurar el Módulo de Calendario

### Colección: `neural_chatbot.configuraciones_modulo`

Esta configuración define cómo funciona el sistema de turnos para la empresa.

```javascript
{
  empresaId: "Club Juventus",
  tipoNegocio: "canchas",            // ⚠️ IMPORTANTE: Define qué flujo usar
  activo: true,
  
  // Nomenclatura personalizada (aparece en mensajes)
  nomenclatura: {
    turno: "Reserva",
    turnos: "Reservas",
    agente: "Cancha",
    agentes: "Canchas",
    cliente: "Jugador",
    clientes: "Jugadores",
    recurso: "Cancha",
    recursos: "Canchas"
  },
  
  // Configuración de agentes
  usaAgentes: true,
  agenteRequerido: true,
  usaRecursos: false,
  recursoRequerido: false,
  usaHorariosDisponibilidad: true,
  duracionPorDefecto: 60,
  permiteDuracionVariable: true,
  
  // Permisos del chatbot
  chatbotActivo: true,
  chatbotPuedeCrear: true,
  chatbotPuedeModificar: true,
  chatbotPuedeCancelar: true,
  
  requiereConfirmacion: false,
  notificaciones: [],
  estadosPersonalizados: [],
  camposPersonalizados: [],
  
  // Variables para mensajes dinámicos
  variablesDinamicas: {
    nombre_empresa: "Club Juventus",
    nomenclatura_turno: "Reserva",
    nomenclatura_turnos: "Reservas",
    nomenclatura_agente: "Cancha",
    nomenclatura_agentes: "Canchas",
    zona_horaria: "America/Argentina/Buenos_Aires",
    moneda: "ARS",
    idioma: "es"
  },
  
  // Mensajes del flujo (opcional, usa defaults si no se especifica)
  mensajesFlujo: {
    reserva_canchas: {
      bienvenida: { mensaje: "¡Hola! 👋 Bienvenido a *{nombre_empresa}*..." },
      solicitar_fecha: { mensaje: "📅 ¿Para qué fecha querés reservar?" },
      // ... más mensajes
    }
  },
  
  actualizadoEn: new Date()
}
```

### Tipos de Negocio Disponibles:
| tipoNegocio | Flujo que se activa | Ejemplo |
|-------------|---------------------|---------|
| `canchas` | `reservaCanchasFlow` | Club deportivo |
| `viajes` | `menuPrincipalFlow` + notificaciones | Remises/Transfer |
| `salud` | `menuPrincipalFlow` | Consultorio médico |
| `belleza` | `menuPrincipalFlow` | Peluquería/Spa |
| `otro` | `menuPrincipalFlow` | Genérico |

---

## 5. Paso 4: Activar el Bot de Pasos

### Colección: `neural_chatbot.configuracionbots`

```javascript
{
  empresaId: "Club Juventus",
  activo: true,                      // ⚠️ CRÍTICO: Activa el bot de pasos
  
  mensajeBienvenida: `¡Hola! 👋
Bienvenido a *Club Juventus* 🎾

Te ayudo a reservar tu cancha.

📅 ¿Para qué fecha querés reservar?

Escribí DD/MM/AAAA o "hoy" o "mañana"`,
  
  mensajeDespedida: "¡Hasta pronto! 👋",
  mensajeError: "❌ No entendí tu respuesta.",
  timeoutMinutos: 15,
  
  horariosAtencion: {
    activo: false,                   // false = 24/7
    inicio: "08:00",
    fin: "23:00",
    diasSemana: [0, 1, 2, 3, 4, 5, 6],
    mensajeFueraHorario: "⏰ Estamos fuera de horario."
  },
  
  requiereConfirmacion: true,
  permiteCancelacion: true,
  notificarAdmin: false,
  
  updatedAt: new Date()
}
```

---

## 6. Paso 5: Configurar WhatsApp Business API

### Requisitos:
1. Cuenta de Meta Business verificada
2. Número de teléfono dedicado para WhatsApp Business
3. App en Meta Developers con permisos de WhatsApp

### Configuración del Webhook:
```
URL: https://tu-backend.onrender.com/webhook
Verify Token: (definido en .env como META_VERIFY_TOKEN)
```

### Variables de entorno necesarias:
```env
META_APP_ID=tu_app_id
META_APP_SECRET=tu_app_secret
META_VERIFY_TOKEN=tu_verify_token
META_WHATSAPP_TOKEN=tu_access_token
WABA_ID=tu_waba_id
META_PHONE_NUMBER_ID=tu_phone_number_id
```

### El sistema obtiene automáticamente:
- `phoneNumberId` del webhook entrante
- Se asocia a la empresa por el número de teléfono

---

## 7. Paso 6: Verificar y Testear

### Checklist de verificación:

```bash
# 1. Verificar empresa existe
db.empresas.findOne({ nombre: "Club Juventus" })

# 2. Verificar agentes
db.agentes.find({ empresaId: "Club Juventus" }).count()

# 3. Verificar configuración módulo
db.configuraciones_modulo.findOne({ empresaId: "Club Juventus" })

# 4. Verificar bot activo
db.configuracionbots.findOne({ empresaId: "Club Juventus", activo: true })
```

### Test del flujo:
1. Enviar "hola" al WhatsApp de la empresa
2. Verificar que responde con el mensaje de bienvenida
3. Seguir el flujo completo de reserva
4. Verificar que el turno se crea en `neural_chatbot.turnos`

### Logs a verificar en Render:
```
✅ Flujo registrado: reserva_canchas (prioridad: urgente)
🔍 [MenuPrincipal] Verificando tipoNegocio para Club Juventus: canchas
⏭️ [MenuPrincipal] Empresa Club Juventus es de tipo canchas, usar reservaCanchasFlow
🏟️ [ReservaCanchas] Iniciando flujo para 5493794...
```

---

## 8. Tipos de Negocio Soportados

### 🏟️ Canchas (`tipoNegocio: "canchas"`)
- **Flujo**: `reservaCanchasFlow`
- **Prioridad**: Urgente
- **Estados**: fecha → hora → duración → cancha → datos cliente → confirmación
- **Ejemplo**: Club deportivo, complejo de padel

### 🚗 Viajes (`tipoNegocio: "viajes"`)
- **Flujo**: `menuPrincipalFlow` + `notificacionViajesFlow`
- **Nomenclatura**: Viaje, Chofer, Pasajero, Vehículo
- **Ejemplo**: Remises, transfers

### 🏥 Salud (`tipoNegocio: "salud"`)
- **Flujo**: `menuPrincipalFlow`
- **Nomenclatura**: Turno, Profesional, Paciente
- **Ejemplo**: Consultorio médico, odontología

### 💇 Belleza (`tipoNegocio: "belleza"`)
- **Flujo**: `menuPrincipalFlow`
- **Nomenclatura**: Turno, Profesional, Cliente
- **Ejemplo**: Peluquería, spa, estética

---

## 9. Scripts de Automatización

### Script completo de setup (ejemplo Club Juventus):

```typescript
// backend/scripts/setup-nueva-empresa.ts
import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://...';
const EMPRESA_ID = 'NuevaEmpresa';

async function setup() {
  await mongoose.connect(MONGODB_URI);
  
  // 1. Crear empresa
  await mongoose.connection.collection('empresas').insertOne({
    nombre: EMPRESA_ID,
    categoria: 'deportes',
    telefono: '+54...',
    // ... resto de campos
  });
  
  // 2. Crear agentes
  const agentes = [/* array de agentes */];
  await mongoose.connection.collection('agentes').insertMany(agentes);
  
  // 3. Configurar módulo
  await mongoose.connection.collection('configuraciones_modulo').insertOne({
    empresaId: EMPRESA_ID,
    tipoNegocio: 'canchas',
    // ... resto de config
  });
  
  // 4. Activar bot
  await mongoose.connection.collection('configuracionbots').insertOne({
    empresaId: EMPRESA_ID,
    activo: true,
    // ... resto de config
  });
  
  console.log('✅ Empresa configurada correctamente');
  await mongoose.disconnect();
}

setup();
```

### Ejecutar:
```bash
cd backend
node --loader ts-node/esm scripts/setup-nueva-empresa.ts
```

---

## 📝 Notas Importantes

1. **`empresaId`** debe ser consistente en todas las colecciones (usa `empresa.nombre`)
2. **`tipoNegocio`** determina qué flujo de conversación se activa
3. **`configuracionbots.activo: true`** es obligatorio para que funcione el bot de pasos
4. Los **agentes** deben tener disponibilidad configurada para que aparezcan como opciones
5. El **webhook de Meta** debe estar configurado y verificado antes de testear

---

## 🔧 Troubleshooting

### El bot no responde:
- Verificar `configuracionbots.activo === true`
- Verificar webhook de Meta configurado
- Revisar logs en Render

### Responde con menú incorrecto:
- Verificar `tipoNegocio` en `configuraciones_modulo`
- Limpiar `conversation_states` del usuario

### No muestra canchas/agentes:
- Verificar que existen en colección `agentes`
- Verificar `agente.activo === true`
- Verificar `agente.empresaId` coincide exactamente

### Error "Por favor, respondé con 1, 2 o 3":
- El flujo incorrecto se activó
- Limpiar estado: `db.conversation_states.deleteMany({ empresaId: "..." })`
- Verificar `tipoNegocio` correcto

---

*Última actualización: Diciembre 2024*
