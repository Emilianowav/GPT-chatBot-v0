/**
 * Script para probar login en PRODUCCIÓN
 * Compara SanJose (que funciona) vs JFC Techno (que no funciona)
 */

import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

async function testProductionLogin() {
  try {
    console.log('🔍 TEST DE LOGIN EN PRODUCCIÓN\n');
    console.log('Conectando a:', MONGODB_URI.substring(0, 50) + '...\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB:', mongoose.connection.name);
    console.log('   Host:', mongoose.connection.host);
    console.log('');

    const db = mongoose.connection.db;
    if (!db) throw new Error('No se pudo obtener la base de datos');

    const adminUsersCollection = db.collection('admin_users');

    // 1. Buscar TODOS los usuarios activos
    console.log('═══════════════════════════════════════════════════════');
    console.log('📋 TODOS LOS USUARIOS ACTIVOS EN PRODUCCIÓN');
    console.log('═══════════════════════════════════════════════════════\n');

    const allUsers = await adminUsersCollection.find({ activo: true }).toArray();
    
    console.log(`Total de usuarios activos: ${allUsers.length}\n`);
    
    allUsers.forEach((user: any, index: number) => {
      console.log(`${index + 1}. Username: ${user.username}`);
      console.log(`   EmpresaId: ${user.empresaId}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Email: ${user.email || 'N/A'}`);
      console.log(`   Password hash: ${user.password ? 'Existe (' + user.password.length + ' chars)' : 'NO EXISTE'}`);
      console.log('');
    });

    // 2. Buscar específicamente SanJose
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔍 BUSCANDO USUARIOS DE SANJOSE');
    console.log('═══════════════════════════════════════════════════════\n');

    const sanjoseUsers = await adminUsersCollection.find({ 
      empresaId: { $regex: /sanjose/i } 
    }).toArray();

    if (sanjoseUsers.length > 0) {
      console.log(`✅ Encontrados ${sanjoseUsers.length} usuarios de SanJose:\n`);
      sanjoseUsers.forEach((user: any) => {
        console.log(`Username: ${user.username}`);
        console.log(`EmpresaId: "${user.empresaId}"`);
        console.log(`Role: ${user.role}`);
        console.log(`Activo: ${user.activo}`);
        console.log(`Password hash: ${user.password?.substring(0, 20)}...`);
        console.log('');
      });
    } else {
      console.log('❌ No se encontraron usuarios de SanJose\n');
      
      // Buscar variaciones
      console.log('Buscando variaciones...');
      const variations = await adminUsersCollection.find({ 
        empresaId: { $regex: /san/i } 
      }).toArray();
      
      if (variations.length > 0) {
        console.log(`Encontrados ${variations.length} usuarios con "san":`);
        variations.forEach((user: any) => {
          console.log(`  - ${user.username} (${user.empresaId})`);
        });
      }
      console.log('');
    }

    // 3. Buscar JFC Techno
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔍 BUSCANDO USUARIOS DE JFC TECHNO');
    console.log('═══════════════════════════════════════════════════════\n');

    const jfcUser = await adminUsersCollection.findOne({ username: 'admin_jfc' });

    if (jfcUser) {
      console.log('✅ Usuario admin_jfc encontrado:\n');
      console.log(`Username: ${jfcUser.username}`);
      console.log(`EmpresaId: "${jfcUser.empresaId}"`);
      console.log(`Role: ${jfcUser.role}`);
      console.log(`Email: ${jfcUser.email}`);
      console.log(`Activo: ${jfcUser.activo}`);
      console.log(`Password hash: ${jfcUser.password?.substring(0, 20)}...`);
      console.log(`CreatedAt: ${jfcUser.createdAt}`);
      console.log('');

      // Test de contraseña
      console.log('🔐 Probando contraseña "jfc2024!"...');
      const isValid = await bcryptjs.compare('jfc2024!', jfcUser.password);
      console.log(`Resultado: ${isValid ? '✅ VÁLIDA' : '❌ INVÁLIDA'}`);
      
      if (!isValid) {
        console.log('\n⚠️  ACTUALIZANDO CONTRASEÑA...');
        const newHash = await bcryptjs.hash('jfc2024!', 10);
        await adminUsersCollection.updateOne(
          { _id: jfcUser._id },
          { 
            $set: { 
              password: newHash,
              updatedAt: new Date()
            } 
          }
        );
        console.log('✅ Contraseña actualizada a: jfc2024!');
      }
    } else {
      console.log('❌ Usuario admin_jfc NO ENCONTRADO en producción\n');
      console.log('⚠️  CREANDO USUARIO...\n');

      // Verificar que la empresa existe
      const empresasCollection = db.collection('empresas');
      let empresa = await empresasCollection.findOne({ nombre: 'JFC Techno' });

      if (!empresa) {
        console.log('⚠️  Empresa JFC Techno no existe, creando...');
        const result = await empresasCollection.insertOne({
          nombre: 'JFC Techno',
          telefono: '5493794000000',
          email: 'contacto@jfctechno.com',
          categoria: 'comercio',
          modelo: 'gpt-3.5-turbo',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        empresa = await empresasCollection.findOne({ _id: result.insertedId });
        console.log('✅ Empresa creada');
      }

      // Crear usuario
      const password = 'jfc2024!';
      const hashedPassword = await bcryptjs.hash(password, 10);
      
      await adminUsersCollection.insertOne({
        username: 'admin_jfc',
        password: hashedPassword,
        empresaId: 'JFC Techno',
        role: 'admin',
        email: 'admin@jfctechno.com',
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('✅ Usuario admin_jfc creado en producción');
      console.log('   Username: admin_jfc');
      console.log('   Password: jfc2024!');
      console.log('   EmpresaId: JFC Techno');
    }

    // 4. Verificar empresas
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📋 EMPRESAS EN PRODUCCIÓN');
    console.log('═══════════════════════════════════════════════════════\n');

    const empresasCollection = db.collection('empresas');
    const empresas = await empresasCollection.find({}).toArray();

    console.log(`Total de empresas: ${empresas.length}\n`);
    empresas.forEach((empresa: any, index: number) => {
      console.log(`${index + 1}. ${empresa.nombre}`);
      console.log(`   _id: ${empresa._id}`);
      console.log(`   Email: ${empresa.email || 'N/A'}`);
      console.log('');
    });

    // 5. Test de login con authService
    console.log('═══════════════════════════════════════════════════════');
    console.log('🧪 TEST DE LOGIN CON authService');
    console.log('═══════════════════════════════════════════════════════\n');

    const { login } = await import('../src/services/authService.js');

    // Test con admin_jfc
    console.log('Probando login con admin_jfc / jfc2024!...');
    const result = await login('admin_jfc', 'jfc2024!');
    
    console.log('\nResultado:');
    console.log('  Success:', result.success);
    
    if (result.success) {
      console.log('  ✅ LOGIN EXITOSO');
      console.log('  Token:', result.token?.substring(0, 50) + '...');
      console.log('  User:', JSON.stringify(result.user, null, 2));
    } else {
      console.log('  ❌ LOGIN FALLIDO');
      console.log('  Mensaje:', result.message);
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📋 RESUMEN');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('Base de datos:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);
    console.log('Total usuarios activos:', allUsers.length);
    console.log('Usuario admin_jfc existe:', jfcUser ? 'SÍ' : 'NO (creado ahora)');
    console.log('Login funciona:', result.success ? 'SÍ' : 'NO');
    console.log('\n🔐 CREDENCIALES VÁLIDAS:');
    console.log('   Username: admin_jfc');
    console.log('   Password: jfc2024!');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

testProductionLogin();
