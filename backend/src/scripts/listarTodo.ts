// 📋 Listar todas las configuraciones
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const ConfigSchema = new mongoose.Schema({}, { strict: false });
const ConfigModel = mongoose.model('ConfiguracionModulo', ConfigSchema, 'configuracion_modulos');

async function listar() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '', {
      dbName: 'neural_chatbot'
    });
    
    console.log('✅ Conectado');

    const all = await ConfigModel.find({}).select('_id empresaId').lean();
    
    console.log('\n📊 Configuraciones encontradas:', all.length);
    all.forEach((doc: any) => {
      console.log(`  - ${doc.empresaId} (${doc._id})`);
    });

    // Buscar específicamente por el ID que me diste
    const byId = await ConfigModel.findById('68ff85d78e9f378673d09ff7');
    console.log('\n¿Existe el ID 68ff85d78e9f378673d09ff7?', byId ? '✅ Sí' : '❌ No');
    
    if (byId) {
      console.log('empresaId:', (byId as any).empresaId);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

listar();
