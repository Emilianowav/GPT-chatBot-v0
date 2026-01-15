require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI;
const DB_NAME = 'crm_bot';

async function verFlujoEmpresa() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db(DB_NAME);
    
    // 1. Ver empresa Veo Veo (buscar por diferentes criterios)
    const empresasCollection = db.collection('empresas');
    let empresa = await empresasCollection.findOne({ nombre: 'Veo Veo' });
    
    if (!empresa) {
      empresa = await empresasCollection.findOne({ telefono: '+5493794057297' });
    }
    
    if (!empresa) {
      empresa = await empresasCollection.findOne({ telefono: '5493794057297' });
    }
    
    if (!empresa) {
      // Listar todas las empresas
      const todasEmpresas = await empresasCollection.find({}).toArray();
      console.log('📋 EMPRESAS EN BD:');
      todasEmpresas.forEach(e => {
        console.log(`   - ${e.nombre} (${e.telefono}) - flujoActivo: ${e.flujoActivo || 'NO'}`);
      });
      console.log('');
    }
    
    if (!empresa) {
      console.log('❌ Empresa Veo Veo no encontrada');
      return;
    }
    
    console.log('🏢 EMPRESA: Veo Veo');
    console.log(`   ID: ${empresa._id}`);
    console.log(`   Teléfono: ${empresa.telefono}`);
    console.log(`   Flujo Activo: ${empresa.flujoActivo || 'NO CONFIGURADO'}\n`);
    
    if (empresa.flujoActivo) {
      // 2. Buscar el flujo por ID
      const flowsCollection = db.collection('flows');
      const flow = await flowsCollection.findOne({ _id: new ObjectId(empresa.flujoActivo) });
      
      if (flow) {
        console.log('📊 FLUJO CONFIGURADO EN EMPRESA:');
        console.log(`   Nombre: ${flow.nombre}`);
        console.log(`   ID: ${flow._id}`);
        console.log(`   Nodos: ${flow.nodes?.length || 0}`);
        console.log(`   Edges: ${flow.edges?.length || 0}\n`);
        
        console.log('📋 NODOS:');
        flow.nodes.forEach(n => {
          console.log(`   - ${n.id} (${n.type})`);
        });
        
        console.log('\n📋 EDGES:');
        flow.edges.forEach(e => {
          const condition = e.data?.condition ? ` [${e.data.condition}]` : '';
          console.log(`   - ${e.source} → ${e.target}${condition}`);
        });
        
        const hasRouter = flow.nodes.some(n => n.id === 'router');
        console.log(`\n🔍 Router existe: ${hasRouter ? '✅ SÍ' : '❌ NO'}`);
        
      } else {
        console.log('❌ Flujo no encontrado en colección flows');
      }
    }
    
    // 3. Listar todas las colecciones
    console.log('\n📚 COLECCIONES EN BD:');
    const collections = await db.listCollections().toArray();
    collections.forEach(c => {
      console.log(`   - ${c.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verFlujoEmpresa();
