// ⚙️ Script para configurar notificación diaria de agentes
import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/database.js';
import { ConfiguracionModuloModel } from '../modules/calendar/models/ConfiguracionModulo.js';

/**
 * Script para configurar o actualizar la notificación diaria de agentes
 */
async function configurarNotificacionDiariaAgentes() {
  try {
    console.log('⚙️ Configurando notificación diaria de agentes...\n');
    
    // Conectar a la base de datos
    await connectDB();
    
    // CONFIGURACIÓN - Modifica estos valores según necesites
    const EMPRESA_ID = 'San Jose'; // Cambiar por el ID de tu empresa
    const HORA_ENVIO = '06:00'; // Hora de envío (formato 24h)
    const ENVIAR_A_TODOS = false; // true = todos los agentes, false = solo con turnos
    
    console.log('📋 Configuración a aplicar:');
    console.log(`   🏢 Empresa: ${EMPRESA_ID}`);
    console.log(`   ⏰ Hora de envío: ${HORA_ENVIO}`);
    console.log(`   👥 Enviar a todos: ${ENVIAR_A_TODOS ? 'Sí' : 'Solo agentes con turnos'}\n`);
    
    // Buscar configuración de la empresa
    const config = await ConfiguracionModuloModel.findOne({ empresaId: EMPRESA_ID });
    
    if (!config) {
      console.error(`❌ No se encontró configuración para empresa: ${EMPRESA_ID}`);
      console.log('💡 Verifica que el empresaId sea correcto\n');
      process.exit(1);
    }
    
    console.log('✅ Configuración de empresa encontrada\n');
    
    // Configurar notificación diaria de agentes
    config.notificacionDiariaAgentes = {
      activa: true,
      horaEnvio: HORA_ENVIO,
      enviarATodos: ENVIAR_A_TODOS,
      plantillaMensaje: 'Buenos días {agente}! 🌅\nEstos son tus {turnos} de hoy:',
      
      // Frecuencia: Diaria
      frecuencia: {
        tipo: 'diaria',
        diasSemana: [1, 2, 3, 4, 5], // Lunes a Viernes
        diaMes: undefined,
        horasIntervalo: undefined
      },
      
      // Rango horario: Solo hoy
      rangoHorario: {
        activo: true,
        tipo: 'hoy',
        diasAdelante: undefined,
        fechaInicio: undefined,
        fechaFin: undefined
      },
      
      // Filtro de horario: Todo el día
      filtroHorario: {
        activo: false,
        tipo: 'todo_el_dia',
        horaInicio: undefined,
        horaFin: undefined
      },
      
      // Filtro de estado: Pendiente y Confirmado
      filtroEstado: {
        activo: true,
        estados: ['pendiente', 'confirmado']
      },
      
      // Filtro de tipo: Desactivado (todos los tipos)
      filtroTipo: {
        activo: false,
        tipos: []
      },
      
      // Detalles a incluir
      incluirDetalles: {
        origen: true,
        destino: true,
        nombreCliente: true,
        telefonoCliente: false,
        horaReserva: true,
        notasInternas: false
      },
      
      // Sin agentes específicos (se envía según enviarATodos)
      agentesEspecificos: []
    };
    
    // Guardar cambios
    await config.save();
    
    console.log('✅ Notificación diaria de agentes configurada exitosamente\n');
    console.log('📋 Resumen de la configuración:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Activa: Sí`);
    console.log(`⏰ Hora de envío: ${HORA_ENVIO}`);
    console.log(`📅 Frecuencia: Diaria (Lunes a Viernes)`);
    console.log(`📆 Rango: Solo hoy`);
    console.log(`🕐 Horario: Todo el día`);
    console.log(`📊 Estados: Pendiente, Confirmado`);
    console.log(`👥 Destinatarios: ${ENVIAR_A_TODOS ? 'Todos los agentes' : 'Solo agentes con turnos'}`);
    console.log(`📝 Detalles incluidos:`);
    console.log(`   ✅ Origen`);
    console.log(`   ✅ Destino`);
    console.log(`   ✅ Nombre del cliente`);
    console.log(`   ✅ Hora de reserva`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('💡 Próximos pasos:');
    console.log('   1. El servidor enviará notificaciones automáticamente a las ' + HORA_ENVIO);
    console.log('   2. Puedes probar el envío con: npm run test:notificaciones-diarias');
    console.log('   3. Puedes modificar la configuración desde el frontend en Flujos Automáticos\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error configurando notificación:', error);
    process.exit(1);
  }
}

// Ejecutar
configurarNotificacionDiariaAgentes();
