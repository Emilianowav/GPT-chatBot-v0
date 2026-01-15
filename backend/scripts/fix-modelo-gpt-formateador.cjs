require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

/**
 * CAMBIAR MODELO DEL FORMATEADOR A GPT-3.5-TURBO
 * 
 * Error: "No hay información de costos para el modelo: gpt-4o-mini"
 * Solución: Usar gpt-3.5-turbo que sí tiene costos configurados
 */

async function fixModeloGptFormateador() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB (PRODUCCIÓN)\n');
    
    const db = client.db();
    const flowsCollection = db.collection('flows');
    
    const FLOW_ID = new ObjectId('695a156681f6d67f0ae9cf40');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('CAMBIAR MODELO A GPT-3.5-TURBO');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const flow = await flowsCollection.findOne({ _id: FLOW_ID });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      return;
    }
    
    console.log(`✅ Flow encontrado: ${flow.nombre}\n`);
    
    // Actualizar nodo GPT formateador
    for (let i = 0; i < flow.nodes.length; i++) {
      const node = flow.nodes[i];
      
      if (node.type === 'gpt' && node.id === 'gpt-formateador') {
        console.log('📦 Nodo GPT formateador encontrado');
        console.log(`   Modelo actual: ${node.data?.config?.modelo}`);
        
        if (!node.data) node.data = {};
        if (!node.data.config) node.data.config = {};
        
        // Cambiar a gpt-3.5-turbo
        node.data.config.modelo = 'gpt-3.5-turbo';
        
        console.log(`   ✅ Modelo cambiado a: gpt-3.5-turbo`);
        console.log(`   ✅ Tiene costos configurados en openaiService.ts`);
      }
    }
    
    // Guardar
    await flowsCollection.updateOne(
      { _id: FLOW_ID },
      { $set: { nodes: flow.nodes } }
    );
    
    console.log('\n✅ Flow actualizado en base de datos\n');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('VERIFICACIÓN');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const updatedFlow = await flowsCollection.findOne({ _id: FLOW_ID });
    const gptForm = updatedFlow.nodes.find(n => n.id === 'gpt-formateador');
    
    console.log('📋 Configuración del formateador:');
    console.log(`   Modelo: ${gptForm.data?.config?.modelo}`);
    console.log(`   Temperatura: ${gptForm.data?.config?.temperatura}`);
    console.log('');
    
    if (gptForm.data?.config?.modelo === 'gpt-3.5-turbo') {
      console.log('✅ Modelo correcto (gpt-3.5-turbo)');
      console.log('✅ No habrá error de costos');
    } else {
      console.log('⚠️  Modelo incorrecto');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixModeloGptFormateador();
