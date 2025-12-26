import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function fixWorkflow() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    const api = await db.collection('api_configurations').findOne({
      nombre: /mis canchas/i
    });

    if (!api || !api.workflows || api.workflows.length === 0) {
      console.log('❌ No se encontró workflow');
      await mongoose.disconnect();
      return;
    }

    const workflow = api.workflows[0];
    
    console.log('📋 CORRIGIENDO PASO 4:\n');
    
    const paso4 = workflow.steps[4];
    
    console.log('ANTES:');
    console.log('   parametros:', paso4.parametros);
    console.log('   mapeoParametros:', paso4.mapeoParametros);
    
    // Renombrar 'parametros' a 'mapeoParametros'
    if (paso4.parametros && !paso4.mapeoParametros) {
      paso4.mapeoParametros = paso4.parametros;
      delete paso4.parametros;
      
      console.log('\nDESPUÉS:');
      console.log('   mapeoParametros:', paso4.mapeoParametros);
    }
    
    // Actualizar en BD
    await db.collection('api_configurations').updateOne(
      { _id: api._id },
      { 
        $set: { 
          'workflows.0.steps.4': paso4
        } 
      }
    );

    console.log('\n✅ Workflow actualizado en BD');

    // Verificar
    const verificar = await db.collection('api_configurations').findOne({ 
      _id: api._id 
    });

    console.log('\n📋 VERIFICACIÓN:');
    console.log('   Paso 4 mapeoParametros:', verificar.workflows[0].steps[4].mapeoParametros);
    console.log('   Paso 4 parametros:', verificar.workflows[0].steps[4].parametros || 'NO TIENE');

    await mongoose.disconnect();
    console.log('\n✅ Corrección completada');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixWorkflow();
