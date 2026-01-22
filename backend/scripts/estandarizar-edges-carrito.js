import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function estandarizarEdgesCarrito() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const wooFlowId = new ObjectId('695a156681f6d67f0ae9cf40');
    const wooFlow = await flowsCollection.findOne({ _id: wooFlowId });
    
    console.log('\n🔧 Estandarizando edges según ESTANDAR-EDGES-CONEXIONES.md...\n');
    
    // Buscar edges relacionados con el carrito
    const edgesCarrito = [
      'router-principal-to-gpt-carrito',
      'mercadopago-verificar-pago-to-gpt-carrito',
      'gpt-carrito-to-router-carrito',
      'router-carrito-to-mercadopago-crear-preference',
      'router-carrito-to-whatsapp-confirmacion-agregado'
    ];
    
    let cambios = 0;
    
    wooFlow.edges.forEach((edge, index) => {
      if (edgesCarrito.some(id => edge.id.includes(id) || edge.id === id)) {
        const edgeOriginal = JSON.stringify(edge);
        
        // Aplicar estándar: eliminar animated, asegurar type: "default"
        const edgeEstandarizado = {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: 'default' // Según estándar, siempre "default"
        };
        
        // Preservar sourceHandle si existe (para routers)
        if (edge.sourceHandle) {
          edgeEstandarizado.sourceHandle = edge.sourceHandle;
        }
        
        // Preservar targetHandle si existe
        if (edge.targetHandle) {
          edgeEstandarizado.targetHandle = edge.targetHandle;
        }
        
        // Preservar data si existe (labels, condiciones)
        if (edge.data && Object.keys(edge.data).length > 0) {
          edgeEstandarizado.data = edge.data;
        }
        
        // Reemplazar edge
        wooFlow.edges[index] = edgeEstandarizado;
        
        if (edgeOriginal !== JSON.stringify(edgeEstandarizado)) {
          console.log(`✅ Edge estandarizado: ${edge.id}`);
          console.log(`   ${edge.source} → ${edge.target}`);
          console.log(`   type: "${edge.type}" → "default"`);
          if (edge.animated !== undefined) {
            console.log(`   animated: ${edge.animated} → (eliminado)`);
          }
          cambios++;
        }
      }
    });
    
    if (cambios === 0) {
      console.log('ℹ️  No se encontraron edges para estandarizar');
    } else {
      console.log(`\n✅ Total de edges estandarizados: ${cambios}`);
    }
    
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
    console.log('📋 EDGES DEL CARRITO ESTANDARIZADOS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Mostrar edges relacionados con carrito
    const edgesRelacionados = wooFlow.edges.filter(e => 
      e.source === 'gpt-carrito' || 
      e.target === 'gpt-carrito' ||
      e.source === 'router-carrito' ||
      e.target === 'router-carrito'
    );
    
    console.log('Edges relacionados con el carrito:');
    edgesRelacionados.forEach(e => {
      console.log(`\n   ${e.source} → ${e.target}`);
      console.log(`   ID: ${e.id}`);
      console.log(`   Type: ${e.type}`);
      if (e.sourceHandle) console.log(`   sourceHandle: ${e.sourceHandle}`);
      if (e.data?.label) console.log(`   Label: ${e.data.label}`);
      if (e.data?.condition) {
        console.log(`   Condición: ${e.data.condition.field} ${e.data.condition.operator} "${e.data.condition.value}"`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

estandarizarEdgesCarrito();
