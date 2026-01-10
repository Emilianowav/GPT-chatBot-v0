require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

async function limpiarHistorial() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db();
    const contactosCollection = db.collection('contactos_empresa');
    
    const telefono = '5493794946066';
    
    const result = await contactosCollection.updateOne(
      { telefono: telefono },
      {
        $set: {
          'conversaciones.historial': [],
          'conversaciones.saludado': false,
          'conversaciones.despedido': false,
          'conversaciones.mensaje_ids': [],
          'conversaciones.ultimo_status': '',
          'conversaciones.contactoInformado': false,
          'actualizadoEn': new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      console.log('❌ Contacto no encontrado');
    } else {
      console.log('✅ Historial limpiado exitosamente');
      console.log(`📞 Teléfono: ${telefono}`);
      console.log(`📋 Documentos modificados: ${result.modifiedCount}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

limpiarHistorial();
