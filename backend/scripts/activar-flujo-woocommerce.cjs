const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function activarFlujoWooCommerce() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const Empresa = mongoose.model('Empresa', new mongoose.Schema({}, { strict: false }));
    const Flow = mongoose.model('Flow', new mongoose.Schema({}, { strict: false }));

    // ID del flujo completo de 9 nodos
    const flujoId = '695a156681f6d67f0ae9cf40';

    // Verificar que el flujo existe
    const flujo = await Flow.findById(flujoId);
    
    if (!flujo) {
      console.log('❌ Flujo no encontrado');
      process.exit(1);
    }

    console.log('📊 FLUJO A ACTIVAR:');
    console.log(`   ID: ${flujo._id}`);
    console.log(`   Nombre: ${flujo.nombre}`);
    console.log(`   Nodos: ${flujo.nodes.length}`);
    console.log(`   Edges: ${flujo.edges.length}\n`);

    // Actualizar empresa Veo Veo
    const resultado = await Empresa.updateOne(
      { nombre: 'Veo Veo' },
      { 
        $set: { 
          flujoActivo: new mongoose.Types.ObjectId(flujoId),
          updatedAt: new Date()
        } 
      }
    );

    if (resultado.modifiedCount > 0) {
      console.log('✅ FLUJO ACTIVADO EXITOSAMENTE\n');
      
      // Verificar
      const empresaActualizada = await Empresa.findOne({ nombre: 'Veo Veo' });
      console.log('🔍 VERIFICACIÓN:');
      console.log(`   Empresa: ${empresaActualizada.nombre}`);
      console.log(`   Flujo Activo: ${empresaActualizada.flujoActivo}`);
      console.log(`   Coincide: ${empresaActualizada.flujoActivo.toString() === flujoId ? '✅ SÍ' : '❌ NO'}\n`);
      
      console.log('🎉 CONFIGURACIÓN COMPLETA');
      console.log('═══════════════════════════════════════════════════════');
      console.log('\n✅ El flujo de 9 nodos con WooCommerce está ahora ACTIVO');
      console.log('\n📱 Próxima conversación de WhatsApp ejecutará:');
      console.log('   1. WhatsApp Trigger');
      console.log('   2. GPT Conversacional (personalidad Veo Veo)');
      console.log('   3. GPT Formateador (extrae título, editorial, edición)');
      console.log('   4. Validador de Datos');
      console.log('      ├─ Completo → Router');
      console.log('      └─ Incompleto → Solicitar datos (loop)');
      console.log('   5. Router de Validación');
      console.log('      ├─ Válido → WooCommerce Search');
      console.log('      └─ Inválido → Mensaje de ayuda');
      console.log('   6. WooCommerce → Busca productos');
      console.log('   7. WhatsApp → Envía resultados');
      console.log('\n🚀 Listo para testear búsqueda real en WooCommerce');
    } else {
      console.log('⚠️  No se modificó ningún documento');
      console.log('   Verifica que la empresa "Veo Veo" existe');
    }

    await mongoose.disconnect();
    console.log('\n✅ Desconectado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

activarFlujoWooCommerce();
