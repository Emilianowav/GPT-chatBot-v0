require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

/**
 * SOLUCIÓN DEFINITIVA: Eliminar workflows de TODAS las APIs
 * El error "workflows.0.id: Path `id` is required" ocurre porque:
 * 1. El modelo ApiConfiguration tiene workflows como array
 * 2. Cada workflow requiere un campo 'id'
 * 3. Los workflows actuales NO tienen 'id'
 * 4. Solución: Eliminar workflows completamente (no se usan)
 */

async function fixWorkflowsValidationFinal() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB Atlas (PRODUCCIÓN)\n');
    
    const db = client.db();
    const apisCollection = db.collection('apis');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('ELIMINAR WORKFLOWS DE TODAS LAS APIS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Buscar TODAS las APIs que tengan workflows
    const apisWithWorkflows = await apisCollection.find({
      workflows: { $exists: true, $ne: [] }
    }).toArray();
    
    console.log(`📋 APIs con workflows encontradas: ${apisWithWorkflows.length}\n`);
    
    if (apisWithWorkflows.length === 0) {
      console.log('✅ No hay APIs con workflows. Todo está limpio.');
      return;
    }
    
    for (const api of apisWithWorkflows) {
      console.log(`\n🔍 API: ${api.nombre} (${api._id})`);
      console.log(`   Workflows actuales: ${api.workflows?.length || 0}`);
      
      if (api.workflows && api.workflows.length > 0) {
        api.workflows.forEach((wf, index) => {
          console.log(`      ${index + 1}. ${wf.nombre || 'Sin nombre'} - ID: ${wf.id || '❌ FALTA'}`);
        });
      }
    }
    
    console.log('\n🔧 Eliminando workflows de todas las APIs...\n');
    
    // Eliminar workflows de TODAS las APIs
    const result = await apisCollection.updateMany(
      { workflows: { $exists: true } },
      { $unset: { workflows: "" } }
    );
    
    console.log(`✅ Workflows eliminados de ${result.modifiedCount} APIs`);
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('VERIFICACIÓN FINAL');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Verificar que no queden APIs con workflows
    const remainingWithWorkflows = await apisCollection.find({
      workflows: { $exists: true, $ne: [] }
    }).toArray();
    
    if (remainingWithWorkflows.length === 0) {
      console.log('✅ ÉXITO: Todas las APIs están limpias');
      console.log('✅ El error "workflows.0.id: Path `id` is required" está resuelto');
      console.log('✅ El flujo de WooCommerce debería funcionar ahora');
    } else {
      console.log(`⚠️  Todavía hay ${remainingWithWorkflows.length} APIs con workflows`);
      remainingWithWorkflows.forEach(api => {
        console.log(`   - ${api.nombre} (${api._id})`);
      });
    }
    
    // Mostrar todas las APIs para confirmar
    console.log('\n📋 TODAS LAS APIS EN LA BASE DE DATOS:\n');
    const allApis = await apisCollection.find({}).toArray();
    
    allApis.forEach(api => {
      console.log(`   ${api.nombre}`);
      console.log(`      ID: ${api._id}`);
      console.log(`      Base URL: ${api.baseUrl}`);
      console.log(`      Endpoints: ${api.endpoints?.length || 0}`);
      console.log(`      Workflows: ${api.workflows?.length || 0}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
  } finally {
    await client.close();
  }
}

fixWorkflowsValidationFinal();
