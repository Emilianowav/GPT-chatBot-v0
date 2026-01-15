/**
 * Script para Verificar Configuración del Clasificador
 * 
 * OBJETIVO:
 * Ver exactamente qué tiene el clasificador en extractionConfig
 * 
 * FECHA: 2026-01-15
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function verificarClasificador() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    const flow = await db.collection('flows').findOne({ _id: new ObjectId(FLOW_ID) });
    
    const clasificador = flow.nodes.find(n => n.id === 'gpt-clasificador-inteligente');
    
    console.log('🔍 CONFIGURACIÓN DEL CLASIFICADOR:\n');
    console.log(JSON.stringify(clasificador.data.config, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
verificarClasificador()
  .then(() => {
    console.log('\n✅ Verificación completada\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Verificación falló:', error);
    process.exit(1);
  });
