import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function listarColecciones() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB Atlas (PRODUCCIÓN)\n');
    
    const db = client.db('neural_chatbot');
    
    // Listar todas las colecciones
    const collections = await db.listCollections().toArray();
    
    console.log('═'.repeat(80));
    console.log('TODAS LAS COLECCIONES EN LA BD');
    console.log('═'.repeat(80));
    console.log(`Total: ${collections.length}\n`);
    
    for (const col of collections) {
      const collection = db.collection(col.name);
      const count = await collection.countDocuments();
      console.log(`📁 ${col.name} (${count} documentos)`);
      
      // Si tiene documentos, mostrar uno de ejemplo
      if (count > 0) {
        const sample = await collection.findOne();
        const keys = Object.keys(sample);
        console.log(`   Campos: ${keys.slice(0, 10).join(', ')}${keys.length > 10 ? '...' : ''}`);
      }
    }
    
    // Buscar específicamente colecciones relacionadas con pagos
    console.log('\n' + '═'.repeat(80));
    console.log('BUSCANDO DATOS DE PAGOS EN TODAS LAS COLECCIONES');
    console.log('═'.repeat(80));
    
    for (const col of collections) {
      const collection = db.collection(col.name);
      
      // Buscar documentos que tengan campos relacionados con pagos
      const withPayment = await collection.findOne({
        $or: [
          { mpPaymentId: { $exists: true } },
          { paymentId: { $exists: true } },
          { payment_id: { $exists: true } },
          { status: 'approved' },
          { pagado: true }
        ]
      });
      
      if (withPayment) {
        console.log(`\n✅ ${col.name} tiene datos de pagos:`);
        console.log(JSON.stringify(withPayment, null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

listarColecciones();
