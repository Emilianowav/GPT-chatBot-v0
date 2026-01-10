const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const FLOW_ID = '695a156681f6d67f0ae9cf40';

/**
 * ORGANIZAR FLUJO EN CUADRÍCULA LIMPIA
 * Layout horizontal con espaciado uniforme
 */

async function organizarFlujo() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');

    const db = client.db('crm_bot');
    const flowsCollection = db.collection('flows');

    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    if (!flow) {
      console.error('❌ Flujo no encontrado');
      return;
    }

    console.log('📐 ORGANIZANDO FLUJO EN CUADRÍCULA LIMPIA\n');

    // Espaciado uniforme
    const SPACING_X = 250;
    const SPACING_Y = 180;
    const START_X = 100;
    const START_Y = 100;

    // Definir posiciones en cuadrícula limpia
    const posiciones = {
      // Fila 1: Flujo principal
      '1': { x: START_X, y: START_Y },
      'gpt-conversacional': { x: START_X + SPACING_X, y: START_Y },
      'whatsapp-respuesta': { x: START_X + SPACING_X * 2, y: START_Y },
      
      // Fila 2: Formateador y validación
      'gpt-formateador': { x: START_X + SPACING_X, y: START_Y + SPACING_Y },
      'router-validacion': { x: START_X + SPACING_X * 2, y: START_Y + SPACING_Y },
      
      // Fila 3: WooCommerce y router productos
      'woocommerce-search': { x: START_X + SPACING_X * 3, y: START_Y + SPACING_Y },
      'router-productos': { x: START_X + SPACING_X * 4, y: START_Y + SPACING_Y },
      
      // Fila 3: Resultados (ramificación)
      'whatsapp-resultados': { x: START_X + SPACING_X * 5, y: START_Y + SPACING_Y - 50 },
      'whatsapp-sin-resultados': { x: START_X + SPACING_X * 5, y: START_Y + SPACING_Y + 50 }
    };

    // Actualizar posiciones de nodos
    flow.nodes.forEach(node => {
      if (posiciones[node.id]) {
        node.position = posiciones[node.id];
        console.log(`   ✅ ${node.id}: (${node.position.x}, ${node.position.y})`);
      }
    });

    // Asegurar que todas las conexiones estén correctas
    flow.edges = [
      // Flujo principal
      { 
        id: 'e1-gpt', 
        source: '1', 
        target: 'gpt-conversacional',
        type: 'smoothstep',
        animated: true
      },
      { 
        id: 'e-gpt-whatsapp', 
        source: 'gpt-conversacional', 
        target: 'whatsapp-respuesta',
        type: 'smoothstep'
      },
      { 
        id: 'e-gpt-formateador', 
        source: 'gpt-conversacional', 
        target: 'gpt-formateador',
        type: 'smoothstep',
        animated: true
      },
      
      // Formateador → Router validación
      { 
        id: 'e-formateador-router', 
        source: 'gpt-formateador', 
        target: 'router-validacion',
        type: 'smoothstep',
        animated: true
      },
      
      // Router validación → WooCommerce (solo si datos completos)
      { 
        id: 'e-router-woo', 
        source: 'router-validacion', 
        target: 'woocommerce-search',
        sourceHandle: 'datos-completos',
        type: 'smoothstep',
        animated: true,
        label: 'Datos completos'
      },
      
      // WooCommerce → Router productos
      { 
        id: 'e-woo-router-prod', 
        source: 'woocommerce-search', 
        target: 'router-productos',
        type: 'smoothstep',
        animated: true
      },
      
      // Router productos → WhatsApp resultados
      { 
        id: 'e-router-prod-resultados', 
        source: 'router-productos', 
        target: 'whatsapp-resultados',
        sourceHandle: 'con-productos',
        type: 'smoothstep',
        animated: true,
        label: 'Con productos'
      },
      
      // Router productos → WhatsApp sin resultados
      { 
        id: 'e-router-prod-sin-resultados', 
        source: 'router-productos', 
        target: 'whatsapp-sin-resultados',
        sourceHandle: 'sin-productos',
        type: 'smoothstep',
        label: 'Sin productos'
      }
    ];

    // Guardar cambios
    await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { 
        $set: { 
          nodes: flow.nodes,
          edges: flow.edges,
          updatedAt: new Date()
        } 
      }
    );

    console.log('\n✅ Flujo organizado exitosamente');
    console.log(`   Nodos: ${flow.nodes.length}`);
    console.log(`   Conexiones: ${flow.edges.length}`);
    console.log('\n📊 LAYOUT:');
    console.log('   Fila 1: Webhook → GPT → WhatsApp Respuesta');
    console.log('   Fila 2: Formateador → Router Validación → WooCommerce → Router Productos');
    console.log('   Fila 3: WhatsApp Resultados / WhatsApp Sin Resultados');
    console.log('\n🔄 Refrescá el frontend para ver los cambios');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

organizarFlujo();
