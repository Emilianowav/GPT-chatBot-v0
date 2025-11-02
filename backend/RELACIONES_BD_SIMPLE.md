# 🎯 RELACIONES DE BASE DE DATOS - GUÍA SIMPLE

## ⚠️ REGLAS DE ORO

### Regla 1: empresaId
```
empresaId SIEMPRE debe ser el NOMBRE de la empresa (String)
NUNCA usar empresa._id.toString()
```

### Regla 2: Teléfonos
```
Teléfonos SIEMPRE sin + (solo dígitos)
Ejemplo: "5493794946066" ✅
         "+543794946066" ❌
```

---

## 📊 Cómo se Relacionan las Colecciones

### 1. Empresa → Cliente

```javascript
// ✅ CORRECTO
const empresa = await EmpresaModel.findOne({ nombre: "San Jose" });
const clientes = await ClienteModel.find({
  empresaId: empresa.nombre  // "San Jose"
});

// ❌ INCORRECTO
const clientes = await ClienteModel.find({
  empresaId: empresa._id.toString()  // ObjectId como String
});
```

---

### 2. Cliente → Turno

```javascript
// ✅ CORRECTO - Buscar cliente primero
const cliente = await ClienteModel.findOne({
  empresaId: "San Jose",
  telefono: "+543794946066"
});

const turnos = await TurnoModel.find({
  empresaId: "San Jose",
  clienteId: cliente._id.toString()  // ObjectId del cliente como String
});

// ❌ INCORRECTO - Usar teléfono directamente
const turnos = await TurnoModel.find({
  clienteId: "+543794946066"  // NO funciona
});
```

---

### 3. Empresa → ConversationState (CRÍTICO)

```javascript
// ✅ CORRECTO
const empresa = await EmpresaModel.findOne({ nombre: "San Jose" });

await ConversationStateModel.create({
  telefono: "+543794946066",
  empresaId: empresa.nombre,  // "San Jose" (String)
  flujo_activo: "notificacion_viajes",
  estado_actual: "esperando_opcion_inicial",
  data: { viajes: [...] }
});

// ❌ INCORRECTO
await ConversationStateModel.create({
  telefono: "+543794946066",
  empresaId: empresa._id.toString(),  // ObjectId como String ❌
  flujo_activo: "notificacion_viajes"
});
```

**¿Por qué es CRÍTICO?**

Cuando el usuario responde, el sistema busca:
```javascript
const state = await ConversationStateModel.findOne({
  telefono: "+543794946066",
  empresaId: "San Jose"  // Busca con nombre
});
```

Si el estado se guardó con `empresaId: "68ff85d68e9f378673d09fe9"`, **NO LO ENCUENTRA** y el flujo se pierde.

---

## 🔍 Verificar Datos en MongoDB

### 1. Ver ConversationStates

```javascript
db.conversation_states.find({ telefono: "+543794946066" })
```

**Resultado Correcto:**
```json
{
  "_id": ObjectId("..."),
  "telefono": "+543794946066",
  "empresaId": "San Jose",  // ✅ Nombre de empresa
  "flujo_activo": "notificacion_viajes",
  "estado_actual": "esperando_opcion_inicial"
}
```

**Resultado Incorrecto:**
```json
{
  "_id": ObjectId("..."),
  "telefono": "+543794946066",
  "empresaId": "68ff85d68e9f378673d09fe9",  // ❌ ObjectId
  "flujo_activo": "notificacion_viajes"
}
```

---

### 2. Ver Turnos de un Cliente

```javascript
// Paso 1: Buscar cliente
db.clientes.findOne({
  empresaId: "San Jose",
  telefono: "+543794946066"
})
// Resultado: { _id: ObjectId("69043bdf63cdbbc707fd4529"), ... }

// Paso 2: Buscar turnos con ese _id
db.turnos.find({
  empresaId: "San Jose",
  clienteId: "69043bdf63cdbbc707fd4529"  // ObjectId como String
})
```

---

## 🛠️ Limpiar Registros Duplicados

### Script de Limpieza

```javascript
// Conectar a MongoDB
use crm_chatbot

// 1. Ver registros duplicados
db.conversation_states.find({ telefono: "+543794946066" })

// 2. Eliminar registros con empresaId incorrecto (ObjectId)
db.conversation_states.deleteMany({
  telefono: "+543794946066",
  empresaId: { $regex: /^[0-9a-f]{24}$/i }  // Patrón de ObjectId
})

// 3. Verificar que solo quede el correcto
db.conversation_states.find({ telefono: "+543794946066" })
// Debe retornar solo 1 registro con empresaId: "San Jose"
```

---

## ✅ Checklist de Validación

Antes de enviar una notificación, verificar:

### 1. Empresa
```javascript
const empresa = await EmpresaModel.findOne({ nombre: "San Jose" });
console.log("empresaId:", empresa.nombre);  // Debe ser "San Jose"
console.log("phoneNumberId:", empresa.phoneNumberId);  // Debe existir
```

### 2. Cliente
```javascript
const cliente = await ClienteModel.findOne({
  empresaId: empresa.nombre,  // ✅ Nombre
  telefono: "+543794946066"
});
console.log("clienteId:", cliente._id.toString());
```

### 3. Turnos
```javascript
const turnos = await TurnoModel.find({
  empresaId: empresa.nombre,  // ✅ Nombre
  clienteId: cliente._id.toString(),  // ✅ ObjectId como String
  fechaInicio: { $gte: ..., $lte: ... }
});
console.log("Turnos encontrados:", turnos.length);
```

### 4. ConversationState (ANTES de crear)
```javascript
// Verificar si ya existe
const existente = await ConversationStateModel.findOne({
  telefono: "+543794946066",
  empresaId: empresa.nombre  // ✅ Nombre
});

if (existente) {
  console.log("Ya existe estado:", existente.flujo_activo);
  // Decidir si actualizar o eliminar
}
```

---

## 🔄 Flujo Completo Correcto

```javascript
// 1. Buscar empresa
const empresa = await EmpresaModel.findOne({ nombre: "San Jose" });

// 2. Buscar cliente
const cliente = await ClienteModel.findOne({
  empresaId: empresa.nombre,  // ✅
  telefono: "+543794946066"
});

// 3. Buscar turnos
const turnos = await TurnoModel.find({
  empresaId: empresa.nombre,  // ✅
  clienteId: cliente._id.toString(),  // ✅
  fechaInicio: { $gte: fechaInicio, $lte: fechaFin }
});

// 4. Enviar mensaje
await enviarMensajeWhatsAppTexto(
  cliente.telefono,
  mensaje,
  empresa.phoneNumberId  // ✅
);

// 5. Iniciar flujo
await flowManager.startFlow(
  cliente.telefono,
  empresa.nombre,  // ✅ Nombre, no _id
  'notificacion_viajes',
  { viajes: turnos }
);

// 6. Verificar estado creado
const state = await ConversationStateModel.findOne({
  telefono: cliente.telefono,
  empresaId: empresa.nombre  // ✅ Debe coincidir
});

console.log("Estado creado:", {
  flujo_activo: state.flujo_activo,
  empresaId: state.empresaId  // Debe ser "San Jose"
});
```

---

## ❌ Errores Comunes

### Error 1: Usar ObjectId como empresaId

```javascript
// ❌ INCORRECTO
await flowManager.startFlow(
  telefono,
  empresa._id.toString(),  // ObjectId
  'notificacion_viajes',
  data
);

// ✅ CORRECTO
await flowManager.startFlow(
  telefono,
  empresa.nombre,  // Nombre
  'notificacion_viajes',
  data
);
```

---

### Error 2: Buscar turnos sin buscar cliente primero

```javascript
// ❌ INCORRECTO
const turnos = await TurnoModel.find({
  empresaId: "San Jose",
  clienteId: telefono  // Teléfono no es clienteId
});

// ✅ CORRECTO
const cliente = await ClienteModel.findOne({ empresaId, telefono });
const turnos = await TurnoModel.find({
  empresaId: "San Jose",
  clienteId: cliente._id.toString()
});
```

---

### Error 3: No verificar registros duplicados

```javascript
// ✅ BUENA PRÁCTICA
const existentes = await ConversationStateModel.find({
  telefono: "+543794946066"
});

if (existentes.length > 1) {
  console.warn("⚠️ Registros duplicados encontrados:", existentes.length);
  
  // Eliminar los que tienen empresaId como ObjectId
  for (const state of existentes) {
    if (state.empresaId.match(/^[0-9a-f]{24}$/i)) {
      await ConversationStateModel.deleteOne({ _id: state._id });
      console.log("🗑️ Eliminado registro con ObjectId:", state._id);
    }
  }
}
```

---

## 🎯 Resumen

| Campo | Tipo Correcto | Ejemplo |
|-------|---------------|---------|
| `empresaId` | String (nombre) | `"San Jose"` |
| `clienteId` | String (ObjectId) | `"69043bdf63cdbbc707fd4529"` |
| `agenteId` | ObjectId | `ObjectId("6906bba82291a88e3b0a36ea")` |
| `telefono` | String | `"+543794946066"` |
| `phoneNumberId` | String | `"768730689655171"` |

---

## 🚀 Solución al Problema Actual

```javascript
// 1. Conectar a MongoDB Atlas
// 2. Ejecutar este comando:

db.conversation_states.deleteMany({
  telefono: "+543794946066",
  empresaId: { $regex: /^[0-9a-f]{24}$/i }
});

// 3. Verificar que solo quede 1 registro
db.conversation_states.countDocuments({ telefono: "+543794946066" })
// Debe retornar: 1

// 4. Verificar que el empresaId sea correcto
db.conversation_states.findOne({ telefono: "+543794946066" })
// empresaId debe ser: "San Jose"
```

---

**Fecha:** 2 de noviembre de 2025  
**Estado:** ✅ DOCUMENTADO
