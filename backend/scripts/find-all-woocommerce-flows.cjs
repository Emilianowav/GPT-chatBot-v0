const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function findAllFlows() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');

    const db = client.db('crm_bot');
    
    // Listar TODAS las colecciones
    console.log('📂 COLECCIONES EN crm_bot:');
    const collections = await db.listCollections().toArray();
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    console.log('');

    // Buscar en TODAS las colecciones que puedan tener flows
    const possibleCollections = ['flows', 'flow', 'Flow', 'Flows'];
    
    for (const collName of possibleCollections) {
      try {
        const coll = db.collection(collName);
        const count = await coll.countDocuments();
        
        if (count > 0) {
          console.log(`\n🔍 Colección: ${collName} (${count} documentos)`);
          const docs = await coll.find({}).toArray();
          
          docs.forEach((doc, i) => {
            console.log(`\n   ${i + 1}. ID: ${doc._id}`);
            console.log(`      Nombre: ${doc.nombre || doc.name || 'N/A'}`);
            console.log(`      Nodos: ${doc.nodes?.length || 0}`);
            if (doc.nodes?.length > 0) {
              console.log(`      IDs de nodos: ${doc.nodes.map(n => n.id).join(', ')}`);
            }
          });
        }
      } catch (err) {
        // Colección no existe
      }
    }

    // Buscar específicamente el ID que estamos usando
    console.log('\n\n🎯 BUSCANDO ID ESPECÍFICO: 695a156681f6d67f0ae9cf40');
    const flowsCollection = db.collection('flows');
    const specificFlow = await flowsCollection.findOne({ 
      _id: new ObjectId('695a156681f6d67f0ae9cf40') 
    });
    
    if (specificFlow) {
      console.log(`\n   ✅ ENCONTRADO en 'flows'`);
      console.log(`   Nombre: ${specificFlow.nombre}`);
      console.log(`   Nodos: ${specificFlow.nodes?.length}`);
      console.log(`   IDs: ${specificFlow.nodes?.map(n => n.id).join(', ')}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

findAllFlows();
