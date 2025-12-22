/**
 * Crea usuario admin_jfc en la colección usuarios_empresa
 * Siguiendo la estructura de momento_admin
 */

import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

async function createJFCInUsuariosEmpresa() {
  try {
    console.log('🚀 CREANDO admin_jfc EN usuarios_empresa\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB:', mongoose.connection.name);
    console.log('');

    const db = mongoose.connection.db;
    if (!db) throw new Error('No se pudo obtener la base de datos');

    // 1. Buscar la empresa JFC Techno para obtener su _id
    console.log('📋 Buscando empresa JFC Techno...');
    const empresasCollection = db.collection('empresas');
    const empresa = await empresasCollection.findOne({ nombre: 'JFC Techno' });

    if (!empresa) {
      console.log('❌ Empresa JFC Techno no encontrada');
      console.log('   Creando empresa...\n');
      
      const result = await empresasCollection.insertOne({
        nombre: 'JFC Techno',
        telefono: '5493794000000',
        email: 'contacto@jfctechno.com',
        categoria: 'comercio',
        modelo: 'gpt-3.5-turbo',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      const empresaCreada = await empresasCollection.findOne({ _id: result.insertedId });
      console.log('✅ Empresa creada con _id:', empresaCreada?._id);
      console.log('');
    } else {
      console.log('✅ Empresa encontrada');
      console.log('   _id:', empresa._id);
      console.log('   Nombre:', empresa.nombre);
      console.log('');
    }

    const empresaId = empresa?._id || (await empresasCollection.findOne({ nombre: 'JFC Techno' }))?._id;

    // 2. Verificar si el usuario ya existe en usuarios_empresa
    console.log('📋 Verificando usuario en usuarios_empresa...');
    const usuariosEmpresaCollection = db.collection('usuarios_empresa');
    
    const existingUser = await usuariosEmpresaCollection.findOne({ 
      username: 'admin_jfc' 
    });

    if (existingUser) {
      console.log('⚠️  Usuario admin_jfc ya existe en usuarios_empresa');
      console.log('   Eliminando para recrear con estructura correcta...\n');
      await usuariosEmpresaCollection.deleteOne({ username: 'admin_jfc' });
    }

    // 3. Crear usuario siguiendo la estructura de momento_admin
    console.log('📋 Creando usuario admin_jfc...');
    
    const password = 'jfc2024!';
    const hashedPassword = await bcryptjs.hash(password, 10);

    const nuevoUsuario = {
      username: 'admin_jfc',
      email: 'admin@jfctechno.com',
      password: hashedPassword,
      nombre: 'Administrador',
      apellido: 'JFC Techno',
      empresaId: 'jfc_techno', // Usar slug como momento_ia
      rol: 'admin',
      activo: true,
      permisos: [
        'calendario',
        'clientes',
        'conversaciones',
        'configuracion',
        'integraciones',
        'reportes',
        'mercadopago'
      ],
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await usuariosEmpresaCollection.insertOne(nuevoUsuario);
    console.log('✅ Usuario creado en usuarios_empresa');
    console.log('   _id:', result.insertedId);
    console.log('');

    // 4. Verificar que se creó correctamente
    const userCreated = await usuariosEmpresaCollection.findOne({ username: 'admin_jfc' });
    console.log('✅ Verificación:');
    console.log('   Username:', userCreated?.username);
    console.log('   EmpresaId:', userCreated?.empresaId);
    console.log('   Rol:', userCreated?.rol);
    console.log('   Email:', userCreated?.email);
    console.log('   Activo:', userCreated?.activo);
    console.log('');

    // 5. Test de contraseña
    console.log('🔐 Probando contraseña...');
    const isValid = await bcryptjs.compare(password, userCreated?.password || '');
    console.log('   Resultado:', isValid ? '✅ VÁLIDA' : '❌ INVÁLIDA');
    console.log('');

    // 6. Test de login con authService
    console.log('═══════════════════════════════════════════════════════');
    console.log('🧪 TEST DE LOGIN CON authService');
    console.log('═══════════════════════════════════════════════════════\n');

    const { login } = await import('../src/services/authService.js');
    
    const loginResult = await login('admin_jfc', 'jfc2024!');
    
    console.log('Resultado:');
    console.log('  Success:', loginResult.success);
    
    if (loginResult.success) {
      console.log('  ✅ LOGIN EXITOSO');
      console.log('  Token:', loginResult.token?.substring(0, 50) + '...');
      console.log('  User:', JSON.stringify(loginResult.user, null, 2));
    } else {
      console.log('  ❌ LOGIN FALLIDO');
      console.log('  Mensaje:', loginResult.message);
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ SETUP COMPLETADO');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('🔐 CREDENCIALES:');
    console.log('   Username: admin_jfc');
    console.log('   Password: jfc2024!');
    console.log('');
    console.log('📋 COLECCIÓN: usuarios_empresa');
    console.log('   EmpresaId: jfc_techno');
    console.log('   Rol: admin');
    console.log('');
    console.log('⚠️  IMPORTANTE:');
    console.log('   El usuario ahora está en la colección usuarios_empresa');
    console.log('   con la misma estructura que momento_admin.');
    console.log('   El login debería funcionar en producción.');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

createJFCInUsuariosEmpresa();
