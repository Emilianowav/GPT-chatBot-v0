import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function verificarEndpoint() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    const api = await db.collection('api_configurations').findOne({
      nombre: /mis canchas/i
    });

    if (!api) {
      console.log('❌ No se encontró API');
      await mongoose.disconnect();
      return;
    }

    console.log('📋 API:', api.nombre);
    console.log('');

    // Buscar endpoint crear-reserva
    const crearReservaEndpoint = api.endpoints.find(e => 
      e.id === 'crear-reserva' || 
      e.id === 'pre-crear-reserva' ||
      e.nombre?.toLowerCase().includes('crear') ||
      e.nombre?.toLowerCase().includes('reserva')
    );

    if (crearReservaEndpoint) {
      console.log('✅ ENDPOINT ENCONTRADO:\n');
      console.log('   ID:', crearReservaEndpoint.id);
      console.log('   Nombre:', crearReservaEndpoint.nombre);
      console.log('   Método:', crearReservaEndpoint.metodo);
      console.log('   Path:', crearReservaEndpoint.path);
      console.log('   _id:', crearReservaEndpoint._id);
      console.log('');
      
      if (crearReservaEndpoint.parametros) {
        console.log('   Parámetros:');
        console.log(JSON.stringify(crearReservaEndpoint.parametros, null, 2));
      }
    } else {
      console.log('❌ NO SE ENCONTRÓ ENDPOINT DE CREAR RESERVA\n');
      console.log('Endpoints disponibles:');
      api.endpoints.forEach(e => {
        console.log(`  - ${e.id}: ${e.nombre} (${e.metodo} ${e.path})`);
      });
      console.log('');
      console.log('💡 NECESITAS CREAR EL ENDPOINT:');
      console.log('   ID: crear-reserva');
      console.log('   Método: POST');
      console.log('   Path: /bookings');
      console.log('   Body: { cancha_id, fecha, hora_inicio, duracion, cliente }');
    }

    // Verificar workflow
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📋 VERIFICANDO WORKFLOW');
    console.log('═══════════════════════════════════════════════════════\n');

    if (api.workflows && api.workflows.length > 0) {
      const workflow = api.workflows[0];
      
      // Buscar paso que genera PaymentLink
      const pasoPayment = workflow.steps.find(s => 
        s.pregunta?.toLowerCase().includes('pago') ||
        s.pregunta?.toLowerCase().includes('link')
      );

      if (pasoPayment) {
        console.log('✅ Paso de generación de PaymentLink encontrado:');
        console.log('   Índice:', workflow.steps.indexOf(pasoPayment));
        console.log('   Pregunta:', pasoPayment.pregunta);
        console.log('   Tipo:', pasoPayment.tipo);
        console.log('   EndpointId:', pasoPayment.endpointId);
        console.log('');
        
        console.log('💡 Este paso debe:');
        console.log('   1. Llamar al endpoint que genera el PaymentLink');
        console.log('   2. Guardar pendingBooking con:');
        console.log('      - apiConfigId');
        console.log('      - endpointId: "crear-reserva"');
        console.log('      - bookingData: { cancha_id, fecha, hora_inicio, duracion, cliente }');
      } else {
        console.log('⚠️  No se encontró paso de generación de PaymentLink');
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Verificación completada');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificarEndpoint();
