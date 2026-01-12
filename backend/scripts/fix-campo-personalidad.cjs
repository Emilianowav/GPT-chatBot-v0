const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

/**
 * CORREGIR CAMPO DE PERSONALIDAD
 * 
 * El modal del frontend lee: config.personalidad
 * Pero estaba guardando en: config.systemPrompt
 * 
 * Solución: Copiar systemPrompt a personalidad para nodos conversacionales
 */

async function fixCampoPersonalidad() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      return;
    }
    
    console.log('\n🔧 CORRIGIENDO CAMPO PERSONALIDAD\n');
    console.log('═'.repeat(80));
    
    const nodosGPT = flow.nodes.filter(n => n.type === 'gpt');
    
    nodosGPT.forEach(node => {
      const config = node.data.config;
      
      console.log(`\n📝 ${node.id}:`);
      console.log(`   Tipo: ${config.tipo || 'N/A'}`);
      
      if (config.tipo === 'conversacional') {
        // Para nodos conversacionales, copiar systemPrompt a personalidad
        if (config.systemPrompt && !config.personalidad) {
          config.personalidad = config.systemPrompt;
          console.log(`   ✅ Copiado systemPrompt → personalidad`);
          console.log(`   Personalidad: ${config.personalidad.substring(0, 60)}...`);
        } else if (config.personalidad) {
          console.log(`   ✅ Ya tiene personalidad`);
        }
      } else {
        // Para otros tipos (transform, formateador), mantener solo systemPrompt
        console.log(`   ✅ Mantiene systemPrompt (no conversacional)`);
      }
    });
    
    // Guardar cambios
    await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes } }
    );
    
    console.log('\n✅ Campo personalidad corregido\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixCampoPersonalidad();
