/**
 * Verifica qué base de datos está usando el backend en producción
 * y lista todos los usuarios
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

async function checkProductionDB() {
  try {
    console.log('🔍 VERIFICANDO BASE DE DATOS DE PRODUCCIÓN\n');
    console.log('MONGODB_URI:', MONGODB_URI.substring(0, 50) + '...\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
    console.log('   Database:', mongoose.connection.name);
    console.log('   Host:', mongoose.connection.host);
    console.log('');

    const db = mongoose.connection.db;
    if (!db) throw new Error('No se pudo obtener la base de datos');

    // Listar todas las colecciones
    console.log('═══════════════════════════════════════════════════════');
    console.log('📋 COLECCIONES EN LA BASE DE DATOS');
    console.log('═══════════════════════════════════════════════════════\n');

    const collections = await db.listCollections().toArray();
    console.log(`Total de colecciones: ${collections.length}\n`);
    collections.forEach((col: any, index: number) => {
      console.log(`${index + 1}. ${col.name}`);
    });

    // Listar TODOS los usuarios en admin_users
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📋 TODOS LOS USUARIOS EN admin_users');
    console.log('═══════════════════════════════════════════════════════\n');

    const adminUsersCollection = db.collection('admin_users');
    const allUsers = await adminUsersCollection.find({}).toArray();

    console.log(`Total de usuarios: ${allUsers.length}\n`);
    
    if (allUsers.length === 0) {
      console.log('⚠️  NO HAY USUARIOS EN LA COLECCIÓN admin_users');
      console.log('   Esto significa que el backend en producción está usando');
      console.log('   una base de datos DIFERENTE o la colección está vacía.\n');
    } else {
      allUsers.forEach((user: any, index: number) => {
        console.log(`${index + 1}. Username: ${user.username}`);
        console.log(`   EmpresaId: ${user.empresaId}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Email: ${user.email || 'N/A'}`);
        console.log(`   Activo: ${user.activo}`);
        console.log('');
      });
    }

    // Buscar específicamente admin_jfc
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔍 BUSCANDO admin_jfc');
    console.log('═══════════════════════════════════════════════════════\n');

    const jfcUser = await adminUsersCollection.findOne({ username: 'admin_jfc' });
    
    if (jfcUser) {
      console.log('✅ Usuario admin_jfc ENCONTRADO');
      console.log('   Username:', jfcUser.username);
      console.log('   EmpresaId:', jfcUser.empresaId);
      console.log('   Activo:', jfcUser.activo);
    } else {
      console.log('❌ Usuario admin_jfc NO ENCONTRADO');
      console.log('\n⚠️  PROBLEMA IDENTIFICADO:');
      console.log('   El backend en producción está conectado a esta DB,');
      console.log('   pero el usuario admin_jfc NO existe aquí.');
      console.log('\n   SOLUCIÓN:');
      console.log('   1. Verifica que el MONGODB_URI en Render sea el correcto');
      console.log('   2. O ejecuta el script de setup apuntando a la DB correcta');
    }

    // Listar empresas
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📋 EMPRESAS EN LA BASE DE DATOS');
    console.log('═══════════════════════════════════════════════════════\n');

    const empresasCollection = db.collection('empresas');
    const empresas = await empresasCollection.find({}).toArray();

    console.log(`Total de empresas: ${empresas.length}\n`);
    empresas.forEach((empresa: any, index: number) => {
      console.log(`${index + 1}. ${empresa.nombre}`);
      console.log(`   _id: ${empresa._id}`);
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════');
    console.log('📋 RESUMEN');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('Database:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);
    console.log('Total usuarios:', allUsers.length);
    console.log('admin_jfc existe:', jfcUser ? 'SÍ' : 'NO');
    console.log('Total empresas:', empresas.length);
    console.log('\n⚠️  Si admin_jfc NO existe, el backend en producción');
    console.log('   probablemente está usando una DB diferente.');
    console.log('   Verifica las variables de entorno en Render.');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

checkProductionDB();
