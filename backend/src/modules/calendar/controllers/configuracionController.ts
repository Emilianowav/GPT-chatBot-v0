// ⚙️ Controlador de Configuración del Módulo
import { Request, Response } from 'express';
import { ConfiguracionModuloModel, TipoNegocio } from '../models/ConfiguracionModulo.js';

/**
 * Obtener configuración del módulo para una empresa
 */
export const obtenerConfiguracion = async (req: Request, res: Response) => {
  try {
    const { empresaId } = req.params;

    let configuracion = await ConfiguracionModuloModel.findOne({ empresaId });

    // Si no existe, crear configuración por defecto
    if (!configuracion) {
      configuracion = await crearConfiguracionPorDefecto(empresaId);
    }

    res.json({
      success: true,
      configuracion
    });
  } catch (error: any) {
    console.error('Error al obtener configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener configuración',
      error: error.message
    });
  }
};

/**
 * Crear o actualizar configuración del módulo
 */
export const guardarConfiguracion = async (req: Request, res: Response) => {
  try {
    const { empresaId } = req.params;
    const datosConfiguracion = req.body;

    const configuracion = await ConfiguracionModuloModel.findOneAndUpdate(
      { empresaId },
      { ...datosConfiguracion, empresaId },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Configuración guardada exitosamente',
      configuracion
    });
  } catch (error: any) {
    console.error('Error al guardar configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error al guardar configuración',
      error: error.message
    });
  }
};

/**
 * Obtener plantillas predefinidas según tipo de negocio
 */
export const obtenerPlantillas = async (req: Request, res: Response) => {
  try {
    const plantillas = {
      viajes: {
        tipoNegocio: TipoNegocio.VIAJES,
        nomenclatura: {
          turno: 'Viaje',
          turnos: 'Viajes',
          agente: 'Chofer',
          agentes: 'Choferes',
          cliente: 'Pasajero',
          clientes: 'Pasajeros',
          recurso: 'Vehículo',
          recursos: 'Vehículos'
        },
        camposPersonalizados: [
          {
            clave: 'origen',
            etiqueta: 'Origen',
            tipo: 'texto',
            requerido: true,
            placeholder: 'Ej: Av. Corrientes 1234',
            orden: 1,
            mostrarEnLista: true,
            mostrarEnCalendario: true,
            usarEnNotificacion: true
          },
          {
            clave: 'destino',
            etiqueta: 'Destino',
            tipo: 'texto',
            requerido: true,
            placeholder: 'Ej: Aeropuerto Ezeiza',
            orden: 2,
            mostrarEnLista: true,
            mostrarEnCalendario: true,
            usarEnNotificacion: true
          },
          {
            clave: 'pasajeros',
            etiqueta: 'Cantidad de pasajeros',
            tipo: 'numero',
            requerido: false,
            valorPorDefecto: 1,
            orden: 3,
            mostrarEnLista: true,
            mostrarEnCalendario: false,
            usarEnNotificacion: true,
            validacion: {
              min: 1,
              max: 8,
              mensaje: 'Debe ser entre 1 y 8 pasajeros'
            }
          },
          {
            clave: 'equipaje',
            etiqueta: 'Equipaje',
            tipo: 'select',
            requerido: false,
            opciones: ['Sin equipaje', 'Equipaje de mano', 'Valija mediana', 'Valija grande', 'Múltiples valijas'],
            orden: 4,
            mostrarEnLista: false,
            mostrarEnCalendario: false,
            usarEnNotificacion: false
          }
        ],
        usaAgentes: true,
        agenteRequerido: true,
        usaRecursos: true,
        recursoRequerido: false,
        usaHorariosDisponibilidad: false,
        duracionPorDefecto: 60,
        permiteDuracionVariable: true,
        notificaciones: [
          {
            activa: true,
            tipo: 'confirmacion',
            momento: 'noche_anterior',
            horaEnvio: '22:00',
            diasAntes: 1,
            plantillaMensaje: '🚗 *Recordatorio de viaje para mañana*\n\n📍 *Origen:* {origen}\n📍 *Destino:* {destino}\n🕐 *Hora:* {hora}\n👥 *Pasajeros:* {pasajeros}\n\n¿Confirmas tu viaje? Responde *SÍ* o *NO*',
            requiereConfirmacion: true,
            mensajeConfirmacion: '✅ ¡Perfecto! Tu viaje está confirmado. Nos vemos mañana.',
            mensajeCancelacion: '❌ Viaje cancelado. Si necesitas reprogramar, contáctanos.'
          }
        ],
        requiereConfirmacion: true,
        tiempoLimiteConfirmacion: 12,
        chatbotActivo: true,
        chatbotPuedeCrear: true,
        chatbotPuedeModificar: true,
        chatbotPuedeCancelar: true
      },
      
      consultorio: {
        tipoNegocio: TipoNegocio.CONSULTORIO,
        nomenclatura: {
          turno: 'Turno',
          turnos: 'Turnos',
          agente: 'Médico',
          agentes: 'Médicos',
          cliente: 'Paciente',
          clientes: 'Pacientes'
        },
        camposPersonalizados: [
          {
            clave: 'servicio',
            etiqueta: 'Tipo de consulta',
            tipo: 'select',
            requerido: true,
            opciones: ['Consulta general', 'Control', 'Seguimiento', 'Primera vez', 'Urgencia'],
            orden: 1,
            mostrarEnLista: true,
            mostrarEnCalendario: true,
            usarEnNotificacion: true
          },
          {
            clave: 'motivoConsulta',
            etiqueta: 'Motivo de consulta',
            tipo: 'textarea',
            requerido: false,
            placeholder: 'Describe brevemente el motivo...',
            orden: 2,
            mostrarEnLista: false,
            mostrarEnCalendario: false,
            usarEnNotificacion: false
          }
        ],
        usaAgentes: true,
        agenteRequerido: true,
        usaRecursos: false,
        recursoRequerido: false,
        usaHorariosDisponibilidad: true,
        duracionPorDefecto: 30,
        permiteDuracionVariable: true,
        notificaciones: [
          {
            activa: true,
            tipo: 'recordatorio',
            momento: 'horas_antes',
            horasAntes: 24,
            plantillaMensaje: '🏥 *Recordatorio de turno*\n\nTienes un turno programado para mañana:\n\n👨‍⚕️ *Profesional:* Dr. {agente}\n🕐 *Hora:* {hora}\n📋 *Tipo:* {servicio}\n\nTe esperamos!',
            requiereConfirmacion: false
          },
          {
            activa: true,
            tipo: 'recordatorio',
            momento: 'horas_antes',
            horasAntes: 1,
            plantillaMensaje: '⏰ Tu turno es en 1 hora\n\n🕐 *Hora:* {hora}\n👨‍⚕️ *Profesional:* Dr. {agente}\n\nNo olvides llegar 10 minutos antes.',
            requiereConfirmacion: false
          }
        ],
        requiereConfirmacion: false,
        chatbotActivo: true,
        chatbotPuedeCrear: true,
        chatbotPuedeModificar: true,
        chatbotPuedeCancelar: true
      },

      restaurante: {
        tipoNegocio: TipoNegocio.RESTAURANTE,
        nomenclatura: {
          turno: 'Reserva',
          turnos: 'Reservas',
          agente: 'Mozo',
          agentes: 'Mozos',
          cliente: 'Cliente',
          clientes: 'Clientes',
          recurso: 'Mesa',
          recursos: 'Mesas'
        },
        camposPersonalizados: [
          {
            clave: 'comensales',
            etiqueta: 'Cantidad de comensales',
            tipo: 'numero',
            requerido: true,
            valorPorDefecto: 2,
            orden: 1,
            mostrarEnLista: true,
            mostrarEnCalendario: true,
            usarEnNotificacion: true,
            validacion: {
              min: 1,
              max: 20,
              mensaje: 'Debe ser entre 1 y 20 comensales'
            }
          },
          {
            clave: 'ocasion',
            etiqueta: 'Ocasión especial',
            tipo: 'select',
            requerido: false,
            opciones: ['Ninguna', 'Cumpleaños', 'Aniversario', 'Cita romántica', 'Negocios', 'Otro'],
            orden: 2,
            mostrarEnLista: false,
            mostrarEnCalendario: false,
            usarEnNotificacion: false
          },
          {
            clave: 'preferencias',
            etiqueta: 'Preferencias alimentarias',
            tipo: 'multiselect',
            requerido: false,
            opciones: ['Vegetariano', 'Vegano', 'Sin gluten', 'Sin lactosa', 'Kosher', 'Halal'],
            orden: 3,
            mostrarEnLista: false,
            mostrarEnCalendario: false,
            usarEnNotificacion: false
          }
        ],
        usaAgentes: false,
        agenteRequerido: false,
        usaRecursos: true,
        recursoRequerido: false,
        usaHorariosDisponibilidad: true,
        duracionPorDefecto: 90,
        permiteDuracionVariable: false,
        notificaciones: [
          {
            activa: true,
            tipo: 'recordatorio',
            momento: 'horas_antes',
            horasAntes: 2,
            plantillaMensaje: '🍽️ *Recordatorio de reserva*\n\nTu mesa está lista en 2 horas:\n\n🕐 *Hora:* {hora}\n👥 *Comensales:* {comensales}\n\n¡Te esperamos!',
            requiereConfirmacion: false
          }
        ],
        requiereConfirmacion: false,
        chatbotActivo: true,
        chatbotPuedeCrear: true,
        chatbotPuedeModificar: true,
        chatbotPuedeCancelar: true
      }
    };

    res.json({
      success: true,
      plantillas
    });
  } catch (error: any) {
    console.error('Error al obtener plantillas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener plantillas',
      error: error.message
    });
  }
};

/**
 * Crear configuración por defecto para una empresa
 */
async function crearConfiguracionPorDefecto(empresaId: string) {
  const configuracionDefault = new ConfiguracionModuloModel({
    empresaId,
    tipoNegocio: TipoNegocio.PERSONALIZADO,
    nomenclatura: {
      turno: 'Turno',
      turnos: 'Turnos',
      agente: 'Profesional',
      agentes: 'Profesionales',
      cliente: 'Cliente',
      clientes: 'Clientes'
    },
    camposPersonalizados: [],
    usaAgentes: true,
    agenteRequerido: true,
    usaRecursos: false,
    recursoRequerido: false,
    usaHorariosDisponibilidad: true,
    duracionPorDefecto: 30,
    permiteDuracionVariable: true,
    notificaciones: [],
    requiereConfirmacion: false,
    chatbotActivo: true,
    chatbotPuedeCrear: true,
    chatbotPuedeModificar: true,
    chatbotPuedeCancelar: true,
    activo: true
  });

  await configuracionDefault.save();
  return configuracionDefault;
}

/**
 * Enviar notificación de prueba
 * ✅ ACTUALIZADO: Usa el nuevo sistema unificado de notificaciones con plantillas de Meta
 */
export const enviarNotificacionPrueba = async (req: Request, res: Response): Promise<void> => {
  try {
    const { empresaId, notificacion } = req.body;

    if (!empresaId || !notificacion) {
      res.status(400).json({
        success: false,
        message: 'Faltan datos requeridos: empresaId y notificacion'
      });
      return;
    }

    // Validar que se envió el teléfono
    if (!notificacion.telefono) {
      res.status(400).json({
        success: false,
        message: 'Falta el teléfono del destinatario en notificacion.telefono'
      });
      return;
    }

    // ✅ Importar el nuevo servicio unificado
    const { enviarNotificacionPrueba: enviarPruebaMeta } = await import('../../../services/notificacionesMetaService.js');
    const { normalizarTelefono } = await import('../../../utils/telefonoUtils.js');

    // Normalizar el teléfono recibido
    const telefonoNormalizado = normalizarTelefono(notificacion.telefono);
    
    console.log(`\n🧪 [Prueba] Enviando notificación de confirmación`);
    console.log(`   📞 Teléfono: ${telefonoNormalizado}`);
    console.log(`   🏢 Empresa: ${empresaId}`);

    // ✅ Usar el nuevo sistema unificado (siempre es cliente para confirmaciones)
    await enviarPruebaMeta('cliente', empresaId, telefonoNormalizado);

    // ✅ INICIAR FLUJO DE CONFIRMACIÓN después de enviar la plantilla
    console.log(`\n🔄 [Prueba] Iniciando flujo de confirmación...`);
    
    const { ConversationStateModel } = await import('../../../models/ConversationState.js');
    const { EmpresaModel } = await import('../../../models/Empresa.js');
    const { TurnoModel } = await import('../models/Turno.js');
    
    // Buscar turnos del cliente para incluir en el flujo
    const { ContactoEmpresaModel } = await import('../../../models/ContactoEmpresa.js');
    
    console.log(`   🔍 Buscando cliente: ${telefonoNormalizado} en empresa ${empresaId}`);
    const cliente = await ContactoEmpresaModel.findOne({ 
      telefono: telefonoNormalizado,
      empresaId 
    });
    
    console.log(`   📋 Cliente encontrado:`, cliente ? `${cliente.nombre} (${cliente._id})` : 'NO ENCONTRADO');
    
    if (cliente) {
      // Buscar turnos pendientes del cliente
      const ahora = new Date();
      const mañana = new Date(ahora);
      mañana.setDate(mañana.getDate() + 2);
      
      console.log(`   🔍 Buscando turnos entre ${ahora.toISOString()} y ${mañana.toISOString()}`);
      
      const turnos = await TurnoModel.find({
        empresaId,
        clienteId: cliente._id,
        fechaInicio: { $gte: ahora, $lte: mañana },
        estado: { $in: ['no_confirmado', 'pendiente'] }
      });
      
      console.log(`   📋 Turnos encontrados: ${turnos.length}`);
      
      if (turnos.length > 0) {
        const empresa = await EmpresaModel.findOne({ nombre: empresaId });
        
        console.log(`   💾 Guardando estado en ConversationState...`);
        
        const estadoGuardado = await ConversationStateModel.findOneAndUpdate(
          { telefono: telefonoNormalizado, empresaId },
          {
            telefono: telefonoNormalizado,
            empresaId,
            phoneNumberId: empresa?.phoneNumberId || process.env.META_PHONE_NUMBER_ID,
            flujo_activo: 'confirmacion_turnos',
            estado_actual: 'esperando_confirmacion',
            data: {
              turnosIds: turnos.map(t => t._id.toString()),
              clienteId: cliente._id.toString(),
              intentos: 0
            },
            ultima_interaccion: new Date()
          },
          { upsert: true, new: true }
        );
        
        console.log(`   ✅ Estado guardado:`, {
          _id: estadoGuardado._id,
          flujo_activo: estadoGuardado.flujo_activo,
          estado_actual: estadoGuardado.estado_actual
        });
        
        console.log(`🔄 Flujo de confirmación iniciado para ${telefonoNormalizado}`);
      } else {
        console.log(`   ⚠️ No se encontraron turnos pendientes para iniciar el flujo`);
      }
    } else {
      console.log(`   ⚠️ No se encontró el cliente para iniciar el flujo`);
    }

    res.json({
      success: true,
      message: `✅ Notificación de prueba enviada con plantilla de Meta`,
      telefono: telefonoNormalizado,
      tipo: 'confirmacion_turnos',
      sistema: 'plantillas_meta',
      flujoIniciado: !!cliente
    });

  } catch (error: any) {
    console.error('❌ Error al enviar notificación de prueba:', error);
    res.status(500).json({
      success: false,
      message: 'Error al enviar notificación de prueba',
      error: error.message
    });
  }
};
