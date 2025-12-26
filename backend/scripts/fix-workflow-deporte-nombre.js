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
    
    console.log('📋 CORRIGIENDO PASO 0 Y PASO 4\n');
    
    // PASO 0: Cambiar validación para guardar el NOMBRE del deporte, no el número
    const paso0 = workflow.steps[0];
    console.log('PASO 0 - ANTES:');
    console.log('   validacion:', paso0.validacion);
    
    paso0.validacion = {
      tipo: 'opciones',
      opciones: ['1', '2', 'paddle', 'futbol', 'fútbol'],
      mapeo: {
        '1': 'paddle',
        '2': 'futbol',
        'paddle': 'paddle',
        'futbol': 'futbol',
        'fútbol': 'futbol'
      }
    };
    
    console.log('\nPASO 0 - DESPUÉS:');
    console.log('   validacion:', paso0.validacion);
    console.log('   ✅ Ahora guarda "paddle" o "futbol" en lugar de "1" o "2"');
    
    // PASO 4: El mapeo ya está correcto, solo usa {{deporte}}
    const paso4 = workflow.steps[4];
    console.log('\n\nPASO 4:');
    console.log('   mapeoParametros:', paso4.mapeoParametros);
    console.log('   ✅ Ya está correcto, usa {{deporte}} que ahora será "paddle" o "futbol"');
    
    // Actualizar en BD
    await db.collection('api_configurations').updateOne(
      { _id: api._id },
      { 
        $set: { 
          'workflows.0.steps.0.validacion': paso0.validacion
        } 
      }
    );

    console.log('\n✅ Workflow actualizado en BD');
    
    console.log('\n\n═══════════════════════════════════════════════════════');
    console.log('📊 CÓMO FUNCIONA AHORA');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('1. Usuario escribe "1" o "paddle"');
    console.log('   → Se guarda como "paddle" en datosRecopilados');
    console.log('');
    console.log('2. Usuario escribe "2" o "futbol"');
    console.log('   → Se guarda como "futbol" en datosRecopilados');
    console.log('');
    console.log('3. Paso 4 usa {{deporte}}');
    console.log('   → Envía "paddle" o "futbol" a la API');
    console.log('');
    console.log('4. API devuelve TODAS las canchas con horarios disponibles');
    console.log('   → El código hace el matching con hora_preferida y duración');

    await mongoose.disconnect();
    console.log('\n✅ Corrección completada');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixWorkflow();
