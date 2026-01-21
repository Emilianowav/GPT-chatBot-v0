import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function verificarTodosFlujos() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('chatbot_crm');
    const flowsCollection = db.collection('flows');
    
    // Buscar TODOS los flujos
    const flows = await flowsCollection.find({}).toArray();
    
    console.log('═'.repeat(80));
    console.log('📋 TODOS LOS FLUJOS EN LA BD');
    console.log('═'.repeat(80));
    
    console.log(`\nTotal: ${flows.length}\n`);
    
    flows.forEach((flow, i) => {
      console.log(`${i + 1}. ${flow.nombre || 'Sin nombre'}`);
      console.log(`   ID: ${flow._id.toString()}`);
      console.log(`   Empresa ID: ${flow.empresaId?.toString() || 'N/A'}`);
      console.log(`   Activo: ${flow.activo ? '✅ SÍ' : '❌ NO'}`);
      console.log(`   Nodos: ${flow.nodes?.length || 0}`);
      console.log(`   config existe: ${!!flow.config}`);
      console.log(`   config.variables_globales: ${flow.config?.variables_globales ? '✅ (' + Object.keys(flow.config.variables_globales).length + ')' : '❌'}`);
      console.log(`   config.topicos: ${flow.config?.topicos ? '✅ (' + Object.keys(flow.config.topicos).length + ')' : '❌'}`);
      console.log('');
    });
    
    console.log('═'.repeat(80));
    console.log('🎯 FLUJO CORRECTO PARA VEO VEO');
    console.log('═'.repeat(80));
    
    const empresaVeoVeo = new ObjectId('6940a9a181b92bfce970fdb5');
    const flujoVeoVeo = flows.find(f => f.empresaId?.toString() === empresaVeoVeo.toString());
    
    if (flujoVeoVeo) {
      console.log('\n✅ Flujo de Veo Veo encontrado:');
      console.log(`   Nombre: ${flujoVeoVeo.nombre}`);
      console.log(`   ID: ${flujoVeoVeo._id.toString()}`);
      console.log(`   Activo: ${flujoVeoVeo.activo ? '✅ SÍ' : '❌ NO'}`);
      console.log(`   Variables globales: ${flujoVeoVeo.config?.variables_globales ? '✅' : '❌'}`);
      
      if (flujoVeoVeo.config?.variables_globales) {
        console.log('\n📊 Variables globales:');
        Object.keys(flujoVeoVeo.config.variables_globales).forEach(key => {
          console.log(`   - ${key}`);
        });
      }
      
      console.log('\n📝 URL para el Flow Builder:');
      console.log(`   http://localhost:3000/flow-builder?flowId=${flujoVeoVeo._id.toString()}`);
    } else {
      console.log('\n❌ No se encontró flujo para Veo Veo');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verificarTodosFlujos();
