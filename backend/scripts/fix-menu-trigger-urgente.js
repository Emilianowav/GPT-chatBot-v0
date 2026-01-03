import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function fix() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    const db = mongoose.connection.db;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('FIX URGENTE: CAMBIAR TRIGGER A primer_mensaje');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('SOLUCIÓN TEMPORAL:');
    console.log('Cambiar el trigger del Menú Principal de tipo "keyword" a "primer_mensaje"');
    console.log('Esto funcionará con el código actual del backend (sin necesidad de reinicio)\n');
    
    // Actualizar en api_configurations
    console.log('1️⃣ Actualizando trigger en api_configurations...');
    
    const apiUpdate = await db.collection('api_configurations').updateOne(
      { nombre: /veo veo/i },
      {
        $set: {
          'workflows.$[menu].trigger.tipo': 'primer_mensaje',
          'workflows.$[menu].trigger.primeraRespuesta': true,
          'workflows.$[menu].prioridad': 100
        },
        $unset: {
          'workflows.$[menu].trigger.keywords': ''
        }
      },
      {
        arrayFilters: [
          { 'menu.nombre': 'Veo Veo - Menú Principal' }
        ]
      }
    );
    
    console.log(`   ✅ Actualizado (${apiUpdate.modifiedCount} documento)\n`);
    
    // Verificar
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('VERIFICACIÓN');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const api = await db.collection('api_configurations').findOne({ nombre: /veo veo/i });
    const menuWorkflow = api.workflows.find(wf => wf.nombre === 'Veo Veo - Menú Principal');
    
    console.log('Menú Principal:');
    console.log(`   Trigger Tipo: ${menuWorkflow.trigger.tipo}`);
    console.log(`   Primera Respuesta: ${menuWorkflow.trigger.primeraRespuesta ? 'SÍ' : 'NO'}`);
    console.log(`   Prioridad: ${menuWorkflow.prioridad}`);
    console.log(`   Keywords: ${menuWorkflow.trigger.keywords || 'NINGUNA (correcto)'}`);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ FIX APLICADO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📝 COMPORTAMIENTO:');
    console.log('   Ahora el trigger es tipo "primer_mensaje"');
    console.log('   El código actual del backend SÍ soporta este tipo');
    console.log('   No requiere reinicio del backend\n');
    console.log('🧪 TESTING:');
    console.log('   1. Limpiar estado: node scripts/limpiar-numero-veo-veo.js');
    console.log('   2. Enviar "Hola" → Debe activar Menú Principal');
    console.log('   3. Enviar "1" → Debe activar Consultar Libros\n');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fix();
