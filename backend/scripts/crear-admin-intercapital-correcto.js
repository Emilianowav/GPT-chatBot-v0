import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

// Definir el schema y modelo de UsuarioEmpresa
const UsuarioEmpresaSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    nombre: {
      type: String,
      required: true,
      trim: true
    },
    apellido: {
      type: String,
      trim: true
    },
    empresaId: {
      type: String,
      required: true
    },
    rol: {
      type: String,
      enum: ['super_admin', 'admin', 'manager', 'agent', 'viewer'],
      default: 'viewer',
      required: true
    },
    permisos: {
      type: [String],
      default: []
    },
    activo: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true,
    collection: 'usuarios_empresa'
  }
);

// Hash de contraseña antes de guardar
UsuarioEmpresaSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const bcrypt = await import('bcryptjs');
    const salt = await bcrypt.default.genSalt(10);
    this.password = await bcrypt.default.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const UsuarioEmpresaModel = mongoose.model('UsuarioEmpresa', UsuarioEmpresaSchema);

const ADMIN_INTERCAPITAL = {
  username: 'admin_intercapital',
  password: 'Intercapital2025!',
  email: 'admin@intercapital.com.ar',
  nombre: 'Admin',
  apellido: 'Intercapital',
  empresaId: 'Intercapital', // NOMBRE de la empresa, no ObjectId
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

    // 2. Eliminar usuario existente si existe
    const usuarioExistente = await UsuarioEmpresaModel.findOne({
      username: ADMIN_INTERCAPITAL.username
    });

    if (usuarioExistente) {
      console.log('⚠️  Usuario existente encontrado, eliminando...');
      await UsuarioEmpresaModel.deleteOne({ _id: usuarioExistente._id });
      console.log('   ✅ Usuario anterior eliminado\n');
    }

    // 3. Crear usuario usando el modelo (para que se hashee la contraseña)
    const nuevoUsuario = new UsuarioEmpresaModel(ADMIN_INTERCAPITAL);
    await nuevoUsuario.save();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ USUARIO ADMINISTRADOR CREADO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📋 Datos del usuario:');
    console.log(`   - ID: ${nuevoUsuario._id}`);
    console.log(`   - Username: ${nuevoUsuario.username}`);
    console.log(`   - Email: ${nuevoUsuario.email}`);
    console.log(`   - Nombre: ${nuevoUsuario.nombre} ${nuevoUsuario.apellido}`);
    console.log(`   - Rol: ${nuevoUsuario.rol}`);
    console.log(`   - Empresa ID: ${nuevoUsuario.empresaId}`);
    console.log(`   - Permisos: ${nuevoUsuario.permisos.length} permisos asignados`);
    console.log(`   - Password hasheado: ${nuevoUsuario.password.substring(0, 20)}...\n`);

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

    // Verificar en la base de datos
    const usuarioVerificado = await db.collection('usuarios_empresa').findOne({
      username: ADMIN_INTERCAPITAL.username
    });

    console.log('✅ Verificación en BD:');
    console.log(`   - Usuario encontrado: ${!!usuarioVerificado}`);
    console.log(`   - EmpresaId correcto: ${usuarioVerificado?.empresaId === 'Intercapital'}`);
    console.log(`   - Password hasheado: ${usuarioVerificado?.password?.startsWith('$2')}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

crearAdmin();
