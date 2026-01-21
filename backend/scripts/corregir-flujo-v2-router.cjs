const { MongoClient, ObjectId } = require('mongodb');

async function corregirFlujoV2() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('bot_crm');
    
    const flowId = new ObjectId('696aef0863e98384f9248968');
    
    console.log('🔧 CORRIGIENDO FLUJO VEO VEO V2\n');
    
    // 1. ELIMINAR edge incorrecto: router → whatsapp-solicitar-datos
    console.log('1️⃣ Eliminando edge incorrecto: router → whatsapp-solicitar-datos');
    await db.collection('flows').updateOne(
      { _id: flowId },
      { 
        $pull: { 
          edges: { id: 'edge-router-solicitar' }
        }
      }
    );
    console.log('   ✅ Edge eliminado');
    
    // 2. ELIMINAR edge: whatsapp-solicitar-datos → woocommerce
    console.log('\n2️⃣ Eliminando edge: whatsapp-solicitar-datos → woocommerce');
    await db.collection('flows').updateOne(
      { _id: flowId },
      { 
        $pull: { 
          edges: { id: 'edge-solicitar-woocommerce' }
        }
      }
    );
    console.log('   ✅ Edge eliminado');
    
    // 3. ELIMINAR nodo whatsapp-solicitar-datos (ya no se usa)
    console.log('\n3️⃣ Eliminando nodo whatsapp-solicitar-datos');
    await db.collection('flows').updateOne(
      { _id: flowId },
      { 
        $pull: { 
          nodes: { id: 'whatsapp-solicitar-datos' }
        }
      }
    );
    console.log('   ✅ Nodo eliminado');
    
    // 4. AGREGAR edge correcto: router (route-2) → woocommerce
    console.log('\n4️⃣ Agregando edge correcto: router → woocommerce');
    const newEdge = {
      id: 'edge-router-woocommerce',
      source: 'router',
      target: 'woocommerce',
      sourceHandle: 'route-2',
      type: 'default'
    };
    
    await db.collection('flows').updateOne(
      { _id: flowId },
      { 
        $push: { edges: newEdge }
      }
    );
    console.log('   ✅ Edge agregado:', newEdge.id);
    
    // 5. VERIFICAR resultado
    console.log('\n📋 VERIFICANDO CAMBIOS...\n');
    const flow = await db.collection('flows').findOne({ _id: flowId });
    
    const routerEdges = flow.edges.filter(e => e.source === 'router');
    console.log('Edges desde router:');
    routerEdges.forEach(e => {
      const target = flow.nodes.find(n => n.id === e.target);
      console.log(`  - ${e.sourceHandle || 'default'} → ${e.target} (${target?.type})`);
    });
    
    const wooEdges = flow.edges.filter(e => e.target === 'woocommerce');
    console.log('\nEdges hacia woocommerce:');
    wooEdges.forEach(e => {
      const source = flow.nodes.find(n => n.id === e.source);
      console.log(`  - ${e.source} (${source?.type}) → woocommerce`);
    });
    
    console.log('\n✅ FLUJO CORREGIDO EXITOSAMENTE');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

corregirFlujoV2();
