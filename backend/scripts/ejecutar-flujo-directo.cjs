require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const TELEFONO = '5493794946066';
const EMPRESA_ID = '6940a9a181b92bfce970fdb5';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function ejecutarFlowCompleto() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    // Conectar MongoDB (para queries directas)
    await client.connect();
    console.log('✅ Conectado a MongoDB (MongoClient)\n');
    
    // Conectar Mongoose (para FlowExecutor)
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB (Mongoose)\n');
    
    const db = client.db('neural_chatbot');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🧪 PRUEBA COMPLETA EN PRODUCCIÓN (INFRAESTRUCTURA REAL)');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('📋 USANDO:');
    console.log('   ✅ MongoDB Producción');
    console.log('   ✅ OpenAI API (GPT-4)');
    console.log('   ✅ WooCommerce API (Veo Veo)');
    console.log('   ✅ FlowExecutor real\n');
    
    // 1. LIMPIAR ESTADO
    console.log('═══════════════════════════════════════════════════════════');
    console.log('PASO 1: LIMPIAR ESTADO');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const conversationStates = db.collection('conversation_states');
    await conversationStates.deleteMany({ phone: TELEFONO });
    console.log('✅ Estado limpiado\n');
    
    // 2. CARGAR FLUJO
    console.log('═══════════════════════════════════════════════════════════');
    console.log('PASO 2: CARGAR FLUJO');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const flowsCollection = db.collection('flows');
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.log('❌ Flujo no encontrado');
      return;
    }
    
    console.log(`✅ Flujo: ${flow.nombre}`);
    console.log(`   Nodos: ${flow.nodes.length}`);
    console.log(`   Edges: ${flow.edges.length}\n`);
    
    // 3. IMPORTAR Y EJECUTAR FLOWEXECUTOR
    console.log('═══════════════════════════════════════════════════════════');
    console.log('PASO 3: EJECUTAR FLUJO CON INFRAESTRUCTURA REAL');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('📱 Mensaje del usuario: "Busco harry potter"\n');
    
    // Importar FlowExecutor (compilado a dist)
    const { FlowExecutor } = require('../dist/services/FlowExecutor.js');
    
    // Crear instancia (sin parámetros)
    const executor = new FlowExecutor();
    
    console.log('🚀 Iniciando ejecución del flujo...\n');
    console.log('═'.repeat(70) + '\n');
    
    // Ejecutar (pasando flowId como string)
    const startTime = Date.now();
    const result = await executor.execute(
      FLOW_ID, // flowId como string
      {
        message: 'Busco harry potter',
        from: TELEFONO,
        timestamp: Date.now()
      },
      null // contactoId (opcional)
    );
    const endTime = Date.now();
    
    console.log('\n' + '═'.repeat(70));
    console.log('✅ FLUJO COMPLETADO');
    console.log('═'.repeat(70) + '\n');
    
    console.log(`⏱️  Tiempo de ejecución: ${(endTime - startTime) / 1000}s\n`);
    
    // 4. MOSTRAR RESULTADOS
    console.log('═══════════════════════════════════════════════════════════');
    console.log('PASO 4: RESULTADOS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('📊 VARIABLES GLOBALES FINALES:\n');
    const globalVars = executor.getAllGlobalVariables();
    
    if (Object.keys(globalVars).length > 0) {
      Object.entries(globalVars).forEach(([key, value]) => {
        const valueStr = JSON.stringify(value);
        if (valueStr.length > 200) {
          console.log(`   ${key}: ${valueStr.substring(0, 200)}...`);
        } else {
          console.log(`   ${key}: ${valueStr}`);
        }
      });
    } else {
      console.log('   (ninguna)');
    }
    console.log('');
    
    // Verificar variables críticas
    console.log('🔍 VALIDACIÓN DE VARIABLES CRÍTICAS:\n');
    
    const checks = [
      { name: 'titulo extraído', key: 'titulo', expected: 'harry potter' },
      { name: 'variables_completas', key: 'variables_completas', expected: true },
      { name: 'productos encontrados', key: 'woocommerce.productos', check: (v) => Array.isArray(v) && v.length > 0 },
      { name: 'respuesta GPT generada', key: 'gpt-asistente-ventas.respuesta_gpt', check: (v) => v && v.length > 0 }
    ];
    
    checks.forEach(check => {
      const value = check.key.includes('.') 
        ? check.key.split('.').reduce((obj, key) => obj?.[key], globalVars)
        : globalVars[check.key];
      
      let passed = false;
      if (check.check) {
        passed = check.check(value);
      } else if (check.expected !== undefined) {
        passed = String(value).toLowerCase().includes(String(check.expected).toLowerCase());
      }
      
      console.log(`   ${passed ? '✅' : '❌'} ${check.name}: ${JSON.stringify(value)?.substring(0, 100)}`);
    });
    console.log('');
    
    // Mostrar productos encontrados
    if (globalVars['woocommerce.productos']) {
      const productos = globalVars['woocommerce.productos'];
      console.log(`📦 PRODUCTOS ENCONTRADOS: ${productos.length}\n`);
      
      productos.slice(0, 3).forEach((prod, i) => {
        console.log(`   ${i + 1}. ${prod.name}`);
        console.log(`      Precio: $${prod.price}`);
        console.log(`      Stock: ${prod.stock_quantity || 'N/A'}`);
        console.log('');
      });
      
      if (productos.length > 3) {
        console.log(`   ... y ${productos.length - 3} más\n`);
      }
    }
    
    // Mostrar respuesta del GPT
    if (globalVars['gpt-asistente-ventas.respuesta_gpt']) {
      console.log('💬 RESPUESTA DEL GPT ASISTENTE:\n');
      const respuesta = globalVars['gpt-asistente-ventas.respuesta_gpt'];
      console.log('   ' + respuesta.substring(0, 500));
      if (respuesta.length > 500) {
        console.log('   ...\n');
      } else {
        console.log('');
      }
    }
    
    // 5. RESUMEN FINAL
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 RESUMEN FINAL');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const tituloExtraido = globalVars['titulo'];
    const productosEncontrados = globalVars['woocommerce.productos']?.length || 0;
    const respuestaGenerada = globalVars['gpt-asistente-ventas.respuesta_gpt']?.length > 0;
    
    console.log('✅ FLUJO EJECUTADO EXITOSAMENTE\n');
    console.log('Resultados:');
    console.log(`   ${tituloExtraido ? '✅' : '❌'} Título extraído: "${tituloExtraido}"`);
    console.log(`   ${productosEncontrados > 0 ? '✅' : '❌'} Productos encontrados: ${productosEncontrados}`);
    console.log(`   ${respuestaGenerada ? '✅' : '❌'} Respuesta GPT generada`);
    console.log('');
    
    if (tituloExtraido && productosEncontrados > 0 && respuestaGenerada) {
      console.log('🎉 PRUEBA EXITOSA - El flujo funciona correctamente\n');
    } else {
      console.log('⚠️  PRUEBA PARCIAL - Revisar logs para identificar problemas\n');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR EN LA EJECUCIÓN:');
    console.error(`   Mensaje: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
  } finally {
    await client.close();
    await mongoose.disconnect();
  }
}

ejecutarFlowCompleto();
