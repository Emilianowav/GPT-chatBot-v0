const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function fixFlujoWooCommerce() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');

    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');

    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    if (!flow) {
      console.error('❌ Flujo no encontrado');
      return;
    }

    console.log('🔧 CORRIGIENDO FLUJO WOOCOMMERCE - SOLUCIÓN COMPLETA\n');

    // SOLUCIÓN 1: Agregar nodo router-estado ANTES de validador-datos
    console.log('📝 Paso 1: Agregando router-estado para evitar re-búsquedas...');
    
    const routerEstadoNode = {
      id: 'router-estado',
      type: 'router',
      position: { x: 400, y: 400 },
      data: {
        label: 'Router Estado',
        config: {
          module: 'router',
          routes: [
            {
              id: 'ya-buscado',
              label: 'Ya se buscó',
              condition: '{{busqueda_completada}} exists',
              target: 'whatsapp-resultados' // Saltar directo a mostrar resultados
            },
            {
              id: 'primera-vez',
              label: 'Primera búsqueda',
              condition: '{{busqueda_completada}} not exists',
              target: 'validador-datos' // Continuar flujo normal
            }
          ]
        }
      }
    };

    // Verificar si ya existe
    const existeRouterEstado = flow.nodes.find(n => n.id === 'router-estado');
    if (!existeRouterEstado) {
      flow.nodes.push(routerEstadoNode);
      console.log('   ✅ Nodo router-estado agregado');
    } else {
      console.log('   ⚠️  Nodo router-estado ya existe, actualizando...');
      const index = flow.nodes.findIndex(n => n.id === 'router-estado');
      flow.nodes[index] = routerEstadoNode;
    }

    // SOLUCIÓN 2: Modificar edge de gpt-formateador para ir a router-estado
    console.log('\n📝 Paso 2: Redirigiendo gpt-formateador → router-estado...');
    
    const edgeFormateadorIndex = flow.edges.findIndex(e => e.source === 'gpt-formateador');
    if (edgeFormateadorIndex !== -1) {
      flow.edges[edgeFormateadorIndex].target = 'router-estado';
      console.log('   ✅ Edge actualizado: gpt-formateador → router-estado');
    }

    // Agregar edges del router-estado
    const edgeYaBuscado = {
      id: 'router-estado-ya-buscado',
      source: 'router-estado',
      target: 'whatsapp-resultados',
      sourceHandle: 'ya-buscado',
      label: 'Ya se buscó'
    };

    const edgePrimeraVez = {
      id: 'router-estado-primera-vez',
      source: 'router-estado',
      target: 'validador-datos',
      sourceHandle: 'primera-vez',
      label: 'Primera búsqueda'
    };

    // Eliminar edges duplicados si existen
    flow.edges = flow.edges.filter(e => 
      e.id !== 'router-estado-ya-buscado' && 
      e.id !== 'router-estado-primera-vez'
    );

    flow.edges.push(edgeYaBuscado, edgePrimeraVez);
    console.log('   ✅ Edges del router-estado agregados');

    // SOLUCIÓN 3: Modificar nodo WooCommerce para guardar flag busqueda_completada
    console.log('\n📝 Paso 3: Configurando WooCommerce para guardar flag...');
    
    const wooNode = flow.nodes.find(n => n.id === 'woocommerce-search');
    if (wooNode) {
      if (!wooNode.data.config.globalVariablesOutput) {
        wooNode.data.config.globalVariablesOutput = [];
      }
      
      // Agregar variables globales de salida
      if (!wooNode.data.config.globalVariablesOutput.includes('productos')) {
        wooNode.data.config.globalVariablesOutput.push('productos');
      }
      if (!wooNode.data.config.globalVariablesOutput.includes('busqueda_completada')) {
        wooNode.data.config.globalVariablesOutput.push('busqueda_completada');
      }

      console.log('   ✅ WooCommerce configurado para guardar: productos, busqueda_completada');
    }

    // SOLUCIÓN 4: Mejorar condición del router-validacion
    console.log('\n📝 Paso 4: Mejorando validación de router-validacion...');
    
    const routerValidacion = flow.nodes.find(n => n.id === 'router-validacion');
    if (routerValidacion) {
      routerValidacion.data.config.routes[0].condition = '{{titulo_libro}} exists AND {{titulo_libro}} length > 5';
      routerValidacion.data.config.routes[1].condition = '{{titulo_libro}} not exists OR {{titulo_libro}} length <= 5';
      console.log('   ✅ Condiciones mejoradas para evitar placeholders vacíos');
    }

    // SOLUCIÓN 5: Actualizar mensaje de whatsapp-resultados para usar cache
    console.log('\n📝 Paso 5: Optimizando mensaje de resultados...');
    
    const whatsappResultados = flow.nodes.find(n => n.id === 'whatsapp-resultados');
    if (whatsappResultados) {
      // Usar productos de globalVariables si existen, sino de woocommerce-search
      whatsappResultados.data.config.mensaje = `📚 Encontré {{productos.length || 0}} resultados para "{{titulo_libro}}":

{{productos}}`;
      console.log('   ✅ Mensaje optimizado para usar cache de productos');
    }

    // Guardar cambios
    console.log('\n💾 Guardando cambios en MongoDB...');
    await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { 
        $set: { 
          nodes: flow.nodes,
          edges: flow.edges
        } 
      }
    );

    console.log('\n✅ FLUJO CORREGIDO EXITOSAMENTE\n');
    
    console.log('📋 CAMBIOS APLICADOS:');
    console.log('   ✅ Router-estado agregado para evitar re-búsquedas');
    console.log('   ✅ Flujo redirigido: gpt-formateador → router-estado');
    console.log('   ✅ WooCommerce guarda flag busqueda_completada');
    console.log('   ✅ Router-validacion valida longitud de titulo_libro');
    console.log('   ✅ WhatsApp-resultados usa cache de productos\n');

    console.log('🎯 NUEVO FLUJO:');
    console.log('   1. Usuario envía mensaje');
    console.log('   2. GPT conversacional responde');
    console.log('   3. GPT formateador extrae datos');
    console.log('   4. Router-estado verifica:');
    console.log('      - Si busqueda_completada exists → Mostrar resultados (CACHE)');
    console.log('      - Si busqueda_completada not exists → Continuar');
    console.log('   5. Validador verifica datos');
    console.log('   6. Router-validacion verifica titulo_libro válido');
    console.log('   7. WooCommerce busca UNA SOLA VEZ');
    console.log('   8. Guarda busqueda_completada = true');
    console.log('   9. Muestra resultados\n');

    console.log('🧪 PRÓXIMO PASO:');
    console.log('   Limpia estado: node scripts/limpiar-mi-numero.js');
    console.log('   Prueba: "Hola" → "la dos de harry potter" → "cualquiera"');
    console.log('   Verifica: Solo 1 búsqueda en WooCommerce, no 3');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixFlujoWooCommerce();
