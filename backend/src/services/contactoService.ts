// 🤖 Servicio Unificado de Contactos (reemplaza clienteAutoService + usuarioStoreMongo)
import { ContactoEmpresaModel, type IContactoEmpresa } from '../models/ContactoEmpresa.js';
import { normalizarTelefono } from '../utils/telefonoUtils.js';

interface DatosContactoWhatsApp {
  telefono: string;
  profileName?: string;
  empresaId: string;
  empresaTelefono?: string;
}

/**
 * Busca o crea un contacto desde WhatsApp
 * REEMPLAZA: buscarOCrearClienteDesdeWhatsApp() y obtenerUsuario()
 */
export async function buscarOCrearContacto(
  datos: DatosContactoWhatsApp
): Promise<IContactoEmpresa> {
  console.log('🔍 [buscarOCrearContacto] Iniciando con datos:', datos);
  
  const { telefono, profileName, empresaId, empresaTelefono } = datos;

  // Normalizar teléfono (sin +, espacios, guiones)
  const telefonoNormalizado = normalizarTelefono(telefono);
  console.log('📞 [buscarOCrearContacto] Teléfono normalizado:', {
    original: telefono,
    normalizado: telefonoNormalizado
  });

  // Buscar contacto existente
  console.log('🔍 [buscarOCrearContacto] Buscando contacto existente...');
  let contacto = await ContactoEmpresaModel.findOne({
    empresaId,
    telefono: telefonoNormalizado
  });
  
  console.log('🔍 [buscarOCrearContacto] Resultado búsqueda:', contacto ? 'ENCONTRADO' : 'NO ENCONTRADO');

  if (contacto) {
    console.log('✅ Contacto existente encontrado:', {
      id: contacto._id,
      nombre: contacto.nombre,
      telefono: contacto.telefono
    });

    // Actualizar profileName si cambió
    if (profileName && contacto.profileName !== profileName) {
      contacto.profileName = profileName;
      await contacto.save();
      console.log('📝 ProfileName actualizado:', profileName);
    }

    // Actualizar última interacción
    contacto.metricas.ultimaInteraccion = new Date();
    await contacto.save();

    return contacto;
  }

  // Contacto no existe, crear uno nuevo
  console.log('🆕 [buscarOCrearContacto] Creando nuevo contacto desde WhatsApp:', {
    telefonoOriginal: telefono,
    telefonoNormalizado,
    profileName,
    empresaId
  });

  // Extraer nombre y apellido del profileName
  console.log('📝 [buscarOCrearContacto] Extrayendo nombre y apellido...');
  let nombre = 'Cliente';
  let apellido = 'WhatsApp';

  if (profileName) {
    const partes = profileName.trim().split(' ');
    if (partes.length === 1) {
      nombre = partes[0];
      apellido = '';
    } else if (partes.length >= 2) {
      nombre = partes[0];
      apellido = partes.slice(1).join(' ');
    }
  }

  // Crear contacto
  console.log('💾 [buscarOCrearContacto] Creando documento de contacto...');
  contacto = new ContactoEmpresaModel({
    empresaId,
    telefono: telefonoNormalizado,
    nombre,
    apellido: apellido || 'Sin Apellido',
    profileName,
    origen: 'chatbot',
    activo: true,
    notas: `Contacto creado automáticamente desde WhatsApp el ${new Date().toLocaleString('es-AR')}`,
    
    // Preferencias por defecto
    preferencias: {
      aceptaWhatsApp: true,
      aceptaSMS: false,
      aceptaEmail: true,
      recordatorioTurnos: true,
      diasAnticipacionRecordatorio: 1,
      horaRecordatorio: '10:00',
      notificacionesPromocion: false,
      notificacionesDisponibilidad: false
    },
    
    // Conversaciones inicializadas
    conversaciones: {
      historial: [],
      ultimaConversacion: new Date(),
      saludado: false,
      despedido: false,
      mensaje_ids: [],
      ultimo_status: '',
      contactoInformado: false
    },
    
    // Métricas inicializadas
    metricas: {
      interacciones: 0,
      mensajesEnviados: 0,
      mensajesRecibidos: 0,
      mediaRecibidos: 0,
      tokensConsumidos: 0,
      turnosRealizados: 0,
      turnosCancelados: 0,
      ultimaInteraccion: new Date()
    }
  });

  console.log('💾 [buscarOCrearContacto] Guardando contacto en BD...');
  try {
    await contacto.save();
    console.log('✅ [buscarOCrearContacto] Contacto guardado exitosamente');
  } catch (errorGuardado) {
    console.error('❌ [buscarOCrearContacto] Error al guardar:', errorGuardado);
    throw errorGuardado;
  }

  console.log('✅ Contacto creado exitosamente:', {
    id: contacto._id,
    nombre: contacto.nombre,
    apellido: contacto.apellido,
    telefono: contacto.telefono,
    origen: contacto.origen
  });

  return contacto;
}

/**
 * Actualiza el historial de conversación de un contacto
 * PREVIENE DUPLICADOS: No agrega el mensaje si ya existe en los últimos 3 mensajes
 */
export async function actualizarHistorialConversacion(
  contactoId: string,
  mensaje: string
): Promise<void> {
  // Obtener el contacto para verificar duplicados
  const contacto = await ContactoEmpresaModel.findById(contactoId);
  
  if (!contacto) {
    console.warn(`⚠️ [actualizarHistorialConversacion] Contacto no encontrado: ${contactoId}`);
    return;
  }
  
  // Verificar si el mensaje ya existe en los últimos 3 mensajes
  const historial = contacto.conversaciones?.historial || [];
  const ultimosMensajes = historial.slice(-3);
  
  if (ultimosMensajes.includes(mensaje)) {
    console.log(`⏭️ [actualizarHistorialConversacion] Mensaje duplicado detectado, omitiendo: "${mensaje.substring(0, 50)}..."`);
    return;
  }
  
  // Si no es duplicado, agregar al historial
  await ContactoEmpresaModel.findByIdAndUpdate(
    contactoId,
    {
      $push: { 'conversaciones.historial': mensaje },
      $set: { 
        'conversaciones.ultimaConversacion': new Date(),
        'metricas.ultimaInteraccion': new Date()
      }
    }
  );
  
  console.log(`✅ [actualizarHistorialConversacion] Mensaje guardado: "${mensaje.substring(0, 50)}..."`);
}

/**
 * Actualiza métricas de un contacto
 */
export async function actualizarMetricas(
  contactoId: string,
  metricas: {
    mensajesEnviados?: number;
    mensajesRecibidos?: number;
    mediaRecibidos?: number;
    tokensConsumidos?: number;
    interacciones?: number;
  }
): Promise<void> {
  const update: any = {
    'metricas.ultimaInteraccion': new Date()
  };

  if (metricas.mensajesEnviados !== undefined) {
    update['metricas.mensajesEnviados'] = metricas.mensajesEnviados;
  }
  if (metricas.mensajesRecibidos !== undefined) {
    update['metricas.mensajesRecibidos'] = metricas.mensajesRecibidos;
  }
  if (metricas.mediaRecibidos !== undefined) {
    update['metricas.mediaRecibidos'] = metricas.mediaRecibidos;
  }
  if (metricas.tokensConsumidos !== undefined) {
    update['metricas.tokensConsumidos'] = metricas.tokensConsumidos;
  }
  if (metricas.interacciones !== undefined) {
    update['metricas.interacciones'] = metricas.interacciones;
  }

  await ContactoEmpresaModel.findByIdAndUpdate(contactoId, { $set: update });
}

/**
 * Incrementa métricas de un contacto
 */
export async function incrementarMetricas(
  contactoId: string,
  metricas: {
    mensajesEnviados?: number;
    mensajesRecibidos?: number;
    mediaRecibidos?: number;
    tokensConsumidos?: number;
    interacciones?: number;
  }
): Promise<void> {
  const updateInc: any = {};
  const updateSet: any = {
    'metricas.ultimaInteraccion': new Date()
  };

  if (metricas.mensajesEnviados) {
    updateInc['metricas.mensajesEnviados'] = metricas.mensajesEnviados;
  }
  if (metricas.mensajesRecibidos) {
    updateInc['metricas.mensajesRecibidos'] = metricas.mensajesRecibidos;
  }
  if (metricas.mediaRecibidos) {
    updateInc['metricas.mediaRecibidos'] = metricas.mediaRecibidos;
  }
  if (metricas.tokensConsumidos) {
    updateInc['metricas.tokensConsumidos'] = metricas.tokensConsumidos;
  }
  if (metricas.interacciones) {
    updateInc['metricas.interacciones'] = metricas.interacciones;
  }

  await ContactoEmpresaModel.findByIdAndUpdate(contactoId, { 
    $inc: updateInc,
    $set: updateSet
  });
}

/**
 * Actualiza el estado de conversación de un contacto
 */
export async function actualizarEstadoConversacion(
  contactoId: string,
  estado: {
    saludado?: boolean;
    despedido?: boolean;
    ultima_saludo?: string;
    resumen?: string;
    ultimo_status?: string;
    contactoInformado?: boolean;
  }
): Promise<void> {
  const update: any = {};

  if (estado.saludado !== undefined) {
    update['conversaciones.saludado'] = estado.saludado;
  }
  if (estado.despedido !== undefined) {
    update['conversaciones.despedido'] = estado.despedido;
  }
  if (estado.ultima_saludo !== undefined) {
    update['conversaciones.ultima_saludo'] = estado.ultima_saludo;
  }
  if (estado.resumen !== undefined) {
    update['conversaciones.resumen'] = estado.resumen;
  }
  if (estado.ultimo_status !== undefined) {
    update['conversaciones.ultimo_status'] = estado.ultimo_status;
  }
  if (estado.contactoInformado !== undefined) {
    update['conversaciones.contactoInformado'] = estado.contactoInformado;
  }

  await ContactoEmpresaModel.findByIdAndUpdate(contactoId, { $set: update });
}

/**
 * Limpia el historial de conversación de un contacto
 */
export async function limpiarHistorial(contactoId: string): Promise<void> {
  await ContactoEmpresaModel.findByIdAndUpdate(contactoId, {
    $set: {
      'conversaciones.historial': [],
      'conversaciones.saludado': false,
      'conversaciones.despedido': false,
      'conversaciones.ultimo_status': 'reset',
      'metricas.mensajesEnviados': 0,
      'metricas.mensajesRecibidos': 0,
      'metricas.mediaRecibidos': 0,
      'metricas.interacciones': 0,
      'metricas.tokensConsumidos': 0
    }
  });
}

/**
 * Actualiza el sector de un contacto
 */
export async function actualizarSectorContacto(
  contactoId: string,
  sector: string
): Promise<IContactoEmpresa | null> {
  const contacto = await ContactoEmpresaModel.findByIdAndUpdate(
    contactoId,
    { sector },
    { new: true }
  );

  if (contacto) {
    console.log('✅ Sector actualizado:', {
      contactoId,
      sector,
      nombre: contacto.nombre
    });
  }

  return contacto;
}

/**
 * Obtiene todos los contactos de un sector
 */
export async function obtenerContactosPorSector(
  empresaId: string,
  sector: string
): Promise<IContactoEmpresa[]> {
  return await ContactoEmpresaModel.find({
    empresaId,
    sector,
    activo: true
  }).sort({ nombre: 1, apellido: 1 });
}

/**
 * Busca un contacto por teléfono
 */
export async function buscarContactoPorTelefono(
  empresaId: string,
  telefono: string
): Promise<IContactoEmpresa | null> {
  const telefonoNorm = normalizarTelefono(telefono);
  
  return await ContactoEmpresaModel.findOne({
    empresaId,
    telefono: telefonoNorm
  });
}

/**
 * Busca un contacto por ID
 */
export async function buscarContactoPorId(
  contactoId: string
): Promise<IContactoEmpresa | null> {
  return await ContactoEmpresaModel.findById(contactoId);
}

/**
 * Obtiene todos los contactos de una empresa
 */
export async function obtenerContactosEmpresa(
  empresaId: string,
  filtros?: {
    activo?: boolean;
    sector?: string;
    origen?: 'chatbot' | 'manual' | 'importacion';
  }
): Promise<IContactoEmpresa[]> {
  const query: any = { empresaId };
  
  if (filtros?.activo !== undefined) {
    query.activo = filtros.activo;
  }
  if (filtros?.sector) {
    query.sector = filtros.sector;
  }
  if (filtros?.origen) {
    query.origen = filtros.origen;
  }
  
  return await ContactoEmpresaModel.find(query)
    .sort({ 'metricas.ultimaInteraccion': -1 });
}

/**
 * Actualiza datos de un contacto
 */
export async function actualizarContacto(
  contactoId: string,
  datos: Partial<IContactoEmpresa>
): Promise<IContactoEmpresa | null> {
  // Si se actualiza el teléfono, normalizarlo
  if (datos.telefono) {
    datos.telefono = normalizarTelefono(datos.telefono);
  }
  
  return await ContactoEmpresaModel.findByIdAndUpdate(
    contactoId,
    { $set: datos },
    { new: true }
  );
}

/**
 * Incrementa contador de turnos
 */
export async function incrementarTurnos(
  contactoId: string,
  tipo: 'realizados' | 'cancelados'
): Promise<void> {
  const field = tipo === 'realizados' 
    ? 'metricas.turnosRealizados' 
    : 'metricas.turnosCancelados';
    
  await ContactoEmpresaModel.findByIdAndUpdate(
    contactoId,
    { $inc: { [field]: 1 } }
  );
}
