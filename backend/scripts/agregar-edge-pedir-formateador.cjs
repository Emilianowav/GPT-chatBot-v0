require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI;
const DB_NAME = 'crm_bot';
const FLUJO_ID = '695a156681f6d67f0ae9cf40';

async function agregarEdge() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db(DB_NAME);
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLUJO_ID) });
    
    if (!flow) {
      console.log('❌ Flujo no encontrado');
      return;
    }
    
    console.log('📊 FLUJO ACTUAL:');
    console.log(`   Nodos: ${flow.nodes.length}`);
    console.log(`   Edges: ${flow.edges.length}\n`);
    
    console.log('🔍 EDGES DESDE gpt-pedir-datos:');
    const edgesPedirDatos = flow.edges.filter(e => e.source === 'gpt-pedir-datos');
    edgesPedirDatos.forEach(e => {
      const condition = e.data?.condition || 'sin condición';
      console.log(`   - ${e.target}: ${condition}`);
    });
    
    // Verificar si ya existe el edge
    const edgeExiste = flow.edges.some(e => 
      e.source === 'gpt-pedir-datos' && e.target === 'gpt-formateador'
    );
    
    if (edgeExiste) {
      console.log('\n✅ Edge pedir-datos → formateador ya existe');
      return;
    }
    
    console.log('\n🔧 AGREGANDO EDGE: gpt-pedir-datos → gpt-formateador\n');
    
    // Agregar edge nuevo
    const newEdge = {
      id: 'edge-pedir-formateador-loop',
      source: 'gpt-pedir-datos',
      target: 'gpt-formateador',
      type: 'default',
      data: {
        condition: '{{gpt-pedir-datos.variables_completas}} equals true',
        label: 'Re-evaluar (loop)'
      }
    };
    
    flow.edges.push(newEdge);
    
    console.log('✅ Edge agregado:');
    console.log(`   ID: ${newEdge.id}`);
    console.log(`   Source: ${newEdge.source}`);
    console.log(`   Target: ${newEdge.target}`);
    console.log(`   Condición: ${newEdge.data.condition}\n`);
    
    // Actualizar edge existente de pedir-datos → whatsapp para que solo se ejecute si faltan
    const edgePedirWhatsapp = flow.edges.find(e => 
      e.source === 'gpt-pedir-datos' && e.target === 'whatsapp-preguntar'
    );
    
    if (edgePedirWhatsapp) {
      if (!edgePedirWhatsapp.data) {
        edgePedirWhatsapp.data = {};
      }
      edgePedirWhatsapp.data.condition = '{{gpt-pedir-datos.variables_completas}} equals false';
      edgePedirWhatsapp.data.label = 'Enviar pregunta';
      
      console.log('✅ Edge actualizado: pedir-datos → whatsapp');
      console.log(`   Condición: ${edgePedirWhatsapp.data.condition}\n`);
    }
    
    console.log('📊 RESUMEN:');
    console.log(`   Edges: ${flow.edges.length - 1} → ${flow.edges.length}\n`);
    
    console.log('🔄 FLUJO FINAL:');
    console.log('   gpt-pedir-datos extrae variables');
    console.log('   ├─ [variables_completas = true]  → gpt-formateador (re-evaluar) 🔄');
    console.log('   └─ [variables_completas = false] → whatsapp-preguntar (pedir más) ❓\n');
    
    // Actualizar en BD
    const result = await flowsCollection.updateOne(
      { _id: new ObjectId(FLUJO_ID) },
      { 
        $set: { 
          edges: flow.edges,
          updatedAt: new Date()
        } 
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ FLUJO ACTUALIZADO EN MONGODB\n');
      console.log('🚀 Render cargará este cambio en el próximo reinicio');
      console.log('💡 Forzá un reinicio de Render o esperá el auto-deploy');
    } else {
      console.log('⚠️  No se realizaron cambios');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

agregarEdge();
