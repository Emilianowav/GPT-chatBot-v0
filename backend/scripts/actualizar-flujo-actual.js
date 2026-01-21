import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URI = process.env.MONGODB_URI;

async function actualizarFlujoActual() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('chatbot_crm');
    const flowsCollection = db.collection('flows');
    
    // Buscar el flujo activo de Veo Veo
    const empresaId = new ObjectId('6940a9a181b92bfce970fdb5');
    const flow = await flowsCollection.findOne({ empresaId, activo: true });
    
    if (!flow) {
      console.log('❌ No hay flujo activo para Veo Veo');
      return;
    }
    
    console.log('✅ Flujo activo encontrado:', flow.nombre);
    console.log('🆔 ID:', flow._id.toString());
    
    // Leer configuración del JSON
    const flujoPath = path.join(__dirname, '..', '..', 'FLUJO-VEO-VEO-COMPLETO.json');
    const flujoData = JSON.parse(fs.readFileSync(flujoPath, 'utf8'));
    
    console.log('\n🔧 Actualizando configuración...\n');
    
    // Actualizar nodo GPT asistente con el systemPrompt correcto
    const gptNodeIndex = flow.nodes.findIndex(n => n.id === 'gpt-asistente-ventas');
    if (gptNodeIndex !== -1) {
      const nuevoPrompt = flujoData.nodos.find(n => n.id === 'gpt-asistente-ventas')?.data?.config?.systemPrompt;
      if (nuevoPrompt) {
        flow.nodes[gptNodeIndex].data.config.systemPrompt = nuevoPrompt;
        console.log('✅ SystemPrompt del nodo GPT actualizado');
        console.log('   Usa {{productos_formateados}}:', nuevoPrompt.includes('{{productos_formateados}}') ? '✅ SÍ' : '❌ NO');
      }
    }
    
    // Agregar/actualizar variables globales
    if (!flow.config) {
      flow.config = {};
    }
    
    flow.config.variables_globales = flujoData.variables_globales;
    console.log('✅ Variables globales agregadas:', Object.keys(flujoData.variables_globales).length);
    
    // Asegurar que los tópicos estén configurados
    if (!flow.config.topicos) {
      flow.config.topicos = flujoData.topicos_flujo.topicos;
      flow.config.topicos_habilitados = true;
      console.log('✅ Tópicos agregados:', Object.keys(flujoData.topicos_flujo.topicos).length);
    }
    
    // Guardar cambios
    await flowsCollection.updateOne(
      { _id: flow._id },
      { 
        $set: { 
          nodes: flow.nodes,
          config: flow.config,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log('\n💾 Cambios guardados en BD');
    
    console.log('\n' + '═'.repeat(80));
    console.log('✅ FLUJO ACTUALIZADO EXITOSAMENTE');
    console.log('═'.repeat(80));
    
    console.log('\n📊 Configuración final:');
    console.log('  - Variables globales: ✅', Object.keys(flow.config.variables_globales).length);
    console.log('  - Tópicos: ✅', Object.keys(flow.config.topicos).length);
    console.log('  - Nodo GPT usa {{productos_formateados}}: ✅');
    
    console.log('\n🔄 Próximos pasos:');
    console.log('  1. Refrescá la página del Flow Builder (F5)');
    console.log('  2. Abrí "Variables Globales" - deberían aparecer las 15 variables');
    console.log('  3. Probá enviando "Busco García Márquez" a WhatsApp');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

actualizarFlujoActual();
