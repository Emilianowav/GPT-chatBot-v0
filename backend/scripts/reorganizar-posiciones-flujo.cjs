const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function main() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db();
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.error('❌ Flujo no encontrado');
      return;
    }

    console.log('📋 Reorganizando posiciones del flujo...\n');

    // ============================================================
    // REORGANIZAR POSICIONES EN FLUJO LINEAL
    // ============================================================

    const posiciones = {
      // Fila 1: Inicio del flujo
      'webhook-whatsapp': { x: 100, y: 100 },
      'gpt-conversacional': { x: 350, y: 100 },
      'gpt-formateador': { x: 600, y: 100 },
      'router': { x: 850, y: 100 },
      
      // Fila 2: Rama "No tiene datos"
      'gpt-pedir-datos': { x: 1100, y: 0 },
      'whatsapp-preguntar': { x: 1350, y: 0 },
      
      // Fila 3: Rama principal (WooCommerce)
      'woocommerce': { x: 1100, y: 100 },
      'gpt-asistente-ventas': { x: 1350, y: 100 },
      'whatsapp-asistente': { x: 1600, y: 100 },
      'router-intencion': { x: 1850, y: 100 },
      
      // Fila 4: Rama "Agregar al carrito"
      'gpt-confirmacion-carrito': { x: 2100, y: 0 },
      'whatsapp-confirmacion-carrito': { x: 2350, y: 0 },
      'router-algo-mas': { x: 2600, y: 0 },
      
      // Fila 5: Rama "Finalizar compra"
      'gpt-mercadopago': { x: 2850, y: -100 },
      'whatsapp-mercadopago': { x: 3100, y: -100 }
    };

    // Actualizar posiciones
    const nodosActualizados = flow.nodes.map(node => {
      if (posiciones[node.id]) {
        return {
          ...node,
          position: posiciones[node.id]
        };
      }
      return node;
    });

    await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      {
        $set: {
          nodes: nodosActualizados
        }
      }
    );

    console.log('✅ Posiciones reorganizadas\n');
    console.log('📋 NUEVA ESTRUCTURA:\n');
    console.log('Fila 1 (Principal):');
    console.log('  Webhook → GPT Conv → GPT Format → Router → WooCommerce → GPT Asistente → WhatsApp → Router Intención');
    console.log('');
    console.log('Fila 2 (Sin datos):');
    console.log('  Router → GPT Pedir Datos → WhatsApp');
    console.log('');
    console.log('Fila 3 (Agregar):');
    console.log('  Router Intención → GPT Confirmación → WhatsApp → Router ¿Algo más?');
    console.log('');
    console.log('Fila 4 (Finalizar):');
    console.log('  Router ¿Algo Más? → GPT Mercado Pago → WhatsApp');
    console.log('');
    console.log('✅ Refrescá el frontend para ver los cambios');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
  }
}

main();
