import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';

async function fixClasificadorGlobalVariables() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;
    const flowsCollection = db.collection('flows');

    const flow = await flowsCollection.findOne({ 
      empresaId: 'Veo Veo', 
      nombre: 'WooCommerce Flow' 
    });
    
    if (!flow) {
      console.log('❌ No se encontró el flujo');
      return;
    }

    console.log('🔧 CORRIGIENDO CLASIFICADOR - GLOBAL VARIABLES OUTPUT\n');
    console.log('═'.repeat(70));

    const clasificador = flow.nodes.find(n => n.id === 'gpt-clasificador-inteligente');
    
    console.log('📋 ESTADO ACTUAL:');
    console.log('   globalVariablesOutput:', clasificador.data.config.globalVariablesOutput || 'NO CONFIGURADO');
    console.log('');

    console.log('🔧 APLICANDO CORRECCIÓN...');
    
    await flowsCollection.updateOne(
      { empresaId: 'Veo Veo', nombre: 'WooCommerce Flow' },
      {
        $set: {
          'nodes.$[node].data.config.globalVariablesOutput': ['tipo_accion'],
          updatedAt: new Date()
        }
      },
      {
        arrayFilters: [{ 'node.id': 'gpt-clasificador-inteligente' }]
      }
    );

    console.log('✅ Clasificador actualizado');
    console.log('');

    // Verificación
    const flowActualizado = await flowsCollection.findOne({ 
      empresaId: 'Veo Veo', 
      nombre: 'WooCommerce Flow' 
    });

    const clasificadorActualizado = flowActualizado.nodes.find(n => n.id === 'gpt-clasificador-inteligente');

    console.log('═'.repeat(70));
    console.log('🔍 VERIFICACIÓN FINAL');
    console.log('═'.repeat(70));
    console.log('');
    console.log('✅ globalVariablesOutput:', clasificadorActualizado.data.config.globalVariablesOutput);
    console.log('');

    console.log('═'.repeat(70));
    console.log('✅ CORRECCIÓN COMPLETADA');
    console.log('═'.repeat(70));
    console.log('');
    console.log('📝 CÓMO FUNCIONA AHORA:');
    console.log('');
    console.log('1. Usuario: "Estoy buscando harry potter"');
    console.log('2. Clasificador extrae: tipo_accion = "buscar_producto"');
    console.log('3. Clasificador GUARDA en globalVariables.tipo_accion ✅');
    console.log('4. Router Principal evalúa: {{tipo_accion}} == buscar_producto');
    console.log('5. Condición TRUE → va a gpt-formateador ✅');
    console.log('6. Formateador extrae: titulo = "Harry Potter"');
    console.log('7. Router Intermedio evalúa: {{titulo}} exists');
    console.log('8. Condición TRUE → va a woocommerce ✅');
    console.log('9. WooCommerce busca productos');
    console.log('');
    console.log('🧪 TESTEAR:');
    console.log('   1. Limpiar: node scripts/limpiar-mi-numero.js');
    console.log('   2. Enviar: "Estoy buscando harry potter"');
    console.log('   3. DEBE buscar en WooCommerce y mostrar productos');
    console.log('═'.repeat(70) + '\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB');
  }
}

fixClasificadorGlobalVariables();
