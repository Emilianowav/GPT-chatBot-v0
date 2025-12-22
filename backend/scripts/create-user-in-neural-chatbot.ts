/**
 * Crear usuario admin_jfc en la base de datos neural_chatbot
 * (que es donde el backend se conecta)
 */

import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

async function createUserInNeuralChatbot() {
  try {
    console.log('✨ CREANDO USUARIO EN neural_chatbot\n');
    
    // Conectar especificando la base de datos neural_chatbot
    await mongoose.connect(MONGODB_URI, {
      dbName: 'neural_chatbot'
    });
    
    console.log('✅ Conectado a MongoDB');
    console.log('   Database:', mongoose.connection.name);
    console.log('   Host:', mongoose.connection.host);
    console.log('');

    const db = mongoose.connection.db;
    if (!db) throw new Error('No se pudo obtener la base de datos');

    const password = 'jfc2024!';
    const hashedPassword = await bcryptjs.hash(password, 10);
    
    console.log('🔐 Credenciales:');
    console.log('   Username: admin_jfc');
    console.log('   Password:', password);
    console.log('   Hash:', hashedPassword.substring(0, 30) + '...');
    console.log('');

    // Verificar que la empresa existe
    const empresasCollection = db.collection('empresas');
    let jfcEmpresa = await empresasCollection.findOne({ nombre: 'JFC Techno' });
    
    if (!jfcEmpresa) {
      console.log('⚠️  Empresa JFC Techno NO existe - Creando...');
      
      const empresaData = {
        nombre: 'JFC Techno',
        categoria: 'comercio',
        telefono: '5493794000000',
        email: 'contacto@jfctechno.com',
        derivarA: [],
        prompt: 'Sos el asistente virtual de JFC Techno.',
        saludos: ['¡Hola! 👋 Bienvenido a JFC Techno.'],
        catalogoPath: 'catalogos/jfc-techno.txt',
        modelo: 'gpt-3.5-turbo',
        phoneNumberId: '',
        plan: 'basico',
        limites: {
          mensajesMensuales: 1000,
          usuariosActivos: 100,
          almacenamiento: 250,
          integraciones: 1,
          exportacionesMensuales: 0,
          agentesSimultaneos: 0,
          maxUsuarios: 5,
          maxAdmins: 1
        },
        uso: {
          mensajesEsteMes: 0,
          usuariosActivos: 0,
          almacenamientoUsado: 0,
          exportacionesEsteMes: 0,
          ultimaActualizacion: new Date()
        },
        facturacion: {
          estado: 'activo'
        },
        ubicaciones: [],
        modulos: [
          { id: 'conversaciones', nombre: 'Conversaciones', activo: true },
          { id: 'clientes', nombre: 'Clientes', activo: true },
          { id: 'productos', nombre: 'Productos', activo: true },
          { id: 'mercadopago', nombre: 'Mercado Pago', activo: true },
          { id: 'estadisticas', nombre: 'Estadísticas', activo: true },
          { id: 'configuracion', nombre: 'Configuración', activo: true }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await empresasCollection.insertOne(empresaData);
      console.log('   ✅ Empresa creada');
      console.log('   ID:', result.insertedId);
      console.log('');
      
      jfcEmpresa = empresaData as any;
      jfcEmpresa._id = result.insertedId;
    } else {
      console.log('✅ Empresa JFC Techno existe');
      console.log('   ID:', jfcEmpresa._id);
      console.log('');
    }

    // Eliminar usuarios existentes
    console.log('🧹 Limpiando usuarios existentes...');
    const adminUsersCollection = db.collection('admin_users');
    const usuariosEmpresaCollection = db.collection('usuarios_empresa');
    
    const deleteAU = await adminUsersCollection.deleteMany({ username: 'admin_jfc' });
    const deleteUE = await usuariosEmpresaCollection.deleteMany({ username: 'admin_jfc' });
    
    console.log('   admin_users:', deleteAU.deletedCount, 'eliminado(s)');
    console.log('   usuarios_empresa:', deleteUE.deletedCount, 'eliminado(s)');
    console.log('');

    // Crear en usuarios_empresa
    console.log('📋 Creando en usuarios_empresa...');
    const newUserUE = {
      username: 'admin_jfc',
      password: hashedPassword,
      email: 'admin@jfctechno.com',
      nombre: 'Administrador',
      apellido: 'JFC Techno',
      empresaId: 'JFC Techno',
      rol: 'admin',
      activo: true,
      permisos: ['calendario', 'clientes', 'conversaciones', 'configuracion', 'integraciones', 'reportes', 'mercadopago'],
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const resultUE = await usuariosEmpresaCollection.insertOne(newUserUE);
    console.log('   ✅ Usuario creado');
    console.log('   ID:', resultUE.insertedId);
    console.log('');

    // Crear en admin_users
    console.log('📋 Creando en admin_users...');
    const newUserAU = {
      username: 'admin_jfc',
      password: hashedPassword,
      email: 'admin@jfctechno.com',
      empresaId: 'JFC Techno',
      role: 'admin',
      activo: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const resultAU = await adminUsersCollection.insertOne(newUserAU);
    console.log('   ✅ Usuario creado');
    console.log('   ID:', resultAU.insertedId);
    console.log('');

    // Verificar
    console.log('🔍 Verificando usuarios creados...');
    const verifyUE = await usuariosEmpresaCollection.findOne({ username: 'admin_jfc' });
    const verifyAU = await adminUsersCollection.findOne({ username: 'admin_jfc' });
    
    console.log('   usuarios_empresa:', verifyUE ? '✅ EXISTE' : '❌ NO EXISTE');
    if (verifyUE) {
      console.log('     - Password hash:', verifyUE.password?.substring(0, 30) + '...');
      const testUE = await bcryptjs.compare(password, verifyUE.password);
      console.log('     - Test bcrypt:', testUE ? '✅ VÁLIDA' : '❌ INVÁLIDA');
    }
    
    console.log('   admin_users:', verifyAU ? '✅ EXISTE' : '❌ NO EXISTE');
    if (verifyAU) {
      console.log('     - Password hash:', verifyAU.password?.substring(0, 30) + '...');
      const testAU = await bcryptjs.compare(password, verifyAU.password);
      console.log('     - Test bcrypt:', testAU ? '✅ VÁLIDA' : '❌ INVÁLIDA');
    }
    console.log('');

    // Test de login
    console.log('═══════════════════════════════════════════════════════');
    console.log('🧪 TEST DE LOGIN');
    console.log('═══════════════════════════════════════════════════════\n');

    await mongoose.disconnect();
    await mongoose.connect(MONGODB_URI, { dbName: 'neural_chatbot' });
    
    const { login } = await import('../src/services/authService.js');
    
    console.log('Probando login con admin_jfc / jfc2024!...\n');
    const result = await login('admin_jfc', password);
    
    console.log('Resultado:');
    console.log('  Success:', result.success);
    
    if (result.success) {
      console.log('  ✅ LOGIN EXITOSO');
      console.log('  User:', result.user?.username);
      console.log('  Empresa:', result.user?.empresaNombre);
      console.log('  Role:', result.user?.role);
    } else {
      console.log('  ❌ LOGIN FALLIDO');
      console.log('  Mensaje:', result.message);
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ PROCESO COMPLETADO');
    console.log('═══════════════════════════════════════════════════════\n');
    
    if (result.success) {
      console.log('🎉 ÉXITO - Usuario creado en neural_chatbot\n');
      console.log('🔐 Credenciales:');
      console.log('   Username: admin_jfc');
      console.log('   Password: jfc2024!');
      console.log('');
      console.log('⚠️  REINICIA EL BACKEND:');
      console.log('   1. Ctrl+C en la terminal del backend');
      console.log('   2. npm run dev');
      console.log('   3. Prueba login en http://localhost:3001');
    } else {
      console.log('❌ ERROR - Revisa los logs arriba');
    }
    
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

createUserInNeuralChatbot();
