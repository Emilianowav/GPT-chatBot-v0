const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI;
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function pulirFlujoWooCommerce() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');

    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');

    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });

    if (!flow) {
      console.log('❌ Flujo no encontrado');
      return;
    }

    console.log('🔧 PULIENDO FLUJO WOOCOMMERCE\n');

    // 1. CORREGIR ROUTER-VALIDACION
    const routerValidacion = flow.nodes.find(n => n.id === 'router-validacion');
    if (routerValidacion) {
      console.log('📝 Corrigiendo router-validacion...');
      
      routerValidacion.data.config.routes = [
        {
          label: 'Buscar en WooCommerce',
          condition: '{{titulo_libro}} exists',
          targetNodeId: 'woocommerce-search'
        },
        {
          label: 'Datos incompletos',
          condition: '{{titulo_libro}} not exists',
          targetNodeId: 'whatsapp-sin-busqueda'
        }
      ];
      
      console.log('   ✅ Condiciones actualizadas:');
      console.log('      Ruta 1: {{titulo_libro}} exists → woocommerce-search');
      console.log('      Ruta 2: {{titulo_libro}} not exists → whatsapp-sin-busqueda');
    }

    // 2. CORREGIR VALIDADOR-DATOS
    const validadorDatos = flow.nodes.find(n => n.id === 'validador-datos');
    if (validadorDatos) {
      console.log('\n📝 Corrigiendo validador-datos...');
      
      validadorDatos.data.config.routes = [
        {
          label: 'Datos completos',
          condition: '{{titulo_libro}} exists',
          targetNodeId: 'router-validacion'
        },
        {
          label: 'Faltan datos',
          condition: '{{titulo_libro}} not exists',
          targetNodeId: 'whatsapp-solicitar-datos'
        }
      ];
      
      console.log('   ✅ Condiciones actualizadas:');
      console.log('      Ruta 1: {{titulo_libro}} exists → router-validacion');
      console.log('      Ruta 2: {{titulo_libro}} not exists → whatsapp-solicitar-datos');
    }

    // 3. ACTUALIZAR MENSAJE SIN BÚSQUEDA
    const whatsappSinBusqueda = flow.nodes.find(n => n.id === 'whatsapp-sin-busqueda');
    if (whatsappSinBusqueda) {
      console.log('\n📝 Actualizando mensaje sin búsqueda...');
      
      whatsappSinBusqueda.data.config.message = 'Perfecto, sigo conversando contigo. ¿Hay algo más en lo que pueda ayudarte? 😊';
      
      console.log('   ✅ Mensaje actualizado (no envía búsqueda vacía)');
    }

    // 4. ACTUALIZAR MENSAJE SOLICITAR DATOS
    const whatsappSolicitarDatos = flow.nodes.find(n => n.id === 'whatsapp-solicitar-datos');
    if (whatsappSolicitarDatos) {
      console.log('\n📝 Actualizando mensaje solicitar datos...');
      
      whatsappSolicitarDatos.data.config.message = '¿Qué libro estás buscando? 📚';
      
      console.log('   ✅ Mensaje actualizado');
    }

    // 5. VERIFICAR ROUTER-PRODUCTOS
    const routerProductos = flow.nodes.find(n => n.id === 'router-productos');
    if (routerProductos) {
      console.log('\n📝 Verificando router-productos...');
      
      if (!routerProductos.data.config.routes || routerProductos.data.config.routes.length === 0) {
        routerProductos.data.config.routes = [
          {
            label: 'Con productos',
            condition: '{{productos.length}} > 0',
            targetNodeId: 'whatsapp-resultados'
          },
          {
            label: 'Sin productos',
            condition: '{{productos.length}} == 0',
            targetNodeId: 'whatsapp-sin-productos'
          }
        ];
        console.log('   ✅ Rutas configuradas');
      } else {
        console.log('   ✅ Ya tiene rutas configuradas');
      }
    }

    // 6. GUARDAR CAMBIOS
    console.log('\n💾 Guardando cambios en MongoDB...');

    const resultado = await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { 
        $set: { 
          'nodes': flow.nodes
        } 
      }
    );

    if (resultado.modifiedCount > 0) {
      console.log('\n✅ FLUJO PULIDO EXITOSAMENTE\n');
      console.log('📋 CAMBIOS APLICADOS:');
      console.log('   ✅ router-validacion: valida {{titulo_libro}} exists');
      console.log('   ✅ validador-datos: valida {{titulo_libro}} exists');
      console.log('   ✅ Mensajes actualizados para mejor UX');
      console.log('   ✅ router-productos: valida {{productos.length}} > 0');
      
      console.log('\n🎯 FLUJO OPTIMIZADO:');
      console.log('   1. Usuario: "Hola"');
      console.log('      → GPT responde sin buscar en WooCommerce ✅');
      console.log('   2. Usuario: "Quiero Harry Potter 3"');
      console.log('      → GPT pregunta editorial');
      console.log('   3. Usuario: "Me da igual"');
      console.log('      → Formateador extrae datos');
      console.log('      → Validador verifica {{titulo_libro}} exists');
      console.log('      → Router confirma datos completos');
      console.log('      → WooCommerce busca productos ✅');
      console.log('      → Router productos verifica count > 0');
      console.log('      → Envía lista a WhatsApp ✅');
      
      console.log('\n🧪 PRÓXIMO PASO:');
      console.log('   Espera ~3 min para deploy en Render');
      console.log('   Limpia estado: node scripts/limpiar-mi-numero.js');
      console.log('   Prueba: "Hola" → NO debe buscar en WooCommerce');
      console.log('   Luego: "Quiero Harry Potter 3" → Debe buscar solo después de confirmar');
    } else {
      console.log('\n⚠️  No se realizaron cambios');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

pulirFlujoWooCommerce();
