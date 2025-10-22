// ⚙️ Controlador de Configuración del Módulo
import { Request, Response } from 'express';
import { ConfiguracionModuloModel, TipoNegocio } from '../models/ConfiguracionModulo';

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
