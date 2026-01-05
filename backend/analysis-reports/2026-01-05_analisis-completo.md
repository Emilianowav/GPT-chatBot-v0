# 📊 Análisis de Base de Datos - 2026-01-05

## 🗂️ Resumen General

- **Total de colecciones:** 36
- **Total de documentos:** 634

## 📋 Colecciones

### ocrdocuments

- **Documentos:** 0
- **Índices:** 6

#### Índices

| Nombre | Campos | Único | Sparse |
|--------|--------|-------|--------|
| _id_ | {"_id":1} | ❌ | ❌ |
| empresaId_1 | {"empresaId":1} | ❌ | ❌ |
| empresaId_1_createdAt_-1 | {"empresaId":1,"createdAt":-1} | ❌ | ❌ |
| status_1 | {"status":1} | ❌ | ❌ |
| extractedData.proveedorCuit_1 | {"extractedData.proveedorCuit":1} | ❌ | ❌ |
| extractedData.numeroComprobante_1 | {"extractedData.numeroComprobante":1} | ❌ | ❌ |

#### Esquema Inferido

| Campo | Aparece en | Tipos | Requerido |
|-------|------------|-------|----------|

### integration_configurations

- **Documentos:** 0
- **Índices:** 4

#### Índices

| Nombre | Campos | Único | Sparse |
|--------|--------|-------|--------|
| _id_ | {"_id":1} | ❌ | ❌ |
| empresaId_1 | {"empresaId":1} | ❌ | ❌ |
| empresaId_1_tipo_1 | {"empresaId":1,"tipo":1} | ❌ | ❌ |
| empresaId_1_estado_1 | {"empresaId":1,"estado":1} | ❌ | ❌ |

#### Esquema Inferido

| Campo | Aparece en | Tipos | Requerido |
|-------|------------|-------|----------|

### configuracion_modulos

- **Documentos:** 0
- **Índices:** 1

#### Índices

| Nombre | Campos | Único | Sparse |
|--------|--------|-------|--------|
| _id_ | {"_id":1} | ❌ | ❌ |

#### Esquema Inferido

| Campo | Aparece en | Tipos | Requerido |
|-------|------------|-------|----------|

### admin_users

- **Documentos:** 10
- **Índices:** 4

#### Índices

| Nombre | Campos | Único | Sparse |
|--------|--------|-------|--------|
| _id_ | {"_id":1} | ❌ | ❌ |
| username_1 | {"username":1} | ✅ | ❌ |
| empresaId_1 | {"empresaId":1} | ❌ | ❌ |
| username_1_empresaId_1 | {"username":1,"empresaId":1} | ❌ | ❌ |

#### Esquema Inferido

| Campo | Aparece en | Tipos | Requerido |
|-------|------------|-------|----------|
| _id | 10/10 documentos (100.0%) | ObjectId | ✅ |
| username | 10/10 documentos (100.0%) | string | ✅ |
| password | 10/10 documentos (100.0%) | string | ✅ |
| empresaId | 10/10 documentos (100.0%) | string | ✅ |
| role | 10/10 documentos (100.0%) | string | ✅ |
| email | 10/10 documentos (100.0%) | string | ✅ |
| activo | 10/10 documentos (100.0%) | boolean | ✅ |
| createdAt | 10/10 documentos (100.0%) | Date | ✅ |
| updatedAt | 10/10 documentos (100.0%) | Date | ✅ |
| __v | 9/10 documentos (90.0%) | number | ❌ |
| ultimoAcceso | 5/10 documentos (50.0%) | Date | ❌ |

### flujos

- **Documentos:** 15
- **Índices:** 4

#### Índices

| Nombre | Campos | Único | Sparse |
|--------|--------|-------|--------|
| _id_ | {"_id":1} | ❌ | ❌ |
| empresaId_1 | {"empresaId":1} | ❌ | ❌ |
| empresaId_1_prioridad_1 | {"empresaId":1,"prioridad":1} | ❌ | ❌ |
| empresaId_1_activo_1_prioridad_1 | {"empresaId":1,"activo":1,"prioridad":1} | ❌ | ❌ |

#### Esquema Inferido

| Campo | Aparece en | Tipos | Requerido |
|-------|------------|-------|----------|
| _id | 15/15 documentos (100.0%) | ObjectId | ✅ |
| empresaId | 15/15 documentos (100.0%) | string | ✅ |
| nombre | 15/15 documentos (100.0%) | string | ✅ |
| descripcion | 15/15 documentos (100.0%) | string | ✅ |
| tipo | 15/15 documentos (100.0%) | string | ✅ |
| prioridad | 15/15 documentos (100.0%) | number | ✅ |
| disparadores | 15/15 documentos (100.0%) | Array | ✅ |
| disparadores[0].tipo | 15/15 documentos (100.0%) | string | ✅ |
| disparadores[0].config | 15/15 documentos (100.0%) | Object | ✅ |
| disparadores[0].config.descripcion | 15/15 documentos (100.0%) | string | ✅ |
| disparadores[0]._id | 15/15 documentos (100.0%) | ObjectId | ✅ |
| configuracion | 15/15 documentos (100.0%) | Object | ✅ |
| configuracion.camposEditables | 5/15 documentos (33.3%) | Array | ❌ |
| activo | 15/15 documentos (100.0%) | boolean | ✅ |
| creadoPor | 15/15 documentos (100.0%) | string | ✅ |
| creadoEn | 15/15 documentos (100.0%) | Date | ✅ |
| actualizadoEn | 15/15 documentos (100.0%) | Date | ✅ |
| __v | 15/15 documentos (100.0%) | number | ✅ |
| disparadores[0].valor | 5/15 documentos (33.3%) | Array | ❌ |
| configuracion.mensajeBienvenida | 5/15 documentos (33.3%) | string | ❌ |
| configuracion.opcionesMenu | 5/15 documentos (33.3%) | Array | ❌ |
| configuracion.systemPrompt | 5/15 documentos (33.3%) | string | ❌ |
| configuracion.temperatura | 5/15 documentos (33.3%) | number | ❌ |

### marketplace_integrations

- **Documentos:** 0
- **Índices:** 10

#### Índices

| Nombre | Campos | Único | Sparse |
|--------|--------|-------|--------|
| _id_ | {"_id":1} | ❌ | ❌ |
| empresaId_1 | {"empresaId":1} | ❌ | ❌ |
| usuarioEmpresaId_1 | {"usuarioEmpresaId":1} | ❌ | ❌ |
| provider_1 | {"provider":1} | ❌ | ❌ |
| status_1 | {"status":1} | ❌ | ❌ |
| next_sync_1 | {"next_sync":1} | ❌ | ❌ |
| empresaId_1_provider_1 | {"empresaId":1,"provider":1} | ❌ | ❌ |
| empresaId_1_status_1 | {"empresaId":1,"status":1} | ❌ | ❌ |
| status_1_expires_at_1 | {"status":1,"expires_at":1} | ❌ | ❌ |
| status_1_next_sync_1 | {"status":1,"next_sync":1} | ❌ | ❌ |

#### Esquema Inferido

| Campo | Aparece en | Tipos | Requerido |
|-------|------------|-------|----------|

### super_admins

- **Documentos:** 1
- **Índices:** 2

#### Índices

| Nombre | Campos | Único | Sparse |
|--------|--------|-------|--------|
| _id_ | {"_id":1} | ❌ | ❌ |
| username_1 | {"username":1} | ✅ | ❌ |

#### Esquema Inferido

| Campo | Aparece en | Tipos | Requerido |
|-------|------------|-------|----------|
| _id | 1/1 documentos (100.0%) | ObjectId | ✅ |
| username | 1/1 documentos (100.0%) | string | ✅ |
| password | 1/1 documentos (100.0%) | string | ✅ |
| email | 1/1 documentos (100.0%) | string | ✅ |
| nombre | 1/1 documentos (100.0%) | string | ✅ |
| activo | 1/1 documentos (100.0%) | boolean | ✅ |
| createdAt | 1/1 documentos (100.0%) | Date | ✅ |
| updatedAt | 1/1 documentos (100.0%) | Date | ✅ |
| __v | 1/1 documentos (100.0%) | number | ✅ |
| ultimoAcceso | 1/1 documentos (100.0%) | Date | ✅ |

### mppaymentlinks

- **Documentos:** 13
- **Índices:** 6

#### Índices

| Nombre | Campos | Único | Sparse |
|--------|--------|-------|--------|
| _id_ | {"_id":1} | ❌ | ❌ |
| sellerId_1 | {"sellerId":1} | ❌ | ❌ |
| slug_1 | {"slug":1} | ✅ | ❌ |
| sellerId_1_active_1 | {"sellerId":1,"active":1} | ❌ | ❌ |
| empresaId_1 | {"empresaId":1} | ❌ | ❌ |
| sellerId_1_empresaId_1 | {"sellerId":1,"empresaId":1} | ❌ | ❌ |

#### Esquema Inferido

| Campo | Aparece en | Tipos | Requerido |
|-------|------------|-------|----------|
| _id | 13/13 documentos (100.0%) | ObjectId | ✅ |
| sellerId | 13/13 documentos (100.0%) | string | ✅ |
| empresaId | 13/13 documentos (100.0%) | string | ✅ |
| slug | 13/13 documentos (100.0%) | string | ✅ |
| title | 13/13 documentos (100.0%) | string | ✅ |
| description | 13/13 documentos (100.0%) | string | ✅ |
| category | 13/13 documentos (100.0%) | string | ✅ |
| priceType | 13/13 documentos (100.0%) | string | ✅ |
| unitPrice | 13/13 documentos (100.0%) | number | ✅ |
| currency | 13/13 documentos (100.0%) | string | ✅ |
| active | 13/13 documentos (100.0%) | boolean | ✅ |
| totalUses | 13/13 documentos (100.0%) | number | ✅ |
| totalRevenue | 13/13 documentos (100.0%) | number | ✅ |
| pendingBooking | 13/13 documentos (100.0%) | Object | ✅ |
| pendingBooking.contactoId | 13/13 documentos (100.0%) | string | ✅ |
| pendingBooking.clientePhone | 3/13 documentos (23.1%) | string | ❌ |
| pendingBooking.bookingData | 13/13 documentos (100.0%) | Object | ✅ |
| pendingBooking.bookingData.cancha_id | 4/13 documentos (30.8%) | string | ❌ |
| pendingBooking.bookingData.fecha | 13/13 documentos (100.0%) | string | ✅ |
| pendingBooking.bookingData.hora_inicio | 4/13 documentos (30.8%) | string | ❌ |
| pendingBooking.bookingData.duracion | 13/13 documentos (100.0%) | number | ✅ |
| pendingBooking.bookingData.cliente | 13/13 documentos (100.0%) | Object | ✅ |
| pendingBooking.bookingData.cliente.nombre | 3/13 documentos (23.1%) | string | ❌ |
| pendingBooking.bookingData.cliente.telefono | 3/13 documentos (23.1%) | string | ❌ |
| pendingBooking.bookingData.cliente.email | 13/13 documentos (100.0%) | string | ✅ |
| pendingBooking.apiConfigId | 13/13 documentos (100.0%) | string | ✅ |
| pendingBooking.endpointId | 13/13 documentos (100.0%) | string | ✅ |
| createdAt | 13/13 documentos (100.0%) | Date | ✅ |
| updatedAt | 13/13 documentos (100.0%) | Date | ✅ |
| __v | 13/13 documentos (100.0%) | number | ✅ |
| mpPreferenceId | 13/13 documentos (100.0%) | string | ✅ |

### flows

- **Documentos:** 1
- **Índices:** 6

#### Índices

| Nombre | Campos | Único | Sparse |
|--------|--------|-------|--------|
| _id_ | {"_id":1} | ❌ | ❌ |
| empresaId_1 | {"empresaId":1} | ❌ | ❌ |
| empresaId_1_id_1 | {"empresaId":1,"id":1} | ✅ | ❌ |
| empresaId_1_activo_1_triggers.priority_-1 | {"empresaId":1,"activo":1,"triggers.priority":-1} | ❌ | ❌ |
| empresaId_1_botType_1_activo_1 | {"empresaId":1,"botType":1,"activo":1} | ❌ | ❌ |
| apiConfig.apiConfigurationId_1 | {"apiConfig.apiConfigurationId":1} | ❌ | ❌ |

#### Esquema Inferido

| Campo | Aparece en | Tipos | Requerido |
|-------|------------|-------|----------|
| _id | 1/1 documentos (100.0%) | ObjectId | ✅ |
| empresaId | 1/1 documentos (100.0%) | string | ✅ |
| id | 1/1 documentos (100.0%) | string | ✅ |
| activo | 1/1 documentos (100.0%) | boolean | ✅ |
| apiConfig | 1/1 documentos (100.0%) | Object | ✅ |
| apiConfig.apiConfigurationId | 1/1 documentos (100.0%) | ObjectId | ✅ |
| apiConfig.workflowId | 1/1 documentos (100.0%) | string | ✅ |
| apiConfig.baseUrl | 1/1 documentos (100.0%) | string | ✅ |
| apiConfig.endpoints | 1/1 documentos (100.0%) | Array | ✅ |
| apiConfig.endpoints[0].id | 1/1 documentos (100.0%) | string | ✅ |
| apiConfig.endpoints[0].nombre | 1/1 documentos (100.0%) | string | ✅ |
| apiConfig.endpoints[0].metodo | 1/1 documentos (100.0%) | string | ✅ |
| apiConfig.endpoints[0].path | 1/1 documentos (100.0%) | string | ✅ |
| botType | 1/1 documentos (100.0%) | string | ✅ |
| categoria | 1/1 documentos (100.0%) | string | ✅ |
| createdBy | 1/1 documentos (100.0%) | string | ✅ |
| descripcion | 1/1 documentos (100.0%) | string | ✅ |
| nombre | 1/1 documentos (100.0%) | string | ✅ |
| settings | 1/1 documentos (100.0%) | Object | ✅ |
| settings.timeout | 1/1 documentos (100.0%) | number | ✅ |
| settings.maxRetries | 1/1 documentos (100.0%) | number | ✅ |
| settings.enableGPT | 1/1 documentos (100.0%) | boolean | ✅ |
| settings.saveHistory | 1/1 documentos (100.0%) | boolean | ✅ |
| settings.permitirAbandonar | 1/1 documentos (100.0%) | boolean | ✅ |
| settings.timeoutMinutos | 1/1 documentos (100.0%) | number | ✅ |
| startNode | 1/1 documentos (100.0%) | string | ✅ |
| triggers | 1/1 documentos (100.0%) | Object | ✅ |
| triggers.keywords | 1/1 documentos (100.0%) | Array | ✅ |
| triggers.priority | 1/1 documentos (100.0%) | number | ✅ |
| triggers.primeraRespuesta | 1/1 documentos (100.0%) | boolean | ✅ |
| variables | 1/1 documentos (100.0%) | Object | ✅ |
| variables.EMPRESA_NOMBRE | 1/1 documentos (100.0%) | string | ✅ |
| variables.EMPRESA_DIRECCION | 1/1 documentos (100.0%) | string | ✅ |
| variables.EMPRESA_HORARIO | 1/1 documentos (100.0%) | string | ✅ |
| variables.EMPRESA_WHATSAPP | 1/1 documentos (100.0%) | string | ✅ |
| variables.EMPRESA_WHATSAPP_LINK | 1/1 documentos (100.0%) | string | ✅ |
| variables.WOOCOMMERCE_URL | 1/1 documentos (100.0%) | string | ✅ |
| variables.RETIRO_TIEMPO | 1/1 documentos (100.0%) | string | ✅ |
| variables.PAGO_EXPIRACION | 1/1 documentos (100.0%) | string | ✅ |
| version | 1/1 documentos (100.0%) | number | ✅ |

### usuarios_empresa

- **Documentos:** 15
- **Índices:** 7

#### Índices

| Nombre | Campos | Único | Sparse |
|--------|--------|-------|--------|
| _id_ | {"_id":1} | ❌ | ❌ |
| username_1 | {"username":1} | ✅ | ❌ |
| email_1 | {"email":1} | ❌ | ❌ |
| empresaId_1 | {"empresaId":1} | ❌ | ❌ |
| username_1_empresaId_1 | {"username":1,"empresaId":1} | ❌ | ❌ |
| email_1_empresaId_1 | {"email":1,"empresaId":1} | ❌ | ❌ |
| empresaId_1_activo_1 | {"empresaId":1,"activo":1} | ❌ | ❌ |

#### Esquema Inferido

| Campo | Aparece en | Tipos | Requerido |
|-------|------------|-------|----------|
| _id | 15/15 documentos (100.0%) | ObjectId | ✅ |
| username | 15/15 documentos (100.0%) | string | ✅ |
| password | 15/15 documentos (100.0%) | string | ✅ |
| email | 15/15 documentos (100.0%) | string | ✅ |
| nombre | 15/15 documentos (100.0%) | string | ✅ |
| empresaId | 15/15 documentos (100.0%) | string | ✅ |
| rol | 15/15 documentos (100.0%) | string | ✅ |
| permisos | 15/15 documentos (100.0%) | Array | ✅ |
| activo | 15/15 documentos (100.0%) | boolean | ✅ |
| ultimoAcceso | 11/15 documentos (73.3%) | Date | ❌ |
| createdBy | 15/15 documentos (100.0%) | string | ✅ |
| createdAt | 15/15 documentos (100.0%) | Date | ✅ |
| updatedAt | 15/15 documentos (100.0%) | Date | ✅ |
| __v | 10/15 documentos (66.7%) | number | ❌ |
| apellido | 12/15 documentos (80.0%) | string | ❌ |
| telefono | 2/15 documentos (13.3%) | string | ❌ |

### turnos

- **Documentos:** 15
- **Índices:** 11

#### Índices

| Nombre | Campos | Único | Sparse |
|--------|--------|-------|--------|
| _id_ | {"_id":1} | ❌ | ❌ |
| empresaId_1 | {"empresaId":1} | ❌ | ❌ |
| agenteId_1 | {"agenteId":1} | ❌ | ❌ |
| clienteId_1 | {"clienteId":1} | ❌ | ❌ |
| fechaInicio_1 | {"fechaInicio":1} | ❌ | ❌ |
| estado_1 | {"estado":1} | ❌ | ❌ |
| empresaId_1_fechaInicio_1 | {"empresaId":1,"fechaInicio":1} | ❌ | ❌ |
| empresaId_1_agenteId_1_fechaInicio_1 | {"empresaId":1,"agenteId":1,"fechaInicio":1} | ❌ | ❌ |
| empresaId_1_clienteId_1_fechaInicio_1 | {"empresaId":1,"clienteId":1,"fechaInicio":1} | ❌ | ❌ |
| empresaId_1_estado_1_fechaInicio_1 | {"empresaId":1,"estado":1,"fechaInicio":1} | ❌ | ❌ |
| recursoId_1 | {"recursoId":1} | ❌ | ❌ |

#### Esquema Inferido

| Campo | Aparece en | Tipos | Requerido |
|-------|------------|-------|----------|
| _id | 15/15 documentos (100.0%) | ObjectId | ✅ |
| empresaId | 15/15 documentos (100.0%) | string | ✅ |
| agenteId | 15/15 documentos (100.0%) | ObjectId | ✅ |
| clienteId | 15/15 documentos (100.0%) | string | ✅ |
| fechaInicio | 15/15 documentos (100.0%) | Date | ✅ |
| fechaFin | 15/15 documentos (100.0%) | Date | ✅ |
| duracion | 15/15 documentos (100.0%) | number | ✅ |
| estado | 15/15 documentos (100.0%) | string | ✅ |
| tipoReserva | 12/15 documentos (80.0%) | string | ❌ |
| datos | 15/15 documentos (100.0%) | Object | ✅ |
| datos.origen | 13/15 documentos (86.7%) | string | ❌ |
| datos.destino | 13/15 documentos (86.7%) | string | ❌ |
| datos.pasajeros | 13/15 documentos (86.7%) | number | ❌ |
| notas | 15/15 documentos (100.0%) | string | ✅ |
| creadoPor | 15/15 documentos (100.0%) | string | ✅ |
| confirmado | 15/15 documentos (100.0%) | boolean | ✅ |
| notificaciones | 15/15 documentos (100.0%) | Array | ✅ |
| notificaciones[0].tipo | 2/15 documentos (13.3%) | string | ❌ |
| notificaciones[0].programadaPara | 2/15 documentos (13.3%) | Date | ❌ |
| notificaciones[0].enviada | 2/15 documentos (13.3%) | boolean | ❌ |
| notificaciones[0].enviadaEn | 2/15 documentos (13.3%) | Date | ❌ |
| notificaciones[0].plantilla | 2/15 documentos (13.3%) | string | ❌ |
| notificaciones[0]._id | 2/15 documentos (13.3%) | ObjectId | ❌ |
| creadoEn | 15/15 documentos (100.0%) | Date | ✅ |
| actualizadoEn | 15/15 documentos (100.0%) | Date | ✅ |
| __v | 15/15 documentos (100.0%) | number | ✅ |
| confirmadoEn | 12/15 documentos (80.0%) | Date | ❌ |
| datos.cancha | 2/15 documentos (13.3%) | string | ❌ |
| datos.telefonoCliente | 2/15 documentos (13.3%) | string | ❌ |

### conversation_states

- **Documentos:** 1
- **Índices:** 5

#### Índices

| Nombre | Campos | Único | Sparse |
|--------|--------|-------|--------|
| _id_ | {"_id":1} | ❌ | ❌ |
| telefono_1 | {"telefono":1} | ❌ | ❌ |
| empresaId_1 | {"empresaId":1} | ❌ | ❌ |
| telefono_1_empresaId_1 | {"telefono":1,"empresaId":1} | ✅ | ❌ |
| ultima_interaccion_1 | {"ultima_interaccion":1} | ❌ | ❌ |

#### Esquema Inferido

| Campo | Aparece en | Tipos | Requerido |
|-------|------------|-------|----------|
| _id | 1/1 documentos (100.0%) | ObjectId | ✅ |
| telefono | 1/1 documentos (100.0%) | string | ✅ |
| empresaId | 1/1 documentos (100.0%) | string | ✅ |
| flujo_activo | 1/1 documentos (100.0%) | null | ✅ |
| estado_actual | 1/1 documentos (100.0%) | null | ✅ |
| flujos_pendientes | 1/1 documentos (100.0%) | Array | ✅ |
| prioridad | 1/1 documentos (100.0%) | string | ✅ |
| pausado | 1/1 documentos (100.0%) | boolean | ✅ |
| ultima_interaccion | 1/1 documentos (100.0%) | Date | ✅ |
| createdAt | 1/1 documentos (100.0%) | Date | ✅ |
| updatedAt | 1/1 documentos (100.0%) | Date | ✅ |
| __v | 1/1 documentos (100.0%) | number | ✅ |

### agentes

- **Documentos:** 11
- **Índices:** 4

#### Índices

| Nombre | Campos | Único | Sparse |
|--------|--------|-------|--------|
| _id_ | {"_id":1} | ❌ | ❌ |
| empresaId_1 | {"empresaId":1} | ❌ | ❌ |
| empresaId_1_activo_1 | {"empresaId":1,"activo":1} | ❌ | ❌ |
| empresaId_1_email_1 | {"empresaId":1,"email":1} | ✅ | ❌ |

#### Esquema Inferido

| Campo | Aparece en | Tipos | Requerido |
|-------|------------|-------|----------|
| _id | 11/11 documentos (100.0%) | ObjectId | ✅ |
| empresaId | 11/11 documentos (100.0%) | string | ✅ |
| nombre | 11/11 documentos (100.0%) | string | ✅ |
| apellido | 11/11 documentos (100.0%) | string | ✅ |
| email | 11/11 documentos (100.0%) | string | ✅ |
| telefono | 7/11 documentos (63.6%) | string | ❌ |
| especialidad | 11/11 documentos (100.0%) | string | ✅ |
| descripcion | 11/11 documentos (100.0%) | string | ✅ |
| titulo | 7/11 documentos (63.6%) | string | ❌ |
| modoAtencion | 11/11 documentos (100.0%) | string | ✅ |
| disponibilidad | 11/11 documentos (100.0%) | Array | ✅ |
| duracionTurnoPorDefecto | 11/11 documentos (100.0%) | number | ✅ |
| bufferEntreturnos | 11/11 documentos (100.0%) | number | ✅ |
| capacidadSimultanea | 7/11 documentos (63.6%) | number | ❌ |
| maximoTurnosPorDia | 7/11 documentos (63.6%) | number | ❌ |
| activo | 11/11 documentos (100.0%) | boolean | ✅ |
| creadoEn | 11/11 documentos (100.0%) | Date | ✅ |
| actualizadoEn | 11/11 documentos (100.0%) | Date | ✅ |
| __v | 7/11 documentos (63.6%) | number | ❌ |
| sector | 6/11 documentos (54.5%) | string | ❌ |
| disponibilidad[0].diaSemana | 10/11 documentos (90.9%) | number | ❌ |
| disponibilidad[0].horaInicio | 10/11 documentos (90.9%) | string | ❌ |
| disponibilidad[0].horaFin | 10/11 documentos (90.9%) | string | ❌ |
| disponibilidad[0].activo | 10/11 documentos (90.9%) | boolean | ❌ |

### configuracionbots

- **Documentos:** 9
- **Índices:** 2

#### Índices

| Nombre | Campos | Único | Sparse |
|--------|--------|-------|--------|
| _id_ | {"_id":1} | ❌ | ❌ |
| empresaId_1 | {"empresaId":1} | ✅ | ❌ |

#### Esquema Inferido

| Campo | Aparece en | Tipos | Requerido |
|-------|------------|-------|----------|
| _id | 9/9 documentos (100.0%) | ObjectId | ✅ |
| empresaId | 9/9 documentos (100.0%) | string | ✅ |
| activo | 9/9 documentos (100.0%) | boolean | ✅ |
| mensajeBienvenida | 9/9 documentos (100.0%) | string | ✅ |
| mensajeDespedida | 9/9 documentos (100.0%) | string | ✅ |
| mensajeError | 9/9 documentos (100.0%) | string | ✅ |
| timeoutMinutos | 9/9 documentos (100.0%) | number | ✅ |
| flujos | 7/9 documentos (77.8%) | Object | ❌ |
| flujos.crearTurno | 7/9 documentos (77.8%) | Object | ❌ |
| flujos.crearTurno.nombre | 7/9 documentos (77.8%) | string | ❌ |
| flujos.crearTurno.descripcion | 7/9 documentos (77.8%) | string | ❌ |
| flujos.crearTurno.pasoInicial | 7/9 documentos (77.8%) | string | ❌ |
| flujos.crearTurno.pasos | 7/9 documentos (77.8%) | Array | ❌ |
| flujos.consultarTurnos | 7/9 documentos (77.8%) | Object | ❌ |
| flujos.consultarTurnos.nombre | 7/9 documentos (77.8%) | string | ❌ |
| flujos.consultarTurnos.descripcion | 7/9 documentos (77.8%) | string | ❌ |
| flujos.consultarTurnos.pasoInicial | 7/9 documentos (77.8%) | string | ❌ |
| flujos.consultarTurnos.pasos | 7/9 documentos (77.8%) | Array | ❌ |
| flujos.cancelarTurno | 7/9 documentos (77.8%) | Object | ❌ |
| flujos.cancelarTurno.nombre | 7/9 documentos (77.8%) | string | ❌ |
| flujos.cancelarTurno.descripcion | 7/9 documentos (77.8%) | string | ❌ |
| flujos.cancelarTurno.pasoInicial | 7/9 documentos (77.8%) | string | ❌ |
| flujos.cancelarTurno.pasos | 7/9 documentos (77.8%) | Array | ❌ |
| flujos._id | 7/9 documentos (77.8%) | ObjectId | ❌ |
| horariosAtencion | 9/9 documentos (100.0%) | Object | ✅ |
| horariosAtencion.activo | 9/9 documentos (100.0%) | boolean | ✅ |
| horariosAtencion.inicio | 9/9 documentos (100.0%) | string | ✅ |
| horariosAtencion.fin | 9/9 documentos (100.0%) | string | ✅ |
| horariosAtencion.diasSemana | 9/9 documentos (100.0%) | Array | ✅ |
| horariosAtencion.mensajeFueraHorario | 9/9 documentos (100.0%) | string | ✅ |
| horariosAtencion._id | 7/9 documentos (77.8%) | ObjectId | ❌ |
| requiereConfirmacion | 9/9 documentos (100.0%) | boolean | ✅ |
| permiteCancelacion | 9/9 documentos (100.0%) | boolean | ✅ |
| notificarAdmin | 9/9 documentos (100.0%) | boolean | ✅ |
| createdAt | 8/9 documentos (88.9%) | Date | ❌ |
| updatedAt | 9/9 documentos (100.0%) | Date | ✅ |
| __v | 7/9 documentos (77.8%) | number | ❌ |

### flownodes

- **Documentos:** 6
- **Índices:** 6

#### Índices

| Nombre | Campos | Único | Sparse |
|--------|--------|-------|--------|
| _id_ | {"_id":1} | ❌ | ❌ |
| empresaId_1 | {"empresaId":1} | ❌ | ❌ |
| flowId_1 | {"flowId":1} | ❌ | ❌ |
| empresaId_1_flowId_1_id_1 | {"empresaId":1,"flowId":1,"id":1} | ✅ | ❌ |
| empresaId_1_activo_1 | {"empresaId":1,"activo":1} | ❌ | ❌ |
| empresaId_1_flowId_1_metadata.orden_1 | {"empresaId":1,"flowId":1,"metadata.orden":1} | ❌ | ❌ |

#### Esquema Inferido

| Campo | Aparece en | Tipos | Requerido |
|-------|------------|-------|----------|
| _id | 6/6 documentos (100.0%) | ObjectId | ✅ |
| empresaId | 6/6 documentos (100.0%) | string | ✅ |
| flowId | 6/6 documentos (100.0%) | string | ✅ |
| id | 6/6 documentos (100.0%) | string | ✅ |
| type | 6/6 documentos (100.0%) | string | ✅ |
| name | 6/6 documentos (100.0%) | string | ✅ |
| message | 6/6 documentos (100.0%) | string | ✅ |
| next | 3/6 documentos (50.0%) | string | ❌ |
| nombreVariable | 1/6 documentos (16.7%) | string | ❌ |
| validation | 1/6 documentos (16.7%) | Object | ❌ |
| validation.type | 1/6 documentos (16.7%) | string | ❌ |
| validation.required | 1/6 documentos (16.7%) | boolean | ❌ |
| metadata | 6/6 documentos (100.0%) | Object | ✅ |
| metadata.position | 6/6 documentos (100.0%) | Object | ✅ |
| metadata.position.x | 6/6 documentos (100.0%) | number | ✅ |
| metadata.position.y | 6/6 documentos (100.0%) | number | ✅ |
| metadata.description | 6/6 documentos (100.0%) | string | ✅ |
| metadata.tags | 6/6 documentos (100.0%) | Array | ✅ |
| metadata.orden | 6/6 documentos (100.0%) | number | ✅ |
| activo | 6/6 documentos (100.0%) | boolean | ✅ |
| action | 3/6 documentos (50.0%) | Object | ❌ |
| action.type | 3/6 documentos (50.0%) | string | ❌ |
| action.config | 3/6 documentos (50.0%) | Object | ❌ |
| action.config.model | 2/6 documentos (33.3%) | string | ❌ |
| action.config.temperature | 2/6 documentos (33.3%) | number | ❌ |
| action.config.max_tokens | 2/6 documentos (33.3%) | number | ❌ |
| action.config.functions | 1/6 documentos (16.7%) | Array | ❌ |
| action.config.functions[0].name | 1/6 documentos (16.7%) | string | ❌ |
| action.config.functions[0].description | 1/6 documentos (16.7%) | string | ❌ |
| action.config.functions[0].parameters | 1/6 documentos (16.7%) | Object | ❌ |
| action.config.functions[0].parameters.type | 1/6 documentos (16.7%) | string | ❌ |
| action.config.functions[0].parameters.properties | 1/6 documentos (16.7%) | Object | ❌ |
| action.config.functions[0].parameters.properties.query | 1/6 documentos (16.7%) | Object | ❌ |
| action.config.functions[0].parameters.properties.query.type | 1/6 documentos (16.7%) | string | ❌ |
| action.config.functions[0].parameters.properties.query.description | 1/6 documentos (16.7%) | string | ❌ |
| action.config.functions[0].parameters.required | 1/6 documentos (16.7%) | Array | ❌ |
| action.onSuccess | 3/6 documentos (50.0%) | string | ❌ |
| action.onError | 3/6 documentos (50.0%) | string | ❌ |
| action.config.dynamic | 1/6 documentos (16.7%) | boolean | ❌ |

### flow_nodes

- **Documentos:** 24
- **Índices:** 5

#### Índices

| Nombre | Campos | Único | Sparse |
|--------|--------|-------|--------|
| _id_ | {"_id":1} | ❌ | ❌ |
| empresaId_1 | {"empresaId":1} | ❌ | ❌ |
| flowId_1 | {"flowId":1} | ❌ | ❌ |
| empresaId_1_flowId_1_id_1 | {"empresaId":1,"flowId":1,"id":1} | ✅ | ❌ |
| empresaId_1_activo_1 | {"empresaId":1,"activo":1} | ❌ | ❌ |

#### Esquema Inferido

| Campo | Aparece en | Tipos | Requerido |
|-------|------------|-------|----------|
| _id | 24/24 documentos (100.0%) | ObjectId | ✅ |
| empresaId | 24/24 documentos (100.0%) | string | ✅ |
| flowId | 24/24 documentos (100.0%) | string | ✅ |
| id | 24/24 documentos (100.0%) | string | ✅ |
| type | 24/24 documentos (100.0%) | string | ✅ |
| name | 24/24 documentos (100.0%) | string | ✅ |
| message | 17/24 documentos (70.8%) | string | ❌ |
| options | 24/24 documentos (100.0%) | Array | ✅ |
| options[0].text | 9/24 documentos (37.5%) | string | ❌ |
| options[0].value | 2/24 documentos (8.3%) | string | ❌ |
| options[0].next | 9/24 documentos (37.5%) | string | ❌ |
| metadata | 24/24 documentos (100.0%) | Object | ✅ |
| metadata.tags | 24/24 documentos (100.0%) | Array | ✅ |
| activo | 24/24 documentos (100.0%) | boolean | ✅ |
| conditions | 24/24 documentos (100.0%) | Array | ✅ |
| createdAt | 24/24 documentos (100.0%) | Date | ✅ |
| updatedAt | 24/24 documentos (100.0%) | Date | ✅ |
| __v | 24/24 documentos (100.0%) | number | ✅ |
| validation | 5/24 documentos (20.8%) | Object | ❌ |
| validation.type | 5/24 documentos (20.8%) | string | ❌ |
| validation.min | 2/24 documentos (8.3%) | number | ❌ |
| validation.max | 2/24 documentos (8.3%) | number | ❌ |
| validation.required | 5/24 documentos (20.8%) | boolean | ❌ |
| validation.errorMessage | 3/24 documentos (12.5%) | string | ❌ |
| next | 7/24 documentos (29.2%) | string | ❌ |
| action | 6/24 documentos (25.0%) | Object | ❌ |
| action.type | 6/24 documentos (25.0%) | string | ❌ |
| action.config | 6/24 documentos (25.0%) | Object | ❌ |
| action.config.endpoint | 4/24 documentos (16.7%) | string | ❌ |
| action.config.params | 2/24 documentos (8.3%) | Object | ❌ |
| action.config.params.search | 1/24 documentos (4.2%) | string | ❌ |
| action.onSuccess | 6/24 documentos (25.0%) | string | ❌ |
| action.onError | 6/24 documentos (25.0%) | string | ❌ |
| conditions[0].if | 2/24 documentos (8.3%) | string | ❌ |
| conditions[0].next | 2/24 documentos (8.3%) | string | ❌ |
| conditions[0].operator | 2/24 documentos (8.3%) | string | ❌ |
| conditions[0].value | 2/24 documentos (8.3%) | number, boolean | ❌ |
| action.config.title | 2/24 documentos (8.3%) | string | ❌ |
| action.config.amount | 2/24 documentos (8.3%) | string | ❌ |
| action.config.description | 2/24 documentos (8.3%) | string | ❌ |
| validation.pattern | 1/24 documentos (4.2%) | string | ❌ |
| action.config.params.deporte | 1/24 documentos (4.2%) | string | ❌ |
| action.config.params.fecha | 1/24 documentos (4.2%) | string | ❌ |
| action.config.params.duracion | 1/24 documentos (4.2%) | string | ❌ |
| action.config.params.hora | 1/24 documentos (4.2%) | string | ❌ |
| action.config.method | 1/24 documentos (4.2%) | string | ❌ |
| action.config.body | 1/24 documentos (4.2%) | Object | ❌ |
| action.config.body.deporte | 1/24 documentos (4.2%) | string | ❌ |
| action.config.body.fecha | 1/24 documentos (4.2%) | string | ❌ |
| action.config.body.hora | 1/24 documentos (4.2%) | string | ❌ |
| action.config.body.duracion | 1/24 documentos (4.2%) | string | ❌ |
| action.config.body.nombre | 1/24 documentos (4.2%) | string | ❌ |
| action.config.body.telefono | 1/24 documentos (4.2%) | string | ❌ |

### configuracion_bots

- **Documentos:** 0
- **Índices:** 1

#### Índices

| Nombre | Campos | Único | Sparse |
|--------|--------|-------|--------|
| _id_ | {"_id":1} | ❌ | ❌ |

#### Esquema Inferido

| Campo | Aparece en | Tipos | Requerido |
|-------|------------|-------|----------|

### mppayments

- **Documentos:** 12
- **Índices:** 12

#### Índices

| Nombre | Campos | Único | Sparse |
|--------|--------|-------|--------|
| _id_ | {"_id":1} | ❌ | ❌ |
| mpPaymentId_1 | {"mpPaymentId":1} | ✅ | ❌ |
| sellerId_1 | {"sellerId":1} | ❌ | ❌ |
| paymentLinkId_1 | {"paymentLinkId":1} | ❌ | ❌ |
| externalReference_1 | {"externalReference":1} | ❌ | ❌ |
| status_1 | {"status":1} | ❌ | ❌ |
| sellerId_1_status_1 | {"sellerId":1,"status":1} | ❌ | ❌ |
| sellerId_1_createdAt_-1 | {"sellerId":1,"createdAt":-1} | ❌ | ❌ |
| empresaId_1 | {"empresaId":1} | ❌ | ❌ |
| empresaId_1_status_1 | {"empresaId":1,"status":1} | ❌ | ❌ |
| empresaId_1_createdAt_-1 | {"empresaId":1,"createdAt":-1} | ❌ | ❌ |
| sellerId_1_empresaId_1_status_1 | {"sellerId":1,"empresaId":1,"status":1} | ❌ | ❌ |

#### Esquema Inferido

| Campo | Aparece en | Tipos | Requerido |
|-------|------------|-------|----------|
| _id | 12/12 documentos (100.0%) | ObjectId | ✅ |
| mpPaymentId | 12/12 documentos (100.0%) | string | ✅ |
| sellerId | 12/12 documentos (100.0%) | string | ✅ |
| empresaId | 12/12 documentos (100.0%) | string | ✅ |
| externalReference | 12/12 documentos (100.0%) | string | ✅ |
| status | 12/12 documentos (100.0%) | string | ✅ |
| statusDetail | 12/12 documentos (100.0%) | string | ✅ |
| amount | 12/12 documentos (100.0%) | number | ✅ |
| currency | 12/12 documentos (100.0%) | string | ✅ |
| paymentMethodId | 12/12 documentos (100.0%) | string | ✅ |
| paymentTypeId | 12/12 documentos (100.0%) | string | ✅ |
| installments | 12/12 documentos (100.0%) | number | ✅ |
| payerEmail | 12/12 documentos (100.0%) | string | ✅ |
| payerPhone | 12/12 documentos (100.0%) | null, string | ✅ |
| payerDocType | 12/12 documentos (100.0%) | string | ✅ |
| payerDocNumber | 12/12 documentos (100.0%) | string | ✅ |
| dateCreated | 12/12 documentos (100.0%) | Date | ✅ |
| dateApproved | 12/12 documentos (100.0%) | Date | ✅ |
| dateLastUpdated | 12/12 documentos (100.0%) | Date | ✅ |
| createdAt | 12/12 documentos (100.0%) | Date | ✅ |
| updatedAt | 12/12 documentos (100.0%) | Date | ✅ |
| __v | 12/12 documentos (100.0%) | number | ✅ |
| paymentLinkId | 8/12 documentos (66.7%) | string | ❌ |

### configuraciones_modulo

- **Documentos:** 11
- **Índices:** 2

#### Índices

| Nombre | Campos | Único | Sparse |
|--------|--------|-------|--------|
| _id_ | {"_id":1} | ❌ | ❌ |
| empresaId_1 | {"empresaId":1} | ✅ | ❌ |

#### Esquema Inferido

| Campo | Aparece en | Tipos | Requerido |
|-------|------------|-------|----------|
| _id | 11/11 documentos (100.0%) | ObjectId | ✅ |
| empresaId | 11/11 documentos (100.0%) | string | ✅ |
| tipoNegocio | 11/11 documentos (100.0%) | string | ✅ |
| activo | 11/11 documentos (100.0%) | boolean | ✅ |
| nomenclatura | 11/11 documentos (100.0%) | Object | ✅ |
| nomenclatura.turno | 11/11 documentos (100.0%) | string | ✅ |
| nomenclatura.turnos | 11/11 documentos (100.0%) | string | ✅ |
| nomenclatura.agente | 11/11 documentos (100.0%) | string | ✅ |
| nomenclatura.agentes | 11/11 documentos (100.0%) | string | ✅ |
| nomenclatura.cliente | 11/11 documentos (100.0%) | string | ✅ |
| nomenclatura.clientes | 11/11 documentos (100.0%) | string | ✅ |
| nomenclatura.recurso | 3/11 documentos (27.3%) | string | ❌ |
| nomenclatura.recursos | 3/11 documentos (27.3%) | string | ❌ |
| camposPersonalizados | 11/11 documentos (100.0%) | Array | ✅ |
| camposPersonalizados[0].clave | 1/11 documentos (9.1%) | string | ❌ |
| camposPersonalizados[0].etiqueta | 1/11 documentos (9.1%) | string | ❌ |
| camposPersonalizados[0].tipo | 1/11 documentos (9.1%) | string | ❌ |
| camposPersonalizados[0].requerido | 1/11 documentos (9.1%) | boolean | ❌ |
| camposPersonalizados[0].opciones | 1/11 documentos (9.1%) | Array | ❌ |
| camposPersonalizados[0].placeholder | 1/11 documentos (9.1%) | string | ❌ |
| camposPersonalizados[0].orden | 1/11 documentos (9.1%) | number | ❌ |
| camposPersonalizados[0].mostrarEnLista | 1/11 documentos (9.1%) | boolean | ❌ |
| camposPersonalizados[0].mostrarEnCalendario | 1/11 documentos (9.1%) | boolean | ❌ |
| camposPersonalizados[0].usarEnNotificacion | 1/11 documentos (9.1%) | boolean | ❌ |
| turnos | 1/11 documentos (9.1%) | Object | ❌ |
| turnos.usaAgentes | 1/11 documentos (9.1%) | boolean | ❌ |
| turnos.agenteRequerido | 1/11 documentos (9.1%) | boolean | ❌ |
| turnos.usaRecursos | 1/11 documentos (9.1%) | boolean | ❌ |
| turnos.recursoRequerido | 1/11 documentos (9.1%) | boolean | ❌ |
| turnos.duracionPorDefecto | 1/11 documentos (9.1%) | number | ❌ |
| turnos.permiteDuracionVariable | 1/11 documentos (9.1%) | boolean | ❌ |
| plantillasMeta | 2/11 documentos (18.2%) | Object | ❌ |
| plantillasMeta.notificacionDiariaAgentes | 2/11 documentos (18.2%) | Object | ❌ |
| plantillasMeta.notificacionDiariaAgentes.activa | 2/11 documentos (18.2%) | boolean | ❌ |
| plantillasMeta.notificacionDiariaAgentes.tipo | 1/11 documentos (9.1%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.nombre | 2/11 documentos (18.2%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.idioma | 2/11 documentos (18.2%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.parametros | 1/11 documentos (9.1%) | Array | ❌ |
| plantillasMeta.notificacionDiariaAgentes.parametros[0].orden | 1/11 documentos (9.1%) | number | ❌ |
| plantillasMeta.notificacionDiariaAgentes.parametros[0].variable | 1/11 documentos (9.1%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.parametros[0].valor | 1/11 documentos (9.1%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.programacion | 2/11 documentos (18.2%) | Object | ❌ |
| plantillasMeta.notificacionDiariaAgentes.programacion.metodoVerificacion | 2/11 documentos (18.2%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.programacion.horaEnvio | 2/11 documentos (18.2%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.programacion.frecuencia | 2/11 documentos (18.2%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.programacion.rangoHorario | 2/11 documentos (18.2%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.programacion.filtroEstado | 2/11 documentos (18.2%) | Array | ❌ |
| plantillasMeta.notificacionDiariaAgentes.programacion.incluirDetalles | 2/11 documentos (18.2%) | Object | ❌ |
| plantillasMeta.notificacionDiariaAgentes.programacion.incluirDetalles.origen | 2/11 documentos (18.2%) | boolean | ❌ |
| plantillasMeta.notificacionDiariaAgentes.programacion.incluirDetalles.destino | 2/11 documentos (18.2%) | boolean | ❌ |
| plantillasMeta.notificacionDiariaAgentes.programacion.incluirDetalles.nombreCliente | 2/11 documentos (18.2%) | boolean | ❌ |
| plantillasMeta.notificacionDiariaAgentes.programacion.incluirDetalles.telefonoCliente | 2/11 documentos (18.2%) | boolean | ❌ |
| plantillasMeta.notificacionDiariaAgentes.programacion.incluirDetalles.horaReserva | 2/11 documentos (18.2%) | boolean | ❌ |
| plantillasMeta.notificacionDiariaAgentes.programacion.incluirDetalles.notasInternas | 2/11 documentos (18.2%) | boolean | ❌ |
| plantillasMeta.notificacionDiariaAgentes.ultimoEnvio | 2/11 documentos (18.2%) | Date | ❌ |
| plantillasMeta.confirmacionTurnos | 2/11 documentos (18.2%) | Object | ❌ |
| plantillasMeta.confirmacionTurnos.activa | 2/11 documentos (18.2%) | boolean | ❌ |
| plantillasMeta.confirmacionTurnos.tipo | 1/11 documentos (9.1%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.nombre | 2/11 documentos (18.2%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.idioma | 2/11 documentos (18.2%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.parametros | 1/11 documentos (9.1%) | Array | ❌ |
| plantillasMeta.confirmacionTurnos.parametros[0].orden | 1/11 documentos (9.1%) | number | ❌ |
| plantillasMeta.confirmacionTurnos.parametros[0].variable | 1/11 documentos (9.1%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.parametros[0].valor | 1/11 documentos (9.1%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.programacion | 2/11 documentos (18.2%) | Object | ❌ |
| plantillasMeta.confirmacionTurnos.programacion.metodoVerificacion | 2/11 documentos (18.2%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.programacion.horaEnvio | 2/11 documentos (18.2%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.programacion.diasAntes | 2/11 documentos (18.2%) | number | ❌ |
| plantillasMeta.confirmacionTurnos.programacion.filtroEstado | 2/11 documentos (18.2%) | Array | ❌ |
| creadoEn | 9/11 documentos (81.8%) | Date | ❌ |
| actualizadoEn | 10/11 documentos (90.9%) | Date | ❌ |
| __v | 9/11 documentos (81.8%) | number | ❌ |
| agenteRequerido | 11/11 documentos (100.0%) | boolean | ✅ |
| chatbotActivo | 11/11 documentos (100.0%) | boolean | ✅ |
| chatbotPuedeCancelar | 11/11 documentos (100.0%) | boolean | ✅ |
| chatbotPuedeCrear | 11/11 documentos (100.0%) | boolean | ✅ |
| chatbotPuedeModificar | 11/11 documentos (100.0%) | boolean | ✅ |
| duracionPorDefecto | 11/11 documentos (100.0%) | number | ✅ |
| estadosPersonalizados | 11/11 documentos (100.0%) | Array | ✅ |
| notificaciones | 11/11 documentos (100.0%) | Array | ✅ |
| permiteDuracionVariable | 11/11 documentos (100.0%) | boolean | ✅ |
| recursoRequerido | 11/11 documentos (100.0%) | boolean | ✅ |
| requiereConfirmacion | 11/11 documentos (100.0%) | boolean | ✅ |
| usaAgentes | 11/11 documentos (100.0%) | boolean | ✅ |
| usaHorariosDisponibilidad | 11/11 documentos (100.0%) | boolean | ✅ |
| usaRecursos | 11/11 documentos (100.0%) | boolean | ✅ |
| mensajesFlujo | 3/11 documentos (27.3%) | Object | ❌ |
| mensajesFlujo.confirmacion_turnos | 3/11 documentos (27.3%) | Object | ❌ |
| mensajesFlujo.confirmacion_turnos.esperando_confirmacion | 3/11 documentos (27.3%) | Object | ❌ |
| mensajesFlujo.confirmacion_turnos.esperando_confirmacion.mensaje | 3/11 documentos (27.3%) | string | ❌ |
| mensajesFlujo.confirmacion_turnos.esperando_confirmacion.botones | 3/11 documentos (27.3%) | Array | ❌ |
| mensajesFlujo.confirmacion_turnos.esperando_confirmacion.botones[0].id | 3/11 documentos (27.3%) | string | ❌ |
| mensajesFlujo.confirmacion_turnos.esperando_confirmacion.botones[0].texto | 3/11 documentos (27.3%) | string | ❌ |
| mensajesFlujo.confirmacion_turnos.confirmado | 3/11 documentos (27.3%) | Object | ❌ |
| mensajesFlujo.confirmacion_turnos.confirmado.mensaje | 3/11 documentos (27.3%) | string | ❌ |
| mensajesFlujo.confirmacion_turnos.confirmado.botones | 1/11 documentos (9.1%) | Array | ❌ |
| mensajesFlujo.confirmacion_turnos.cancelado | 3/11 documentos (27.3%) | Object | ❌ |
| mensajesFlujo.confirmacion_turnos.cancelado.mensaje | 3/11 documentos (27.3%) | string | ❌ |
| mensajesFlujo.confirmacion_turnos.cancelado.botones | 1/11 documentos (9.1%) | Array | ❌ |
| mensajesFlujo.confirmacion_turnos.modificado | 3/11 documentos (27.3%) | Object | ❌ |
| mensajesFlujo.confirmacion_turnos.modificado.mensaje | 3/11 documentos (27.3%) | string | ❌ |
| mensajesFlujo.confirmacion_turnos.modificado.botones | 1/11 documentos (9.1%) | Array | ❌ |
| mensajesFlujo.confirmacion_turnos.error | 3/11 documentos (27.3%) | Object | ❌ |
| mensajesFlujo.confirmacion_turnos.error.mensaje | 3/11 documentos (27.3%) | string | ❌ |
| mensajesFlujo.confirmacion_turnos.error.botones | 1/11 documentos (9.1%) | Array | ❌ |
| mensajesFlujo.menu_principal | 3/11 documentos (27.3%) | Object | ❌ |
| mensajesFlujo.menu_principal.bienvenida | 3/11 documentos (27.3%) | Object | ❌ |
| mensajesFlujo.menu_principal.bienvenida.mensaje | 3/11 documentos (27.3%) | string | ❌ |
| mensajesFlujo.menu_principal.bienvenida.botones | 1/11 documentos (9.1%) | Array | ❌ |
| mensajesFlujo.menu_principal.bienvenida.opciones | 3/11 documentos (27.3%) | Array | ❌ |
| mensajesFlujo.menu_principal.bienvenida.opciones[0].id | 3/11 documentos (27.3%) | string | ❌ |
| mensajesFlujo.menu_principal.bienvenida.opciones[0].texto | 3/11 documentos (27.3%) | string | ❌ |
| mensajesFlujo.menu_principal.bienvenida.opciones[0].descripcion | 3/11 documentos (27.3%) | string | ❌ |
| mensajesFlujo.menu_principal.opcion_invalida | 3/11 documentos (27.3%) | Object | ❌ |
| mensajesFlujo.menu_principal.opcion_invalida.mensaje | 3/11 documentos (27.3%) | string | ❌ |
| mensajesFlujo.menu_principal.opcion_invalida.botones | 1/11 documentos (9.1%) | Array | ❌ |
| mensajesFlujo.notificacion_viajes | 3/11 documentos (27.3%) | Object | ❌ |
| mensajesFlujo.notificacion_viajes.esperando_opcion_inicial | 3/11 documentos (27.3%) | Object | ❌ |
| mensajesFlujo.notificacion_viajes.esperando_opcion_inicial.mensaje | 3/11 documentos (27.3%) | string | ❌ |
| mensajesFlujo.notificacion_viajes.esperando_opcion_inicial.botones | 3/11 documentos (27.3%) | Array | ❌ |
| mensajesFlujo.notificacion_viajes.esperando_opcion_inicial.botones[0].id | 3/11 documentos (27.3%) | string | ❌ |
| mensajesFlujo.notificacion_viajes.esperando_opcion_inicial.botones[0].texto | 3/11 documentos (27.3%) | string | ❌ |
| mensajesFlujo.notificacion_viajes.confirmado | 3/11 documentos (27.3%) | Object | ❌ |
| mensajesFlujo.notificacion_viajes.confirmado.mensaje | 3/11 documentos (27.3%) | string | ❌ |
| mensajesFlujo.notificacion_viajes.confirmado.botones | 1/11 documentos (9.1%) | Array | ❌ |
| mensajesFlujo.notificacion_viajes.cancelado | 3/11 documentos (27.3%) | Object | ❌ |
| mensajesFlujo.notificacion_viajes.cancelado.mensaje | 3/11 documentos (27.3%) | string | ❌ |
| mensajesFlujo.notificacion_viajes.cancelado.botones | 1/11 documentos (9.1%) | Array | ❌ |
| variablesDinamicas | 6/11 documentos (54.5%) | Object | ❌ |
| variablesDinamicas.nombre_empresa | 6/11 documentos (54.5%) | string | ❌ |
| variablesDinamicas.nomenclatura_turno | 6/11 documentos (54.5%) | string | ❌ |
| variablesDinamicas.nomenclatura_turnos | 6/11 documentos (54.5%) | string | ❌ |
| variablesDinamicas.nomenclatura_agente | 6/11 documentos (54.5%) | string | ❌ |
| variablesDinamicas.nomenclatura_agentes | 6/11 documentos (54.5%) | string | ❌ |
| variablesDinamicas.zona_horaria | 6/11 documentos (54.5%) | string | ❌ |
| variablesDinamicas.moneda | 6/11 documentos (54.5%) | string | ❌ |
| variablesDinamicas.idioma | 6/11 documentos (54.5%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.metaApiUrl | 1/11 documentos (9.1%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.metaPayload | 1/11 documentos (9.1%) | Object | ❌ |
| plantillasMeta.notificacionDiariaAgentes.metaPayload.messaging_product | 1/11 documentos (9.1%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.metaPayload.to | 1/11 documentos (9.1%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.metaPayload.type | 1/11 documentos (9.1%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.metaPayload.template | 1/11 documentos (9.1%) | Object | ❌ |
| plantillasMeta.notificacionDiariaAgentes.metaPayload.template.name | 1/11 documentos (9.1%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.metaPayload.template.language | 1/11 documentos (9.1%) | Object | ❌ |
| plantillasMeta.notificacionDiariaAgentes.metaPayload.template.language.code | 1/11 documentos (9.1%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.metaPayload.template.components | 1/11 documentos (9.1%) | Array | ❌ |
| plantillasMeta.notificacionDiariaAgentes.metaPayload.template.components[0].type | 1/11 documentos (9.1%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.metaPayload.template.components[0].parameters | 1/11 documentos (9.1%) | Array | ❌ |
| plantillasMeta.notificacionDiariaAgentes.metaPayload.template.components[0].parameters[0].type | 1/11 documentos (9.1%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.metaPayload.template.components[0].parameters[0].text | 1/11 documentos (9.1%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.variables | 1/11 documentos (9.1%) | Object | ❌ |
| plantillasMeta.notificacionDiariaAgentes.variables.phoneNumberId | 1/11 documentos (9.1%) | Object | ❌ |
| plantillasMeta.notificacionDiariaAgentes.variables.phoneNumberId.origen | 1/11 documentos (9.1%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.variables.phoneNumberId.campo | 1/11 documentos (9.1%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.variables.telefono | 1/11 documentos (9.1%) | Object | ❌ |
| plantillasMeta.notificacionDiariaAgentes.variables.telefono.origen | 1/11 documentos (9.1%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.variables.telefono.campo | 1/11 documentos (9.1%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.variables.agente | 1/11 documentos (9.1%) | Object | ❌ |
| plantillasMeta.notificacionDiariaAgentes.variables.agente.origen | 1/11 documentos (9.1%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.variables.agente.formula | 1/11 documentos (9.1%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.variables.lista_turnos | 1/11 documentos (9.1%) | Object | ❌ |
| plantillasMeta.notificacionDiariaAgentes.variables.lista_turnos.origen | 1/11 documentos (9.1%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.variables.lista_turnos.formula | 1/11 documentos (9.1%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.metaApiUrl | 1/11 documentos (9.1%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.metaPayload | 1/11 documentos (9.1%) | Object | ❌ |
| plantillasMeta.confirmacionTurnos.metaPayload.messaging_product | 1/11 documentos (9.1%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.metaPayload.to | 1/11 documentos (9.1%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.metaPayload.type | 1/11 documentos (9.1%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.metaPayload.template | 1/11 documentos (9.1%) | Object | ❌ |
| plantillasMeta.confirmacionTurnos.metaPayload.template.name | 1/11 documentos (9.1%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.metaPayload.template.language | 1/11 documentos (9.1%) | Object | ❌ |
| plantillasMeta.confirmacionTurnos.metaPayload.template.language.code | 1/11 documentos (9.1%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.metaPayload.template.components | 1/11 documentos (9.1%) | Array | ❌ |
| plantillasMeta.confirmacionTurnos.metaPayload.template.components[0].type | 1/11 documentos (9.1%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.metaPayload.template.components[0].parameters | 1/11 documentos (9.1%) | Array | ❌ |
| plantillasMeta.confirmacionTurnos.metaPayload.template.components[0].parameters[0].type | 1/11 documentos (9.1%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.metaPayload.template.components[0].parameters[0].text | 1/11 documentos (9.1%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.variables | 1/11 documentos (9.1%) | Object | ❌ |
| plantillasMeta.confirmacionTurnos.variables.phoneNumberId | 1/11 documentos (9.1%) | Object | ❌ |
| plantillasMeta.confirmacionTurnos.variables.phoneNumberId.origen | 1/11 documentos (9.1%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.variables.phoneNumberId.campo | 1/11 documentos (9.1%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.variables.telefono | 1/11 documentos (9.1%) | Object | ❌ |
| plantillasMeta.confirmacionTurnos.variables.telefono.origen | 1/11 documentos (9.1%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.variables.telefono.campo | 1/11 documentos (9.1%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.variables.nombre_cliente | 1/11 documentos (9.1%) | Object | ❌ |
| plantillasMeta.confirmacionTurnos.variables.nombre_cliente.origen | 1/11 documentos (9.1%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.variables.nombre_cliente.formula | 1/11 documentos (9.1%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.variables.fecha_hora | 1/11 documentos (9.1%) | Object | ❌ |
| plantillasMeta.confirmacionTurnos.variables.fecha_hora.origen | 1/11 documentos (9.1%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.variables.fecha_hora.formula | 1/11 documentos (9.1%) | string | ❌ |
| notificacionDiariaAgentes | 1/11 documentos (9.1%) | Object | ❌ |
| notificacionDiariaAgentes.activa | 1/11 documentos (9.1%) | boolean | ❌ |
| notificacionDiariaAgentes.horaEnvio | 1/11 documentos (9.1%) | string | ❌ |
| notificacionDiariaAgentes.enviarATodos | 1/11 documentos (9.1%) | boolean | ❌ |
| notificacionDiariaAgentes.plantillaMensaje | 1/11 documentos (9.1%) | string | ❌ |
| notificacionDiariaAgentes.frecuencia | 1/11 documentos (9.1%) | Object | ❌ |
| notificacionDiariaAgentes.frecuencia.tipo | 1/11 documentos (9.1%) | string | ❌ |
| notificacionDiariaAgentes.frecuencia.diasSemana | 1/11 documentos (9.1%) | Array | ❌ |
| notificacionDiariaAgentes.rangoHorario | 1/11 documentos (9.1%) | Object | ❌ |
| notificacionDiariaAgentes.rangoHorario.activo | 1/11 documentos (9.1%) | boolean | ❌ |
| notificacionDiariaAgentes.rangoHorario.tipo | 1/11 documentos (9.1%) | string | ❌ |
| notificacionDiariaAgentes.filtroHorario | 1/11 documentos (9.1%) | Object | ❌ |
| notificacionDiariaAgentes.filtroHorario.activo | 1/11 documentos (9.1%) | boolean | ❌ |
| notificacionDiariaAgentes.filtroHorario.tipo | 1/11 documentos (9.1%) | string | ❌ |
| notificacionDiariaAgentes.filtroEstado | 1/11 documentos (9.1%) | Object | ❌ |
| notificacionDiariaAgentes.filtroEstado.activo | 1/11 documentos (9.1%) | boolean | ❌ |
| notificacionDiariaAgentes.filtroEstado.estados | 1/11 documentos (9.1%) | Array | ❌ |
| notificacionDiariaAgentes.filtroTipo | 1/11 documentos (9.1%) | Object | ❌ |
| notificacionDiariaAgentes.filtroTipo.activo | 1/11 documentos (9.1%) | boolean | ❌ |
| notificacionDiariaAgentes.filtroTipo.tipos | 1/11 documentos (9.1%) | Array | ❌ |
| notificacionDiariaAgentes.incluirDetalles | 1/11 documentos (9.1%) | Object | ❌ |
| notificacionDiariaAgentes.incluirDetalles.origen | 1/11 documentos (9.1%) | boolean | ❌ |
| notificacionDiariaAgentes.incluirDetalles.destino | 1/11 documentos (9.1%) | boolean | ❌ |
| notificacionDiariaAgentes.incluirDetalles.nombreCliente | 1/11 documentos (9.1%) | boolean | ❌ |
| notificacionDiariaAgentes.incluirDetalles.telefonoCliente | 1/11 documentos (9.1%) | boolean | ❌ |
| notificacionDiariaAgentes.incluirDetalles.horaReserva | 1/11 documentos (9.1%) | boolean | ❌ |
| notificacionDiariaAgentes.incluirDetalles.notasInternas | 1/11 documentos (9.1%) | boolean | ❌ |
| notificacionDiariaAgentes.agentesEspecificos | 1/11 documentos (9.1%) | Array | ❌ |
| createdAt | 1/11 documentos (9.1%) | Date | ❌ |
| updatedAt | 1/11 documentos (9.1%) | Date | ❌ |

### ocrconfigs

- **Documentos:** 0
- **Índices:** 2

#### Índices

| Nombre | Campos | Único | Sparse |
|--------|--------|-------|--------|
| _id_ | {"_id":1} | ❌ | ❌ |
| empresaId_1 | {"empresaId":1} | ✅ | ❌ |

#### Esquema Inferido

| Campo | Aparece en | Tipos | Requerido |
|-------|------------|-------|----------|

### usuarios

- **Documentos:** 1
- **Índices:** 4

#### Índices

| Nombre | Campos | Único | Sparse |
|--------|--------|-------|--------|
| _id_ | {"_id":1} | ❌ | ❌ |
| numero_1 | {"numero":1} | ❌ | ❌ |
| empresaId_1 | {"empresaId":1} | ❌ | ❌ |
| numero_1_empresaId_1 | {"numero":1,"empresaId":1} | ✅ | ❌ |

#### Esquema Inferido

| Campo | Aparece en | Tipos | Requerido |
|-------|------------|-------|----------|
| _id | 1/1 documentos (100.0%) | ObjectId | ✅ |
| email | 1/1 documentos (100.0%) | string | ✅ |
| password | 1/1 documentos (100.0%) | string | ✅ |
| nombre | 1/1 documentos (100.0%) | string | ✅ |
| rol | 1/1 documentos (100.0%) | string | ✅ |
| empresaId | 1/1 documentos (100.0%) | ObjectId | ✅ |
| activo | 1/1 documentos (100.0%) | boolean | ✅ |
| createdAt | 1/1 documentos (100.0%) | Date | ✅ |
| updatedAt | 1/1 documentos (100.0%) | Date | ✅ |

### bloqueos_horario

- **Documentos:** 0
- **Índices:** 5

#### Índices

| Nombre | Campos | Único | Sparse |
|--------|--------|-------|--------|
| _id_ | {"_id":1} | ❌ | ❌ |
| empresaId_1 | {"empresaId":1} | ❌ | ❌ |
| agenteId_1 | {"agenteId":1} | ❌ | ❌ |
| fechaInicio_1 | {"fechaInicio":1} | ❌ | ❌ |
| empresaId_1_agenteId_1_fechaInicio_1 | {"empresaId":1,"agenteId":1,"fechaInicio":1} | ❌ | ❌ |

#### Esquema Inferido

| Campo | Aparece en | Tipos | Requerido |
|-------|------------|-------|----------|

### empresas

- **Documentos:** 12
- **Índices:** 3

#### Índices

| Nombre | Campos | Único | Sparse |
|--------|--------|-------|--------|
| _id_ | {"_id":1} | ❌ | ❌ |
| nombre_1 | {"nombre":1} | ✅ | ❌ |
| telefono_1 | {"telefono":1} | ✅ | ❌ |

#### Esquema Inferido

| Campo | Aparece en | Tipos | Requerido |
|-------|------------|-------|----------|
| _id | 12/12 documentos (100.0%) | ObjectId | ✅ |
| nombre | 12/12 documentos (100.0%) | string | ✅ |
| __v | 11/12 documentos (91.7%) | number | ❌ |
| catalogoPath | 12/12 documentos (100.0%) | string | ✅ |
| categoria | 12/12 documentos (100.0%) | string | ✅ |
| createdAt | 11/12 documentos (91.7%) | Date | ❌ |
| derivarA | 12/12 documentos (100.0%) | Array | ✅ |
| email | 12/12 documentos (100.0%) | string | ✅ |
| linkCatalogo | 4/12 documentos (33.3%) | string | ❌ |
| modelo | 12/12 documentos (100.0%) | string | ✅ |
| phoneNumberId | 9/12 documentos (75.0%) | string | ❌ |
| prompt | 12/12 documentos (100.0%) | string | ✅ |
| saludos | 12/12 documentos (100.0%) | Array | ✅ |
| telefono | 12/12 documentos (100.0%) | string | ✅ |
| ubicaciones | 12/12 documentos (100.0%) | Array | ✅ |
| ubicaciones[0].nombre | 4/12 documentos (33.3%) | string | ❌ |
| ubicaciones[0].ciudad | 3/12 documentos (25.0%) | string | ❌ |
| ubicaciones[0].direccion | 4/12 documentos (33.3%) | string | ❌ |
| ubicaciones[0].derivarA | 3/12 documentos (25.0%) | Array | ❌ |
| updatedAt | 12/12 documentos (100.0%) | Date | ✅ |
| facturacion | 11/12 documentos (91.7%) | Object | ❌ |
| facturacion.estado | 11/12 documentos (91.7%) | string | ❌ |
| limites | 11/12 documentos (91.7%) | Object | ❌ |
| limites.agentesSimultaneos | 11/12 documentos (91.7%) | number | ❌ |
| limites.almacenamiento | 11/12 documentos (91.7%) | number | ❌ |
| limites.exportacionesMensuales | 11/12 documentos (91.7%) | number | ❌ |
| limites.integraciones | 11/12 documentos (91.7%) | number | ❌ |
| limites.maxAdmins | 11/12 documentos (91.7%) | number | ❌ |
| limites.maxUsuarios | 11/12 documentos (91.7%) | number | ❌ |
| limites.mensajesMensuales | 11/12 documentos (91.7%) | number | ❌ |
| limites.usuariosActivos | 11/12 documentos (91.7%) | number | ❌ |
| modulos | 11/12 documentos (91.7%) | Array | ❌ |
| plan | 11/12 documentos (91.7%) | string | ❌ |
| uso | 11/12 documentos (91.7%) | Object | ❌ |
| uso.almacenamientoUsado | 11/12 documentos (91.7%) | number | ❌ |
| uso.exportacionesEsteMes | 11/12 documentos (91.7%) | number | ❌ |
| uso.mensajesEsteMes | 11/12 documentos (91.7%) | number | ❌ |
| uso.ultimaActualizacion | 11/12 documentos (91.7%) | Date | ❌ |
| uso.usuariosActivos | 11/12 documentos (91.7%) | number | ❌ |
| modulos[0].id | 4/12 documentos (33.3%) | string | ❌ |
| modulos[0].nombre | 4/12 documentos (33.3%) | string | ❌ |
| modulos[0].descripcion | 4/12 documentos (33.3%) | string | ❌ |
| modulos[0].version | 2/12 documentos (16.7%) | string | ❌ |
| modulos[0].categoria | 3/12 documentos (25.0%) | string | ❌ |
| modulos[0].icono | 2/12 documentos (16.7%) | string | ❌ |
| modulos[0].activo | 4/12 documentos (33.3%) | boolean | ❌ |
| modulos[0].fechaActivacion | 4/12 documentos (33.3%) | Date | ❌ |
| modulos[0].precio | 2/12 documentos (16.7%) | number | ❌ |
| modulos[0].planMinimo | 2/12 documentos (16.7%) | string | ❌ |
| modulos[0].dependencias | 3/12 documentos (25.0%) | Array | ❌ |
| modulos[0].permisos | 3/12 documentos (25.0%) | Array | ❌ |
| modulos[0].configuracion | 3/12 documentos (25.0%) | Object | ❌ |
| modulos[0].configuracion.duracionTurnoPorDefecto | 1/12 documentos (8.3%) | number | ❌ |
| modulos[0].configuracion.bufferEntreturnos | 1/12 documentos (8.3%) | number | ❌ |
| modulos[0].configuracion.anticipacionMinima | 1/12 documentos (8.3%) | number | ❌ |
| modulos[0].configuracion.anticipacionMaxima | 1/12 documentos (8.3%) | number | ❌ |
| modulos[0].configuracion.horaAperturaGlobal | 1/12 documentos (8.3%) | string | ❌ |
| modulos[0].configuracion.horaCierreGlobal | 1/12 documentos (8.3%) | string | ❌ |
| modulos[0].configuracion.requiereConfirmacionAgente | 1/12 documentos (8.3%) | boolean | ❌ |
| modulos[0].configuracion.tiempoLimiteConfirmacion | 1/12 documentos (8.3%) | number | ❌ |
| modulos[0].configuracion.recordatorio24h | 1/12 documentos (8.3%) | boolean | ❌ |
| modulos[0].configuracion.recordatorio1h | 1/12 documentos (8.3%) | boolean | ❌ |
| modulos[0].configuracion.permiteCancelacion | 1/12 documentos (8.3%) | boolean | ❌ |
| modulos[0].configuracion.tiempoLimiteCancelacion | 1/12 documentos (8.3%) | number | ❌ |
| modulos[0].configuracion.notificarAgenteNuevoTurno | 1/12 documentos (8.3%) | boolean | ❌ |
| modulos[0].configuracion.notificarAgenteCancelacion | 1/12 documentos (8.3%) | boolean | ❌ |
| modulos[0].autor | 2/12 documentos (16.7%) | string | ❌ |
| modulos[0].documentacion | 2/12 documentos (16.7%) | string | ❌ |
| modulos[0].soporte | 2/12 documentos (16.7%) | string | ❌ |
| facturacion.ultimoPago | 8/12 documentos (66.7%) | Date | ❌ |
| facturacion.proximoPago | 8/12 documentos (66.7%) | Date | ❌ |
| businessAccountId | 3/12 documentos (25.0%) | string | ❌ |
| chatbotId | 1/12 documentos (8.3%) | ObjectId | ❌ |
| activo | 2/12 documentos (16.7%) | boolean | ❌ |
| mensajeBienvenida | 1/12 documentos (8.3%) | string | ❌ |
| ubicaciones[0].telefono | 1/12 documentos (8.3%) | string | ❌ |
| modulos[0].configuracion.sellerId | 1/12 documentos (8.3%) | string | ❌ |
| modulos[0].configuracion.habilitado | 1/12 documentos (8.3%) | boolean | ❌ |
| descripcion | 1/12 documentos (8.3%) | string | ❌ |
| created_at | 1/12 documentos (8.3%) | Date | ❌ |
| comitente | 1/12 documentos (8.3%) | string | ❌ |

### mpsellers

- **Documentos:** 1
- **Índices:** 4

#### Índices

| Nombre | Campos | Único | Sparse |
|--------|--------|-------|--------|
| _id_ | {"_id":1} | ❌ | ❌ |
| userId_1 | {"userId":1} | ✅ | ❌ |
| internalId_1 | {"internalId":1} | ❌ | ❌ |
| internalId_1_active_1 | {"internalId":1,"active":1} | ❌ | ❌ |

#### Esquema Inferido

| Campo | Aparece en | Tipos | Requerido |
|-------|------------|-------|----------|
| _id | 1/1 documentos (100.0%) | ObjectId | ✅ |
| userId | 1/1 documentos (100.0%) | string | ✅ |
| accessToken | 1/1 documentos (100.0%) | string | ✅ |
| refreshToken | 1/1 documentos (100.0%) | string | ✅ |
| publicKey | 1/1 documentos (100.0%) | string | ✅ |
| expiresIn | 1/1 documentos (100.0%) | number | ✅ |
| internalId | 1/1 documentos (100.0%) | string | ✅ |
| active | 1/1 documentos (100.0%) | boolean | ✅ |
| connectedAt | 1/1 documentos (100.0%) | Date | ✅ |
| updatedAt | 1/1 documentos (100.0%) | Date | ✅ |
| createdAt | 1/1 documentos (100.0%) | Date | ✅ |
| __v | 1/1 documentos (100.0%) | number | ✅ |

### api_request_logs

- **Documentos:** 228
- **Índices:** 10

#### Índices

| Nombre | Campos | Único | Sparse |
|--------|--------|-------|--------|
| _id_ | {"_id":1} | ❌ | ❌ |
| empresaId_1 | {"empresaId":1} | ❌ | ❌ |
| apiConfigId_1 | {"apiConfigId":1} | ❌ | ❌ |
| endpointId_1 | {"endpointId":1} | ❌ | ❌ |
| estado_1 | {"estado":1} | ❌ | ❌ |
| empresaId_1_createdAt_-1 | {"empresaId":1,"createdAt":-1} | ❌ | ❌ |
| apiConfigId_1_createdAt_-1 | {"apiConfigId":1,"createdAt":-1} | ❌ | ❌ |
| apiConfigId_1_endpointId_1_createdAt_-1 | {"apiConfigId":1,"endpointId":1,"createdAt":-1} | ❌ | ❌ |
| estado_1_createdAt_-1 | {"estado":1,"createdAt":-1} | ❌ | ❌ |
| createdAt_1 | {"createdAt":1} | ❌ | ❌ |

#### Esquema Inferido

| Campo | Aparece en | Tipos | Requerido |
|-------|------------|-------|----------|
| _id | 100/100 documentos (100.0%) | ObjectId | ✅ |
| empresaId | 100/100 documentos (100.0%) | ObjectId | ✅ |
| apiConfigId | 100/100 documentos (100.0%) | ObjectId | ✅ |
| endpointId | 100/100 documentos (100.0%) | string | ✅ |
| request | 100/100 documentos (100.0%) | Object | ✅ |
| request.metodo | 100/100 documentos (100.0%) | string | ✅ |
| request.url | 100/100 documentos (100.0%) | string | ✅ |
| request.headers | 100/100 documentos (100.0%) | Object | ✅ |
| request.headers.User-Agent | 100/100 documentos (100.0%) | string | ✅ |
| request.headers.Authorization | 100/100 documentos (100.0%) | string | ✅ |
| request.timestamp | 100/100 documentos (100.0%) | Date | ✅ |
| error | 28/100 documentos (28.0%) | Object | ❌ |
| error.mensaje | 28/100 documentos (28.0%) | string | ❌ |
| error.stack | 28/100 documentos (28.0%) | string | ❌ |
| estado | 100/100 documentos (100.0%) | string | ✅ |
| createdAt | 100/100 documentos (100.0%) | Date | ✅ |
| __v | 100/100 documentos (100.0%) | number | ✅ |
| response | 72/100 documentos (72.0%) | Object | ❌ |
| response.statusCode | 72/100 documentos (72.0%) | number | ❌ |
| response.headers | 72/100 documentos (72.0%) | Object | ❌ |
| response.headers.access-control-allow-credentials | 72/100 documentos (72.0%) | string | ❌ |
| response.headers.content-length | 44/100 documentos (44.0%) | string | ❌ |
| response.headers.content-security-policy | 72/100 documentos (72.0%) | string | ❌ |
| response.headers.content-type | 72/100 documentos (72.0%) | string | ❌ |
| response.headers.cross-origin-opener-policy | 72/100 documentos (72.0%) | string | ❌ |
| response.headers.cross-origin-resource-policy | 72/100 documentos (72.0%) | string | ❌ |
| response.headers.date | 72/100 documentos (72.0%) | string | ❌ |
| response.headers.etag | 72/100 documentos (72.0%) | string | ❌ |
| response.headers.ngrok-agent-ips | 6/100 documentos (6.0%) | string | ❌ |
| response.headers.origin-agent-cluster | 72/100 documentos (72.0%) | string | ❌ |
| response.headers.referrer-policy | 72/100 documentos (72.0%) | string | ❌ |
| response.headers.strict-transport-security | 72/100 documentos (72.0%) | string | ❌ |
| response.headers.vary | 72/100 documentos (72.0%) | string | ❌ |
| response.headers.x-content-type-options | 72/100 documentos (72.0%) | string | ❌ |
| response.headers.x-dns-prefetch-control | 72/100 documentos (72.0%) | string | ❌ |
| response.headers.x-download-options | 72/100 documentos (72.0%) | string | ❌ |
| response.headers.x-frame-options | 72/100 documentos (72.0%) | string | ❌ |
| response.headers.x-permitted-cross-domain-policies | 72/100 documentos (72.0%) | string | ❌ |
| response.headers.x-xss-protection | 72/100 documentos (72.0%) | string | ❌ |
| response.body | 72/100 documentos (72.0%) | Object | ❌ |
| response.body.success | 72/100 documentos (72.0%) | boolean | ❌ |
| response.body.deportes | 38/100 documentos (38.0%) | Array | ❌ |
| response.body.deportes[0].id | 38/100 documentos (38.0%) | string | ❌ |
| response.body.deportes[0].nombre | 38/100 documentos (38.0%) | string | ❌ |
| response.body.deportes[0].icono | 38/100 documentos (38.0%) | string | ❌ |
| response.tiempoRespuesta | 72/100 documentos (72.0%) | number | ❌ |
| response.timestamp | 72/100 documentos (72.0%) | Date | ❌ |
| request.headers.Content-Type | 20/100 documentos (20.0%) | string | ❌ |
| response.headers.transfer-encoding | 28/100 documentos (28.0%) | string | ❌ |
| response.body.precios | 6/100 documentos (6.0%) | Array | ❌ |
| response.body.precios[0].cancha_id | 6/100 documentos (6.0%) | string | ❌ |
| response.body.precios[0].cancha_nombre | 6/100 documentos (6.0%) | string | ❌ |
| response.body.precios[0].deporte | 6/100 documentos (6.0%) | string | ❌ |
| response.body.precios[0].precios | 6/100 documentos (6.0%) | Object | ❌ |
| response.body.precios[0].precios.60 | 6/100 documentos (6.0%) | string | ❌ |
| response.body.precios[0].precios.90 | 6/100 documentos (6.0%) | number | ❌ |
| response.body.precios[0].precios.120 | 6/100 documentos (6.0%) | number | ❌ |
| response.body.precios[0].seña_porcentaje | 6/100 documentos (6.0%) | number | ❌ |
| response.body.seña_minima | 6/100 documentos (6.0%) | number | ❌ |
| request.body | 11/100 documentos (11.0%) | Object | ❌ |
| request.body.cancha_id | 10/100 documentos (10.0%) | string | ❌ |
| request.body.fecha | 10/100 documentos (10.0%) | string | ❌ |
| request.body.hora_inicio | 10/100 documentos (10.0%) | string | ❌ |
| request.body.duracion | 10/100 documentos (10.0%) | number | ❌ |
| request.body.cliente | 10/100 documentos (10.0%) | Object | ❌ |
| request.body.cliente.nombre | 10/100 documentos (10.0%) | string | ❌ |
| request.body.cliente.telefono | 10/100 documentos (10.0%) | string | ❌ |
| request.body.cliente.email | 5/100 documentos (5.0%) | string | ❌ |
| request.body.origen | 10/100 documentos (10.0%) | string | ❌ |
| response.body.reserva_id | 2/100 documentos (2.0%) | string | ❌ |
| response.body.estado | 2/100 documentos (2.0%) | string | ❌ |
| response.body.expira_en | 2/100 documentos (2.0%) | number | ❌ |
| response.body.detalle | 2/100 documentos (2.0%) | Object | ❌ |
| response.body.detalle.cancha | 2/100 documentos (2.0%) | string | ❌ |
| response.body.detalle.fecha | 2/100 documentos (2.0%) | string | ❌ |
| response.body.detalle.hora_inicio | 2/100 documentos (2.0%) | string | ❌ |
| response.body.detalle.hora_fin | 2/100 documentos (2.0%) | string | ❌ |
| response.body.detalle.duracion | 2/100 documentos (2.0%) | number | ❌ |
| response.body.detalle.precio_total | 2/100 documentos (2.0%) | number | ❌ |
| response.body.detalle.seña_requerida | 2/100 documentos (2.0%) | number | ❌ |
| response.headers.ratelimit-limit | 66/100 documentos (66.0%) | string | ❌ |
| response.headers.ratelimit-policy | 66/100 documentos (66.0%) | string | ❌ |
| response.headers.ratelimit-remaining | 66/100 documentos (66.0%) | string | ❌ |
| response.headers.ratelimit-reset | 66/100 documentos (66.0%) | string | ❌ |
| response.headers.server | 66/100 documentos (66.0%) | string | ❌ |
| response.headers.x-railway-edge | 66/100 documentos (66.0%) | string | ❌ |
| response.headers.x-railway-request-id | 66/100 documentos (66.0%) | string | ❌ |
| contexto | 30/100 documentos (30.0%) | Object | ❌ |
| contexto.metadata | 30/100 documentos (30.0%) | Object | ❌ |
| contexto.metadata.contactoId | 30/100 documentos (30.0%) | string | ❌ |
| request.parametros | 34/100 documentos (34.0%) | Object | ❌ |
| request.parametros.fecha | 33/100 documentos (33.0%) | string | ❌ |
| request.parametros.deporte | 33/100 documentos (33.0%) | string | ❌ |
| request.parametros.hora | 27/100 documentos (27.0%) | string | ❌ |
| request.parametros.duracion | 33/100 documentos (33.0%) | string, number | ❌ |
| response.body.fecha | 26/100 documentos (26.0%) | string | ❌ |
| response.body.deporte | 26/100 documentos (26.0%) | string | ❌ |
| response.body.canchas_disponibles | 26/100 documentos (26.0%) | Array | ❌ |
| response.body.alternativas | 4/100 documentos (4.0%) | Array | ❌ |
| response.body.canchas_disponibles[0].id | 22/100 documentos (22.0%) | string | ❌ |
| response.body.canchas_disponibles[0].nombre | 22/100 documentos (22.0%) | string | ❌ |
| response.body.canchas_disponibles[0].tipo | 22/100 documentos (22.0%) | string | ❌ |
| response.body.canchas_disponibles[0].horarios_disponibles | 22/100 documentos (22.0%) | Array | ❌ |
| response.body.canchas_disponibles[0].horarios_disponibles[0].hora | 22/100 documentos (22.0%) | string | ❌ |
| response.body.canchas_disponibles[0].horarios_disponibles[0].duraciones | 22/100 documentos (22.0%) | Array | ❌ |
| response.body.canchas_disponibles[0].precio_hora | 22/100 documentos (22.0%) | string | ❌ |
| response.body.canchas_disponibles[0].precio_hora_y_media | 22/100 documentos (22.0%) | number | ❌ |
| response.body.canchas_disponibles[0].precio_dos_horas | 22/100 documentos (22.0%) | number | ❌ |
| request.parametros.turno_id | 6/100 documentos (6.0%) | Object, string | ❌ |
| request.parametros.turno_id.success | 2/100 documentos (2.0%) | boolean | ❌ |
| request.parametros.turno_id.fecha | 2/100 documentos (2.0%) | string | ❌ |
| request.parametros.turno_id.deporte | 2/100 documentos (2.0%) | string | ❌ |
| request.parametros.turno_id.canchas_disponibles | 2/100 documentos (2.0%) | Array | ❌ |
| request.parametros.turno_id.canchas_disponibles[0].id | 2/100 documentos (2.0%) | string | ❌ |
| request.parametros.turno_id.canchas_disponibles[0].nombre | 2/100 documentos (2.0%) | string | ❌ |
| request.parametros.turno_id.canchas_disponibles[0].tipo | 2/100 documentos (2.0%) | string | ❌ |
| request.parametros.turno_id.canchas_disponibles[0].horarios_disponibles | 2/100 documentos (2.0%) | Array | ❌ |
| request.parametros.turno_id.canchas_disponibles[0].horarios_disponibles[0].hora | 2/100 documentos (2.0%) | string | ❌ |
| request.parametros.turno_id.canchas_disponibles[0].horarios_disponibles[0].duraciones | 2/100 documentos (2.0%) | Array | ❌ |
| request.parametros.turno_id.canchas_disponibles[0].precio_hora | 2/100 documentos (2.0%) | string | ❌ |
| request.parametros.turno_id.canchas_disponibles[0].precio_hora_y_media | 2/100 documentos (2.0%) | number | ❌ |
| request.parametros.turno_id.canchas_disponibles[0].precio_dos_horas | 2/100 documentos (2.0%) | number | ❌ |
| request.parametros.hora_inicio | 6/100 documentos (6.0%) | string | ❌ |
| request.parametros.cliente.nombre | 6/100 documentos (6.0%) | string | ❌ |
| request.parametros.cliente.telefono | 6/100 documentos (6.0%) | string | ❌ |
| request.parametros.origen | 2/100 documentos (2.0%) | string | ❌ |
| request.body.title | 1/100 documentos (1.0%) | string | ❌ |
| request.body.description | 1/100 documentos (1.0%) | string | ❌ |
| request.body.unit_price | 1/100 documentos (1.0%) | number | ❌ |
| request.body.quantity | 1/100 documentos (1.0%) | number | ❌ |
| request.body.metadata | 1/100 documentos (1.0%) | Object | ❌ |
| request.body.metadata.cancha_id | 1/100 documentos (1.0%) | string | ❌ |
| request.body.metadata.fecha | 1/100 documentos (1.0%) | string | ❌ |
| request.body.metadata.hora_inicio | 1/100 documentos (1.0%) | string | ❌ |
| request.body.metadata.duracion | 1/100 documentos (1.0%) | number | ❌ |
| request.body.metadata.deporte | 1/100 documentos (1.0%) | string | ❌ |
| request.body.metadata.cliente_nombre | 1/100 documentos (1.0%) | string | ❌ |
| request.body.metadata.cliente_telefono | 1/100 documentos (1.0%) | string | ❌ |
| request.body.metadata.precio_total | 1/100 documentos (1.0%) | number | ❌ |
| request.body.metadata.seña | 1/100 documentos (1.0%) | number | ❌ |
| request.body.metadata.origen | 1/100 documentos (1.0%) | string | ❌ |
| request.parametros.reservaId | 1/100 documentos (1.0%) | string | ❌ |
| request.parametros.monto | 1/100 documentos (1.0%) | string | ❌ |

### contactos_empresa

- **Documentos:** 149
- **Índices:** 10

#### Índices

| Nombre | Campos | Único | Sparse |
|--------|--------|-------|--------|
| _id_ | {"_id":1} | ❌ | ❌ |
| empresaId_1 | {"empresaId":1} | ❌ | ❌ |
| telefono_1 | {"telefono":1} | ❌ | ❌ |
| empresaId_1_email_1 | {"empresaId":1,"email":1} | ❌ | ❌ |
| empresaId_1_activo_1 | {"empresaId":1,"activo":1} | ❌ | ❌ |
| empresaId_1_sector_1 | {"empresaId":1,"sector":1} | ❌ | ❌ |
| metricas.ultimaInteraccion_1 | {"metricas.ultimaInteraccion":1} | ❌ | ❌ |
| empresaId_1_agenteAsignado_1 | {"empresaId":1,"agenteAsignado":1} | ❌ | ❌ |
| empresaId_1_telefono_1 | {"empresaId":1,"telefono":1} | ❌ | ❌ |
| empresaId_1_agentesAsignados_1 | {"empresaId":1,"agentesAsignados":1} | ❌ | ❌ |

#### Esquema Inferido

| Campo | Aparece en | Tipos | Requerido |
|-------|------------|-------|----------|
| _id | 100/100 documentos (100.0%) | ObjectId | ✅ |
| empresaId | 100/100 documentos (100.0%) | string | ✅ |
| telefono | 100/100 documentos (100.0%) | string | ✅ |
| nombre | 100/100 documentos (100.0%) | string | ✅ |
| apellido | 100/100 documentos (100.0%) | string | ✅ |
| profileName | 55/100 documentos (55.0%) | string | ❌ |
| origen | 100/100 documentos (100.0%) | string | ✅ |
| preferencias | 100/100 documentos (100.0%) | Object | ✅ |
| preferencias.aceptaWhatsApp | 100/100 documentos (100.0%) | boolean | ✅ |
| preferencias.aceptaSMS | 100/100 documentos (100.0%) | boolean | ✅ |
| preferencias.aceptaEmail | 100/100 documentos (100.0%) | boolean | ✅ |
| preferencias.recordatorioTurnos | 100/100 documentos (100.0%) | boolean | ✅ |
| preferencias.diasAnticipacionRecordatorio | 100/100 documentos (100.0%) | number | ✅ |
| preferencias.horaRecordatorio | 100/100 documentos (100.0%) | string | ✅ |
| preferencias.notificacionesPromocion | 100/100 documentos (100.0%) | boolean | ✅ |
| preferencias.notificacionesDisponibilidad | 100/100 documentos (100.0%) | boolean | ✅ |
| preferencias._id | 100/100 documentos (100.0%) | ObjectId | ✅ |
| conversaciones | 100/100 documentos (100.0%) | Object | ✅ |
| conversaciones.historial | 97/100 documentos (97.0%) | Array | ❌ |
| conversaciones.ultimaConversacion | 100/100 documentos (100.0%) | Date | ✅ |
| conversaciones.saludado | 100/100 documentos (100.0%) | boolean | ✅ |
| conversaciones.despedido | 100/100 documentos (100.0%) | boolean | ✅ |
| conversaciones.mensaje_ids | 97/100 documentos (97.0%) | Array | ❌ |
| conversaciones.ultimo_status | 100/100 documentos (100.0%) | string | ✅ |
| conversaciones.contactoInformado | 100/100 documentos (100.0%) | boolean | ✅ |
| conversaciones._id | 100/100 documentos (100.0%) | ObjectId | ✅ |
| metricas | 100/100 documentos (100.0%) | Object | ✅ |
| metricas.interacciones | 100/100 documentos (100.0%) | number | ✅ |
| metricas.mensajesEnviados | 100/100 documentos (100.0%) | number | ✅ |
| metricas.mensajesRecibidos | 100/100 documentos (100.0%) | number | ✅ |
| metricas.mediaRecibidos | 100/100 documentos (100.0%) | number | ✅ |
| metricas.tokensConsumidos | 100/100 documentos (100.0%) | number | ✅ |
| metricas.turnosRealizados | 100/100 documentos (100.0%) | number | ✅ |
| metricas.turnosCancelados | 100/100 documentos (100.0%) | number | ✅ |
| metricas.ultimaInteraccion | 100/100 documentos (100.0%) | Date | ✅ |
| metricas._id | 100/100 documentos (100.0%) | ObjectId | ✅ |
| activo | 100/100 documentos (100.0%) | boolean | ✅ |
| creadoEn | 100/100 documentos (100.0%) | Date | ✅ |
| actualizadoEn | 100/100 documentos (100.0%) | Date | ✅ |
| __v | 100/100 documentos (100.0%) | number | ✅ |
| notas | 77/100 documentos (77.0%) | string | ❌ |
| chatbotPausado | 43/100 documentos (43.0%) | boolean | ❌ |
| workflowState | 1/100 documentos (1.0%) | Object | ❌ |
| workflowState.workflowId | 1/100 documentos (1.0%) | string | ❌ |
| workflowState.apiId | 1/100 documentos (1.0%) | string | ❌ |
| workflowState.pasoActual | 1/100 documentos (1.0%) | number | ❌ |
| workflowState.datosRecopilados | 1/100 documentos (1.0%) | Object | ❌ |
| workflowState.datosRecopilados.sucursal_id | 1/100 documentos (1.0%) | string | ❌ |
| workflowState.datosRecopilados.sucursal_id_nombre | 1/100 documentos (1.0%) | string | ❌ |
| workflowState.datosRecopilados.categoria_id | 1/100 documentos (1.0%) | string | ❌ |
| workflowState.datosRecopilados.nombre_producto | 1/100 documentos (1.0%) | string | ❌ |
| workflowState.datosEjecutados | 1/100 documentos (1.0%) | Object | ❌ |
| workflowState.datosEjecutados.55a183e9f3532e0c9ca7eaae7b429598 | 1/100 documentos (1.0%) | Object | ❌ |
| workflowState.datosEjecutados.55a183e9f3532e0c9ca7eaae7b429598.success | 1/100 documentos (1.0%) | boolean | ❌ |
| workflowState.datosEjecutados.55a183e9f3532e0c9ca7eaae7b429598.data | 1/100 documentos (1.0%) | Array | ❌ |
| workflowState.datosEjecutados.55a183e9f3532e0c9ca7eaae7b429598.data[0].id | 1/100 documentos (1.0%) | string | ❌ |
| workflowState.datosEjecutados.55a183e9f3532e0c9ca7eaae7b429598.data[0].name | 1/100 documentos (1.0%) | string | ❌ |
| workflowState.datosEjecutados.55a183e9f3532e0c9ca7eaae7b429598.data[0].code | 1/100 documentos (1.0%) | string | ❌ |
| workflowState.datosEjecutados.55a183e9f3532e0c9ca7eaae7b429598.data[0].address | 1/100 documentos (1.0%) | null | ❌ |
| workflowState.datosEjecutados.55a183e9f3532e0c9ca7eaae7b429598.data[0].city | 1/100 documentos (1.0%) | null | ❌ |
| workflowState.datosEjecutados.55a183e9f3532e0c9ca7eaae7b429598.data[0].phone | 1/100 documentos (1.0%) | null | ❌ |
| workflowState.datosEjecutados.55a183e9f3532e0c9ca7eaae7b429598.data[0].email | 1/100 documentos (1.0%) | null | ❌ |
| workflowState.datosEjecutados.55a183e9f3532e0c9ca7eaae7b429598.data[0].is_active | 1/100 documentos (1.0%) | string | ❌ |
| workflowState.datosEjecutados.55a183e9f3532e0c9ca7eaae7b429598.count | 1/100 documentos (1.0%) | number | ❌ |
| workflowState.datosEjecutados.62e711bed285b8634e525238a649bc91 | 1/100 documentos (1.0%) | Object | ❌ |
| workflowState.datosEjecutados.62e711bed285b8634e525238a649bc91.success | 1/100 documentos (1.0%) | boolean | ❌ |
| workflowState.datosEjecutados.62e711bed285b8634e525238a649bc91.data | 1/100 documentos (1.0%) | Array | ❌ |
| workflowState.datosEjecutados.62e711bed285b8634e525238a649bc91.data[0].id | 1/100 documentos (1.0%) | number | ❌ |
| workflowState.datosEjecutados.62e711bed285b8634e525238a649bc91.data[0].name | 1/100 documentos (1.0%) | string | ❌ |
| workflowState.datosEjecutados.62e711bed285b8634e525238a649bc91.data[0].slug | 1/100 documentos (1.0%) | string | ❌ |
| workflowState.datosEjecutados.62e711bed285b8634e525238a649bc91.data[0].count | 1/100 documentos (1.0%) | number | ❌ |
| workflowState.datosEjecutados.62e711bed285b8634e525238a649bc91.data[0].parent | 1/100 documentos (1.0%) | number | ❌ |
| workflowState.datosEjecutados.62e711bed285b8634e525238a649bc91.count | 1/100 documentos (1.0%) | number | ❌ |
| workflowState.intentosFallidos | 1/100 documentos (1.0%) | number | ❌ |
| workflowState.iniciadoEn | 1/100 documentos (1.0%) | Date | ❌ |
| workflowState.ultimaActividad | 1/100 documentos (1.0%) | Date | ❌ |
| workflowState.esperandoRepeticion | 1/100 documentos (1.0%) | boolean | ❌ |
| workflowState._id | 1/100 documentos (1.0%) | ObjectId | ❌ |
| ultimoPhoneNumberId | 2/100 documentos (2.0%) | string | ❌ |
| direccion | 45/100 documentos (45.0%) | string | ❌ |
| fechaNacimiento | 44/100 documentos (44.0%) | Date | ❌ |
| dni | 45/100 documentos (45.0%) | string | ❌ |
| agenteAsignado | 40/100 documentos (40.0%) | ObjectId | ❌ |
| email | 1/100 documentos (1.0%) | string | ❌ |
| ciudad | 44/100 documentos (44.0%) | string | ❌ |
| provincia | 44/100 documentos (44.0%) | string | ❌ |
| codigoPostal | 44/100 documentos (44.0%) | string | ❌ |
| chatbotPausadoEn | 1/100 documentos (1.0%) | Date | ❌ |
| chatbotPausadoPor | 1/100 documentos (1.0%) | string | ❌ |

### afipsellers

- **Documentos:** 2
- **Índices:** 4

#### Índices

| Nombre | Campos | Único | Sparse |
|--------|--------|-------|--------|
| _id_ | {"_id":1} | ❌ | ❌ |
| empresaId_1 | {"empresaId":1} | ❌ | ❌ |
| cuit_1 | {"cuit":1} | ❌ | ❌ |
| empresaId_1_activo_1 | {"empresaId":1,"activo":1} | ❌ | ❌ |

#### Esquema Inferido

| Campo | Aparece en | Tipos | Requerido |
|-------|------------|-------|----------|
| _id | 2/2 documentos (100.0%) | ObjectId | ✅ |
| empresaId | 2/2 documentos (100.0%) | string | ✅ |
| cuit | 2/2 documentos (100.0%) | string | ✅ |
| razonSocial | 2/2 documentos (100.0%) | string | ✅ |
| puntoVenta | 2/2 documentos (100.0%) | number | ✅ |
| certificado | 2/2 documentos (100.0%) | string | ✅ |
| clavePrivada | 2/2 documentos (100.0%) | string | ✅ |
| environment | 2/2 documentos (100.0%) | string | ✅ |
| activo | 2/2 documentos (100.0%) | boolean | ✅ |
| tipoComprobanteDefault | 2/2 documentos (100.0%) | number | ✅ |
| conceptoDefault | 2/2 documentos (100.0%) | number | ✅ |
| totalFacturas | 2/2 documentos (100.0%) | number | ✅ |
| totalNotasCredito | 2/2 documentos (100.0%) | number | ✅ |
| totalNotasDebito | 2/2 documentos (100.0%) | number | ✅ |
| createdAt | 2/2 documentos (100.0%) | Date | ✅ |
| updatedAt | 2/2 documentos (100.0%) | Date | ✅ |
| __v | 2/2 documentos (100.0%) | number | ✅ |
| sign | 1/2 documentos (50.0%) | string | ❌ |
| token | 1/2 documentos (50.0%) | string | ❌ |
| tokenExpiration | 1/2 documentos (50.0%) | Date | ❌ |

### webhook_configurations

- **Documentos:** 0
- **Índices:** 5

#### Índices

| Nombre | Campos | Único | Sparse |
|--------|--------|-------|--------|
| _id_ | {"_id":1} | ❌ | ❌ |
| empresaId_1 | {"empresaId":1} | ❌ | ❌ |
| webhookUrl_1 | {"webhookUrl":1} | ✅ | ❌ |
| webhookId_1 | {"webhookId":1} | ✅ | ❌ |
| empresaId_1_estado_1 | {"empresaId":1,"estado":1} | ❌ | ❌ |

#### Esquema Inferido

| Campo | Aparece en | Tipos | Requerido |
|-------|------------|-------|----------|

### clientes

- **Documentos:** 0
- **Índices:** 6

#### Índices

| Nombre | Campos | Único | Sparse |
|--------|--------|-------|--------|
| _id_ | {"_id":1} | ❌ | ❌ |
| empresaId_1 | {"empresaId":1} | ❌ | ❌ |
| chatbotUserId_1 | {"chatbotUserId":1} | ❌ | ❌ |
| empresaId_1_telefono_1 | {"empresaId":1,"telefono":1} | ❌ | ❌ |
| empresaId_1_email_1 | {"empresaId":1,"email":1} | ❌ | ❌ |
| empresaId_1_activo_1 | {"empresaId":1,"activo":1} | ❌ | ❌ |

#### Esquema Inferido

| Campo | Aparece en | Tipos | Requerido |
|-------|------------|-------|----------|

### flow_logs

- **Documentos:** 77
- **Índices:** 8

#### Índices

| Nombre | Campos | Único | Sparse |
|--------|--------|-------|--------|
| _id_ | {"_id":1} | ❌ | ❌ |
| timestamp_1 | {"timestamp":1} | ❌ | ❌ |
| telefono_1 | {"telefono":1} | ❌ | ❌ |
| empresaId_1 | {"empresaId":1} | ❌ | ❌ |
| flujo_1 | {"flujo":1} | ❌ | ❌ |
| telefono_1_timestamp_-1 | {"telefono":1,"timestamp":-1} | ❌ | ❌ |
| empresaId_1_timestamp_-1 | {"empresaId":1,"timestamp":-1} | ❌ | ❌ |
| flujo_1_timestamp_-1 | {"flujo":1,"timestamp":-1} | ❌ | ❌ |

#### Esquema Inferido

| Campo | Aparece en | Tipos | Requerido |
|-------|------------|-------|----------|
| _id | 77/77 documentos (100.0%) | ObjectId | ✅ |
| telefono | 77/77 documentos (100.0%) | string | ✅ |
| empresaId | 77/77 documentos (100.0%) | string | ✅ |
| flujo | 77/77 documentos (100.0%) | string | ✅ |
| estado | 77/77 documentos (100.0%) | string | ✅ |
| accion | 77/77 documentos (100.0%) | string | ✅ |
| timestamp | 77/77 documentos (100.0%) | Date | ✅ |
| __v | 77/77 documentos (100.0%) | number | ✅ |
| data | 44/77 documentos (57.1%) | Object | ❌ |
| data.fecha | 20/77 documentos (26.0%) | Date | ❌ |
| data.fechaTexto | 20/77 documentos (26.0%) | string | ❌ |
| data.horaInicio | 10/77 documentos (13.0%) | string | ❌ |
| data.duracion | 8/77 documentos (10.4%) | number | ❌ |
| data.canchasDisponibles | 8/77 documentos (10.4%) | Array | ❌ |
| data.canchasDisponibles[0].id | 8/77 documentos (10.4%) | string | ❌ |
| data.canchasDisponibles[0].nombre | 8/77 documentos (10.4%) | string | ❌ |
| data.canchaId | 6/77 documentos (7.8%) | string | ❌ |
| data.canchaNombre | 6/77 documentos (7.8%) | string | ❌ |
| data.nombreCliente | 4/77 documentos (5.2%) | string | ❌ |
| data.telefonoCliente | 2/77 documentos (2.6%) | string | ❌ |
| data.origen | 24/77 documentos (31.2%) | string | ❌ |
| data.destino | 18/77 documentos (23.4%) | string | ❌ |
| data.pasajeros | 12/77 documentos (15.6%) | number | ❌ |
| data.usaApiExterna | 6/77 documentos (7.8%) | boolean | ❌ |

### afipinvoices

- **Documentos:** 5
- **Índices:** 8

#### Índices

| Nombre | Campos | Único | Sparse |
|--------|--------|-------|--------|
| _id_ | {"_id":1} | ❌ | ❌ |
| empresaId_1 | {"empresaId":1} | ❌ | ❌ |
| sellerId_1 | {"sellerId":1} | ❌ | ❌ |
| tipoComprobante_1 | {"tipoComprobante":1} | ❌ | ❌ |
| empresaId_1_fecha_-1 | {"empresaId":1,"fecha":-1} | ❌ | ❌ |
| empresaId_1_tipoComprobante_1_puntoVenta_1_numero_1 | {"empresaId":1,"tipoComprobante":1,"puntoVenta":1,"numero":1} | ❌ | ❌ |
| sellerId_1_createdAt_-1 | {"sellerId":1,"createdAt":-1} | ❌ | ❌ |
| cae_1 | {"cae":1} | ❌ | ❌ |

#### Esquema Inferido

| Campo | Aparece en | Tipos | Requerido |
|-------|------------|-------|----------|
| _id | 5/5 documentos (100.0%) | ObjectId | ✅ |
| empresaId | 5/5 documentos (100.0%) | string | ✅ |
| sellerId | 5/5 documentos (100.0%) | string | ✅ |
| tipoComprobante | 5/5 documentos (100.0%) | number | ✅ |
| puntoVenta | 5/5 documentos (100.0%) | number | ✅ |
| numero | 5/5 documentos (100.0%) | number | ✅ |
| fecha | 5/5 documentos (100.0%) | string | ✅ |
| clienteTipoDoc | 5/5 documentos (100.0%) | number | ✅ |
| clienteNroDoc | 5/5 documentos (100.0%) | number | ✅ |
| concepto | 5/5 documentos (100.0%) | number | ✅ |
| importeNeto | 5/5 documentos (100.0%) | number | ✅ |
| importeIVA | 5/5 documentos (100.0%) | number | ✅ |
| importeExento | 5/5 documentos (100.0%) | number | ✅ |
| importeTotal | 5/5 documentos (100.0%) | number | ✅ |
| iva | 5/5 documentos (100.0%) | Array | ✅ |
| cae | 5/5 documentos (100.0%) | string | ✅ |
| caeVencimiento | 5/5 documentos (100.0%) | string | ✅ |
| resultado | 5/5 documentos (100.0%) | string | ✅ |
| rawResponse | 5/5 documentos (100.0%) | Object | ✅ |
| rawResponse.FeCabResp | 5/5 documentos (100.0%) | Object | ✅ |
| rawResponse.FeCabResp.Cuit | 5/5 documentos (100.0%) | number | ✅ |
| rawResponse.FeCabResp.PtoVta | 5/5 documentos (100.0%) | number | ✅ |
| rawResponse.FeCabResp.CbteTipo | 5/5 documentos (100.0%) | number | ✅ |
| rawResponse.FeCabResp.FchProceso | 5/5 documentos (100.0%) | string | ✅ |
| rawResponse.FeCabResp.CantReg | 5/5 documentos (100.0%) | number | ✅ |
| rawResponse.FeCabResp.Resultado | 5/5 documentos (100.0%) | string | ✅ |
| rawResponse.FeCabResp.Reproceso | 5/5 documentos (100.0%) | string | ✅ |
| rawResponse.FeDetResp | 5/5 documentos (100.0%) | Object | ✅ |
| rawResponse.FeDetResp.FECAEDetResponse | 5/5 documentos (100.0%) | Array | ✅ |
| rawResponse.FeDetResp.FECAEDetResponse[0].Concepto | 5/5 documentos (100.0%) | number | ✅ |
| rawResponse.FeDetResp.FECAEDetResponse[0].DocTipo | 5/5 documentos (100.0%) | number | ✅ |
| rawResponse.FeDetResp.FECAEDetResponse[0].DocNro | 5/5 documentos (100.0%) | number | ✅ |
| rawResponse.FeDetResp.FECAEDetResponse[0].CbteDesde | 5/5 documentos (100.0%) | number | ✅ |
| rawResponse.FeDetResp.FECAEDetResponse[0].CbteHasta | 5/5 documentos (100.0%) | number | ✅ |
| rawResponse.FeDetResp.FECAEDetResponse[0].CbteFch | 5/5 documentos (100.0%) | string | ✅ |
| rawResponse.FeDetResp.FECAEDetResponse[0].Resultado | 5/5 documentos (100.0%) | string | ✅ |
| rawResponse.FeDetResp.FECAEDetResponse[0].Observaciones | 5/5 documentos (100.0%) | Object | ✅ |
| rawResponse.FeDetResp.FECAEDetResponse[0].Observaciones.Obs | 5/5 documentos (100.0%) | Array | ✅ |
| rawResponse.FeDetResp.FECAEDetResponse[0].Observaciones.Obs[0].Code | 5/5 documentos (100.0%) | number | ✅ |
| rawResponse.FeDetResp.FECAEDetResponse[0].Observaciones.Obs[0].Msg | 5/5 documentos (100.0%) | string | ✅ |
| rawResponse.FeDetResp.FECAEDetResponse[0].CAE | 5/5 documentos (100.0%) | string | ✅ |
| rawResponse.FeDetResp.FECAEDetResponse[0].CAEFchVto | 5/5 documentos (100.0%) | string | ✅ |
| rawResponse.Events | 5/5 documentos (100.0%) | Object | ✅ |
| rawResponse.Events.Evt | 5/5 documentos (100.0%) | Array | ✅ |
| rawResponse.Events.Evt[0].Code | 5/5 documentos (100.0%) | number | ✅ |
| rawResponse.Events.Evt[0].Msg | 5/5 documentos (100.0%) | string | ✅ |
| environment | 5/5 documentos (100.0%) | string | ✅ |
| createdAt | 5/5 documentos (100.0%) | Date | ✅ |
| updatedAt | 5/5 documentos (100.0%) | Date | ✅ |
| __v | 5/5 documentos (100.0%) | number | ✅ |

### chatbots

- **Documentos:** 8
- **Índices:** 5

#### Índices

| Nombre | Campos | Único | Sparse |
|--------|--------|-------|--------|
| _id_ | {"_id":1} | ❌ | ❌ |
| empresaId_1 | {"empresaId":1} | ❌ | ❌ |
| empresaId_1_activo_1 | {"empresaId":1,"activo":1} | ❌ | ❌ |
| whatsapp.numeroTelefono_1 | {"whatsapp.numeroTelefono":1} | ❌ | ❌ |
| whatsapp.phoneNumberId_1 | {"whatsapp.phoneNumberId":1} | ✅ | ❌ |

#### Esquema Inferido

| Campo | Aparece en | Tipos | Requerido |
|-------|------------|-------|----------|
| _id | 8/8 documentos (100.0%) | ObjectId | ✅ |
| empresaId | 8/8 documentos (100.0%) | string | ✅ |
| nombre | 8/8 documentos (100.0%) | string | ✅ |
| descripcion | 6/8 documentos (75.0%) | string | ❌ |
| activo | 8/8 documentos (100.0%) | boolean | ✅ |
| whatsapp | 7/8 documentos (87.5%) | Object | ❌ |
| whatsapp.phoneNumberId | 7/8 documentos (87.5%) | string | ❌ |
| whatsapp.businessAccountId | 6/8 documentos (75.0%) | string | ❌ |
| whatsapp.accessToken | 6/8 documentos (75.0%) | string | ❌ |
| whatsapp.webhookVerifyToken | 5/8 documentos (62.5%) | string | ❌ |
| whatsapp.numeroTelefono | 5/8 documentos (62.5%) | string | ❌ |
| configuracion | 8/8 documentos (100.0%) | Object | ✅ |
| configuracion.modelo | 6/8 documentos (75.0%) | string | ❌ |
| configuracion.prompt | 5/8 documentos (62.5%) | string | ❌ |
| configuracion.temperatura | 6/8 documentos (75.0%) | number | ❌ |
| configuracion.maxTokens | 6/8 documentos (75.0%) | number | ❌ |
| configuracion.timeoutMinutos | 6/8 documentos (75.0%) | number | ❌ |
| configuracion.mensajeBienvenida | 5/8 documentos (62.5%) | string | ❌ |
| configuracion.mensajeDespedida | 5/8 documentos (62.5%) | string | ❌ |
| configuracion.mensajeError | 5/8 documentos (62.5%) | string | ❌ |
| configuracion.mensajeFueraHorario | 5/8 documentos (62.5%) | string | ❌ |
| configuracion.horariosAtencion | 5/8 documentos (62.5%) | Object | ❌ |
| configuracion.horariosAtencion.activo | 5/8 documentos (62.5%) | boolean | ❌ |
| configuracion.horariosAtencion.inicio | 5/8 documentos (62.5%) | string | ❌ |
| configuracion.horariosAtencion.fin | 5/8 documentos (62.5%) | string | ❌ |
| configuracion.horariosAtencion.diasSemana | 5/8 documentos (62.5%) | Array | ❌ |
| configuracion.horariosAtencion.zonaHoraria | 5/8 documentos (62.5%) | string | ❌ |
| derivacion | 5/8 documentos (62.5%) | Object | ❌ |
| derivacion.habilitado | 5/8 documentos (62.5%) | boolean | ❌ |
| derivacion.numerosDerivacion | 5/8 documentos (62.5%) | Array | ❌ |
| derivacion.palabrasClave | 5/8 documentos (62.5%) | Array | ❌ |
| estadisticas | 5/8 documentos (62.5%) | Object | ❌ |
| estadisticas.conversacionesTotales | 5/8 documentos (62.5%) | number | ❌ |
| estadisticas.conversacionesActivas | 5/8 documentos (62.5%) | number | ❌ |
| estadisticas.mensajesEnviados | 5/8 documentos (62.5%) | number | ❌ |
| estadisticas.mensajesRecibidos | 5/8 documentos (62.5%) | number | ❌ |
| estadisticas.ultimaActividad | 5/8 documentos (62.5%) | Date | ❌ |
| createdAt | 8/8 documentos (100.0%) | Date | ✅ |
| updatedAt | 8/8 documentos (100.0%) | Date | ✅ |
| tipo | 2/8 documentos (25.0%) | string | ❌ |
| configuracion.systemPrompt | 1/8 documentos (12.5%) | string | ❌ |
| flujos | 1/8 documentos (12.5%) | Array | ❌ |
| modelo | 1/8 documentos (12.5%) | string | ❌ |
| temperatura | 1/8 documentos (12.5%) | number | ❌ |
| maxTokens | 1/8 documentos (12.5%) | number | ❌ |
| prompt | 1/8 documentos (12.5%) | string | ❌ |
| configuracion.usarWorkflows | 1/8 documentos (12.5%) | boolean | ❌ |
| configuracion.usarHistorial | 1/8 documentos (12.5%) | boolean | ❌ |
| mensajes | 1/8 documentos (12.5%) | Object | ❌ |
| mensajes.bienvenida | 1/8 documentos (12.5%) | string | ❌ |
| mensajes.despedida | 1/8 documentos (12.5%) | string | ❌ |
| mensajes.error | 1/8 documentos (12.5%) | string | ❌ |
| configuracion.usaWorkflows | 1/8 documentos (12.5%) | boolean | ❌ |
| configuracion.usaGPT | 1/8 documentos (12.5%) | boolean | ❌ |
| configuracion.prioridadWorkflows | 1/8 documentos (12.5%) | boolean | ❌ |

### mpsubscriptionplans

- **Documentos:** 0
- **Índices:** 3

#### Índices

| Nombre | Campos | Único | Sparse |
|--------|--------|-------|--------|
| _id_ | {"_id":1} | ❌ | ❌ |
| sellerId_1 | {"sellerId":1} | ❌ | ❌ |
| sellerId_1_active_1 | {"sellerId":1,"active":1} | ❌ | ❌ |

#### Esquema Inferido

| Campo | Aparece en | Tipos | Requerido |
|-------|------------|-------|----------|

### api_configurations

- **Documentos:** 6
- **Índices:** 6

#### Índices

| Nombre | Campos | Único | Sparse |
|--------|--------|-------|--------|
| _id_ | {"_id":1} | ❌ | ❌ |
| empresaId_1 | {"empresaId":1} | ❌ | ❌ |
| empresaId_1_estado_1 | {"empresaId":1,"estado":1} | ❌ | ❌ |
| empresaId_1_nombre_1 | {"empresaId":1,"nombre":1} | ❌ | ❌ |
| endpoints.id_1 | {"endpoints.id":1} | ❌ | ❌ |
| empresaId_1_chatbotIntegration.habilitado_1_chatbotIntegration.chatbotId_1 | {"empresaId":1,"chatbotIntegration.habilitado":1,"chatbotIntegration.chatbotId":1} | ❌ | ❌ |

#### Esquema Inferido

| Campo | Aparece en | Tipos | Requerido |
|-------|------------|-------|----------|
| _id | 6/6 documentos (100.0%) | ObjectId | ✅ |
| empresaId | 6/6 documentos (100.0%) | ObjectId | ✅ |
| nombre | 6/6 documentos (100.0%) | string | ✅ |
| descripcion | 6/6 documentos (100.0%) | string | ✅ |
| tipo | 6/6 documentos (100.0%) | string | ✅ |
| estado | 6/6 documentos (100.0%) | string | ✅ |
| baseUrl | 6/6 documentos (100.0%) | string | ✅ |
| version | 5/6 documentos (83.3%) | string | ❌ |
| autenticacion | 6/6 documentos (100.0%) | Object | ✅ |
| autenticacion.tipo | 6/6 documentos (100.0%) | string | ✅ |
| autenticacion.configuracion | 6/6 documentos (100.0%) | Object | ✅ |
| autenticacion.configuracion.token | 2/6 documentos (33.3%) | string | ❌ |
| autenticacion.configuracion.headerName | 5/6 documentos (83.3%) | string | ❌ |
| autenticacion.configuracion.scope | 6/6 documentos (100.0%) | Array | ✅ |
| endpoints | 6/6 documentos (100.0%) | Array | ✅ |
| endpoints[0].id | 6/6 documentos (100.0%) | string | ✅ |
| endpoints[0].nombre | 6/6 documentos (100.0%) | string | ✅ |
| endpoints[0].metodo | 6/6 documentos (100.0%) | string | ✅ |
| endpoints[0].path | 6/6 documentos (100.0%) | string | ✅ |
| endpoints[0].parametros | 6/6 documentos (100.0%) | Object | ✅ |
| endpoints[0].parametros.path | 2/6 documentos (33.3%) | Array | ❌ |
| endpoints[0].parametros.query | 2/6 documentos (33.3%) | Array | ❌ |
| endpoints[0].parametros.headers | 2/6 documentos (33.3%) | Object | ❌ |
| endpoints[0].activo | 2/6 documentos (33.3%) | boolean | ❌ |
| configuracion | 6/6 documentos (100.0%) | Object | ✅ |
| configuracion.timeout | 6/6 documentos (100.0%) | number | ✅ |
| configuracion.reintentos | 6/6 documentos (100.0%) | number | ✅ |
| configuracion.reintentarEn | 6/6 documentos (100.0%) | Array | ✅ |
| configuracion.webhooks | 6/6 documentos (100.0%) | Array | ✅ |
| estadisticas | 6/6 documentos (100.0%) | Object | ✅ |
| estadisticas.totalLlamadas | 6/6 documentos (100.0%) | number | ✅ |
| estadisticas.llamadasExitosas | 6/6 documentos (100.0%) | number | ✅ |
| estadisticas.llamadasFallidas | 6/6 documentos (100.0%) | number | ✅ |
| estadisticas.tiempoPromedioRespuesta | 6/6 documentos (100.0%) | number | ✅ |
| estadisticas.ultimaLlamada | 6/6 documentos (100.0%) | Date, null | ✅ |
| createdAt | 6/6 documentos (100.0%) | Date | ✅ |
| updatedAt | 6/6 documentos (100.0%) | Date | ✅ |
| __v | 3/6 documentos (50.0%) | number | ❌ |
| chatbotIntegration | 2/6 documentos (33.3%) | Object | ❌ |
| chatbotIntegration.habilitado | 2/6 documentos (33.3%) | boolean | ❌ |
| chatbotIntegration.chatbotId | 2/6 documentos (33.3%) | string | ❌ |
| chatbotIntegration.keywords | 2/6 documentos (33.3%) | Array | ❌ |
| chatbotIntegration.keywords[0].palabra | 2/6 documentos (33.3%) | string | ❌ |
| chatbotIntegration.keywords[0].endpointId | 2/6 documentos (33.3%) | string | ❌ |
| chatbotIntegration.keywords[0].descripcion | 2/6 documentos (33.3%) | string | ❌ |
| chatbotIntegration.keywords[0].extraerParametros | 2/6 documentos (33.3%) | boolean | ❌ |
| chatbotIntegration.keywords[0].parametrosConfig | 2/6 documentos (33.3%) | Array | ❌ |
| chatbotIntegration.keywords[0].respuestaTemplate | 2/6 documentos (33.3%) | string | ❌ |
| chatbotIntegration.keywords[0].ejemplos | 2/6 documentos (33.3%) | Array | ❌ |
| chatbotIntegration.mensajeAyuda | 2/6 documentos (33.3%) | string | ❌ |
| workflows | 6/6 documentos (100.0%) | Array | ✅ |
| workflows[0].workflowsSiguientes | 5/6 documentos (83.3%) | Object | ❌ |
| workflows[0].workflowsSiguientes.pregunta | 5/6 documentos (83.3%) | string | ❌ |
| workflows[0].workflowsSiguientes.workflows | 5/6 documentos (83.3%) | Array | ❌ |
| workflows[0].workflowsSiguientes.workflows[0].workflowId | 5/6 documentos (83.3%) | string | ❌ |
| workflows[0].workflowsSiguientes.workflows[0].opcion | 5/6 documentos (83.3%) | string | ❌ |
| workflows[0].repetirWorkflow | 1/6 documentos (16.7%) | Object | ❌ |
| workflows[0].repetirWorkflow.habilitado | 1/6 documentos (16.7%) | boolean | ❌ |
| workflows[0].repetirWorkflow.desdePaso | 1/6 documentos (16.7%) | number | ❌ |
| workflows[0].repetirWorkflow.variablesALimpiar | 1/6 documentos (16.7%) | Array | ❌ |
| workflows[0].repetirWorkflow.pregunta | 1/6 documentos (16.7%) | string | ❌ |
| workflows[0].repetirWorkflow.opcionRepetir | 1/6 documentos (16.7%) | string | ❌ |
| workflows[0].repetirWorkflow.opcionFinalizar | 1/6 documentos (16.7%) | string | ❌ |
| workflows[0].id | 5/6 documentos (83.3%) | string | ❌ |
| workflows[0].nombre | 6/6 documentos (100.0%) | string | ✅ |
| workflows[0].descripcion | 6/6 documentos (100.0%) | string | ✅ |
| workflows[0].activo | 6/6 documentos (100.0%) | boolean | ✅ |
| workflows[0].trigger | 6/6 documentos (100.0%) | Object | ✅ |
| workflows[0].trigger.tipo | 6/6 documentos (100.0%) | string | ✅ |
| workflows[0].trigger.keywords | 5/6 documentos (83.3%) | Array | ❌ |
| workflows[0].trigger.primeraRespuesta | 2/6 documentos (33.3%) | boolean | ❌ |
| workflows[0].prioridad | 3/6 documentos (50.0%) | number | ❌ |
| workflows[0].steps | 6/6 documentos (100.0%) | Array | ✅ |
| workflows[0].steps[0].orden | 6/6 documentos (100.0%) | number | ✅ |
| workflows[0].steps[0].tipo | 6/6 documentos (100.0%) | string | ✅ |
| workflows[0].steps[0].pregunta | 6/6 documentos (100.0%) | string | ✅ |
| workflows[0].steps[0].nombreVariable | 6/6 documentos (100.0%) | string | ✅ |
| workflows[0].steps[0].validacion | 6/6 documentos (100.0%) | Object | ✅ |
| workflows[0].steps[0].validacion.tipo | 6/6 documentos (100.0%) | string | ✅ |
| workflows[0].steps[0].validacion.opciones | 6/6 documentos (100.0%) | Array | ✅ |
| workflows[0].steps[0].validacion.mensajeError | 2/6 documentos (33.3%) | string | ❌ |
| workflows[0].steps[0].endpointResponseConfig | 1/6 documentos (16.7%) | Object | ❌ |
| workflows[0].steps[0].endpointResponseConfig.arrayPath | 1/6 documentos (16.7%) | string | ❌ |
| workflows[0].steps[0].endpointResponseConfig.idField | 1/6 documentos (16.7%) | string | ❌ |
| workflows[0].steps[0].endpointResponseConfig.displayField | 1/6 documentos (16.7%) | string | ❌ |
| workflows[0].steps[0].endpointId | 1/6 documentos (16.7%) | string | ❌ |
| workflows[0].steps[0].endpointsRelacionados | 1/6 documentos (16.7%) | Array | ❌ |
| workflows[0].steps[0].nombre | 6/6 documentos (100.0%) | string | ✅ |
| workflows[0].steps[0].descripcion | 1/6 documentos (16.7%) | string | ❌ |
| workflows[0].steps[0].intentosMaximos | 1/6 documentos (16.7%) | number | ❌ |
| workflows[0].mensajeInicial | 6/6 documentos (100.0%) | string | ✅ |
| workflows[0].mensajeFinal | 1/6 documentos (16.7%) | string | ❌ |
| workflows[0].mensajeAbandonar | 1/6 documentos (16.7%) | string | ❌ |
| workflows[0].respuestaTemplate | 1/6 documentos (16.7%) | string | ❌ |
| workflows[0].permitirAbandonar | 1/6 documentos (16.7%) | boolean | ❌ |
| workflows[0].timeoutMinutos | 1/6 documentos (16.7%) | number | ❌ |
| workflows[0].createdAt | 3/6 documentos (50.0%) | Date | ❌ |
| workflows[0].updatedAt | 3/6 documentos (50.0%) | Date | ❌ |
| endpoints[0].descripcion | 5/6 documentos (83.3%) | string | ❌ |
| endpoints[0].respuesta | 1/6 documentos (16.7%) | Object | ❌ |
| endpoints[0].respuesta.schema | 1/6 documentos (16.7%) | Object | ❌ |
| endpoints[0].respuesta.schema.success | 1/6 documentos (16.7%) | string | ❌ |
| endpoints[0].respuesta.schema.deportes | 1/6 documentos (16.7%) | string | ❌ |
| endpoints[0].respuesta.ejemploExito | 1/6 documentos (16.7%) | Object | ❌ |
| endpoints[0].respuesta.ejemploExito.success | 1/6 documentos (16.7%) | boolean | ❌ |
| endpoints[0].respuesta.ejemploExito.deportes | 1/6 documentos (16.7%) | Array | ❌ |
| endpoints[0].respuesta.ejemploExito.deportes[0].id | 1/6 documentos (16.7%) | string | ❌ |
| endpoints[0].respuesta.ejemploExito.deportes[0].nombre | 1/6 documentos (16.7%) | string | ❌ |
| endpoints[0].respuesta.ejemploExito.deportes[0].icono | 1/6 documentos (16.7%) | string | ❌ |
| workflows[0]._id | 1/6 documentos (16.7%) | ObjectId | ❌ |
| workflows[0].steps[0]._id | 1/6 documentos (16.7%) | ObjectId | ❌ |
| workflows[0].steps[0].id | 1/6 documentos (16.7%) | string | ❌ |
| workflows[0].steps[0].validacion.mapeo | 1/6 documentos (16.7%) | Object | ❌ |
| workflows[0].steps[0].validacion.mapeo.1 | 1/6 documentos (16.7%) | string | ❌ |
| workflows[0].steps[0].validacion.mapeo.2 | 1/6 documentos (16.7%) | string | ❌ |
| workflows[0].steps[0].validacion.mapeo.paddle | 1/6 documentos (16.7%) | string | ❌ |
| workflows[0].steps[0].validacion.mapeo.futbol | 1/6 documentos (16.7%) | string | ❌ |
| workflows[0].steps[0].validacion.mapeo.fútbol | 1/6 documentos (16.7%) | string | ❌ |
| workflows[0].configPago | 1/6 documentos (16.7%) | Object | ❌ |
| workflows[0].configPago.seña | 1/6 documentos (16.7%) | number | ❌ |
| workflows[0].configPago.porcentajeSeña | 1/6 documentos (16.7%) | number | ❌ |
| workflows[0].configPago.tiempoExpiracion | 1/6 documentos (16.7%) | number | ❌ |
| workflows[0].configPago.moneda | 1/6 documentos (16.7%) | string | ❌ |
| activa | 4/6 documentos (66.7%) | boolean | ❌ |
| autenticacion.configuracion.username | 1/6 documentos (16.7%) | string | ❌ |
| autenticacion.configuracion.password | 1/6 documentos (16.7%) | string | ❌ |
| autenticacion.configuracion.useQueryString | 1/6 documentos (16.7%) | boolean | ❌ |
| autenticacion.configuracion.plainText | 1/6 documentos (16.7%) | boolean | ❌ |
| headers | 4/6 documentos (66.7%) | Object | ❌ |
| headers.Content-Type | 4/6 documentos (66.7%) | string | ❌ |
| endpoints[0].method | 4/6 documentos (66.7%) | string | ❌ |
| endpoints[0].parametros.per_page | 1/6 documentos (16.7%) | number | ❌ |
| endpoints[0].parametros.status | 1/6 documentos (16.7%) | string | ❌ |
| menuPrincipal | 1/6 documentos (16.7%) | Object | ❌ |
| menuPrincipal.mensaje | 1/6 documentos (16.7%) | string | ❌ |
| autenticacion.configuracion.apiKey | 3/6 documentos (50.0%) | string | ❌ |
| autenticacion.configuracion.apiKeyLocation | 3/6 documentos (50.0%) | string | ❌ |
| autenticacion.configuracion.apiKeyName | 3/6 documentos (50.0%) | string | ❌ |
| endpoints[0].parametros.comitente | 3/6 documentos (50.0%) | string | ❌ |
| variables | 3/6 documentos (50.0%) | Object | ❌ |
| variables.apiUrl | 3/6 documentos (50.0%) | string | ❌ |
| variables.apiKey | 3/6 documentos (50.0%) | string | ❌ |

### usuarios_empresas

- **Documentos:** 1
- **Índices:** 1

#### Índices

| Nombre | Campos | Único | Sparse |
|--------|--------|-------|--------|
| _id_ | {"_id":1} | ❌ | ❌ |

#### Esquema Inferido

| Campo | Aparece en | Tipos | Requerido |
|-------|------------|-------|----------|
| _id | 1/1 documentos (100.0%) | ObjectId | ✅ |
| username | 1/1 documentos (100.0%) | string | ✅ |
| password | 1/1 documentos (100.0%) | string | ✅ |
| email | 1/1 documentos (100.0%) | string | ✅ |
| nombre | 1/1 documentos (100.0%) | string | ✅ |
| apellido | 1/1 documentos (100.0%) | string | ✅ |
| rol | 1/1 documentos (100.0%) | string | ✅ |
| permisos | 1/1 documentos (100.0%) | Array | ✅ |
| activo | 1/1 documentos (100.0%) | boolean | ✅ |
| createdBy | 1/1 documentos (100.0%) | string | ✅ |
| empresaId | 1/1 documentos (100.0%) | ObjectId | ✅ |
| empresaNombre | 1/1 documentos (100.0%) | string | ✅ |
| createdAt | 1/1 documentos (100.0%) | Date | ✅ |
| updatedAt | 1/1 documentos (100.0%) | Date | ✅ |

### configuracion_calendario

- **Documentos:** 0
- **Índices:** 2

#### Índices

| Nombre | Campos | Único | Sparse |
|--------|--------|-------|--------|
| _id_ | {"_id":1} | ❌ | ❌ |
| empresaId_1 | {"empresaId":1} | ✅ | ❌ |

#### Esquema Inferido

| Campo | Aparece en | Tipos | Requerido |
|-------|------------|-------|----------|

## 🔗 Relaciones Detectadas

| Desde | Campo | Hacia | Tipo | Frecuencia |
|-------|-------|-------|------|------------|
| admin_users | _id | _id | undefined | 10 |
| admin_users | empresaId | empresas | undefined | 10 |
| flujos | _id | _id | undefined | 15 |
| flujos | empresaId | empresas | undefined | 15 |
| flujos | disparadores[0]._id | _id | undefined | 15 |
| super_admins | _id | _id | undefined | 1 |
| mppaymentlinks | _id | _id | undefined | 13 |
| mppaymentlinks | sellerId | sellers | undefined | 13 |
| mppaymentlinks | empresaId | empresas | undefined | 13 |
| mppaymentlinks | pendingBooking.contactoId | contactoempresas | undefined | 13 |
| mppaymentlinks | pendingBooking.apiConfigId | apiconfigs | undefined | 13 |
| mppaymentlinks | pendingBooking.endpointId | endpoints | undefined | 13 |
| mppaymentlinks | mpPreferenceId | mppreferences | undefined | 13 |
| flows | _id | _id | undefined | 1 |
| flows | empresaId | empresas | undefined | 1 |
| flows | apiConfig.apiConfigurationId | apiconfigurations | undefined | 1 |
| flows | apiConfig.workflowId | workflows | undefined | 1 |
| usuarios_empresa | _id | _id | undefined | 15 |
| usuarios_empresa | empresaId | empresas | undefined | 15 |
| turnos | _id | _id | undefined | 15 |
| turnos | empresaId | empresas | undefined | 15 |
| turnos | agenteId | agentes | undefined | 15 |
| turnos | clienteId | contactoempresas | undefined | 15 |
| turnos | notificaciones[0]._id | _id | undefined | 2 |
| conversation_states | _id | _id | undefined | 1 |
| conversation_states | empresaId | empresas | undefined | 1 |
| agentes | _id | _id | undefined | 11 |
| agentes | empresaId | empresas | undefined | 11 |
| configuracionbots | _id | _id | undefined | 9 |
| configuracionbots | empresaId | empresas | undefined | 9 |
| configuracionbots | flujos._id | _id | undefined | 7 |
| configuracionbots | horariosAtencion._id | _id | undefined | 7 |
| flownodes | _id | _id | undefined | 6 |
| flownodes | empresaId | empresas | undefined | 6 |
| flownodes | flowId | flows | undefined | 6 |
| flow_nodes | _id | _id | undefined | 24 |
| flow_nodes | empresaId | empresas | undefined | 24 |
| flow_nodes | flowId | flows | undefined | 24 |
| mppayments | _id | _id | undefined | 12 |
| mppayments | mpPaymentId | mppayments | undefined | 12 |
| mppayments | sellerId | sellers | undefined | 12 |
| mppayments | empresaId | empresas | undefined | 12 |
| mppayments | paymentMethodId | paymentmethods | undefined | 12 |
| mppayments | paymentTypeId | paymenttypes | undefined | 12 |
| mppayments | paymentLinkId | paymentlinks | undefined | 8 |
| configuraciones_modulo | _id | _id | undefined | 11 |
| configuraciones_modulo | empresaId | empresas | undefined | 11 |
| configuraciones_modulo | variablesDinamicas.nombre_empresa | nombre_empresa | undefined | 6 |
| usuarios | _id | _id | undefined | 1 |
| usuarios | empresaId | empresas | undefined | 1 |
| empresas | _id | _id | undefined | 12 |
| empresas | phoneNumberId | phonenumbers | undefined | 9 |
| empresas | businessAccountId | businessaccounts | undefined | 3 |
| empresas | chatbotId | chatbots | undefined | 1 |
| empresas | modulos[0].configuracion.sellerId | sellers | undefined | 1 |
| mpsellers | _id | _id | undefined | 1 |
| mpsellers | userId | users | undefined | 1 |
| mpsellers | internalId | internals | undefined | 1 |
| api_request_logs | _id | _id | undefined | 50 |
| api_request_logs | empresaId | empresas | undefined | 50 |
| api_request_logs | apiConfigId | apiconfigs | undefined | 50 |
| api_request_logs | endpointId | endpoints | undefined | 50 |
| api_request_logs | contexto.metadata.contactoId | contactoempresas | undefined | 11 |
| contactos_empresa | _id | _id | undefined | 50 |
| contactos_empresa | empresaId | empresas | undefined | 50 |
| contactos_empresa | preferencias._id | _id | undefined | 50 |
| contactos_empresa | conversaciones._id | _id | undefined | 50 |
| contactos_empresa | metricas._id | _id | undefined | 50 |
| contactos_empresa | workflowState.workflowId | workflows | undefined | 1 |
| contactos_empresa | workflowState.apiId | apis | undefined | 1 |
| contactos_empresa | workflowState._id | _id | undefined | 1 |
| afipsellers | _id | _id | undefined | 2 |
| afipsellers | empresaId | empresas | undefined | 2 |
| flow_logs | _id | _id | undefined | 50 |
| flow_logs | empresaId | empresas | undefined | 50 |
| flow_logs | data.canchaId | canchas | undefined | 6 |
| afipinvoices | _id | _id | undefined | 5 |
| afipinvoices | empresaId | empresas | undefined | 5 |
| afipinvoices | sellerId | sellers | undefined | 5 |
| chatbots | _id | _id | undefined | 8 |
| chatbots | empresaId | empresas | undefined | 8 |
| chatbots | whatsapp.phoneNumberId | phonenumbers | undefined | 7 |
| chatbots | whatsapp.businessAccountId | businessaccounts | undefined | 6 |
| api_configurations | _id | _id | undefined | 6 |
| api_configurations | empresaId | empresas | undefined | 6 |
| api_configurations | chatbotIntegration.chatbotId | chatbots | undefined | 2 |
| api_configurations | chatbotIntegration.keywords[0].endpointId | endpoints | undefined | 2 |
| api_configurations | workflows[0].workflowsSiguientes.workflows[0].workflowId | workflows | undefined | 5 |
| api_configurations | workflows[0].steps[0].endpointId | endpoints | undefined | 1 |
| api_configurations | workflows[0]._id | _id | undefined | 1 |
| api_configurations | workflows[0].steps[0]._id | _id | undefined | 1 |
| usuarios_empresas | _id | _id | undefined | 1 |
| usuarios_empresas | empresaId | empresas | undefined | 1 |
| usuarios_empresas | empresaNombre | empresanombre | undefined | 1 |

## ⚙️ Configuraciones de Módulos

- **Total configuraciones:** 0

### Empresas Configuradas

