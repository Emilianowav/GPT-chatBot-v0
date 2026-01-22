import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function aplicarEstructuraIntercapital() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('chatbot_crm');
    const flowsCollection = db.collection('flows');
    
    // Buscar flujo de VeoVeo
    const veoVeoId = new ObjectId('69705b05e58836243159e64e');
    const veoVeoFlow = await flowsCollection.findOne({ _id: veoVeoId });
    
    if (!veoVeoFlow) {
      console.log('❌ Flujo de VeoVeo no encontrado');
      return;
    }
    
    console.log('✅ Flujo encontrado:', veoVeoFlow.nombre);
    console.log('🆔 ID:', veoVeoFlow._id.toString());
    
    console.log('\n📊 Estructura ACTUAL de config:');
    console.log('Keys:', Object.keys(veoVeoFlow.config || {}));
    
    // Aplicar la MISMA estructura que Intercapital
    // Intercapital tiene: config.variables_globales como objeto simple
    const nuevaConfig = {
      variables_globales: {
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
        mercadopago_estado: "",
        api_key_intercapital: ""
      },
      topicos_habilitados: veoVeoFlow.config?.topicos_habilitados || false,
      topicos: veoVeoFlow.config?.topicos || {}
    };
    
    console.log('\n📊 NUEVA estructura de config:');
    console.log('Keys:', Object.keys(nuevaConfig));
    console.log('variables_globales:', Object.keys(nuevaConfig.variables_globales).length, 'variables');
    
    // Actualizar en BD usando la misma estructura que Intercapital
    const result = await flowsCollection.updateOne(
      { _id: veoVeoId },
      { 
        $set: { 
          config: nuevaConfig,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log('\n✅ Actualización completada');
    console.log('   Modified count:', result.modifiedCount);
    
    // Verificar
    const flowActualizado = await flowsCollection.findOne({ _id: veoVeoId });
    
    console.log('\n📊 Verificación:');
    console.log('   config existe:', !!flowActualizado.config);
    console.log('   config.variables_globales existe:', !!flowActualizado.config?.variables_globales);
    console.log('   Tipo de variables_globales:', typeof flowActualizado.config?.variables_globales);
    console.log('   Es un objeto:', flowActualizado.config?.variables_globales?.constructor?.name === 'Object');
    
    if (flowActualizado.config?.variables_globales) {
      console.log('   Total variables:', Object.keys(flowActualizado.config.variables_globales).length);
      console.log('\n📋 Variables:');
      Object.keys(flowActualizado.config.variables_globales).forEach(key => {
        console.log(`   ✓ ${key}`);
      });
    }
    
    console.log('\n' + '═'.repeat(80));
    console.log('✅ ESTRUCTURA APLICADA - IGUAL QUE INTERCAPITAL');
    console.log('═'.repeat(80));
    
    console.log('\n📝 Próximos pasos:');
    console.log('   1. Refrescá el Flow Builder');
    console.log('   2. Abrí "Variables Globales"');
    console.log('   3. Deberían aparecer las 17 variables');
    console.log('   4. Configurá el GPT de carrito para usar {{productos_formateados}}');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

aplicarEstructuraIntercapital();
