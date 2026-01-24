import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function limpiarIgnacio() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_db';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');
    
    const telefono = '5493794789169'; // Ignacio
    
    const db = mongoose.connection.db;
    
    // Limpiar contacto
    const contactosCollection = db.collection('contactoempresas');
    const resultado = await contactosCollection.updateOne(
      { telefono },
      { 
        $set: { 
          workflowState: {
            currentStep: 0,
            globalVariables: {},
            nodeOutputs: {}
          }
        }
      }
    );
    
    console.log(`✅ Contacto limpiado: ${resultado.modifiedCount} documento(s)`);
    
    // Limpiar carrito
    const carritosCollection = db.collection('carritos');
    const carritoResult = await carritosCollection.deleteMany({ telefono });
    console.log(`✅ Carritos eliminados: ${carritoResult.deletedCount}`);
    
    await mongoose.disconnect();
    console.log('✅ Desconectado de MongoDB');
    console.log('\n🧹 Estado de Ignacio limpiado. Listo para probar flujo completo.');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

limpiarIgnacio();
