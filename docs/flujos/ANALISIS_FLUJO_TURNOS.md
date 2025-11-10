# 📋 Análisis Completo del Flujo de Turnos y Notificaciones

## 🔍 Problema Identificado

El sistema de notificaciones de viajes no encontraba turnos existentes en el calendario debido a **inconsistencias en cómo se relacionan las entidades**.

### Error Original:
```
Error al enviar notificación de prueba: Error: ℹ️ No hay viajes programados en los próximos 7 días
```

## 🏗️ Arquitectura del Sistema

### Modelos de Datos

#### 1. **Empresa** (`empresas` collection)
```typescript
{
  _id: ObjectId("68ff85d68e9f378673d09fe9"),
  nombre: "San Jose",
  telefono: "+5493794044092",
  phoneNumberId: "768730689655171",
  // ... otros campos
}
```

#### 2. **Cliente** (`clientes` collection)
```typescript
{
  _id: ObjectId("69043bdf63cdbbc707fd4529"),
  empresaId: "San Jose",  // ⚠️ Usa el NOMBRE de la empresa
  nombre: "Ignacio",
  apellido: "Prado",
  telefono: "+543794946066",
  // ... otros campos
}
```

#### 3. **Turno** (`turnos` collection)
```typescript
{
  _id: ObjectId("6906d7835721cb74b2b1a35e"),
  empresaId: "San Jose",  // ⚠️ Usa el NOMBRE de la empresa
  clienteId: "69043bdf63cdbbc707fd4529",  // ⚠️ Usa el ObjectId del cliente
  agenteId: ObjectId("6906bba82291a88e3b0a36ea"),
  fechaInicio: "2025-11-03T04:05:00.000Z",
  estado: "pendiente",
  datos: {
    origen: "Dirección A",
    destino: "Dirección B",
    pasajeros: 1
  }
}
```

## ❌ Problema Raíz

### En `notificacionesViajesService.ts` (ANTES):

```typescript
// 1. Buscaba empresa por teléfono usando buscarEmpresaPorTelefono()
const empresa = await buscarEmpresaPorTelefono(empresaTelefono);
// Retorna: EmpresaConfig (sin _id de MongoDB)

// 2. Intentaba buscar turnos con el teléfono del cliente
const turnos = await TurnoModel.find({
  empresaId: (empresa as any)._id?.toString() || empresa.nombre,
  clienteId: clienteTelefono,  // ❌ PROBLEMA: Usa teléfono, no ObjectId
  // ...
});
```

### Problemas Específicos:

1. **`clienteId` incorrecto**: Buscaba turnos usando el **teléfono del cliente** cuando debería usar el **ObjectId del cliente**
2. **Falta de validación**: No verificaba si el cliente existía antes de buscar turnos
3. **Logs insuficientes**: No mostraba información de debug para diagnosticar el problema

## ✅ Solución Implementada

### Cambios en `notificacionesViajesService.ts`:

```typescript
// 1. Buscar empresa en MongoDB (documento completo con _id)
const empresaDoc = await EmpresaModel.findOne({ 
  telefono: new RegExp(empresaTelefono.replace(/\D/g, '')) 
});

// 2. Buscar cliente por teléfono y empresaId
const cliente = await ClienteModel.findOne({
  empresaId: empresaDoc.nombre,
  telefono: clienteTelefono
});

// 3. Buscar turnos usando el ObjectId del cliente
const turnos = await TurnoModel.find({
  empresaId: empresaDoc.nombre,
  clienteId: cliente._id.toString(),  // ✅ Usa ObjectId del cliente
  fechaInicio: { $gte: fechaInicio, $lte: fechaFin },
  estado: { $in: ['pendiente', 'confirmado'] }
});
```

### Mejoras Implementadas:

1. ✅ **Búsqueda correcta de cliente**: Ahora busca el cliente en MongoDB antes de buscar turnos
2. ✅ **Uso de ObjectId**: Usa el `_id` del cliente para buscar turnos
3. ✅ **Validaciones**: Valida que tanto empresa como cliente existan
4. ✅ **Logs detallados**: Muestra información de debug en cada paso
5. ✅ **Manejo de errores**: Lanza errores descriptivos cuando algo falla

## 🔄 Flujo Completo de Notificaciones

### 1. Creación de Turno (Frontend → Backend)
```
Usuario crea turno en calendario
  ↓
POST /api/modules/calendar/turnos
  ↓
turnoController.crearTurno()
  ↓
turnoService.crearTurno()
  ↓
Se crea turno con:
  - empresaId: nombre de la empresa
  - clienteId: ObjectId del cliente
  - notificaciones programadas automáticamente
```

### 2. Envío de Notificaciones (Automático/Manual)
```
Cron job o botón de prueba
  ↓
enviarNotificacionConfirmacionViajes()
  ↓
1. Buscar empresa por teléfono → EmpresaModel
2. Buscar cliente por teléfono → ClienteModel
3. Buscar turnos por clienteId → TurnoModel
4. Construir mensaje con datos de viajes
5. Enviar mensaje por WhatsApp → metaService
6. Iniciar flujo de confirmación → flowIntegrationService
```

### 3. Confirmación del Cliente (WhatsApp → Backend)
```
Cliente responde "SÍ" o "NO"
  ↓
Webhook de Meta
  ↓
whatsappController
  ↓
FlowManager procesa respuesta
  ↓
Actualiza estado del turno
```

## 📊 Relaciones entre Entidades

```
┌─────────────────┐
│    Empresa      │
│  _id: ObjectId  │
│  nombre: String │◄────┐
└─────────────────┘     │
                        │ empresaId (nombre)
┌─────────────────┐     │
│    Cliente      │     │
│  _id: ObjectId  │◄────┤
│  empresaId: Str │─────┘
│  telefono: Str  │
└─────────────────┘
         ▲
         │ clienteId (ObjectId)
         │
┌─────────────────┐
│     Turno       │
│  empresaId: Str │
│  clienteId: Str │ (ObjectId como string)
│  agenteId: ObjId│
└─────────────────┘
```

## 🧪 Cómo Probar

### 1. Verificar datos en MongoDB:
```bash
node check-turnos.js
```

### 2. Probar notificación desde el CRM:
```
1. Ir a Configuración del Calendario
2. Click en "Enviar Notificación de Prueba"
3. Verificar logs en consola del backend
4. Verificar mensaje en WhatsApp del cliente
```

### 3. Logs esperados (éxito):
```
📅 Enviando notificación de confirmación de viajes...
   Cliente: +543794946066
   Empresa: +5493794044092
🔍 Buscando empresa en MongoDB por teléfono: +5493794044092
✅ Empresa encontrada: San Jose
🔍 Buscando cliente por teléfono: +543794946066
✅ Cliente encontrado: Ignacio Prado
   Cliente ID: 69043bdf63cdbbc707fd4529
🧪 Modo prueba: buscando turnos en los próximos 7 días
📅 Rango de búsqueda:
   Desde: 2025-11-02T00:00:00.000Z
   Hasta: 2025-11-09T23:59:59.999Z
🔍 Query de búsqueda de turnos: {
  "empresaId": "San Jose",
  "clienteId": "69043bdf63cdbbc707fd4529",
  "fechaInicio": { "$gte": "...", "$lte": "..." },
  "estado": { "$in": ["pendiente", "confirmado"] }
}
✅ Encontrados 3 turnos
✅ Notificación enviada y flujo iniciado exitosamente
```

## 🔧 Archivos Modificados

1. **`src/services/notificacionesViajesService.ts`**
   - Agregado import de `ClienteModel` y `EmpresaModel`
   - Reescrita función `enviarNotificacionConfirmacionViajes()`
   - Agregados logs detallados de debug
   - Mejorado manejo de errores

## 📝 Recomendaciones Futuras

### 1. Estandarizar `empresaId`
Considerar usar **siempre ObjectId** en lugar de nombre:
```typescript
// En lugar de:
empresaId: "San Jose"  // String con nombre

// Usar:
empresaId: ObjectId("68ff85d68e9f378673d09fe9")
```

**Ventajas:**
- Más robusto ante cambios de nombre
- Mejor performance en queries
- Estándar de MongoDB

**Desventajas:**
- Requiere migración de datos existentes
- Cambios en múltiples archivos

### 2. Agregar Índices Compuestos
```typescript
// En ClienteModel
ClienteSchema.index({ empresaId: 1, telefono: 1 }, { unique: true });

// En TurnoModel (ya existe)
TurnoSchema.index({ empresaId: 1, clienteId: 1, fechaInicio: 1 });
```

### 3. Validación de Datos
Agregar validación en el frontend antes de crear turnos:
- Cliente debe existir
- Agente debe existir
- Horario debe estar disponible

### 4. Tests Unitarios
Crear tests para:
- `enviarNotificacionConfirmacionViajes()`
- `crearTurno()`
- Flujos de confirmación

## 🎯 Conclusión

El problema se resolvió **corrigiendo la búsqueda de turnos** para usar el ObjectId del cliente en lugar del teléfono. El sistema ahora:

✅ Busca correctamente empresa y cliente en MongoDB  
✅ Usa el ObjectId del cliente para buscar turnos  
✅ Valida que todas las entidades existan  
✅ Proporciona logs detallados para debugging  
✅ Maneja errores de forma descriptiva  

El flujo completo de creación de turnos y notificaciones está ahora **completamente integrado y funcional**.
