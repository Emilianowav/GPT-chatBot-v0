const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function actualizarFlujo() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const Flow = mongoose.model('Flow', new mongoose.Schema({}, { strict: false }));
    const flow = await Flow.findById('695a156681f6d67f0ae9cf40');

    if (!flow) {
      console.log('❌ Flujo no encontrado');
      process.exit(1);
    }

    console.log('\n📊 Actualizando flujo:', flow.nombre);

    // NUEVO NODO: GPT Conversacional
    const gptConversacional = {
      id: 'gpt-conversacional',
      type: 'gpt',
      position: { x: 400, y: 200 },
      data: {
        label: 'OpenAI (ChatGPT)',
        subtitle: 'Conversacional',
        executionCount: 2,
        hasConnection: true,
        color: '#10a37f',
        config: {
          tipo: 'conversacional',
          module: 'conversacional',
          modelo: 'gpt-4',
          temperatura: 0.7,
          maxTokens: 500,
          personalidad: `Eres el asistente virtual de una tienda de productos.

Tu personalidad:
- Amigable y servicial
- Usas emojis ocasionalmente 😊
- Respondes de forma natural y conversacional
- Ayudas al usuario a encontrar lo que busca

Tu objetivo:
- Entender qué está buscando el usuario
- Hacer preguntas clarificadoras si es necesario
- Mantener una conversación fluida y natural`,
          topicos: [],
          variablesRecopilar: [],
          accionesCompletado: [],
          outputFormat: 'text'
        }
      }
    };

    // Actualizar posiciones de nodos existentes
    flow.nodes.forEach(node => {
      if (node.id === 'gpt-formateador') {
        node.position.x = 650;
        node.data.executionCount = 3;
      } else if (node.id === 'router-validacion') {
        node.position.x = 900;
        node.data.executionCount = 4;
      } else if (node.id === 'woocommerce-search') {
        node.position.x = 1150;
        node.data.executionCount = 5;
      } else if (node.id === 'whatsapp-sin-busqueda') {
        node.position.x = 1150;
        node.position.y = 350;
        node.data.executionCount = 5;
      } else if (node.id === 'whatsapp-resultados') {
        node.position.x = 1400;
        node.data.executionCount = 6;
      }
    });

    // Insertar nuevo nodo después de WhatsApp
    const whatsappIndex = flow.nodes.findIndex(n => n.id === 'whatsapp-trigger');
    flow.nodes.splice(whatsappIndex + 1, 0, gptConversacional);

    // ACTUALIZAR EDGES
    // 1. Cambiar edge de WhatsApp → GPT Formateador a WhatsApp → GPT Conversacional
    const whatsappToFormateadorEdge = flow.edges.find(e => 
      e.source === 'whatsapp-trigger' && e.target === 'gpt-formateador'
    );
    if (whatsappToFormateadorEdge) {
      whatsappToFormateadorEdge.target = 'gpt-conversacional';
      whatsappToFormateadorEdge.id = 'whatsapp-trigger-default-gpt-conversacional';
    }

    // 2. Agregar nuevo edge: GPT Conversacional → GPT Formateador
    const nuevoEdge = {
      id: 'gpt-conversacional-default-gpt-formateador',
      source: 'gpt-conversacional',
      target: 'gpt-formateador',
      sourceHandle: 'default',
      targetHandle: null,
      type: 'animatedLine'
    };
    
    // Insertar el nuevo edge después del edge de WhatsApp
    const whatsappEdgeIndex = flow.edges.findIndex(e => e.source === 'whatsapp-trigger');
    flow.edges.splice(whatsappEdgeIndex + 1, 0, nuevoEdge);

    // Guardar cambios
    await flow.save();

    console.log('\n✅ Flujo actualizado correctamente');
    console.log('📦 Total nodos:', flow.nodes.length);
    console.log('🔗 Total edges:', flow.edges.length);
    
    console.log('\n🔄 NUEVA SECUENCIA:');
    console.log('1. WhatsApp Watch Events (trigger)');
    console.log('2. GPT Conversacional (nuevo) ← Conversa con el usuario');
    console.log('3. GPT Formateador ← Extrae término de búsqueda');
    console.log('4. Router ← Valida si hay búsqueda');
    console.log('5a. WooCommerce Search ← Busca productos');
    console.log('5b. WhatsApp Sin Búsqueda ← Mensaje de ayuda');
    console.log('6. WhatsApp Resultados ← Envía productos');

    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

actualizarFlujo();
