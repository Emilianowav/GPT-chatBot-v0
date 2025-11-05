# 🚨 Plantillas de Meta OBLIGATORIAS

## ✅ Cambio Crítico Implementado

**TODOS los flujos de notificaciones ahora REQUIEREN plantillas de Meta aprobadas.**

Si no hay plantilla configurada o no está aprobada en Meta, **el envío fallará** y no se enviará ningún mensaje.

## 🎯 Razón del Cambio

Las plantillas de Meta son **obligatorias** para:
1. ✅ Abrir la ventana de 24 horas para conversaciones
2. ✅ Cumplir con las políticas de WhatsApp Business
3. ✅ Evitar bloqueos de cuenta por mensajes fuera de ventana

## 📋 Flujos Afectados

### 1. Confirmación de Turnos (Clientes)
- **Plantilla:** `recordatorios_sanjose`
- **Comportamiento anterior:** Enviaba texto directo si fallaba
- **Comportamiento actual:** ❌ FALLA si no hay plantilla aprobada

### 2. Notificación Diaria (Agentes)
- **Plantilla:** `choferes_sanjose`
- **Comportamiento anterior:** Enviaba texto directo si fallaba
- **Comportamiento actual:** ❌ FALLA si no hay plantilla aprobada

## 🔧 Archivos Modificados

### 1. `confirmacionTurnosService.ts`
```typescript
// ✅ OBLIGATORIO: Solo enviar con plantilla de Meta
if (!notifConfirmacion?.usarPlantillaMeta || !notifConfirmacion?.plantillaMeta?.activa) {
  console.error('❌ NO SE PUEDE ENVIAR: Plantilla de Meta no configurada');
  return false; // ❌ FALLA - No envía
}

// Enviar con plantilla (SIN FALLBACK)
try {
  enviado = await enviarMensajePlantillaMeta(...);
} catch (error) {
  console.error('❌ ERROR CRÍTICO: No se pudo enviar plantilla');
  throw error; // ❌ PROPAGA ERROR
}
```

### 2. `notificacionesDiariasAgentesController.ts`
```typescript
// ✅ OBLIGATORIO: Solo enviar con plantilla de Meta
if (!notifConfig.usarPlantillaMeta || !notifConfig.plantillaMeta?.activa) {
  res.status(400).json({
    success: false,
    message: 'No se puede enviar: Plantilla de Meta no configurada'
  });
  return; // ❌ FALLA - No envía
}

// Enviar con plantilla (SIN FALLBACK)
try {
  enviado = await enviarMensajePlantillaMeta(...);
} catch (error) {
  res.status(500).json({
    success: false,
    message: 'Error al enviar plantilla de Meta'
  });
  return; // ❌ FALLA - Retorna error
}
```

### 3. `notificacionesDiariasAgentes.ts` (Servicio Automático)
```typescript
// ✅ OBLIGATORIO: Verificar plantilla antes de enviar
if (!config.usarPlantillaMeta || !config.plantillaMeta?.activa) {
  console.error('❌ NO SE PUEDE ENVIAR: Plantilla no configurada');
  return; // ❌ FALLA - No envía
}

// Enviar con plantilla (SIN FALLBACK)
try {
  const enviado = await enviarMensajePlantillaMeta(...);
} catch (error) {
  console.error('❌ ERROR CRÍTICO enviando plantilla');
  throw error; // ❌ PROPAGA ERROR
}
```

## 🚀 Pasos Necesarios

### 1. Configurar Plantillas en MongoDB
```bash
cd backend
npm run config:plantillas-meta
```

### 2. Aprobar Plantillas en Meta Business Manager

**Ve a:** https://business.facebook.com/

**Navega a:**
- WhatsApp Manager
- Plantillas de mensajes
- Busca: `recordatorios_sanjose` y `choferes_sanjose`

**Verifica:**
- ✅ Estado: Aprobado
- ✅ Idioma: Español (es)
- ✅ Categoría: Utility o Marketing

### 3. Estructura de Plantillas en Meta

#### `recordatorios_sanjose`
```
Sin parámetros - Texto fijo

Ejemplo:
"Hola! Tienes viajes programados para mañana.
¿Qué deseas hacer?
1️⃣ Confirmar todos los viajes
2️⃣ Editar un viaje específico"
```

#### `choferes_sanjose`
```
2 parámetros:

Hola {{1}}! 👋

Estos son tus viajes de hoy:

{{2}}

¡Que tengas un excelente día! 💪
```

Donde:
- `{{1}}` = Nombre del chofer
- `{{2}}` = Lista completa de viajes

## ⚠️ Errores Esperados

### Si no hay plantilla configurada:

**Confirmación de Turnos:**
```
❌ [ConfirmacionTurnos] NO SE PUEDE ENVIAR: Plantilla de Meta no configurada
   Las notificaciones DEBEN usar plantillas de Meta para abrir ventana de 24hs
```

**Notificación Diaria Agentes (Botón Probar):**
```json
{
  "success": false,
  "message": "No se puede enviar: Plantilla de Meta no configurada",
  "detalles": {
    "usarPlantillaMeta": false,
    "plantillaActiva": false
  }
}
```

**Notificación Diaria Agentes (Automática):**
```
❌ [NotifAgentes] NO SE PUEDE ENVIAR a Juan: Plantilla de Meta no configurada
   Las notificaciones DEBEN usar plantillas de Meta para abrir ventana de 24hs
```

### Si la plantilla no está aprobada en Meta:

```
❌ ERROR CRÍTICO: No se pudo enviar plantilla de Meta
   Verifica que la plantilla esté aprobada en Meta Business Manager

Error: 131026 - Template not found or not approved
```

## 🔍 Verificación

### 1. Verificar Configuración en MongoDB
```bash
npm run ver:notif-diaria-agentes
```

Debe mostrar:
```json
{
  "usarPlantillaMeta": true,
  "plantillaMeta": {
    "nombre": "choferes_sanjose",
    "idioma": "es",
    "activa": true
  }
}
```

### 2. Probar Envío
```bash
# Iniciar backend
npm start

# En el frontend:
# - Ir a Flujos Activos
# - Seleccionar "Notificación Diaria Agentes"
# - Click en "Probar"
```

**Resultado esperado:**
- ✅ Si plantilla aprobada: Mensaje enviado
- ❌ Si plantilla NO aprobada: Error 131026

## 📊 Comparación

### ❌ Antes (Con Fallback)
```
Plantilla configurada? 
  ├─ SÍ → Intenta plantilla
  │        └─ Falla? → Envía texto directo ⚠️
  └─ NO → Envía texto directo ⚠️
```

### ✅ Ahora (Sin Fallback)
```
Plantilla configurada?
  ├─ SÍ → Intenta plantilla
  │        └─ Falla? → ❌ ERROR (no envía nada)
  └─ NO → ❌ ERROR (no envía nada)
```

## 🎯 Beneficios

1. ✅ **Cumplimiento:** Siempre usa plantillas aprobadas
2. ✅ **Claridad:** Errores explícitos si falta configuración
3. ✅ **Prevención:** No envía mensajes que puedan bloquear la cuenta
4. ✅ **Ventana 24hs:** Siempre abre ventana correctamente

## 🔜 Próximos Pasos

1. ✅ Código implementado
2. ⏳ Ejecutar `npm run config:plantillas-meta`
3. ⏳ Aprobar plantillas en Meta Business Manager
4. ⏳ Probar con botón "Probar"
5. ⏳ Verificar que funcione correctamente

---

**IMPORTANTE:** No se enviará ningún mensaje hasta que las plantillas estén aprobadas en Meta Business Manager.
