import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function verCarritos() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_db';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');
    
    const db = mongoose.connection.db;
    const carritosCollection = db.collection('carritos');
    
    // Contar total
    const total = await carritosCollection.countDocuments();
    console.log(`\n📊 Total de carritos: ${total}\n`);
    
    // Ver últimos 10 carritos
    const carritos = await carritosCollection
      .find()
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();
    
    console.log('📋 Últimos 10 carritos:\n');
    
    carritos.forEach((carrito, index) => {
      console.log(`${index + 1}. Carrito ID: ${carrito._id}`);
      console.log(`   Teléfono: ${carrito.telefono}`);
      console.log(`   EmpresaId: ${carrito.empresaId}`);
      console.log(`   Estado: ${carrito.estado}`);
      console.log(`   Items: ${carrito.items?.length || 0}`);
      if (carrito.items && carrito.items.length > 0) {
        carrito.items.forEach(item => {
          console.log(`      - ${item.nombre} x${item.cantidad} = $${item.precio}`);
        });
      }
      console.log(`   Total: $${carrito.total}`);
      console.log(`   Creado: ${new Date(carrito.createdAt).toLocaleString()}`);
      console.log('');
    });
    
    // Ver carritos por teléfono específico (opcional)
    const telefono = '5493794789169'; // Ignacio
    const carritosIgnacio = await carritosCollection
      .find({ telefono })
      .sort({ createdAt: -1 })
      .toArray();
    
    console.log(`\n🔍 Carritos de ${telefono}: ${carritosIgnacio.length}`);
    if (carritosIgnacio.length > 0) {
      console.log('\nDetalle:');
      carritosIgnacio.forEach((c, i) => {
        console.log(`${i + 1}. ${c._id} - ${c.estado} - ${c.items?.length || 0} items - $${c.total}`);
      });
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verCarritos();
