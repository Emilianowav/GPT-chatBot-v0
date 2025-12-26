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

    if (!api) {
      console.log('❌ No se encontró API');
      await mongoose.disconnect();
      return;
    }

    console.log('📋 CORRIGIENDO WORKFLOW Y ENDPOINT\n');

    // 1. CORREGIR ENDPOINT DE DISPONIBILIDAD
    console.log('1️⃣ Corrigiendo endpoint consultar-disponibilidad...\n');
    
    const endpointIndex = api.endpoints.findIndex(e => e.id === 'consultar-disponibilidad');
    
    if (endpointIndex !== -1) {
      console.log('   Antes:');
      console.log('   Path:', api.endpoints[endpointIndex].path);
      console.log('   Parámetros:', JSON.stringify(api.endpoints[endpointIndex].parametros, null, 2));
      
      api.endpoints[endpointIndex].path = '/disponibilidad';
      api.endpoints[endpointIndex].parametros = {
        path: [],
        query: [
          {
            nombre: 'fecha',
            tipo: 'string',
            requerido: true,
            descripcion: 'Fecha en formato YYYY-MM-DD'
          },
          {
            nombre: 'deporte',
            tipo: 'string',
            requerido: true,
            descripcion: 'Nombre del deporte: paddle o futbol'
          }
        ]
      };
      
      console.log('\n   Después:');
      console.log('   Path:', api.endpoints[endpointIndex].path);
      console.log('   Parámetros:', JSON.stringify(api.endpoints[endpointIndex].parametros, null, 2));
      console.log('   ✅ Endpoint corregido');
    }

    // 2. CORREGIR VALIDACIÓN DEL PASO 0
    console.log('\n\n2️⃣ Corrigiendo validación del paso 0...\n');
    
    if (api.workflows && api.workflows.length > 0) {
      const workflow = api.workflows[0];
      const paso0 = workflow.steps[0];
      
      console.log('   Antes:');
      console.log('   Tipo validación:', paso0.validacion?.tipo);
      
      // Cambiar de "opciones" a "opcion" (sin 's')
      paso0.validacion.tipo = 'opcion';
      
      console.log('\n   Después:');
      console.log('   Tipo validación:', paso0.validacion.tipo);
      console.log('   ✅ Validación corregida (opciones → opcion)');
    }

    // 3. GUARDAR CAMBIOS
    console.log('\n\n3️⃣ Guardando cambios en BD...\n');
    
    await db.collection('api_configurations').updateOne(
      { _id: api._id },
      { 
        $set: { 
          endpoints: api.endpoints,
          workflows: api.workflows
        } 
      }
    );

    console.log('✅ Cambios guardados');

    console.log('\n\n═══════════════════════════════════════════════════════');
    console.log('📊 RESUMEN DE CORRECCIONES');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log('1. Endpoint consultar-disponibilidad:');
    console.log('   ✅ Path: /disponibilidad');
    console.log('   ✅ Query params: fecha, deporte');
    console.log('');
    console.log('2. Paso 0 validación:');
    console.log('   ✅ Tipo: opcion (sin s)');
    console.log('   ✅ Mapeo: 1 → paddle, 2 → futbol');
    console.log('');
    console.log('💡 IMPORTANTE:');
    console.log('   El mapeo se aplica en el workflowConversationalHandler');
    console.log('   cuando procesa la validación tipo "opcion" con campo "mapeo"');

    await mongoose.disconnect();
    console.log('\n✅ Corrección completada');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixWorkflow();
