import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function buscarFlujo() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // Buscar empresa Intercapital
    const empresa = await db.collection('empresas').findOne({ nombre: 'Intercapital' });
    
    if (!empresa) {
      console.log('❌ No se encontró la empresa Intercapital');
      await mongoose.connection.close();
      return;
    }

    console.log('🏢 Empresa encontrada:', empresa.nombre);
    console.log('   ID:', empresa._id.toString(), '\n');

    // Buscar chatbot de Intercapital
    const chatbot = await db.collection('chatbots').findOne({ 
      empresaId: empresa._id 
    });

    if (!chatbot) {
      console.log('❌ No se encontró chatbot para Intercapital');
      await mongoose.connection.close();
      return;
    }

    console.log('🤖 Chatbot encontrado:', chatbot.nombre);
    console.log('   ID:', chatbot._id.toString());
    console.log('   Estado:', chatbot.activo ? '✅ Activo' : '❌ Inactivo');
    console.log('   Workflow ID:', chatbot.workflowId?.toString() || 'No asignado', '\n');

    // Buscar workflow
    if (chatbot.workflowId) {
      const workflow = await db.collection('workflows').findOne({ 
        _id: chatbot.workflowId 
      });

      if (workflow) {
        console.log('📋 WORKFLOW ENCONTRADO');
        console.log('   ================================');
        console.log('   ID:', workflow._id.toString());
        console.log('   Nombre:', workflow.nombre);
        console.log('   Descripción:', workflow.descripcion || 'Sin descripción');
        console.log('   Estado:', workflow.activo ? '✅ Activo' : '❌ Inactivo');
        console.log('   Nodos:', workflow.nodos?.length || 0);
        console.log('   Conexiones:', workflow.conexiones?.length || 0);
        console.log('   Variables globales:', Object.keys(workflow.variablesGlobales || {}).length);
        console.log('   Tópicos habilitados:', workflow.topicos_habilitados ? 'Sí' : 'No');
        console.log('   ================================\n');

        if (workflow.nodos && workflow.nodos.length > 0) {
          console.log('📦 NODOS DEL FLUJO:');
          workflow.nodos.forEach((nodo, index) => {
            console.log(`   ${index + 1}. [${nodo.tipo}] ${nodo.nombre || nodo.id}`);
          });
          console.log('');
        }
      } else {
        console.log('⚠️  Workflow ID asignado pero no encontrado en la BD');
      }
    }

    // Buscar todos los workflows de Intercapital
    const todosWorkflows = await db.collection('workflows').find({ 
      empresaId: empresa._id 
    }).toArray();

    if (todosWorkflows.length > 0) {
      console.log(`\n📚 TODOS LOS WORKFLOWS DE INTERCAPITAL (${todosWorkflows.length}):`);
      console.log('   ================================');
      todosWorkflows.forEach((wf, index) => {
        console.log(`   ${index + 1}. ${wf.nombre}`);
        console.log(`      ID: ${wf._id.toString()}`);
        console.log(`      Estado: ${wf.activo ? '✅ Activo' : '❌ Inactivo'}`);
        console.log(`      Nodos: ${wf.nodos?.length || 0}`);
        console.log('');
      });
    }

    await mongoose.connection.close();
    console.log('✅ Conexión cerrada');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

buscarFlujo();
