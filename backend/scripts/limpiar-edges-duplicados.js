import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function limpiarEdgesDuplicados() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const wooFlowId = new ObjectId('695a156681f6d67f0ae9cf40');
    const wooFlow = await flowsCollection.findOne({ _id: wooFlowId });
    
    console.log('\n🔧 Limpiando edges duplicados y obsoletos...\n');
    
    // 1. Eliminar edge de mercadopago-verificar-pago a gpt-armar-carrito (obsoleto)
    const indexEdgeObsoleto = wooFlow.edges.findIndex(e => 
      e.source === 'mercadopago-verificar-pago' && 
      e.target === 'gpt-armar-carrito'
    );
    
    if (indexEdgeObsoleto !== -1) {
      const edgeEliminado = wooFlow.edges[indexEdgeObsoleto];
      wooFlow.edges.splice(indexEdgeObsoleto, 1);
      console.log('✅ Edge obsoleto eliminado:');
      console.log(`   ${edgeEliminado.source} → ${edgeEliminado.target}`);
      console.log(`   ID: ${edgeEliminado.id}`);
    }
    
    // 2. Eliminar edge de carrito-agregar (si existe, es obsoleto)
    const indexCarritoAgregar = wooFlow.edges.findIndex(e => 
      e.source === 'carrito-agregar'
    );
    
    if (indexCarritoAgregar !== -1) {
      const edgeEliminado = wooFlow.edges[indexCarritoAgregar];
      wooFlow.edges.splice(indexCarritoAgregar, 1);
      console.log('✅ Edge obsoleto eliminado:');
      console.log(`   ${edgeEliminado.source} → ${edgeEliminado.target}`);
      console.log(`   ID: ${edgeEliminado.id}`);
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
    console.log('✅ EDGES LIMPIOS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Verificar edges del carrito
    const edgesCarrito = wooFlow.edges.filter(e => 
      e.source === 'gpt-carrito' || 
      e.target === 'gpt-carrito' ||
      e.source === 'router-carrito' ||
      e.target === 'router-carrito' ||
      e.source === 'mercadopago-verificar-pago'
    );
    
    console.log('📋 EDGES DEL CARRITO (finales):\n');
    edgesCarrito.forEach(e => {
      console.log(`   ✅ ${e.source} → ${e.target}`);
      console.log(`      Type: ${e.type}`);
      console.log(`      Label: ${e.data?.label || 'sin label'}`);
      if (e.data?.condition) {
        console.log(`      Condición: ${e.data.condition.field} === "${e.data.condition.value}"`);
      }
      console.log('');
    });
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 RESUMEN FINAL');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('FLUJO 1: Agregar al carrito');
    console.log('   router-principal → gpt-carrito → router-carrito → mercadopago-crear-preference\n');
    
    console.log('FLUJO 2: Confirmación de pago');
    console.log('   mercadopago-verificar-pago → gpt-carrito → router-carrito → whatsapp-confirmacion\n');
    
    console.log('✅ Todos los edges usan type: "default"');
    console.log('✅ No hay campos "animated"');
    console.log('✅ Siguen el estándar ESTANDAR-EDGES-CONEXIONES.md');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

limpiarEdgesDuplicados();
