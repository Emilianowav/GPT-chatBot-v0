import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

const configModuloSchema = new mongoose.Schema({}, { strict: false });
const ConfiguracionModulo = mongoose.model('ConfiguracionModulo', configModuloSchema, 'configuracion_modulos');

async function verificarEmpresasCanchas() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const empresasCanchas = await ConfiguracionModulo.find({ 
      tipoNegocio: 'canchas' 
    });

    console.log(`\n📋 Empresas con tipoNegocio = 'canchas': ${empresasCanchas.length}\n`);

    if (empresasCanchas.length === 0) {
      console.log('   No hay empresas de tipo canchas');
    } else {
      empresasCanchas.forEach((config, i) => {
        console.log(`${i + 1}. Empresa ID: ${config.empresaId}`);
        console.log(`   Nombre: ${config.variablesDinamicas?.nombre_empresa || 'N/A'}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado');
  }
}

verificarEmpresasCanchas();
