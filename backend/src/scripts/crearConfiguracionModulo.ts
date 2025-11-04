// 🔧 Script para crear configuración del módulo de calendario
import mongoose from 'mongoose';
import { ConfiguracionModuloModel, TipoNegocio } from '../modules/calendar/models/ConfiguracionModulo.js';
import dotenv from 'dotenv';

dotenv.config();

async function crearConfiguracion() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Conectado a MongoDB\n');

    const empresaId = 'San Jose';

    // Verificar si ya existe
    const existente = await ConfiguracionModuloModel.findOne({ empresaId });
    
    if (existente) {
      console.log('⚠️ Ya existe una configuración para esta empresa');
      console.log(`   ID: ${existente._id}`);
      console.log(`   Activo: ${existente.activo}`);
      console.log(`   Notificaciones: ${existente.notificaciones?.length || 0}`);
      
      const respuesta = await new Promise<string>((resolve) => {
        process.stdin.once('data', (data) => resolve(data.toString().trim().toLowerCase()));
        console.log('\n¿Desea reemplazarla? (s/n): ');
      });
      
      if (respuesta !== 's') {
        console.log('❌ Operación cancelada');
        process.exit(0);
      }
      
      await ConfiguracionModuloModel.deleteOne({ empresaId });
      console.log('🗑️ Configuración anterior eliminada\n');
    }

    // Crear nueva configuración
    console.log('📝 Creando configuración del módulo...');
    
    const config = await ConfiguracionModuloModel.create({
      empresaId,
      tipoNegocio: TipoNegocio.VIAJES,
      activo: true,
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
          destinatario: 'cliente',
          momento: 'noche_anterior',
          horaEnvio: '22:00',
          diasAntes: 1,
          ejecucion: 'automatica',
          plantillaMensaje: '🚗 *Recordatorio de viaje para mañana*\n\n📍 *Origen:* {origen}\n📍 *Destino:* {destino}\n🕐 *Hora:* {hora}\n👥 *Pasajeros:* {pasajeros}\n\n¿Confirmas tu viaje? Responde *SÍ* o *NO*',
          requiereConfirmacion: true,
          mensajeConfirmacion: '✅ ¡Perfecto! Tu viaje está confirmado. Nos vemos mañana.',
          mensajeCancelacion: '❌ Viaje cancelado. Si necesitas reprogramar, contáctanos.'
        }
      ]
    });

    console.log('\n✅ Configuración creada exitosamente!');
    console.log(`   ID: ${config._id}`);
    console.log(`   Empresa: ${config.empresaId}`);
    console.log(`   Tipo: ${config.tipoNegocio}`);
    console.log(`   Activo: ${config.activo}`);
    console.log(`   Notificaciones: ${config.notificaciones.length}`);
    
    config.notificaciones.forEach((notif, i) => {
      console.log(`\n   ${i + 1}. Notificación:`);
      console.log(`      Tipo: ${notif.tipo}`);
      console.log(`      Activa: ${notif.activa}`);
      console.log(`      Momento: ${notif.momento}`);
      console.log(`      Hora envío: ${notif.horaEnvio}`);
      console.log(`      Días antes: ${notif.diasAntes}`);
    });

    console.log('\n🎉 ¡Listo! Ahora los nuevos turnos tendrán notificaciones programadas.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
    process.exit(0);
  }
}

// Ejecutar script
crearConfiguracion();
