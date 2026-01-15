require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function fixFormateadorTipo() {
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

    // Buscar el nodo gpt-formateador
    const formateador = flow.nodes.find(n => n.id === 'gpt-formateador');

    if (!formateador) {
      console.log('❌ gpt-formateador no encontrado');
      return;
    }

    console.log('🔍 NODO FORMATEADOR ACTUAL:');
    console.log(`   ID: ${formateador.id}`);
    console.log(`   Tipo actual: ${formateador.data.config.tipo}`);
    console.log(`   extractionConfig.enabled: ${formateador.data.config.extractionConfig?.enabled}`);
    console.log('');

    // Cambiar tipo a "formateador"
    formateador.data.config.tipo = 'formateador';

    // Asegurar que extractionConfig tenga systemPrompt
    if (!formateador.data.config.extractionConfig.systemPrompt) {
      console.log('⚠️  extractionConfig.systemPrompt no existe, usando systemPrompt principal');
      formateador.data.config.extractionConfig.systemPrompt = formateador.data.config.systemPrompt;
    }

    // Convertir schema a variables (formato esperado por extractWithFrontendConfig)
    if (formateador.data.config.extractionConfig.schema) {
      formateador.data.config.extractionConfig.variables = Object.entries(
        formateador.data.config.extractionConfig.schema
      ).map(([nombre, config]) => ({
        nombre,
        tipo: config.type,
        requerido: config.required || false,
        descripcion: `Variable ${nombre}`
      }));
      
      console.log('✅ Variables convertidas desde schema:');
      formateador.data.config.extractionConfig.variables.forEach((v) => {
        console.log(`   - ${v.nombre} (${v.tipo}, requerido: ${v.requerido})`);
      });
    }

    console.log('\n🔧 CAMBIOS APLICADOS:');
    console.log(`   Tipo: "transform" → "formateador"`);
    console.log(`   extractionConfig.systemPrompt: ${formateador.data.config.extractionConfig.systemPrompt ? 'OK' : 'FALTA'}`);
    console.log(`   extractionConfig.variables: ${formateador.data.config.extractionConfig.variables?.length || 0} variables`);
    console.log('');

    console.log('💾 Guardando en MongoDB...\n');

    await flowsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes } }
    );

    console.log('✅ Nodo formateador actualizado exitosamente\n');
    console.log('🎯 CONFIGURACIÓN FINAL:');
    console.log(JSON.stringify(formateador.data.config, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Desconectado');
  }
}

fixFormateadorTipo();
