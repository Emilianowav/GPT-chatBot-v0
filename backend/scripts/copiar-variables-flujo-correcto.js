import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function copiarVariablesAlFlujoCorrecto() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('chatbot_crm');
    const flowsCollection = db.collection('flows');
    
    // El flujo que estás usando
    const flujoCorrectoId = new ObjectId('695a156681f6d67f0ae9cf40');
    const flujoCorrecto = await flowsCollection.findOne({ _id: flujoCorrectoId });
    
    if (!flujoCorrecto) {
      console.log('❌ Flujo 695a156681f6d67f0ae9cf40 no encontrado');
      return;
    }
    
    console.log('✅ Flujo encontrado:', flujoCorrecto.nombre);
    console.log('🆔 ID:', flujoCorrecto._id.toString());
    console.log('🏢 Empresa:', flujoCorrecto.empresaId);
    
    // Variables globales de VeoVeo
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
    
    console.log('\n🔧 Aplicando variables globales...');
    
    // Asegurar que config existe
    if (!flujoCorrecto.config) {
      flujoCorrecto.config = {};
    }
    
    // Aplicar variables globales
    flujoCorrecto.config.variables_globales = variablesGlobales;
    
    // Actualizar en BD
    const result = await flowsCollection.updateOne(
      { _id: flujoCorrectoId },
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
    const flowActualizado = await flowsCollection.findOne({ _id: flujoCorrectoId });
    
    console.log('\n📊 Verificación:');
    console.log('   config.variables_globales existe:', !!flowActualizado.config?.variables_globales);
    
    if (flowActualizado.config?.variables_globales) {
      console.log('   Total variables:', Object.keys(flowActualizado.config.variables_globales).length);
      console.log('\n📋 Variables:');
      Object.keys(flowActualizado.config.variables_globales).forEach(key => {
        console.log(`   ✓ ${key}`);
      });
    }
    
    console.log('\n' + '═'.repeat(80));
    console.log('✅ VARIABLES COPIADAS AL FLUJO CORRECTO');
    console.log('═'.repeat(80));
    
    console.log('\n📝 Próximos pasos:');
    console.log('   1. Refrescá el Flow Builder (Ctrl+Shift+R)');
    console.log('   2. Abrí "Variables Globales"');
    console.log('   3. Deberían aparecer las 16 variables');
    console.log('   4. Configurá el GPT de carrito para usar {{productos_formateados}}');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

copiarVariablesAlFlujoCorrecto();
