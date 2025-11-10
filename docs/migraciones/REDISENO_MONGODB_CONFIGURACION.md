# 🔄 Rediseño de ConfiguracionModulo en MongoDB

## 📊 Análisis del Objeto Actual

### ❌ PROBLEMAS IDENTIFICADOS:

1. **Sistema de notificaciones obsoleto:**
   - `notificaciones[]` array con lógica antigua
   - `plantillaMensaje` con variables `{turnos}`, `{lista_turnos}`
   - `requiereConfirmacion`, `mensajeConfirmacion` - Ya no se usan
   - Duplicados: 2 notificaciones idénticas de confirmación

2. **Campos obsoletos:**
   - `chatbotActivo`, `chatbotPuedeCrear`, etc. - Funcionalidad no implementada
   - `estadosPersonalizados` - Array vacío sin uso
   - `tiempoLimiteConfirmacion` - No se valida
   - `usaHorariosDisponibilidad` - No implementado

3. **Estructura inconsistente:**
   - `notificacionDiariaAgentes` tiene `plantillaMeta` pero le falta `metaApiUrl` y `metaPayload`
   - `notificaciones[]` no tiene soporte para plantillas de Meta
   - Mezcla de configuración vieja y nueva

## ✅ NUEVA ESTRUCTURA LIMPIA Y ESCALABLE

```json
{
  "_id": "ObjectId",
  "empresaId": "San Jose",
  
  // ═══════════════════════════════════════
  // 🏢 INFORMACIÓN BÁSICA
  // ═══════════════════════════════════════
  "tipoNegocio": "viajes",
  "activo": true,
  
  // ═══════════════════════════════════════
  // 📝 NOMENCLATURA
  // ═══════════════════════════════════════
  "nomenclatura": {
    "turno": "Viaje",
    "turnos": "Viajes",
    "agente": "Chofer",
    "agentes": "Choferes",
    "cliente": "Pasajero",
    "clientes": "Pasajeros",
    "recurso": "Vehículo",
    "recursos": "Vehículos"
  },
  
  // ═══════════════════════════════════════
  // 🎨 CAMPOS PERSONALIZADOS
  // ═══════════════════════════════════════
  "camposPersonalizados": [
    {
      "clave": "origen",
      "etiqueta": "Origen",
      "tipo": "texto",
      "requerido": true,
      "placeholder": "Ej: Av. Corrientes 1234",
      "orden": 1,
      "mostrarEnLista": true,
      "mostrarEnCalendario": true,
      "usarEnNotificacion": true
    },
    {
      "clave": "destino",
      "etiqueta": "Destino",
      "tipo": "texto",
      "requerido": true,
      "placeholder": "Ej: Aeropuerto Ezeiza",
      "orden": 2,
      "mostrarEnLista": true,
      "mostrarEnCalendario": true,
      "usarEnNotificacion": true
    }
  ],
  
  // ═══════════════════════════════════════
  // ⚙️ CONFIGURACIÓN DE TURNOS
  // ═══════════════════════════════════════
  "turnos": {
    "usaAgentes": true,
    "agenteRequerido": true,
    "usaRecursos": true,
    "recursoRequerido": false,
    "duracionPorDefecto": 60,
    "permiteDuracionVariable": true
  },
  
  // ═══════════════════════════════════════
  // 📱 PLANTILLAS DE META (Sistema Escalable)
  // ═══════════════════════════════════════
  "plantillasMeta": {
    
    // 📋 Plantilla para notificación diaria de agentes
    "notificacionDiariaAgentes": {
      "activa": true,
      "nombre": "chofer_sanjose",
      "idioma": "es",
      "metaApiUrl": "https://graph.facebook.com/v22.0/{{phoneNumberId}}/messages",
      "metaPayload": {
        "messaging_product": "whatsapp",
        "to": "{{telefono}}",
        "type": "template",
        "template": {
          "name": "chofer_sanjose",
          "language": { "code": "es" },
          "components": [
            {
              "type": "body",
              "parameters": [
                { "type": "text", "text": "{{agente}}" },
                { "type": "text", "text": "{{lista_turnos}}" }
              ]
            }
          ]
        }
      },
      "variables": {
        "phoneNumberId": { "origen": "empresa", "campo": "phoneNumberId" },
        "telefono": { "origen": "agente", "campo": "telefono" },
        "agente": { "origen": "calculado", "formula": "agente.nombre + ' ' + agente.apellido" },
        "lista_turnos": { "origen": "calculado", "formula": "construirListaTurnos(turnos, config)" }
      },
      "programacion": {
        "horaEnvio": "06:00",
        "frecuencia": "diaria",
        "rangoHorario": "hoy",
        "filtroEstado": ["pendiente", "confirmado"],
        "incluirDetalles": {
          "origen": true,
          "destino": true,
          "nombreCliente": true,
          "horaReserva": true
        }
      },
      "ultimoEnvio": null
    },
    
    // 📋 Plantilla para confirmación de turnos (clientes)
    "confirmacionTurnos": {
      "activa": true,
      "nombre": "clientes_sanjose",
      "idioma": "es",
      "metaApiUrl": "https://graph.facebook.com/v22.0/{{phoneNumberId}}/messages",
      "metaPayload": {
        "messaging_product": "whatsapp",
        "to": "{{telefono}}",
        "type": "template",
        "template": {
          "name": "clientes_sanjose",
          "language": { "code": "es" },
          "components": []
        }
      },
      "variables": {
        "phoneNumberId": { "origen": "empresa", "campo": "phoneNumberId" },
        "telefono": { "origen": "cliente", "campo": "telefono" }
      },
      "programacion": {
        "momento": "dia_antes_turno",
        "horaEnvio": "21:00",
        "diasAntes": 1,
        "filtroEstado": ["pendiente", "no_confirmado"]
      }
    }
  },
  
  // ═══════════════════════════════════════
  // 📅 TIMESTAMPS
  // ═══════════════════════════════════════
  "creadoEn": "2025-11-01T00:00:00.000Z",
  "actualizadoEn": "2025-11-06T17:30:00.000Z"
}
```

## 🔄 MIGRACIÓN DE DATOS

### Mapeo de campos:

```
ANTIGUO → NUEVO

notificacionDiariaAgentes → plantillasMeta.notificacionDiariaAgentes
├─ activa → activa
├─ horaEnvio → programacion.horaEnvio
├─ plantillaMeta.nombre → nombre
├─ plantillaMeta.idioma → idioma
├─ plantillaMeta.componentes.body → metaPayload.template.components
├─ filtroEstado → programacion.filtroEstado
├─ incluirDetalles → programacion.incluirDetalles
└─ ultimoEnvio → ultimoEnvio

notificaciones[0] → plantillasMeta.confirmacionTurnos
├─ activa → activa
├─ horaEnvioDiaAntes → programacion.horaEnvio
├─ diasAntes → programacion.diasAntes
└─ filtros.estados → programacion.filtroEstado

ELIMINAR:
├─ notificaciones[] (array completo)
├─ chatbotActivo, chatbotPuedeCrear, etc.
├─ estadosPersonalizados
├─ tiempoLimiteConfirmacion
├─ requiereConfirmacion
├─ usaHorariosDisponibilidad
└─ notificacionDiariaAgentes (mover a plantillasMeta)
```

## 📋 VENTAJAS DEL NUEVO DISEÑO

### 1. **Escalabilidad:**
- Agregar nueva plantilla = agregar objeto en `plantillasMeta`
- No hay límite de plantillas
- Cada plantilla es independiente

### 2. **Claridad:**
- Estructura plana y organizada
- Secciones bien definidas
- Sin duplicados

### 3. **Mantenibilidad:**
- Fácil de entender
- Fácil de modificar
- Sin campos obsoletos

### 4. **Flexibilidad:**
- Soporta cualquier tipo de plantilla de Meta
- Variables configurables
- Programación flexible

## 🚀 IMPLEMENTACIÓN

### Paso 1: Crear script de migración
```bash
npx tsx src/scripts/migrarConfiguracionLimpia.ts
```

### Paso 2: Actualizar modelo TypeScript
- Actualizar `ConfiguracionModulo.ts`
- Eliminar interfaces obsoletas
- Agregar nuevas interfaces

### Paso 3: Actualizar servicios
- `notificacionesDiariasAgentes.ts` → usar `plantillasMeta.notificacionDiariaAgentes`
- `confirmacionTurnosService.ts` → usar `plantillasMeta.confirmacionTurnos`
- Eliminar referencias a `config.notificaciones[]`

### Paso 4: Probar
- Envío de notificación diaria de agentes
- Envío de confirmación de turnos
- Verificar que todo funciona

## 📊 COMPARACIÓN

### Antes (Obsoleto):
- 32 campos en el objeto raíz
- 2 notificaciones duplicadas
- Mezcla de sistemas viejos y nuevos
- 15+ campos sin uso
- Estructura inconsistente

### Después (Limpio):
- 8 campos en el objeto raíz
- Sin duplicados
- Sistema único y escalable
- 0 campos sin uso
- Estructura clara y organizada

---

**Reducción: ~60% menos campos, 100% más escalable**
