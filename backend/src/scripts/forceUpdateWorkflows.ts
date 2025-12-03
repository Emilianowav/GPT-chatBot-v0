/**
 * Script de actualización forzada: Actualizar todos los workflows
 * 
 * Este script actualiza TODOS los workflows para asegurar compatibilidad
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno desde la raíz del backend
const envPath = path.resolve(__dirname, '../../.env');
console.log('📁 Cargando .env desde:', envPath);
config({ path: envPath });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';
console.log('🔗 MongoDB URI:', MONGODB_URI.substring(0, 20) + '...');

async function forceUpdate() {
  try {
    console.log('🔄 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('No se pudo obtener la base de datos');
    }

    const collection = db.collection('api_configurations');

    // Buscar TODOS los documentos con workflows
    console.log('\n🔍 Buscando todos los documentos con workflows...');
    
    const allDocs = await collection.find({
      workflows: { $exists: true, $ne: [] }
    }).toArray();

    console.log(`📊 Encontrados ${allDocs.length} documentos con workflows`);

    let totalUpdated = 0;
    let totalStepsUpdated = 0;

    for (const doc of allDocs) {
      console.log(`\n📝 Procesando documento: ${doc._id}`);
      console.log(`   Nombre: ${doc.nombre || 'Sin nombre'}`);
      
      let docUpdated = false;
      
      if (doc.workflows && Array.isArray(doc.workflows)) {
        console.log(`   Workflows encontrados: ${doc.workflows.length}`);
        
        for (let wIdx = 0; wIdx < doc.workflows.length; wIdx++) {
          const workflow = doc.workflows[wIdx];
          console.log(`   \n   📋 Workflow ${wIdx + 1}: ${workflow.nombre || 'Sin nombre'}`);
          
          if (workflow.steps && Array.isArray(workflow.steps)) {
            console.log(`      Pasos: ${workflow.steps.length}`);
            
            for (let sIdx = 0; sIdx < workflow.steps.length; sIdx++) {
              const step = workflow.steps[sIdx];
              console.log(`      Paso ${sIdx + 1}: tipo="${step.tipo}", var="${step.nombreVariable}"`);
              
              // Actualizar tipo 'ejecutar' a 'consulta_filtrada'
              if (step.tipo === 'ejecutar') {
                console.log(`         ✏️  ACTUALIZANDO: ejecutar → consulta_filtrada`);
                step.tipo = 'consulta_filtrada';
                totalStepsUpdated++;
                docUpdated = true;
              }
              
              // Asegurar que endpointsRelacionados tenga el campo origenDatos
              if (step.endpointsRelacionados && Array.isArray(step.endpointsRelacionados)) {
                for (let eIdx = 0; eIdx < step.endpointsRelacionados.length; eIdx++) {
                  const endpointRel = step.endpointsRelacionados[eIdx];
                  if (!endpointRel.origenDatos) {
                    console.log(`         🔧 Agregando origenDatos='resultado' a endpoint relacionado ${eIdx + 1}`);
                    endpointRel.origenDatos = 'resultado';
                    docUpdated = true;
                  }
                }
              }
            }
          }
        }
      }

      if (docUpdated) {
        // Actualizar el documento
        const result = await collection.updateOne(
          { _id: doc._id },
          { $set: { workflows: doc.workflows } }
        );
        console.log(`   ✅ Documento actualizado (${result.modifiedCount} modificado)`);
        totalUpdated++;
      } else {
        console.log(`   ℹ️  Sin cambios necesarios`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE ACTUALIZACIÓN:');
    console.log('='.repeat(60));
    console.log(`✅ Documentos actualizados: ${totalUpdated}`);
    console.log(`✅ Pasos actualizados: ${totalStepsUpdated}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error durante la actualización:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

// Ejecutar actualización
forceUpdate()
  .then(() => {
    console.log('\n✅ Actualización completada exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Actualización falló:', error);
    process.exit(1);
  });
