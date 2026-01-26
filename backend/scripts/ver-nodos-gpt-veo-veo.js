import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function verNodosGPT() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_db';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');
    
    const db = mongoose.connection.db;
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new mongoose.Types.ObjectId('695a156681f6d67f0ae9cf40') });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      await mongoose.disconnect();
      return;
    }
    
    const nodosGPT = flow.nodes.filter(n => n.type === 'gpt' || n.data.label?.includes('GPT') || n.data.label?.includes('OpenAI'));
    
    console.log(`\n📋 NODOS GPT EN VEO VEO (${nodosGPT.length} nodos):\n`);
    
    nodosGPT.forEach((nodo, index) => {
      console.log(`${index + 1}. ${nodo.id}`);
      console.log(`   Label: ${nodo.data.label}`);
      console.log(`   Subtitle: ${nodo.data.subtitle || 'N/A'}`);
      console.log(`   Model: ${nodo.data.config?.model || 'N/A'}`);
      
      if (nodo.data.config?.systemPrompt) {
        const prompt = nodo.data.config.systemPrompt;
        const primerasLineas = prompt.split('\n').slice(0, 5).join('\n');
        console.log(`   Prompt (primeras 5 líneas):`);
        console.log(`   ${primerasLineas.substring(0, 200)}...`);
        
        // Buscar menciones de "inglés" o "english"
        const mencionaIngles = prompt.toLowerCase().includes('inglés') || 
                               prompt.toLowerCase().includes('ingles') || 
                               prompt.toLowerCase().includes('english');
        console.log(`   📚 Menciona inglés: ${mencionaIngles ? '✅ SÍ' : '❌ NO'}`);
      }
      console.log('');
    });
    
    await mongoose.disconnect();
    console.log('✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verNodosGPT();
