# 📊 Auditoría de Colecciones MongoDB

**Fecha:** 17/1/2026, 03:19:26
**Base de datos:** neural_chatbot
**Total de colecciones:** 40

---

## 📋 Resumen

| Colección | Documentos | Índices |
|-----------|------------|----------|
| admin_users | 10 | 4 |
| afipinvoices | 5 | 8 |
| afipsellers | 2 | 4 |
| agentes | 13 | 4 |
| api_configurations | 6 | 6 |
| api_request_logs | 280 | 10 |
| apiconfigurations | 1 | 1 |
| apis | 1 | 1 |
| bloqueos_horario | 0 | 0 |
| carritos | 17 | 2 |
| chatbots | 8 | 5 |
| clientes | 0 | 0 |
| configuracion_bots | 0 | 0 |
| configuracion_calendario | 0 | 0 |
| configuracion_modulos | 0 | 0 |
| configuracionbots | 9 | 2 |
| configuraciones_modulo | 11 | 2 |
| contactos_empresa | 187 | 10 |
| conversation_states | 0 | 0 |
| empresas | 12 | 3 |
| flow_logs | 313 | 8 |
| flow_nodes | 24 | 5 |
| flowbuilders | 0 | 0 |
| flownodes | 6 | 6 |
| flows | 2 | 6 |
| flujos | 15 | 4 |
| integration_configurations | 0 | 0 |
| marketplace_integrations | 0 | 0 |
| mppaymentlinks | 13 | 6 |
| mppayments | 25 | 12 |
| mpsellers | 1 | 4 |
| mpsubscriptionplans | 0 | 0 |
| ocrconfigs | 0 | 0 |
| ocrdocuments | 0 | 0 |
| super_admins | 1 | 2 |
| turnos | 50 | 11 |
| usuarios | 1 | 4 |
| usuarios_empresa | 15 | 7 |
| usuarios_empresas | 1 | 1 |
| webhook_configurations | 0 | 0 |

---

## 📦 Detalle de Colecciones

### admin_users

**Documentos:** 10

**Índices:**
- `_id` 
- `username` (UNIQUE)
- `empresaId` 
- `username, empresaId` 

**Campos:**
```
_id, username, password, empresaId, role, email, activo, createdAt, updatedAt, __v, ultimoAcceso
```

**Schema:**
```json
{
  "_id": "Object",
  "username": "string",
  "password": "string",
  "empresaId": "string",
  "role": "string",
  "email": "string",
  "activo": "boolean",
  "createdAt": "Object",
  "updatedAt": "Object",
  "__v": "number",
  "ultimoAcceso": "Object"
}
```

---

### afipinvoices

**Documentos:** 5

**Índices:**
- `_id` 
- `empresaId` 
- `sellerId` 
- `tipoComprobante` 
- `empresaId, fecha` 
- `empresaId, tipoComprobante, puntoVenta, numero` 
- `sellerId, createdAt` 
- `cae` 

**Campos:**
```
_id, empresaId, sellerId, tipoComprobante, puntoVenta, numero, fecha, clienteTipoDoc, clienteNroDoc, concepto, importeNeto, importeIVA, importeExento, importeTotal, iva, cae, caeVencimiento, resultado, rawResponse, environment, createdAt, updatedAt, __v
```

**Schema:**
```json
{
  "_id": "Object",
  "empresaId": "string",
  "sellerId": "string",
  "tipoComprobante": "number",
  "puntoVenta": "number",
  "numero": "number",
  "fecha": "string",
  "clienteTipoDoc": "number",
  "clienteNroDoc": "number",
  "concepto": "number",
  "importeNeto": "number",
  "importeIVA": "number",
  "importeExento": "number",
  "importeTotal": "number",
  "iva": [
    "Array vacío"
  ],
  "cae": "string",
  "caeVencimiento": "string",
  "resultado": "string",
  "rawResponse": "Object",
  "environment": "string",
  "createdAt": "Object",
  "updatedAt": "Object",
  "__v": "number"
}
```

---

### afipsellers

**Documentos:** 2

**Índices:**
- `_id` 
- `empresaId` 
- `cuit` 
- `empresaId, activo` 

**Campos:**
```
_id, empresaId, cuit, razonSocial, puntoVenta, certificado, clavePrivada, environment, activo, tipoComprobanteDefault, conceptoDefault, totalFacturas, totalNotasCredito, totalNotasDebito, createdAt, updatedAt, __v, sign, token, tokenExpiration
```

**Schema:**
```json
{
  "_id": "Object",
  "empresaId": "string",
  "cuit": "string",
  "razonSocial": "string",
  "puntoVenta": "number",
  "certificado": "string",
  "clavePrivada": "string",
  "environment": "string",
  "activo": "boolean",
  "tipoComprobanteDefault": "number",
  "conceptoDefault": "number",
  "totalFacturas": "number",
  "totalNotasCredito": "number",
  "totalNotasDebito": "number",
  "createdAt": "Object",
  "updatedAt": "Object",
  "__v": "number",
  "sign": "string",
  "token": "string",
  "tokenExpiration": "Object"
}
```

---

### agentes

**Documentos:** 13

**Índices:**
- `_id` 
- `empresaId` 
- `empresaId, activo` 
- `empresaId, email` (UNIQUE)

**Campos:**
```
_id, empresaId, nombre, apellido, email, telefono, especialidad, descripcion, titulo, modoAtencion, disponibilidad, duracionTurnoPorDefecto, bufferEntreturnos, capacidadSimultanea, maximoTurnosPorDia, activo, creadoEn, actualizadoEn, __v, sector
```

**Schema:**
```json
{
  "_id": "Object",
  "empresaId": "string",
  "nombre": "string",
  "apellido": "string",
  "email": "string",
  "telefono": "string",
  "especialidad": "string",
  "descripcion": "string",
  "titulo": "string",
  "modoAtencion": "string",
  "disponibilidad": [
    "Array vacío"
  ],
  "duracionTurnoPorDefecto": "number",
  "bufferEntreturnos": "number",
  "capacidadSimultanea": "number",
  "maximoTurnosPorDia": "number",
  "activo": "boolean",
  "creadoEn": "Object",
  "actualizadoEn": "Object",
  "__v": "number"
}
```

---

### api_configurations

**Documentos:** 6

**Índices:**
- `_id` 
- `empresaId` 
- `empresaId, estado` 
- `empresaId, nombre` 
- `endpoints.id` 
- `empresaId, chatbotIntegration.habilitado, chatbotIntegration.chatbotId` 

**Campos:**
```
_id, empresaId, nombre, descripcion, tipo, estado, baseUrl, version, autenticacion, endpoints, configuracion, estadisticas, createdAt, updatedAt, __v, chatbotIntegration, workflows, activa, headers, menuPrincipal
```

**Schema:**
```json
{
  "_id": "Object",
  "empresaId": "Object",
  "nombre": "string",
  "descripcion": "string",
  "tipo": "string",
  "estado": "string",
  "baseUrl": "string",
  "version": "string",
  "autenticacion": "Object",
  "endpoints": [
    "Object"
  ],
  "configuracion": "Object",
  "estadisticas": "Object",
  "createdAt": "Object",
  "updatedAt": "Object",
  "__v": "number",
  "chatbotIntegration": "Object",
  "workflows": [
    "Object"
  ]
}
```

---

### api_request_logs

**Documentos:** 280

**Índices:**
- `_id` 
- `empresaId` 
- `apiConfigId` 
- `endpointId` 
- `estado` 
- `empresaId, createdAt` 
- `apiConfigId, createdAt` 
- `apiConfigId, endpointId, createdAt` 
- `estado, createdAt` 
- `createdAt` 

**Campos:**
```
_id, empresaId, apiConfigId, endpointId, request, error, estado, createdAt, __v, response
```

**Schema:**
```json
{
  "_id": "Object",
  "empresaId": "Object",
  "apiConfigId": "Object",
  "endpointId": "string",
  "request": "Object",
  "error": "Object",
  "estado": "string",
  "createdAt": "Object",
  "__v": "number"
}
```

---

### apiconfigurations

**Documentos:** 1

**Índices:**
- `_id` 

**Campos:**
```
_id, nombre, descripcion, baseUrl, activa, empresaId, autenticacion, createdAt, updatedAt
```

**Schema:**
```json
{
  "_id": "Object",
  "nombre": "string",
  "descripcion": "string",
  "baseUrl": "string",
  "activa": "boolean",
  "empresaId": "Object",
  "autenticacion": "Object",
  "createdAt": "Object",
  "updatedAt": "Object"
}
```

---

### apis

**Documentos:** 1

**Índices:**
- `_id` 

**Campos:**
```
_id, nombre, descripcion, empresaId, baseUrl, activo, autenticacion, headers, endpoints, creadoEn, actualizadoEn
```

**Schema:**
```json
{
  "_id": "Object",
  "nombre": "string",
  "descripcion": "string",
  "empresaId": "Object",
  "baseUrl": "string",
  "activo": "boolean",
  "autenticacion": "Object",
  "headers": "Object",
  "endpoints": [
    "Object"
  ],
  "creadoEn": "Object",
  "actualizadoEn": "Object"
}
```

---

### carritos

**Documentos:** 17

**Índices:**
- `_id` 
- `contactoId, empresaId, estado` 

**Campos:**
```
_id, contactoId, empresaId, items, total, estado, fechaCreacion, fechaActualizacion, __v
```

**Schema:**
```json
{
  "_id": "Object",
  "contactoId": "Object",
  "empresaId": "string",
  "items": [
    "Array vacío"
  ],
  "total": "number",
  "estado": "string",
  "fechaCreacion": "Object",
  "fechaActualizacion": "Object",
  "__v": "number"
}
```

---

### chatbots

**Documentos:** 8

**Índices:**
- `_id` 
- `empresaId` 
- `empresaId, activo` 
- `whatsapp.numeroTelefono` 
- `whatsapp.phoneNumberId` (UNIQUE)

**Campos:**
```
_id, empresaId, nombre, descripcion, activo, whatsapp, configuracion, derivacion, estadisticas, createdAt, updatedAt
```

**Schema:**
```json
{
  "_id": "Object",
  "empresaId": "string",
  "nombre": "string",
  "descripcion": "string",
  "activo": "boolean",
  "whatsapp": "Object",
  "configuracion": "Object",
  "derivacion": "Object",
  "estadisticas": "Object",
  "createdAt": "Object",
  "updatedAt": "Object"
}
```

---

### configuracionbots

**Documentos:** 9

**Índices:**
- `_id` 
- `empresaId` (UNIQUE)

**Campos:**
```
_id, empresaId, activo, mensajeBienvenida, mensajeDespedida, mensajeError, timeoutMinutos, flujos, horariosAtencion, requiereConfirmacion, permiteCancelacion, notificarAdmin, createdAt, updatedAt, __v
```

**Schema:**
```json
{
  "_id": "Object",
  "empresaId": "string",
  "activo": "boolean",
  "mensajeBienvenida": "string",
  "mensajeDespedida": "string",
  "mensajeError": "string",
  "timeoutMinutos": "number",
  "flujos": "Object",
  "horariosAtencion": "Object",
  "requiereConfirmacion": "boolean",
  "permiteCancelacion": "boolean",
  "notificarAdmin": "boolean",
  "createdAt": "Object",
  "updatedAt": "Object",
  "__v": "number"
}
```

---

### configuraciones_modulo

**Documentos:** 11

**Índices:**
- `_id` 
- `empresaId` (UNIQUE)

**Campos:**
```
_id, empresaId, tipoNegocio, activo, nomenclatura, camposPersonalizados, turnos, plantillasMeta, creadoEn, actualizadoEn, __v, agenteRequerido, chatbotActivo, chatbotPuedeCancelar, chatbotPuedeCrear, chatbotPuedeModificar, duracionPorDefecto, estadosPersonalizados, notificaciones, permiteDuracionVariable, recursoRequerido, requiereConfirmacion, usaAgentes, usaHorariosDisponibilidad, usaRecursos, mensajesFlujo, variablesDinamicas, notificacionDiariaAgentes
```

**Schema:**
```json
{
  "_id": "Object",
  "empresaId": "string",
  "tipoNegocio": "string",
  "activo": "boolean",
  "nomenclatura": "Object",
  "camposPersonalizados": [
    "Object"
  ],
  "turnos": "Object",
  "plantillasMeta": "Object",
  "creadoEn": "Object",
  "actualizadoEn": "Object",
  "__v": "number",
  "agenteRequerido": "boolean",
  "chatbotActivo": "boolean",
  "chatbotPuedeCancelar": "boolean",
  "chatbotPuedeCrear": "boolean",
  "chatbotPuedeModificar": "boolean",
  "duracionPorDefecto": "number",
  "estadosPersonalizados": [
    "Array vacío"
  ],
  "notificaciones": [
    "Array vacío"
  ],
  "permiteDuracionVariable": "boolean",
  "recursoRequerido": "boolean",
  "requiereConfirmacion": "boolean",
  "usaAgentes": "boolean",
  "usaHorariosDisponibilidad": "boolean",
  "usaRecursos": "boolean",
  "mensajesFlujo": "Object",
  "variablesDinamicas": "Object"
}
```

---

### contactos_empresa

**Documentos:** 187

**Índices:**
- `_id` 
- `empresaId` 
- `telefono` 
- `empresaId, email` 
- `empresaId, activo` 
- `empresaId, sector` 
- `metricas.ultimaInteraccion` 
- `empresaId, agenteAsignado` 
- `empresaId, telefono` 
- `empresaId, agentesAsignados` 

**Campos:**
```
_id, empresaId, telefono, nombre, apellido, profileName, origen, preferencias, conversaciones, metricas, activo, creadoEn, actualizadoEn, __v
```

**Schema:**
```json
{
  "_id": "Object",
  "empresaId": "string",
  "telefono": "string",
  "nombre": "string",
  "apellido": "string",
  "profileName": "string",
  "origen": "string",
  "preferencias": "Object",
  "conversaciones": "Object",
  "metricas": "Object",
  "activo": "boolean",
  "creadoEn": "Object",
  "actualizadoEn": "Object",
  "__v": "number"
}
```

---

### empresas

**Documentos:** 12

**Índices:**
- `_id` 
- `nombre` (UNIQUE)
- `telefono` (UNIQUE)

**Campos:**
```
_id, nombre, __v, catalogoPath, categoria, createdAt, derivarA, email, linkCatalogo, modelo, phoneNumberId, prompt, saludos, telefono, ubicaciones, updatedAt, facturacion, limites, modulos, plan, uso
```

**Schema:**
```json
{
  "_id": "Object",
  "nombre": "string",
  "__v": "number",
  "catalogoPath": "string",
  "categoria": "string",
  "createdAt": "Object",
  "derivarA": [
    "string"
  ],
  "email": "string",
  "linkCatalogo": "string",
  "modelo": "string",
  "phoneNumberId": "string",
  "prompt": "string",
  "saludos": [
    "Array vacío"
  ],
  "telefono": "string",
  "ubicaciones": [
    "Object"
  ],
  "updatedAt": "Object",
  "facturacion": "Object",
  "limites": "Object",
  "modulos": [
    "Array vacío"
  ],
  "plan": "string",
  "uso": "Object"
}
```

---

### flow_logs

**Documentos:** 313

**Índices:**
- `_id` 
- `timestamp` 
- `telefono` 
- `empresaId` 
- `flujo` 
- `telefono, timestamp` 
- `empresaId, timestamp` 
- `flujo, timestamp` 

**Campos:**
```
_id, telefono, empresaId, flujo, estado, accion, mensaje, timestamp, __v, data
```

**Schema:**
```json
{
  "_id": "Object",
  "telefono": "string",
  "empresaId": "string",
  "flujo": "string",
  "estado": "string",
  "accion": "string",
  "mensaje": "string",
  "timestamp": "Object",
  "__v": "number"
}
```

---

### flow_nodes

**Documentos:** 24

**Índices:**
- `_id` 
- `empresaId` 
- `flowId` 
- `empresaId, flowId, id` (UNIQUE)
- `empresaId, activo` 

**Campos:**
```
_id, empresaId, flowId, id, type, name, message, options, metadata, activo, conditions, createdAt, updatedAt, __v, validation, next, action
```

**Schema:**
```json
{
  "_id": "Object",
  "empresaId": "string",
  "flowId": "string",
  "id": "string",
  "type": "string",
  "name": "string",
  "message": "string",
  "options": [
    "Object"
  ],
  "metadata": "Object",
  "activo": "boolean",
  "conditions": [
    "Array vacío"
  ],
  "createdAt": "Object",
  "updatedAt": "Object",
  "__v": "number"
}
```

---

### flownodes

**Documentos:** 6

**Índices:**
- `_id` 
- `empresaId` 
- `flowId` 
- `empresaId, flowId, id` (UNIQUE)
- `empresaId, activo` 
- `empresaId, flowId, metadata.orden` 

**Campos:**
```
_id, empresaId, flowId, id, type, name, message, next, nombreVariable, validation, metadata, activo, action
```

**Schema:**
```json
{
  "_id": "Object",
  "empresaId": "string",
  "flowId": "string",
  "id": "string",
  "type": "string",
  "name": "string",
  "message": "string",
  "next": "string",
  "nombreVariable": "string",
  "validation": "Object",
  "metadata": "Object",
  "activo": "boolean"
}
```

---

### flows

**Documentos:** 2

**Índices:**
- `_id` 
- `empresaId` 
- `empresaId, activo, triggers.priority` 
- `empresaId, botType, activo` 
- `apiConfig.apiConfigurationId` 
- `empresaId, id` (UNIQUE)

**Campos:**
```
_id, nombre, empresaId, activo, nodes, edges, createdAt, updatedAt, actualizadoEn, config, descripcion
```

**Schema:**
```json
{
  "_id": "Object",
  "nombre": "string",
  "empresaId": "string",
  "activo": "boolean",
  "nodes": [
    "Object"
  ],
  "edges": [
    "Object"
  ],
  "createdAt": "Object",
  "updatedAt": "Object",
  "actualizadoEn": "Object",
  "config": "Object"
}
```

---

### flujos

**Documentos:** 15

**Índices:**
- `_id` 
- `empresaId` 
- `empresaId, prioridad` 
- `empresaId, activo, prioridad` 

**Campos:**
```
_id, empresaId, nombre, descripcion, tipo, prioridad, disparadores, configuracion, activo, creadoPor, creadoEn, actualizadoEn, __v
```

**Schema:**
```json
{
  "_id": "Object",
  "empresaId": "string",
  "nombre": "string",
  "descripcion": "string",
  "tipo": "string",
  "prioridad": "number",
  "disparadores": [
    "Object"
  ],
  "configuracion": "Object",
  "activo": "boolean",
  "creadoPor": "string",
  "creadoEn": "Object",
  "actualizadoEn": "Object",
  "__v": "number"
}
```

---

### mppaymentlinks

**Documentos:** 13

**Índices:**
- `_id` 
- `sellerId` 
- `slug` (UNIQUE)
- `sellerId, active` 
- `empresaId` 
- `sellerId, empresaId` 

**Campos:**
```
_id, sellerId, empresaId, slug, title, description, category, priceType, unitPrice, currency, active, totalUses, totalRevenue, pendingBooking, createdAt, updatedAt, __v, mpPreferenceId
```

**Schema:**
```json
{
  "_id": "Object",
  "sellerId": "string",
  "empresaId": "string",
  "slug": "string",
  "title": "string",
  "description": "string",
  "category": "string",
  "priceType": "string",
  "unitPrice": "number",
  "currency": "string",
  "active": "boolean",
  "totalUses": "number",
  "totalRevenue": "number",
  "pendingBooking": "Object",
  "createdAt": "Object",
  "updatedAt": "Object",
  "__v": "number",
  "mpPreferenceId": "string"
}
```

---

### mppayments

**Documentos:** 25

**Índices:**
- `_id` 
- `mpPaymentId` (UNIQUE)
- `sellerId` 
- `paymentLinkId` 
- `externalReference` 
- `status` 
- `sellerId, status` 
- `sellerId, createdAt` 
- `empresaId` 
- `empresaId, status` 
- `empresaId, createdAt` 
- `sellerId, empresaId, status` 

**Campos:**
```
_id, mpPaymentId, sellerId, empresaId, externalReference, status, statusDetail, amount, currency, paymentMethodId, paymentTypeId, installments, payerEmail, payerPhone, payerDocType, payerDocNumber, dateCreated, dateApproved, dateLastUpdated, createdAt, updatedAt, __v, metadata
```

**Schema:**
```json
{
  "_id": "Object",
  "mpPaymentId": "string",
  "sellerId": "string",
  "empresaId": "string",
  "externalReference": "string",
  "status": "string",
  "statusDetail": "string",
  "amount": "number",
  "currency": "string",
  "paymentMethodId": "string",
  "paymentTypeId": "string",
  "installments": "number",
  "payerEmail": "string",
  "payerPhone": "null",
  "payerDocType": "string",
  "payerDocNumber": "string",
  "dateCreated": "Object",
  "dateApproved": "Object",
  "dateLastUpdated": "Object",
  "createdAt": "Object",
  "updatedAt": "Object",
  "__v": "number",
  "metadata": "Object"
}
```

---

### mpsellers

**Documentos:** 1

**Índices:**
- `_id` 
- `userId` (UNIQUE)
- `internalId` 
- `internalId, active` 

**Campos:**
```
_id, userId, accessToken, refreshToken, publicKey, expiresIn, internalId, active, connectedAt, updatedAt, createdAt, __v
```

**Schema:**
```json
{
  "_id": "Object",
  "userId": "string",
  "accessToken": "string",
  "refreshToken": "string",
  "publicKey": "string",
  "expiresIn": "number",
  "internalId": "string",
  "active": "boolean",
  "connectedAt": "Object",
  "updatedAt": "Object",
  "createdAt": "Object",
  "__v": "number"
}
```

---

### super_admins

**Documentos:** 1

**Índices:**
- `_id` 
- `username` (UNIQUE)

**Campos:**
```
_id, username, password, email, nombre, activo, createdAt, updatedAt, __v, ultimoAcceso
```

**Schema:**
```json
{
  "_id": "Object",
  "username": "string",
  "password": "string",
  "email": "string",
  "nombre": "string",
  "activo": "boolean",
  "createdAt": "Object",
  "updatedAt": "Object",
  "__v": "number",
  "ultimoAcceso": "Object"
}
```

---

### turnos

**Documentos:** 50

**Índices:**
- `_id` 
- `empresaId` 
- `agenteId` 
- `clienteId` 
- `fechaInicio` 
- `estado` 
- `empresaId, fechaInicio` 
- `empresaId, agenteId, fechaInicio` 
- `empresaId, clienteId, fechaInicio` 
- `empresaId, estado, fechaInicio` 
- `recursoId` 

**Campos:**
```
_id, empresaId, agenteId, clienteId, fechaInicio, fechaFin, duracion, estado, tipoReserva, datos, notas, creadoPor, confirmado, notificaciones, creadoEn, actualizadoEn, __v, confirmadoEn
```

**Schema:**
```json
{
  "_id": "Object",
  "empresaId": "string",
  "agenteId": "Object",
  "clienteId": "string",
  "fechaInicio": "Object",
  "fechaFin": "Object",
  "duracion": "number",
  "estado": "string",
  "tipoReserva": "string",
  "datos": "Object",
  "notas": "string",
  "creadoPor": "string",
  "confirmado": "boolean",
  "notificaciones": [
    "Object"
  ],
  "creadoEn": "Object",
  "actualizadoEn": "Object",
  "__v": "number"
}
```

---

### usuarios

**Documentos:** 1

**Índices:**
- `_id` 
- `numero` 
- `empresaId` 
- `numero, empresaId` (UNIQUE)

**Campos:**
```
_id, email, password, nombre, rol, empresaId, activo, createdAt, updatedAt
```

**Schema:**
```json
{
  "_id": "Object",
  "email": "string",
  "password": "string",
  "nombre": "string",
  "rol": "string",
  "empresaId": "Object",
  "activo": "boolean",
  "createdAt": "Object",
  "updatedAt": "Object"
}
```

---

### usuarios_empresa

**Documentos:** 15

**Índices:**
- `_id` 
- `username` (UNIQUE)
- `email` 
- `empresaId` 
- `username, empresaId` 
- `email, empresaId` 
- `empresaId, activo` 

**Campos:**
```
_id, username, password, email, nombre, empresaId, rol, permisos, activo, ultimoAcceso, createdBy, createdAt, updatedAt, __v
```

**Schema:**
```json
{
  "_id": "Object",
  "username": "string",
  "password": "string",
  "email": "string",
  "nombre": "string",
  "empresaId": "string",
  "rol": "string",
  "permisos": [
    "string"
  ],
  "activo": "boolean",
  "ultimoAcceso": "Object",
  "createdBy": "string",
  "createdAt": "Object",
  "updatedAt": "Object",
  "__v": "number"
}
```

---

### usuarios_empresas

**Documentos:** 1

**Índices:**
- `_id` 

**Campos:**
```
_id, username, password, email, nombre, apellido, rol, permisos, activo, createdBy, empresaId, empresaNombre, createdAt, updatedAt
```

**Schema:**
```json
{
  "_id": "Object",
  "username": "string",
  "password": "string",
  "email": "string",
  "nombre": "string",
  "apellido": "string",
  "rol": "string",
  "permisos": [
    "string"
  ],
  "activo": "boolean",
  "createdBy": "string",
  "empresaId": "Object",
  "empresaNombre": "string",
  "createdAt": "Object",
  "updatedAt": "Object"
}
```

---

