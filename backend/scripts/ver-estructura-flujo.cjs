const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function ver() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    const collection = db.collection('flows');
    
    const flow = await collection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      return;
    }
    
    console.log('📊 ESTRUCTURA DEL FLUJO:\n');
    
    // Mostrar path desde gpt-pedir-datos
    console.log('🔄 PATH ACTUAL:');
    console.log('   webhook → gpt-conversacional → gpt-formateador → router');
    console.log('   router (route-1) → gpt-pedir-datos → whatsapp-preguntar → [FIN] ❌\n');
    
    console.log('📋 EDGES DESDE whatsapp-preguntar:');
    const edgesDesdeWhatsapp = flow.edges.filter(e => e.source === 'whatsapp-preguntar');
    if (edgesDesdeWhatsapp.length === 0) {
      console.log('   ⚠️  NO HAY EDGES (el flujo termina aquí)\n');
    } else {
      edgesDesdeWhatsapp.forEach(e => {
        console.log(`   ${e.id}: ${e.source} → ${e.target}`);
        if (e.data?.condition) console.log(`      Condición: ${e.data.condition}`);
      });
    }
    
    console.log('\n📋 EDGES DESDE gpt-pedir-datos:');
    const edgesDesdeGptPedir = flow.edges.filter(e => e.source === 'gpt-pedir-datos');
    edgesDesdeGptPedir.forEach(e => {
      console.log(`   ${e.id}: ${e.source} → ${e.target}`);
      if (e.data?.condition) console.log(`      Condición: ${e.data.condition}`);
    });
    
    console.log('\n💡 PROBLEMA:');
    console.log('   Cuando gpt-pedir-datos completa las variables,');
    console.log('   el flujo va a whatsapp-preguntar y TERMINA.');
    console.log('   No hay forma de que continúe a WooCommerce.\n');
    
    console.log('💡 SOLUCIÓN:');
    console.log('   Agregar edge: gpt-pedir-datos → router');
    console.log('   Condición: variables_completas = true');
    console.log('   Así cuando completa las variables, vuelve al router');
    console.log('   y el router lo envía a WooCommerce.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

ver();
