import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function verificarConfigFormateador() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_db';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');
    
    const db = mongoose.connection.db;
    const flowsCollection = db.collection('flows');
    
    // Buscar el flujo WooCommerce
    const flow = await flowsCollection.findOne({ _id: new mongoose.Types.ObjectId('695a156681f6d67f0ae9cf40') });
    
    if (!flow) {
      console.log('❌ Flujo no encontrado');
      process.exit(1);
    }
    
    console.log(`\n📋 Flujo: ${flow.nombre}`);
    
    // Buscar el nodo gpt-formateador
    const formateador = flow.nodes?.find(n => n.id === 'gpt-formateador');
    
    if (!formateador) {
      console.log('❌ Nodo gpt-formateador no encontrado');
      process.exit(1);
    }
    
    console.log('\n🔍 CONFIGURACIÓN DEL NODO gpt-formateador:\n');
    console.log('ID:', formateador.id);
    console.log('Tipo:', formateador.type);
    console.log('Label:', formateador.data?.label);
    console.log('\n📋 Config:');
    console.log(JSON.stringify(formateador.data?.config, null, 2));
    
    // Verificar extractionConfig
    if (formateador.data?.config?.extractionConfig) {
      console.log('\n✅ extractionConfig existe');
      console.log('Enabled:', formateador.data.config.extractionConfig.enabled);
      console.log('Variables a extraer:', formateador.data.config.extractionConfig.variablesToExtract?.map(v => v.nombre).join(', '));
    } else {
      console.log('\n❌ extractionConfig NO existe');
    }
    
    // Verificar globalVariablesOutput
    if (formateador.data?.config?.globalVariablesOutput) {
      console.log('\n✅ globalVariablesOutput existe:', formateador.data.config.globalVariablesOutput);
    } else {
      console.log('\n❌ globalVariablesOutput NO existe');
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificarConfigFormateador();
