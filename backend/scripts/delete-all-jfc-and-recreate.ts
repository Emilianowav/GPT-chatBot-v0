/**
 * ELIMINAR TODOS los usuarios de JFC Techno y crear uno nuevo limpio
 * El backend está viendo una DB diferente, así que vamos a buscar en TODAS las DBs
 */

import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

async function deleteAllJFCAndRecreate() {
  try {
    console.log('🗑️  ELIMINANDO TODOS LOS USUARIOS DE JFC TECHNO\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
    console.log('   URI:', MONGODB_URI.substring(0, 50) + '...');
    console.log('   Database:', mongoose.connection.name);
    console.log('   Host:', mongoose.connection.host);
    console.log('');

    const db = mongoose.connection.db;
    if (!db) throw new Error('No se pudo obtener la base de datos');

    // Listar TODAS las bases de datos
    console.log('📋 Listando todas las bases de datos...');
    const adminDb = mongoose.connection.db.admin();
    const { databases } = await adminDb.listDatabases();
    
    console.log('Bases de datos encontradas:');
    databases.forEach((db: any) => {
      console.log(`  - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    console.log('');

    // Buscar y eliminar en TODAS las colecciones de TODAS las bases de datos
    const collectionsToCheck = ['admin_users', 'adminusers', 'usuarios_empresa', 'usuarios', 'usuarioempresas'];
    
    for (const dbInfo of databases) {
      // Saltar bases de datos del sistema
      if (['admin', 'local', 'config'].includes(dbInfo.name)) continue;
      
      console.log(`═══════════════════════════════════════════════════════`);
      console.log(`🗄️  BASE DE DATOS: ${dbInfo.name}`);
      console.log(`═══════════════════════════════════════════════════════\n`);
      
      const currentDb = mongoose.connection.client.db(dbInfo.name);
      
      for (const collectionName of collectionsToCheck) {
        try {
          const collection = currentDb.collection(collectionName);
          
          // Buscar usuarios admin_jfc
          const users = await collection.find({ username: 'admin_jfc' }).toArray();
          
          if (users.length > 0) {
            console.log(`📁 ${collectionName}: ${users.length} usuario(s) encontrado(s)`);
            
            users.forEach((user: any) => {
              console.log(`   - ID: ${user._id}`);
              console.log(`     Password: ${user.password}`);
              console.log(`     EmpresaId: ${user.empresaId}`);
            });
            
            // ELIMINAR TODOS
            const deleteResult = await collection.deleteMany({ username: 'admin_jfc' });
            console.log(`   ✅ Eliminados: ${deleteResult.deletedCount}`);
            console.log('');
          }
        } catch (err) {
          // Colección no existe, continuar
        }
      }
    }

    // Ahora crear usuario NUEVO en la base de datos actual
    console.log('═══════════════════════════════════════════════════════');
    console.log('✨ CREANDO USUARIO NUEVO');
    console.log('═══════════════════════════════════════════════════════\n');
    
    const password = 'jfc2024!';
    const hashedPassword = await bcryptjs.hash(password, 10);
    
    console.log('🔐 Credenciales:');
    console.log('   Username: admin_jfc');
    console.log('   Password:', password);
    console.log('   Hash:', hashedPassword);
    console.log('');

    // Verificar que la empresa JFC Techno existe
    const empresasCollection = db.collection('empresas');
    const jfcEmpresa = await empresasCollection.findOne({ nombre: 'JFC Techno' });
    
    if (!jfcEmpresa) {
      console.log('❌ Empresa JFC Techno NO encontrada');
      console.log('   Creando empresa...\n');
      
      await empresasCollection.insertOne({
        nombre: 'JFC Techno',
        categoria: 'comercio',
        telefono: '5493794000000',
        email: 'contacto@jfctechno.com',
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('✅ Empresa creada');
    } else {
      console.log('✅ Empresa JFC Techno existe');
      console.log('   ID:', jfcEmpresa._id);
    }
    console.log('');

    // Crear usuario en usuarios_empresa (sistema nuevo)
    console.log('📋 Creando en usuarios_empresa...');
    const usuariosEmpresaCollection = db.collection('usuarios_empresa');
    
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

    // Crear usuario en admin_users (sistema antiguo) por compatibilidad
    console.log('📋 Creando en admin_users...');
    const adminUsersCollection = db.collection('admin_users');
    
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

    // Test de login
    console.log('═══════════════════════════════════════════════════════');
    console.log('🧪 TEST DE LOGIN');
    console.log('═══════════════════════════════════════════════════════\n');

    await mongoose.disconnect();
    await mongoose.connect(MONGODB_URI);
    
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
      console.log('🎉 ÉXITO - Usuario creado correctamente\n');
      console.log('🔐 Credenciales:');
      console.log('   Username: admin_jfc');
      console.log('   Password: jfc2024!');
      console.log('');
      console.log('⚠️  REINICIA EL BACKEND:');
      console.log('   1. Ctrl+C');
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

deleteAllJFCAndRecreate();
