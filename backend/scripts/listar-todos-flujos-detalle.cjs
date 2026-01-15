require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI;
const DB_NAME = 'crm_bot';

async function listarFlujos() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db(DB_NAME);
    const flowsCollection = db.collection('flows');
    
    const flows = await flowsCollection.find({}).toArray();
    
    console.log(`📊 FLUJOS ENCONTRADOS: ${flows.length}\n`);
    
    flows.forEach((flow, index) => {
      console.log(`${index + 1}. ${flow.nombre || 'Sin nombre'}`);
      console.log(`   ID: ${flow._id}`);
      console.log(`   Nodos: ${flow.nodes?.length || 0}`);
      console.log(`   Edges: ${flow.edges?.length || 0}`);
      console.log(`   Actualizado: ${flow.updatedAt || 'N/A'}`);
      
      // Verificar edges desde gpt-pedir-datos
      const edgesPedirDatos = flow.edges?.filter(e => e.source === 'gpt-pedir-datos') || [];
      console.log(`   Edges desde gpt-pedir-datos: ${edgesPedirDatos.length}`);
      edgesPedirDatos.forEach(e => {
        console.log(`      → ${e.target} [${e.data?.condition || 'sin condición'}]`);
      });
      console.log('');
    });
    
    // Verificar cuál es el flujo activo de Veo Veo
    const empresasCollection = db.collection('empresas');
    const veoVeo = await empresasCollection.findOne({ nombre: 'Veo Veo' });
    
    if (veoVeo) {
      console.log('🏢 VEO VEO:');
      console.log(`   Flujo Activo: ${veoVeo.flujoActivo}`);
      
      const flujoActivo = flows.find(f => f._id.toString() === veoVeo.flujoActivo?.toString());
      if (flujoActivo) {
        console.log(`   ✅ Flujo encontrado: ${flujoActivo.nombre}`);
        console.log(`   Nodos: ${flujoActivo.nodes.length}, Edges: ${flujoActivo.edges.length}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

listarFlujos();
