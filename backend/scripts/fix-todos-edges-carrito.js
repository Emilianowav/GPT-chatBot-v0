import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function fixTodosEdgesCarrito() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const wooFlowId = new ObjectId('695a156681f6d67f0ae9cf40');
    const wooFlow = await flowsCollection.findOne({ _id: wooFlowId });
    
    console.log('\n🔧 Corrigiendo TODOS los edges del carrito...\n');
    
    let cambios = 0;
    
    wooFlow.edges.forEach((edge, index) => {
      // Buscar edges relacionados con carrito
      if (
        edge.source === 'gpt-carrito' || 
        edge.target === 'gpt-carrito' ||
        edge.source === 'router-carrito' ||
        edge.target === 'router-carrito' ||
        edge.source === 'router-principal' && edge.target === 'gpt-carrito' ||
        edge.source === 'mercadopago-verificar-pago'
      ) {
        const edgeOriginal = JSON.stringify(edge);
        
        // Crear edge estandarizado según ESTANDAR-EDGES-CONEXIONES.md
        const edgeEstandarizado = {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: 'default' // SIEMPRE "default" según estándar
        };
        
        // Preservar sourceHandle (para routers)
        if (edge.sourceHandle) {
          edgeEstandarizado.sourceHandle = edge.sourceHandle;
        }
        
        // Preservar targetHandle
        if (edge.targetHandle) {
          edgeEstandarizado.targetHandle = edge.targetHandle;
        }
        
        // Preservar data (labels, condiciones)
        if (edge.data && Object.keys(edge.data).length > 0) {
          edgeEstandarizado.data = edge.data;
        }
        
        // Reemplazar
        wooFlow.edges[index] = edgeEstandarizado;
        
        if (edgeOriginal !== JSON.stringify(edgeEstandarizado)) {
          console.log(`✅ ${edge.source} → ${edge.target}`);
          console.log(`   ID: ${edge.id}`);
          console.log(`   type: "${edge.type || 'undefined'}" → "default"`);
          if (edge.animated !== undefined) {
            console.log(`   animated: ${edge.animated} → (eliminado)`);
          }
          cambios++;
        }
      }
    });
    
    console.log(`\n✅ Total de edges corregidos: ${cambios}`);
    
    console.log('\n💾 Guardando cambios...');
    
    await flowsCollection.updateOne(
      { _id: wooFlowId },
      { 
        $set: { 
          edges: wooFlow.edges,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log('✅ Cambios guardados');
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ TODOS LOS EDGES ESTANDARIZADOS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Verificar resultado final
    const edgesCarrito = wooFlow.edges.filter(e => 
      e.source === 'gpt-carrito' || 
      e.target === 'gpt-carrito' ||
      e.source === 'router-carrito' ||
      e.target === 'router-carrito' ||
      (e.source === 'router-principal' && e.target === 'gpt-carrito') ||
      e.source === 'mercadopago-verificar-pago'
    );
    
    console.log('📋 EDGES DEL CARRITO (verificación final):\n');
    edgesCarrito.forEach(e => {
      console.log(`   ${e.source} → ${e.target}`);
      console.log(`   Type: ${e.type}`);
      console.log(`   Label: ${e.data?.label || 'sin label'}`);
      if (e.data?.condition) {
        console.log(`   Condición: ${e.data.condition.field} === "${e.data.condition.value}"`);
      }
      console.log('');
    });
    
    // Verificar que NO haya edges con type undefined o animated
    const edgesProblematicos = wooFlow.edges.filter(e => 
      !e.type || e.type === 'undefined' || e.animated !== undefined
    );
    
    if (edgesProblematicos.length > 0) {
      console.log('⚠️  ADVERTENCIA: Edges con problemas encontrados:');
      edgesProblematicos.forEach(e => {
        console.log(`   ${e.source} → ${e.target}: type="${e.type}", animated=${e.animated}`);
      });
    } else {
      console.log('✅ Todos los edges están correctamente estandarizados');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixTodosEdgesCarrito();
