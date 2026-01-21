/**
 * Script para arreglar los edges del router-principal
 * Agregar sourceHandle correcto a cada edge
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function arreglarEdgesRouterPrincipal() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    
    const flow = await db.collection('flows').findOne({ 
      _id: new ObjectId(FLOW_ID) 
    });
    
    if (!flow) {
      throw new Error('❌ Flujo no encontrado');
    }
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔧 ARREGLANDO EDGES DEL ROUTER-PRINCIPAL');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Buscar edges que salen de router-principal
    const edgesFromRouter = flow.edges.filter(e => e.source === 'router-principal');
    
    console.log(`📋 Edges desde router-principal: ${edgesFromRouter.length}\n`);
    
    edgesFromRouter.forEach(edge => {
      console.log(`Edge: ${edge.id}`);
      console.log(`   Target: ${edge.target}`);
      console.log(`   SourceHandle actual: ${edge.sourceHandle || 'N/A'}`);
    });
    
    // Mapeo de targets a sourceHandles
    const targetToHandle = {
      'gpt-formateador': 'route-buscar-producto',
      'gpt-armar-carrito': 'route-comprar',
      // Agregar más según sea necesario
    };
    
    console.log('\n🔄 Actualizando sourceHandles...\n');
    
    let edgesActualizados = 0;
    
    flow.edges.forEach(edge => {
      if (edge.source === 'router-principal') {
        const nuevoHandle = targetToHandle[edge.target];
        
        if (nuevoHandle) {
          console.log(`✅ ${edge.id}: ${edge.sourceHandle || 'N/A'} → ${nuevoHandle}`);
          edge.sourceHandle = nuevoHandle;
          edgesActualizados++;
        } else {
          console.log(`⚠️  ${edge.id}: No se encontró mapeo para target "${edge.target}"`);
        }
      }
    });
    
    if (edgesActualizados > 0) {
      // Guardar
      await db.collection('flows').updateOne(
        { _id: new ObjectId(FLOW_ID) },
        { 
          $set: { 
            edges: flow.edges,
            updatedAt: new Date()
          } 
        }
      );
      
      console.log(`\n✅ ${edgesActualizados} edges actualizados`);
    } else {
      console.log('\nℹ️  No se actualizaron edges');
    }
    
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
arreglarEdgesRouterPrincipal()
  .then(() => {
    console.log('✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
