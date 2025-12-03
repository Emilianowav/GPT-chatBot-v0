/**
 * Script de inspección: Ver estructura de la base de datos
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../../.env');
config({ path: envPath });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';

async function inspect() {
  try {
    console.log('🔄 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('No se pudo obtener la base de datos');
    }

    // Listar todas las colecciones
    console.log('📚 COLECCIONES EN LA BASE DE DATOS:');
    console.log('='.repeat(60));
    const collections = await db.listCollections().toArray();
    collections.forEach((col, idx) => {
      console.log(`${idx + 1}. ${col.name}`);
    });

    // Buscar en api_configurations
    console.log('\n📋 DOCUMENTOS EN api_configurations:');
    console.log('='.repeat(60));
    const apiConfigCollection = db.collection('api_configurations');
    const docs = await apiConfigCollection.find({}).toArray();
    console.log(`Total documentos: ${docs.length}\n`);

    // Buscar en configuraciones_modulo
    console.log('\n📋 DOCUMENTOS EN configuraciones_modulo:');
    console.log('='.repeat(60));
    const configModuloCollection = db.collection('configuraciones_modulo');
    const configDocs = await configModuloCollection.find({}).toArray();
    console.log(`Total documentos: ${configDocs.length}\n`);
    
    for (const doc of configDocs) {
      console.log(`\n📄 Documento ID: ${doc._id}`);
      console.log(`   Tipo Módulo: ${doc.tipoModulo || 'N/A'}`);
      console.log(`   Empresa ID: ${doc.empresaId || 'N/A'}`);
      console.log(`   Configuración keys: ${doc.configuracion ? Object.keys(doc.configuracion).join(', ') : 'N/A'}`);
      
      if (doc.configuracion && doc.configuracion.workflows) {
        console.log(`   Workflows: ${doc.configuracion.workflows.length}`);
        
        for (let wIdx = 0; wIdx < doc.configuracion.workflows.length; wIdx++) {
          const workflow = doc.configuracion.workflows[wIdx];
          console.log(`\n   📋 Workflow ${wIdx + 1}:`);
          console.log(`      ID: ${workflow.id || workflow._id || 'Sin ID'}`);
          console.log(`      Nombre: ${workflow.nombre || 'Sin nombre'}`);
          console.log(`      Pasos: ${workflow.steps ? workflow.steps.length : 0}`);
          
          if (workflow.steps && workflow.steps.length > 0) {
            for (let sIdx = 0; sIdx < workflow.steps.length; sIdx++) {
              const step = workflow.steps[sIdx];
              console.log(`         Paso ${sIdx + 1}: tipo="${step.tipo}", var="${step.nombreVariable}"`);
              
              if (step.tipo === 'ejecutar') {
                console.log(`            ⚠️  ENCONTRADO TIPO 'ejecutar' - NECESITA MIGRACIÓN`);
              }
            }
          }
        }
      }
    }

    for (const doc of docs) {
      console.log(`\n📄 Documento ID: ${doc._id}`);
      console.log(`   Nombre: ${doc.nombre || 'Sin nombre'}`);
      console.log(`   Tipo: ${doc.tipo || 'N/A'}`);
      console.log(`   Workflows: ${doc.workflows ? doc.workflows.length : 0}`);
      
      if (doc.workflows && doc.workflows.length > 0) {
        for (let wIdx = 0; wIdx < doc.workflows.length; wIdx++) {
          const workflow = doc.workflows[wIdx];
          console.log(`\n   📋 Workflow ${wIdx + 1}:`);
          console.log(`      ID: ${workflow.id || workflow._id || 'Sin ID'}`);
          console.log(`      Nombre: ${workflow.nombre || 'Sin nombre'}`);
          console.log(`      Pasos: ${workflow.steps ? workflow.steps.length : 0}`);
          
          if (workflow.steps && workflow.steps.length > 0) {
            for (let sIdx = 0; sIdx < workflow.steps.length; sIdx++) {
              const step = workflow.steps[sIdx];
              console.log(`         Paso ${sIdx + 1}: tipo="${step.tipo}", var="${step.nombreVariable}"`);
              
              if (step.tipo === 'ejecutar') {
                console.log(`            ⚠️  ENCONTRADO TIPO 'ejecutar' - NECESITA MIGRACIÓN`);
              }
            }
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

inspect()
  .then(() => {
    console.log('\n✅ Inspección completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Inspección falló:', error);
    process.exit(1);
  });
