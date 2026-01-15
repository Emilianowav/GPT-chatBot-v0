require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function agregarNodoNormalizador() {
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

    // Verificar si ya existe
    const existente = flow.nodes.find(n => n.id === 'gpt-normalizador-titulo');
    if (existente) {
      console.log('⚠️  Nodo gpt-normalizador-titulo ya existe, actualizando...\n');
    }

    // Configuración del nuevo nodo GPT normalizador
    const nodoNormalizador = {
      id: 'gpt-normalizador-titulo',
      type: 'gpt',
      position: { x: 600, y: 400 },
      data: {
        label: 'GPT Normalizador de Título',
        config: {
          model: 'gpt-4o-mini',
          temperature: 0.1,
          maxTokens: 150,
          systemPrompt: `Eres un experto en literatura que normaliza títulos de libros mencionados por usuarios.

TAREA:
Convierte el título informal/abreviado del usuario al título OFICIAL y COMPLETO del libro.

EJEMPLOS:

Usuario dice: "harry potter 5"
Título oficial: "Harry Potter y la Orden del Fénix"

Usuario dice: "hp 3"
Título oficial: "Harry Potter y el Prisionero de Azkaban"

Usuario dice: "cien años de soledad"
Título oficial: "Cien Años de Soledad"

Usuario dice: "el quijote"
Título oficial: "Don Quijote de la Mancha"

Usuario dice: "1984"
Título oficial: "1984"

INSTRUCCIONES:
1. Si el usuario menciona un número en una saga (ej: "harry potter 5"), identifica el título completo del libro correspondiente
2. Usa mayúsculas correctas según las normas del español
3. Si el título ya está completo, devuélvelo igual
4. Si no reconoces el libro, devuelve el título tal como está

IMPORTANTE: Responde SOLO con el título normalizado, sin explicaciones.

Título del usuario: {{titulo}}`,
          topicHandling: 'disabled',
          tipo: 'transform'
        }
      }
    };

    // Agregar o actualizar nodo
    if (existente) {
      const index = flow.nodes.findIndex(n => n.id === 'gpt-normalizador-titulo');
      flow.nodes[index] = nodoNormalizador;
    } else {
      flow.nodes.push(nodoNormalizador);
    }

    // Ahora necesitamos modificar el edge del router a woocommerce
    // para que pase por el normalizador

    // 1. Encontrar el edge router → woocommerce
    const edgeRouterWoo = flow.edges.find(e => 
      e.source === 'router' && e.target === 'woocommerce'
    );

    if (edgeRouterWoo) {
      console.log('🔍 Edge encontrado: router → woocommerce');
      console.log(`   ID: ${edgeRouterWoo.id}\n`);

      // Cambiar el target a gpt-normalizador-titulo
      edgeRouterWoo.target = 'gpt-normalizador-titulo';
      
      console.log('✅ Edge modificado: router → gpt-normalizador-titulo\n');
    }

    // 2. Crear nuevo edge: gpt-normalizador-titulo → woocommerce
    const edgeNormalizadorWoo = flow.edges.find(e => 
      e.source === 'gpt-normalizador-titulo' && e.target === 'woocommerce'
    );

    if (!edgeNormalizadorWoo) {
      const nuevoEdge = {
        id: 'edge-normalizador-woo',
        source: 'gpt-normalizador-titulo',
        target: 'woocommerce',
        type: 'default',
        animated: true,
        data: {
          label: 'Título normalizado'
        }
      };

      flow.edges.push(nuevoEdge);
      console.log('✅ Nuevo edge creado: gpt-normalizador-titulo → woocommerce\n');
    }

    console.log('💾 Guardando en MongoDB...\n');

    await flowsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes, edges: flow.edges } }
    );

    console.log('✅ Nodo normalizador agregado exitosamente\n');
    console.log('🎯 Flujo actualizado:');
    console.log('   router → gpt-normalizador-titulo → woocommerce');
    console.log('');
    console.log('📝 El normalizador:');
    console.log('   1. Recibe el título del usuario (ej: "harry potter 5")');
    console.log('   2. Lo convierte al título oficial (ej: "Harry Potter y la Orden del Fénix")');
    console.log('   3. WooCommerce busca con el título normalizado');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Desconectado');
  }
}

agregarNodoNormalizador();
