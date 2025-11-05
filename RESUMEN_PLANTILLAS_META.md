# 📋 Resumen: Plantillas de Meta - San Jose

## ✅ Implementación Completada

Se implementó el sistema de plantillas de Meta para permitir notificaciones fuera de la ventana de 24 horas.

## 🎯 Plantillas Configuradas

### 1. `recordatorios_sanjose` (Confirmación de Turnos)

**Uso:** Primer mensaje para clientes  
**Propósito:** Abrir ventana de 24 horas  
**Parámetros:** Ninguno (texto fijo en la plantilla)

**Flujo:**
```
1. Plantilla de Meta envía mensaje inicial (texto fijo)
2. Usuario responde con opción (1 o 2)
3. Nuestra infraestructura (flowManager) maneja el resto
4. Mensajes siguientes: texto normal
```

**Configuración en MongoDB:**
```json
{
  "usarPlantillaMeta": true,
  "plantillaMeta": {
    "nombre": "recordatorios_sanjose",
    "idioma": "es",
    "activa": true,
    "componentes": {
      "body": {
        "parametros": []
      }
    }
  }
}
```

### 2. `choferes_sanjose` (Notificación Diaria Agentes)

**Uso:** Notificación diaria para choferes  
**Propósito:** Enviar lista de viajes del día  
**Parámetros:**
1. `{agente}` - Nombre del chofer
2. `{lista_turnos}` - Lista formateada de viajes

**Ejemplo de variables:**
```javascript
{
  agente: "Juan Pérez",
  lista_turnos: `1. 🕐 14:30
   María González
   📞 +5491112345678
   📍 Origen: San Juan 234
   🎯 Destino: Belgrano 1515
   📝 Cliente VIP

2. 🕐 17:30
   Carlos Rodríguez
   📞 +5491187654321
   📍 Origen: Av. Corrientes 1234
   🎯 Destino: Aeropuerto Ezeiza`
}
```

**Configuración en MongoDB:**
```json
{
  "usarPlantillaMeta": true,
  "plantillaMeta": {
    "nombre": "choferes_sanjose",
    "idioma": "es",
    "activa": true,
    "componentes": {
      "body": {
        "parametros": [
          { "tipo": "text", "variable": "agente" },
          { "tipo": "text", "variable": "lista_turnos" }
        ]
      }
    }
  }
}
```

## 🚀 Comandos

### Configurar Plantillas
```bash
cd backend
npm run config:plantillas-meta
```

### Compilar y Ejecutar
```bash
npm run build
npm start
```

## 📝 Estructura de Mensaje a Meta

### Para `recordatorios_sanjose`:
```json
{
  "messaging_product": "whatsapp",
  "to": "5491112345678",
  "type": "template",
  "template": {
    "name": "recordatorios_sanjose",
    "language": {
      "code": "es"
    },
    "components": []
  }
}
```

### Para `choferes_sanjose`:
```json
{
  "messaging_product": "whatsapp",
  "to": "5491112345678",
  "type": "template",
  "template": {
    "name": "choferes_sanjose",
    "language": {
      "code": "es"
    },
    "components": [
      {
        "type": "body",
        "parameters": [
          { "type": "text", "text": "Juan Pérez" },
          { "type": "text", "text": "1. 🕐 14:30\n   María González\n..." }
        ]
      }
    ]
  }
}
```

## 🔧 Archivos Modificados

### Backend

1. **`src/services/metaTemplateService.ts`** ✅ NUEVO
   - Servicio para enviar plantillas de Meta
   - Corregido error de tipeo (`components` → `componentes`)

2. **`src/modules/calendar/models/ConfiguracionModulo.ts`** ✅
   - Agregados campos `usarPlantillaMeta` y `plantillaMeta`
   - En `NotificacionAutomatica` y `NotificacionDiariaAgentes`

3. **`src/modules/calendar/services/confirmacionTurnosService.ts`** ✅
   - Verifica si debe usar plantilla
   - Envía con plantilla si está configurada (sin parámetros)
   - Fallback a texto directo si falla

4. **`src/modules/calendar/controllers/notificacionesDiariasAgentesController.ts`** ✅
   - Genera lista de turnos formateada
   - Envía con plantilla si está configurada
   - Parámetros: `agente` y `lista_turnos`

5. **`src/scripts/configurarPlantillasMeta.ts`** ✅ NUEVO
   - Script para configurar ambas plantillas
   - Actualizado con parámetros correctos

6. **`package.json`** ✅
   - Agregado script `config:plantillas-meta`

## 📊 Diferencias Clave

### Confirmación de Turnos
- ❌ **Antes:** Mensaje de texto directo con detalles del viaje
- ✅ **Ahora:** Plantilla de Meta (texto fijo) → Usuario responde → Nuestra infraestructura maneja

### Notificación Diaria Agentes
- ❌ **Antes:** Mensaje de texto directo con lista de viajes
- ✅ **Ahora:** Plantilla de Meta con 2 parámetros (nombre + lista de viajes)

## ⚠️ Importante

### En Meta Business Manager

Las plantillas deben tener esta estructura:

**recordatorios_sanjose:**
- Sin parámetros en el body
- Texto fijo con las opciones de respuesta

**choferes_sanjose:**
- 2 parámetros en el body:
  - `{{1}}` = Nombre del chofer
  - `{{2}}` = Lista de viajes

### Ejemplo de Plantilla en Meta

```
Hola {{1}}! 👋

Estos son tus viajes de hoy:

{{2}}

¡Que tengas un excelente día! 💪
```

## 🔄 Flujo Completo

### Confirmación de Turnos
```
Cron Job detecta turno
  ↓
¿Tiene plantilla configurada?
  ├─ SÍ → Envía "recordatorios_sanjose"
  │        - Sin parámetros
  │        - Abre ventana 24hs
  │        - Usuario responde
  │        - FlowManager maneja resto
  │
  └─ NO → Envía texto directo
```

### Notificación Diaria Agentes
```
Cron Job ejecuta a las 06:00
  ↓
¿Tiene plantilla configurada?
  ├─ SÍ → Envía "choferes_sanjose"
  │        - Parámetro 1: Nombre chofer
  │        - Parámetro 2: Lista viajes
  │        - Abre ventana 24hs
  │
  └─ NO → Envía texto directo
```

## ✅ Próximos Pasos

1. ✅ Código implementado
2. ⏳ Ejecutar `npm run config:plantillas-meta`
3. ⏳ Verificar plantillas en Meta Business Manager
4. ⏳ Probar con botón "Probar" del frontend
5. ⏳ Ajustar texto de plantillas en Meta si es necesario

---

**Nota:** El sistema está listo. Solo falta ejecutar el script de configuración y verificar que las plantillas en Meta tengan la estructura correcta.
