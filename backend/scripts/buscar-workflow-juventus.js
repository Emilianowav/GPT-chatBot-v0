import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function buscarWorkflowJuventus() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB Atlas');

    const db = client.db('neural_chatbot');
    const workflowsCollection = db.collection('workflows');

    // Buscar todos los workflows
    const workflows = await workflowsCollection.find({}).toArray();
    
    console.log('\n📋 Total workflows encontrados:', workflows.length);
    
    workflows.forEach(w => {
      console.log(`\n   - ${w.nombre} (ID: ${w._id})`);
      console.log(`     Activo: ${w.activo}`);
      console.log(`     Pasos: ${w.steps?.length || 0}`);
    });

    // Buscar específicamente por ID del log
    const workflowId = '694b0b35a83ef01dc4c6af6d';
    console.log('\n🔍 Buscando workflow con ID:', workflowId);
    
    const workflow = await workflowsCollection.findOne({
      _id: new ObjectId(workflowId)
    });

    if (workflow) {
      console.log('\n✅ Workflow encontrado:', workflow.nombre);
      console.log('📍 Paso 9:');
      const paso9 = workflow.steps.find(s => s.orden === 9);
      if (paso9) {
        console.log('   Nombre:', paso9.nombre);
        console.log('   Tipo:', paso9.tipo);
        console.log('   Endpoint:', paso9.endpointId);
        console.log('   Mapeo:', JSON.stringify(paso9.mapeoParametros, null, 2));
      } else {
        console.log('   ❌ No se encontró el paso 9');
      }
    } else {
      console.log('❌ No se encontró el workflow con ese ID');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

buscarWorkflowJuventus();
