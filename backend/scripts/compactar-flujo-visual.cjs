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

    console.log('📐 COMPACTANDO FLUJO VISUAL\n');

    // ============================================================
    // DEFINIR POSICIONES COMPACTAS Y ORGANIZADAS
    // ============================================================

    const posicionesCompactas = {
      // FILA 1: Flujo principal (Y=200)
      'webhook-whatsapp': { x: 100, y: 200 },
      'gpt-conversacional': { x: 350, y: 200 },
      'gpt-formateador': { x: 600, y: 200 },
      'router': { x: 850, y: 200 },
      'woocommerce': { x: 1100, y: 200 },
      'gpt-asistente-ventas': { x: 1350, y: 200 },
      'whatsapp-asistente': { x: 1600, y: 200 },
      'router-intencion': { x: 1850, y: 200 },
      
      // FILA 2: Rama "Sin datos" (Y=50)
      'gpt-pedir-datos': { x: 1100, y: 50 },
      'whatsapp-preguntar': { x: 1350, y: 50 },
      
      // FILA 3: Rama "Agregar al carrito" (Y=350)
      'gpt-confirmacion-carrito': { x: 2100, y: 350 },
      'whatsapp-confirmacion-carrito': { x: 2350, y: 350 },
      'router-algo-mas': { x: 2600, y: 350 },
      
      // FILA 4: Rama "Finalizar compra" (Y=500)
      'gpt-mercadopago': { x: 2850, y: 500 },
      'whatsapp-mercadopago': { x: 3100, y: 500 }
    };

    // Actualizar posiciones
    const nodosActualizados = flow.nodes.map(node => {
      if (posicionesCompactas[node.id]) {
        console.log(`✅ ${node.id}: ${JSON.stringify(node.position)} → ${JSON.stringify(posicionesCompactas[node.id])}`);
        return {
          ...node,
          position: posicionesCompactas[node.id]
        };
      }
      console.log(`⚠️  ${node.id}: No se encontró posición, manteniendo actual`);
      return node;
    });

    // Guardar en BD
    await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      {
        $set: {
          nodes: nodosActualizados
        }
      }
    );

    console.log('\n✅ POSICIONES ACTUALIZADAS\n');
    console.log('📋 ESTRUCTURA VISUAL FINAL:\n');
    console.log('Fila 1 (Y=200) - Flujo Principal:');
    console.log('  Webhook → GPT Conv → GPT Format → Router → WooCommerce → GPT Asistente → WhatsApp → Router Intención\n');
    console.log('Fila 2 (Y=50) - Rama Sin Datos:');
    console.log('  GPT Pedir Datos → WhatsApp\n');
    console.log('Fila 3 (Y=350) - Rama Agregar:');
    console.log('  GPT Confirmación → WhatsApp → Router ¿Algo Más?\n');
    console.log('Fila 4 (Y=500) - Rama Finalizar:');
    console.log('  GPT Mercado Pago → WhatsApp\n');
    
    console.log('🎯 RESULTADO:');
    console.log('  - Flujo compacto y organizado');
    console.log('  - Todas las ramas visibles y conectadas');
    console.log('  - Fácil de seguir visualmente\n');
    
    console.log('🔄 Refrescá el frontend para ver los cambios');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
  }
}

main();
