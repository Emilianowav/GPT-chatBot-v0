require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function verVariablesFormateador() {
  try {
    console.log('✅ Conectando a MongoDB...\n');
    await mongoose.connect(MONGODB_URI);

    const db = mongoose.connection.db;
    const flowsCollection = db.collection('flows');

    const flow = await flowsCollection.findOne({ _id: new mongoose.Types.ObjectId(FLOW_ID) });

    if (!flow) {
      console.log('❌ Flujo no encontrado');
      return;
    }

    console.log('📊 FLUJO:', flow.nombre);
    console.log('═══════════════════════════════════════\n');

    const formateador = flow.nodes.find(n => n.id === 'gpt-formateador');

    if (!formateador) {
      console.log('❌ gpt-formateador no encontrado');
      return;
    }

    console.log('🔍 NODO FORMATEADOR:');
    console.log(`   ID: ${formateador.id}`);
    console.log(`   Label: ${formateador.data.label}`);
    console.log('');

    console.log('📋 EXTRACTION CONFIG:');
    console.log(JSON.stringify(formateador.data.config.extractionConfig, null, 2));
    console.log('');

    if (formateador.data.config.extractionConfig?.variables) {
      console.log('📝 VARIABLES CONFIGURADAS:');
      formateador.data.config.extractionConfig.variables.forEach((v) => {
        console.log(`   - ${v.nombre}:`);
        console.log(`     Tipo: ${v.tipo}`);
        console.log(`     Requerido: ${v.requerido ? '✅ SÍ' : '❌ NO'}`);
        console.log(`     Descripción: ${v.descripcion || 'N/A'}`);
        console.log('');
      });
    }

    if (formateador.data.config.extractionConfig?.schema) {
      console.log('📝 SCHEMA CONFIGURADO:');
      Object.entries(formateador.data.config.extractionConfig.schema).forEach(([nombre, config]) => {
        console.log(`   - ${nombre}:`);
        console.log(`     Tipo: ${config.type}`);
        console.log(`     Requerido: ${config.required ? '✅ SÍ' : '❌ NO'}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Desconectado');
  }
}

verVariablesFormateador();
