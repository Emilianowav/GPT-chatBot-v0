# 🚗 Sistema de Notificaciones de Viajes - San Jose

## 🎯 Objetivo

Implementar un sistema completo de notificaciones interactivas por WhatsApp para confirmar y modificar viajes programados, específicamente diseñado para la empresa San Jose.

---

## ✨ Funcionalidades Implementadas

### 1. **Notificación Diaria de Confirmación**
- ✅ Envío automático el día anterior
- ✅ Lista de todos los viajes del día siguiente
- ✅ Botones interactivos para responder
- ✅ Cancelación automática si no responde

### 2. **Flujo de Confirmación**
- ✅ Confirmar todos los viajes con un botón
- ✅ Modificar viajes individuales
- ✅ Solicitar ayuda humana

### 3. **Flujo de Modificación**
- ✅ Seleccionar viaje a modificar
- ✅ Cambiar dirección de retiro
- ✅ Cambiar dirección de recogida
- ✅ Cambiar horario
- ✅ Cancelar viaje específico

### 4. **Mensajes Interactivos**
- ✅ Botones de respuesta rápida (máx 3)
- ✅ Listas de selección (máx 10)
- ✅ Captura de respuestas de texto

---

## 📱 Flujo Completo de Conversación

### **Paso 1: Notificación Inicial**

```
📨 WhatsApp (Bot):
Hola Juan, mañana tenés programados los siguientes viajes:

A. Desde San Juan 1234 hasta Mendoza 1234 a las 07:00 
   (esta es la dirección de retiro)
B. Desde Mendoza 1234 hasta San Juan 1234 a las 12:00 
   (esta es la dirección de recogida)

¿Confirmás todos los viajes? Si querés cancelar los viajes 
de mañana simplemente no contestes este mensaje y tus viajes 
se cancelarán automáticamente

[Sí, confirmo todos] [Modificar un viaje] [Necesito ayuda]
```

---

### **Opción A: Confirmar Todos**

```
👤 Cliente: [Toca "Sí, confirmo todos"]

📨 WhatsApp (Bot):
¡Tus viajes fueron confirmados! ✅

✅ FIN DEL FLUJO
```

---

### **Opción B: Modificar un Viaje**

```
👤 Cliente: [Toca "Modificar un viaje"]

📨 WhatsApp (Bot):
¿Qué viaje querés modificar?

[Ver viajes ▼]
  A. 07:00
     San Juan 1234 → Mendoza 1234
  B. 12:00
     Mendoza 1234 → San Juan 1234
```

#### **Subpaso B.1: Seleccionar Viaje**

```
👤 Cliente: [Selecciona "A. 07:00"]

📨 WhatsApp (Bot):
Perfecto, ¿qué querés modificar?

[Dirección de retiro] [Dirección recogida] [Horario]

O también podés:
[Cancelar este viaje]
```

#### **Subpaso B.2a: Modificar Horario**

```
👤 Cliente: [Toca "Horario"]

📨 WhatsApp (Bot):
Indicanos el nuevo horario en formato 24HS (Por ej: 15:00):

👤 Cliente: 15:00

📨 WhatsApp (Bot):
Perfecto! La modificación fue realizada. ✅

Tu nuevo cronograma es:
A. Desde San Juan 1234 hasta Mendoza 1234 a las 15:00 
   (esta es la dirección de retiro)
B. Desde Mendoza 1234 hasta San Juan 1234 a las 12:00 
   (esta es la dirección de recogida)

¿Querés realizar una nueva modificación?

[Sí, modificar] [No, confirmar]
```

#### **Subpaso B.2b: Modificar Dirección**

```
👤 Cliente: [Toca "Dirección de retiro"]

📨 WhatsApp (Bot):
Por favor, indicanos la nueva dirección de retiro:

👤 Cliente: Av. Libertador 5678

📨 WhatsApp (Bot):
Perfecto! La modificación fue realizada. ✅

Tu nuevo cronograma es:
A. Desde Av. Libertador 5678 hasta Mendoza 1234 a las 07:00 
   (esta es la dirección de retiro)
B. Desde Mendoza 1234 hasta San Juan 1234 a las 12:00 
   (esta es la dirección de recogida)

¿Querés realizar una nueva modificación?

[Sí, modificar] [No, confirmar]
```

#### **Subpaso B.2c: Cancelar Viaje**

```
👤 Cliente: [Toca "Cancelar este viaje"]

📨 WhatsApp (Bot):
El viaje fue cancelado exitosamente. ✅

Tu nuevo cronograma es:
B. Desde Mendoza 1234 hasta San Juan 1234 a las 12:00 
   (esta es la dirección de recogida)

¿Querés realizar una nueva modificación?

[Sí, modificar] [No, confirmar]
```

---

### **Opción C: Necesito Ayuda**

```
👤 Cliente: [Toca "Necesito ayuda"]

📨 WhatsApp (Bot):
Un agente se pondrá en contacto contigo a la brevedad. 
También podés llamarnos al [NÚMERO DE CONTACTO].

✅ FIN DEL FLUJO
```

---

## 🏗️ Arquitectura del Sistema

### **Componentes Principales:**

```
┌─────────────────────────────────────────────────────┐
│                  WhatsApp API                       │
│              (Meta Cloud API)                       │
└──────────────────┬──────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────┐
│           whatsappController.ts                     │
│  - Recibe webhooks                                  │
│  - Extrae datos del payload                         │
│  - Detecta mensajes interactivos                    │
└──────────────────┬──────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────┐
│      flujoNotificacionesService.ts                  │
│  - Maneja estado de conversación                    │
│  - Enruta según respuesta interactiva               │
│  - Procesa según estado actual                      │
└──────────────────┬──────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────┐
│    notificacionesViajesService.ts                   │
│  - Envía notificaciones                             │
│  - Procesa confirmaciones                           │
│  - Actualiza turnos                                 │
│  - Muestra cronogramas                              │
└──────────────────┬──────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────┐
│            metaService.ts                           │
│  - enviarMensajeConBotones()                        │
│  - enviarMensajeConLista()                          │
│  - enviarMensajeWhatsAppTexto()                     │
└──────────────────┬──────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────┐
│              MongoDB (TurnoModel)                   │
│  - Almacena turnos/viajes                           │
│  - Actualiza estados                                │
│  - Modifica datos                                   │
└─────────────────────────────────────────────────────┘
```

---

## 📝 Archivos Creados/Modificados

### **Nuevos Archivos:**

#### 1. `backend/src/services/notificacionesViajesService.ts`
**Funciones principales:**
- `enviarNotificacionConfirmacionViajes()` - Envía notificación inicial
- `procesarRespuestaConfirmacion()` - Procesa botones de confirmación
- `procesarSeleccionViaje()` - Procesa selección de viaje
- `procesarModificacionViaje()` - Procesa tipo de modificación
- `actualizarDatosViaje()` - Actualiza datos del turno
- `mostrarCronogramaActualizado()` - Muestra cronograma
- `procesarRespuestaFinal()` - Procesa respuesta final

#### 2. `backend/src/services/flujoNotificacionesService.ts`
**Funciones principales:**
- `procesarMensajeFlujoNotificaciones()` - Punto de entrada
- `procesarRespuestaInteractiva()` - Maneja botones/listas
- `procesarSegunEstado()` - Maneja respuestas de texto
- `limpiarEstadosAntiguos()` - Limpieza automática

#### 3. `backend/src/scripts/enviarNotificacionesDiarias.ts`
**Funcionalidad:**
- Script para ejecutar diariamente
- Busca turnos para mañana
- Agrupa por cliente
- Envía notificaciones

---

### **Archivos Modificados:**

#### 1. `backend/src/services/metaService.ts`
**Agregado:**
```typescript
// Enviar mensaje con botones (máx 3)
export const enviarMensajeConBotones = async (
  numero: string,
  texto: string,
  botones: Array<{ id: string; title: string }>,
  phoneNumberId: string
)

// Enviar mensaje con lista (máx 10)
export const enviarMensajeConLista = async (
  numero: string,
  texto: string,
  botonTexto: string,
  opciones: Array<{ id: string; title: string; description?: string }>,
  phoneNumberId: string
)
```

#### 2. `backend/src/utils/whatsappUtils.ts`
**Agregado:**
```typescript
interface WhatsAppDatos {
  // ... campos existentes
  tipoMensaje?: string;           // 'text' | 'interactive'
  respuestaInteractiva?: string;  // ID de botón/lista seleccionado
}
```

#### 3. `backend/src/controllers/whatsappController.ts`
**Agregado:**
```typescript
// Procesar flujo de notificaciones ANTES del bot de turnos
const procesadoPorNotificaciones = await procesarMensajeFlujoNotificaciones(
  telefonoCliente,
  mensaje,
  respuestaInteractiva,
  empresaTelefono
);
```

---

## 🔧 Configuración

### **1. Variables de Entorno**

Asegurarse de tener configurado en `.env`:

```env
# Meta WhatsApp API
META_TOKEN=EAAxxxxxxxxxxxxx
MODO_DEV=false

# MongoDB
MONGODB_URI=mongodb://localhost:27017/chatbot
```

### **2. Configurar Empresa**

La empresa debe tener configurado `phoneNumberId`:

```typescript
{
  nombre: "San Jose",
  telefono: "5491187654321",
  phoneNumberId: "123456789012345"  // ✅ Requerido
}
```

---

## 🚀 Ejecución

### **Envío Manual de Notificaciones:**

```bash
cd backend
npm run ts-node src/scripts/enviarNotificacionesDiarias.ts
```

### **Programar Envío Automático (Cron):**

**Opción 1: Cron de Linux/Mac**
```bash
# Editar crontab
crontab -e

# Agregar línea (ejecutar todos los días a las 18:00)
0 18 * * * cd /ruta/al/proyecto/backend && npm run ts-node src/scripts/enviarNotificacionesDiarias.ts
```

**Opción 2: Task Scheduler de Windows**
1. Abrir "Programador de tareas"
2. Crear tarea básica
3. Trigger: Diario a las 18:00
4. Acción: Ejecutar script
5. Programa: `node`
6. Argumentos: `dist/scripts/enviarNotificacionesDiarias.js`

**Opción 3: node-cron (dentro de la app)**
```typescript
import cron from 'node-cron';

// Ejecutar todos los días a las 18:00
cron.schedule('0 18 * * *', async () => {
  console.log('📅 Ejecutando envío de notificaciones diarias...');
  await enviarNotificacionesDiarias();
});
```

---

## 📊 Estados de Conversación

### **Máquina de Estados:**

```
INICIO
  │
  ├─> confirmar_todos ──> FIN (confirmado)
  │
  ├─> modificar_viaje ──> esperando_seleccion_viaje
  │                         │
  │                         └─> viaje_X ──> esperando_tipo_modificacion
  │                                           │
  │                                           ├─> mod_origen ──> esperando_origen
  │                                           ├─> mod_destino ──> esperando_destino
  │                                           ├─> mod_horario ──> esperando_horario
  │                                           └─> cancelar_viaje ──> esperando_respuesta_final
  │                                                                    │
  │                                                                    ├─> nueva_modificacion (loop)
  │                                                                    └─> confirmar_cronograma ──> FIN
  │
  └─> necesito_ayuda ──> FIN (ayuda)
```

---

## 🎨 Formato de Mensajes

### **Botones (máximo 3):**

```typescript
await enviarMensajeConBotones(
  telefono,
  "Texto del mensaje",
  [
    { id: "btn_1", title: "Opción 1" },      // Máx 20 caracteres
    { id: "btn_2", title: "Opción 2" },
    { id: "btn_3", title: "Opción 3" }
  ],
  phoneNumberId
);
```

### **Lista (máximo 10 opciones):**

```typescript
await enviarMensajeConLista(
  telefono,
  "Texto del mensaje",
  "Ver opciones",                            // Texto del botón
  [
    { 
      id: "opt_1", 
      title: "Título 1",                     // Máx 24 caracteres
      description: "Descripción 1"           // Máx 72 caracteres
    },
    { id: "opt_2", title: "Título 2", description: "Descripción 2" }
  ],
  phoneNumberId
);
```

---

## 🔍 Debugging

### **Ver Logs:**

```bash
# Logs del servidor
tail -f logs/app.log

# Logs de MongoDB
tail -f /var/log/mongodb/mongod.log
```

### **Logs Importantes:**

```
🔄 Procesando flujo de notificaciones: { clienteTelefono, respuestaInteractiva, estadoActual }
📨 Enviando mensaje con botones vía Meta WhatsApp API...
✅ Mensaje con botones enviado: { ... }
📝 Procesando respuesta de confirmación: confirmar_todos
✅ Notificación enviada exitosamente
```

---

## ⚠️ Manejo de Errores

### **Errores Comunes:**

**1. phoneNumberId no configurado:**
```
❌ phoneNumberId no configurado para la empresa
```
**Solución:** Agregar `phoneNumberId` en la configuración de la empresa

**2. Token de Meta expirado:**
```
❌ Error al enviar mensaje con botones: Invalid OAuth access token
```
**Solución:** Renovar token en Meta Business Suite

**3. Formato de horario inválido:**
```
Formato de horario inválido. Por favor, usá el formato 24HS (ej: 15:00)
```
**Solución:** El sistema valida automáticamente y pide formato correcto

---

## 📈 Métricas y Monitoreo

### **Métricas a Trackear:**

- ✅ Notificaciones enviadas por día
- ✅ Tasa de confirmación
- ✅ Tasa de modificación
- ✅ Tasa de cancelación
- ✅ Tiempo promedio de respuesta
- ✅ Errores de envío

### **Consultas Útiles:**

```javascript
// Turnos confirmados hoy
db.turnos.count({ 
  estado: 'confirmado', 
  actualizadoEn: { $gte: new Date('2025-11-01') } 
})

// Turnos cancelados hoy
db.turnos.count({ 
  estado: 'cancelado', 
  actualizadoEn: { $gte: new Date('2025-11-01') } 
})
```

---

## 🧪 Testing

### **Test Manual:**

1. Crear turnos de prueba para mañana
2. Ejecutar script de notificaciones
3. Verificar recepción en WhatsApp
4. Probar cada flujo de botones
5. Verificar actualización en BD

### **Test Automatizado (futuro):**

```typescript
describe('Flujo de Notificaciones', () => {
  it('debe enviar notificación correctamente', async () => {
    // ...
  });

  it('debe confirmar todos los viajes', async () => {
    // ...
  });

  it('debe modificar horario correctamente', async () => {
    // ...
  });
});
```

---

## 📝 Resumen

**Sistema:** Notificaciones interactivas de viajes para San Jose

**Características:**
- ✅ Notificaciones automáticas diarias
- ✅ Botones interactivos (WhatsApp Business API)
- ✅ Flujo completo de confirmación
- ✅ Modificación de viajes (origen, destino, horario)
- ✅ Cancelación de viajes individuales
- ✅ Gestión de estado de conversación
- ✅ Actualización automática de turnos

**Archivos Nuevos:**
- ✅ `notificacionesViajesService.ts` (lógica de negocio)
- ✅ `flujoNotificacionesService.ts` (gestión de estado)
- ✅ `enviarNotificacionesDiarias.ts` (script cron)

**Archivos Modificados:**
- ✅ `metaService.ts` (mensajes interactivos)
- ✅ `whatsappUtils.ts` (detección de interactivos)
- ✅ `whatsappController.ts` (integración)

**Flujo:**
```
Notificación → Botones → Modificación → Confirmación → ✅
```

¡Sistema de notificaciones de viajes completamente implementado! 🚗✨
