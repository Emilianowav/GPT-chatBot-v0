import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function agregarVariablesWooCommerceFlow() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('chatbot_crm');
    const flowsCollection = db.collection('flows');
    
    // El flujo que estás usando: WooCommerce Flow
    const wooFlowId = new ObjectId('695a156681f6d67f0ae9cf40');
    const wooFlow = await flowsCollection.findOne({ _id: wooFlowId });
    
    if (!wooFlow) {
      console.log('❌ WooCommerce Flow no encontrado');
      return;
    }
    
    console.log('✅ Flujo encontrado:', wooFlow.nombre);
    console.log('🆔 ID:', wooFlow._id.toString());
    console.log('🏢 Empresa:', wooFlow.empresaId);
    console.log('📊 Activo:', wooFlow.activo);
    
    console.log('\n📊 Estado actual:');
    console.log('   config existe:', !!wooFlow.config);
    console.log('   config.variables_globales existe:', !!wooFlow.config?.variables_globales);
    
    // Variables globales para VeoVeo
    const variablesGlobales = {
      telefono_cliente: "",
      telefono_empresa: "",
      mensaje_usuario: "",
      productos_presentados: [],
      productos_formateados: "",
      titulo: "",
      autor: "",
      editorial: "",
      edicion: "",
      carrito_id: "",
      carrito_items_count: 0,
      carrito_total: 0,
      carrito_items: [],
      mercadopago_link: "",
      mercadopago_preference_id: "",
      mercadopago_estado: ""
    };
    
    console.log('\n🔧 Agregando variables globales...');
    
    // Actualizar config
    const result = await flowsCollection.updateOne(
      { _id: wooFlowId },
      { 
        $set: { 
          'config.variables_globales': variablesGlobales,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log('✅ Actualización completada');
    console.log('   Modified count:', result.modifiedCount);
    
    // Verificar
    const flowActualizado = await flowsCollection.findOne({ _id: wooFlowId });
    
    console.log('\n📊 Verificación:');
    console.log('   config.variables_globales existe:', !!flowActualizado.config?.variables_globales);
    
    if (flowActualizado.config?.variables_globales) {
      console.log('   Total variables:', Object.keys(flowActualizado.config.variables_globales).length);
      console.log('\n📋 Variables agregadas:');
      Object.keys(flowActualizado.config.variables_globales).forEach(key => {
        console.log(`   ✓ ${key}`);
      });
    }
    
    console.log('\n' + '═'.repeat(80));
    console.log('✅ VARIABLES AGREGADAS AL WOOCOMMERCE FLOW');
    console.log('═'.repeat(80));
    
    console.log('\n📝 Próximos pasos:');
    console.log('   1. Refrescá el Flow Builder (Ctrl+Shift+R)');
    console.log('   2. Abrí "Variables Globales"');
    console.log('   3. Deberían aparecer las 16 variables');
    console.log('   4. En el GPT de carrito, configurá el systemPrompt:');
    console.log('      📚 PRODUCTOS ENCONTRADOS:');
    console.log('      {{productos_formateados}}');
    console.log('      ');
    console.log('      📦 CARRITO ACTUAL:');
    console.log('      {{carrito_items}}');
    console.log('      Total: ${{carrito_total}}');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

agregarVariablesWooCommerceFlow();
