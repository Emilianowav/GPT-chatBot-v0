import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function verificarEmpresas() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_db';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');
    
    const db = mongoose.connection.db;
    const empresasCollection = db.collection('empresas');
    
    const empresas = await empresasCollection.find({}).toArray();
    
    console.log(`\n📊 Total de empresas: ${empresas.length}\n`);
    
    empresas.forEach((empresa, index) => {
      console.log(`${index + 1}. ${empresa.nombre}`);
      console.log(`   _id: ${empresa._id}`);
      console.log(`   telefono: ${empresa.telefono}`);
      console.log(`   phoneNumberId: ${empresa.phoneNumberId}`);
      console.log('');
    });
    
    // Buscar específicamente por el teléfono que está fallando
    const telefonoBuscado = '5493794057297';
    console.log(`🔍 Buscando empresa con telefono: ${telefonoBuscado}`);
    const empresaEncontrada = await empresasCollection.findOne({ telefono: telefonoBuscado });
    
    if (empresaEncontrada) {
      console.log('✅ Empresa encontrada:');
      console.log(`   nombre: ${empresaEncontrada.nombre}`);
      console.log(`   telefono: ${empresaEncontrada.telefono}`);
      console.log(`   phoneNumberId: ${empresaEncontrada.phoneNumberId}`);
    } else {
      console.log('❌ No se encontró empresa con ese teléfono');
      
      // Buscar con variaciones
      console.log('\n🔍 Buscando variaciones...');
      const variaciones = [
        telefonoBuscado,
        `+${telefonoBuscado}`,
        telefonoBuscado.replace(/^549/, '54'),
        telefonoBuscado.replace(/^54/, '')
      ];
      
      for (const variacion of variaciones) {
        const resultado = await empresasCollection.findOne({ telefono: variacion });
        if (resultado) {
          console.log(`✅ Encontrada con variación: ${variacion}`);
          console.log(`   nombre: ${resultado.nombre}`);
          console.log(`   telefono: ${resultado.telefono}`);
          console.log(`   phoneNumberId: ${resultado.phoneNumberId}`);
          break;
        }
      }
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificarEmpresas();
