const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function analizarFormateador() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    const formateador = flow.nodes.find(n => n.id === 'gpt-formateador');
    
    console.log('📊 CONFIGURACIÓN ACTUAL DEL FORMATEADOR:\n');
    console.log('═══════════════════════════════════════\n');
    
    console.log('🔧 extractionConfig:');
    console.log(JSON.stringify(formateador.data.config.extractionConfig, null, 2));
    console.log('\n');
    
    console.log('📋 VARIABLES A EXTRAER:');
    formateador.data.config.extractionConfig.variables.forEach((v, i) => {
      console.log(`${i + 1}. ${v.nombre}`);
      console.log(`   - Tipo: ${v.tipo}`);
      console.log(`   - Requerido: ${v.requerido}`);
      console.log(`   - Descripción: ${v.descripcion || 'N/A'}`);
      console.log('');
    });
    
    console.log('💡 ANÁLISIS:');
    console.log('   El formateador debe ser GENÉRICO');
    console.log('   - Recibe: extractionConfig.variables (configurado desde frontend)');
    console.log('   - Devuelve: JSON con las variables extraídas');
    console.log('   - NO debe tener lógica específica de dominio (libros, productos, etc.)');
    console.log('   - El systemPrompt debe generarse dinámicamente basado en las variables');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

analizarFormateador();
