import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function copiarWorkflowICenterAJuventus() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const db = mongoose.connection.db;

    // 1. Obtener workflow de iCenter
    const apiICenter = await db.collection('api_configurations').findOne({ 
      nombre: /icenter/i 
    });

    if (!apiICenter || !apiICenter.workflows || apiICenter.workflows.length === 0) {
      console.error('❌ No se encontró workflow de iCenter');
      process.exit(1);
    }

    const workflowICenter = apiICenter.workflows[0];
    console.log('📋 Workflow iCenter encontrado:', workflowICenter.nombre);
    console.log('📊 Pasos:', workflowICenter.steps?.length || 0);

    // 2. Obtener API de Juventus
    const apiJuventus = await db.collection('api_configurations').findOne({ 
      nombre: /mis canchas/i 
    });

    if (!apiJuventus) {
      console.error('❌ No se encontró API de Juventus');
      process.exit(1);
    }

    console.log('📋 API Juventus encontrada:', apiJuventus.nombre);

    // 3. Adaptar workflow para Juventus
    const workflowJuventus = {
      _id: new mongoose.Types.ObjectId(),
      nombre: 'Juventus - Reserva de Canchas',
      descripcion: 'Flujo para reservar canchas en Club Juventus',
      activo: true,
      prioridad: 25,
      trigger: {
        tipo: 'keyword',
        keywords: ['reservar', 'turno', 'cancha', 'reserva', 'quiero reservar', 'hola', 'menu']
      },
      mensajeInicial: '¡Hola! 👋\nBienvenido a Club Juventus 🎾\n\nTe ayudo a reservar tu cancha.',
      steps: [
        {
          _id: new mongoose.Types.ObjectId(),
          orden: 1,
          nombre: 'Solicitar fecha',
          tipo: 'recopilar',
          nombreVariable: 'fecha',
          pregunta: '📅 ¿Para qué fecha querés reservar?\n\nEscribí la fecha en formato DD/MM/AAAA o escribí "hoy" o "mañana"',
          validacion: {
            tipo: 'texto',
            requerido: true
          }
        }
      ]
    };

    // 4. Actualizar API de Juventus
    await db.collection('api_configurations').updateOne(
      { _id: apiJuventus._id },
      { 
        $set: { 
          workflows: [workflowJuventus]
        } 
      }
    );

    console.log('\n✅ Workflow actualizado para Juventus');
    console.log('📋 Pasos:', workflowJuventus.steps.length);
    console.log('\n🚀 Probá escribiendo "reservar" en WhatsApp');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado');
  }
}

copiarWorkflowICenterAJuventus();
