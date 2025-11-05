# 🔧 Solución: Botón "Probar" para Notificaciones Diarias de Agentes

## 🐛 Problema Identificado

El botón "Probar" del flujo de notificaciones diarias para agentes estaba enviando el mensaje del **flujo de confirmación de clientes** en lugar del mensaje correcto para agentes.

### Mensaje Incorrecto (que recibías):
```
Recordatorio de viajes para mañana

━━━━━━━━━━━━━━━━━━
Viaje 1

📍 Origen: San Juan 234
📍 Destino: Belgrano 1515
🕐 Hora: 17:30
👥 Pasajeros: 1

━━━━━━━━━━━━━━━━━━

¿Qué deseas hacer?

1️⃣ Confirmar todos los viajes
2️⃣ Editar un viaje específico
```

### Mensaje Correcto (que deberías recibir):
```
Buenos días Juan Pérez! 🌅
Estos son tus viajes de hoy:

📋 *3 Viajes:*

1. 🕐 08:00
   María González
   📞 +5491112345678
   📍 Origen: San Juan 234
   🎯 Destino: Belgrano 1515
   📝 Cliente VIP - Llevar agua

2. 🕐 12:30
   Carlos Rodríguez
   📞 +5491187654321
   📍 Origen: Av. Corrientes 1234
   🎯 Destino: Aeropuerto Ezeiza

¡Que tengas un excelente día! 💪
```

## ✅ Solución Implementada

### 1. Frontend: Detección del Flujo Correcto

**Archivo:** `front_crm/bot_crm/src/app/dashboard/calendario/flujos-activos/page.tsx`

Se modificó la función `handleEnviarPrueba` para detectar cuando se está probando el flujo de notificaciones diarias de agentes y usar un endpoint específico:

```typescript
const handleEnviarPrueba = async (flujoId: string, telefono: string) => {
  // Si es notificación diaria de agentes, usar endpoint específico
  if (flujoId === 'notificacion_diaria_agentes') {
    const response = await fetch(`${apiUrl}/api/modules/calendar/notificaciones-diarias-agentes/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        empresaId,
        telefono
      })
    });
    // ...
  }
  // Para otros flujos, usar el endpoint existente
  // ...
}
```

### 2. Backend: Nuevo Endpoint de Prueba

**Archivos creados:**

#### `backend/src/modules/calendar/routes/notificacionesDiariasAgentes.ts`
```typescript
import { Router } from 'express';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { enviarNotificacionPruebaAgente } from '../controllers/notificacionesDiariasAgentesController';

const router = Router();

// POST /api/modules/calendar/notificaciones-diarias-agentes/test
router.post('/test', authMiddleware, enviarNotificacionPruebaAgente);

export default router;
```

#### `backend/src/modules/calendar/controllers/notificacionesDiariasAgentesController.ts`
Controlador que:
- ✅ Busca el agente por teléfono
- ✅ Obtiene sus turnos del día
- ✅ Aplica los filtros configurados (estado, tipo, horario)
- ✅ Genera el mensaje usando la plantilla configurada
- ✅ Incluye los detalles seleccionados (teléfono, notas, origen, destino, etc.)
- ✅ Envía el mensaje vía WhatsApp

#### `backend/src/app.ts`
Se registró la nueva ruta:
```typescript
import notificacionesDiariasAgentesRoutes from "./modules/calendar/routes/notificacionesDiariasAgentes.js";

app.use("/api/modules/calendar/notificaciones-diarias-agentes", notificacionesDiariasAgentesRoutes);
```

## 🎯 Cómo Usar

### 1. Configurar los Detalles a Incluir

1. Ve a **Calendario → Flujos Automáticos**
2. Busca la card "📅 Recordatorio Diario para Agentes"
3. Click en **"⚙️ Configurar"**
4. Ve al **Paso 3: Detalles**
5. Marca los detalles que quieres incluir:
   - ✅ Origen
   - ✅ Destino
   - ✅ Nombre del Cliente
   - ✅ Teléfono del Cliente
   - ✅ Hora de Reserva
   - ✅ Notas Internas
6. **Guardar**

### 2. Probar el Flujo

1. En la card del flujo, click en **"📤 Probar"**
2. Ingresa el **teléfono de un agente** (debe estar registrado como agente activo)
3. Click en **"📤 Enviar Prueba"**

### 3. Verificar el Mensaje

El agente recibirá un mensaje con:
- ✅ Saludo personalizado con su nombre
- ✅ Lista de turnos del día
- ✅ Detalles configurados (origen, destino, teléfono, notas, etc.)
- ✅ Sin opciones de confirmación (solo información)

## 🔍 Diferencias entre Flujos

| Característica | Confirmación Clientes | Notificación Agentes |
|----------------|----------------------|---------------------|
| **Destinatario** | Cliente | Agente |
| **Cuándo se envía** | Día antes del turno | Inicio de jornada |
| **Propósito** | Confirmar/Editar turno | Informar turnos del día |
| **Opciones** | 1️⃣ Confirmar 2️⃣ Editar | Sin opciones |
| **Detalles** | Básicos (origen, destino) | Completos (teléfono, notas, etc.) |
| **Plantilla** | "Recordatorio de viajes para mañana" | "Buenos días {agente}! Estos son tus {turnos} de hoy" |

## 📝 Notas Importantes

1. **El teléfono debe ser de un agente activo**: Si ingresas un teléfono que no está registrado como agente, recibirás un error.

2. **Los turnos deben ser de hoy**: El endpoint busca turnos del día actual. Si el agente no tiene turnos hoy, recibirá un mensaje indicándolo.

3. **Los detalles se incluyen según configuración**: Si marcaste "Teléfono del Cliente" y "Notas Internas" en la configuración, estos aparecerán en el mensaje de prueba.

4. **El mensaje de prueba es idéntico al real**: El endpoint de prueba usa exactamente la misma lógica que el envío automático, garantizando que lo que ves en la prueba es lo que recibirán los agentes.

## ✅ Verificación

Para verificar que todo funciona:

```bash
# 1. Compilar y ejecutar el backend
cd backend
npm run build
npm start

# 2. En el frontend, ir a Flujos Automáticos
# 3. Click en "Probar" del flujo de agentes
# 4. Ingresar teléfono de un agente
# 5. Verificar que el mensaje recibido es correcto
```

## 🚀 Próximos Pasos

- ✅ El flujo está completamente funcional
- ✅ El botón "Probar" envía el mensaje correcto
- ✅ Los detalles configurados se incluyen correctamente
- ✅ El mensaje es idéntico al que se enviará automáticamente

---

**Resumen:** El problema estaba en que el frontend no diferenciaba entre flujos al enviar pruebas. Ahora detecta correctamente el flujo de notificaciones diarias de agentes y usa un endpoint específico que genera el mensaje correcto con todos los detalles configurados.
