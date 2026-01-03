# 📖 Guía de Auditoría de Colecciones MongoDB

## 🎯 Propósito

El script `auditar-todas-colecciones.js` permite:
- Listar todas las colecciones de la base de datos
- Analizar la estructura de cada colección
- Contar documentos
- Identificar índices configurados
- Generar documentación automática en JSON y Markdown

---

## 🚀 Uso

### Ejecución básica:

```bash
cd backend
node scripts/auditar-todas-colecciones.js
```

### Salida generada:

1. **Consola:** Análisis detallado de cada colección
2. **JSON:** `docs/AUDITORIA-COLECCIONES.json` - Datos estructurados
3. **Markdown:** `docs/AUDITORIA-COLECCIONES.md` - Documentación legible

---

## 📊 Resultados de la Última Auditoría

**Fecha:** 3/1/2026, 03:00:18

### Resumen General:

- **Total de colecciones:** 33
- **Colecciones con datos:** 21
- **Colecciones vacías:** 12
- **Total de documentos:** 608

### Top 5 Colecciones por Documentos:

1. **api_request_logs:** 228 documentos
2. **contactos_empresa:** 153 documentos
3. **flow_logs:** 77 documentos
4. **flujos:** 15 documentos
5. **turnos:** 15 documentos

---

## 📦 Colecciones Principales

### 1. **empresas** (12 documentos)
**Propósito:** Configuración de empresas/clientes del sistema

**Campos clave:**
- `nombre` (UNIQUE)
- `telefono` (UNIQUE)
- `modulos` - Array de módulos activos
- `plan` - Plan contratado (basico, standard, premium)
- `prompt` - Prompt para GPT
- `phoneNumberId` - ID de WhatsApp Business

**Índices:**
- `nombre` (UNIQUE)
- `telefono` (UNIQUE)

---

### 2. **contactos_empresa** (153 documentos)
**Propósito:** Contactos/clientes de cada empresa

**Campos clave:**
- `empresaId` - Referencia a empresa
- `telefono` - Número de WhatsApp
- `conversaciones.historial` - Historial de mensajes
- `metricas` - Estadísticas de interacción
- `chatbotPausado` - Si está en intervención manual

**Índices importantes:**
- `empresaId, telefono`
- `metricas.ultimaInteraccion`

---

### 3. **api_configurations** (6 documentos)
**Propósito:** Configuración de APIs externas (WooCommerce, MisCanchas, etc.)

**Campos clave:**
- `empresaId` - Empresa propietaria
- `baseUrl` - URL de la API
- `autenticacion` - Credenciales encriptadas
- `endpoints` - Array de endpoints configurados
- `workflows` - Workflows conversacionales

**Uso:**
- Veo Veo: WooCommerce API
- Juventus: MisCanchas API
- Intercapital: API personalizada

---

### 4. **usuarios_empresa** (15 documentos)
**Propósito:** Usuarios del CRM por empresa

**Campos clave:**
- `username` (UNIQUE)
- `empresaId` - Empresa a la que pertenece
- `rol` - admin, agente, viewer
- `permisos` - Array de permisos específicos
- `activo` - Si puede acceder

**Roles:**
- `admin` - Acceso completo
- `agente` - Gestión de turnos/conversaciones
- `viewer` - Solo lectura

---

### 5. **mppaymentlinks** (13 documentos)
**Propósito:** Links de pago de Mercado Pago

**Campos clave:**
- `sellerId` - ID del vendedor en MP
- `slug` (UNIQUE) - URL amigable
- `title` - Nombre del producto/servicio
- `unitPrice` - Precio
- `active` - Si está disponible

**Uso:**
- Generación dinámica de links de pago
- Catálogo de productos para GPT

---

### 6. **mppayments** (9 documentos)
**Propósito:** Registro de pagos recibidos

**Campos clave:**
- `mpPaymentId` (UNIQUE) - ID de Mercado Pago
- `status` - approved, pending, rejected
- `amount` - Monto pagado
- `externalReference` - Referencia al pedido/reserva

**Estados:**
- `approved` - Pago exitoso
- `pending` - En proceso
- `rejected` - Rechazado

---

### 7. **turnos** (15 documentos)
**Propósito:** Reservas/turnos de clientes

**Campos clave:**
- `empresaId` - Empresa
- `agenteId` - Agente asignado
- `clienteId` - Cliente
- `fechaInicio` / `fechaFin` - Horario
- `estado` - pendiente, confirmado, completado, cancelado
- `notificaciones` - Array de notificaciones enviadas

**Uso:**
- San Jose: Viajes de remis
- Paraná Lodge: Reservas de alojamiento

---

### 8. **configuraciones_modulo** (11 documentos)
**Propósito:** Configuración del módulo de calendario/turnos

**Campos clave:**
- `empresaId` (UNIQUE)
- `tipoNegocio` - viajes, alojamiento, canchas
- `plantillasMeta` - Plantillas de WhatsApp
- `notificacionDiariaAgentes` - Config de notificaciones
- `mensajesFlujo` - Mensajes del chatbot

---

### 9. **agentes** (11 documentos)
**Propósito:** Agentes/profesionales que atienden

**Campos clave:**
- `empresaId` - Empresa
- `nombre`, `apellido`, `email`
- `disponibilidad` - Horarios de atención
- `duracionTurnoPorDefecto` - Duración estándar
- `activo` - Si está disponible

---

### 10. **chatbots** (8 documentos)
**Propósito:** Configuración de chatbots de WhatsApp

**Campos clave:**
- `empresaId` - Empresa propietaria
- `whatsapp.phoneNumberId` (UNIQUE) - ID de WhatsApp Business
- `configuracion` - Configuración del bot
- `derivacion` - Reglas de derivación
- `activo` - Si está funcionando

---

## 🔍 Colecciones Vacías (Futuro)

### Colecciones preparadas pero sin uso:

1. **bloqueos_horario** - Bloqueos de agenda
2. **clientes** - Sistema antiguo (migrado a contactos_empresa)
3. **configuracion_bots** - Sistema antiguo (migrado a configuracionbots)
4. **conversation_states** - Estados de conversación (no usado actualmente)
5. **integration_configurations** - Integraciones futuras
6. **marketplace_integrations** - Marketplace de módulos
7. **mpsubscriptionplans** - Planes de suscripción MP
8. **ocrconfigs** / **ocrdocuments** - OCR de documentos
9. **webhook_configurations** - Webhooks externos

---

## 🔑 Índices Importantes

### Por rendimiento:

1. **contactos_empresa:**
   - `empresaId, telefono` - Búsqueda rápida de contactos
   - `metricas.ultimaInteraccion` - Ordenar por actividad

2. **api_request_logs:**
   - `apiConfigId, createdAt` - Logs por API
   - `estado, createdAt` - Filtrar errores

3. **turnos:**
   - `empresaId, fechaInicio` - Turnos por fecha
   - `empresaId, agenteId, fechaInicio` - Agenda de agente

4. **mppayments:**
   - `empresaId, status` - Pagos por estado
   - `mpPaymentId` (UNIQUE) - Evitar duplicados

---

## 📈 Estadísticas de Uso

### Distribución de documentos:

```
api_request_logs:     228 (37.5%)
contactos_empresa:    153 (25.2%)
flow_logs:             77 (12.7%)
turnos:                15 (2.5%)
flujos:                15 (2.5%)
usuarios_empresa:      15 (2.5%)
empresas:              12 (2.0%)
agentes:               11 (1.8%)
configuraciones_modulo: 11 (1.8%)
chatbots:               8 (1.3%)
Otros:                 73 (12.0%)
```

### Crecimiento esperado:

- **contactos_empresa:** Alto (nuevos clientes diarios)
- **api_request_logs:** Muy alto (cada llamada API)
- **turnos:** Medio (reservas diarias)
- **mppayments:** Medio (pagos diarios)

---

## 🛠️ Mantenimiento

### Limpieza recomendada:

1. **api_request_logs:** Archivar logs > 30 días
2. **flow_logs:** Archivar logs > 30 días
3. **conversation_states:** Limpiar estados abandonados

### Monitoreo:

```bash
# Ver crecimiento de colecciones
node scripts/auditar-todas-colecciones.js

# Comparar con auditoría anterior
diff docs/AUDITORIA-COLECCIONES.json docs/AUDITORIA-COLECCIONES-ANTERIOR.json
```

---

## 🔐 Seguridad

### Datos sensibles en colecciones:

1. **usuarios_empresa:** Contraseñas hasheadas (bcrypt)
2. **api_configurations:** Credenciales encriptadas
3. **mpsellers:** Tokens de Mercado Pago
4. **afipsellers:** Certificados AFIP

**Importante:** Nunca exponer estos datos en logs o APIs públicas.

---

## 📝 Notas Técnicas

### Convenciones:

- **ObjectId:** Todos los `_id` son ObjectId de MongoDB
- **Timestamps:** Campos `createdAt`, `updatedAt` automáticos
- **Soft Delete:** Usar campo `activo: false` en lugar de eliminar
- **Índices únicos:** Previenen duplicados a nivel de BD

### Relaciones:

```
empresas (1) ──→ (N) contactos_empresa
empresas (1) ──→ (N) usuarios_empresa
empresas (1) ──→ (N) chatbots
empresas (1) ──→ (N) api_configurations
empresas (1) ──→ (N) agentes
empresas (1) ──→ (N) turnos

api_configurations (1) ──→ (N) api_request_logs

mpsellers (1) ──→ (N) mppaymentlinks
mpsellers (1) ──→ (N) mppayments
```

---

## 🚀 Próximos Pasos

1. **Optimización:**
   - Agregar índices compuestos según queries frecuentes
   - Implementar TTL indexes para logs antiguos

2. **Nuevas colecciones:**
   - `notificaciones` - Sistema de notificaciones
   - `auditoria` - Log de cambios importantes
   - `reportes` - Reportes generados

3. **Migraciones:**
   - Consolidar `usuarios_empresa` y `usuarios_empresas`
   - Deprecar colecciones antiguas vacías

---

## 📚 Referencias

- **Script:** `backend/scripts/auditar-todas-colecciones.js`
- **Documentación JSON:** `backend/docs/AUDITORIA-COLECCIONES.json`
- **Documentación MD:** `backend/docs/AUDITORIA-COLECCIONES.md`
- **Modelos:** `backend/src/models/`

---

## ✅ Checklist de Auditoría

- [x] Ejecutar script de auditoría
- [x] Revisar colecciones con datos
- [x] Identificar colecciones vacías
- [x] Verificar índices críticos
- [x] Documentar estructura de schemas
- [x] Generar documentación Markdown
- [ ] Planificar limpieza de datos antiguos
- [ ] Optimizar índices según uso real
- [ ] Implementar TTL para logs
