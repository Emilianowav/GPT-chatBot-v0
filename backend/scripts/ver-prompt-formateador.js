import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function verPromptFormateador() {
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
    
    const formateador = flow.nodes.find(n => n.id === 'gpt-formateador');
    
    if (!formateador) {
      console.log('❌ Nodo gpt-formateador no encontrado');
      await mongoose.disconnect();
      return;
    }
    
    console.log('\n📋 CONFIGURACIÓN DE gpt-formateador:\n');
    console.log('═'.repeat(80));
    console.log('\n📝 SYSTEM PROMPT:\n');
    console.log(formateador.data.config.systemPrompt || 'No tiene systemPrompt');
    console.log('\n' + '═'.repeat(80));
    
    if (formateador.data.config.extractionConfig) {
      console.log('\n📊 EXTRACTION CONFIG:\n');
      console.log(JSON.stringify(formateador.data.config.extractionConfig, null, 2));
    }
    
    console.log('\n\n🔍 ANÁLISIS DEL PROBLEMA:\n');
    console.log('Cuando usuario dice "Autoayuda":');
    console.log('   - ¿Tiene título? NO');
    console.log('   - ¿Tiene autor? NO');
    console.log('   - ¿Tiene editorial? NO');
    console.log('');
    console.log('Entonces el formateador probablemente devuelve:');
    console.log('   variables_completas = false');
    console.log('   variables_faltantes = ["titulo", "autor", "editorial"]');
    console.log('');
    console.log('Y el router decide:');
    console.log('   ❌ NO ir a WooCommerce (porque variables_completas = false)');
    console.log('   ✅ Ir a gpt-pedir-datos (porque variables_faltantes not_empty)');
    console.log('');
    console.log('PERO el usuario NO quiere que le pidan más datos');
    console.log('El usuario quiere buscar directamente "autoayuda" en WooCommerce');
    
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verPromptFormateador();
