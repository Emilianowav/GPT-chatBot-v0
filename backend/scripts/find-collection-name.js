// 🔍 Buscar nombre de colección correcto
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function findCollectionName() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    // Listar todas las colecciones
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    console.log('📋 Colecciones en la base de datos:');
    collections.forEach(col => {
      console.log(`  - ${col.name}`);
    });
    
    // Buscar colecciones que puedan contener configuración
    console.log('\n🔍 Buscando colecciones de configuración...');
    const configCollections = collections.filter(col => 
      col.name.toLowerCase().includes('config') || 
      col.name.toLowerCase().includes('modulo')
    );
    
    if (configCollections.length > 0) {
      console.log('\n📦 Colecciones de configuración encontradas:');
      for (const col of configCollections) {
        console.log(`\n  📁 ${col.name}`);
        const collection = mongoose.connection.db.collection(col.name);
        const count = await collection.countDocuments();
        console.log(`     Documentos: ${count}`);
        
        if (count > 0) {
          const sample = await collection.findOne();
          console.log(`     Campos: ${Object.keys(sample).join(', ')}`);
          if (sample.empresaId) {
            console.log(`     empresaId ejemplo: ${sample.empresaId}`);
          }
        }
      }
    }
    
    // Buscar específicamente por empresaId San Jose
    console.log('\n🔍 Buscando documentos con empresaId "San Jose"...');
    for (const col of collections) {
      const collection = mongoose.connection.db.collection(col.name);
      const doc = await collection.findOne({ empresaId: 'San Jose' });
      if (doc) {
        console.log(`\n✅ Encontrado en colección: ${col.name}`);
        console.log(`   Campos principales: ${Object.keys(doc).slice(0, 10).join(', ')}`);
        if (doc.plantillasMeta) {
          console.log(`   Tiene plantillasMeta: ✅`);
          if (doc.plantillasMeta.notificacionDiariaAgentes) {
            console.log(`   Tiene notificacionDiariaAgentes: ✅`);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

findCollectionName();
