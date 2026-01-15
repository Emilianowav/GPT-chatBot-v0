import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const FLOW_ID = '695a156681f6d67f0ae9cf39';

async function fixMensajeWhatsApp() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;
    
    // Actualizar el nodo whatsapp-send-message para usar el ID correcto
    const resultado = await db.collection('flows').updateOne(
      { _id: new mongoose.Types.ObjectId(FLOW_ID) },
      { 
        $set: {
          'nodes.$[elem].data.config.message': '{{gpt-conversacional.respuesta_gpt}}',
          updatedAt: new Date()
        }
      },
      {
        arrayFilters: [{ 'elem.id': 'whatsapp-send-message' }]
      }
    );

    console.log('✅ Nodo WhatsApp actualizado');
    console.log('   Documentos modificados:', resultado.modifiedCount);
    
    // Verificar
    const flujo = await db.collection('flows').findOne({ 
      _id: new mongoose.Types.ObjectId(FLOW_ID)
    });
    
    const nodoWhatsApp = flujo.nodes.find(n => n.id === 'whatsapp-send-message');
    console.log('\n📋 Configuración del nodo WhatsApp:');
    console.log('   Message:', nodoWhatsApp.data.config.message);
    console.log('   To:', nodoWhatsApp.data.config.to);

    await mongoose.disconnect();
    console.log('\n✅ Desconectado');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

fixMensajeWhatsApp();
