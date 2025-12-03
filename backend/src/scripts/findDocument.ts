/**
 * Script para buscar un documento específico por ID
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { ObjectId } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../../.env');
config({ path: envPath });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';

const TARGET_ID = '6917126a03862ac8bb3fd4f2';

async function findDoc() {
  try {
    console.log('🔄 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('No se pudo obtener la base de datos');
    }

    console.log(`🔍 Buscando documento con ID: ${TARGET_ID}\n`);

    // Listar todas las colecciones
    const collections = await db.listCollections().toArray();
    
    for (const colInfo of collections) {
      const colName = colInfo.name;
      const collection = db.collection(colName);
      
      try {
        // Buscar por _id como ObjectId
        let doc = await collection.findOne({ _id: new ObjectId(TARGET_ID) });
        
        if (doc) {
          console.log(`✅ ENCONTRADO EN COLECCIÓN: ${colName}`);
          console.log(JSON.stringify(doc, null, 2));
          
          // Si tiene workflows, mostrar detalles
          if (doc.workflows) {
            console.log(`\n📋 WORKFLOWS ENCONTRADOS: ${doc.workflows.length}`);
            for (let wIdx = 0; wIdx < doc.workflows.length; wIdx++) {
              const workflow = doc.workflows[wIdx];
              console.log(`\nWorkflow ${wIdx + 1}:`);
              console.log(`  ID: ${workflow.id || workflow._id}`);
              console.log(`  Nombre: ${workflow.nombre}`);
              if (workflow.steps) {
                console.log(`  Pasos: ${workflow.steps.length}`);
                workflow.steps.forEach((step: any, sIdx: number) => {
                  console.log(`    Paso ${sIdx + 1}: tipo="${step.tipo}", var="${step.nombreVariable}"`);
                  if (step.tipo === 'ejecutar') {
                    console.log(`      ⚠️  TIPO 'ejecutar' ENCONTRADO`);
                  }
                });
              }
            }
          }
          
          // Si tiene configuracion.workflows
          if (doc.configuracion && doc.configuracion.workflows) {
            console.log(`\n📋 WORKFLOWS EN CONFIGURACIÓN: ${doc.configuracion.workflows.length}`);
            for (let wIdx = 0; wIdx < doc.configuracion.workflows.length; wIdx++) {
              const workflow = doc.configuracion.workflows[wIdx];
              console.log(`\nWorkflow ${wIdx + 1}:`);
              console.log(`  ID: ${workflow.id || workflow._id}`);
              console.log(`  Nombre: ${workflow.nombre}`);
              if (workflow.steps) {
                console.log(`  Pasos: ${workflow.steps.length}`);
                workflow.steps.forEach((step: any, sIdx: number) => {
                  console.log(`    Paso ${sIdx + 1}: tipo="${step.tipo}", var="${step.nombreVariable}"`);
                  if (step.tipo === 'ejecutar') {
                    console.log(`      ⚠️  TIPO 'ejecutar' ENCONTRADO`);
                  }
                });
              }
            }
          }
          
          return;
        }
        
        // Buscar por _id como string
        doc = await collection.findOne({ _id: TARGET_ID as any });
        if (doc) {
          console.log(`✅ ENCONTRADO EN COLECCIÓN (string ID): ${colName}`);
          console.log(JSON.stringify(doc, null, 2));
          return;
        }
        
      } catch (err) {
        // Ignorar errores de conversión de ObjectId
      }
    }
    
    console.log(`❌ Documento no encontrado en ninguna colección`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

findDoc()
  .then(() => {
    console.log('\n✅ Búsqueda completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Búsqueda falló:', error);
    process.exit(1);
  });
