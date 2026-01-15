const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function reestructurarFlujo() {
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
    
    console.log('\n🔧 REESTRUCTURANDO FLUJO WOOCOMMERCE\n');
    console.log('═'.repeat(80));
    
    // ============================================================================
    // PASO 1: RENOMBRAR router → router-inicial
    // ============================================================================
    console.log('\n📍 PASO 1: Renombrar router → router-inicial\n');
    
    const routerNode = flow.nodes.find(n => n.id === 'router');
    if (routerNode) {
      routerNode.id = 'router-inicial';
      if (routerNode.data) {
        routerNode.data.label = 'Router';
        routerNode.data.subtitle = 'Búsqueda Inicial';
      }
      console.log('✅ Router renombrado a router-inicial');
      
      // Actualizar edges que apuntan a 'router'
      flow.edges.forEach(edge => {
        if (edge.source === 'router') edge.source = 'router-inicial';
        if (edge.target === 'router') edge.target = 'router-inicial';
      });
      console.log('✅ Edges actualizados');
    }
    
    // ============================================================================
    // PASO 2: CREAR gpt-clasificador-intencion
    // ============================================================================
    console.log('\n📍 PASO 2: Crear gpt-clasificador-intencion\n');
    
    const existeClasificadorIntencion = flow.nodes.find(n => n.id === 'gpt-clasificador-intencion');
    if (!existeClasificadorIntencion) {
      const nuevoGptIntencion = {
        id: 'gpt-clasificador-intencion',
        type: 'gpt',
        position: { x: 1650, y: 200 },
        data: {
          label: 'OpenAI (ChatGPT, Sera...',
          subtitle: 'clasificador-intencion',
          config: {
            model: 'gpt-4o-mini',
            temperature: 0.3,
            maxTokens: 150,
            systemPrompt: `Eres un clasificador de intenciones. Analiza el mensaje del usuario y determina su intención.

INTENCIONES POSIBLES:
1. "agregar_carrito" - El usuario quiere agregar el producto al carrito
2. "buscar_mas" - El usuario quiere buscar más productos o ver otras opciones
3. "finalizar_compra" - El usuario quiere ir directo al checkout/pago

Responde SOLO con una de estas tres palabras: agregar_carrito, buscar_mas, o finalizar_compra.

Ejemplos:
- "Sí, lo quiero" → agregar_carrito
- "Agrégalo al carrito" → agregar_carrito
- "Quiero ver más opciones" → buscar_mas
- "Buscame otros libros" → buscar_mas
- "Quiero pagar ya" → finalizar_compra
- "Finalizar compra" → finalizar_compra`,
            topicHandling: 'none'
          }
        }
      };
      flow.nodes.push(nuevoGptIntencion);
      console.log('✅ gpt-clasificador-intencion creado');
    } else {
      console.log('⚠️  gpt-clasificador-intencion ya existe');
    }
    
    // ============================================================================
    // PASO 3: CREAR gpt-clasificador-continuar
    // ============================================================================
    console.log('\n📍 PASO 3: Crear gpt-clasificador-continuar\n');
    
    const existeClasificadorContinuar = flow.nodes.find(n => n.id === 'gpt-clasificador-continuar');
    if (!existeClasificadorContinuar) {
      const nuevoGptContinuar = {
        id: 'gpt-clasificador-continuar',
        type: 'gpt',
        position: { x: 2350, y: 350 },
        data: {
          label: 'OpenAI (ChatGPT, Sera...',
          subtitle: 'clasificador-continuar',
          config: {
            model: 'gpt-4o-mini',
            temperature: 0.3,
            maxTokens: 150,
            systemPrompt: `Eres un clasificador de intenciones post-carrito. Analiza el mensaje del usuario y determina si quiere seguir comprando o finalizar.

INTENCIONES POSIBLES:
1. "seguir_comprando" - El usuario quiere agregar más productos
2. "finalizar_compra" - El usuario quiere proceder al pago

Responde SOLO con una de estas dos palabras: seguir_comprando o finalizar_compra.

Ejemplos:
- "Quiero ver más productos" → seguir_comprando
- "Sí, busco algo más" → seguir_comprando
- "Quiero pagar" → finalizar_compra
- "Finalizar" → finalizar_compra
- "No, eso es todo" → finalizar_compra`,
            topicHandling: 'none'
          }
        }
      };
      flow.nodes.push(nuevoGptContinuar);
      console.log('✅ gpt-clasificador-continuar creado');
    } else {
      console.log('⚠️  gpt-clasificador-continuar ya existe');
    }
    
    // ============================================================================
    // PASO 4: CREAR router-continuar (reemplaza router-algo-mas)
    // ============================================================================
    console.log('\n📍 PASO 4: Crear router-continuar\n');
    
    const routerAlgoMas = flow.nodes.find(n => n.id === 'router-algo-mas');
    if (routerAlgoMas) {
      routerAlgoMas.id = 'router-continuar';
      routerAlgoMas.position = { x: 2600, y: 350 };
      if (routerAlgoMas.data) {
        routerAlgoMas.data.label = 'Router';
        routerAlgoMas.data.subtitle = 'Continuar Comprando';
        routerAlgoMas.data.config = {
          routes: [
            {
              id: 'route-seguir',
              label: 'Seguir Comprando',
              condition: 'seguir_comprando'
            },
            {
              id: 'route-finalizar',
              label: 'Finalizar Compra',
              condition: 'finalizar_compra'
            }
          ]
        };
      }
      console.log('✅ router-algo-mas renombrado a router-continuar');
      
      // Actualizar edges
      flow.edges.forEach(edge => {
        if (edge.source === 'router-algo-mas') edge.source = 'router-continuar';
        if (edge.target === 'router-algo-mas') edge.target = 'router-continuar';
      });
    }
    
    // ============================================================================
    // PASO 5: ACTUALIZAR router-intencion (agregar 3ra ruta: checkout directo)
    // ============================================================================
    console.log('\n📍 PASO 5: Actualizar router-intencion\n');
    
    const routerIntencion = flow.nodes.find(n => n.id === 'router-intencion');
    if (routerIntencion && routerIntencion.data && routerIntencion.data.config) {
      routerIntencion.data.config.routes = [
        {
          id: 'route-agregar',
          label: 'Agregar al Carrito',
          condition: 'agregar_carrito'
        },
        {
          id: 'route-buscar-mas',
          label: 'Buscar Más',
          condition: 'buscar_mas'
        },
        {
          id: 'route-checkout',
          label: 'Checkout Directo',
          condition: 'finalizar_compra'
        }
      ];
      console.log('✅ router-intencion actualizado con 3 rutas');
    }
    
    // ============================================================================
    // PASO 6: ACTUALIZAR EDGES - Nueva arquitectura
    // ============================================================================
    console.log('\n📍 PASO 6: Actualizar edges\n');
    
    // Eliminar edges viejos que ya no aplican
    flow.edges = flow.edges.filter(edge => {
      // Mantener todos los edges del flujo principal
      return true;
    });
    
    // Insertar edge: whatsapp-asistente → gpt-clasificador-intencion
    const edgeWhatsappToClasificador = flow.edges.find(e => 
      e.source === 'whatsapp-asistente' && e.target === 'gpt-clasificador-intencion'
    );
    if (!edgeWhatsappToClasificador) {
      flow.edges.push({
        id: 'edge-whatsapp-to-clasificador-intencion',
        source: 'whatsapp-asistente',
        target: 'gpt-clasificador-intencion',
        type: 'default'
      });
      console.log('✅ Edge: whatsapp-asistente → gpt-clasificador-intencion');
    }
    
    // Actualizar edge: whatsapp-asistente → router-intencion
    // Cambiar a: gpt-clasificador-intencion → router-intencion
    const edgeToRouterIntencion = flow.edges.find(e => 
      e.source === 'whatsapp-asistente' && e.target === 'router-intencion'
    );
    if (edgeToRouterIntencion) {
      edgeToRouterIntencion.source = 'gpt-clasificador-intencion';
      console.log('✅ Edge actualizado: gpt-clasificador-intencion → router-intencion');
    }
    
    // Insertar edge: whatsapp-confirmacion-carrito → gpt-clasificador-continuar
    const edgeConfirmacionToClasificador = flow.edges.find(e => 
      e.source === 'whatsapp-confirmacion-carrito' && e.target === 'gpt-clasificador-continuar'
    );
    if (!edgeConfirmacionToClasificador) {
      flow.edges.push({
        id: 'edge-confirmacion-to-clasificador-continuar',
        source: 'whatsapp-confirmacion-carrito',
        target: 'gpt-clasificador-continuar',
        type: 'default'
      });
      console.log('✅ Edge: whatsapp-confirmacion-carrito → gpt-clasificador-continuar');
    }
    
    // Actualizar edge: whatsapp-confirmacion-carrito → router-continuar
    // Cambiar a: gpt-clasificador-continuar → router-continuar
    const edgeToRouterContinuar = flow.edges.find(e => 
      e.source === 'whatsapp-confirmacion-carrito' && e.target === 'router-continuar'
    );
    if (edgeToRouterContinuar) {
      edgeToRouterContinuar.source = 'gpt-clasificador-continuar';
      console.log('✅ Edge actualizado: gpt-clasificador-continuar → router-continuar');
    }
    
    // Crear edge: router-intencion (route-checkout) → gpt-mercadopago
    const edgeCheckoutDirecto = flow.edges.find(e => 
      e.source === 'router-intencion' && e.sourceHandle === 'route-checkout'
    );
    if (!edgeCheckoutDirecto) {
      flow.edges.push({
        id: 'edge-router-intencion-checkout',
        source: 'router-intencion',
        sourceHandle: 'route-checkout',
        target: 'gpt-mercadopago',
        type: 'default'
      });
      console.log('✅ Edge: router-intencion (route-checkout) → gpt-mercadopago');
    }
    
    // Actualizar edge: router-intencion (route-buscar-mas) → gpt-asistente-ventas
    const edgeBuscarMas = flow.edges.find(e => 
      e.source === 'router-intencion' && e.sourceHandle === 'route-buscar-mas'
    );
    if (edgeBuscarMas && edgeBuscarMas.target !== 'gpt-asistente-ventas') {
      edgeBuscarMas.target = 'gpt-asistente-ventas';
      console.log('✅ Edge actualizado: router-intencion (route-buscar-mas) → gpt-asistente-ventas');
    }
    
    // Actualizar edge: router-continuar (route-seguir) → gpt-asistente-ventas
    const edgeSeguir = flow.edges.find(e => 
      e.source === 'router-continuar' && e.sourceHandle === 'route-seguir'
    );
    if (edgeSeguir && edgeSeguir.target !== 'gpt-asistente-ventas') {
      edgeSeguir.target = 'gpt-asistente-ventas';
      console.log('✅ Edge actualizado: router-continuar (route-seguir) → gpt-asistente-ventas');
    }
    
    // ============================================================================
    // PASO 7: GUARDAR EN MONGODB
    // ============================================================================
    console.log('\n📍 PASO 7: Guardar cambios en MongoDB\n');
    
    await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { 
        $set: { 
          nodes: flow.nodes,
          edges: flow.edges
        } 
      }
    );
    
    console.log('✅ Cambios guardados en MongoDB');
    
    // ============================================================================
    // RESUMEN FINAL
    // ============================================================================
    console.log('\n\n📊 RESUMEN DE CAMBIOS\n');
    console.log('═'.repeat(80));
    console.log('\n✅ Nodos creados:');
    console.log('   - gpt-clasificador-intencion');
    console.log('   - gpt-clasificador-continuar');
    console.log('\n✅ Nodos renombrados:');
    console.log('   - router → router-inicial');
    console.log('   - router-algo-mas → router-continuar');
    console.log('\n✅ Router actualizado:');
    console.log('   - router-intencion: 3 rutas (agregar, buscar_mas, checkout)');
    console.log('\n✅ Edges actualizados:');
    console.log('   - whatsapp-asistente → gpt-clasificador-intencion → router-intencion');
    console.log('   - whatsapp-confirmacion → gpt-clasificador-continuar → router-continuar');
    console.log('   - router-intencion (route-checkout) → gpt-mercadopago (nuevo)');
    
    console.log('\n\n🎯 ARQUITECTURA FINAL:\n');
    console.log('webhook → gpt-conversacional → gpt-formateador → router-inicial');
    console.log('  ├─ route-buscar → woocommerce → gpt-asistente-ventas');
    console.log('  └─ route-pedir-datos → gpt-pedir-datos → whatsapp → woocommerce → gpt-asistente-ventas');
    console.log('\ngpt-asistente-ventas → whatsapp-asistente → gpt-clasificador-intencion → router-intencion');
    console.log('  ├─ route-agregar → gpt-confirmacion → whatsapp-confirmacion');
    console.log('  │                    → gpt-clasificador-continuar → router-continuar');
    console.log('  │                      ├─ route-seguir → gpt-asistente-ventas');
    console.log('  │                      └─ route-finalizar → gpt-mercadopago → whatsapp-mercadopago');
    console.log('  ├─ route-buscar-mas → gpt-asistente-ventas');
    console.log('  └─ route-checkout → gpt-mercadopago → whatsapp-mercadopago');
    
    console.log('\n✅ Reestructuración completada\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

reestructurarFlujo();
