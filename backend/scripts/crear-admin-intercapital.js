import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

const ADMIN_INTERCAPITAL = {
  username: 'admin_intercapital',
  password: 'Intercapital2025!', // Contraseña segura
  email: 'admin@intercapital.com.ar',
  nombre: 'Admin',
  apellido: 'Intercapital',
  rol: 'admin',
  permisos: [
    'usuarios.ver',
    'usuarios.crear',
    'usuarios.editar',
    'contactos.ver',
    'contactos.crear',
    'contactos.editar',
    'conversaciones.ver',
    'conversaciones.exportar',
    'metricas.ver',
    'configuracion.ver',
    'configuracion.editar',
    'workflows.ver',
    'workflows.editar',
    'api.ver',
    'api.editar'
  ],
  activo: true,
  createdBy: 'system'
};

async function crearAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // 1. Buscar empresa Intercapital
    const empresa = await db.collection('empresas').findOne({
      nombre: 'Intercapital'
    });

    if (!empresa) {
      console.log('❌ Empresa Intercapital no encontrada');
      await mongoose.disconnect();
      return;
    }

    console.log('📋 Empresa encontrada:', empresa.nombre);
    console.log(`   ID: ${empresa._id}\n`);

    // 2. Verificar si ya existe el usuario
    const usuarioExistente = await db.collection('usuarios_empresas').findOne({
      username: ADMIN_INTERCAPITAL.username
    });

    if (usuarioExistente) {
      console.log('⚠️  El usuario admin_intercapital ya existe');
      console.log(`   - Username: ${usuarioExistente.username}`);
      console.log(`   - Email: ${usuarioExistente.email}`);
      console.log(`   - Rol: ${usuarioExistente.rol}\n`);
      
      console.log('📋 CREDENCIALES DE ACCESO:');
      console.log('   ================================');
      console.log(`   Username: ${ADMIN_INTERCAPITAL.username}`);
      console.log(`   Password: ${ADMIN_INTERCAPITAL.password}`);
      console.log('   ================================\n');
      
      await mongoose.disconnect();
      return;
    }

    // 3. Hashear contraseña
    const hashedPassword = await bcrypt.hash(ADMIN_INTERCAPITAL.password, 10);

    // 4. Crear usuario administrador
    const nuevoUsuario = {
      ...ADMIN_INTERCAPITAL,
      password: hashedPassword,
      empresaId: empresa._id,
      empresaNombre: empresa.nombre,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('usuarios_empresas').insertOne(nuevoUsuario);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ USUARIO ADMINISTRADOR CREADO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📋 Datos del usuario:');
    console.log(`   - ID: ${result.insertedId}`);
    console.log(`   - Username: ${ADMIN_INTERCAPITAL.username}`);
    console.log(`   - Email: ${ADMIN_INTERCAPITAL.email}`);
    console.log(`   - Nombre: ${ADMIN_INTERCAPITAL.nombre} ${ADMIN_INTERCAPITAL.apellido}`);
    console.log(`   - Rol: ${ADMIN_INTERCAPITAL.rol}`);
    console.log(`   - Empresa: ${empresa.nombre}`);
    console.log(`   - Permisos: ${ADMIN_INTERCAPITAL.permisos.length} permisos asignados\n`);

    console.log('📋 CREDENCIALES DE ACCESO:');
    console.log('   ================================');
    console.log(`   Username: ${ADMIN_INTERCAPITAL.username}`);
    console.log(`   Password: ${ADMIN_INTERCAPITAL.password}`);
    console.log('   ================================\n');

    console.log('⚠️  IMPORTANTE: Guarda estas credenciales en un lugar seguro\n');

    console.log('🔗 Endpoints de autenticación:');
    console.log('   - POST /api/auth/login');
    console.log('   - GET  /api/auth/me');
    console.log('   - POST /api/auth/logout\n');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

crearAdmin();
