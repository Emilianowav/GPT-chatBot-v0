# ✅ Configuración de Plantillas Completada

## 🎯 Estado Actual

Ambas plantillas de Meta están **configuradas en MongoDB** para la empresa "San Jose":

### 1. ✅ `recordatorios_sanjose` (Confirmación de Turnos)
- **Configurada:** ✅
- **Activa:** ✅
- **Parámetros:** Ninguno (texto fijo)
- **Uso:** Mensaje inicial para clientes

### 2. ✅ `choferes_sanjose` (Notificación Diaria Agentes)
- **Configurada:** ✅
- **Activa:** ✅
- **Parámetros:** 
  - `{{1}}` = Nombre del agente
  - `{{2}}` = Lista de turnos
- **Uso:** Notificación diaria para choferes

## 🚀 Próximos Pasos

### 1. Reiniciar el Servidor Backend

**IMPORTANTE:** El servidor necesita reiniciarse para cargar la nueva configuración.

```bash
# Detener el servidor actual (Ctrl+C)
# Luego iniciar nuevamente:
npm start
```

### 2. Probar el Envío

Una vez reiniciado el servidor:

1. Ve al frontend → Flujos Activos
2. Selecciona "Notificación Diaria Agentes"
3. Click en "Probar"
4. Ingresa un teléfono de agente

**Resultado esperado:**

- ❌ Si plantillas NO aprobadas en Meta:
  ```
  Error 131026: Template not found or not approved
  ```

- ✅ Si plantillas aprobadas en Meta:
  ```
  ✅ Notificación enviada exitosamente
  ```

### 3. Aprobar Plantillas en Meta Business Manager

Si ves el error 131026, necesitas aprobar las plantillas:

1. Ve a: https://business.facebook.com/
2. Selecciona tu cuenta de WhatsApp Business
3. Ve a: **WhatsApp Manager** → **Plantillas de mensajes**
4. Busca:
   - `recordatorios_sanjose`
   - `choferes_sanjose`
5. Verifica que estén **APROBADAS**

## 📋 Estructura de Plantillas en Meta

### `recordatorios_sanjose`

**Sin parámetros** - Texto fijo

Ejemplo:
```
Hola! Tienes viajes programados para mañana.

¿Qué deseas hacer?
1️⃣ Confirmar todos los viajes
2️⃣ Editar un viaje específico

Responde con el número de la opción.
```

### `choferes_sanjose`

**2 parámetros:**

```
Hola {{1}}! 👋

Estos son tus viajes de hoy:

{{2}}

¡Que tengas un excelente día! 💪
```

Donde:
- `{{1}}` = Nombre del chofer (ej: "Juan Pérez")
- `{{2}}` = Lista completa de viajes con detalles

Ejemplo de `{{2}}`:
```
1. 🕐 14:30
   María González
   📞 +5491112345678
   📍 Origen: San Juan 234
   🎯 Destino: Belgrano 1515

2. 🕐 17:30
   Carlos Rodríguez
   📞 +5491187654321
   📍 Origen: Av. Corrientes 1234
   🎯 Destino: Aeropuerto Ezeiza
```

## 🔍 Verificación

### Logs del Backend

Cuando pruebes el envío, verás en los logs:

**Si está configurado correctamente:**
```
📋 [NotifAgentes] Usando plantilla de Meta (OBLIGATORIO)
   Plantilla: choferes_sanjose
   Variables: { agente: 'Juan Pérez', lista_turnos: '...' }
📤 [MetaTemplate] Enviando plantilla de Meta:
   📞 Teléfono: 543794946066
   📋 Plantilla: choferes_sanjose
   🌐 Idioma: es
```

**Si NO está aprobada en Meta:**
```
❌ ERROR CRÍTICO: No se pudo enviar plantilla de Meta
   Verifica que la plantilla esté aprobada en Meta Business Manager
Error: 131026 - Template not found or not approved
```

## 📊 Resumen de Cambios

### Archivos Modificados
1. ✅ `confirmacionTurnosService.ts` - Usa plantilla obligatoria
2. ✅ `notificacionesDiariasAgentesController.ts` - Usa plantilla obligatoria
3. ✅ `notificacionesDiariasAgentes.ts` - Usa plantilla obligatoria
4. ✅ `metaTemplateService.ts` - Servicio de plantillas

### MongoDB
1. ✅ Configuración de empresa "San Jose" actualizada
2. ✅ `notificacionDiariaAgentes` creada con plantilla
3. ✅ `notificaciones[0]` (confirmación) actualizada con plantilla

## ⚠️ Recordatorios

1. **Reiniciar servidor** después de configurar plantillas
2. **Aprobar plantillas en Meta** antes de usar
3. **Verificar estructura** de plantillas en Meta
4. **Probar con botón "Probar"** antes de activar automático

---

**Estado:** ✅ Configuración completada - Listo para probar
**Siguiente:** Reiniciar servidor y probar envío
