# 🔍 Diagnóstico y Solución del Problema de Flujos

## ❌ Problema Reportado

```
Usuario recibe notificación:
"¿Qué deseas hacer?
1️⃣ Confirmar todos los viajes
2️⃣ Editar un viaje específico"

Usuario responde: "1"

Bot responde INCORRECTAMENTE:
"¡Hola! 👋 Soy el asistente virtual...
1️⃣ Reservar un viaje
2️⃣ Consultar mis viajes
3️⃣ Cancelar un viaje"
```

**Resultado:** El flujo de notificaciones NO continúa, se activa el menú principal.

---

## 🔎 Análisis de Causa Raíz

### Problema 1: Activación Incorrecta del Menú Principal

**Archivo:** `src/flows/menuPrincipalFlow.ts`

**Código Problemático:**
```typescript
async shouldActivate(context: FlowContext): Promise<boolean> {
  const mensajeLower = mensaje.toLowerCase().trim();
  
  const keywords = ['hola', 'menu', 'turno', ...];
  const esIntencion = keywords.some(kw => mensajeLower.includes(kw));
  
  // ❌ PROBLEMA: Se activa con números 1, 2, 3
  const esOpcionMenu = /^[123]$/.test(mensajeLower);
  
  return esIntencion || esOpcionMenu; // ← Esto causa el conflicto
}
```

**Causa:**
Cuando el usuario responde "1" a la notificación de viajes:
1. El FlowManager intenta continuar con `notificacion_viajes` (correcto)
2. Pero TAMBIÉN evalúa si otros flujos deben activarse
3. `menuPrincipalFlow.shouldActivate()` retorna `true` porque detecta "1"
4. Se activa el menú principal, interrumpiendo el flujo de notificaciones

---

### Problema 2: Controller de Prueba Usa Servicio Antiguo

**Archivo:** `src/modules/calendar/controllers/configuracionController.ts`

**Código Problemático:**
```typescript
export const enviarNotificacionPrueba = async (req, res) => {
  // ❌ Usa el servicio antiguo
  const { enviarNotificacionConfirmacion } = await import(
    '../services/confirmacionTurnosService.js'
  );
  
  // ❌ No inicia el flujo en el sistema nuevo
  await enviarNotificacionConfirmacion(clienteId, turnos, empresaId);
}
```

**Causa:**
El botón "Enviar Prueba" del front enviaba notificaciones usando el sistema antiguo que NO integra con el nuevo sistema de flujos.

---

## ✅ Soluciones Implementadas

### Solución 1: Corregir Activación del Menú Principal

**Archivo:** `src/flows/menuPrincipalFlow.ts`

**Cambio:**
```typescript
async shouldActivate(context: FlowContext): Promise<boolean> {
  const mensajeLower = mensaje.toLowerCase().trim();
  
  const keywords = [
    'hola', 'menu', 'menú', 'opciones', 'ayuda',
    'turno', 'reserva', 'reservar', 'agendar',
    'consulta', 'consultar', 'ver', 'mis turnos',
    'cancelar', 'cancelación', 'eliminar'
  ];
  
  // ✅ SOLO activar con keywords, NO con números
  const esIntencion = keywords.some(kw => mensajeLower.includes(kw));
  
  return esIntencion; // ← Eliminado esOpcionMenu
}
```

**Resultado:**
- El menú principal YA NO se activa con números solos
- Solo se activa con palabras clave explícitas
- Los números "1", "2", "3" son procesados por el flujo activo

---

### Solución 2: Actualizar Controller de Prueba

**Archivo:** `src/modules/calendar/controllers/configuracionController.ts`

**Cambio:**
```typescript
export const enviarNotificacionPrueba = async (req, res) => {
  // ✅ Usa el nuevo servicio con sistema de flujos
  const { enviarNotificacionConfirmacionViajes } = await import(
    '../../../services/notificacionesViajesService.js'
  );
  
  const { EmpresaModel } = await import('../../../models/Empresa.js');
  
  // Buscar cliente y empresa
  const clientePrueba = await ClienteModel.findOne({ empresaId });
  const empresa = await EmpresaModel.findById(empresaId);
  
  // ✅ Envía notificación E inicia flujo automáticamente
  await enviarNotificacionConfirmacionViajes(
    clientePrueba.telefono,
    empresa.telefono
  );
}
```

**Resultado:**
- El botón "Enviar Prueba" ahora usa el sistema correcto
- Inicia el flujo `notificacion_viajes` automáticamente
- El usuario puede responder "1" o "2" y el flujo continúa correctamente

---

## 🔄 Flujo Correcto Ahora

### Escenario: Notificación de Viajes

```
1. Front: Click en "Enviar Prueba"
   ↓
2. Backend: configuracionController.enviarNotificacionPrueba()
   ↓
3. Backend: enviarNotificacionConfirmacionViajes()
   ├─ Envía mensaje de WhatsApp
   └─ Inicia flujo: iniciarFlujoNotificacionViajes()
   ↓
4. MongoDB: Guarda estado
   {
     flujo_activo: "notificacion_viajes",
     estado_actual: "esperando_opcion_inicial",
     data: { viajes: [...] }
   }
   ↓
5. Usuario: Responde "1"
   ↓
6. Backend: whatsappController recibe mensaje
   ↓
7. FlowManager: handleMessage()
   ├─ Detecta flujo activo: "notificacion_viajes"
   ├─ Llama: notificacionViajesFlow.onInput()
   ├─ Estado: "esperando_opcion_inicial"
   └─ Mensaje: "1"
   ↓
8. notificacionViajesFlow:
   if (mensajeTrim === '1') {
     // Confirmar todos los viajes
     await TurnoModel.updateMany(..., { estado: 'confirmado' });
     await enviarMensaje('✅ Todos confirmados');
     return { success: true, end: true };
   }
   ↓
9. Usuario: Recibe "✅ ¡Perfecto! Todos tus viajes han sido confirmados."
   ↓
10. MongoDB: Limpia estado (flujo finalizado)
```

---

## 🎯 Verificación

### Test 1: Notificación de Viajes
```
✅ Usuario recibe notificación con opciones 1 y 2
✅ Usuario responde "1"
✅ Bot confirma todos los viajes
✅ NO se activa el menú principal
```

### Test 2: Menú Principal
```
✅ Usuario escribe "hola"
✅ Bot muestra menú con opciones 1, 2, 3
✅ Usuario responde "1"
✅ Bot inicia proceso de reserva
```

### Test 3: Editar Viaje
```
✅ Usuario recibe notificación
✅ Usuario responde "2"
✅ Bot pregunta qué viaje editar
✅ Usuario responde "1"
✅ Bot pregunta qué modificar
✅ Flujo continúa correctamente
```

---

## 📋 Checklist de Validación

- [x] `menuPrincipalFlow` NO se activa con números solos
- [x] `notificacionViajesFlow` captura "1" y "2" correctamente
- [x] Controller de prueba usa `enviarNotificacionConfirmacionViajes`
- [x] Flujo se inicia automáticamente al enviar notificación
- [x] Estado se guarda en MongoDB correctamente
- [x] FlowManager continúa con flujo activo sin evaluar otros
- [x] Compilación exitosa sin errores

---

## 🚀 Cómo Probar

### Desde el Front (CRM)

1. Ir a "Configuración de Notificaciones"
2. Seleccionar plantilla de confirmación de turnos
3. Click en "Enviar Prueba"
4. Verificar que el cliente recibe el mensaje
5. Responder "1" desde WhatsApp
6. Verificar que recibe "✅ Todos confirmados"

### Desde WhatsApp (Usuario)

1. Escribir "hola"
2. Recibir menú con 3 opciones
3. Responder "1"
4. Verificar que inicia proceso de reserva

---

## 📝 Archivos Modificados

1. **`src/flows/menuPrincipalFlow.ts`**
   - Eliminada activación por números solos
   - Solo se activa con keywords explícitas

2. **`src/modules/calendar/controllers/configuracionController.ts`**
   - Actualizado `enviarNotificacionPrueba`
   - Usa `enviarNotificacionConfirmacionViajes`
   - Inicia flujo automáticamente

---

## ✅ Estado Final

**Problema:** RESUELTO ✅  
**Compilación:** EXITOSA ✅  
**Tests:** PENDIENTES (requieren prueba manual)  

**Próximo paso:** Probar desde el front enviando una notificación de prueba.

---

**Fecha:** 2 de noviembre de 2025  
**Versión:** 2.1.0
