const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function corregirConexiones() {
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
    
    console.log('\n🔧 CORRIGIENDO CONEXIONES DE ROUTERS\n');
    console.log('═'.repeat(80));
    
    let cambios = 0;
    
    // Corregir edge: router-intencion (route-buscar-mas) → debe ir a gpt-asistente-ventas
    const edgeBuscarMas = flow.edges.find(e => 
      e.source === 'router-intencion' && e.sourceHandle === 'route-buscar-mas'
    );
    
    if (edgeBuscarMas) {
      console.log(`\n📍 Edge: ${edgeBuscarMas.id}`);
      console.log(`   Actual: router-intencion → ${edgeBuscarMas.target}`);
      console.log(`   Correcto: router-intencion → gpt-asistente-ventas`);
      
      if (edgeBuscarMas.target !== 'gpt-asistente-ventas') {
        edgeBuscarMas.target = 'gpt-asistente-ventas';
        cambios++;
        console.log('   ✅ CORREGIDO');
      } else {
        console.log('   ✅ Ya está correcto');
      }
    }
    
    // Corregir edge: router-algo-mas (route-seguir) → debe ir a gpt-asistente-ventas
    const edgeSeguir = flow.edges.find(e => 
      e.source === 'router-algo-mas' && e.sourceHandle === 'route-seguir'
    );
    
    if (edgeSeguir) {
      console.log(`\n📍 Edge: ${edgeSeguir.id}`);
      console.log(`   Actual: router-algo-mas → ${edgeSeguir.target}`);
      console.log(`   Correcto: router-algo-mas → gpt-asistente-ventas`);
      
      if (edgeSeguir.target !== 'gpt-asistente-ventas') {
        edgeSeguir.target = 'gpt-asistente-ventas';
        cambios++;
        console.log('   ✅ CORREGIDO');
      } else {
        console.log('   ✅ Ya está correcto');
      }
    }
    
    if (cambios > 0) {
      console.log(`\n\n💾 Guardando ${cambios} cambios en MongoDB...`);
      
      await flowsCollection.updateOne(
        { _id: new ObjectId(FLOW_ID) },
        { $set: { edges: flow.edges } }
      );
      
      console.log('✅ Cambios guardados correctamente');
    } else {
      console.log('\n\n✅ No hay cambios que hacer');
    }
    
    // Mostrar flujo corregido
    console.log('\n\n📊 FLUJO CORREGIDO:\n');
    console.log('─'.repeat(80));
    console.log('\nwebhook-whatsapp');
    console.log('  → gpt-conversacional');
    console.log('    → gpt-formateador');
    console.log('      → router');
    console.log('        ├─ route-1 → gpt-pedir-datos → whatsapp-preguntar → gpt-asistente-ventas');
    console.log('        └─ route-2 → woocommerce → gpt-asistente-ventas');
    console.log('          → whatsapp-asistente');
    console.log('            → router-intencion');
    console.log('              ├─ route-agregar → gpt-confirmacion-carrito → whatsapp-confirmacion-carrito');
    console.log('              ├─ route-buscar-mas → gpt-asistente-ventas (loop corregido)');
    console.log('              └─ route-default → gpt-asistente-ventas (loop corregido)');
    console.log('                → router-algo-mas');
    console.log('                  ├─ route-seguir → gpt-asistente-ventas (loop corregido)');
    console.log('                  └─ route-finalizar → gpt-mercadopago → whatsapp-mercadopago');
    
    console.log('\n✅ Script completado\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

corregirConexiones();
