import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function buscarFlujoPorId() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('chatbot_crm');
    const flowsCollection = db.collection('flows');
    
    // El ID que aparece en los logs del frontend
    const flowId = new ObjectId('695a156681f6d67f0ae9cf40');
    const flow = await flowsCollection.findOne({ _id: flowId });
    
    console.log('═'.repeat(80));
    console.log('🔍 BUSCANDO FLUJO: 695a156681f6d67f0ae9cf40');
    console.log('═'.repeat(80));
    
    if (!flow) {
      console.log('\n❌ Flujo NO encontrado en la BD');
      console.log('\n⚠️  El frontend está intentando cargar un flujo que no existe');
      console.log('   Esto puede pasar si:');
      console.log('   1. El flujo fue eliminado');
      console.log('   2. El flowId está hardcodeado en la URL');
      console.log('   3. Hay un localStorage con un flowId viejo');
      return;
    }
    
    console.log('\n✅ Flujo encontrado:');
    console.log('   Nombre:', flow.nombre);
    console.log('   ID:', flow._id.toString());
    console.log('   Empresa ID:', flow.empresaId.toString());
    console.log('   Activo:', flow.activo ? '✅ SÍ' : '❌ NO');
    console.log('   Nodos:', flow.nodes?.length || 0);
    console.log('   Variables globales:', flow.config?.variables_globales ? '✅ Configuradas' : '❌ No configuradas');
    
    if (flow.config?.variables_globales) {
      console.log('\n📊 Variables globales:');
      Object.keys(flow.config.variables_globales).forEach(key => {
        console.log(`   - ${key}`);
      });
    }
    
    console.log('\n═'.repeat(80));
    console.log('💡 SOLUCIÓN');
    console.log('═'.repeat(80));
    
    const empresaVeoVeo = new ObjectId('6940a9a181b92bfce970fdb5');
    
    if (flow.empresaId.toString() !== empresaVeoVeo.toString()) {
      console.log('\n⚠️  Este flujo pertenece a OTRA empresa');
      console.log('   Empresa del flujo:', flow.empresaId.toString());
      console.log('   Empresa Veo Veo:', empresaVeoVeo.toString());
    }
    
    console.log('\n📝 Para usar el flujo correcto:');
    console.log('   1. Limpiá el localStorage del navegador');
    console.log('   2. Refrescá la página del Flow Builder');
    console.log('   3. Seleccioná "Veo Veo - Librería" del dropdown');
    console.log('   4. Verificá que el ID sea: 69705b05e58836243159e64e');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

buscarFlujoPorId();
