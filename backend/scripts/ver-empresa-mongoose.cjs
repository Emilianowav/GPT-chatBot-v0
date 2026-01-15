require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI;

// Definir schema de Empresa
const empresaSchema = new mongoose.Schema({
  nombre: String,
  telefono: String,
  phoneNumberId: String,
  flujoActivo: { type: mongoose.Schema.Types.ObjectId, ref: 'Flow' }
}, { collection: 'empresas' });

const EmpresaModel = mongoose.model('Empresa', empresaSchema);

async function verEmpresa() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    const empresas = await EmpresaModel.find({});
    
    console.log(`📊 EMPRESAS ENCONTRADAS: ${empresas.length}\n`);
    
    if (empresas.length === 0) {
      console.log('❌ No hay empresas en la colección');
      
      // Listar colecciones
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log('\n📚 COLECCIONES DISPONIBLES:');
      collections.forEach(c => console.log(`   - ${c.name}`));
      
      return;
    }
    
    empresas.forEach(e => {
      console.log(`🏢 ${e.nombre}`);
      console.log(`   ID: ${e._id}`);
      console.log(`   Teléfono: ${e.telefono}`);
      console.log(`   Phone Number ID: ${e.phoneNumberId}`);
      console.log(`   Flujo Activo: ${e.flujoActivo || 'NO CONFIGURADO'}\n`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

verEmpresa();
