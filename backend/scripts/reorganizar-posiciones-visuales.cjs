const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

/**
 * LAYOUT VISUAL OPTIMIZADO
 * 
 * Organización horizontal de izquierda a derecha:
 * - Columna 1 (x=100): webhook-whatsapp
 * - Columna 2 (x=350): gpt-conversacional
 * - Columna 3 (x=600): gpt-formateador
 * - Columna 4 (x=850): router-inicial
 * - Columna 5 (x=1100): gpt-pedir-datos (arriba), woocommerce (abajo)
 * - Columna 6 (x=1350): whatsapp-preguntar (arriba), gpt-asistente-ventas (centro)
 * - Columna 7 (x=1600): whatsapp-asistente
 * - Columna 8 (x=1850): gpt-clasificador-intencion
 * - Columna 9 (x=2100): router-intencion
 * - Columna 10 (x=2350): gpt-confirmacion-carrito (arriba), gpt-mercadopago (abajo)
 * - Columna 11 (x=2600): whatsapp-confirmacion-carrito (arriba), whatsapp-mercadopago (abajo)
 * - Columna 12 (x=2850): gpt-clasificador-continuar
 * - Columna 13 (x=3100): router-continuar
 */

async function reorganizarPosiciones() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      return;
    }
    
    console.log('\n🎨 REORGANIZANDO POSICIONES VISUALES\n');
    console.log('═'.repeat(80));
    
    // Mapa de posiciones optimizadas
    const posiciones = {
      // FASE 1: Conversación Inicial
      'webhook-whatsapp': { x: 100, y: 200 },
      'gpt-conversacional': { x: 350, y: 200 },
      'gpt-formateador': { x: 600, y: 200 },
      'router-inicial': { x: 850, y: 200 },
      
      // FASE 2: Búsqueda (dos caminos)
      'gpt-pedir-datos': { x: 1100, y: 50 },
      'whatsapp-preguntar': { x: 1350, y: 50 },
      'woocommerce': { x: 1100, y: 350 },
      
      // FASE 3: Asistente de Ventas (hub central)
      'gpt-asistente-ventas': { x: 1600, y: 200 },
      'whatsapp-asistente': { x: 1850, y: 200 },
      
      // FASE 4: Clasificación de Intención
      'gpt-clasificador-intencion': { x: 2100, y: 200 },
      'router-intencion': { x: 2350, y: 200 },
      
      // FASE 5: Camino Carrito (arriba)
      'gpt-confirmacion-carrito': { x: 2600, y: 50 },
      'whatsapp-confirmacion-carrito': { x: 2850, y: 50 },
      'gpt-clasificador-continuar': { x: 3100, y: 50 },
      'router-continuar': { x: 3350, y: 50 },
      
      // FASE 6: Checkout/Pago (abajo)
      'gpt-mercadopago': { x: 2600, y: 350 },
      'whatsapp-mercadopago': { x: 2850, y: 350 }
    };
    
    let nodosActualizados = 0;
    
    flow.nodes.forEach(node => {
      if (posiciones[node.id]) {
        const nuevaPos = posiciones[node.id];
        const posAnterior = node.position;
        
        node.position = nuevaPos;
        nodosActualizados++;
        
        console.log(`✅ ${node.id}`);
        console.log(`   Anterior: x=${posAnterior?.x}, y=${posAnterior?.y}`);
        console.log(`   Nueva: x=${nuevaPos.x}, y=${nuevaPos.y}`);
      } else {
        console.log(`⚠️  ${node.id} - No tiene posición definida (se mantiene)`);
      }
    });
    
    console.log(`\n📊 Total nodos actualizados: ${nodosActualizados}/${flow.nodes.length}`);
    
    // Guardar en MongoDB
    console.log('\n💾 Guardando posiciones en MongoDB...');
    
    await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes } }
    );
    
    console.log('✅ Posiciones guardadas correctamente');
    
    console.log('\n\n🎯 LAYOUT FINAL:\n');
    console.log('─'.repeat(80));
    console.log('\n[FASE 1: CONVERSACIÓN INICIAL]');
    console.log('webhook → gpt-conversacional → gpt-formateador → router-inicial');
    console.log('\n[FASE 2: BÚSQUEDA]');
    console.log('router-inicial ┬─ (arriba) → gpt-pedir-datos → whatsapp → gpt-asistente-ventas');
    console.log('               └─ (abajo) → woocommerce → gpt-asistente-ventas');
    console.log('\n[FASE 3: VENTAS]');
    console.log('gpt-asistente-ventas → whatsapp-asistente → gpt-clasificador-intencion → router-intencion');
    console.log('\n[FASE 4: TRES CAMINOS]');
    console.log('router-intencion ┬─ (arriba) route-agregar → gpt-confirmacion → whatsapp-confirmacion');
    console.log('                 │                            → gpt-clasificador-continuar → router-continuar');
    console.log('                 │                              ┬─ route-seguir → gpt-asistente-ventas (loop)');
    console.log('                 │                              └─ route-finalizar → gpt-mercadopago → whatsapp-mercadopago');
    console.log('                 ├─ (centro) route-buscar-mas → gpt-asistente-ventas (loop)');
    console.log('                 └─ (abajo) route-checkout → gpt-mercadopago → whatsapp-mercadopago');
    
    console.log('\n✅ Reorganización completada\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

reorganizarPosiciones();
