// 📋 Buscar en todas las bases de datos
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function buscar() {
  try {
    // Conectar sin especificar base de datos
    const uri = process.env.MONGODB_URI || '';
    await mongoose.connect(uri);
    
    console.log('✅ Conectado');

    const adminDb = mongoose.connection.db?.admin();
    const dbs = await adminDb?.listDatabases();
    
    console.log('\n📊 Bases de datos encontradas:');
    dbs?.databases.forEach((db: any) => {
      console.log(`  - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });

    // Buscar en cada base de datos
    console.log('\n🔍 Buscando configuracion_modulos en cada base...');
    
    for (const dbInfo of dbs?.databases || []) {
      const db = (mongoose.connection as any).client.db(dbInfo.name);
      const collections = await db.listCollections().toArray();
      
      const hasConfig = collections.find(c => c.name === 'configuracion_modulos');
      
      if (hasConfig) {
        console.log(`\n✅ Encontrada en: ${dbInfo.name}`);
        
        const collection = db.collection('configuracion_modulos');
        const count = await collection.countDocuments();
        console.log(`   Documentos: ${count}`);
        
        if (count > 0) {
          const docs = await collection.find({}).project({ _id: 1, empresaId: 1 }).toArray();
          docs.forEach(doc => {
            console.log(`   - ${doc.empresaId} (${doc._id})`);
          });
        }
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

buscar();
