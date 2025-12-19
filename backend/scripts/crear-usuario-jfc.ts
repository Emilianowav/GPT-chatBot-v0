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

// Definir el modelo de Usuario
const UsuarioSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  empresaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Empresa', required: true },
  rol: { type: String, enum: ['admin', 'agente', 'viewer'], default: 'admin' },
  nombre: String,
  email: String,
  activo: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Usuario = mongoose.model('Usuario', UsuarioSchema);

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

    // Verificar si ya existe el usuario
    const usuarioExistente = await Usuario.findOne({ username: 'admin_jfc' });
    
    if (usuarioExistente) {
      console.log('\n⚠️  Usuario admin_jfc ya existe');
      console.log('   Actualizando empresaId...');
      
      usuarioExistente.empresaId = empresa._id;
      await usuarioExistente.save();
      
      console.log('✅ Usuario actualizado con nueva empresaId');
    } else {
      // Crear nuevo usuario
      const password = 'admin123'; // Contraseña por defecto
      const hashedPassword = await bcrypt.hash(password, 10);

      const nuevoUsuario = new Usuario({
        username: 'admin_jfc',
        password: hashedPassword,
        empresaId: empresa._id,
        rol: 'admin',
        nombre: 'Admin JFC Techno',
        email: 'admin@jfctechno.com',
        activo: true
      });

      await nuevoUsuario.save();

      console.log('\n✅ Usuario creado exitosamente');
      console.log('   Username: admin_jfc');
      console.log('   Password: admin123');
      console.log('   Rol: admin');
      console.log('   Empresa:', empresa.nombre);
    }

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
