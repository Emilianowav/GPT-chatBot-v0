# 🧪 Guía para Testear Flujos desde Cero

## 🎯 Objetivo
Esta guía te ayudará a limpiar completamente la base de datos y testear los flujos automáticos de guardado de clientes y turnos desde cero.

## ⚠️ IMPORTANTE - Antes de Empezar

### Verificar Configuración
```bash
npm run verificar:notificaciones
```

**Asegúrate que:**
- ✅ `MODO_DEV=false` en `.env` (para enviar mensajes reales)
- ✅ La empresa tiene `phoneNumberId` configurado
- ✅ Tokens de WhatsApp válidos

## 🧹 Paso 1: Limpiar Base de Datos

### Ejecutar Script de Limpieza
```bash
npm run limpiar:test
```

Este script borrará **PERMANENTEMENTE**:
- 👥 Todos los clientes
- 📅 Todos los turnos
- 💬 Todos los estados de conversación (ConversationState)
- 🤖 Todas las conversaciones del bot

**El script pedirá confirmación doble:**
1. Primera confirmación: escribe `SI`
2. Segunda confirmación: escribe `BORRAR`

### Salida Esperada
```
📊 ========== ESTADÍSTICAS ACTUALES ==========
👥 Clientes: X
📅 Turnos: X
💬 Conversation States: X
🤖 Conversaciones Bot: X

⚠️  ========== ADVERTENCIA ==========
⚠️  Este script borrará PERMANENTEMENTE...

✅ ¡Limpieza completada exitosamente!
✅ La base de datos está lista para testear flujos desde cero.
```

## 🚀 Paso 2: Reiniciar Backend

```bash
npm run dev
```

**Verificar en los logs:**
- ✅ Conexión a MongoDB exitosa
- ✅ Servidor corriendo en puerto 3000
- ✅ Sin errores de configuración

## 📱 Paso 3: Testear Flujo Completo

### 3.1 Enviar Mensaje desde WhatsApp

Envía un mensaje al número de WhatsApp del chatbot:
```
Hola
```

### 3.2 Verificar Logs del Backend

Deberías ver:
```
📨 Mensaje recibido de: 5493794946066
🔍 Buscando/creando cliente:
  Teléfono original: 5493794946066
  Teléfono normalizado: 5493794946066
  Empresa: San Jose
📝 Cliente no encontrado, creando nuevo...
✅ Cliente creado: [ID]
```

### 3.3 Seguir el Flujo de Reserva

1. **Seleccionar opción 1** (Reservar turno)
2. **Ingresar fecha:** `15/11/2024`
3. **Ingresar hora:** `14:30`
4. **Seleccionar agente:** `1`
5. **Completar campos personalizados** (si aplica)
6. **Confirmar:** `1`

### 3.4 Verificar Creación del Turno

En los logs deberías ver:
```
🔍 DEBUG - Iniciando programación de notificaciones...
🔍 DEBUG - Procesando X notificaciones
✅ Turno creado con X notificaciones programadas
```

### 3.5 Verificar Notificación

Espera unos segundos y deberías ver:
```
📤 ========== ENVIANDO NOTIFICACIÓN ==========
  📞 Teléfono: 5493794946066
  🏢 Empresa ID: San Jose
✅ Empresa encontrada: San Jose
✅ phoneNumberId encontrado: 768730689655171
📨 Llamando a enviarMensajeWhatsAppTexto...
✅ Notificación enviada exitosamente
```

## ✅ Checklist de Verificación

### Antes de Testear
- [ ] Base de datos limpia (`npm run limpiar:test`)
- [ ] Backend reiniciado (`npm run dev`)
- [ ] `MODO_DEV=false` en `.env`
- [ ] Empresa tiene `phoneNumberId`
- [ ] Tokens válidos

### Durante el Test
- [ ] Cliente se crea automáticamente
- [ ] Teléfono se guarda normalizado
- [ ] ProfileName se extrae correctamente
- [ ] Turno se crea exitosamente
- [ ] Notificaciones se programan
- [ ] Notificaciones se envían

### Después del Test
- [ ] Cliente existe en MongoDB
- [ ] Turno existe en MongoDB
- [ ] ConversationState existe
- [ ] Notificación llegó a WhatsApp

## 🔍 Verificar Datos en MongoDB

### Verificar Cliente
```javascript
db.clientes.find({}).sort({ creadoEn: -1 }).limit(1)
```

**Verificar que tenga:**
- ✅ `telefono` normalizado (sin +, espacios, guiones)
- ✅ `nombre` y `apellido` extraídos del profileName
- ✅ `profileName` guardado
- ✅ `origen: "chatbot"`

### Verificar Turno
```javascript
db.turnos.find({}).sort({ creadoEn: -1 }).limit(1)
```

**Verificar que tenga:**
- ✅ `empresaId` (nombre de la empresa, no ObjectId)
- ✅ `clienteId` (String con el _id del cliente)
- ✅ `agenteId` (ObjectId del agente)
- ✅ `notificaciones` array con notificaciones programadas
- ✅ `estado: "pendiente"`

### Verificar ConversationState
```javascript
db.conversation_states.find({}).sort({ creadoEn: -1 }).limit(1)
```

**Verificar que tenga:**
- ✅ `telefono` normalizado
- ✅ `empresaId` correcto
- ✅ `flujoActual` y `paso` correctos

## 🐛 Problemas Comunes

### Cliente no se crea
**Causa:** Error en normalización de teléfono
**Solución:** Verificar logs, el teléfono debe estar normalizado

### Turno se crea pero sin notificaciones
**Causa:** ConfiguracionModulo no tiene notificaciones configuradas
**Solución:** Verificar en MongoDB que la empresa tenga configuración activa

### Notificación no llega
**Causa 1:** `MODO_DEV=true`
**Solución:** Cambiar a `MODO_DEV=false`

**Causa 2:** Empresa sin `phoneNumberId`
**Solución:** Agregar phoneNumberId en MongoDB

**Causa 3:** Token inválido
**Solución:** Verificar `META_WHATSAPP_TOKEN` en `.env`

### Duplicados en ConversationState
**Causa:** Teléfonos no normalizados
**Solución:** Ejecutar `npm run normalizar:telefonos`

## 📊 Scripts Útiles

```bash
# Limpiar todo para testear desde cero
npm run limpiar:test

# Verificar configuración
npm run verificar:notificaciones

# Normalizar teléfonos existentes
npm run normalizar:telefonos

# Ver logs en tiempo real
npm run dev
```

## 🎓 Flujo Completo de Testing

1. **Preparación:**
   ```bash
   npm run limpiar:test
   npm run verificar:notificaciones
   npm run dev
   ```

2. **Test 1 - Cliente Nuevo:**
   - Enviar mensaje desde número nuevo
   - Verificar creación automática de cliente
   - Verificar normalización de teléfono
   - Verificar extracción de nombre/apellido

3. **Test 2 - Crear Turno:**
   - Seguir flujo de reserva completo
   - Verificar creación de turno
   - Verificar programación de notificaciones

4. **Test 3 - Notificaciones:**
   - Esperar tiempo programado
   - Verificar envío de notificación
   - Verificar recepción en WhatsApp

5. **Test 4 - Cliente Existente:**
   - Enviar mensaje desde mismo número
   - Verificar que NO se cree duplicado
   - Verificar que use cliente existente

6. **Verificación Final:**
   ```bash
   npm run verificar:notificaciones
   ```

## ✅ Resultado Esperado

Después de un test exitoso:
- ✅ 1 cliente creado con datos correctos
- ✅ 1 turno creado con notificaciones programadas
- ✅ 1 ConversationState activo
- ✅ Notificación enviada y recibida
- ✅ Sin duplicados en la base de datos
- ✅ Todos los teléfonos normalizados

## 📝 Notas Importantes

1. **Normalización de Teléfonos:**
   - SIEMPRE usar `normalizarTelefono()` antes de guardar
   - Formato esperado: `5493794946066` (sin +, espacios, guiones)

2. **empresaId:**
   - Usar `empresa.nombre` como empresaId
   - NUNCA usar `empresa._id.toString()`

3. **Creación de Clientes:**
   - SIEMPRE usar `buscarOCrearClienteDesdeWhatsApp()`
   - NUNCA crear clientes manualmente en los flujos

4. **phoneNumberId:**
   - Cada empresa DEBE tener phoneNumberId configurado
   - Sin este campo, las notificaciones fallan silenciosamente
