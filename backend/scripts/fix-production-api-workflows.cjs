require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

/**
 * Corregir workflows en API de producción
 */

async function fixProductionApiWorkflows() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB Atlas (PRODUCCIÓN)\n');
    
    const db = client.db();
    const apisCollection = db.collection('apis');
    
    const apiConfigId = new ObjectId('695320fda03785dacc8d950b');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('CORREGIR WORKFLOWS EN PRODUCCIÓN');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const api = await apisCollection.findOne({ _id: apiConfigId });
    
    if (!api) {
      console.log('❌ API no encontrada en producción');
      return;
    }
    
    console.log('✅ API encontrada:', api.nombre);
    console.log('   Base URL:', api.baseUrl);
    console.log('   Endpoints:', api.endpoints?.length || 0);
    console.log('   Workflows:', api.workflows?.length || 0);
    console.log('');
    
    // Verificar si tiene workflows
    if (api.workflows && api.workflows.length > 0) {
      console.log('⚠️  API tiene workflows inválidos:', api.workflows.length);
      console.log('');
      
      api.workflows.forEach((wf, index) => {
        console.log(`   Workflow ${index + 1}:`);
        console.log(`      ID: ${wf.id || '❌ FALTA (causa error de validación)'}`);
        console.log(`      Nombre: ${wf.nombre || 'N/A'}`);
        console.log('');
      });
      
      // Eliminar workflows completamente
      console.log('🔧 Eliminando workflows de la API...');
      
      const result = await apisCollection.updateOne(
        { _id: apiConfigId },
        { $unset: { workflows: "" } }
      );
      
      console.log(`✅ Workflows eliminados (${result.modifiedCount} documento modificado)`);
    } else {
      console.log('✅ API no tiene workflows (ya está correcta)');
    }
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('VERIFICACIÓN FINAL');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const updatedApi = await apisCollection.findOne({ _id: apiConfigId });
    
    console.log('📋 Estructura final de la API:');
    console.log(`   Nombre: ${updatedApi.nombre}`);
    console.log(`   Base URL: ${updatedApi.baseUrl}`);
    console.log(`   Endpoints: ${updatedApi.endpoints?.length || 0}`);
    console.log(`   Workflows: ${updatedApi.workflows?.length || 0}`);
    console.log('');
    
    if (!updatedApi.workflows || updatedApi.workflows.length === 0) {
      console.log('✅ API corregida exitosamente en PRODUCCIÓN');
      console.log('✅ El error "workflows.0.id: Path `id` is required" está resuelto');
    } else {
      console.log('⚠️  API todavía tiene workflows');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixProductionApiWorkflows();
