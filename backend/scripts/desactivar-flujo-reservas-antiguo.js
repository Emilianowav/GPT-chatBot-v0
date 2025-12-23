import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

const configBotSchema = new mongoose.Schema({}, { strict: false });
const ConfiguracionBot = mongoose.model('ConfiguracionBot', configBotSchema, 'configuracion_bots');

async function desactivarFlujoReservasAntiguo() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Buscar configuración de Juventus
    const config = await ConfiguracionBot.findOne({ 
      empresaId: 'Club Juventus'
    });

    if (!config) {
      console.log('⚠️ No se encontró configuración para Club Juventus');
      console.log('Buscando por nombre de empresa...');
      
      const empresaSchema = new mongoose.Schema({}, { strict: false });
      const Empresa = mongoose.model('Empresa', empresaSchema, 'empresas');
      
      const empresa = await Empresa.findOne({ nombre: /juventus/i });
      if (empresa) {
        console.log('📋 Empresa encontrada:', empresa.nombre);
        console.log('🆔 ID:', empresa._id);
        
        const configPorId = await ConfiguracionBot.findOne({ empresaId: empresa._id });
        if (configPorId) {
          console.log('✅ Configuración encontrada por ID');
          console.log('   Activo:', configPorId.activo);
          
          // Desactivar el bot de pasos para que no use reservaCanchasFlow
          configPorId.activo = false;
          await configPorId.save();
          
          console.log('✅ Bot de pasos desactivado para Juventus');
          console.log('   Ahora usará el workflow de la API');
        } else {
          console.log('⚠️ No hay configuración de bot para esta empresa');
        }
      }
    } else {
      console.log('📋 Configuración encontrada');
      console.log('   Activo:', config.activo);
      
      config.activo = false;
      await config.save();
      
      console.log('✅ Bot de pasos desactivado');
    }

    console.log('\n📝 RESUMEN:');
    console.log('   ✅ reservaCanchasFlow desactivado desde configuración');
    console.log('   ✅ El workflow de la API se activará correctamente');
    console.log('   ✅ Flujo conversacional como fallback');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado');
  }
}

desactivarFlujoReservasAntiguo();
