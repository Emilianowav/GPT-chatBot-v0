import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function listarFlujos() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('chatbot_crm');
    const flowsCollection = db.collection('flows');
    
    const empresaId = new ObjectId('6940a9a181b92bfce970fdb5');
    const flows = await flowsCollection.find({ empresaId }).toArray();
    
    console.log('═'.repeat(80));
    console.log('📋 FLUJOS DE VEO VEO');
    console.log('═'.repeat(80));
    
    console.log(`\nTotal de flujos: ${flows.length}\n`);
    
    flows.forEach((flow, index) => {
      console.log(`${index + 1}. ${flow.nombre || 'Sin nombre'}`);
      console.log(`   ID: ${flow._id.toString()}`);
      console.log(`   Activo: ${flow.activo ? '✅ SÍ' : '❌ NO'}`);
      console.log(`   Nodos: ${flow.nodes?.length || 0}`);
      console.log(`   Variables globales: ${flow.config?.variables_globales ? '✅ Configuradas (' + Object.keys(flow.config.variables_globales).length + ')' : '❌ No configuradas'}`);
      console.log(`   Tópicos: ${flow.config?.topicos ? '✅ Configurados (' + Object.keys(flow.config.topicos).length + ')' : '❌ No configurados'}`);
      console.log('');
    });
    
    console.log('═'.repeat(80));
    console.log('🎯 RECOMENDACIÓN');
    console.log('═'.repeat(80));
    
    const flujoNuevo = flows.find(f => f.nombre === 'Veo Veo - Librería');
    const flujoViejo = flows.find(f => f.nombre === 'WooCommerce Flow');
    
    if (flujoNuevo && flujoViejo) {
      console.log('\n⚠️  Hay 2 flujos:');
      console.log(`   1. "${flujoViejo.nombre}" (viejo) - ID: ${flujoViejo._id}`);
      console.log(`   2. "${flujoNuevo.nombre}" (nuevo) - ID: ${flujoNuevo._id}`);
      
      console.log('\n📝 Opciones:');
      console.log('   A. Desactivar el flujo viejo y usar solo el nuevo');
      console.log('   B. Eliminar el flujo viejo');
      console.log('   C. Actualizar el flujo viejo con las variables globales');
      
      console.log('\n💡 Recomendación: Opción A (desactivar viejo, activar nuevo)');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

listarFlujos();
