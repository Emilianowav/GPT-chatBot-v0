const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';

const SYSTEM_PROMPT = `Eres un procesador de intenciones para Intercapital. Tu ÚNICA función es analizar el mensaje del usuario y el historial de conversación para identificar la intención y responder con UNA SOLA PALABRA que represente el tópico.

TÓPICOS VÁLIDOS:
- COMPRA: El usuario quiere comprar activos (acciones, bonos, CEDEARs, fondos)
- VENTA: El usuario quiere vender activos que posee
- PORTFOLIO: El usuario consulta su cartera, saldos, tenencias, posiciones
- CONSULTA: El usuario hace preguntas generales sobre el mercado, precios, cotizaciones
- AYUDA: El usuario necesita ayuda, no entiende algo, o saluda

REGLAS ESTRICTAS:
1. Responde SOLO con una palabra en MAYÚSCULAS: COMPRA, VENTA, PORTFOLIO, CONSULTA o AYUDA
2. NO agregues explicaciones, puntos, comas ni nada más
3. Analiza el contexto completo del historial de conversación
4. Si hay duda entre dos categorías, prioriza la más específica
5. Si el usuario saluda o dice hola, usa AYUDA

EJEMPLOS DE CLASIFICACIÓN:

Usuario: "Quiero comprar acciones de YPF"
Respuesta: COMPRA

Usuario: "¿Cuánto tengo en mi cuenta?"
Respuesta: PORTFOLIO

Usuario: "Vender mis bonos AL30"
Respuesta: VENTA

Usuario: "¿Cómo está el dólar hoy?"
Respuesta: CONSULTA

Usuario: "Hola, necesito ayuda"
Respuesta: AYUDA

Usuario: "Quiero invertir en CEDEARs"
Respuesta: COMPRA

Usuario: "¿Cuántas acciones de GGAL tengo?"
Respuesta: PORTFOLIO

Usuario: "¿A cuánto está YPF?"
Respuesta: CONSULTA

Usuario: "Liquidar mi posición en bonos"
Respuesta: VENTA`;

const USER_MESSAGE = `Mensaje del usuario: {{mensaje_usuario}}

Historial de conversación:
{{historial_conversacion}}

Información del cliente:
- Comitente: {{comitente}}
- Teléfono: {{telefono_usuario}}`;

async function actualizarGPTProcesador() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const Flow = mongoose.model('Flow', new mongoose.Schema({}, { strict: false }), 'flows');
    
    const flow = await Flow.findOne({ empresaId: 'Intercapital' });
    
    if (!flow) {
      console.log('❌ No se encontró el flujo de Intercapital');
      return;
    }

    console.log('\n📊 Flujo encontrado:', flow.nombre);
    
    // Buscar el nodo GPT #7 (el procesador)
    const nodeId = 'node-1768863064253';
    const nodeIndex = flow.nodes.findIndex(n => n.id === nodeId);
    
    if (nodeIndex === -1) {
      console.log('❌ No se encontró el nodo GPT Procesador');
      return;
    }

    console.log(`\n🔧 Actualizando nodo: ${flow.nodes[nodeIndex].data?.label}`);
    console.log(`   ID: ${nodeId}`);
    
    // Actualizar la configuración del nodo de forma más explícita
    const node = flow.nodes[nodeIndex];
    
    if (!node.data) {
      node.data = {};
    }
    
    node.data.label = 'GPT Procesador';
    
    if (!node.data.config) {
      node.data.config = {};
    }
    
    node.data.config.model = 'gpt-4o-mini';
    node.data.config.temperature = 0.1;
    node.data.config.maxTokens = 10;
    node.data.config.systemPrompt = SYSTEM_PROMPT;
    node.data.config.userMessage = USER_MESSAGE;
    node.data.config.outputVariable = 'topico_identificado';
    
    // Marcar como modificado para que Mongoose lo detecte
    flow.markModified('nodes');
    
    // Guardar cambios
    await flow.save();
    
    console.log('\n✅ Nodo actualizado correctamente');
    console.log('\n📋 Nueva configuración:');
    console.log('   Label:', node.data.label);
    console.log('   Modelo:', node.data.config.model);
    console.log('   Temperature:', node.data.config.temperature);
    console.log('   Max Tokens:', node.data.config.maxTokens);
    console.log('   Output Variable:', node.data.config.outputVariable);
    console.log('\n📝 System Prompt (primeros 200 chars):');
    console.log('   ' + node.data.config.systemPrompt.substring(0, 200) + '...');
    
    // Verificar que se guardó
    console.log('\n🔍 Verificando cambios...');
    const flowVerify = await Flow.findOne({ empresaId: 'Intercapital' });
    const nodeVerify = flowVerify.nodes.find(n => n.id === nodeId);
    
    if (nodeVerify.data?.config?.outputVariable === 'topico_identificado') {
      console.log('✅ Cambios verificados en la base de datos');
    } else {
      console.log('❌ Los cambios no se guardaron correctamente');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  }
}

actualizarGPTProcesador();
