const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function fixFlujoWooCommerce() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      return;
    }
    
    console.log('📊 FLOW:', flow.nombre);
    console.log('═══════════════════════════════════════\n');
    
    // SOLUCIÓN: Agregar edge desde whatsapp-preguntar → gpt-formateador
    // para que vuelva a evaluar las variables después de pedirlas
    
    console.log('🔧 AGREGANDO EDGE FALTANTE:\n');
    
    const newEdge = {
      id: 'edge-whatsapp-to-formateador',
      source: 'whatsapp-preguntar',
      target: 'gpt-formateador',
      sourceHandle: null,
      targetHandle: null,
      type: 'default',
      data: {
        label: 'Re-evaluar variables',
        condition: null // Sin condición, siempre continúa
      }
    };
    
    // Verificar si ya existe
    const existeEdge = flow.edges.find(e => 
      e.source === 'whatsapp-preguntar' && e.target === 'gpt-formateador'
    );
    
    if (existeEdge) {
      console.log('⚠️  El edge ya existe:', existeEdge.id);
      console.log('   No se realizarán cambios\n');
      return;
    }
    
    // Agregar el nuevo edge
    flow.edges.push(newEdge);
    
    console.log('✅ Nuevo edge agregado:');
    console.log(`   ${newEdge.id}: whatsapp-preguntar → gpt-formateador`);
    console.log(`   Condición: ${newEdge.data.condition || 'SIN CONDICIÓN (siempre continúa)'}\n`);
    
    // TAMBIÉN: Corregir el edge edge-pedir-whatsapp para que NO tenga condición
    const edgePedirWhatsapp = flow.edges.find(e => e.id === 'edge-pedir-whatsapp');
    if (edgePedirWhatsapp) {
      console.log('🔧 CORRIGIENDO EDGE: edge-pedir-whatsapp');
      console.log(`   Condición anterior: ${edgePedirWhatsapp.data?.condition}`);
      
      // Eliminar la condición para que siempre envíe el mensaje
      if (edgePedirWhatsapp.data) {
        delete edgePedirWhatsapp.data.condition;
      }
      
      console.log(`   Condición nueva: SIN CONDICIÓN (siempre envía mensaje)\n`);
    }
    
    // Guardar cambios
    const result = await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { edges: flow.edges } }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ Flujo actualizado correctamente\n');
      console.log('📋 FLUJO CORREGIDO:');
      console.log('   webhook → gpt-formateador → router');
      console.log('                                ├─ route-1 (faltan) → gpt-pedir-datos → whatsapp-preguntar → gpt-formateador (loop)');
      console.log('                                └─ route-2 (completas) → woocommerce → ...');
      console.log('\n💡 Ahora el flujo:');
      console.log('   1. Pide datos faltantes');
      console.log('   2. Envía mensaje al usuario');
      console.log('   3. Vuelve al formateador para re-evaluar');
      console.log('   4. Si las variables están completas, va a WooCommerce');
    } else {
      console.log('⚠️  No se realizaron cambios');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixFlujoWooCommerce();
