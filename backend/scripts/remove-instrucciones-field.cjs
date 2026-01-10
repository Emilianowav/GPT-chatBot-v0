require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

/**
 * Script para eliminar el campo 'instrucciones' de los nodos GPT
 * El systemPrompt se debe construir automáticamente desde personalidad + topicos + variablesRecopilar
 */

async function removeInstruccionesField() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db();
    const flowsCollection = db.collection('flows');
    
    const flowId = new ObjectId('695a156681f6d67f0ae9cf40');
    const flow = await flowsCollection.findOne({ _id: flowId });
    
    if (!flow) {
      console.log('❌ Flujo no encontrado');
      return;
    }
    
    console.log('🔍 Buscando nodos con campo "instrucciones"...\n');
    
    const updatedNodes = flow.nodes.map(node => {
      if (node.type === 'gpt' && node.data.config.instrucciones) {
        console.log(`📝 Nodo: ${node.data.label} (${node.id})`);
        console.log(`   ❌ Eliminando campo "instrucciones"`);
        console.log(`   ✅ El systemPrompt se construirá desde:`);
        console.log(`      - personalidad: ${node.data.config.personalidad ? 'SÍ' : 'NO'}`);
        console.log(`      - topicos: ${node.data.config.topicos?.length || 0}`);
        console.log(`      - variablesRecopilar: ${node.data.config.variablesRecopilar?.length || 0}`);
        console.log('');
        
        const { instrucciones, ...configSinInstrucciones } = node.data.config;
        
        return {
          ...node,
          data: {
            ...node.data,
            config: configSinInstrucciones
          }
        };
      }
      return node;
    });
    
    await flowsCollection.updateOne(
      { _id: flowId },
      { 
        $set: { 
          nodes: updatedNodes,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log('✅ Campo "instrucciones" eliminado de todos los nodos GPT');
    console.log('\n📋 CÓMO FUNCIONA AHORA:');
    console.log('   1. Frontend envía: personalidad, topicos, variablesRecopilar');
    console.log('   2. Backend construye systemPrompt automáticamente con GPTPromptBuilder.buildSystemPrompt()');
    console.log('   3. El systemPrompt se genera dinámicamente en cada ejecución');
    console.log('\n✅ Esto permite que los cambios desde el frontend se reflejen inmediatamente');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

removeInstruccionesField();
