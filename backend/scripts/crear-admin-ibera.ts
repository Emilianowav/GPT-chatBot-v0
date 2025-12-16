/**
 * Crear usuario admin para Instituto Universitario Del Ibera
 */
import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const uri = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority';
const EMPRESA_ID = 'Instituto Universitario Del Ibera';

// Credenciales del admin
const ADMIN_USERNAME = 'ibera_admin';
const ADMIN_PASSWORD = 'Ibera2024!';
const ADMIN_EMAIL = 'admin@ibera.edu.ar';

async function crearAdmin() {
  await mongoose.connect(uri);
  console.log('Conectado a MongoDB');
  
  // Hashear contraseña
  const saltRounds = 10;
  const hashedPassword = await bcryptjs.hash(ADMIN_PASSWORD, saltRounds);
  
  // Eliminar usuarios anteriores si existen
  await mongoose.connection.collection('usuarios_empresa').deleteOne({ 
    username: ADMIN_USERNAME 
  });
  await mongoose.connection.collection('usuarios_empresa').deleteOne({ 
    email: ADMIN_EMAIL 
  });
  await mongoose.connection.collection('usuarios').deleteOne({ 
    email: ADMIN_EMAIL 
  });
  
  // Crear nuevo usuario admin en usuarios_empresa (nuevo sistema)
  const usuarioAdmin = {
    username: ADMIN_USERNAME.toLowerCase(),
    email: ADMIN_EMAIL.toLowerCase(),
    password: hashedPassword,
    nombre: 'Administrador',
    apellido: 'Instituto Ibera',
    empresaId: EMPRESA_ID,
    rol: 'admin',
    activo: true,
    permisos: ['calendario', 'clientes', 'conversaciones', 'configuracion', 'integraciones', 'reportes'],
    createdBy: 'system',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await mongoose.connection.collection('usuarios_empresa').insertOne(usuarioAdmin);
  
  console.log('\n========================================');
  console.log('🎓 CREDENCIALES DE ADMIN - INSTITUTO IBERA');
  console.log('========================================');
  console.log('');
  console.log('👤 Username:', ADMIN_USERNAME);
  console.log('🔑 Contraseña:', ADMIN_PASSWORD);
  console.log('');
  console.log('🌐 URL del CRM: https://tu-frontend.vercel.app/login');
  console.log('========================================');
  
  await mongoose.disconnect();
}

crearAdmin().catch(console.error);
