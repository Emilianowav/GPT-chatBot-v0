import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';

async function moverTopicosAConfig() {
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

    console.log('🔧 PROBLEMA CRÍTICO IDENTIFICADO\n');
    console.log('═'.repeat(70));

    console.log('\n❌ PROBLEMA:');
    console.log('   FlowExecutor.ts línea 188-189 busca tópicos en:');
    console.log('   → flow.config.topicos');
    console.log('');
    console.log('   Pero nosotros los guardamos en:');
    console.log('   → flow.topicos');
    console.log('');

    console.log('📋 ESTADO ACTUAL:');
    console.log('   flow.topicos existe:', !!flow.topicos);
    console.log('   flow.config existe:', !!flow.config);
    console.log('   flow.config.topicos existe:', !!flow.config?.topicos);
    console.log('   flow.config.topicos_habilitados:', flow.config?.topicos_habilitados);
    console.log('');

    if (flow.topicos && Object.keys(flow.topicos).length > 0) {
      console.log('✅ Tópicos encontrados en flow.topicos:');
      Object.keys(flow.topicos).forEach(key => {
        console.log(`   - ${key}`);
      });
      console.log('');

      console.log('🔧 MOVIENDO TÓPICOS A flow.config.topicos...');
      
      // Asegurar que flow.config existe
      const config = flow.config || {};
      
      // Mover tópicos a config
      config.topicos = flow.topicos;
      config.topicos_habilitados = true;

      await flowsCollection.updateOne(
        { empresaId: 'Veo Veo', nombre: 'WooCommerce Flow' },
        {
          $set: {
            config: config,
            updatedAt: new Date()
          }
        }
      );

      console.log('✅ Tópicos movidos a flow.config.topicos');
      console.log('✅ topicos_habilitados = true');
      console.log('');
    } else {
      console.log('❌ No hay tópicos en flow.topicos');
      console.log('');
    }

    // Verificación
    const flowActualizado = await flowsCollection.findOne({ 
      empresaId: 'Veo Veo', 
      nombre: 'WooCommerce Flow' 
    });

    console.log('═'.repeat(70));
    console.log('🔍 VERIFICACIÓN FINAL');
    console.log('═'.repeat(70));
    console.log('');
    console.log('✅ flow.config.topicos existe:', !!flowActualizado.config?.topicos);
    console.log('✅ flow.config.topicos_habilitados:', flowActualizado.config?.topicos_habilitados);
    
    if (flowActualizado.config?.topicos) {
      console.log('✅ Tópicos en flow.config.topicos:');
      Object.keys(flowActualizado.config.topicos).forEach(key => {
        console.log(`   - ${key}`);
      });
    }
    console.log('');

    console.log('═'.repeat(70));
    console.log('✅ CORRECCIÓN COMPLETADA');
    console.log('═'.repeat(70));
    console.log('');
    console.log('📝 AHORA EL FLOWEXECUTOR PODRÁ:');
    console.log('   1. Cargar tópicos desde flow.config.topicos ✅');
    console.log('   2. Verificar flow.config.topicos_habilitados ✅');
    console.log('   3. Inyectar tópicos en TODOS los GPT nodes ✅');
    console.log('');
    console.log('🧪 TESTEAR:');
    console.log('   1. Limpiar: node scripts/limpiar-mi-numero.js');
    console.log('   2. Preguntar: "¿Tienen libros de inglés?"');
    console.log('      → Debe responder con info de tópicos');
    console.log('   3. Preguntar: "¿Hay descuentos?"');
    console.log('      → Debe responder con promociones bancarias');
    console.log('═'.repeat(70) + '\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB');
  }
}

moverTopicosAConfig();
