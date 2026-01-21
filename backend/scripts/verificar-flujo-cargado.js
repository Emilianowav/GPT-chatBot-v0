import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function verificarFlujo() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('chatbot_crm');
    const flowsCollection = db.collection('flows');
    
    // Buscar el flujo que acabamos de crear
    const flowId = new ObjectId('69705b05e58836243159e64e');
    const flow = await flowsCollection.findOne({ _id: flowId });
    
    if (!flow) {
      console.log('❌ Flujo no encontrado');
      return;
    }
    
    console.log('✅ Flujo encontrado:', flow.nombre);
    console.log('📋 ID:', flow._id);
    console.log('🏢 Empresa:', flow.empresaId);
    console.log('📊 Activo:', flow.activo);
    
    console.log('\n📊 CONFIG:');
    console.log(JSON.stringify(flow.config, null, 2));
    
    console.log('\n📊 VARIABLES GLOBALES:');
    if (flow.config?.variables_globales) {
      console.log('✅ Existen');
      console.log('Total:', Object.keys(flow.config.variables_globales).length);
      Object.entries(flow.config.variables_globales).forEach(([key, value]) => {
        console.log(`  - ${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`);
      });
    } else {
      console.log('❌ NO EXISTEN');
    }
    
    console.log('\n📚 TÓPICOS:');
    if (flow.config?.topicos) {
      console.log('✅ Existen');
      console.log('Total:', Object.keys(flow.config.topicos).length);
      Object.keys(flow.config.topicos).forEach(key => {
        console.log(`  - ${key}`);
      });
    } else {
      console.log('❌ NO EXISTEN');
    }
    
    console.log('\n🔗 NODOS:');
    console.log('Total:', flow.nodes?.length || 0);
    
    // Verificar nodo GPT
    const gptNode = flow.nodes?.find(n => n.id === 'gpt-asistente-ventas');
    if (gptNode) {
      console.log('\n🤖 NODO GPT-ASISTENTE-VENTAS:');
      const prompt = gptNode.data?.config?.systemPrompt || '';
      console.log('✅ Encontrado');
      console.log('📝 Incluye {{productos_formateados}}:', prompt.includes('{{productos_formateados}}') ? '✅ SÍ' : '❌ NO');
      console.log('📏 Longitud:', prompt.length);
    }
    
    // Verificar errores de validación
    console.log('\n⚠️  VERIFICANDO ERRORES DE VALIDACIÓN:');
    
    // Nodo #2 - OpenAI (ChatGPT, Sera... - Falta seleccionar modelo de GPT
    const nodo2 = flow.nodes?.find(n => n.id === 'gpt-clasificador-inteligente');
    if (nodo2) {
      console.log('\n[Nodo #2] gpt-clasificador-inteligente:');
      console.log('  model:', nodo2.data?.config?.model || '❌ NO DEFINIDO');
    }
    
    // Nodo #5 - Send Message: Debe estar configurado como "watch-events"
    const nodo5 = flow.nodes?.find(n => n.type === 'whatsapp' && n.data?.config?.module === 'send-message');
    if (nodo5) {
      console.log('\n[Nodo #5] WhatsApp Send Message:');
      console.log('  module:', nodo5.data?.config?.module);
      console.log('  ⚠️  Debería ser "watch-events" para el webhook');
    }
    
    // Nodos OpenAI sin tópicos de información estática
    const nodosGPT = flow.nodes?.filter(n => n.type === 'gpt') || [];
    console.log('\n[Nodos GPT] Sin tópicos de información estática:');
    nodosGPT.forEach(node => {
      const topics = node.data?.config?.topics || [];
      if (topics.length === 0 || !node.data?.config?.systemPrompt) {
        console.log(`  - ${node.id}: topics=${topics.length}, systemPrompt=${!!node.data?.config?.systemPrompt}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verificarFlujo();
