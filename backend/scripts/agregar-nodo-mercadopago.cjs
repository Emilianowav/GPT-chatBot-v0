/**
 * Script para Agregar Nodo de MercadoPago al Flujo de Carrito
 * 
 * FLUJO CORRECTO:
 * Router Carrito → MercadoPago → WhatsApp Link Pago
 * 
 * FECHA: 2026-01-15
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function agregarMercadoPago() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    
    const db = client.db('neural_chatbot');
    const flow = await db.collection('flows').findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      throw new Error(`Flujo ${FLOW_ID} no encontrado`);
    }
    
    console.log('\n📊 Flujo actual:');
    console.log(`   Nodos: ${flow.nodes.length}`);
    console.log(`   Edges: ${flow.edges.length}`);
    
    // ============================================================
    // PASO 1: Crear nodo de MercadoPago
    // ============================================================
    
    console.log('\n🔧 PASO 1: Creando nodo de MercadoPago...');
    
    const nodoMercadoPago = {
      id: 'mercadopago-crear-preference',
      type: 'mercadopago',
      data: {
        label: 'MercadoPago',
        config: {
          module: 'create-preference',
          items: '{{productos_carrito}}',
          payer: {
            name: '{{nombre_cliente}}',
            email: '{{email_cliente}}',
            phone: {
              area_code: '379',
              number: '{{telefono_cliente}}'
            }
          },
          back_urls: {
            success: 'https://www.veoveolibros.com.ar/success',
            failure: 'https://www.veoveolibros.com.ar/failure',
            pending: 'https://www.veoveolibros.com.ar/pending'
          },
          notification_url: 'https://tu-backend.com/webhook/mercadopago',
          auto_return: 'approved',
          external_reference: '{{1.from}}_{{timestamp}}'
        }
      },
      position: { x: 1000, y: 200 }
    };
    
    // Verificar si ya existe
    const existeMercadoPago = flow.nodes.find(n => n.id === 'mercadopago-crear-preference');
    if (!existeMercadoPago) {
      flow.nodes.push(nodoMercadoPago);
      console.log('   ✅ Nodo MercadoPago agregado');
    } else {
      console.log('   ⚠️  Nodo MercadoPago ya existe, actualizando...');
      const index = flow.nodes.findIndex(n => n.id === 'mercadopago-crear-preference');
      flow.nodes[index] = nodoMercadoPago;
    }
    
    // ============================================================
    // PASO 2: Encontrar nodos relacionados
    // ============================================================
    
    console.log('\n🔍 Identificando nodos relacionados...');
    
    const routerCarrito = flow.nodes.find(n => n.id === 'router-carrito');
    const whatsappLinkPago = flow.nodes.find(n => n.id === 'whatsapp-link-pago');
    const whatsappSolicitar = flow.nodes.find(n => n.id === 'whatsapp-solicitar-datos');
    
    console.log(`   Router Carrito: ${routerCarrito?.id || 'NO ENCONTRADO'}`);
    console.log(`   WhatsApp Link Pago: ${whatsappLinkPago?.id || 'NO ENCONTRADO'}`);
    console.log(`   WhatsApp Solicitar: ${whatsappSolicitar?.id || 'NO ENCONTRADO'}`);
    
    if (!routerCarrito || !whatsappLinkPago || !whatsappSolicitar) {
      throw new Error('No se encontraron todos los nodos necesarios');
    }
    
    // ============================================================
    // PASO 3: Reconfigurar conexiones del Router Carrito
    // ============================================================
    
    console.log('\n🔧 PASO 2: Reconfigurando conexiones...');
    
    // Eliminar conexión directa: Router Carrito → WhatsApp Link Pago
    const edgesAnteriores = flow.edges.length;
    flow.edges = flow.edges.filter(e => 
      !(e.source === 'router-carrito' && e.target === 'whatsapp-link-pago')
    );
    
    console.log(`   Conexiones eliminadas: ${edgesAnteriores - flow.edges.length}`);
    
    // Agregar nuevas conexiones
    const nuevasConexiones = [
      // Router Carrito → MercadoPago (si datos completos)
      {
        id: 'edge-router-mercadopago',
        source: 'router-carrito',
        target: 'mercadopago-crear-preference',
        data: {
          condition: 'confirmacion_compra equals true AND nombre_cliente exists AND email_cliente exists',
          label: '✅ Datos Completos'
        }
      },
      
      // Router Carrito → WhatsApp Solicitar (si faltan datos)
      {
        id: 'edge-router-solicitar',
        source: 'router-carrito',
        target: 'whatsapp-solicitar-datos',
        data: {
          label: '❌ Faltan Datos'
        }
      },
      
      // MercadoPago → WhatsApp Link Pago
      {
        id: 'edge-mercadopago-link',
        source: 'mercadopago-crear-preference',
        target: 'whatsapp-link-pago',
        data: {
          label: 'Link generado'
        }
      }
    ];
    
    // Eliminar conexiones viejas con los mismos IDs
    flow.edges = flow.edges.filter(e => 
      !nuevasConexiones.some(nc => nc.id === e.id)
    );
    
    // Agregar las nuevas conexiones
    nuevasConexiones.forEach(conn => {
      flow.edges.push(conn);
      console.log(`   ✅ ${conn.data.label}: ${conn.source} → ${conn.target}`);
    });
    
    // ============================================================
    // PASO 4: Actualizar mensaje de WhatsApp Link Pago
    // ============================================================
    
    console.log('\n🔧 PASO 3: Actualizando mensaje de WhatsApp Link Pago...');
    
    const indexLinkPago = flow.nodes.findIndex(n => n.id === 'whatsapp-link-pago');
    if (indexLinkPago !== -1) {
      flow.nodes[indexLinkPago].data.config.message = '¡Perfecto! 🎉\n\nTu pedido está listo para pagar.\n\n💰 Total: ${{total}}\n\n👉 Pagá aquí: {{mercadopago-crear-preference.init_point}}\n\nTe avisamos cuando se confirme el pago 📦';
      
      console.log('   ✅ Mensaje actualizado con variable de MercadoPago');
    }
    
    // ============================================================
    // PASO 5: Guardar cambios
    // ============================================================
    
    console.log('\n💾 Guardando cambios...');
    
    await db.collection('flows').updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes, edges: flow.edges } }
    );
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ NODO MERCADOPAGO AGREGADO EXITOSAMENTE');
    console.log('='.repeat(60));
    
    console.log('\n📊 Resumen:');
    console.log(`   Nodos: ${flow.nodes.length}`);
    console.log(`   Edges: ${flow.edges.length}`);
    
    console.log('\n🔗 Flujo de carrito completo:');
    console.log('   1. GPT Armar Carrito');
    console.log('   2. Router Carrito');
    console.log('   3a. MercadoPago (si datos completos)');
    console.log('   3b. WhatsApp Solicitar Datos (si faltan datos)');
    console.log('   4. WhatsApp Link Pago');
    
    console.log('\n📝 Webhook de confirmación:');
    console.log('   - Endpoint: /webhook/mercadopago');
    console.log('   - Archivo: backend/src/routes/webhookRoutes.ts');
    console.log('   - Función: Recibe notificación de pago y envía confirmación');
    
    console.log('\n⚠️  IMPORTANTE:');
    console.log('   - Configurar MERCADOPAGO_ACCESS_TOKEN en .env');
    console.log('   - Configurar notification_url con URL pública (ngrok o producción)');
    console.log('   - Registrar webhook en routes/index.ts');
    
    console.log('\n🧪 Próximos pasos:');
    console.log('   1. Verificar en el frontend que el flujo se ve correcto');
    console.log('   2. Probar flujo completo de carrito');
    console.log('   3. Configurar webhook en producción');
    
  } catch (error) {
    console.error('❌ Error agregando MercadoPago:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
agregarMercadoPago()
  .then(() => {
    console.log('\n✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
