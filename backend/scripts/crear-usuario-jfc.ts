// 👤 Script para crear usuario admin para JFC Techno
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { EmpresaModel } from '../src/models/Empresa.js';

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

// Definir el modelo de AdminUser (sistema de autenticación)
const AdminUserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  empresaId: { type: String, required: true }, // IMPORTANTE: Es el NOMBRE de la empresa, no el ObjectId
  role: { type: String, enum: ['admin', 'viewer', 'super_admin'], default: 'admin' },
  email: String,
  activo: { type: Boolean, default: true },
  ultimoAcceso: Date
}, {
  timestamps: true,
  collection: 'admin_users' // IMPORTANTE: Usar la colección correcta
});

const AdminUser = mongoose.model('AdminUser', AdminUserSchema);

async function crearUsuarioJFC() {
  try {
    await mongoose.connect(MONGODB_URI!);
    console.log('✅ Conectado a DB:', mongoose.connection.name);

    console.log('\n========================================');
    console.log('👤 CREANDO USUARIO ADMIN - JFC TECHNO');
    console.log('========================================\n');

    // Buscar empresa JFC Techno
    const empresa = await EmpresaModel.findOne({ nombre: 'JFC Techno' });
    
    if (!empresa) {
      console.log('❌ Empresa JFC Techno no encontrada');
      return;
    }

    console.log('✅ Empresa encontrada:', empresa.nombre);
    console.log('   ID:', empresa._id);

    // Verificar si ya existe el usuario en admin_users
    const usuarioExistente = await AdminUser.findOne({ username: 'admin_jfc' });
    
    if (usuarioExistente) {
      console.log('\n⚠️  Usuario admin_jfc ya existe');
      console.log('   Eliminando usuario antiguo...');
      
      await AdminUser.deleteOne({ username: 'admin_jfc' });
      console.log('✅ Usuario antiguo eliminado');
    }

    // Crear nuevo usuario con la contraseña sin hashear (el pre-save hook lo hará)
    const password = 'admin123'; // Contraseña por defecto

    const nuevoUsuario = new AdminUser({
      username: 'admin_jfc',
      password: password, // NO hashear aquí, el pre-save hook lo hace
      empresaId: empresa.nombre, // IMPORTANTE: Usar el NOMBRE de la empresa
      role: 'admin',
      email: 'admin@jfctechno.com',
      activo: true
    });

    await nuevoUsuario.save();

    console.log('\n✅ Usuario creado exitosamente');
    console.log('   Username: admin_jfc');
    console.log('   Password: admin123');
    console.log('   Role: admin');
    console.log('   EmpresaId (nombre):', empresa.nombre);
    console.log('   Colección: admin_users');

    console.log('\n========================================');
    console.log('✅ CONFIGURACIÓN COMPLETADA');
    console.log('========================================');
    console.log('\n📋 Credenciales de acceso:');
    console.log('   URL: http://localhost:3001');
    console.log('   Username: admin_jfc');
    console.log('   Password: admin123');
    console.log('\n');

    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

crearUsuarioJFC();
