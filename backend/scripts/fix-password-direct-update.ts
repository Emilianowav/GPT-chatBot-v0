/**
 * Actualiza la contraseña DIRECTAMENTE en la base de datos
 * SIN usar .save() para evitar el doble hash
 */

import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

async function fixPasswordDirectUpdate() {
  try {
    console.log('🔧 ACTUALIZANDO CONTRASEÑA DIRECTAMENTE EN DB\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB:', mongoose.connection.name);
    console.log('');

    const db = mongoose.connection.db;
    if (!db) throw new Error('No se pudo obtener la base de datos');

    const password = 'jfc2024!';
    
    // Generar hash UNA SOLA VEZ
    console.log('🔐 Generando hash para:', password);
    const hashedPassword = await bcryptjs.hash(password, 10);
    console.log('✅ Hash generado:', hashedPassword.substring(0, 30) + '...');
    console.log('');

    // Actualizar DIRECTAMENTE en la base de datos (sin usar Mongoose .save())
    const collections = ['admin_users', 'usuarios_empresa'];
    
    for (const collectionName of collections) {
      console.log(`📋 Actualizando ${collectionName}...`);
      const collection = db.collection(collectionName);
      
      // Actualizar directamente con updateOne (sin pre-save hook)
      const result = await collection.updateOne(
        { username: 'admin_jfc' },
        { 
          $set: { 
            password: hashedPassword,
            updatedAt: new Date()
          } 
        }
      );
      
      console.log('   Modified count:', result.modifiedCount);
      
      if (result.modifiedCount > 0) {
        // Verificar
        const user = await collection.findOne({ username: 'admin_jfc' });
        const isValid = await bcryptjs.compare(password, user?.password || '');
        console.log('   Verificación:', isValid ? '✅ VÁLIDA' : '❌ INVÁLIDA');
        console.log('   Hash en DB:', user?.password?.substring(0, 30) + '...');
      } else {
        console.log('   ⚠️  Usuario no encontrado o no modificado');
      }
      console.log('');
    }

    // Test de login
    console.log('═══════════════════════════════════════════════════════');
    console.log('🧪 TEST DE LOGIN');
    console.log('═══════════════════════════════════════════════════════\n');

    // Desconectar y reconectar para limpiar caché de Mongoose
    await mongoose.disconnect();
    await mongoose.connect(MONGODB_URI);
    
    const { login } = await import('../src/services/authService.js');
    
    console.log('Probando login con admin_jfc / jfc2024!...');
    const result = await login('admin_jfc', password);
    
    console.log('\nResultado:');
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
    console.log('✅ ACTUALIZACIÓN COMPLETADA');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('🔐 Credenciales:');
    console.log('   Username: admin_jfc');
    console.log('   Password: jfc2024!');
    console.log('');
    console.log('⚠️  IMPORTANTE:');
    console.log('   La contraseña se actualizó DIRECTAMENTE en la DB');
    console.log('   sin pasar por el pre-save hook de Mongoose.');
    console.log('   Esto evita el problema del doble hash.');
    console.log('');
    console.log('   Si el login funciona, REINICIA EL BACKEND:');
    console.log('   1. Ctrl+C en la terminal del backend');
    console.log('   2. npm run dev');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

fixPasswordDirectUpdate();
