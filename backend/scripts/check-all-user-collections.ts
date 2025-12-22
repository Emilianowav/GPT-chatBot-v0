/**
 * Revisa TODAS las colecciones de usuarios para encontrar la correcta
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

async function checkAllUserCollections() {
  try {
    console.log('🔍 REVISANDO TODAS LAS COLECCIONES DE USUARIOS\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB:', mongoose.connection.name);
    console.log('');

    const db = mongoose.connection.db;
    if (!db) throw new Error('No se pudo obtener la base de datos');

    // Colecciones relacionadas con usuarios
    const userCollections = [
      'admin_users',
      'adminusers', 
      'usuarios',
      'usuarios_empresa',
      'usuarioempresas'
    ];

    for (const collectionName of userCollections) {
      console.log('═══════════════════════════════════════════════════════');
      console.log(`📋 COLECCIÓN: ${collectionName}`);
      console.log('═══════════════════════════════════════════════════════\n');

      const collection = db.collection(collectionName);
      const count = await collection.countDocuments();
      
      console.log(`Total de documentos: ${count}\n`);

      if (count > 0) {
        const allDocs = await collection.find({}).limit(10).toArray();
        
        allDocs.forEach((doc: any, index: number) => {
          console.log(`${index + 1}. ${doc.username || doc.nombre || doc._id}`);
          console.log('   Campos:', Object.keys(doc).filter(k => k !== '_id').join(', '));
          
          // Mostrar campos relevantes
          if (doc.username) console.log('   username:', doc.username);
          if (doc.empresaId) console.log('   empresaId:', doc.empresaId);
          if (doc.empresa) console.log('   empresa:', doc.empresa);
          if (doc.rol) console.log('   rol:', doc.rol);
          if (doc.role) console.log('   role:', doc.role);
          if (doc.email) console.log('   email:', doc.email);
          if (doc.activo !== undefined) console.log('   activo:', doc.activo);
          if (doc.password) console.log('   password:', doc.password ? 'Existe (hash)' : 'NO');
          console.log('');
        });

        // Buscar específicamente usuarios de empresas que funcionan
        console.log('🔍 Buscando usuarios de empresas conocidas...\n');
        
        const veoveoUser = await collection.findOne({ 
          $or: [
            { username: { $regex: /veoveo/i } },
            { empresaId: { $regex: /veo/i } },
            { empresa: { $regex: /veo/i } }
          ]
        });

        if (veoveoUser) {
          console.log('✅ Usuario de Veo Veo encontrado:');
          console.log('   Estructura completa:', JSON.stringify(veoveoUser, null, 2));
          console.log('');
        }

        const momentoUser = await collection.findOne({ 
          $or: [
            { empresaId: { $regex: /momento/i } },
            { empresa: { $regex: /momento/i } }
          ]
        });

        if (momentoUser) {
          console.log('✅ Usuario de Momento encontrado:');
          console.log('   Estructura completa:', JSON.stringify(momentoUser, null, 2));
          console.log('');
        }
      } else {
        console.log('⚠️  Colección vacía\n');
      }
    }

    // Buscar en TODAS las colecciones cualquier documento con username
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔍 BUSCANDO USUARIOS EN TODAS LAS COLECCIONES');
    console.log('═══════════════════════════════════════════════════════\n');

    const allCollections = await db.listCollections().toArray();
    
    for (const col of allCollections) {
      const collection = db.collection(col.name);
      const userDoc = await collection.findOne({ username: { $exists: true } });
      
      if (userDoc) {
        console.log(`✅ Colección "${col.name}" tiene documentos con username`);
        console.log('   Ejemplo:', JSON.stringify(userDoc, null, 2).substring(0, 200) + '...');
        console.log('');
      }
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('📋 RESUMEN');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('Revisa cuál colección tiene la estructura correcta');
    console.log('y usuarios que funcionan (como Veo Veo).');
    console.log('Esa es la colección donde debe crearse admin_jfc.');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

checkAllUserCollections();
