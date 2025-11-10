# 🔔 Migración: Sistema de Notificaciones Unificado

## 📋 Resumen

Se ha rehecho **completamente** el sistema de notificaciones con una arquitectura moderna, escalable y flexible basada en plantillas de Meta WhatsApp.

## 🎯 Cambios Principales

### ✅ Nuevo Sistema
- **Servicio unificado** con arquitectura modular
- **Verificación flexible** de envío (hora_fija, inicio_jornada_agente, horas_antes_turno)
- **Plantillas de Meta** obligatorias (ventana de 24 horas)
- **Configuración en MongoDB** centralizada

### ❌ Sistema Antiguo (Eliminado)
- ~~notificacionesService.ts~~
- ~~notificacionesAutomaticasService.ts~~
- ~~notificacionesDiariasAgentes.ts~~
- ~~confirmacionTurnosService.ts~~

## 🚀 Pasos de Migración

### 1. Ejecutar Script de Migración

```bash
cd backend
npm run migrate:notificaciones
```

Este script:
- ✅ Lee la configuración actual de cada empresa
- ✅ Crea el objeto `plantillasMeta` automáticamente
- ✅ Configura valores por defecto inteligentes
- ✅ Actualiza MongoDB

### 2. Verificar Configuración

```bash
npm run verificar:notificaciones
```

Este script muestra:
- Estado de cada empresa
- Plantillas configuradas
- Agentes y clientes disponibles
- Endpoints para testing

### 3. Verificar Plantillas en Meta

1. Acceder a: https://business.facebook.com/wa/manage/message-templates/
2. Verificar que existan las plantillas:
   - `chofer_sanjose` (o según tipo de negocio)
   - `clientes_sanjose` (o según empresa)
3. Asegurarse de que estén **APROBADAS**

### 4. Compilar y Reiniciar

```bash
npm run build
npm start
```

O en desarrollo:
```bash
npm run dev
```

## 📊 Estructura del Objeto MongoDB

### Ejemplo Completo

```json
{
  "empresaId": "San Jose",
  "tipoNegocio": "viajes",
  "plantillasMeta": {
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
          "language": {"code": "es"},
          "components": [{
            "type": "body",
            "parameters": [
              {"type": "text", "text": "{{agente}}"},
              {"type": "text", "text": "{{lista_turnos}}"}
            ]
          }]
        }
      },
      "variables": {
        "phoneNumberId": {"origen": "empresa", "campo": "phoneNumberId"},
        "telefono": {"origen": "agente", "campo": "telefono"},
        "agente": {"origen": "calculado", "formula": "agente.nombre + ' ' + agente.apellido"},
        "lista_turnos": {"origen": "calculado", "formula": "construirListaTurnos(turnos, config)"}
      },
      "programacion": {
        "metodoVerificacion": "hora_fija",
        "horaEnvio": "06:00",
        "frecuencia": "diaria",
        "rangoHorario": "hoy",
        "filtroEstado": ["pendiente", "confirmado"],
        "incluirDetalles": {
          "origen": true,
          "destino": true,
          "nombreCliente": true,
          "telefonoCliente": false,
          "horaReserva": true,
          "notasInternas": false
        }
      }
    },
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
          "language": {"code": "es"},
          "components": [{
            "type": "body",
            "parameters": [
              {"type": "text", "text": "{{nombre_cliente}}"},
              {"type": "text", "text": "{{fecha_hora}}"}
            ]
          }]
        }
      },
      "variables": {
        "phoneNumberId": {"origen": "empresa", "campo": "phoneNumberId"},
        "telefono": {"origen": "cliente", "campo": "telefono"},
        "nombre_cliente": {"origen": "calculado", "formula": "cliente.nombre + ' ' + cliente.apellido"},
        "fecha_hora": {"origen": "calculado", "formula": "construirDetallesTurnos(turnos)"}
      },
      "programacion": {
        "metodoVerificacion": "hora_fija",
        "horaEnvio": "22:00",
        "diasAntes": 1,
        "filtroEstado": ["no_confirmado", "pendiente"]
      }
    }
  }
}
```

## 🧪 Testing

### Probar Notificación de Agente

```bash
curl -X POST http://localhost:3000/api/modules/calendar/notificaciones-meta/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "tipo": "agente",
    "empresaId": "San Jose",
    "telefono": "+543794946066"
  }'
```

### Probar Notificación de Cliente

```bash
curl -X POST http://localhost:3000/api/modules/calendar/notificaciones-meta/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "tipo": "cliente",
    "empresaId": "San Jose",
    "telefono": "+543794123456"
  }'
```

## 📁 Estructura de Archivos

### Nuevos Archivos

```
backend/src/
├── services/
│   ├── notificacionesMetaService.ts (servicio principal)
│   └── notificaciones/
│       ├── agentesService.ts
│       ├── confirmacionService.ts
│       └── pruebaService.ts
├── modules/calendar/
│   ├── controllers/
│   │   └── notificacionesMetaController.ts
│   ├── routes/
│   │   └── notificacionesMeta.ts
│   └── models/
│       └── ConfiguracionModulo.ts (actualizado)
└── scripts/
    ├── migrarSistemaNotificaciones.ts
    └── verificarConfiguracionNotificaciones.ts
```

## ⚙️ Configuración Flexible

### Método 1: Hora Fija
Enviar a una hora específica todos los días.

```json
{
  "programacion": {
    "metodoVerificacion": "hora_fija",
    "horaEnvio": "06:00"
  }
}
```

### Método 2: Inicio de Jornada del Agente
Enviar X minutos antes del inicio de jornada de cada agente.

```json
{
  "programacion": {
    "metodoVerificacion": "inicio_jornada_agente",
    "minutosAntes": 30
  }
}
```

### Método 3: Horas Antes del Turno
Enviar X horas antes de cada turno individual.

```json
{
  "programacion": {
    "metodoVerificacion": "horas_antes_turno",
    "horasAntes": 24
  }
}
```

## 🔍 Troubleshooting

### Error: "Plantilla no encontrada"
- Verificar que la plantilla esté aprobada en Meta Business Manager
- Verificar que el nombre coincida exactamente

### Error: "phoneNumberId no configurado"
- Verificar que la empresa tenga `phoneNumberId` en MongoDB
- Ejecutar: `npm run verificar:notificaciones`

### No se envían notificaciones
1. Verificar logs del servidor
2. Verificar que `activa: true`
3. Verificar que haya agentes/clientes con teléfonos
4. Verificar que haya turnos en el rango configurado

## 📞 Endpoints

### POST /api/modules/calendar/notificaciones-meta/test
Enviar notificación de prueba.

**Body:**
```json
{
  "tipo": "agente" | "cliente",
  "empresaId": "San Jose",
  "telefono": "+543794946066"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notificación de prueba enviada a agente",
  "detalles": {
    "tipo": "agente",
    "empresaId": "San Jose",
    "telefono": "+543794946066"
  }
}
```

## 🔗 Enlaces Útiles

- **Meta Business Manager**: https://business.facebook.com/wa/manage/message-templates/
- **Meta API Docs**: https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-message-templates

## ✅ Checklist Post-Migración

- [ ] Ejecutar `npm run migrate:notificaciones`
- [ ] Ejecutar `npm run verificar:notificaciones`
- [ ] Verificar plantillas en Meta Business Manager
- [ ] Compilar backend: `npm run build`
- [ ] Reiniciar servidor
- [ ] Probar notificación de agente
- [ ] Probar notificación de cliente
- [ ] Verificar logs del servidor
- [ ] Monitorear primeros envíos automáticos

## 📝 Notas Importantes

1. **Solo plantillas de Meta**: El sistema ya NO envía mensajes de texto normales
2. **Ventana de 24 horas**: Las plantillas de Meta permiten iniciar conversaciones
3. **Cron jobs**: Se ejecutan cada 60 segundos para verificar si es hora de enviar
4. **Zona horaria**: Argentina (UTC-3) para hora_fija
5. **Prevención de duplicados**: Sistema inteligente que evita envíos repetidos

## 🎉 Beneficios del Nuevo Sistema

- ✅ **Más simple**: Un solo servicio en lugar de 3
- ✅ **Más flexible**: Múltiples métodos de verificación
- ✅ **Más escalable**: Fácil agregar nuevos tipos de notificaciones
- ✅ **Más mantenible**: Código modular y limpio
- ✅ **Más confiable**: Mejor manejo de errores y logs
- ✅ **Cumple con Meta**: Solo plantillas aprobadas

---

**¿Preguntas o problemas?** Revisar logs del servidor o ejecutar `npm run verificar:notificaciones`
