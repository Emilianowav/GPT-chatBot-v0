import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function fixRouterConditions() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    console.log('═'.repeat(80));
    console.log('🔧 AGREGAR CONDICIONES FALTANTES AL ROUTER-PRINCIPAL');
    console.log('═'.repeat(80));
    
    const wooFlowId = new ObjectId('695a156681f6d67f0ae9cf40');
    const wooFlow = await flowsCollection.findOne({ _id: wooFlowId });
    
    if (!wooFlow) {
      console.log('❌ Flow no encontrado');
      return;
    }
    
    // Encontrar edges desde router-principal
    const edgesFromRouter = wooFlow.edges.filter(e => e.source === 'router-principal');
    
    console.log('\n📋 EDGES ACTUALES:\n');
    edgesFromRouter.forEach((e, i) => {
      const edgeIndex = wooFlow.edges.findIndex(edge => edge.id === e.id);
      console.log(`${i + 1}. ${e.source} → ${e.target}`);
      console.log(`   Label: ${e.data?.label || 'N/A'}`);
      console.log(`   Condition: ${e.data?.condition || '❌ FALTA'}`);
      console.log(`   Index en array: ${edgeIndex}`);
      console.log('');
    });
    
    // Agregar condiciones faltantes
    let cambios = 0;
    
    wooFlow.edges.forEach((edge, index) => {
      if (edge.source === 'router-principal') {
        // Edge a gpt-formateador (buscar_producto) - ya tiene condición ✅
        if (edge.target === 'gpt-formateador') {
          if (!edge.data?.condition) {
            edge.data = edge.data || {};
            edge.data.condition = '{{tipo_accion}} equals buscar_producto';
            edge.data.label = '🔍 Buscar Producto';
            cambios++;
            console.log(`✅ Agregada condición a edge ${index}: buscar_producto`);
          }
        }
        
        // Edges a gpt-armar-carrito
        if (edge.target === 'gpt-armar-carrito') {
          // Determinar cuál es cuál por el label
          if (edge.data?.label === '🛒 Agregar al Carrito') {
            edge.data.condition = '{{tipo_accion}} equals agregar_carrito';
            cambios++;
            console.log(`✅ Agregada condición a edge ${index}: agregar_carrito`);
          } else if (edge.data?.label === '💳 Finalizar Compra') {
            edge.data.condition = '{{tipo_accion}} equals finalizar_compra';
            cambios++;
            console.log(`✅ Agregada condición a edge ${index}: finalizar_compra`);
          }
        }
      }
    });
    
    if (cambios === 0) {
      console.log('\n✅ No hay cambios necesarios, todas las condiciones ya existen');
      return;
    }
    
    console.log(`\n💾 Guardando ${cambios} cambios...`);
    
    const result = await flowsCollection.updateOne(
      { _id: wooFlowId },
      { 
        $set: { 
          edges: wooFlow.edges,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log('✅ Cambios guardados');
    console.log(`   Modified count: ${result.modifiedCount}`);
    
    console.log('\n═'.repeat(80));
    console.log('✅ CONDICIONES DEL ROUTER CORREGIDAS');
    console.log('═'.repeat(80));
    
    console.log('\n📋 CONFIGURACIÓN FINAL:');
    console.log('   buscar_producto → gpt-formateador');
    console.log('   agregar_carrito → gpt-armar-carrito');
    console.log('   finalizar_compra → gpt-armar-carrito');
    
    console.log('\n✅ FLUJO LISTO PARA FUNCIONAR CORRECTAMENTE');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixRouterConditions();
