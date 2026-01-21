/**
 * Script para revisar la estructura de tópicos en la BD
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';

async function revisarTopicos() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    
    // Buscar colecciones relacionadas con tópicos
    const collections = await db.listCollections().toArray();
    
    console.log('📋 COLECCIONES DISPONIBLES:');
    collections.forEach(col => {
      if (col.name.includes('topic') || col.name.includes('topico')) {
        console.log(`   ✅ ${col.name}`);
      }
    });
    
    // Buscar en empresas si tienen tópicos
    const empresa = await db.collection('empresas').findOne({ nombre: 'Veo Veo' });
    
    if (empresa) {
      console.log('\n📊 EMPRESA VEO VEO:');
      console.log(`   _id: ${empresa._id}`);
      console.log(`   nombre: ${empresa.nombre}`);
      
      if (empresa.topics || empresa.topicos) {
        console.log('\n   📚 TÓPICOS ENCONTRADOS:');
        const topicos = empresa.topics || empresa.topicos;
        console.log(JSON.stringify(topicos, null, 2));
      } else {
        console.log('\n   ⚠️  No tiene tópicos definidos');
        console.log('\n   📋 Campos disponibles:');
        Object.keys(empresa).forEach(key => {
          console.log(`      - ${key}`);
        });
      }
    }
    
    // Buscar en flows si tienen referencia a tópicos
    const flow = await db.collection('flows').findOne({ 
      _id: new ObjectId('695a156681f6d67f0ae9cf40') 
    });
    
    if (flow) {
      console.log('\n\n📊 FLUJO VEO VEO:');
      console.log(`   _id: ${flow._id}`);
      console.log(`   name: ${flow.name}`);
      
      // Buscar nodos GPT
      const nodosGPT = flow.nodes.filter(n => n.type === 'gpt');
      
      console.log(`\n   🤖 NODOS GPT (${nodosGPT.length}):`);
      nodosGPT.forEach(nodo => {
        console.log(`\n      - ${nodo.id}`);
        if (nodo.data?.config?.topics || nodo.data?.config?.topicos) {
          console.log(`        ✅ Tiene tópicos configurados`);
          console.log(JSON.stringify(nodo.data.config.topics || nodo.data.config.topicos, null, 2));
        } else {
          console.log(`        ⚠️  No tiene tópicos`);
        }
        
        if (nodo.data?.config?.systemPrompt) {
          const promptLength = nodo.data.config.systemPrompt.length;
          console.log(`        📝 SystemPrompt: ${promptLength} caracteres`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
revisarTopicos()
  .then(() => {
    console.log('\n✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
