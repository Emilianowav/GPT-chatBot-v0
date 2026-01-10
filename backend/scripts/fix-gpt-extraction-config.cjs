require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

/**
 * Deshabilitar extracción legacy en nodo GPT conversacional
 * El nodo "conversacional" NO debe extraer variables, solo conversar
 * El nodo "formateador" es el que debe extraer con el método avanzado
 */

async function fixGptExtractionConfig() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB (PRODUCCIÓN)\n');
    
    const db = client.db();
    const flowsCollection = db.collection('flows');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('DESHABILITAR EXTRACCIÓN EN NODO GPT CONVERSACIONAL');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const flowId = new ObjectId('695a156681f6d67f0ae9cf40');
    const flow = await flowsCollection.findOne({ _id: flowId });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      return;
    }
    
    console.log(`✅ Flow encontrado: ${flow.nombre}\n`);
    
    let updated = false;
    
    for (let i = 0; i < flow.nodes.length; i++) {
      const node = flow.nodes[i];
      
      if (node.type === 'gpt' && node.id === 'gpt-conversacional') {
        console.log(`📦 Nodo GPT conversacional encontrado`);
        console.log(`   Configuración actual:`, JSON.stringify(node.data?.config, null, 2));
        
        // DESHABILITAR extracción en este nodo
        if (!node.data) node.data = {};
        if (!node.data.config) node.data.config = {};
        
        // Eliminar variablesRecopilar (método legacy)
        if (node.data.config.variablesRecopilar) {
          console.log(`   ❌ Eliminando variablesRecopilar (método legacy)`);
          delete node.data.config.variablesRecopilar;
        }
        
        // Eliminar extractionConfig (método avanzado)
        if (node.data.config.extractionConfig) {
          console.log(`   ❌ Eliminando extractionConfig (método avanzado)`);
          delete node.data.config.extractionConfig;
        }
        
        console.log(`   ✅ Extracción deshabilitada en nodo conversacional`);
        console.log(`   Nueva configuración:`, JSON.stringify(node.data.config, null, 2));
        updated = true;
      }
      
      if (node.type === 'gpt' && node.id === 'gpt-formateador') {
        console.log(`\n📦 Nodo GPT formateador encontrado`);
        console.log(`   Configuración actual:`, JSON.stringify(node.data?.config?.extractionConfig, null, 2));
        
        // Verificar que tenga extractionConfig correcto
        if (!node.data) node.data = {};
        if (!node.data.config) node.data.config = {};
        
        if (!node.data.config.extractionConfig) {
          console.log(`   ⚠️  No tiene extractionConfig, agregando...`);
          
          node.data.config.extractionConfig = {
            enabled: true,
            method: 'advanced',
            contextSource: 'historial_completo',
            variables: [
              {
                nombre: 'titulo',
                tipo: 'texto',
                requerido: true,
                descripcion: 'Título del libro'
              },
              {
                nombre: 'editorial',
                tipo: 'texto',
                requerido: false,
                descripcion: 'Editorial del libro'
              },
              {
                nombre: 'edicion',
                tipo: 'texto',
                requerido: false,
                descripcion: 'Edición del libro'
              }
            ]
          };
          
          console.log(`   ✅ extractionConfig agregado`);
          updated = true;
        } else {
          console.log(`   ✅ Ya tiene extractionConfig correcto`);
        }
      }
    }
    
    if (updated) {
      await flowsCollection.updateOne(
        { _id: flowId },
        { $set: { nodes: flow.nodes } }
      );
      
      console.log(`\n✅ Flow actualizado`);
    } else {
      console.log(`\n⚠️  No se realizaron cambios`);
    }
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('RESUMEN');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('✅ Nodo conversacional: SIN extracción (solo conversa)');
    console.log('✅ Nodo formateador: CON extracción avanzada');
    console.log('✅ Esto evita que "Hoka" se guarde como título/editorial/edición');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixGptExtractionConfig();
