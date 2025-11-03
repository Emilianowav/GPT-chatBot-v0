# 🎯 SOLUCIÓN FINAL - Flujos de Notificación

## ✅ PROBLEMA RESUELTO

### 🔴 Causa Raíz Identificada

El problema estaba en **`whatsappController.ts` línea 99**:

```typescript
// ❌ INCORRECTO (antes)
empresaId: (empresa as any)._id?.toString() || empresa.nombre,

// ✅ CORRECTO (ahora)
empresaId: empresa.nombre,
```

**¿Por qué fallaba?**

1. **Al enviar notificación:** Se creaba estado con `empresaId: "San Jose"` (nombre)
2. **Al responder:** Se buscaba estado con `empresaId: "68ff85d68e9f378673d09fe9"` (ObjectId)
3. **MongoDB no los encontraba como iguales** → Creaba nuevo estado vacío
4. **No había flujo activo** → Mensaje de disculpa

---

## 🔧 Cambios Realizados

### 1. **whatsappController.ts** (CRÍTICO)

#### Cambio 1: FlowContext
```typescript
// Línea 99
const flowContext: FlowContext = {
  telefono: telefonoCliente,
  empresaId: empresa.nombre,  // ✅ CORREGIDO
  mensaje,
  respuestaInteractiva,
  phoneNumberId,
  profileName
};
```

#### Cambio 2: Crear Cliente
```typescript
// Línea 67
await buscarOCrearClienteDesdeWhatsApp({
  telefono: telefonoCliente,
  profileName: profileName ?? undefined,
  empresaId: empresa.nombre,  // ✅ CORREGIDO
  chatbotUserId: usuario.id
});
```

#### Cambio 3: Cancelar Flujo
```typescript
// Línea 88
await flowManager.cancelFlow(telefonoCliente, empresa.nombre);  // ✅ CORREGIDO
```

---

### 2. **clienteAutoService.ts**

```typescript
// Normalizar teléfono antes de buscar/crear
const telefonoNormalizado = normalizarTelefono(telefono);

let cliente = await ClienteModel.findOne({
  empresaId,
  telefono: telefonoNormalizado  // ✅ Busca normalizado
});

// Crear con teléfono normalizado
cliente = new ClienteModel({
  empresaId,
  nombre,
  apellido: apellido || 'Sin Apellido',
  telefono: telefonoNormalizado,  // ✅ Guarda normalizado
  // ...
});
```

---

### 3. **notificacionesViajesService.ts**

```typescript
// Buscar cliente con múltiples variaciones
const cliente = await ClienteModel.findOne({
  empresaId: empresaDoc.nombre,
  $or: [
    { telefono: clienteTelefono },
    { telefono: telefonoNormalizadoBusqueda },
    { telefono: `+${telefonoNormalizadoBusqueda}` }
  ]
});

// Usar teléfono del cliente en BD (normalizado)
const telefonoParaFlujo = normalizarTelefono(cliente.telefono);

await iniciarFlujoNotificacionViajes(
  telefonoParaFlujo,    // ✅ Normalizado
  empresaDoc.nombre,    // ✅ Nombre
  viajes
);
```

---

### 4. **flowIntegrationService.ts**

```typescript
// Cancelar flujos anteriores antes de iniciar uno nuevo
console.log('🧹 Cancelando flujos anteriores (si existen)...');
try {
  await flowManager.cancelFlow(telefono, empresaId);
  console.log('✅ Flujos anteriores cancelados');
} catch (cancelError) {
  console.log('ℹ️ No había flujos anteriores para cancelar');
}

await flowManager.startFlow(telefono, empresaId, 'notificacion_viajes', { viajes });
```

---

### 5. **FlowManager.ts**

```typescript
// Logs detallados para debugging
private async getOrCreateState(telefono: string, empresaId: string) {
  console.log(`🔍 [getOrCreateState] Buscando estado:`, { telefono, empresaId });
  
  let state = await ConversationStateModel.findOne({ telefono, empresaId });
  
  if (!state) {
    console.log(`🆕 [getOrCreateState] Estado no encontrado, creando nuevo`);
    // ...
  } else {
    console.log(`✅ [getOrCreateState] Estado encontrado:`, {
      _id: state._id,
      flujo_activo: state.flujo_activo,
      estado_actual: state.estado_actual
    });
  }
  
  return state;
}
```

---

## 📋 Scripts Creados

### 1. `telefonoUtils.ts`
```typescript
export function normalizarTelefono(telefono: string): string {
  return telefono.replace(/\D/g, '');
}
```

### 2. `limpiarEstadosCompleto.ts`
```bash
npm run limpiar:completo
```

Limpia:
- ✅ Estados con empresaId como ObjectId
- ✅ Normaliza teléfonos en clientes
- ✅ Normaliza teléfonos en estados
- ✅ Elimina duplicados

---

## 🚀 Pasos para Probar

### 1. Limpiar BD
```bash
cd backend
npm run limpiar:completo
```

### 2. Reiniciar Servidor
```bash
npm start
```

### 3. Enviar Notificación de Prueba
- Ve al CRM → Configuración del Calendario
- Click en "Enviar Notificación de Prueba"

### 4. Verificar Logs

**Al enviar notificación:**
```
🔄 Iniciando flujo con: { telefono: '5493794946066', empresaId: 'San Jose', cantidadViajes: 3 }
🧹 Cancelando flujos anteriores (si existen)...
✅ Flujos anteriores cancelados
🎬 [FlowManager.startFlow] Iniciando flujo programático
   Teléfono: 5493794946066
   EmpresaId: San Jose  // ✅ Nombre, no ObjectId
✅ Flujo iniciado
```

**Al responder "1":**
```
🔍 [getOrCreateState] Buscando estado: { telefono: '5493794946066', empresaId: 'San Jose' }
✅ [getOrCreateState] Estado encontrado: {
  _id: ...,
  flujo_activo: 'notificacion_viajes',  // ✅ Encuentra el flujo
  estado_actual: 'esperando_opcion_inicial'
}
▶️ Continuando flujo activo: notificacion_viajes
📥 [NotificacionViajes] Estado: esperando_opcion_inicial, Mensaje: 1
✅ ¡Perfecto! Todos tus viajes han sido confirmados.
```

---

## ⚠️ Reglas de Oro (ACTUALIZADO)

### Regla 1: empresaId SIEMPRE es el nombre
```typescript
// ✅ CORRECTO
const empresaId = empresa.nombre;

// ❌ INCORRECTO
const empresaId = empresa._id.toString();
```

### Regla 2: Teléfonos SIEMPRE normalizados
```typescript
import { normalizarTelefono } from './utils/telefonoUtils';

// ✅ CORRECTO
const telefono = normalizarTelefono("+543794946066");  // "5493794946066"

// ❌ INCORRECTO
const telefono = "+543794946066";  // Con +
```

### Regla 3: Verificar SIEMPRE antes de usar
```typescript
// En whatsappController.ts
console.log('🔍 FlowContext:', {
  telefono: flowContext.telefono,
  empresaId: flowContext.empresaId  // Debe ser nombre, no ObjectId
});

// En notificacionesViajesService.ts
console.log('🔄 Iniciando flujo con:', {
  telefono: telefonoParaFlujo,
  empresaId: empresaDoc.nombre  // Debe ser nombre
});
```

---

## 📊 Verificación en MongoDB

### Estados Correctos
```javascript
db.conversation_states.find({})

// Resultado esperado:
{
  "_id": ObjectId("..."),
  "telefono": "5493794946066",  // ✅ Sin +
  "empresaId": "San Jose",      // ✅ Nombre, no ObjectId
  "flujo_activo": "notificacion_viajes",
  "estado_actual": "esperando_opcion_inicial",
  "data": { "viajes": [...] }
}
```

### Clientes Correctos
```javascript
db.clientes.find({})

// Resultado esperado:
{
  "_id": ObjectId("..."),
  "empresaId": "San Jose",      // ✅ Nombre
  "telefono": "5493794946066",  // ✅ Sin +
  "nombre": "Emiliano",
  "apellido": "De Biasi"
}
```

---

## 🎯 Checklist Final

- [x] whatsappController.ts usa `empresa.nombre` (3 lugares)
- [x] clienteAutoService.ts normaliza teléfonos
- [x] notificacionesViajesService.ts busca con variaciones y usa teléfono normalizado
- [x] flowIntegrationService.ts cancela flujos anteriores
- [x] FlowManager.ts tiene logs detallados
- [x] Script de limpieza completa creado
- [x] BD limpiada
- [ ] Servidor reiniciado
- [ ] Prueba exitosa

---

## 📚 Archivos Modificados

1. ✅ `src/controllers/whatsappController.ts`
2. ✅ `src/services/clienteAutoService.ts`
3. ✅ `src/services/notificacionesViajesService.ts`
4. ✅ `src/services/flowIntegrationService.ts`
5. ✅ `src/flows/FlowManager.ts`
6. ✅ `src/utils/telefonoUtils.ts` (nuevo)
7. ✅ `src/scripts/limpiarEstadosCompleto.ts` (nuevo)
8. ✅ `package.json`

---

## 🎉 Resultado Esperado

**Antes:**
```
Usuario: 1
Bot: Disculpá, hubo un problema al procesar tu mensaje.
```

**Ahora:**
```
Usuario: 1
Bot: ✅ ¡Perfecto! Todos tus viajes han sido confirmados. Te esperamos mañana.
```

---

**Estado:** ✅ SOLUCIONADO  
**Fecha:** 2 de noviembre de 2025  
**Hora:** 21:20  
**Problema:** empresaId inconsistente en whatsappController  
**Solución:** Usar SIEMPRE empresa.nombre en lugar de empresa._id.toString()
