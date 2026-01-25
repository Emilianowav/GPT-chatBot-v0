const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';

// Tópicos como objetos con descripción
const TOPICOS = [
  {
    nombre: 'COMPRA',
    descripcion: 'El usuario quiere comprar activos (acciones, bonos, CEDEARs, fondos)',
    categoria: 'operacion'
  },
  {
    nombre: 'VENTA',
    descripcion: 'El usuario quiere vender activos que posee',
    categoria: 'operacion'
  },
  {
    nombre: 'PORTFOLIO',
    descripcion: 'El usuario consulta su cartera, saldos, tenencias, posiciones',
    categoria: 'consulta'
  },
  {
    nombre: 'CONSULTA',
    descripcion: 'El usuario hace preguntas generales sobre el mercado, precios, cotizaciones',
    categoria: 'consulta'
  },
  {
    nombre: 'AYUDA',
    descripcion: 'El usuario necesita ayuda, no entiende algo, o saluda',
    categoria: 'soporte'
  }
];

const PERSONALIDAD = `Eres un procesador de intenciones para Intercapital. Tu ÚNICA función es analizar el mensaje del usuario y el historial de conversación para identificar la intención y responder con UNA SOLA PALABRA que represente el tópico.

TÓPICOS VÁLIDOS (definidos como variables globales):
{{topicos_disponibles}}

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

async function configurarTopicos() {
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
    
    // 1. Agregar tópicos como variables globales del flujo
    if (!flow.globalVariables) {
      flow.globalVariables = {};
    }

    // Crear string con todos los tópicos para la personalidad
    const topicosString = TOPICOS.map(t => `- ${t.nombre}: ${t.descripcion}`).join('\n');
    
    // Guardar tópicos como variables globales
    flow.globalVariables.topicos_disponibles = topicosString;
    flow.globalVariables.topico_identificado = ''; // Se llenará por el GPT
    
    // Guardar cada tópico individual también
    TOPICOS.forEach(topico => {
      flow.globalVariables[`topico_${topico.nombre.toLowerCase()}`] = topico.descripcion;
    });

    console.log('\n📝 Variables globales de tópicos agregadas:');
    console.log('   - topicos_disponibles');
    console.log('   - topico_identificado');
    TOPICOS.forEach(t => {
      console.log(`   - topico_${t.nombre.toLowerCase()}`);
    });

    // 2. Actualizar el GPT Procesador
    const nodeId = 'node-1768863064253';
    const nodeIndex = flow.nodes.findIndex(n => n.id === nodeId);
    
    if (nodeIndex === -1) {
      console.log('❌ No se encontró el nodo GPT Procesador');
      return;
    }

    const node = flow.nodes[nodeIndex];
    
    if (!node.data) {
      node.data = {};
    }
    
    node.data.label = 'GPT Procesador';
    
    if (!node.data.config) {
      node.data.config = {};
    }
    
    // Actualizar configuración
    node.data.config.tipo = 'procesador';
    node.data.config.modelo = 'gpt-4o-mini';
    node.data.config.temperatura = 0.1;
    node.data.config.maxTokens = 10;
    node.data.config.personalidad = PERSONALIDAD;
    node.data.config.outputVariable = 'topico_identificado';
    node.data.config.variablesEntrada = [
      'mensaje_usuario', 
      'historial_conversacion', 
      'comitente', 
      'telefono_usuario',
      'topicos_disponibles' // Agregar tópicos como variable de entrada
    ];
    node.data.config.globalVariablesOutput = ['topico_identificado'];
    
    // Agregar tópicos al nodo
    node.data.config.topicos = TOPICOS.map(t => ({
      nombre: t.nombre,
      descripcion: t.descripcion,
      categoria: t.categoria
    }));

    console.log('\n🔧 GPT Procesador actualizado:');
    console.log('   Label:', node.data.label);
    console.log('   Tipo:', node.data.config.tipo);
    console.log('   Variables Entrada:', node.data.config.variablesEntrada);
    console.log('   Tópicos configurados:', node.data.config.topicos.length);
    
    // Marcar como modificado
    flow.markModified('nodes');
    flow.markModified('globalVariables');
    
    // Guardar cambios
    await flow.save();
    
    console.log('\n✅ Flujo actualizado correctamente');
    
    // Verificar
    console.log('\n🔍 Verificando cambios...');
    const flowVerify = await Flow.findOne({ empresaId: 'Intercapital' });
    
    if (flowVerify.globalVariables?.topicos_disponibles) {
      console.log('✅ Variables globales de tópicos guardadas');
      console.log('   topicos_disponibles:', flowVerify.globalVariables.topicos_disponibles.substring(0, 100) + '...');
    }
    
    const nodeVerify = flowVerify.nodes.find(n => n.id === nodeId);
    if (nodeVerify.data?.config?.topicos) {
      console.log('✅ Tópicos configurados en GPT Procesador:', nodeVerify.data.config.topicos.length);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  }
}

configurarTopicos();
