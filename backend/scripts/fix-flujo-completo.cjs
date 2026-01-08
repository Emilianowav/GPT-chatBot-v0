const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGODB_URI;

async function fixFlujoCompleto() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');

    const flowId = '695a156681f6d67f0ae9cf40';
    const db = mongoose.connection.db;
    const flowsCollection = db.collection('flows');

    const flow = await flowsCollection.findOne({ _id: new mongoose.Types.ObjectId(flowId) });
    
    if (!flow) {
      console.log('❌ Flujo no encontrado');
      process.exit(1);
    }

    console.log(`📊 Flujo: ${flow.nombre}\n`);

    // 1. AGREGAR NODO WHATSAPP SEND MESSAGE después del GPT conversacional
    console.log('🔧 PROBLEMA 1: Falta nodo WhatsApp Send Message\n');
    
    const gptConversacionalIndex = flow.nodes.findIndex(n => n.id === 'gpt-conversacional');
    const gptFormateadorIndex = flow.nodes.findIndex(n => n.id === 'gpt-formateador');
    
    // Verificar si ya existe un nodo WhatsApp entre GPT conversacional y formateador
    const existeWhatsAppRespuesta = flow.nodes.some(n => 
      n.id === 'whatsapp-respuesta-inicial' || 
      (n.type === 'whatsapp' && n.data?.config?.module === 'send-message')
    );

    if (!existeWhatsAppRespuesta) {
      console.log('   ➕ Agregando nodo WhatsApp Send Message');
      
      const nuevoNodo = {
        id: 'whatsapp-respuesta-inicial',
        type: 'whatsapp',
        category: 'action',
        position: { x: 400, y: 200 },
        data: {
          label: 'WhatsApp Business Cloud',
          subtitle: 'Send a Message',
          executionCount: 2,
          config: {
            module: 'send-message',
            phoneNumberId: '906667632531979',
            message: '{{respuesta_gpt}}',
            to: '{{from}}'
          }
        }
      };

      // Insertar después del GPT conversacional
      flow.nodes.splice(gptConversacionalIndex + 1, 0, nuevoNodo);

      // Actualizar edge: gpt-conversacional debe ir a whatsapp-respuesta-inicial
      const edgeGptToFormateador = flow.edges.findIndex(e => 
        e.source === 'gpt-conversacional' && e.target === 'gpt-formateador'
      );

      if (edgeGptToFormateador !== -1) {
        flow.edges[edgeGptToFormateador].target = 'whatsapp-respuesta-inicial';
      }

      // Agregar nuevo edge: whatsapp-respuesta-inicial a gpt-formateador
      flow.edges.push({
        id: 'whatsapp-respuesta-inicial-gpt-formateador',
        source: 'whatsapp-respuesta-inicial',
        target: 'gpt-formateador',
        sourceHandle: 'default',
        type: 'simple'
      });

      console.log('   ✅ Nodo agregado\n');
    } else {
      console.log('   ✅ Ya existe nodo WhatsApp Send Message\n');
    }

    // 2. CONFIGURAR RUTAS DE LOS ROUTERS
    console.log('🔧 PROBLEMA 2: Routers sin rutas configuradas\n');

    const validadorIndex = flow.nodes.findIndex(n => n.id === 'validador-datos');
    const routerIndex = flow.nodes.findIndex(n => n.id === 'router-validacion');

    if (validadorIndex !== -1) {
      console.log('   📝 Configurando validador-datos');
      
      flow.nodes[validadorIndex].data.config = {
        ...flow.nodes[validadorIndex].data.config,
        conditions: [
          {
            label: 'Datos completos',
            condition: '{{titulo_libro}} exists',
            outputHandle: 'route-1'
          },
          {
            label: 'Faltan datos',
            condition: '{{titulo_libro}} empty',
            outputHandle: 'route-2'
          }
        ]
      };
      console.log('   ✅ Validador configurado\n');
    }

    if (routerIndex !== -1) {
      console.log('   📝 Configurando router-validacion');
      
      flow.nodes[routerIndex].data.config = {
        ...flow.nodes[routerIndex].data.config,
        conditions: [
          {
            label: 'Buscar en WooCommerce',
            condition: 'true',
            outputHandle: 'route-1'
          },
          {
            label: 'Sin búsqueda',
            condition: 'false',
            outputHandle: 'route-2'
          }
        ]
      };
      console.log('   ✅ Router configurado\n');
    }

    // 3. CONFIGURAR WOOCOMMERCE (placeholder - necesita credenciales reales)
    console.log('🔧 PROBLEMA 3: WooCommerce sin conexión\n');
    
    const wooIndex = flow.nodes.findIndex(n => n.id === 'woocommerce-search');
    
    if (wooIndex !== -1) {
      console.log('   ⚠️  WooCommerce necesita configuración manual:');
      console.log('   - URL de la tienda');
      console.log('   - Consumer Key');
      console.log('   - Consumer Secret');
      console.log('   Por ahora, marcando como configurado para testing\n');
      
      flow.nodes[wooIndex].data.config = {
        ...flow.nodes[wooIndex].data.config,
        module: 'woo_search',
        searchQuery: '{{titulo_libro}}',
        // Estas credenciales deben ser reales
        storeUrl: 'https://tu-tienda.com',
        consumerKey: 'ck_XXXXX',
        consumerSecret: 'cs_XXXXX'
      };
    }

    // 4. GUARDAR CAMBIOS
    console.log('💾 Guardando cambios...\n');
    
    const result = await flowsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(flowId) },
      { $set: { nodes: flow.nodes, edges: flow.edges } }
    );

    console.log(`   Matched: ${result.matchedCount}`);
    console.log(`   Modified: ${result.modifiedCount}`);
    
    if (result.modifiedCount > 0) {
      console.log('\n✅ Flujo actualizado correctamente');
    } else {
      console.log('\n⚠️  No se modificó el flujo');
    }

    // 5. RESUMEN
    console.log('\n📋 RESUMEN DE CAMBIOS:\n');
    console.log(`   Total nodos: ${flow.nodes.length}`);
    console.log(`   Total edges: ${flow.edges.length}`);
    
    const whatsappNodes = flow.nodes.filter(n => n.type === 'whatsapp');
    console.log(`   Nodos WhatsApp: ${whatsappNodes.length}`);
    whatsappNodes.forEach(n => {
      console.log(`      - ${n.id} (${n.data?.config?.module || 'sin módulo'})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixFlujoCompleto();
