const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

/**
 * AGREGAR SOLO LOS NODOS FINALES AL FLUJO EXISTENTE
 * 
 * Mantener todo el flujo actual tal cual está.
 * Solo agregar después del último router:
 * 
 * router-intencion
 *   ├─ route-agregar → gpt-carrito → whatsapp-confirmacion
 *   ├─ route-buscar → [sin edge]
 *   └─ route-checkout → mercadopago → whatsapp-pago
 */

async function agregarNodosFinales() {
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
    
    console.log('\n🔧 AGREGANDO SOLO NODOS FINALES AL FLUJO EXISTENTE\n');
    console.log('═'.repeat(80));
    
    // ============================================================================
    // PASO 1: VERIFICAR NODOS EXISTENTES
    // ============================================================================
    console.log('\n📍 PASO 1: Verificar nodos existentes\n');
    
    const nodosExistentes = flow.nodes.map(n => n.id);
    console.log(`Nodos actuales: ${nodosExistentes.length}`);
    
    // Verificar que existe router-intencion
    const routerIntencion = flow.nodes.find(n => n.id === 'router-intencion');
    if (!routerIntencion) {
      console.log('❌ No se encontró router-intencion');
      return;
    }
    console.log('✅ router-intencion encontrado');
    
    // ============================================================================
    // PASO 2: AGREGAR NODOS FINALES (si no existen)
    // ============================================================================
    console.log('\n📍 PASO 2: Agregar nodos finales\n');
    
    const nodosNuevos = [];
    
    // GPT-Carrito
    if (!nodosExistentes.includes('gpt-carrito')) {
      nodosNuevos.push({
        id: 'gpt-carrito',
        type: 'gpt',
        position: { x: 2850, y: 100 },
        data: {
          label: 'OpenAI (ChatGPT, Sera...',
          subtitle: 'conversacional',
          config: {
            model: 'gpt-4o-mini',
            temperature: 0.5,
            maxTokens: 400,
            systemPrompt: 'El usuario quiere agregar un producto al carrito. Extrae el producto mencionado, actualiza el carrito global (formato JSON: {productos: [{id, nombre, precio, cantidad}], total: X}), confirma la acción y pregunta si quiere seguir comprando o finalizar.',
            topicHandling: 'none'
          }
        }
      });
      console.log('✅ Agregando: gpt-carrito');
    }
    
    // WhatsApp-Confirmación
    if (!nodosExistentes.includes('whatsapp-confirmacion')) {
      nodosNuevos.push({
        id: 'whatsapp-confirmacion',
        type: 'whatsapp',
        position: { x: 3100, y: 100 },
        data: {
          label: 'WhatsApp Business Clo...',
          subtitle: 'Send a Message',
          config: {
            action: 'send_message',
            message: '{{gpt_response}}'
          }
        }
      });
      console.log('✅ Agregando: whatsapp-confirmacion');
    }
    
    // MercadoPago
    if (!nodosExistentes.includes('mercadopago')) {
      nodosNuevos.push({
        id: 'mercadopago',
        type: 'mercadopago',
        position: { x: 2850, y: 300 },
        data: {
          label: 'MercadoPago',
          subtitle: 'Generate Payment Link',
          config: {
            action: 'create_payment_link',
            items: '{{carrito.productos}}',
            total: '{{carrito.total}}'
          }
        }
      });
      console.log('✅ Agregando: mercadopago');
    }
    
    // WhatsApp-Pago
    if (!nodosExistentes.includes('whatsapp-pago')) {
      nodosNuevos.push({
        id: 'whatsapp-pago',
        type: 'whatsapp',
        position: { x: 3100, y: 300 },
        data: {
          label: 'WhatsApp Business Clo...',
          subtitle: 'Send a Message',
          config: {
            action: 'send_message',
            message: '{{payment_link}}'
          }
        }
      });
      console.log('✅ Agregando: whatsapp-pago');
    }
    
    flow.nodes.push(...nodosNuevos);
    console.log(`\n📊 ${nodosNuevos.length} nodos nuevos agregados`);
    
    // ============================================================================
    // PASO 3: AGREGAR EDGES PARA LOS NODOS NUEVOS
    // ============================================================================
    console.log('\n📍 PASO 3: Agregar edges para nodos nuevos\n');
    
    const edgesExistentes = flow.edges.map(e => e.id);
    const edgesNuevos = [];
    
    // Edge: router-intencion (route-agregar) → gpt-carrito
    if (!edgesExistentes.includes('edge-router-to-carrito')) {
      edgesNuevos.push({
        id: 'edge-router-to-carrito',
        source: 'router-intencion',
        sourceHandle: 'route-agregar',
        target: 'gpt-carrito',
        type: 'default'
      });
      console.log('✅ Agregando: router-intencion → gpt-carrito');
    }
    
    // Edge: gpt-carrito → whatsapp-confirmacion
    if (!edgesExistentes.includes('edge-carrito-to-whatsapp')) {
      edgesNuevos.push({
        id: 'edge-carrito-to-whatsapp',
        source: 'gpt-carrito',
        target: 'whatsapp-confirmacion',
        type: 'default'
      });
      console.log('✅ Agregando: gpt-carrito → whatsapp-confirmacion');
    }
    
    // Edge: router-intencion (route-checkout) → mercadopago
    if (!edgesExistentes.includes('edge-router-to-mercadopago')) {
      edgesNuevos.push({
        id: 'edge-router-to-mercadopago',
        source: 'router-intencion',
        sourceHandle: 'route-checkout',
        target: 'mercadopago',
        type: 'default'
      });
      console.log('✅ Agregando: router-intencion → mercadopago');
    }
    
    // Edge: mercadopago → whatsapp-pago
    if (!edgesExistentes.includes('edge-mercadopago-to-whatsapp')) {
      edgesNuevos.push({
        id: 'edge-mercadopago-to-whatsapp',
        source: 'mercadopago',
        target: 'whatsapp-pago',
        type: 'default'
      });
      console.log('✅ Agregando: mercadopago → whatsapp-pago');
    }
    
    flow.edges.push(...edgesNuevos);
    console.log(`\n📊 ${edgesNuevos.length} edges nuevos agregados`);
    
    // ============================================================================
    // PASO 4: ACTUALIZAR ROUTER-INTENCION
    // ============================================================================
    console.log('\n📍 PASO 4: Actualizar router-intencion\n');
    
    if (routerIntencion.data) {
      routerIntencion.data.config = {
        routes: [
          { id: 'route-buscar', label: 'Buscar Más', condition: 'buscar_mas' },
          { id: 'route-agregar', label: 'Agregar al Carrito', condition: 'agregar_carrito' },
          { id: 'route-checkout', label: 'Finalizar Compra', condition: 'finalizar_compra' }
        ]
      };
      console.log('✅ router-intencion actualizado con 3 rutas');
    }
    
    // ============================================================================
    // PASO 5: GUARDAR EN MONGODB
    // ============================================================================
    console.log('\n📍 PASO 5: Guardar en MongoDB\n');
    
    await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { 
        $set: { 
          nodes: flow.nodes,
          edges: flow.edges
        } 
      }
    );
    
    console.log('✅ Cambios guardados');
    
    // ============================================================================
    // RESUMEN
    // ============================================================================
    console.log('\n\n🎯 NODOS FINALES AGREGADOS:\n');
    console.log('router-intencion (3 salidas):');
    console.log('  ├─ route-buscar → [SIN EDGE - loop por webhook]');
    console.log('  ├─ route-agregar → gpt-carrito → whatsapp-confirmacion');
    console.log('  └─ route-checkout → mercadopago → whatsapp-pago');
    
    console.log('\n📊 ESTADÍSTICAS:');
    console.log(`   Nodos totales: ${flow.nodes.length}`);
    console.log(`   Edges totales: ${flow.edges.length}`);
    console.log(`   Nodos agregados: ${nodosNuevos.length}`);
    console.log(`   Edges agregados: ${edgesNuevos.length}`);
    
    console.log('\n✅ Nodos finales agregados al flujo existente\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

agregarNodosFinales();
