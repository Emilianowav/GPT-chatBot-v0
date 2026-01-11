require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

async function verConfigConversacional() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db();
    const flow = await db.collection('flows').findOne({ _id: new ObjectId('695a156681f6d67f0ae9cf40') });
    
    const conversacional = flow.nodes.find(n => n.id === 'gpt-conversacional');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('GPT CONVERSACIONAL - CONFIGURACIÓN COMPLETA');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('📋 PERSONALIDAD:');
    console.log('─'.repeat(63));
    console.log(conversacional.data.config.personalidad || 'NO CONFIGURADA');
    console.log('');
    
    console.log('📚 TÓPICOS:');
    console.log('─'.repeat(63));
    if (conversacional.data.config.topicos && conversacional.data.config.topicos.length > 0) {
      conversacional.data.config.topicos.forEach((topico, i) => {
        console.log(`\n${i + 1}. ${topico.titulo}`);
        console.log(`   ID: ${topico.id}`);
        console.log(`   Contenido: ${topico.contenido.substring(0, 100)}...`);
        if (topico.keywords) {
          console.log(`   Keywords: ${topico.keywords.join(', ')}`);
        }
      });
    } else {
      console.log('NO CONFIGURADOS');
    }
    console.log('');
    
    console.log('📝 VARIABLES A RECOPILAR:');
    console.log('─'.repeat(63));
    if (conversacional.data.config.variablesRecopilar && conversacional.data.config.variablesRecopilar.length > 0) {
      conversacional.data.config.variablesRecopilar.forEach((variable, i) => {
        console.log(`\n${i + 1}. ${variable.nombre}`);
        console.log(`   Descripción: ${variable.descripcion}`);
        console.log(`   Tipo: ${variable.tipo}`);
        console.log(`   Obligatoria: ${variable.obligatorio}`);
      });
    } else {
      console.log('NO CONFIGURADAS');
    }
    console.log('');
    
    console.log('🔧 SYSTEM PROMPT (legacy):');
    console.log('─'.repeat(63));
    console.log(conversacional.data.config.systemPrompt || 'NO CONFIGURADO');
    console.log('');
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('CONFIGURACIÓN COMPLETA (JSON):');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(JSON.stringify(conversacional.data.config, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verConfigConversacional();
