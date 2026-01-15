require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const axios = require('axios');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const TELEFONO = '5493794946066';
const EMPRESA_ID = '6940a9a181b92bfce970fdb5';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function simularProduccion() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🧪 SIMULACIÓN DE PRUEBA EN PRODUCCIÓN');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('📋 CONFIGURACIÓN:');
    console.log(`   Backend URL: ${BACKEND_URL}`);
    console.log(`   MongoDB: ${MONGO_URI.includes('localhost') ? 'Local' : 'Producción'}`);
    console.log(`   Teléfono: ${TELEFONO}`);
    console.log(`   Empresa ID: ${EMPRESA_ID}`);
    console.log(`   Flow ID: ${FLOW_ID}\n`);
    
    // 1. LIMPIAR ESTADO
    console.log('═══════════════════════════════════════════════════════════');
    console.log('PASO 1: LIMPIAR ESTADO DEL USUARIO');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const conversationStates = db.collection('conversation_states');
    await conversationStates.deleteMany({ phone: TELEFONO });
    console.log('✅ conversation_states limpiado\n');
    
    // 2. SIMULAR WEBHOOK DE WHATSAPP
    console.log('═══════════════════════════════════════════════════════════');
    console.log('PASO 2: SIMULAR WEBHOOK DE WHATSAPP');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const webhookPayload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: EMPRESA_ID,
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15550123456',
              phone_number_id: 'test_phone_id'
            },
            contacts: [{
              profile: {
                name: 'Test User'
              },
              wa_id: TELEFONO
            }],
            messages: [{
              from: TELEFONO,
              id: `wamid.test_${Date.now()}`,
              timestamp: Math.floor(Date.now() / 1000).toString(),
              type: 'text',
              text: {
                body: 'Busco harry potter'
              }
            }]
          },
          field: 'messages'
        }]
      }]
    };
    
    console.log('📤 Payload del webhook:');
    console.log(JSON.stringify(webhookPayload, null, 2));
    console.log('\n');
    
    console.log('🚀 Enviando webhook al backend...\n');
    
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/webhook/whatsapp`,
        webhookPayload,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 60000 // 60 segundos
        }
      );
      
      console.log('✅ Webhook recibido por el backend');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(response.data)}\n`);
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log('❌ No se pudo conectar al backend');
        console.log('   El backend debe estar corriendo en:', BACKEND_URL);
        console.log('\n💡 ALTERNATIVA: Ejecutar FlowExecutor directamente\n');
        
        // Ejecutar FlowExecutor directamente
        await ejecutarFlowDirecto(db, TELEFONO, 'Busco harry potter');
        return;
      }
      throw error;
    }
    
    // 3. ESPERAR Y VERIFICAR RESULTADOS
    console.log('═══════════════════════════════════════════════════════════');
    console.log('PASO 3: VERIFICAR RESULTADOS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('⏳ Esperando 5 segundos para que el flujo se ejecute...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Verificar conversation_states
    const state = await conversationStates.findOne({ phone: TELEFONO });
    
    if (state) {
      console.log('✅ Estado de conversación encontrado:');
      console.log(`   Flow ID: ${state.flowId}`);
      console.log(`   Variables globales:`);
      if (state.globalVariables) {
        Object.entries(state.globalVariables).forEach(([key, value]) => {
          console.log(`      ${key}: ${JSON.stringify(value).substring(0, 100)}`);
        });
      }
      console.log('');
    } else {
      console.log('⚠️  No se encontró estado de conversación\n');
    }
    
    // Verificar flow_logs
    const flowLogs = db.collection('flow_logs');
    const logs = await flowLogs.find({ 
      phone: TELEFONO 
    }).sort({ timestamp: -1 }).limit(10).toArray();
    
    if (logs.length > 0) {
      console.log(`✅ Logs del flujo encontrados: ${logs.length}\n`);
      logs.forEach((log, i) => {
        console.log(`Log ${i + 1}:`);
        console.log(`   Timestamp: ${new Date(log.timestamp).toLocaleString()}`);
        console.log(`   Node: ${log.nodeId}`);
        console.log(`   Type: ${log.nodeType}`);
        if (log.output) {
          console.log(`   Output: ${JSON.stringify(log.output).substring(0, 200)}...`);
        }
        console.log('');
      });
    } else {
      console.log('⚠️  No se encontraron logs del flujo\n');
    }
    
  } catch (error) {
    console.error('❌ Error en la simulación:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.close();
  }
}

async function ejecutarFlowDirecto(db, telefono, mensaje) {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔧 EJECUTANDO FLOW DIRECTAMENTE (SIN WEBHOOK)');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  try {
    // Importar FlowExecutor
    const { FlowExecutor } = require('../src/services/FlowExecutor.js');
    
    // Obtener el flujo
    const flowsCollection = db.collection('flows');
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.log('❌ Flujo no encontrado');
      return;
    }
    
    console.log(`✅ Flujo encontrado: ${flow.nombre}`);
    console.log(`   Nodos: ${flow.nodes.length}`);
    console.log(`   Edges: ${flow.edges.length}\n`);
    
    // Crear instancia del executor
    const executor = new FlowExecutor(flow, telefono, EMPRESA_ID);
    
    console.log('🚀 Ejecutando flujo...\n');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Ejecutar el flujo
    const result = await executor.execute({
      message: mensaje,
      from: telefono,
      timestamp: Date.now()
    });
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ FLUJO EJECUTADO COMPLETAMENTE');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('📊 RESULTADO FINAL:');
    console.log(JSON.stringify(result, null, 2));
    console.log('\n');
    
    // Verificar variables globales
    console.log('📋 VARIABLES GLOBALES:');
    const globalVars = executor.getAllGlobalVariables();
    Object.entries(globalVars).forEach(([key, value]) => {
      console.log(`   ${key}: ${JSON.stringify(value).substring(0, 200)}`);
    });
    console.log('\n');
    
  } catch (error) {
    console.error('❌ Error ejecutando flujo:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Ejecutar simulación
simularProduccion();
