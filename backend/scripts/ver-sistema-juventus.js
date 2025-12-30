import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function verSistemaJuventus() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // Buscar en configuracionbots
    const configBot = await db.collection('configuracionbots').findOne({
      empresaId: /juventus/i
    });

    console.log('🔍 SISTEMA DE JUVENTUS:');
    console.log('');

    if (configBot) {
      console.log('✅ Encontrado en configuracionbots (sistema antiguo)');
      console.log('   empresaId:', configBot.empresaId);
      console.log('   activo:', configBot.activo);
      console.log('   pasos:', configBot.pasos?.length || 0);
      console.log('   apiConfig:', configBot.apiConfig ? 'SÍ' : 'NO');
      
      if (configBot.apiConfig) {
        console.log('\n📡 API Config:');
        console.log('   baseUrl:', configBot.apiConfig.baseUrl);
        console.log('   endpoints:', configBot.apiConfig.endpoints?.length || 0);
        console.log('   workflows:', configBot.apiConfig.workflows?.length || 0);
        
        if (configBot.apiConfig.workflows && configBot.apiConfig.workflows.length > 0) {
          const wf = configBot.apiConfig.workflows[0];
          console.log('\n🔄 Workflow:');
          console.log('   nombre:', wf.nombre);
          console.log('   activo:', wf.activo);
          console.log('   trigger:', JSON.stringify(wf.trigger));
          console.log('   steps:', wf.steps?.length || 0);
        }
      }
    } else {
      console.log('❌ NO encontrado en configuracionbots');
    }

    // Buscar en api_configurations
    const apiConfig = await db.collection('api_configurations').find({
      nombre: /juventus/i
    }).toArray();

    console.log('\n📋 En api_configurations:', apiConfig.length);
    if (apiConfig.length > 0) {
      apiConfig.forEach(api => {
        console.log('   -', api.nombre, '| empresaId:', api.empresaId);
      });
    }

    await mongoose.disconnect();
    console.log('\n✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verSistemaJuventus();
