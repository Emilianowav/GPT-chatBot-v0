const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGODB_URI;

async function diagnosticarFlujoCompleto() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');

    const flowId = '695a156681f6d67f0ae9cf40';
    const db = mongoose.connection.db;
    const flowsCollection = db.collection('flows');

    const flow = await flowsCollection.findOne({ _id: new mongoose.Types.ObjectId(flowId) });
    
    if (!flow) {
      console.log('❌ Flujo no encontrado');
      process.exit(1);
    }

    console.log('🔍 DIAGNÓSTICO COMPLETO DEL FLUJO\n');
    console.log('═'.repeat(60));
    console.log(`Flujo: ${flow.nombre}`);
    console.log(`Nodos: ${flow.nodes.length}`);
    console.log(`Edges: ${flow.edges.length}`);
    console.log('═'.repeat(60));
    console.log('');

    // 1. PROBLEMA: GPT CONVERSACIONAL
    console.log('📋 PROBLEMA 1: GPT CONVERSACIONAL NO USA HISTORIAL\n');
    
    const gptConv = flow.nodes.find(n => n.id === 'gpt-conversacional');
    if (gptConv) {
      console.log('Config actual:');
      console.log(JSON.stringify(gptConv.data.config, null, 2));
      console.log('');
      console.log('❌ PROBLEMA: tipo no está configurado como "conversacional"');
      console.log('   Sin tipo="conversacional", no usa historial');
      console.log('');
    }

    // 2. PROBLEMA: GPT FORMATEADOR
    console.log('📋 PROBLEMA 2: GPT FORMATEADOR NO EXTRAE VARIABLES\n');
    
    const gptForm = flow.nodes.find(n => n.id === 'gpt-formateador');
    if (gptForm) {
      console.log('Config actual:');
      console.log(JSON.stringify(gptForm.data.config, null, 2));
      console.log('');
      console.log('❌ PROBLEMA: No tiene variablesRecopilar configuradas');
      console.log('   Debería tener: ["titulo_libro", "editorial", "edicion"]');
      console.log('');
    }

    // 3. PROBLEMA: WOOCOMMERCE PARAMS
    console.log('📋 PROBLEMA 3: WOOCOMMERCE RECIBE PARAMS UNDEFINED\n');
    
    const woo = flow.nodes.find(n => n.id === 'woocommerce-search');
    if (woo) {
      console.log('Config actual:');
      console.log(JSON.stringify(woo.data.config, null, 2));
      console.log('');
      console.log('❌ PROBLEMAS:');
      console.log('   1. params.search = "{{titulo_libro}}" pero titulo_libro no existe');
      console.log('   2. orderBy = "relevance" pero WooCommerce no acepta ese valor');
      console.log('   3. Valores válidos: date, id, title, slug, price, popularity, rating');
      console.log('');
    }

    // 4. PROBLEMA: ROUTERS
    console.log('📋 PROBLEMA 4: ROUTERS SIN CONDICIONES\n');
    
    const validador = flow.nodes.find(n => n.id === 'validador-datos');
    const router = flow.nodes.find(n => n.id === 'router-validacion');
    
    if (validador) {
      console.log('Validador config:');
      console.log(JSON.stringify(validador.data.config, null, 2));
      console.log('');
      console.log('❌ PROBLEMA: No tiene conditions configuradas');
      console.log('');
    }

    if (router) {
      console.log('Router config:');
      console.log(JSON.stringify(router.data.config, null, 2));
      console.log('');
      console.log('❌ PROBLEMA: No tiene conditions configuradas');
      console.log('');
    }

    console.log('═'.repeat(60));
    console.log('📊 RESUMEN DE PROBLEMAS:\n');
    console.log('1. GPT conversacional: No tiene tipo="conversacional"');
    console.log('2. GPT formateador: No tiene variablesRecopilar');
    console.log('3. WooCommerce: params undefined + orderBy inválido');
    console.log('4. Routers: Sin conditions');
    console.log('');
    console.log('💡 SOLUCIÓN:');
    console.log('Este flujo necesita configuración completa de cada nodo.');
    console.log('El flujo visual NO es suficiente sin configuración.');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

diagnosticarFlujoCompleto();
