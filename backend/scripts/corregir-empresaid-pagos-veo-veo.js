import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function corregirEmpresaIdPagos() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_db';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');
    
    const db = mongoose.connection.db;
    const paymentsCollection = db.collection('mppayments');
    
    // ObjectId correcto de Veo Veo
    const veoVeoObjectId = '6940a9a181b92bfce970fdb5';
    
    // Buscar pagos con empresaId como teléfono (con o sin +)
    const pagosConTelefono = await paymentsCollection.find({
      $or: [
        { empresaId: '5493794057297' },
        { empresaId: '+5493794057297' }
      ]
    }).toArray();
    
    console.log(`\n📊 Pagos con empresaId como teléfono: ${pagosConTelefono.length}\n`);
    
    if (pagosConTelefono.length > 0) {
      // Actualizar todos los pagos con el ObjectId correcto
      const resultado = await paymentsCollection.updateMany(
        {
          $or: [
            { empresaId: '5493794057297' },
            { empresaId: '+5493794057297' }
          ]
        },
        {
          $set: { empresaId: veoVeoObjectId }
        }
      );
      
      console.log(`✅ Pagos actualizados: ${resultado.modifiedCount}`);
      
      // Verificar
      const pagosActualizados = await paymentsCollection.find({
        empresaId: veoVeoObjectId
      }).toArray();
      
      console.log(`\n📊 Total de pagos con empresaId correcto: ${pagosActualizados.length}`);
      console.log('\n📋 Últimos 5 pagos:');
      pagosActualizados.slice(-5).forEach(pago => {
        console.log(`   - ${pago.mpPaymentId} - $${pago.amount} - ${new Date(pago.createdAt).toLocaleString()}`);
      });
    } else {
      console.log('✅ No hay pagos para actualizar');
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

corregirEmpresaIdPagos();
