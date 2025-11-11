# 📊 Análisis de Base de Datos - 2025-11-11

## 🗂️ Resumen General

- **Total de colecciones:** 18
- **Total de documentos:** 417

## 📋 Colecciones

### admin_users

- **Documentos:** 9
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
| _id | 9/9 documentos (100.0%) | ObjectId | ✅ |
| username | 9/9 documentos (100.0%) | string | ✅ |
| password | 9/9 documentos (100.0%) | string | ✅ |
| empresaId | 9/9 documentos (100.0%) | string | ✅ |
| role | 9/9 documentos (100.0%) | string | ✅ |
| email | 9/9 documentos (100.0%) | string | ✅ |
| activo | 9/9 documentos (100.0%) | boolean | ✅ |
| createdAt | 9/9 documentos (100.0%) | Date | ✅ |
| updatedAt | 9/9 documentos (100.0%) | Date | ✅ |
| __v | 9/9 documentos (100.0%) | number | ✅ |
| ultimoAcceso | 5/9 documentos (55.6%) | Date | ❌ |

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

### usuarios_empresa

- **Documentos:** 7
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
| _id | 7/7 documentos (100.0%) | ObjectId | ✅ |
| username | 7/7 documentos (100.0%) | string | ✅ |
| password | 7/7 documentos (100.0%) | string | ✅ |
| email | 7/7 documentos (100.0%) | string | ✅ |
| nombre | 7/7 documentos (100.0%) | string | ✅ |
| empresaId | 7/7 documentos (100.0%) | string | ✅ |
| rol | 7/7 documentos (100.0%) | string | ✅ |
| permisos | 7/7 documentos (100.0%) | Array | ✅ |
| activo | 7/7 documentos (100.0%) | boolean | ✅ |
| ultimoAcceso | 5/7 documentos (71.4%) | Date | ❌ |
| createdBy | 7/7 documentos (100.0%) | string | ✅ |
| createdAt | 7/7 documentos (100.0%) | Date | ✅ |
| updatedAt | 7/7 documentos (100.0%) | Date | ✅ |
| __v | 7/7 documentos (100.0%) | number | ✅ |
| apellido | 4/7 documentos (57.1%) | string | ❌ |
| telefono | 2/7 documentos (28.6%) | string | ❌ |

### turnos

- **Documentos:** 2
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
| _id | 2/2 documentos (100.0%) | ObjectId | ✅ |
| empresaId | 2/2 documentos (100.0%) | string | ✅ |
| agenteId | 2/2 documentos (100.0%) | ObjectId | ✅ |
| clienteId | 2/2 documentos (100.0%) | string | ✅ |
| fechaInicio | 2/2 documentos (100.0%) | Date | ✅ |
| fechaFin | 2/2 documentos (100.0%) | Date | ✅ |
| duracion | 2/2 documentos (100.0%) | number | ✅ |
| estado | 2/2 documentos (100.0%) | string | ✅ |
| tipoReserva | 1/2 documentos (50.0%) | string | ❌ |
| datos | 2/2 documentos (100.0%) | Object | ✅ |
| datos.origen | 2/2 documentos (100.0%) | string | ✅ |
| datos.destino | 2/2 documentos (100.0%) | string | ✅ |
| datos.pasajeros | 2/2 documentos (100.0%) | number | ✅ |
| notas | 2/2 documentos (100.0%) | string | ✅ |
| creadoPor | 2/2 documentos (100.0%) | string | ✅ |
| confirmado | 2/2 documentos (100.0%) | boolean | ✅ |
| notificaciones | 2/2 documentos (100.0%) | Array | ✅ |
| notificaciones[0].tipo | 1/2 documentos (50.0%) | string | ❌ |
| notificaciones[0].programadaPara | 1/2 documentos (50.0%) | Date | ❌ |
| notificaciones[0].enviada | 1/2 documentos (50.0%) | boolean | ❌ |
| notificaciones[0].enviadaEn | 1/2 documentos (50.0%) | Date | ❌ |
| notificaciones[0].plantilla | 1/2 documentos (50.0%) | string | ❌ |
| notificaciones[0]._id | 1/2 documentos (50.0%) | ObjectId | ❌ |
| creadoEn | 2/2 documentos (100.0%) | Date | ✅ |
| actualizadoEn | 2/2 documentos (100.0%) | Date | ✅ |
| __v | 2/2 documentos (100.0%) | number | ✅ |
| confirmadoEn | 1/2 documentos (50.0%) | Date | ❌ |

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
| __v | 1/1 documentos (100.0%) | number | ✅ |
| createdAt | 1/1 documentos (100.0%) | Date | ✅ |
| estado_actual | 1/1 documentos (100.0%) | null | ✅ |
| flujo_activo | 1/1 documentos (100.0%) | null | ✅ |
| flujos_pendientes | 1/1 documentos (100.0%) | Array | ✅ |
| pausado | 1/1 documentos (100.0%) | boolean | ✅ |
| prioridad | 1/1 documentos (100.0%) | string | ✅ |
| ultima_interaccion | 1/1 documentos (100.0%) | Date | ✅ |
| updatedAt | 1/1 documentos (100.0%) | Date | ✅ |

### agentes

- **Documentos:** 2
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
| _id | 2/2 documentos (100.0%) | ObjectId | ✅ |
| empresaId | 2/2 documentos (100.0%) | string | ✅ |
| nombre | 2/2 documentos (100.0%) | string | ✅ |
| apellido | 2/2 documentos (100.0%) | string | ✅ |
| email | 2/2 documentos (100.0%) | string | ✅ |
| telefono | 2/2 documentos (100.0%) | string | ✅ |
| especialidad | 2/2 documentos (100.0%) | string | ✅ |
| descripcion | 2/2 documentos (100.0%) | string | ✅ |
| titulo | 2/2 documentos (100.0%) | string | ✅ |
| modoAtencion | 2/2 documentos (100.0%) | string | ✅ |
| disponibilidad | 2/2 documentos (100.0%) | Array | ✅ |
| duracionTurnoPorDefecto | 2/2 documentos (100.0%) | number | ✅ |
| bufferEntreturnos | 2/2 documentos (100.0%) | number | ✅ |
| capacidadSimultanea | 2/2 documentos (100.0%) | number | ✅ |
| maximoTurnosPorDia | 2/2 documentos (100.0%) | number | ✅ |
| activo | 2/2 documentos (100.0%) | boolean | ✅ |
| creadoEn | 2/2 documentos (100.0%) | Date | ✅ |
| actualizadoEn | 2/2 documentos (100.0%) | Date | ✅ |
| __v | 2/2 documentos (100.0%) | number | ✅ |
| disponibilidad[0].diaSemana | 1/2 documentos (50.0%) | number | ❌ |
| disponibilidad[0].horaInicio | 1/2 documentos (50.0%) | string | ❌ |
| disponibilidad[0].horaFin | 1/2 documentos (50.0%) | string | ❌ |
| disponibilidad[0].activo | 1/2 documentos (50.0%) | boolean | ❌ |
| sector | 1/2 documentos (50.0%) | string | ❌ |

### configuracionbots

- **Documentos:** 4
- **Índices:** 2

#### Índices

| Nombre | Campos | Único | Sparse |
|--------|--------|-------|--------|
| _id_ | {"_id":1} | ❌ | ❌ |
| empresaId_1 | {"empresaId":1} | ✅ | ❌ |

#### Esquema Inferido

| Campo | Aparece en | Tipos | Requerido |
|-------|------------|-------|----------|
| _id | 4/4 documentos (100.0%) | ObjectId | ✅ |
| empresaId | 4/4 documentos (100.0%) | string | ✅ |
| activo | 4/4 documentos (100.0%) | boolean | ✅ |
| mensajeBienvenida | 4/4 documentos (100.0%) | string | ✅ |
| mensajeDespedida | 4/4 documentos (100.0%) | string | ✅ |
| mensajeError | 4/4 documentos (100.0%) | string | ✅ |
| timeoutMinutos | 4/4 documentos (100.0%) | number | ✅ |
| flujos | 4/4 documentos (100.0%) | Object | ✅ |
| flujos.crearTurno | 4/4 documentos (100.0%) | Object | ✅ |
| flujos.crearTurno.nombre | 4/4 documentos (100.0%) | string | ✅ |
| flujos.crearTurno.descripcion | 4/4 documentos (100.0%) | string | ✅ |
| flujos.crearTurno.pasoInicial | 4/4 documentos (100.0%) | string | ✅ |
| flujos.crearTurno.pasos | 4/4 documentos (100.0%) | Array | ✅ |
| flujos.consultarTurnos | 4/4 documentos (100.0%) | Object | ✅ |
| flujos.consultarTurnos.nombre | 4/4 documentos (100.0%) | string | ✅ |
| flujos.consultarTurnos.descripcion | 4/4 documentos (100.0%) | string | ✅ |
| flujos.consultarTurnos.pasoInicial | 4/4 documentos (100.0%) | string | ✅ |
| flujos.consultarTurnos.pasos | 4/4 documentos (100.0%) | Array | ✅ |
| flujos.cancelarTurno | 4/4 documentos (100.0%) | Object | ✅ |
| flujos.cancelarTurno.nombre | 4/4 documentos (100.0%) | string | ✅ |
| flujos.cancelarTurno.descripcion | 4/4 documentos (100.0%) | string | ✅ |
| flujos.cancelarTurno.pasoInicial | 4/4 documentos (100.0%) | string | ✅ |
| flujos.cancelarTurno.pasos | 4/4 documentos (100.0%) | Array | ✅ |
| flujos._id | 4/4 documentos (100.0%) | ObjectId | ✅ |
| horariosAtencion | 4/4 documentos (100.0%) | Object | ✅ |
| horariosAtencion.activo | 4/4 documentos (100.0%) | boolean | ✅ |
| horariosAtencion.inicio | 4/4 documentos (100.0%) | string | ✅ |
| horariosAtencion.fin | 4/4 documentos (100.0%) | string | ✅ |
| horariosAtencion.diasSemana | 4/4 documentos (100.0%) | Array | ✅ |
| horariosAtencion.mensajeFueraHorario | 4/4 documentos (100.0%) | string | ✅ |
| horariosAtencion._id | 4/4 documentos (100.0%) | ObjectId | ✅ |
| requiereConfirmacion | 4/4 documentos (100.0%) | boolean | ✅ |
| permiteCancelacion | 4/4 documentos (100.0%) | boolean | ✅ |
| notificarAdmin | 4/4 documentos (100.0%) | boolean | ✅ |
| createdAt | 4/4 documentos (100.0%) | Date | ✅ |
| updatedAt | 4/4 documentos (100.0%) | Date | ✅ |
| __v | 4/4 documentos (100.0%) | number | ✅ |

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

### conversacionbots

- **Documentos:** 0
- **Índices:** 8

#### Índices

| Nombre | Campos | Único | Sparse |
|--------|--------|-------|--------|
| _id_ | {"_id":1} | ❌ | ❌ |
| empresaId_1 | {"empresaId":1} | ❌ | ❌ |
| clienteTelefono_1 | {"clienteTelefono":1} | ❌ | ❌ |
| clienteId_1 | {"clienteId":1} | ❌ | ❌ |
| ultimaInteraccion_1 | {"ultimaInteraccion":1} | ❌ | ❌ |
| activa_1 | {"activa":1} | ❌ | ❌ |
| empresaId_1_clienteTelefono_1_activa_1 | {"empresaId":1,"clienteTelefono":1,"activa":1} | ❌ | ❌ |
| ultimaInteraccion_1_activa_1 | {"ultimaInteraccion":1,"activa":1} | ❌ | ❌ |

#### Esquema Inferido

| Campo | Aparece en | Tipos | Requerido |
|-------|------------|-------|----------|

### clientes

- **Documentos:** 5
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
| _id | 5/5 documentos (100.0%) | ObjectId | ✅ |
| empresaId | 5/5 documentos (100.0%) | string | ✅ |
| nombre | 5/5 documentos (100.0%) | string | ✅ |
| apellido | 5/5 documentos (100.0%) | string | ✅ |
| telefono | 5/5 documentos (100.0%) | string | ✅ |
| notas | 5/5 documentos (100.0%) | string | ✅ |
| origen | 5/5 documentos (100.0%) | string | ✅ |
| chatbotUserId | 5/5 documentos (100.0%) | string | ✅ |
| profileName | 5/5 documentos (100.0%) | string | ✅ |
| preferencias | 5/5 documentos (100.0%) | Object | ✅ |
| preferencias.aceptaWhatsApp | 5/5 documentos (100.0%) | boolean | ✅ |
| preferencias.aceptaSMS | 5/5 documentos (100.0%) | boolean | ✅ |
| preferencias.aceptaEmail | 5/5 documentos (100.0%) | boolean | ✅ |
| preferencias.recordatorioTurnos | 5/5 documentos (100.0%) | boolean | ✅ |
| preferencias.diasAnticipacionRecordatorio | 5/5 documentos (100.0%) | number | ✅ |
| preferencias.horaRecordatorio | 5/5 documentos (100.0%) | string | ✅ |
| preferencias.notificacionesPromocion | 5/5 documentos (100.0%) | boolean | ✅ |
| preferencias.notificacionesDisponibilidad | 5/5 documentos (100.0%) | boolean | ✅ |
| preferencias._id | 5/5 documentos (100.0%) | ObjectId | ✅ |
| activo | 5/5 documentos (100.0%) | boolean | ✅ |
| creadoEn | 5/5 documentos (100.0%) | Date | ✅ |
| actualizadoEn | 5/5 documentos (100.0%) | Date | ✅ |
| __v | 5/5 documentos (100.0%) | number | ✅ |

### configuraciones_modulo

- **Documentos:** 3
- **Índices:** 2

#### Índices

| Nombre | Campos | Único | Sparse |
|--------|--------|-------|--------|
| _id_ | {"_id":1} | ❌ | ❌ |
| empresaId_1 | {"empresaId":1} | ✅ | ❌ |

#### Esquema Inferido

| Campo | Aparece en | Tipos | Requerido |
|-------|------------|-------|----------|
| _id | 3/3 documentos (100.0%) | ObjectId | ✅ |
| empresaId | 3/3 documentos (100.0%) | string | ✅ |
| tipoNegocio | 3/3 documentos (100.0%) | string | ✅ |
| activo | 3/3 documentos (100.0%) | boolean | ✅ |
| nomenclatura | 3/3 documentos (100.0%) | Object | ✅ |
| nomenclatura.turno | 3/3 documentos (100.0%) | string | ✅ |
| nomenclatura.turnos | 3/3 documentos (100.0%) | string | ✅ |
| nomenclatura.agente | 3/3 documentos (100.0%) | string | ✅ |
| nomenclatura.agentes | 3/3 documentos (100.0%) | string | ✅ |
| nomenclatura.cliente | 3/3 documentos (100.0%) | string | ✅ |
| nomenclatura.clientes | 3/3 documentos (100.0%) | string | ✅ |
| nomenclatura.recurso | 1/3 documentos (33.3%) | string | ❌ |
| nomenclatura.recursos | 1/3 documentos (33.3%) | string | ❌ |
| camposPersonalizados | 3/3 documentos (100.0%) | Array | ✅ |
| camposPersonalizados[0].clave | 1/3 documentos (33.3%) | string | ❌ |
| camposPersonalizados[0].etiqueta | 1/3 documentos (33.3%) | string | ❌ |
| camposPersonalizados[0].tipo | 1/3 documentos (33.3%) | string | ❌ |
| camposPersonalizados[0].requerido | 1/3 documentos (33.3%) | boolean | ❌ |
| camposPersonalizados[0].opciones | 1/3 documentos (33.3%) | Array | ❌ |
| camposPersonalizados[0].placeholder | 1/3 documentos (33.3%) | string | ❌ |
| camposPersonalizados[0].orden | 1/3 documentos (33.3%) | number | ❌ |
| camposPersonalizados[0].mostrarEnLista | 1/3 documentos (33.3%) | boolean | ❌ |
| camposPersonalizados[0].mostrarEnCalendario | 1/3 documentos (33.3%) | boolean | ❌ |
| camposPersonalizados[0].usarEnNotificacion | 1/3 documentos (33.3%) | boolean | ❌ |
| turnos | 1/3 documentos (33.3%) | Object | ❌ |
| turnos.usaAgentes | 1/3 documentos (33.3%) | boolean | ❌ |
| turnos.agenteRequerido | 1/3 documentos (33.3%) | boolean | ❌ |
| turnos.usaRecursos | 1/3 documentos (33.3%) | boolean | ❌ |
| turnos.recursoRequerido | 1/3 documentos (33.3%) | boolean | ❌ |
| turnos.duracionPorDefecto | 1/3 documentos (33.3%) | number | ❌ |
| turnos.permiteDuracionVariable | 1/3 documentos (33.3%) | boolean | ❌ |
| plantillasMeta | 2/3 documentos (66.7%) | Object | ❌ |
| plantillasMeta.notificacionDiariaAgentes | 2/3 documentos (66.7%) | Object | ❌ |
| plantillasMeta.notificacionDiariaAgentes.activa | 2/3 documentos (66.7%) | boolean | ❌ |
| plantillasMeta.notificacionDiariaAgentes.tipo | 1/3 documentos (33.3%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.nombre | 2/3 documentos (66.7%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.idioma | 2/3 documentos (66.7%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.parametros | 1/3 documentos (33.3%) | Array | ❌ |
| plantillasMeta.notificacionDiariaAgentes.parametros[0].orden | 1/3 documentos (33.3%) | number | ❌ |
| plantillasMeta.notificacionDiariaAgentes.parametros[0].variable | 1/3 documentos (33.3%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.parametros[0].valor | 1/3 documentos (33.3%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.programacion | 2/3 documentos (66.7%) | Object | ❌ |
| plantillasMeta.notificacionDiariaAgentes.programacion.metodoVerificacion | 2/3 documentos (66.7%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.programacion.horaEnvio | 2/3 documentos (66.7%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.programacion.frecuencia | 2/3 documentos (66.7%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.programacion.rangoHorario | 2/3 documentos (66.7%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.programacion.filtroEstado | 2/3 documentos (66.7%) | Array | ❌ |
| plantillasMeta.notificacionDiariaAgentes.programacion.incluirDetalles | 2/3 documentos (66.7%) | Object | ❌ |
| plantillasMeta.notificacionDiariaAgentes.programacion.incluirDetalles.origen | 2/3 documentos (66.7%) | boolean | ❌ |
| plantillasMeta.notificacionDiariaAgentes.programacion.incluirDetalles.destino | 2/3 documentos (66.7%) | boolean | ❌ |
| plantillasMeta.notificacionDiariaAgentes.programacion.incluirDetalles.nombreCliente | 2/3 documentos (66.7%) | boolean | ❌ |
| plantillasMeta.notificacionDiariaAgentes.programacion.incluirDetalles.telefonoCliente | 2/3 documentos (66.7%) | boolean | ❌ |
| plantillasMeta.notificacionDiariaAgentes.programacion.incluirDetalles.horaReserva | 2/3 documentos (66.7%) | boolean | ❌ |
| plantillasMeta.notificacionDiariaAgentes.programacion.incluirDetalles.notasInternas | 2/3 documentos (66.7%) | boolean | ❌ |
| plantillasMeta.notificacionDiariaAgentes.ultimoEnvio | 2/3 documentos (66.7%) | Date | ❌ |
| plantillasMeta.confirmacionTurnos | 2/3 documentos (66.7%) | Object | ❌ |
| plantillasMeta.confirmacionTurnos.activa | 2/3 documentos (66.7%) | boolean | ❌ |
| plantillasMeta.confirmacionTurnos.tipo | 1/3 documentos (33.3%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.nombre | 2/3 documentos (66.7%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.idioma | 2/3 documentos (66.7%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.parametros | 1/3 documentos (33.3%) | Array | ❌ |
| plantillasMeta.confirmacionTurnos.parametros[0].orden | 1/3 documentos (33.3%) | number | ❌ |
| plantillasMeta.confirmacionTurnos.parametros[0].variable | 1/3 documentos (33.3%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.parametros[0].valor | 1/3 documentos (33.3%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.programacion | 2/3 documentos (66.7%) | Object | ❌ |
| plantillasMeta.confirmacionTurnos.programacion.metodoVerificacion | 2/3 documentos (66.7%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.programacion.horaEnvio | 2/3 documentos (66.7%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.programacion.diasAntes | 2/3 documentos (66.7%) | number | ❌ |
| plantillasMeta.confirmacionTurnos.programacion.filtroEstado | 2/3 documentos (66.7%) | Array | ❌ |
| creadoEn | 3/3 documentos (100.0%) | Date | ✅ |
| actualizadoEn | 3/3 documentos (100.0%) | Date | ✅ |
| __v | 3/3 documentos (100.0%) | number | ✅ |
| agenteRequerido | 3/3 documentos (100.0%) | boolean | ✅ |
| chatbotActivo | 3/3 documentos (100.0%) | boolean | ✅ |
| chatbotPuedeCancelar | 3/3 documentos (100.0%) | boolean | ✅ |
| chatbotPuedeCrear | 3/3 documentos (100.0%) | boolean | ✅ |
| chatbotPuedeModificar | 3/3 documentos (100.0%) | boolean | ✅ |
| duracionPorDefecto | 3/3 documentos (100.0%) | number | ✅ |
| estadosPersonalizados | 3/3 documentos (100.0%) | Array | ✅ |
| notificaciones | 3/3 documentos (100.0%) | Array | ✅ |
| permiteDuracionVariable | 3/3 documentos (100.0%) | boolean | ✅ |
| recursoRequerido | 3/3 documentos (100.0%) | boolean | ✅ |
| requiereConfirmacion | 3/3 documentos (100.0%) | boolean | ✅ |
| usaAgentes | 3/3 documentos (100.0%) | boolean | ✅ |
| usaHorariosDisponibilidad | 3/3 documentos (100.0%) | boolean | ✅ |
| usaRecursos | 3/3 documentos (100.0%) | boolean | ✅ |
| plantillasMeta.notificacionDiariaAgentes.metaApiUrl | 1/3 documentos (33.3%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.metaPayload | 1/3 documentos (33.3%) | Object | ❌ |
| plantillasMeta.notificacionDiariaAgentes.metaPayload.messaging_product | 1/3 documentos (33.3%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.metaPayload.to | 1/3 documentos (33.3%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.metaPayload.type | 1/3 documentos (33.3%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.metaPayload.template | 1/3 documentos (33.3%) | Object | ❌ |
| plantillasMeta.notificacionDiariaAgentes.metaPayload.template.name | 1/3 documentos (33.3%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.metaPayload.template.language | 1/3 documentos (33.3%) | Object | ❌ |
| plantillasMeta.notificacionDiariaAgentes.metaPayload.template.language.code | 1/3 documentos (33.3%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.metaPayload.template.components | 1/3 documentos (33.3%) | Array | ❌ |
| plantillasMeta.notificacionDiariaAgentes.metaPayload.template.components[0].type | 1/3 documentos (33.3%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.metaPayload.template.components[0].parameters | 1/3 documentos (33.3%) | Array | ❌ |
| plantillasMeta.notificacionDiariaAgentes.metaPayload.template.components[0].parameters[0].type | 1/3 documentos (33.3%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.metaPayload.template.components[0].parameters[0].text | 1/3 documentos (33.3%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.variables | 1/3 documentos (33.3%) | Object | ❌ |
| plantillasMeta.notificacionDiariaAgentes.variables.phoneNumberId | 1/3 documentos (33.3%) | Object | ❌ |
| plantillasMeta.notificacionDiariaAgentes.variables.phoneNumberId.origen | 1/3 documentos (33.3%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.variables.phoneNumberId.campo | 1/3 documentos (33.3%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.variables.telefono | 1/3 documentos (33.3%) | Object | ❌ |
| plantillasMeta.notificacionDiariaAgentes.variables.telefono.origen | 1/3 documentos (33.3%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.variables.telefono.campo | 1/3 documentos (33.3%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.variables.agente | 1/3 documentos (33.3%) | Object | ❌ |
| plantillasMeta.notificacionDiariaAgentes.variables.agente.origen | 1/3 documentos (33.3%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.variables.agente.formula | 1/3 documentos (33.3%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.variables.lista_turnos | 1/3 documentos (33.3%) | Object | ❌ |
| plantillasMeta.notificacionDiariaAgentes.variables.lista_turnos.origen | 1/3 documentos (33.3%) | string | ❌ |
| plantillasMeta.notificacionDiariaAgentes.variables.lista_turnos.formula | 1/3 documentos (33.3%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.metaApiUrl | 1/3 documentos (33.3%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.metaPayload | 1/3 documentos (33.3%) | Object | ❌ |
| plantillasMeta.confirmacionTurnos.metaPayload.messaging_product | 1/3 documentos (33.3%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.metaPayload.to | 1/3 documentos (33.3%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.metaPayload.type | 1/3 documentos (33.3%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.metaPayload.template | 1/3 documentos (33.3%) | Object | ❌ |
| plantillasMeta.confirmacionTurnos.metaPayload.template.name | 1/3 documentos (33.3%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.metaPayload.template.language | 1/3 documentos (33.3%) | Object | ❌ |
| plantillasMeta.confirmacionTurnos.metaPayload.template.language.code | 1/3 documentos (33.3%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.metaPayload.template.components | 1/3 documentos (33.3%) | Array | ❌ |
| plantillasMeta.confirmacionTurnos.metaPayload.template.components[0].type | 1/3 documentos (33.3%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.metaPayload.template.components[0].parameters | 1/3 documentos (33.3%) | Array | ❌ |
| plantillasMeta.confirmacionTurnos.metaPayload.template.components[0].parameters[0].type | 1/3 documentos (33.3%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.metaPayload.template.components[0].parameters[0].text | 1/3 documentos (33.3%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.variables | 1/3 documentos (33.3%) | Object | ❌ |
| plantillasMeta.confirmacionTurnos.variables.phoneNumberId | 1/3 documentos (33.3%) | Object | ❌ |
| plantillasMeta.confirmacionTurnos.variables.phoneNumberId.origen | 1/3 documentos (33.3%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.variables.phoneNumberId.campo | 1/3 documentos (33.3%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.variables.telefono | 1/3 documentos (33.3%) | Object | ❌ |
| plantillasMeta.confirmacionTurnos.variables.telefono.origen | 1/3 documentos (33.3%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.variables.telefono.campo | 1/3 documentos (33.3%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.variables.nombre_cliente | 1/3 documentos (33.3%) | Object | ❌ |
| plantillasMeta.confirmacionTurnos.variables.nombre_cliente.origen | 1/3 documentos (33.3%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.variables.nombre_cliente.formula | 1/3 documentos (33.3%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.variables.fecha_hora | 1/3 documentos (33.3%) | Object | ❌ |
| plantillasMeta.confirmacionTurnos.variables.fecha_hora.origen | 1/3 documentos (33.3%) | string | ❌ |
| plantillasMeta.confirmacionTurnos.variables.fecha_hora.formula | 1/3 documentos (33.3%) | string | ❌ |
| notificacionDiariaAgentes | 1/3 documentos (33.3%) | Object | ❌ |
| notificacionDiariaAgentes.activa | 1/3 documentos (33.3%) | boolean | ❌ |
| notificacionDiariaAgentes.horaEnvio | 1/3 documentos (33.3%) | string | ❌ |
| notificacionDiariaAgentes.enviarATodos | 1/3 documentos (33.3%) | boolean | ❌ |
| notificacionDiariaAgentes.plantillaMensaje | 1/3 documentos (33.3%) | string | ❌ |
| notificacionDiariaAgentes.frecuencia | 1/3 documentos (33.3%) | Object | ❌ |
| notificacionDiariaAgentes.frecuencia.tipo | 1/3 documentos (33.3%) | string | ❌ |
| notificacionDiariaAgentes.frecuencia.diasSemana | 1/3 documentos (33.3%) | Array | ❌ |
| notificacionDiariaAgentes.rangoHorario | 1/3 documentos (33.3%) | Object | ❌ |
| notificacionDiariaAgentes.rangoHorario.activo | 1/3 documentos (33.3%) | boolean | ❌ |
| notificacionDiariaAgentes.rangoHorario.tipo | 1/3 documentos (33.3%) | string | ❌ |
| notificacionDiariaAgentes.filtroHorario | 1/3 documentos (33.3%) | Object | ❌ |
| notificacionDiariaAgentes.filtroHorario.activo | 1/3 documentos (33.3%) | boolean | ❌ |
| notificacionDiariaAgentes.filtroHorario.tipo | 1/3 documentos (33.3%) | string | ❌ |
| notificacionDiariaAgentes.filtroEstado | 1/3 documentos (33.3%) | Object | ❌ |
| notificacionDiariaAgentes.filtroEstado.activo | 1/3 documentos (33.3%) | boolean | ❌ |
| notificacionDiariaAgentes.filtroEstado.estados | 1/3 documentos (33.3%) | Array | ❌ |
| notificacionDiariaAgentes.filtroTipo | 1/3 documentos (33.3%) | Object | ❌ |
| notificacionDiariaAgentes.filtroTipo.activo | 1/3 documentos (33.3%) | boolean | ❌ |
| notificacionDiariaAgentes.filtroTipo.tipos | 1/3 documentos (33.3%) | Array | ❌ |
| notificacionDiariaAgentes.incluirDetalles | 1/3 documentos (33.3%) | Object | ❌ |
| notificacionDiariaAgentes.incluirDetalles.origen | 1/3 documentos (33.3%) | boolean | ❌ |
| notificacionDiariaAgentes.incluirDetalles.destino | 1/3 documentos (33.3%) | boolean | ❌ |
| notificacionDiariaAgentes.incluirDetalles.nombreCliente | 1/3 documentos (33.3%) | boolean | ❌ |
| notificacionDiariaAgentes.incluirDetalles.telefonoCliente | 1/3 documentos (33.3%) | boolean | ❌ |
| notificacionDiariaAgentes.incluirDetalles.horaReserva | 1/3 documentos (33.3%) | boolean | ❌ |
| notificacionDiariaAgentes.incluirDetalles.notasInternas | 1/3 documentos (33.3%) | boolean | ❌ |
| notificacionDiariaAgentes.agentesEspecificos | 1/3 documentos (33.3%) | Array | ❌ |

### usuarios

- **Documentos:** 29
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
| _id | 29/29 documentos (100.0%) | ObjectId | ✅ |
| numero | 29/29 documentos (100.0%) | string | ✅ |
| nombre | 29/29 documentos (100.0%) | string | ✅ |
| empresaId | 29/29 documentos (100.0%) | string | ✅ |
| empresaTelefono | 29/29 documentos (100.0%) | string | ✅ |
| historial | 29/29 documentos (100.0%) | Array | ✅ |
| interacciones | 29/29 documentos (100.0%) | number | ✅ |
| ultimaInteraccion | 29/29 documentos (100.0%) | string | ✅ |
| ultima_actualizacion | 29/29 documentos (100.0%) | string | ✅ |
| saludado | 29/29 documentos (100.0%) | boolean | ✅ |
| despedido | 29/29 documentos (100.0%) | boolean | ✅ |
| num_mensajes_enviados | 29/29 documentos (100.0%) | number | ✅ |
| num_mensajes_recibidos | 29/29 documentos (100.0%) | number | ✅ |
| num_media_recibidos | 29/29 documentos (100.0%) | number | ✅ |
| mensaje_ids | 29/29 documentos (100.0%) | Array | ✅ |
| ultimo_status | 29/29 documentos (100.0%) | string | ✅ |
| tokens_consumidos | 29/29 documentos (100.0%) | number | ✅ |
| contactoInformado | 29/29 documentos (100.0%) | boolean | ✅ |
| createdAt | 29/29 documentos (100.0%) | Date | ✅ |
| updatedAt | 29/29 documentos (100.0%) | Date | ✅ |
| __v | 29/29 documentos (100.0%) | number | ✅ |

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

- **Documentos:** 7
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
| _id | 7/7 documentos (100.0%) | ObjectId | ✅ |
| nombre | 7/7 documentos (100.0%) | string | ✅ |
| __v | 7/7 documentos (100.0%) | number | ✅ |
| catalogoPath | 7/7 documentos (100.0%) | string | ✅ |
| categoria | 7/7 documentos (100.0%) | string | ✅ |
| createdAt | 7/7 documentos (100.0%) | Date | ✅ |
| derivarA | 7/7 documentos (100.0%) | Array | ✅ |
| email | 7/7 documentos (100.0%) | string | ✅ |
| linkCatalogo | 4/7 documentos (57.1%) | string | ❌ |
| modelo | 7/7 documentos (100.0%) | string | ✅ |
| phoneNumberId | 4/7 documentos (57.1%) | string | ❌ |
| prompt | 7/7 documentos (100.0%) | string | ✅ |
| saludos | 7/7 documentos (100.0%) | Array | ✅ |
| telefono | 7/7 documentos (100.0%) | string | ✅ |
| ubicaciones | 7/7 documentos (100.0%) | Array | ✅ |
| ubicaciones[0].nombre | 3/7 documentos (42.9%) | string | ❌ |
| ubicaciones[0].ciudad | 3/7 documentos (42.9%) | string | ❌ |
| ubicaciones[0].direccion | 3/7 documentos (42.9%) | string | ❌ |
| ubicaciones[0].derivarA | 3/7 documentos (42.9%) | Array | ❌ |
| updatedAt | 7/7 documentos (100.0%) | Date | ✅ |
| facturacion | 5/7 documentos (71.4%) | Object | ❌ |
| facturacion.estado | 5/7 documentos (71.4%) | string | ❌ |
| limites | 5/7 documentos (71.4%) | Object | ❌ |
| limites.agentesSimultaneos | 5/7 documentos (71.4%) | number | ❌ |
| limites.almacenamiento | 5/7 documentos (71.4%) | number | ❌ |
| limites.exportacionesMensuales | 5/7 documentos (71.4%) | number | ❌ |
| limites.integraciones | 5/7 documentos (71.4%) | number | ❌ |
| limites.maxAdmins | 5/7 documentos (71.4%) | number | ❌ |
| limites.maxUsuarios | 5/7 documentos (71.4%) | number | ❌ |
| limites.mensajesMensuales | 5/7 documentos (71.4%) | number | ❌ |
| limites.usuariosActivos | 5/7 documentos (71.4%) | number | ❌ |
| modulos | 5/7 documentos (71.4%) | Array | ❌ |
| plan | 5/7 documentos (71.4%) | string | ❌ |
| uso | 5/7 documentos (71.4%) | Object | ❌ |
| uso.almacenamientoUsado | 5/7 documentos (71.4%) | number | ❌ |
| uso.exportacionesEsteMes | 5/7 documentos (71.4%) | number | ❌ |
| uso.mensajesEsteMes | 5/7 documentos (71.4%) | number | ❌ |
| uso.ultimaActualizacion | 5/7 documentos (71.4%) | Date | ❌ |
| uso.usuariosActivos | 5/7 documentos (71.4%) | number | ❌ |
| modulos[0].id | 2/7 documentos (28.6%) | string | ❌ |
| modulos[0].nombre | 2/7 documentos (28.6%) | string | ❌ |
| modulos[0].descripcion | 2/7 documentos (28.6%) | string | ❌ |
| modulos[0].version | 2/7 documentos (28.6%) | string | ❌ |
| modulos[0].categoria | 2/7 documentos (28.6%) | string | ❌ |
| modulos[0].icono | 2/7 documentos (28.6%) | string | ❌ |
| modulos[0].activo | 2/7 documentos (28.6%) | boolean | ❌ |
| modulos[0].fechaActivacion | 2/7 documentos (28.6%) | Date | ❌ |
| modulos[0].precio | 2/7 documentos (28.6%) | number | ❌ |
| modulos[0].planMinimo | 2/7 documentos (28.6%) | string | ❌ |
| modulos[0].dependencias | 2/7 documentos (28.6%) | Array | ❌ |
| modulos[0].permisos | 2/7 documentos (28.6%) | Array | ❌ |
| modulos[0].configuracion | 1/7 documentos (14.3%) | Object | ❌ |
| modulos[0].configuracion.duracionTurnoPorDefecto | 1/7 documentos (14.3%) | number | ❌ |
| modulos[0].configuracion.bufferEntreturnos | 1/7 documentos (14.3%) | number | ❌ |
| modulos[0].configuracion.anticipacionMinima | 1/7 documentos (14.3%) | number | ❌ |
| modulos[0].configuracion.anticipacionMaxima | 1/7 documentos (14.3%) | number | ❌ |
| modulos[0].configuracion.horaAperturaGlobal | 1/7 documentos (14.3%) | string | ❌ |
| modulos[0].configuracion.horaCierreGlobal | 1/7 documentos (14.3%) | string | ❌ |
| modulos[0].configuracion.requiereConfirmacionAgente | 1/7 documentos (14.3%) | boolean | ❌ |
| modulos[0].configuracion.tiempoLimiteConfirmacion | 1/7 documentos (14.3%) | number | ❌ |
| modulos[0].configuracion.recordatorio24h | 1/7 documentos (14.3%) | boolean | ❌ |
| modulos[0].configuracion.recordatorio1h | 1/7 documentos (14.3%) | boolean | ❌ |
| modulos[0].configuracion.permiteCancelacion | 1/7 documentos (14.3%) | boolean | ❌ |
| modulos[0].configuracion.tiempoLimiteCancelacion | 1/7 documentos (14.3%) | number | ❌ |
| modulos[0].configuracion.notificarAgenteNuevoTurno | 1/7 documentos (14.3%) | boolean | ❌ |
| modulos[0].configuracion.notificarAgenteCancelacion | 1/7 documentos (14.3%) | boolean | ❌ |
| modulos[0].autor | 2/7 documentos (28.6%) | string | ❌ |
| modulos[0].documentacion | 2/7 documentos (28.6%) | string | ❌ |
| modulos[0].soporte | 2/7 documentos (28.6%) | string | ❌ |
| facturacion.ultimoPago | 4/7 documentos (57.1%) | Date | ❌ |
| facturacion.proximoPago | 4/7 documentos (57.1%) | Date | ❌ |
| facturacion.metodoPago | 1/7 documentos (14.3%) | string | ❌ |

### contactos_empresa

- **Documentos:** 39
- **Índices:** 8

#### Índices

| Nombre | Campos | Único | Sparse |
|--------|--------|-------|--------|
| _id_ | {"_id":1} | ❌ | ❌ |
| empresaId_1 | {"empresaId":1} | ❌ | ❌ |
| telefono_1 | {"telefono":1} | ❌ | ❌ |
| empresaId_1_telefono_1 | {"empresaId":1,"telefono":1} | ✅ | ❌ |
| empresaId_1_email_1 | {"empresaId":1,"email":1} | ❌ | ❌ |
| empresaId_1_activo_1 | {"empresaId":1,"activo":1} | ❌ | ❌ |
| empresaId_1_sector_1 | {"empresaId":1,"sector":1} | ❌ | ❌ |
| metricas.ultimaInteraccion_1 | {"metricas.ultimaInteraccion":1} | ❌ | ❌ |

#### Esquema Inferido

| Campo | Aparece en | Tipos | Requerido |
|-------|------------|-------|----------|
| _id | 39/39 documentos (100.0%) | ObjectId | ✅ |
| empresaId | 39/39 documentos (100.0%) | string | ✅ |
| telefono | 39/39 documentos (100.0%) | string | ✅ |
| nombre | 39/39 documentos (100.0%) | string | ✅ |
| apellido | 39/39 documentos (100.0%) | string | ✅ |
| profileName | 39/39 documentos (100.0%) | string | ✅ |
| origen | 39/39 documentos (100.0%) | string | ✅ |
| preferencias | 39/39 documentos (100.0%) | Object | ✅ |
| preferencias.aceptaWhatsApp | 39/39 documentos (100.0%) | boolean | ✅ |
| preferencias.aceptaSMS | 39/39 documentos (100.0%) | boolean | ✅ |
| preferencias.aceptaEmail | 39/39 documentos (100.0%) | boolean | ✅ |
| preferencias.recordatorioTurnos | 39/39 documentos (100.0%) | boolean | ✅ |
| preferencias.diasAnticipacionRecordatorio | 39/39 documentos (100.0%) | number | ✅ |
| preferencias.horaRecordatorio | 39/39 documentos (100.0%) | string | ✅ |
| preferencias.notificacionesPromocion | 39/39 documentos (100.0%) | boolean | ✅ |
| preferencias.notificacionesDisponibilidad | 39/39 documentos (100.0%) | boolean | ✅ |
| preferencias._id | 39/39 documentos (100.0%) | ObjectId | ✅ |
| conversaciones | 39/39 documentos (100.0%) | Object | ✅ |
| conversaciones.historial | 39/39 documentos (100.0%) | Array | ✅ |
| conversaciones.ultimaConversacion | 39/39 documentos (100.0%) | Date | ✅ |
| conversaciones.saludado | 39/39 documentos (100.0%) | boolean | ✅ |
| conversaciones.despedido | 39/39 documentos (100.0%) | boolean | ✅ |
| conversaciones.mensaje_ids | 39/39 documentos (100.0%) | Array | ✅ |
| conversaciones.ultimo_status | 39/39 documentos (100.0%) | string | ✅ |
| conversaciones.contactoInformado | 39/39 documentos (100.0%) | boolean | ✅ |
| conversaciones._id | 39/39 documentos (100.0%) | ObjectId | ✅ |
| metricas | 39/39 documentos (100.0%) | Object | ✅ |
| metricas.interacciones | 39/39 documentos (100.0%) | number | ✅ |
| metricas.mensajesEnviados | 39/39 documentos (100.0%) | number | ✅ |
| metricas.mensajesRecibidos | 39/39 documentos (100.0%) | number | ✅ |
| metricas.mediaRecibidos | 39/39 documentos (100.0%) | number | ✅ |
| metricas.tokensConsumidos | 39/39 documentos (100.0%) | number | ✅ |
| metricas.turnosRealizados | 39/39 documentos (100.0%) | number | ✅ |
| metricas.turnosCancelados | 39/39 documentos (100.0%) | number | ✅ |
| metricas.ultimaInteraccion | 39/39 documentos (100.0%) | Date | ✅ |
| metricas._id | 39/39 documentos (100.0%) | ObjectId | ✅ |
| activo | 39/39 documentos (100.0%) | boolean | ✅ |
| creadoEn | 39/39 documentos (100.0%) | Date | ✅ |
| actualizadoEn | 39/39 documentos (100.0%) | Date | ✅ |
| __v | 39/39 documentos (100.0%) | number | ✅ |
| notas | 15/39 documentos (38.5%) | string | ❌ |
| email | 1/39 documentos (2.6%) | string | ❌ |

### flow_logs

- **Documentos:** 293
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
| _id | 100/100 documentos (100.0%) | ObjectId | ✅ |
| telefono | 100/100 documentos (100.0%) | string | ✅ |
| empresaId | 100/100 documentos (100.0%) | string | ✅ |
| flujo | 100/100 documentos (100.0%) | string | ✅ |
| estado | 100/100 documentos (100.0%) | string | ✅ |
| accion | 100/100 documentos (100.0%) | string | ✅ |
| timestamp | 100/100 documentos (100.0%) | Date | ✅ |
| __v | 100/100 documentos (100.0%) | number | ✅ |
| data | 52/100 documentos (52.0%) | Object | ❌ |
| data.origen | 41/100 documentos (41.0%) | string | ❌ |
| data.destino | 30/100 documentos (30.0%) | string | ❌ |
| data.pasajeros | 20/100 documentos (20.0%) | number | ❌ |
| data.fecha | 10/100 documentos (10.0%) | Date | ❌ |
| data.fechaTexto | 10/100 documentos (10.0%) | string | ❌ |
| data.viajes | 11/100 documentos (11.0%) | Array | ❌ |
| data.viajes[0]._id | 11/100 documentos (11.0%) | string | ❌ |
| data.viajes[0].origen | 11/100 documentos (11.0%) | string | ❌ |
| data.viajes[0].destino | 11/100 documentos (11.0%) | string | ❌ |
| data.viajes[0].horario | 11/100 documentos (11.0%) | string | ❌ |

## 🔗 Relaciones Detectadas

| Desde | Campo | Hacia | Tipo | Frecuencia |
|-------|-------|-------|------|------------|
| admin_users | _id | _id | undefined | 9 |
| admin_users | empresaId | empresas | undefined | 9 |
| flujos | _id | _id | undefined | 15 |
| flujos | empresaId | empresas | undefined | 15 |
| flujos | disparadores[0]._id | _id | undefined | 15 |
| super_admins | _id | _id | undefined | 1 |
| usuarios_empresa | _id | _id | undefined | 7 |
| usuarios_empresa | empresaId | empresas | undefined | 7 |
| turnos | _id | _id | undefined | 2 |
| turnos | empresaId | empresas | undefined | 2 |
| turnos | agenteId | agentes | undefined | 2 |
| turnos | clienteId | contactoempresas | undefined | 2 |
| turnos | notificaciones[0]._id | _id | undefined | 1 |
| conversation_states | _id | _id | undefined | 1 |
| conversation_states | empresaId | empresas | undefined | 1 |
| agentes | _id | _id | undefined | 2 |
| agentes | empresaId | empresas | undefined | 2 |
| configuracionbots | _id | _id | undefined | 4 |
| configuracionbots | empresaId | empresas | undefined | 4 |
| configuracionbots | flujos._id | _id | undefined | 4 |
| configuracionbots | horariosAtencion._id | _id | undefined | 4 |
| clientes | _id | _id | undefined | 5 |
| clientes | empresaId | empresas | undefined | 5 |
| clientes | chatbotUserId | chatbotusers | undefined | 5 |
| clientes | preferencias._id | _id | undefined | 5 |
| configuraciones_modulo | _id | _id | undefined | 3 |
| configuraciones_modulo | empresaId | empresas | undefined | 3 |
| usuarios | _id | _id | undefined | 29 |
| usuarios | empresaId | empresas | undefined | 29 |
| usuarios | empresaTelefono | empresatelefono | undefined | 29 |
| empresas | _id | _id | undefined | 7 |
| empresas | phoneNumberId | phonenumbers | undefined | 4 |
| contactos_empresa | _id | _id | undefined | 39 |
| contactos_empresa | empresaId | empresas | undefined | 39 |
| contactos_empresa | preferencias._id | _id | undefined | 39 |
| contactos_empresa | conversaciones._id | _id | undefined | 39 |
| contactos_empresa | metricas._id | _id | undefined | 39 |
| flow_logs | _id | _id | undefined | 50 |
| flow_logs | empresaId | empresas | undefined | 50 |

## ⚙️ Configuraciones de Módulos

- **Total configuraciones:** 0

### Empresas Configuradas

