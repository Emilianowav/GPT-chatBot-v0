// 🔍 Script para verificar usuario admin de JFC Techno
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI no está configurada en .env');
  process.exit(1);
}

if (!MONGODB_URI.includes('mongodb.net/') || MONGODB_URI.includes('mongodb.net/?')) {
  MONGODB_URI = MONGODB_URI.replace('mongodb.net/?', 'mongodb.net/neural_chatbot?');
  MONGODB_URI = MONGODB_URI.replace('mongodb.net?', 'mongodb.net/neural_chatbot?');
}

const UsuarioSchema = new mongoose.Schema({
  username: String,
  empresaId: mongoose.Schema.Types.ObjectId,
  rol: String,
  nombre: String,
  email: String,
  activo: Boolean
});

const EmpresaSchema = new mongoose.Schema({
  nombre: String,
  telefono: String,
  email: String
});

const Usuario = mongoose.model('Usuario', UsuarioSchema);
const Empresa = mongoose.model('Empresa', EmpresaSchema);

async function verificarUsuario() {
  try {
    await mongoose.connect(MONGODB_URI!);
    console.log('✅ Conectado a DB:', mongoose.connection.name);

    console.log('\n========================================');
    console.log('🔍 VERIFICANDO USUARIO JFC TECHNO');
    console.log('========================================\n');

    // Buscar empresa
    const empresa = await Empresa.findOne({ nombre: 'JFC Techno' });
    
    if (!empresa) {
      console.log('❌ Empresa JFC Techno no encontrada');
      return;
    }

    console.log('✅ Empresa encontrada:');
    console.log('   Nombre:', empresa.nombre);
    console.log('   ID:', empresa._id);
    console.log('   Teléfono:', empresa.telefono);
    console.log('   Email:', empresa.email);

    // Buscar usuario
    const usuario = await Usuario.findOne({ username: 'admin_jfc' });
    
    if (!usuario) {
      console.log('\n❌ Usuario admin_jfc NO encontrado');
      console.log('   Ejecuta: npx tsx scripts/crear-usuario-jfc.ts');
      return;
    }

    console.log('\n✅ Usuario encontrado:');
    console.log('   Username:', usuario.username);
    console.log('   Nombre:', usuario.nombre);
    console.log('   Email:', usuario.email);
    console.log('   Rol:', usuario.rol);
    console.log('   Activo:', usuario.activo);
    console.log('   EmpresaId:', usuario.empresaId);

    // Verificar que el empresaId coincide
    if (usuario.empresaId.toString() === empresa._id.toString()) {
      console.log('\n✅ Usuario correctamente asociado a JFC Techno');
    } else {
      console.log('\n❌ ERROR: Usuario NO está asociado a JFC Techno');
      console.log('   Usuario empresaId:', usuario.empresaId);
      console.log('   Empresa _id:', empresa._id);
    }

    console.log('\n========================================');
    console.log('📋 CREDENCIALES DE ACCESO');
    console.log('========================================');
    console.log('   URL: http://localhost:3001');
    console.log('   Username: admin_jfc');
    console.log('   Password: admin123');
    console.log('\n⚠️  IMPORTANTE: Reinicia el backend con npm run dev');
    console.log('========================================\n');

    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

verificarUsuario();
