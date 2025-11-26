/**
 * Script de migración: Renombrar tipo de paso 'ejecutar' a 'consulta_filtrada'
 * 
 * Este script actualiza todos los workflows existentes que tienen pasos con tipo 'ejecutar'
 * para cambiarlos a 'consulta_filtrada' y asegurar compatibilidad con el nuevo schema.
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

async function migrate() {
  try {
    console.log('🔄 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('No se pudo obtener la base de datos');
    }

    const collection = db.collection('api_configurations');

    // Buscar todos los documentos que tienen pasos con tipo 'ejecutar'
    console.log('\n🔍 Buscando workflows con pasos tipo "ejecutar"...');
    
    const docsWithEjecutar = await collection.find({
      'workflows.steps.tipo': 'ejecutar'
    }).toArray();

    console.log(`📊 Encontrados ${docsWithEjecutar.length} documentos con pasos tipo "ejecutar"`);

    if (docsWithEjecutar.length === 0) {
      console.log('✅ No hay documentos para migrar');
      return;
    }

    let totalUpdated = 0;
    let totalStepsUpdated = 0;

    for (const doc of docsWithEjecutar) {
      console.log(`\n📝 Procesando documento: ${doc._id}`);
      
      let docUpdated = false;
      
      if (doc.workflows && Array.isArray(doc.workflows)) {
        for (const workflow of doc.workflows) {
          if (workflow.steps && Array.isArray(workflow.steps)) {
            for (const step of workflow.steps) {
              if (step.tipo === 'ejecutar') {
                console.log(`   ✏️  Actualizando paso ${step.orden}: "${step.nombreVariable}"`);
                step.tipo = 'consulta_filtrada';
                
                // Asegurar que endpointsRelacionados tenga el campo origenDatos
                if (step.endpointsRelacionados && Array.isArray(step.endpointsRelacionados)) {
                  for (const endpointRel of step.endpointsRelacionados) {
                    if (!endpointRel.origenDatos) {
                      endpointRel.origenDatos = 'resultado';
                      console.log(`      🔧 Agregado origenDatos='resultado' a endpoint relacionado`);
                    }
                  }
                }
                
                totalStepsUpdated++;
                docUpdated = true;
              }
            }
          }
        }
      }

      if (docUpdated) {
        // Actualizar el documento
        await collection.updateOne(
          { _id: doc._id },
          { $set: { workflows: doc.workflows } }
        );
        console.log(`   ✅ Documento actualizado`);
        totalUpdated++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE MIGRACIÓN:');
    console.log('='.repeat(60));
    console.log(`✅ Documentos actualizados: ${totalUpdated}`);
    console.log(`✅ Pasos actualizados: ${totalStepsUpdated}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

// Ejecutar migración
migrate()
  .then(() => {
    console.log('\n✅ Migración completada exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migración falló:', error);
    process.exit(1);
  });
