import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function actualizarEmpresaIdPagos() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_db';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');
    
    const db = mongoose.connection.db;
    const paymentsCollection = db.collection('mppayments');
    const carritosCollection = db.collection('carritos');
    
    // Buscar pagos sin empresaId o con empresaId undefined
    const pagosSinEmpresa = await paymentsCollection.find({
      $or: [
        { empresaId: { $exists: false } },
        { empresaId: null },
        { empresaId: undefined }
      ]
    }).toArray();
    
    console.log(`\n📊 Pagos sin empresaId: ${pagosSinEmpresa.length}\n`);
    
    let actualizados = 0;
    let noEncontrados = 0;
    
    for (const pago of pagosSinEmpresa) {
      console.log(`\n🔍 Procesando pago ${pago.mpPaymentId}...`);
      console.log(`   External Reference: ${pago.externalReference}`);
      
      if (!pago.externalReference) {
        console.log('   ⚠️ No tiene externalReference, saltando...');
        noEncontrados++;
        continue;
      }
      
      // Buscar el carrito asociado
      try {
        const carritoId = new mongoose.Types.ObjectId(pago.externalReference);
        const carrito = await carritosCollection.findOne({ _id: carritoId });
        
        if (carrito && carrito.empresaId) {
          console.log(`   ✅ Carrito encontrado - EmpresaId: ${carrito.empresaId}`);
          
          // Actualizar el pago con el empresaId del carrito
          await paymentsCollection.updateOne(
            { _id: pago._id },
            { $set: { empresaId: carrito.empresaId } }
          );
          
          console.log(`   ✅ Pago actualizado con empresaId: ${carrito.empresaId}`);
          actualizados++;
        } else {
          console.log('   ⚠️ Carrito no encontrado o sin empresaId');
          noEncontrados++;
        }
      } catch (err) {
        console.log(`   ❌ Error procesando: ${err.message}`);
        noEncontrados++;
      }
    }
    
    console.log(`\n📊 RESUMEN:`);
    console.log(`   ✅ Pagos actualizados: ${actualizados}`);
    console.log(`   ⚠️ Pagos sin actualizar: ${noEncontrados}`);
    
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

actualizarEmpresaIdPagos();
