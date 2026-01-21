/**
 * 🧪 PRUEBA 2: Verificar teléfonos de agentes
 */

import mongoose from 'mongoose';

const uri = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority';

async function testAgentes() {
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    
    const agentes = await db.collection('agentes').find({ empresaId: 'San Jose' }).limit(5).toArray();
    
    console.log('\n📱 TELÉFONOS DE AGENTES:\n');
    console.log('='.repeat(80));
    
    agentes.forEach((a, i) => {
      const tieneFormato = a.telefono?.startsWith('+');
      console.log(`\n${i+1}. ${a.nombre} ${a.apellido}`);
      console.log(`   Teléfono actual: ${a.telefono || 'NO TIENE'}`);
      console.log(`   Formato correcto: ${tieneFormato ? '✅ SÍ' : '❌ NO (debe empezar con +)'}`);
      
      if (a.telefono && !tieneFormato) {
        console.log(`   💡 Debería ser: +549${a.telefono}`);
      }
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('\n📝 NOTA: Los teléfonos deben tener formato +5493794XXXXXXXX');
    console.log('   El modal de agentes ahora valida esto automáticamente.\n');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
  }
}

testAgentes();
