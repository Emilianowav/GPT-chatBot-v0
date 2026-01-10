require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

/**
 * Corregir error de validación: workflows.0.id is required
 */

async function fixApiValidationError() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db();
    const apisCollection = db.collection('apis');
    
    const apiConfigId = new ObjectId('695320fda03785dacc8d950b');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('CORREGIR ERROR DE VALIDACIÓN DE API');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const api = await apisCollection.findOne({ _id: apiConfigId });
    
    if (!api) {
      console.log('❌ API no encontrada');
      return;
    }
    
    console.log('✅ API encontrada:', api.nombre);
    console.log('');
    
    // Verificar si tiene workflows
    if (api.workflows && api.workflows.length > 0) {
      console.log('⚠️  API tiene workflows:', api.workflows.length);
      console.log('');
      
      api.workflows.forEach((wf, index) => {
        console.log(`Workflow ${index + 1}:`);
        console.log(`   ID: ${wf.id || '❌ FALTA'}`);
        console.log(`   Nombre: ${wf.nombre || 'N/A'}`);
        console.log('');
      });
      
      // Eliminar workflows (no los necesitamos para WooCommerce)
      console.log('🔧 Eliminando workflows...');
      
      await apisCollection.updateOne(
        { _id: apiConfigId },
        { $unset: { workflows: "" } }
      );
      
      console.log('✅ Workflows eliminados');
    } else {
      console.log('✅ API no tiene workflows');
    }
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('VERIFICACIÓN FINAL');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const updatedApi = await apisCollection.findOne({ _id: apiConfigId });
    
    console.log('📋 Estructura final:');
    console.log(`   Nombre: ${updatedApi.nombre}`);
    console.log(`   Base URL: ${updatedApi.baseUrl}`);
    console.log(`   Endpoints: ${updatedApi.endpoints?.length || 0}`);
    console.log(`   Workflows: ${updatedApi.workflows?.length || 0}`);
    console.log('');
    console.log('✅ API corregida exitosamente');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixApiValidationError();
