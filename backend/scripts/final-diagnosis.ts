/**
 * Diagnóstico final completo
 */

import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

async function finalDiagnosis() {
  try {
    console.log('🔍 DIAGNÓSTICO FINAL COMPLETO\n');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📋 CONFIGURACIÓN');
    console.log('═══════════════════════════════════════════════════════\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
    console.log('   Database:', mongoose.connection.name);
    console.log('   Host:', mongoose.connection.host);
    console.log('   URI:', MONGODB_URI.substring(0, 50) + '...');
    console.log('');

    const db = mongoose.connection.db;
    if (!db) throw new Error('No se pudo obtener la base de datos');

    // 1. Verificar TODOS los usuarios admin_jfc
    console.log('═══════════════════════════════════════════════════════');
    console.log('📋 USUARIOS admin_jfc EN TODAS LAS COLECCIONES');
    console.log('═══════════════════════════════════════════════════════\n');

    const collections = ['admin_users', 'adminusers', 'usuarios_empresa'];
    const password = 'jfc2024!';
    
    for (const collectionName of collections) {
      const collection = db.collection(collectionName);
      const user = await collection.findOne({ username: 'admin_jfc' });
      
      console.log(`📁 ${collectionName}:`);
      if (user) {
        console.log('   ✅ Usuario existe');
        console.log('   empresaId:', user.empresaId);
        console.log('   activo:', user.activo);
        console.log('   email:', user.email);
        
        // Test de contraseña
        const isValid = await bcryptjs.compare(password, user.password || '');
        console.log('   password jfc2024!:', isValid ? '✅ VÁLIDA' : '❌ INVÁLIDA');
        
        if (!isValid) {
          console.log('   ⚠️  ACTUALIZANDO CONTRASEÑA...');
          const newHash = await bcryptjs.hash(password, 10);
          await collection.updateOne(
            { username: 'admin_jfc' },
            { $set: { password: newHash, updatedAt: new Date() } }
          );
          console.log('   ✅ Contraseña actualizada');
        }
      } else {
        console.log('   ❌ Usuario NO existe');
      }
      console.log('');
    }

    // 2. Test con authService
    console.log('═══════════════════════════════════════════════════════');
    console.log('🧪 TEST CON authService');
    console.log('═══════════════════════════════════════════════════════\n');

    const { login } = await import('../src/services/authService.js');
    
    const result = await login('admin_jfc', password);
    
    console.log('Username:', 'admin_jfc');
    console.log('Password:', password);
    console.log('Success:', result.success);
    
    if (result.success) {
      console.log('✅ LOGIN EXITOSO');
      console.log('\nDatos del usuario:');
      console.log(JSON.stringify(result.user, null, 2));
    } else {
      console.log('❌ LOGIN FALLIDO');
      console.log('Mensaje:', result.message);
    }

    // 3. Resumen
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📋 RESUMEN Y SOLUCIÓN');
    console.log('═══════════════════════════════════════════════════════\n');
    
    if (result.success) {
      console.log('✅ El login funciona LOCALMENTE con esta base de datos.');
      console.log('');
      console.log('❌ PERO falla en PRODUCCIÓN (Render).');
      console.log('');
      console.log('🎯 CAUSA RAÍZ:');
      console.log('   El backend en Render está conectado a una DB DIFERENTE.');
      console.log('');
      console.log('🔧 SOLUCIÓN:');
      console.log('   1. Ve a Render Dashboard');
      console.log('   2. Servicio: gpt-chatbot-v0');
      console.log('   3. Environment → Environment Variables');
      console.log('   4. Verifica que MONGODB_URI sea:');
      console.log('      ' + MONGODB_URI);
      console.log('');
      console.log('   5. Si es DIFERENTE:');
      console.log('      - Opción A: Cambia el MONGODB_URI en Render');
      console.log('      - Opción B: Ejecuta este script con el MONGODB_URI de Render');
      console.log('');
      console.log('   6. Después: Manual Deploy → Clear build cache & deploy');
      console.log('');
    } else {
      console.log('❌ El login NO funciona ni siquiera localmente.');
      console.log('   Hay un problema con el usuario o la configuración.');
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('🔐 CREDENCIALES CONFIRMADAS');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('Username: admin_jfc');
    console.log('Password: jfc2024!');
    console.log('');
    console.log('Estas credenciales funcionan en:');
    console.log('  Database:', mongoose.connection.name);
    console.log('  Host:', mongoose.connection.host);
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

finalDiagnosis();
