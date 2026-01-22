import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function forzarVariablesGlobales() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('chatbot_crm');
    const flowsCollection = db.collection('flows');
    
    // Buscar el flujo de Veo Veo
    const empresaId = new ObjectId('6940a9a181b92bfce970fdb5');
    const flow = await flowsCollection.findOne({ empresaId });
    
    if (!flow) {
      console.log('❌ Flujo no encontrado');
      return;
    }
    
    console.log('✅ Flujo encontrado:', flow.nombre);
    console.log('🆔 ID:', flow._id.toString());
    
    // Variables globales completas
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
    
    console.log('\n🔧 Forzando actualización de variables globales...');
    
    // Actualizar usando $set directo
    const result = await flowsCollection.updateOne(
      { _id: flow._id },
      { 
        $set: { 
          'config.variables_globales': variablesGlobales,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log('✅ Actualización completada');
    console.log('   Modified count:', result.modifiedCount);
    
    // Verificar que se guardó
    const flowActualizado = await flowsCollection.findOne({ _id: flow._id });
    
    console.log('\n📊 Verificación:');
    console.log('   config existe:', !!flowActualizado.config);
    console.log('   variables_globales existe:', !!flowActualizado.config?.variables_globales);
    
    if (flowActualizado.config?.variables_globales) {
      console.log('   Total variables:', Object.keys(flowActualizado.config.variables_globales).length);
      console.log('\n📋 Variables guardadas:');
      Object.keys(flowActualizado.config.variables_globales).forEach(key => {
        console.log(`   ✓ ${key}`);
      });
    } else {
      console.log('   ❌ NO se guardaron las variables');
    }
    
    console.log('\n' + '═'.repeat(80));
    console.log('✅ LISTO');
    console.log('═'.repeat(80));
    console.log('\n📝 Próximos pasos:');
    console.log('   1. Esperá que termine el deploy de Render');
    console.log('   2. Refrescá el Flow Builder en producción');
    console.log('   3. Las variables deberían aparecer en el modal');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

forzarVariablesGlobales();
