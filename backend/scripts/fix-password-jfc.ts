/**
 * Actualiza la contraseña de admin_jfc en TODAS las colecciones
 * para asegurar que funcione
 */

import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

async function fixPasswordJFC() {
  try {
    console.log('🔧 ACTUALIZANDO CONTRASEÑA DE admin_jfc\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB:', mongoose.connection.name);
    console.log('   Host:', mongoose.connection.host);
    console.log('');

    const db = mongoose.connection.db;
    if (!db) throw new Error('No se pudo obtener la base de datos');

    const password = 'jfc2024!';
    console.log('🔐 Nueva contraseña:', password);
    console.log('');

    // Generar hash nuevo
    const hashedPassword = await bcryptjs.hash(password, 10);
    console.log('✅ Hash generado:', hashedPassword.substring(0, 30) + '...');
    console.log('');

    // Actualizar en TODAS las colecciones de usuarios
    const collections = ['admin_users', 'adminusers', 'usuarios_empresa'];
    
    for (const collectionName of collections) {
      console.log(`═══════════════════════════════════════════════════════`);
      console.log(`📋 ACTUALIZANDO EN: ${collectionName}`);
      console.log(`═══════════════════════════════════════════════════════\n`);

      const collection = db.collection(collectionName);
      
      // Buscar usuario
      const user = await collection.findOne({ username: 'admin_jfc' });
      
      if (user) {
        console.log('✅ Usuario encontrado');
        console.log('   Password actual:', user.password?.substring(0, 30) + '...');
        
        // Actualizar contraseña
        const result = await collection.updateOne(
          { username: 'admin_jfc' },
          { 
            $set: { 
              password: hashedPassword,
              updatedAt: new Date()
            } 
          }
        );
        
        console.log('✅ Contraseña actualizada');
        console.log('   Modified count:', result.modifiedCount);
        
        // Verificar
        const updated = await collection.findOne({ username: 'admin_jfc' });
        const isValid = await bcryptjs.compare(password, updated?.password || '');
        console.log('✅ Verificación:', isValid ? 'VÁLIDA ✓' : 'INVÁLIDA ✗');
        console.log('');
      } else {
        console.log('⚠️  Usuario NO encontrado en esta colección');
        console.log('');
      }
    }

    // Test de login con authService
    console.log('═══════════════════════════════════════════════════════');
    console.log('🧪 TEST DE LOGIN CON authService');
    console.log('═══════════════════════════════════════════════════════\n');

    const { login } = await import('../src/services/authService.js');
    
    console.log('Probando login con admin_jfc / jfc2024!...');
    const loginResult = await login('admin_jfc', 'jfc2024!');
    
    console.log('\nResultado:');
    console.log('  Success:', loginResult.success);
    
    if (loginResult.success) {
      console.log('  ✅ LOGIN EXITOSO');
      console.log('  Token:', loginResult.token?.substring(0, 50) + '...');
      console.log('  User:');
      console.log('    - username:', loginResult.user?.username);
      console.log('    - empresaId:', loginResult.user?.empresaId);
      console.log('    - empresaNombre:', loginResult.user?.empresaNombre);
      console.log('    - role:', loginResult.user?.role);
    } else {
      console.log('  ❌ LOGIN FALLIDO');
      console.log('  Mensaje:', loginResult.message);
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ ACTUALIZACIÓN COMPLETADA');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('🔐 CREDENCIALES ACTUALIZADAS:');
    console.log('   Username: admin_jfc');
    console.log('   Password: jfc2024!');
    console.log('');
    console.log('📋 Hash actualizado en:');
    console.log('   - admin_users');
    console.log('   - adminusers');
    console.log('   - usuarios_empresa');
    console.log('');
    console.log('⚠️  IMPORTANTE:');
    console.log('   Si el backend en Render tiene caché,');
    console.log('   puede tardar unos minutos en reflejar el cambio.');
    console.log('   O haz un redeploy manual en Render.');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

fixPasswordJFC();
