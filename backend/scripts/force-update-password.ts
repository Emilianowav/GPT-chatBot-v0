/**
 * Fuerza la actualización de la contraseña de admin_jfc
 * y verifica que funcione
 */

import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

async function forceUpdatePassword() {
  try {
    console.log('🔧 FORZANDO ACTUALIZACIÓN DE CONTRASEÑA\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB:', mongoose.connection.name);
    console.log('');

    const db = mongoose.connection.db;
    if (!db) throw new Error('No se pudo obtener la base de datos');

    const password = 'jfc2024!';
    
    // Generar NUEVO hash
    console.log('🔐 Generando nuevo hash para:', password);
    const newHash = await bcryptjs.hash(password, 10);
    console.log('✅ Hash generado:', newHash);
    console.log('');

    // Actualizar en TODAS las colecciones
    const collections = ['admin_users', 'usuarios_empresa'];
    
    for (const collectionName of collections) {
      console.log(`📋 Actualizando ${collectionName}...`);
      const collection = db.collection(collectionName);
      
      const user = await collection.findOne({ username: 'admin_jfc' });
      
      if (user) {
        console.log('   Usuario encontrado');
        console.log('   Hash anterior:', user.password);
        
        // FORZAR actualización
        await collection.updateOne(
          { username: 'admin_jfc' },
          { 
            $set: { 
              password: newHash,
              updatedAt: new Date()
            } 
          }
        );
        
        // Verificar inmediatamente
        const updated = await collection.findOne({ username: 'admin_jfc' });
        console.log('   Hash nuevo:', updated?.password);
        
        // Test de comparación
        const isValid = await bcryptjs.compare(password, updated?.password || '');
        console.log('   Test bcrypt:', isValid ? '✅ VÁLIDA' : '❌ INVÁLIDA');
        
        if (!isValid) {
          console.log('   ⚠️  ERROR: El hash NO es válido después de actualizar');
        }
      } else {
        console.log('   ⚠️  Usuario NO encontrado');
      }
      console.log('');
    }

    // Test final con authService
    console.log('═══════════════════════════════════════════════════════');
    console.log('🧪 TEST FINAL CON authService');
    console.log('═══════════════════════════════════════════════════════\n');

    // Desconectar y reconectar para limpiar caché
    await mongoose.disconnect();
    await mongoose.connect(MONGODB_URI);
    
    const { login } = await import('../src/services/authService.js');
    
    console.log('Intentando login con admin_jfc / jfc2024!...');
    const result = await login('admin_jfc', password);
    
    console.log('\nResultado:');
    console.log('  Success:', result.success);
    
    if (result.success) {
      console.log('  ✅ LOGIN EXITOSO');
      console.log('  User:', result.user?.username);
      console.log('  Empresa:', result.user?.empresaNombre);
    } else {
      console.log('  ❌ LOGIN FALLIDO');
      console.log('  Mensaje:', result.message);
      
      // Debug adicional
      console.log('\n🔍 DEBUG ADICIONAL:');
      const db2 = mongoose.connection.db;
      if (db2) {
        const col = db2.collection('usuarios_empresa');
        const u = await col.findOne({ username: 'admin_jfc' });
        console.log('  Usuario en DB:', u ? 'Existe' : 'No existe');
        if (u) {
          console.log('  Password hash:', u.password);
          const test = await bcryptjs.compare(password, u.password);
          console.log('  Test directo:', test ? 'VÁLIDA' : 'INVÁLIDA');
        }
      }
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ PROCESO COMPLETADO');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('🔐 Credenciales:');
    console.log('   Username: admin_jfc');
    console.log('   Password: jfc2024!');
    console.log('');
    console.log('Si sigue fallando, el problema está en el código de authService.');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

forceUpdatePassword();
