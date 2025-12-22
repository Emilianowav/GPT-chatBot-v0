/**
 * FIX FINAL: El password está como texto plano "admin123"
 * Necesita ser un hash bcrypt válido
 */

import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

async function fixAdminJFCPasswordFinal() {
  try {
    console.log('🔧 FIX FINAL: Actualizando contraseña de admin_jfc\n');
    console.log('PROBLEMA IDENTIFICADO:');
    console.log('  El password en DB es "admin123" (texto plano)');
    console.log('  Debe ser un hash bcrypt válido\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB:', mongoose.connection.name);
    console.log('');

    const db = mongoose.connection.db;
    if (!db) throw new Error('No se pudo obtener la base de datos');

    const newPassword = 'jfc2024!';
    
    // Generar hash bcrypt válido
    console.log('🔐 Generando hash bcrypt para:', newPassword);
    const hashedPassword = await bcryptjs.hash(newPassword, 10);
    console.log('✅ Hash generado:', hashedPassword);
    console.log('   Longitud:', hashedPassword.length);
    console.log('   Formato válido:', hashedPassword.startsWith('$2b$') ? '✅ SÍ' : '❌ NO');
    console.log('');

    // Verificar hash antes de guardar
    const testComparison = await bcryptjs.compare(newPassword, hashedPassword);
    console.log('✅ Test de hash:', testComparison ? '✅ VÁLIDO' : '❌ INVÁLIDO');
    console.log('');

    // Actualizar en admin_users (donde está el usuario según los logs)
    console.log('📋 Actualizando en admin_users...');
    const adminUsersCollection = db.collection('admin_users');
    
    // Verificar estado actual
    const currentUser = await adminUsersCollection.findOne({ username: 'admin_jfc' });
    if (currentUser) {
      console.log('   Usuario actual:');
      console.log('   - ID:', currentUser._id);
      console.log('   - Username:', currentUser.username);
      console.log('   - Password actual:', currentUser.password);
      console.log('   - EmpresaId:', currentUser.empresaId);
      console.log('');
    }

    // Actualizar directamente
    const result = await adminUsersCollection.updateOne(
      { username: 'admin_jfc' },
      { 
        $set: { 
          password: hashedPassword,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log('   Modified count:', result.modifiedCount);
    
    // Verificar actualización
    const updatedUser = await adminUsersCollection.findOne({ username: 'admin_jfc' });
    if (updatedUser) {
      console.log('   Usuario actualizado:');
      console.log('   - Password nuevo:', updatedUser.password);
      console.log('   - Longitud:', updatedUser.password?.length);
      
      // Test de comparación
      const isValid = await bcryptjs.compare(newPassword, updatedUser.password);
      console.log('   - Test bcrypt:', isValid ? '✅ VÁLIDA' : '❌ INVÁLIDA');
    }
    console.log('');

    // También actualizar en usuarios_empresa por si acaso
    console.log('📋 Actualizando en usuarios_empresa...');
    const usuariosEmpresaCollection = db.collection('usuarios_empresa');
    
    const userInUE = await usuariosEmpresaCollection.findOne({ username: 'admin_jfc' });
    if (userInUE) {
      console.log('   Usuario encontrado en usuarios_empresa');
      await usuariosEmpresaCollection.updateOne(
        { username: 'admin_jfc' },
        { 
          $set: { 
            password: hashedPassword,
            updatedAt: new Date()
          } 
        }
      );
      console.log('   ✅ Actualizado');
    } else {
      console.log('   ⚠️  Usuario NO encontrado en usuarios_empresa');
    }
    console.log('');

    // Test de login con authService
    console.log('═══════════════════════════════════════════════════════');
    console.log('🧪 TEST DE LOGIN CON authService');
    console.log('═══════════════════════════════════════════════════════\n');

    // Desconectar y reconectar para limpiar caché
    await mongoose.disconnect();
    await mongoose.connect(MONGODB_URI);
    
    const { login } = await import('../src/services/authService.js');
    
    console.log('Probando login con admin_jfc / jfc2024!...\n');
    const loginResult = await login('admin_jfc', newPassword);
    
    console.log('Resultado:');
    console.log('  Success:', loginResult.success);
    
    if (loginResult.success) {
      console.log('  ✅ LOGIN EXITOSO');
      console.log('  User:', loginResult.user?.username);
      console.log('  Empresa:', loginResult.user?.empresaNombre);
      console.log('  Role:', loginResult.user?.role);
      console.log('  Token:', loginResult.token?.substring(0, 50) + '...');
    } else {
      console.log('  ❌ LOGIN FALLIDO');
      console.log('  Mensaje:', loginResult.message);
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ FIX COMPLETADO');
    console.log('═══════════════════════════════════════════════════════\n');
    
    if (loginResult.success) {
      console.log('🎉 ÉXITO - La contraseña se actualizó correctamente\n');
      console.log('🔐 Credenciales:');
      console.log('   Username: admin_jfc');
      console.log('   Password: jfc2024!');
      console.log('');
      console.log('⚠️  SIGUIENTE PASO:');
      console.log('   1. REINICIA EL BACKEND (Ctrl+C y npm run dev)');
      console.log('   2. Prueba el login en http://localhost:3001');
      console.log('');
    } else {
      console.log('❌ ERROR - El login sigue fallando');
      console.log('   Revisa los logs arriba para más detalles');
    }
    
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

fixAdminJFCPasswordFinal();
