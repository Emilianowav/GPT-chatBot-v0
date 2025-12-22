/**
 * Script de Debug: Comparar usuarios SanJose vs JFC Techno
 * Para identificar diferencias en la estructura de datos
 */

import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

async function debugLoginComparison() {
  try {
    console.log('🔍 DEBUG: Comparación de Login SanJose vs JFC Techno\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB:', mongoose.connection.name);
    console.log('   Host:', mongoose.connection.host);
    console.log('');

    const db = mongoose.connection.db;
    if (!db) throw new Error('No se pudo obtener la base de datos');

    // 1. Buscar usuarios en admin_users
    console.log('═══════════════════════════════════════════════════════');
    console.log('📋 USUARIOS EN admin_users');
    console.log('═══════════════════════════════════════════════════════\n');

    const adminUsersCollection = db.collection('admin_users');
    
    // Buscar SanJose
    const sanjoseUsers = await adminUsersCollection.find({ 
      empresaId: { $regex: /sanjose/i } 
    }).toArray();
    
    console.log('🏢 Usuarios de SanJose:');
    if (sanjoseUsers.length > 0) {
      sanjoseUsers.forEach((user: any) => {
        console.log('   Username:', user.username);
        console.log('   EmpresaId:', user.empresaId);
        console.log('   Role:', user.role);
        console.log('   Email:', user.email);
        console.log('   Activo:', user.activo);
        console.log('   Password hash length:', user.password?.length || 0);
        console.log('   CreatedAt:', user.createdAt);
        console.log('   ---');
      });
    } else {
      console.log('   ❌ No se encontraron usuarios de SanJose');
    }

    // Buscar JFC Techno
    const jfcUsers = await adminUsersCollection.find({ 
      $or: [
        { empresaId: { $regex: /jfc/i } },
        { username: 'admin_jfc' }
      ]
    }).toArray();
    
    console.log('\n🏢 Usuarios de JFC Techno:');
    if (jfcUsers.length > 0) {
      jfcUsers.forEach((user: any) => {
        console.log('   Username:', user.username);
        console.log('   EmpresaId:', user.empresaId);
        console.log('   Role:', user.role);
        console.log('   Email:', user.email);
        console.log('   Activo:', user.activo);
        console.log('   Password hash length:', user.password?.length || 0);
        console.log('   CreatedAt:', user.createdAt);
        console.log('   ---');
      });
    } else {
      console.log('   ❌ No se encontraron usuarios de JFC Techno');
    }

    // 2. Buscar en usuarios_empresa (nuevo sistema)
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📋 USUARIOS EN usuarios_empresa');
    console.log('═══════════════════════════════════════════════════════\n');

    const usuariosEmpresaCollection = db.collection('usuarios_empresa');
    
    const sanjoseUsersNew = await usuariosEmpresaCollection.find({ 
      empresaId: { $regex: /sanjose/i } 
    }).toArray();
    
    console.log('🏢 Usuarios de SanJose (nuevo sistema):');
    if (sanjoseUsersNew.length > 0) {
      sanjoseUsersNew.forEach((user: any) => {
        console.log('   Username:', user.username);
        console.log('   EmpresaId:', user.empresaId);
        console.log('   Rol:', user.rol);
        console.log('   Email:', user.email);
        console.log('   Activo:', user.activo);
        console.log('   ---');
      });
    } else {
      console.log('   ℹ️  No hay usuarios en el nuevo sistema');
    }

    const jfcUsersNew = await usuariosEmpresaCollection.find({ 
      $or: [
        { empresaId: { $regex: /jfc/i } },
        { username: 'admin_jfc' }
      ]
    }).toArray();
    
    console.log('\n🏢 Usuarios de JFC Techno (nuevo sistema):');
    if (jfcUsersNew.length > 0) {
      jfcUsersNew.forEach((user: any) => {
        console.log('   Username:', user.username);
        console.log('   EmpresaId:', user.empresaId);
        console.log('   Rol:', user.rol);
        console.log('   Email:', user.email);
        console.log('   Activo:', user.activo);
        console.log('   ---');
      });
    } else {
      console.log('   ℹ️  No hay usuarios en el nuevo sistema');
    }

    // 3. Verificar empresas
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📋 EMPRESAS EN empresas');
    console.log('═══════════════════════════════════════════════════════\n');

    const empresasCollection = db.collection('empresas');
    
    const sanjoseEmpresa = await empresasCollection.findOne({ 
      nombre: { $regex: /sanjose/i } 
    });
    
    console.log('🏢 Empresa SanJose:');
    if (sanjoseEmpresa) {
      console.log('   Nombre:', sanjoseEmpresa.nombre);
      console.log('   _id:', sanjoseEmpresa._id);
      console.log('   Email:', sanjoseEmpresa.email);
      console.log('   Teléfono:', sanjoseEmpresa.telefono);
    } else {
      console.log('   ❌ No encontrada');
    }

    const jfcEmpresa = await empresasCollection.findOne({ 
      nombre: { $regex: /jfc/i } 
    });
    
    console.log('\n🏢 Empresa JFC Techno:');
    if (jfcEmpresa) {
      console.log('   Nombre:', jfcEmpresa.nombre);
      console.log('   _id:', jfcEmpresa._id);
      console.log('   Email:', jfcEmpresa.email);
      console.log('   Teléfono:', jfcEmpresa.telefono);
    } else {
      console.log('   ❌ No encontrada');
    }

    // 4. Test de contraseñas
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🔐 TEST DE CONTRASEÑAS');
    console.log('═══════════════════════════════════════════════════════\n');

    if (sanjoseUsers.length > 0) {
      const sanjoseUser = sanjoseUsers[0];
      console.log('🏢 SanJose - Usuario:', sanjoseUser.username);
      console.log('   Probando contraseñas comunes...');
      
      const commonPasswords = ['admin123', 'sanjose2024', 'admin', '123456'];
      for (const pwd of commonPasswords) {
        const isValid = await bcryptjs.compare(pwd, sanjoseUser.password);
        if (isValid) {
          console.log(`   ✅ Contraseña encontrada: "${pwd}"`);
          break;
        }
      }
    }

    if (jfcUsers.length > 0) {
      const jfcUser = jfcUsers[0];
      console.log('\n🏢 JFC Techno - Usuario:', jfcUser.username);
      console.log('   Probando contraseña: jfc2024!');
      
      const isValid = await bcryptjs.compare('jfc2024!', jfcUser.password);
      console.log('   Resultado:', isValid ? '✅ VÁLIDA' : '❌ INVÁLIDA');
      
      if (!isValid) {
        console.log('\n   ⚠️  PROBLEMA DETECTADO: La contraseña no coincide');
        console.log('   Actualizando contraseña...');
        
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
        console.log('   ✅ Contraseña actualizada a: jfc2024!');
      }
    }

    // 5. Simular login con authService
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🧪 SIMULACIÓN DE LOGIN (authService)');
    console.log('═══════════════════════════════════════════════════════\n');

    const { login } = await import('../src/services/authService.js');

    // Test SanJose
    if (sanjoseUsers.length > 0) {
      console.log('🏢 Test SanJose:');
      const sanjoseUsername = sanjoseUsers[0].username;
      console.log('   Username:', sanjoseUsername);
      console.log('   Probando login...');
      
      // Intentar con contraseñas comunes
      const testPasswords = ['admin123', 'sanjose2024', 'admin', '123456'];
      for (const pwd of testPasswords) {
        const result = await login(sanjoseUsername, pwd);
        if (result.success) {
          console.log(`   ✅ Login exitoso con: "${pwd}"`);
          console.log('   Token generado:', result.token?.substring(0, 50) + '...');
          break;
        }
      }
    }

    // Test JFC Techno
    console.log('\n🏢 Test JFC Techno:');
    console.log('   Username: admin_jfc');
    console.log('   Password: jfc2024!');
    
    const jfcResult = await login('admin_jfc', 'jfc2024!');
    console.log('   Success:', jfcResult.success);
    
    if (jfcResult.success) {
      console.log('   ✅ Login exitoso');
      console.log('   Token:', jfcResult.token?.substring(0, 50) + '...');
      console.log('   User:', JSON.stringify(jfcResult.user, null, 2));
    } else {
      console.log('   ❌ Login fallido');
      console.log('   Mensaje:', jfcResult.message);
    }

    // 6. Comparación de estructura
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📊 COMPARACIÓN DE ESTRUCTURA');
    console.log('═══════════════════════════════════════════════════════\n');

    if (sanjoseUsers.length > 0 && jfcUsers.length > 0) {
      const sanjose = sanjoseUsers[0];
      const jfc = jfcUsers[0];

      console.log('Campos en SanJose:', Object.keys(sanjose).join(', '));
      console.log('Campos en JFC:', Object.keys(jfc).join(', '));
      
      console.log('\nDiferencias detectadas:');
      const sanjoseKeys = Object.keys(sanjose);
      const jfcKeys = Object.keys(jfc);
      
      const onlyInSanjose = sanjoseKeys.filter(k => !jfcKeys.includes(k));
      const onlyInJfc = jfcKeys.filter(k => !sanjoseKeys.includes(k));
      
      if (onlyInSanjose.length > 0) {
        console.log('   Solo en SanJose:', onlyInSanjose.join(', '));
      }
      if (onlyInJfc.length > 0) {
        console.log('   Solo en JFC:', onlyInJfc.join(', '));
      }
      if (onlyInSanjose.length === 0 && onlyInJfc.length === 0) {
        console.log('   ✅ Estructura idéntica');
      }

      // Comparar valores específicos
      console.log('\nComparación de valores clave:');
      console.log('   username (lowercase):');
      console.log('      SanJose:', sanjose.username);
      console.log('      JFC:', jfc.username);
      console.log('   empresaId:');
      console.log('      SanJose:', sanjose.empresaId);
      console.log('      JFC:', jfc.empresaId);
      console.log('   role:');
      console.log('      SanJose:', sanjose.role);
      console.log('      JFC:', jfc.role);
      console.log('   activo:');
      console.log('      SanJose:', sanjose.activo);
      console.log('      JFC:', jfc.activo);
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ DEBUG COMPLETADO');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

debugLoginComparison();
