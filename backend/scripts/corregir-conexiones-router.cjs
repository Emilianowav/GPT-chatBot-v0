/**
 * Script para corregir las conexiones del router
 * 1. router (route-2) debe ir a whatsapp-solicitar-datos (no a woocommerce)
 * 2. whatsapp-solicitar-datos ya está conectado a woocommerce ✅
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function corregirConexionesRouter() {
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
    console.log('🔧 CORRIGIENDO CONEXIONES DEL ROUTER');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Agregar conexión: router (route-2) → whatsapp-solicitar-datos
    const nuevaConexion = {
      id: 'edge-router-solicitar',
      source: 'router',
      target: 'whatsapp-solicitar-datos',
      sourceHandle: 'route-2',
      type: 'default',
      animated: false
    };
    
    // Verificar si ya existe
    const existeConexion = flow.edges.find(e => e.id === nuevaConexion.id);
    
    if (!existeConexion) {
      console.log('✅ Agregando: router (route-2) → whatsapp-solicitar-datos');
      flow.edges.push(nuevaConexion);
    } else {
      console.log('ℹ️  Conexión ya existe');
    }
    
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
    
    console.log('\n✅ Conexiones corregidas');
    console.log(`   Total edges: ${flow.edges.length}`);
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
corregirConexionesRouter()
  .then(() => {
    console.log('✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
