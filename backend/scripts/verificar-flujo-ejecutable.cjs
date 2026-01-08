const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function verificarFlujoEjecutable() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const Flow = mongoose.model('Flow', new mongoose.Schema({}, { strict: false }));
    const flow = await Flow.findById('695a156681f6d67f0ae9cf40');

    if (!flow) {
      console.log('❌ Flujo no encontrado');
      process.exit(1);
    }

    console.log('🔍 VERIFICACIÓN DE FLUJO EJECUTABLE');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('📊 RESUMEN:');
    console.log(`   Nombre: ${flow.nombre}`);
    console.log(`   Nodos: ${flow.nodes.length}`);
    console.log(`   Edges: ${flow.edges.length}\n`);

    // Verificar cada nodo crítico
    console.log('🔍 VERIFICACIÓN DE NODOS CRÍTICOS:\n');

    // 1. WhatsApp Trigger
    const trigger = flow.nodes.find(n => n.id === 'whatsapp-trigger');
    console.log('1. WhatsApp Trigger:');
    if (trigger && trigger.data.config?.module === 'watch-events') {
      console.log('   ✅ Configurado correctamente');
      console.log(`   Module: ${trigger.data.config.module}`);
    } else {
      console.log('   ❌ NO configurado o falta module');
    }

    // 2. GPT Conversacional
    const conversacional = flow.nodes.find(n => n.id === 'gpt-conversacional');
    console.log('\n2. GPT Conversacional:');
    if (conversacional && conversacional.data.config) {
      console.log('   ✅ Existe');
      console.log(`   Tipo: ${conversacional.data.config.tipo}`);
      console.log(`   Modelo: ${conversacional.data.config.modelo}`);
      console.log(`   Personalidad: ${conversacional.data.config.personalidad ? 'SÍ' : 'NO'}`);
      console.log(`   Tópicos: ${conversacional.data.config.topicos?.length || 0}`);
      console.log(`   Variables Entrada: [${conversacional.data.config.variablesEntrada?.join(', ') || 'ninguna'}]`);
      console.log(`   Variables Salida: [${conversacional.data.config.variablesSalida?.join(', ') || 'ninguna'}]`);
    } else {
      console.log('   ❌ NO existe o sin config');
    }

    // 3. GPT Formateador
    const formateador = flow.nodes.find(n => n.id === 'gpt-formateador');
    console.log('\n3. GPT Formateador:');
    if (formateador && formateador.data.config) {
      console.log('   ✅ Existe');
      console.log(`   Tipo: ${formateador.data.config.tipo}`);
      console.log(`   Modelo: ${formateador.data.config.modelo}`);
      console.log(`   SystemPrompt: ${formateador.data.config.systemPrompt ? 'SÍ' : 'NO'}`);
      console.log(`   Output Format: ${formateador.data.config.outputFormat}`);
      console.log(`   JSON Schema: ${formateador.data.config.jsonSchema ? 'SÍ' : 'NO'}`);
      console.log(`   Variables Entrada: [${formateador.data.config.variablesEntrada?.join(', ') || 'ninguna'}]`);
      console.log(`   Variables Salida: [${formateador.data.config.variablesSalida?.join(', ') || 'ninguna'}]`);
    } else {
      console.log('   ❌ NO existe o sin config');
    }

    // 4. Validador
    const validador = flow.nodes.find(n => n.id === 'validador-datos');
    console.log('\n4. Validador de Datos:');
    if (validador && validador.data.config) {
      console.log('   ✅ Existe');
      console.log(`   Tipo: ${validador.data.config.tipo}`);
      console.log(`   Conditions: ${validador.data.config.conditions?.length || 0}`);
      if (validador.data.config.conditions) {
        validador.data.config.conditions.forEach(c => {
          console.log(`      • ${c.label}: ${c.condition} → ${c.outputHandle}`);
        });
      }
    } else {
      console.log('   ❌ NO existe o sin config');
    }

    // 5. WhatsApp Solicitar Datos
    const solicitar = flow.nodes.find(n => n.id === 'whatsapp-solicitar-datos');
    console.log('\n5. WhatsApp Solicitar Datos:');
    if (solicitar && solicitar.data.config) {
      console.log('   ✅ Existe');
      console.log(`   Module: ${solicitar.data.config.module}`);
      console.log(`   Mensaje: ${solicitar.data.config.mensaje?.substring(0, 50)}...`);
    } else {
      console.log('   ❌ NO existe o sin config');
    }

    // 6. Router
    const router = flow.nodes.find(n => n.id === 'router-validacion');
    console.log('\n6. Router de Validación:');
    if (router && router.data.config) {
      console.log('   ✅ Existe');
      console.log(`   Conditions: ${router.data.config.conditions?.length || 0}`);
      if (router.data.config.conditions) {
        router.data.config.conditions.forEach(c => {
          console.log(`      • ${c.label}: ${c.condition} → ${c.outputHandle}`);
        });
      }
    } else {
      console.log('   ❌ NO existe o sin config');
    }

    // 7. WooCommerce Search
    const woo = flow.nodes.find(n => n.id === 'woocommerce-search');
    console.log('\n7. WooCommerce Search:');
    if (woo && woo.data.config) {
      console.log('   ✅ Existe');
      console.log(`   Module: ${woo.data.config.module}`);
      console.log(`   Parámetros: ${JSON.stringify(woo.data.config.parametros || {})}`);
      console.log(`   Response Config: ${woo.data.config.responseConfig ? 'SÍ' : 'NO'}`);
    } else {
      console.log('   ❌ NO existe o sin config');
    }

    // 8. WhatsApp Resultados
    const resultados = flow.nodes.find(n => n.id === 'whatsapp-resultados');
    console.log('\n8. WhatsApp Resultados:');
    if (resultados && resultados.data.config) {
      console.log('   ✅ Existe');
      console.log(`   Module: ${resultados.data.config.module}`);
      console.log(`   Mensaje: ${resultados.data.config.mensaje?.substring(0, 50)}...`);
    } else {
      console.log('   ❌ NO existe o sin config');
    }

    // 9. WhatsApp Sin Búsqueda
    const sinBusqueda = flow.nodes.find(n => n.id === 'whatsapp-sin-busqueda');
    console.log('\n9. WhatsApp Sin Búsqueda:');
    if (sinBusqueda && sinBusqueda.data.config) {
      console.log('   ✅ Existe');
      console.log(`   Module: ${sinBusqueda.data.config.module}`);
      console.log(`   Mensaje: ${sinBusqueda.data.config.mensaje?.substring(0, 50)}...`);
    } else {
      console.log('   ❌ NO existe o sin config');
    }

    // Verificar edges
    console.log('\n\n🔗 VERIFICACIÓN DE CONEXIONES:\n');
    
    const edgesEsperados = [
      { from: 'whatsapp-trigger', to: 'gpt-conversacional', label: 'Trigger → Conversacional' },
      { from: 'gpt-conversacional', to: 'gpt-formateador', label: 'Conversacional → Formateador' },
      { from: 'gpt-formateador', to: 'validador-datos', label: 'Formateador → Validador' },
      { from: 'validador-datos', to: 'router-validacion', label: 'Validador → Router (completo)' },
      { from: 'validador-datos', to: 'whatsapp-solicitar-datos', label: 'Validador → Solicitar (incompleto)' },
      { from: 'router-validacion', to: 'woocommerce-search', label: 'Router → WooCommerce (válido)' },
      { from: 'router-validacion', to: 'whatsapp-sin-busqueda', label: 'Router → Sin Búsqueda (inválido)' },
      { from: 'woocommerce-search', to: 'whatsapp-resultados', label: 'WooCommerce → Resultados' }
    ];

    let edgesOk = 0;
    edgesEsperados.forEach(expected => {
      const edge = flow.edges.find(e => e.source === expected.from && e.target === expected.to);
      if (edge) {
        console.log(`   ✅ ${expected.label}`);
        edgesOk++;
      } else {
        console.log(`   ❌ ${expected.label} - FALTA`);
      }
    });

    // Resumen final
    console.log('\n\n📋 RESUMEN FINAL:\n');
    console.log(`   Nodos configurados: ${flow.nodes.length}/9`);
    console.log(`   Edges correctos: ${edgesOk}/${edgesEsperados.length}`);
    
    const todosNodosExisten = flow.nodes.length === 9;
    const todosEdgesExisten = edgesOk === edgesEsperados.length;
    const conversacionalOk = conversacional && conversacional.data.config?.personalidad;
    const formateadorOk = formateador && formateador.data.config?.systemPrompt;
    const validadorOk = validador && validador.data.config?.conditions?.length === 2;
    const wooOk = woo && woo.data.config?.module === 'woo_search';

    console.log('\n🎯 ESTADO DEL FLUJO:\n');
    console.log(`   ${todosNodosExisten ? '✅' : '❌'} Todos los nodos existen`);
    console.log(`   ${todosEdgesExisten ? '✅' : '❌'} Todas las conexiones existen`);
    console.log(`   ${conversacionalOk ? '✅' : '❌'} GPT Conversacional configurado`);
    console.log(`   ${formateadorOk ? '✅' : '❌'} GPT Formateador configurado`);
    console.log(`   ${validadorOk ? '✅' : '❌'} Validador configurado`);
    console.log(`   ${wooOk ? '✅' : '❌'} WooCommerce configurado`);

    if (todosNodosExisten && todosEdgesExisten && conversacionalOk && formateadorOk && validadorOk && wooOk) {
      console.log('\n\n🎉 FLUJO LISTO PARA EJECUTAR');
      console.log('═══════════════════════════════════════════════════════');
      console.log('\n✅ El flujo está completamente configurado y listo para:');
      console.log('   1. Recibir mensajes de WhatsApp');
      console.log('   2. Conversar con el usuario (personalidad Veo Veo)');
      console.log('   3. Extraer datos estructurados (título, editorial, edición)');
      console.log('   4. Validar completitud de datos');
      console.log('   5. Solicitar datos faltantes si es necesario');
      console.log('   6. Buscar productos en WooCommerce');
      console.log('   7. Enviar resultados formateados al usuario');
      console.log('\n🚀 Puedes deployar a Render con confianza');
    } else {
      console.log('\n\n⚠️  FLUJO INCOMPLETO');
      console.log('═══════════════════════════════════════════════════════');
      console.log('\n❌ Hay configuraciones faltantes o incorrectas');
      console.log('   Revisa los puntos marcados con ❌ arriba');
    }

    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificarFlujoEjecutable();
