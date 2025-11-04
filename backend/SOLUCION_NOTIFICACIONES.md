# 🔧 Solución: Problema de Notificaciones que No Llegan

## 📋 Problema Identificado

Algunos clientes reciben notificaciones de turnos y otros no, a pesar de que el turno se crea correctamente.

## 🔍 Causas Raíz

### 1. **Teléfono NO normalizado en `botTurnosService.ts`** ❌
El servicio del bot estaba guardando el teléfono del cliente **sin normalizar** (con +, espacios, guiones), lo que causaba:
- Duplicados en la base de datos
- Búsquedas fallidas al enviar notificaciones
- Inconsistencias entre el teléfono guardado y el que llega del webhook

### 2. **Falta de `phoneNumberId` en la empresa** ❌
Si la empresa no tiene configurado el campo `phoneNumberId` en MongoDB, las notificaciones fallan silenciosamente.

### 3. **Logs insuficientes** ❌
No había suficientes logs para diagnosticar dónde fallaba exactamente el envío de notificaciones.

## ✅ Soluciones Implementadas

### 1. Normalización de Teléfonos
**Archivo modificado:** `src/modules/calendar/services/botTurnosService.ts`

```typescript
// ⚠️ CRÍTICO: Normalizar teléfono (sin +, espacios, guiones)
const telefonoNormalizado = normalizarTelefono(conversacion.clienteTelefono);

// Buscar o crear cliente con teléfono normalizado
let cliente = await ClienteModel.findOne({
  telefono: telefonoNormalizado,
  empresaId
});

if (!cliente) {
  cliente = await ClienteModel.create({
    empresaId,
    nombre: 'Cliente',
    apellido: 'WhatsApp',
    telefono: telefonoNormalizado,  // ✅ Guardar normalizado
    origen: 'chatbot'
  });
}
```

### 2. Logs Mejorados
**Archivo modificado:** `src/services/notificacionesService.ts`

Ahora muestra:
- ✅ Teléfono del destinatario
- ✅ Empresa ID y nombre
- ✅ Si se encontró la empresa
- ✅ Si tiene phoneNumberId configurado
- ✅ Stack trace completo en caso de error

### 3. Script de Verificación
**Archivo creado:** `src/scripts/verificarConfiguracionNotificaciones.ts`

Verifica:
- ✅ Empresas y sus `phoneNumberId`
- ✅ Clientes y normalización de teléfonos
- ✅ Turnos recientes y sus notificaciones
- ✅ Configuración del módulo
- ✅ Variables de entorno (MODO_DEV, tokens, etc.)

## 🚀 Pasos para Resolver el Problema

### Paso 1: Ejecutar Script de Verificación
```bash
cd backend
npm run verificar:notificaciones
```

Este script te mostrará:
- ❌ Empresas sin `phoneNumberId`
- ❌ Clientes con teléfonos no normalizados
- ❌ Turnos sin notificaciones programadas
- ⚠️ Si MODO_DEV está en true

### Paso 2: Normalizar Teléfonos Existentes
```bash
npm run normalizar:telefonos
```

Esto normalizará todos los teléfonos en:
- Clientes
- ConversationStates

### Paso 3: Configurar phoneNumberId en Empresas

**Opción A: Desde MongoDB Compass**
1. Abrir la colección `empresas`
2. Editar cada empresa
3. Agregar el campo: `phoneNumberId: "768730689655171"`

**Opción B: Desde MongoDB Shell**
```javascript
db.empresas.updateOne(
  { nombre: "San Jose" },
  { $set: { phoneNumberId: "768730689655171" } }
)
```

**Opción C: Desde código (recomendado)**
Crear un script de migración:

```typescript
import { EmpresaModel } from '../models/Empresa.js';

const phoneNumberId = process.env.TEST_PHONE_NUMBER_ID || "768730689655171";

await EmpresaModel.updateMany(
  { phoneNumberId: { $exists: false } },
  { $set: { phoneNumberId } }
);
```

### Paso 4: Verificar MODO_DEV
En el archivo `.env`:
```bash
MODO_DEV=false   # ✅ Para enviar mensajes reales
# MODO_DEV=true  # ❌ Solo simula, no envía
```

### Paso 5: Reiniciar el Backend
```bash
npm run dev
```

### Paso 6: Probar con un Nuevo Turno
1. Eliminar registros de prueba anteriores (opcional)
2. Crear un nuevo turno desde WhatsApp
3. Verificar en los logs:
   - ✅ "Cliente creado/encontrado"
   - ✅ "Empresa encontrada"
   - ✅ "phoneNumberId encontrado"
   - ✅ "Notificación enviada exitosamente"

## 🔍 Cómo Diagnosticar Problemas Futuros

### 1. Revisar Logs del Backend
Buscar estos mensajes:
```
📤 ========== ENVIANDO NOTIFICACIÓN ==========
  📞 Teléfono: 5493794946066
  🏢 Empresa ID: San Jose
  📝 Mensaje: ...
✅ Empresa encontrada: San Jose
✅ phoneNumberId encontrado: 768730689655171
📨 Llamando a enviarMensajeWhatsAppTexto...
✅ Notificación enviada exitosamente
```

### 2. Errores Comunes

**Error: "Empresa no encontrada"**
- Verificar que `empresaId` en el turno coincida con `nombre` en la colección empresas
- Recordar: se usa `empresa.nombre` como `empresaId`, NO `empresa._id`

**Error: "phoneNumberId NO configurado"**
- Ejecutar Paso 3 de la solución

**Error: "Cliente no encontrado"**
- Verificar que el teléfono esté normalizado
- Ejecutar `npm run normalizar:telefonos`

**Mensaje no llega pero no hay error**
- Verificar `MODO_DEV=false` en `.env`
- Verificar que el token de WhatsApp sea válido

### 3. Verificar Notificaciones Programadas
```javascript
// En MongoDB
db.turnos.find({ 
  "notificaciones.enviada": false,
  "notificaciones.programadaPara": { $lte: new Date() }
})
```

## 📝 Checklist de Verificación

Antes de crear un turno, verificar:

- [ ] `MODO_DEV=false` en `.env`
- [ ] Empresa tiene `phoneNumberId` configurado
- [ ] Teléfonos normalizados (sin +, espacios, guiones)
- [ ] Configuración de módulo tiene notificaciones activas
- [ ] Backend corriendo sin errores
- [ ] Token de WhatsApp válido

## 🎯 Resultado Esperado

Después de aplicar estas soluciones:

1. ✅ Todos los teléfonos se guardan normalizados
2. ✅ Las notificaciones se envían correctamente
3. ✅ Los logs muestran información detallada
4. ✅ Fácil diagnosticar problemas futuros

## 📞 Soporte

Si el problema persiste:
1. Ejecutar `npm run verificar:notificaciones`
2. Copiar la salida completa
3. Revisar los logs del backend al crear un turno
4. Verificar que el número de WhatsApp esté registrado en Meta Business
