const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function fixFlujoBotType() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const Flow = mongoose.model('Flow', new mongoose.Schema({}, { strict: false }));

    // Actualizar el flujo de 9 nodos para que tenga botType: 'visual'
    const resultado = await Flow.updateOne(
      { _id: new mongoose.Types.ObjectId('695a156681f6d67f0ae9cf40') },
      { 
        $set: { 
          botType: 'visual',
          updatedAt: new Date()
        } 
      }
    );

    if (resultado.modifiedCount > 0) {
      console.log('✅ FLUJO ACTUALIZADO EXITOSAMENTE\n');
      
      // Verificar
      const flujo = await Flow.findById('695a156681f6d67f0ae9cf40');
      console.log('🔍 VERIFICACIÓN:');
      console.log(`   Nombre: ${flujo.nombre}`);
      console.log(`   botType: ${flujo.botType}`);
      console.log(`   Nodos: ${flujo.nodes.length}`);
      console.log(`   Edges: ${flujo.edges.length}\n`);
      
      console.log('🎉 PROBLEMA RESUELTO');
      console.log('═══════════════════════════════════════════════════════');
      console.log('\nAhora el flujo de 9 nodos tiene botType: "visual"');
      console.log('La lógica de empresa.flujoActivo lo cargará correctamente');
      console.log('\n🚀 Próximo mensaje de WhatsApp ejecutará el flujo de 9 nodos');
    } else {
      console.log('⚠️  No se modificó el flujo (ya estaba actualizado o no existe)');
    }

    await mongoose.disconnect();
    console.log('\n✅ Desconectado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixFlujoBotType();
