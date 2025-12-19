/**
 * Buscar TODO relacionado con Veo Veo en todas las colecciones
 */
import mongoose from 'mongoose';

const uri = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority';

async function buscarTodo() {
  try {
    await mongoose.connect(uri);
    console.log('✅ Conectado a DB:', mongoose.connection.db?.databaseName);
    
    const db = mongoose.connection.db;
    if (!db) {
      console.error('❌ No se pudo obtener la base de datos');
      return;
    }
    
    console.log('\n🔍 BUSCANDO EN TODAS LAS COLECCIONES...\n');
    
    // Listar todas las colecciones
    const collections = await db.listCollections().toArray();
    console.log(`Total de colecciones: ${collections.length}\n`);
    
    // Buscar en cada colección
    for (const collInfo of collections) {
      const collName = collInfo.name;
      
      try {
        // Buscar por nombre "Veo Veo"
        const resultsByName = await db.collection(collName).find({
          $or: [
            { nombre: 'Veo Veo' },
            { empresaId: 'Veo Veo' },
            { internalId: 'Veo Veo' }
          ]
        }).limit(5).toArray();
        
        if (resultsByName.length > 0) {
          console.log(`📁 ${collName} (por nombre):`);
          resultsByName.forEach((doc: any) => {
            console.log('  -', JSON.stringify(doc, null, 2).substring(0, 200) + '...');
          });
          console.log('');
        }
        
        // Buscar por ObjectId
        const empresaId = '6940a9a181b92bfce970fdb5';
        const resultsByObjectId = await db.collection(collName).find({
          $or: [
            { empresaId: empresaId },
            { internalId: empresaId },
            { _id: new mongoose.Types.ObjectId(empresaId) }
          ]
        }).limit(5).toArray();
        
        if (resultsByObjectId.length > 0 && collName !== 'empresas') {
          console.log(`📁 ${collName} (por ObjectId):`);
          resultsByObjectId.forEach((doc: any) => {
            console.log('  -', JSON.stringify(doc, null, 2).substring(0, 200) + '...');
          });
          console.log('');
        }
        
        // Buscar por userId de MP
        if (collName.toLowerCase().includes('seller') || collName.toLowerCase().includes('payment')) {
          const resultsByUserId = await db.collection(collName).find({
            $or: [
              { userId: '182716364' },
              { sellerId: '182716364' }
            ]
          }).limit(5).toArray();
          
          if (resultsByUserId.length > 0) {
            console.log(`📁 ${collName} (por MP userId):`);
            resultsByUserId.forEach((doc: any) => {
              console.log('  -', JSON.stringify(doc, null, 2).substring(0, 200) + '...');
            });
            console.log('');
          }
        }
        
      } catch (err) {
        // Ignorar errores de colecciones que no se pueden consultar
      }
    }
    
    // Buscar específicamente la empresa
    console.log('\n🏢 EMPRESA VEO VEO:');
    console.log('─────────────────────────────────────');
    const empresa = await db.collection('empresas').findOne({ nombre: 'Veo Veo' });
    if (empresa) {
      console.log(JSON.stringify(empresa, null, 2));
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

buscarTodo();
