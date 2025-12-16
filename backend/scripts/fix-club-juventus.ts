/**
 * Fix Club Juventus en neural_chatbot
 */
import mongoose from 'mongoose';

const uri = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority';

async function fix() {
  await mongoose.connect(uri);
  console.log('DB:', mongoose.connection.db.databaseName);
  
  // 1. Actualizar configuracion_modulo
  console.log('\n=== ACTUALIZANDO CONFIGURACION MODULO ===');
  await mongoose.connection.collection('configuraciones_modulo').updateOne(
    { empresaId: 'Club Juventus' },
    {
      $set: {
        tipoNegocio: 'canchas',
        activo: true,
        nomenclatura: {
          turno: 'Reserva',
          turnos: 'Reservas',
          agente: 'Cancha',
          agentes: 'Canchas',
          cliente: 'Jugador',
          clientes: 'Jugadores'
        },
        usaAgentes: true,
        agenteRequerido: true,
        usaRecursos: false,
        recursoRequerido: false,
        usaHorariosDisponibilidad: true,
        duracionPorDefecto: 60,
        permiteDuracionVariable: true,
        chatbotActivo: true,
        chatbotPuedeCrear: true,
        chatbotPuedeModificar: true,
        chatbotPuedeCancelar: true,
        requiereConfirmacion: false,
        variablesDinamicas: {
          nombre_empresa: 'Club Juventus',
          nomenclatura_turno: 'Reserva',
          nomenclatura_turnos: 'Reservas',
          nomenclatura_agente: 'Cancha',
          nomenclatura_agentes: 'Canchas',
          zona_horaria: 'America/Argentina/Buenos_Aires',
          moneda: 'ARS',
          idioma: 'es'
        },
        actualizadoEn: new Date()
      }
    },
    { upsert: true }
  );
  console.log('Config modulo OK');
  
  // 2. Actualizar configuracionbots
  console.log('\n=== ACTUALIZANDO CONFIGURACION BOT ===');
  await mongoose.connection.collection('configuracionbots').updateOne(
    { empresaId: 'Club Juventus' },
    {
      $set: {
        activo: true,
        mensajeBienvenida: '¡Hola! 👋 Bienvenido a Club Juventus 🎾\n\nTe ayudo a reservar tu cancha.\n\n📅 ¿Para qué fecha querés reservar?\n\nEscribí DD/MM/AAAA o "hoy" o "mañana"',
        mensajeDespedida: '¡Hasta pronto! 👋',
        mensajeError: '❌ No entendí tu respuesta.',
        timeoutMinutos: 15,
        requiereConfirmacion: true,
        permiteCancelacion: true,
        notificarAdmin: false,
        updatedAt: new Date()
      }
    },
    { upsert: true }
  );
  console.log('Config bot OK');
  
  // 3. Verificar
  console.log('\n=== VERIFICACION FINAL ===');
  const agentes = await mongoose.connection.collection('agentes').find({ empresaId: 'Club Juventus' }).toArray();
  console.log('Agentes:', agentes.length);
  agentes.forEach(a => console.log('  -', a.nombre, a.apellido));
  
  const modulo = await mongoose.connection.collection('configuraciones_modulo').findOne({ empresaId: 'Club Juventus' });
  console.log('Modulo tipoNegocio:', modulo?.tipoNegocio);
  console.log('Modulo chatbotActivo:', modulo?.chatbotActivo);
  
  const bot = await mongoose.connection.collection('configuracionbots').findOne({ empresaId: 'Club Juventus' });
  console.log('Bot activo:', bot?.activo);
  
  await mongoose.disconnect();
  console.log('\n✅ LISTO - Recarga la página del panel');
}

fix().catch(console.error);
