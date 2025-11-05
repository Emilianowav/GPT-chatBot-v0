// Script para verificar la configuración de notificación diaria de agentes en MongoDB
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Importar modelo
import { ConfiguracionModuloModel } from '../modules/calendar/models/ConfiguracionModulo';

async function verNotificacionDiariaAgentes() {
  try {
    // Conectar a MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');

    // Buscar todas las configuraciones
    const configuraciones = await ConfiguracionModuloModel.find({});
    
    console.log(`\n📊 Total de empresas con configuración: ${configuraciones.length}\n`);

    for (const config of configuraciones) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🏢 Empresa ID: ${config.empresaId}`);
      console.log(`📋 Tipo de Negocio: ${config.tipoNegocio}`);
      
      if (config.notificacionDiariaAgentes) {
        console.log('\n✅ TIENE CONFIGURACIÓN DE NOTIFICACIÓN DIARIA PARA AGENTES:');
        console.log('─────────────────────────────────────────────────────────');
        
        const notif = config.notificacionDiariaAgentes;
        
        console.log(`🔔 Estado: ${notif.activa ? '🟢 ACTIVA' : '🔴 INACTIVA'}`);
        console.log(`⏰ Hora de Envío: ${notif.horaEnvio}`);
        console.log(`👥 Enviar a Todos: ${notif.enviarATodos ? 'Sí' : 'No (solo con turnos)'}`);
        console.log(`📝 Plantilla: ${notif.plantillaMensaje?.substring(0, 50)}...`);
        
        if (notif.frecuencia) {
          console.log(`\n📅 Frecuencia:`);
          console.log(`   Tipo: ${notif.frecuencia.tipo}`);
          if (notif.frecuencia.diasSemana && notif.frecuencia.diasSemana.length > 0) {
            const nombresDias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            const dias = notif.frecuencia.diasSemana.map(d => nombresDias[d]).join(', ');
            console.log(`   Días: ${dias}`);
          }
        }
        
        if (notif.rangoHorario) {
          console.log(`\n📆 Rango Horario:`);
          console.log(`   Activo: ${notif.rangoHorario.activo ? 'Sí' : 'No'}`);
          console.log(`   Tipo: ${notif.rangoHorario.tipo}`);
        }
        
        if (notif.filtroEstado) {
          console.log(`\n📊 Filtro de Estado:`);
          console.log(`   Activo: ${notif.filtroEstado.activo ? 'Sí' : 'No'}`);
          console.log(`   Estados: ${notif.filtroEstado.estados.join(', ')}`);
        }
        
        if (notif.incluirDetalles) {
          console.log(`\n📋 Detalles a Incluir:`);
          console.log(`   Origen: ${notif.incluirDetalles.origen ? '✅' : '❌'}`);
          console.log(`   Destino: ${notif.incluirDetalles.destino ? '✅' : '❌'}`);
          console.log(`   Nombre Cliente: ${notif.incluirDetalles.nombreCliente ? '✅' : '❌'}`);
          console.log(`   Teléfono Cliente: ${notif.incluirDetalles.telefonoCliente ? '✅' : '❌'}`);
          console.log(`   Hora Reserva: ${notif.incluirDetalles.horaReserva ? '✅' : '❌'}`);
          console.log(`   Notas Internas: ${notif.incluirDetalles.notasInternas ? '✅' : '❌'}`);
        }
        
      } else {
        console.log('\n❌ NO TIENE CONFIGURACIÓN DE NOTIFICACIÓN DIARIA PARA AGENTES');
        console.log('   Para configurar, ejecuta: npm run config:notif-diaria-agentes');
      }
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    // Mostrar información de la colección
    console.log('\n📚 INFORMACIÓN DE LA COLECCIÓN EN MONGODB:');
    console.log('─────────────────────────────────────────────────────────');
    console.log(`📦 Colección: configuracion_modulos`);
    console.log(`🔑 Campo: notificacionDiariaAgentes`);
    console.log(`📄 Tipo: Objeto (NotificacionDiariaAgentes)`);
    console.log(`\n💡 Para ver en MongoDB Compass o CLI:`);
    console.log(`   db.configuracion_modulos.find({ "notificacionDiariaAgentes.activa": true })`);
    console.log(`\n💡 Para ver todas las configuraciones:`);
    console.log(`   db.configuracion_modulos.find({}, { empresaId: 1, "notificacionDiariaAgentes.activa": 1 })`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  }
}

// Ejecutar
verNotificacionDiariaAgentes();
