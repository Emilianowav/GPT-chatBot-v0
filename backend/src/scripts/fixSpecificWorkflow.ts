/**
 * Script para arreglar workflow específico con tipo 'ejecutar'
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { ObjectId } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../../.env');
console.log('📁 Cargando .env desde:', envPath);
config({ path: envPath });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';
console.log('🔗 MongoDB URI:', MONGODB_URI.substring(0, 20) + '...');

// IDs del error
const API_ID = '6917126a03862ac8bb3fd4f2';
const WORKFLOW_ID = '622ed9c8a6a2eef3970761b6ef1248e9';

async function fixWorkflow() {
  try {
    console.log('🔄 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('No se pudo obtener la base de datos');
    }

    console.log(`🔍 Buscando API con ID: ${API_ID}`);
    console.log(`🔍 Buscando Workflow con ID: ${WORKFLOW_ID}\n`);

    // Buscar en todas las colecciones posibles
    const collectionNames = [
      'api_configurations',
      'apiconfigurations',
      'configuraciones_modulo',
      'configuracionmodulos'
    ];

    let found = false;

    for (const colName of collectionNames) {
      console.log(`📂 Buscando en colección: ${colName}...`);
      
      try {
        const collection = db.collection(colName);
        
        // Buscar por _id como ObjectId
        let doc = await collection.findOne({ _id: new ObjectId(API_ID) });
        
        if (!doc) {
          // Buscar por _id como string
          doc = await collection.findOne({ _id: API_ID as any });
        }
        
        if (!doc) {
          // Buscar por apiId en configuracion
          doc = await collection.findOne({ 'configuracion.apiId': API_ID });
        }
        
        if (doc) {
          console.log(`✅ Documento encontrado en: ${colName}\n`);
          
          let updated = false;
          let workflows = doc.workflows || doc.configuracion?.workflows;
          
          if (!workflows) {
            console.log('❌ No se encontraron workflows en el documento');
            continue;
          }
          
          console.log(`📋 Workflows encontrados: ${workflows.length}\n`);
          
          for (let wIdx = 0; wIdx < workflows.length; wIdx++) {
            const workflow = workflows[wIdx];
            const wId = workflow.id || workflow._id;
            
            console.log(`Workflow ${wIdx + 1}: ID=${wId}, Nombre=${workflow.nombre}`);
            
            if (wId === WORKFLOW_ID || wId?.toString() === WORKFLOW_ID) {
              console.log(`\n🎯 ¡WORKFLOW OBJETIVO ENCONTRADO!\n`);
              
              if (workflow.steps && Array.isArray(workflow.steps)) {
                console.log(`   Pasos totales: ${workflow.steps.length}\n`);
                
                for (let sIdx = 0; sIdx < workflow.steps.length; sIdx++) {
                  const step = workflow.steps[sIdx];
                  console.log(`   Paso ${sIdx + 1} (orden ${step.orden}): tipo="${step.tipo}", var="${step.nombreVariable}"`);
                  
                  if (step.tipo === 'ejecutar') {
                    console.log(`      ⚠️  ENCONTRADO tipo 'ejecutar' - ACTUALIZANDO...`);
                    step.tipo = 'consulta_filtrada';
                    console.log(`      ✅ Actualizado a 'consulta_filtrada'`);
                    updated = true;
                    
                    // Actualizar endpointsRelacionados
                    if (step.endpointsRelacionados && Array.isArray(step.endpointsRelacionados)) {
                      for (let eIdx = 0; eIdx < step.endpointsRelacionados.length; eIdx++) {
                        const endpointRel = step.endpointsRelacionados[eIdx];
                        if (!endpointRel.origenDatos) {
                          console.log(`      🔧 Agregando origenDatos='resultado' a endpoint relacionado ${eIdx + 1}`);
                          endpointRel.origenDatos = 'resultado';
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          
          if (updated) {
            console.log(`\n💾 Guardando cambios...`);
            
            // Actualizar el documento
            const updateField = doc.workflows ? 'workflows' : 'configuracion.workflows';
            const result = await collection.updateOne(
              { _id: doc._id },
              { $set: { [updateField]: workflows } }
            );
            
            console.log(`✅ Documento actualizado exitosamente`);
            console.log(`   Documentos modificados: ${result.modifiedCount}`);
            console.log(`   Documentos encontrados: ${result.matchedCount}`);
            found = true;
            break;
          } else {
            console.log(`ℹ️  No se encontraron pasos con tipo 'ejecutar' en este workflow`);
          }
        }
      } catch (err) {
        console.log(`   ⚠️  Error en colección ${colName}:`, (err as Error).message);
      }
    }
    
    if (!found) {
      console.log(`\n❌ No se encontró el documento o workflow especificado`);
      console.log(`\n💡 Intenta buscar manualmente con:`);
      console.log(`   npm run inspect-db`);
    } else {
      console.log(`\n✅ ¡Migración completada exitosamente!`);
      console.log(`\n🔄 Ahora recarga el frontend y vuelve a intentar guardar el workflow`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

fixWorkflow()
  .then(() => {
    console.log('\n✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
