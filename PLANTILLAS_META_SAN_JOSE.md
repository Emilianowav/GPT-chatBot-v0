# 📋 Plantillas de Meta - Empresa San Jose

## 🎯 Resumen

Se implementó el sistema de **plantillas de Meta (WhatsApp Templates)** para permitir que las notificaciones automáticas puedan iniciar conversaciones **fuera de la ventana de 24 horas**.

## 📋 Plantillas Configuradas

### 1. `recordatorios_sanjose`
**Uso:** Confirmación de turnos para clientes  
**Flujo:** Notificación de viajes para clientes  
**Tipo:** `confirmacion`

**Variables disponibles:**
- `{cliente}` - Nombre completo del cliente
- `{fecha}` - Fecha del viaje
- `{hora}` - Hora del viaje
- `{origen}` - Dirección de origen
- `{destino}` - Dirección de destino
- `{cantidad}` - Cantidad de viajes
- `{pasajeros}` - Número de pasajeros
- `{turno_id}` - ID del turno

### 2. `choferes_sanjose`
**Uso:** Notificación diaria para agentes/choferes  
**Flujo:** Resumen diario de viajes  
**Tipo:** `notificacion_diaria_agentes`

**Variables disponibles:**
- `{agente}` - Nombre completo del agente/chofer
- `{fecha}` - Fecha de hoy
- `{cantidad}` - Cantidad de viajes del día

## 🔧 Archivos Modificados

### Backend

1. **`src/modules/calendar/models/ConfiguracionModulo.ts`**
   - ✅ Agregado campo `usarPlantillaMeta` a `NotificacionAutomatica`
   - ✅ Agregado campo `plantillaMeta` con estructura completa
   - ✅ Agregado campo `usarPlantillaMeta` a `NotificacionDiariaAgentes`
   - ✅ Agregado campo `plantillaMeta` a `NotificacionDiariaAgentes`

2. **`src/services/metaTemplateService.ts`** (NUEVO)
   - ✅ `enviarMensajePlantillaMeta()` - Envía mensaje con plantilla
   - ✅ `generarComponentesPlantilla()` - Procesa variables y genera componentes
   - ✅ `validarConfiguracionPlantilla()` - Valida estructura
   - ✅ Manejo de errores específicos de Meta

3. **`src/modules/calendar/services/confirmacionTurnosService.ts`**
   - ✅ Importa servicios de plantillas
   - ✅ Verifica si debe usar plantilla de Meta
   - ✅ Envía con plantilla si está configurada
   - ✅ Fallback a texto directo si falla
   - ✅ Mantiene compatibilidad con flujo anterior

4. **`src/scripts/configurarPlantillasMeta.ts`** (NUEVO)
   - ✅ Script para configurar plantillas en MongoDB
   - ✅ Configura `recordatorios_sanjose` para confirmación
   - ✅ Configura `choferes_sanjose` para agentes

5. **`package.json`**
   - ✅ Agregado script `config:plantillas-meta`

### Documentación

1. **`IMPLEMENTACION_PLANTILLAS_META.md`** (NUEVO)
   - Documentación completa del sistema
   - Flujo detallado
   - Ejemplos de configuración

2. **`PLANTILLAS_META_SAN_JOSE.md`** (ESTE ARCHIVO)
   - Resumen específico para San Jose
   - Comandos y configuración

## 🚀 Cómo Usar

### 1. Configurar Plantillas en MongoDB

```bash
cd backend
npm run config:plantillas-meta
```

Este script:
- ✅ Busca la configuración de "San Jose"
- ✅ Configura `recordatorios_sanjose` en notificación de confirmación
- ✅ Configura `choferes_sanjose` en notificación diaria de agentes
- ✅ Guarda los cambios en MongoDB

### 2. Verificar Configuración

Después de ejecutar el script, verás un resumen:

```
📊 RESUMEN DE CONFIGURACIÓN
═══════════════════════════════════════
Empresa: San Jose

1. Confirmación de Turnos (Clientes):
   Plantilla: recordatorios_sanjose
   Activa: ✅

2. Notificación Diaria (Agentes):
   Plantilla: choferes_sanjose
   Activa: ✅
═══════════════════════════════════════
```

### 3. Ajustar Componentes de la Plantilla

Si necesitas ajustar las variables de la plantilla, edita el script:

```typescript
// En src/scripts/configurarPlantillasMeta.ts

// Para recordatorios_sanjose
body: {
  parametros: [
    { tipo: 'text', variable: 'cliente' },
    { tipo: 'text', variable: 'fecha' },
    { tipo: 'text', variable: 'hora' },
    { tipo: 'text', variable: 'origen' },
    { tipo: 'text', variable: 'destino' }
  ]
}

// Para choferes_sanjose
body: {
  parametros: [
    { tipo: 'text', variable: 'agente' },
    { tipo: 'text', variable: 'fecha' },
    { tipo: 'text', variable: 'cantidad' }
  ]
}
```

## 🔄 Flujo de Funcionamiento

### Confirmación de Turnos (Clientes)

```
1. Cron Job detecta turno para notificar
   ↓
2. Servicio de confirmación verifica configuración
   ↓
3. ¿Tiene plantilla de Meta configurada?
   ├─ SÍ → Envía con plantilla "recordatorios_sanjose"
   │        - Procesa variables (cliente, fecha, hora, origen, destino)
   │        - Genera componentes
   │        - Envía vía API de Meta
   │        - ✅ Funciona fuera de 24hs
   │        ↓
   │    Inicia flujo conversacional
   │        ↓
   │    Cliente responde "1" o "2"
   │        ↓
   │    Mensajes siguientes: texto normal
   │
   └─ NO → Envía mensaje de texto directo
            - ❌ Solo funciona dentro de 24hs
```

### Notificación Diaria (Agentes)

```
1. Cron Job ejecuta a la hora configurada (ej: 06:00)
   ↓
2. Servicio de notificaciones diarias verifica configuración
   ↓
3. ¿Tiene plantilla de Meta configurada?
   ├─ SÍ → Envía con plantilla "choferes_sanjose"
   │        - Procesa variables (agente, fecha, cantidad)
   │        - Genera componentes
   │        - Envía vía API de Meta
   │        - ✅ Funciona fuera de 24hs
   │        ↓
   │    Mensaje enviado (sin flujo conversacional)
   │
   └─ NO → Envía mensaje de texto directo
            - ❌ Solo funciona dentro de 24hs
```

## ⚠️ Importante

### Antes de Usar

1. **Plantillas deben estar aprobadas en Meta Business Manager**
   - Ve a Meta Business Manager
   - Sección "Plantillas de mensajes"
   - Verifica que `recordatorios_sanjose` y `choferes_sanjose` estén aprobadas

2. **Variables deben coincidir exactamente**
   - Las variables en el script deben coincidir con las de la plantilla en Meta
   - Orden de las variables es importante
   - Tipo de variables debe ser correcto

3. **Probar primero**
   - Usa el botón "Probar" en el frontend
   - Verifica que el mensaje se envíe correctamente
   - Revisa los logs del backend

### Si Hay Errores

**Error 131026:** Plantilla no encontrada o no aprobada
- Verifica que la plantilla exista en Meta
- Verifica que esté aprobada
- Verifica el nombre exacto

**Error 131047:** Parámetros incorrectos
- Verifica que las variables coincidan
- Verifica el orden de las variables
- Verifica el tipo de cada variable

**Error 131051:** Plantilla pausada
- Reactiva la plantilla en Meta Business Manager

## 📝 Ejemplo de Configuración en MongoDB

```json
{
  "empresaId": "San Jose",
  "notificaciones": [
    {
      "tipo": "confirmacion",
      "activa": true,
      "usarPlantillaMeta": true,
      "plantillaMeta": {
        "nombre": "recordatorios_sanjose",
        "idioma": "es",
        "activa": true,
        "componentes": {
          "body": {
            "parametros": [
              { "tipo": "text", "variable": "cliente" },
              { "tipo": "text", "variable": "fecha" },
              { "tipo": "text", "variable": "hora" },
              { "tipo": "text", "variable": "origen" },
              { "tipo": "text", "variable": "destino" }
            ]
          }
        }
      }
    }
  ],
  "notificacionDiariaAgentes": {
    "activa": true,
    "usarPlantillaMeta": true,
    "plantillaMeta": {
      "nombre": "choferes_sanjose",
      "idioma": "es",
      "activa": true,
      "componentes": {
        "body": {
          "parametros": [
            { "tipo": "text", "variable": "agente" },
            { "tipo": "text", "variable": "fecha" },
            { "tipo": "text", "variable": "cantidad" }
          ]
        }
      }
    }
  }
}
```

## ✅ Ventajas

1. **Inicia conversaciones fuera de 24hs** ✅
2. **Flexible**: Puede usar plantillas o texto directo
3. **Retrocompatible**: Si no hay plantilla, funciona como antes
4. **Fallback automático**: Si falla plantilla, usa texto directo
5. **Fácil de configurar**: Un solo script

## 🔜 Próximos Pasos

1. ✅ Ejecutar script de configuración
2. ⏳ Verificar plantillas en Meta Business Manager
3. ⏳ Probar envío con botón "Probar" del frontend
4. ⏳ Ajustar variables si es necesario
5. ⏳ Activar notificaciones automáticas

---

**Nota:** Este sistema está listo para usar. Solo necesitas ejecutar el script de configuración y verificar que las plantillas estén aprobadas en Meta.
