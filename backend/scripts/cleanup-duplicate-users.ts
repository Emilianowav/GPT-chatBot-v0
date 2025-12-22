/**
 * Limpiar usuarios duplicados de admin_jfc
 * Hay múltiples usuarios con el mismo username
 */

import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

async function cleanupDuplicateUsers() {
  try {
    console.log('🧹 LIMPIANDO USUARIOS DUPLICADOS\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB:', mongoose.connection.name);
    console.log('');

    const db = mongoose.connection.db;
    if (!db) throw new Error('No se pudo obtener la base de datos');

    const collections = ['admin_users', 'usuarios_empresa'];
    
    for (const collectionName of collections) {
      console.log(`═══════════════════════════════════════════════════════`);
      console.log(`📋 COLECCIÓN: ${collectionName}`);
      console.log(`═══════════════════════════════════════════════════════\n`);
      
      const collection = db.collection(collectionName);
      
      // Buscar TODOS los usuarios admin_jfc
      const users = await collection.find({ username: 'admin_jfc' }).toArray();
      
      console.log(`Usuarios encontrados: ${users.length}\n`);
      
      if (users.length === 0) {
        console.log('⚠️  No hay usuarios admin_jfc en esta colección\n');
        continue;
      }

      // Mostrar todos
      users.forEach((user: any, index: number) => {
        console.log(`Usuario ${index + 1}:`);
        console.log('  ID:', user._id);
        console.log('  Username:', user.username);
        console.log('  Password:', user.password);
        console.log('  EmpresaId:', user.empresaId);
        console.log('  Activo:', user.activo);
        console.log('  CreatedAt:', user.createdAt);
        console.log('  UpdatedAt:', user.updatedAt);
        console.log('');
      });

      if (users.length > 1) {
        console.log('⚠️  HAY DUPLICADOS - Eliminando usuarios viejos...\n');
        
        // Ordenar por updatedAt (el más reciente primero)
        const sortedUsers = users.sort((a: any, b: any) => {
          const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return dateB - dateA;
        });

        const keepUser = sortedUsers[0];
        const deleteUsers = sortedUsers.slice(1);

        console.log('✅ MANTENER este usuario:');
        console.log('  ID:', keepUser._id);
        console.log('  Password:', keepUser.password);
        console.log('  UpdatedAt:', keepUser.updatedAt);
        console.log('');

        console.log('❌ ELIMINAR estos usuarios:');
        for (const user of deleteUsers) {
          console.log('  ID:', user._id);
          console.log('  Password:', user.password);
          console.log('  UpdatedAt:', user.updatedAt);
          
          // Eliminar
          await collection.deleteOne({ _id: user._id });
          console.log('  ✅ Eliminado');
          console.log('');
        }

        // Verificar que el usuario que queda tiene hash bcrypt válido
        console.log('🔍 Verificando usuario final...');
        const finalUser = await collection.findOne({ username: 'admin_jfc' });
        
        if (finalUser) {
          console.log('  Password:', finalUser.password);
          console.log('  Es hash bcrypt:', finalUser.password?.startsWith('$2b$') ? '✅ SÍ' : '❌ NO');
          
          if (!finalUser.password?.startsWith('$2b$')) {
            console.log('  ⚠️  NO es hash bcrypt válido - Actualizando...');
            
            const newHash = await bcryptjs.hash('jfc2024!', 10);
            await collection.updateOne(
              { _id: finalUser._id },
              { $set: { password: newHash, updatedAt: new Date() } }
            );
            
            console.log('  ✅ Password actualizado a hash bcrypt válido');
          }
        }
        console.log('');
      } else {
        console.log('✅ Solo hay 1 usuario - No hay duplicados\n');
        
        // Verificar que tiene hash válido
        const user = users[0];
        console.log('🔍 Verificando password...');
        console.log('  Password:', user.password);
        console.log('  Es hash bcrypt:', user.password?.startsWith('$2b$') ? '✅ SÍ' : '❌ NO');
        
        if (!user.password?.startsWith('$2b$')) {
          console.log('  ⚠️  NO es hash bcrypt válido - Actualizando...');
          
          const newHash = await bcryptjs.hash('jfc2024!', 10);
          await collection.updateOne(
            { _id: user._id },
            { $set: { password: newHash, updatedAt: new Date() } }
          );
          
          console.log('  ✅ Password actualizado a hash bcrypt válido');
        }
        console.log('');
      }
    }

    // Test de login
    console.log('═══════════════════════════════════════════════════════');
    console.log('🧪 TEST DE LOGIN');
    console.log('═══════════════════════════════════════════════════════\n');

    await mongoose.disconnect();
    await mongoose.connect(MONGODB_URI);
    
    const { login } = await import('../src/services/authService.js');
    
    console.log('Probando login con admin_jfc / jfc2024!...\n');
    const result = await login('admin_jfc', 'jfc2024!');
    
    console.log('Resultado:');
    console.log('  Success:', result.success);
    
    if (result.success) {
      console.log('  ✅ LOGIN EXITOSO');
      console.log('  User:', result.user?.username);
      console.log('  Empresa:', result.user?.empresaNombre);
    } else {
      console.log('  ❌ LOGIN FALLIDO');
      console.log('  Mensaje:', result.message);
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ LIMPIEZA COMPLETADA');
    console.log('═══════════════════════════════════════════════════════\n');
    
    if (result.success) {
      console.log('🎉 ÉXITO - Ahora solo hay 1 usuario admin_jfc con password correcto\n');
      console.log('⚠️  REINICIA EL BACKEND:');
      console.log('   1. Ctrl+C');
      console.log('   2. npm run dev');
      console.log('   3. Prueba login en http://localhost:3001');
    }
    
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

cleanupDuplicateUsers();
