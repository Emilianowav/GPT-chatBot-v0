# 🏗️ ARQUITECTURA DE FLUJOS Y RELACIONES DE DATOS

## 📚 Índice
1. [Visión General](#visión-general)
2. [Modelos de Datos](#modelos-de-datos)
3. [Inconsistencias Críticas](#inconsistencias-críticas)
4. [Flujo de Datos](#flujo-de-datos)
5. [Reglas de Integridad](#reglas-de-integridad)
6. [Guía de Errores](#guía-de-errores)

---

## 🎯 Visión General

Sistema multi-empresa de gestión de conversaciones por WhatsApp con:
- **Flujos Dinámicos**: Gestión de conversaciones con estado persistente
- **Módulo de Calendario**: Turnos/reservas con notificaciones automáticas
- **Multi-empresa**: Configuraciones independientes por empresa
- **WhatsApp Business API**: Integración completa con Meta

---

## 📊 Modelos de Datos

### 1. Empresa (`empresas`)

```typescript
{
  _id: ObjectId,
  nombre: String (UNIQUE),        // ⚠️ CLAVE para relaciones
  telefono: String (UNIQUE),
  phoneNumberId: String,          // ⚠️ CRÍTICO para WhatsApp
  email, categoria, prompt, modelo, plan, modulos, limites, uso
}
```

**Relaciones:** 1:N con Cliente, Usuario, Turno, Agente, ConversationState

**⚠️ INCONSISTENCIA #1:** `empresaId` en todas las relaciones es String (nombre), no ObjectId

---

### 2. Cliente (`clientes`)

```typescript
{
  _id: ObjectId,
  empresaId: String,              // ⚠️ Nombre de empresa
  nombre, apellido,
  telefono: String,               // ⚠️ CLAVE para búsquedas
  email, origen, chatbotUserId, preferencias, activo
}
```

**Índices:** `{ empresaId, telefono }` (compuesto)

**Relaciones:**
- N:1 con Empresa (empresaId → nombre)
- 1:N con Turno (clienteId ← _id.toString())

---

### 3. Turno (`turnos`)

```typescript
{
  _id: ObjectId,
  empresaId: String,              // ⚠️ Nombre de empresa
  agenteId: ObjectId,             // ✅ Referencia correcta
  clienteId: String,              // ⚠️ ObjectId como String
  fechaInicio, fechaFin, duracion, estado,
  datos: {                        // ⚠️ Campos dinámicos
    origen, destino, pasajeros
  },
  notificaciones: [{
    tipo, programadaPara, enviada, plantilla
  }]
}
```

**Índices:** `{ empresaId, clienteId, fechaInicio }` ⚠️ CRÍTICO

**⚠️ INCONSISTENCIA #2:** `clienteId` debería ser ObjectId con ref, no String

---

### 4. ConversationState (`conversation_states`)

```typescript
{
  _id: ObjectId,
  telefono: String,               // ⚠️ CLAVE COMPUESTA
  empresaId: String,              // ⚠️ CLAVE COMPUESTA (nombre)
  flujo_activo: String,
  estado_actual: String,
  data: Object,                   // Datos del flujo
  flujos_pendientes: [String],
  prioridad: String,
  ultima_interaccion: Date
}
```

**Índice:** `{ telefono, empresaId }` (unique) ⚠️ CRÍTICO

**⚠️ INCONSISTENCIA #3:** Si empresaId no coincide, el flujo se pierde

---

## ⚠️ Inconsistencias Críticas

### 1. Tipo de `empresaId` Inconsistente

**Problema:** MongoDB usa ObjectId, pero relaciones usan String (nombre)

**Solución Actual:**
```typescript
// ✅ CORRECTO
const empresaId = empresa.nombre;

// ❌ INCORRECTO
const empresaId = empresa._id.toString();
```

---

### 2. `clienteId` en Turno es String

**Problema:** No se puede usar `.populate()`, no hay integridad referencial

**Solución Actual:**
```typescript
// Buscar cliente manualmente
const cliente = await ClienteModel.findOne({ telefono, empresaId });
const turnos = await TurnoModel.find({
  clienteId: cliente._id.toString()
});
```

---

### 3. `phoneNumberId` Faltante en Flujos

**Problema:** Al iniciar flujo programáticamente, phoneNumberId estaba vacío

**Solución Implementada:**
```typescript
// En FlowManager.startFlow()
const empresa = await EmpresaModel.findOne({ nombre: empresaId });
const phoneNumberId = empresa?.phoneNumberId || '';
```

---

## 🔄 Flujo de Datos

### Envío de Notificación de Viajes

```
1. Buscar Empresa por nombre
   → EmpresaModel.findOne({ nombre })

2. Buscar Cliente por teléfono
   → ClienteModel.findOne({ empresaId: empresa.nombre, telefono })

3. Buscar Turnos del cliente
   → TurnoModel.find({
       empresaId: empresa.nombre,
       clienteId: cliente._id.toString(),
       fechaInicio: { $gte, $lte }
     })

4. Enviar mensaje por WhatsApp
   → enviarMensajeWhatsAppTexto(telefono, mensaje, phoneNumberId)

5. Iniciar flujo de notificaciones
   → flowManager.startFlow(telefono, empresa.nombre, 'notificacion_viajes', { viajes })

6. Guardar estado en ConversationState
   → { telefono, empresaId: empresa.nombre, flujo_activo, data }
```

---

## 📏 Reglas de Integridad

### Regla 1: `empresaId` SIEMPRE es el Nombre

```typescript
// ✅ CORRECTO
const empresaId = empresa.nombre;

// ❌ INCORRECTO
const empresaId = empresa._id.toString();
```

### Regla 2: Buscar Cliente ANTES de Buscar Turnos

```typescript
// ✅ CORRECTO
const cliente = await ClienteModel.findOne({ empresaId, telefono });
const turnos = await TurnoModel.find({ clienteId: cliente._id.toString() });

// ❌ INCORRECTO
const turnos = await TurnoModel.find({ clienteId: telefono });
```

### Regla 3: `phoneNumberId` Debe Estar Disponible

```typescript
// ✅ CORRECTO
const empresa = await EmpresaModel.findOne({ nombre: empresaId });
const phoneNumberId = empresa?.phoneNumberId || '';
```

---

## 🛠️ Guía de Errores

### Error: "No hay viajes programados" (pero sí hay turnos)

**Causa:** `clienteId` en query no coincide

**Solución:**
```typescript
const cliente = await ClienteModel.findOne({ empresaId, telefono });
const turnos = await TurnoModel.find({
  clienteId: cliente._id.toString()  // ✅ ObjectId como String
});
```

---

### Error: "Flujo no continúa después de responder"

**Causa:** `empresaId` en ConversationState no coincide

**Solución:**
```typescript
// Usar SIEMPRE empresa.nombre
await flowManager.startFlow(telefono, empresa.nombre, flowName, data);
```

---

### Error: "phoneNumberId is empty"

**Causa:** No se obtiene al iniciar flujo programáticamente

**Solución:**
```typescript
const empresa = await EmpresaModel.findOne({ nombre: empresaId });
const phoneNumberId = empresa?.phoneNumberId || '';
```

---

## ✅ Best Practices

1. **Validar existencia de entidades**
2. **Usar empresa.nombre como empresaId**
3. **Buscar cliente antes de buscar turnos**
4. **Obtener phoneNumberId de la empresa**
5. **Logs detallados en cada paso**

---

**Estado:** ✅ FUNCIONAL  
**Versión:** 2.0.0  
**Fecha:** 2 de noviembre de 2025
