/**
 * Buscar Seller de Veo Veo por diferentes criterios
 */
import mongoose from 'mongoose';

const uri = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority';

async function buscar() {
  try {
    await mongoose.connect(uri);
    console.log('✅ Conectado a DB:', mongoose.connection.db?.databaseName);
    
    console.log('\n🔍 BUSCANDO SELLERS...\n');
    
    // Buscar todos los sellers
    const sellers = await mongoose.connection.collection('sellers').find({}).toArray();
    
    console.log(`Total de sellers: ${sellers.length}\n`);
    
    sellers.forEach((seller: any, index: number) => {
      console.log(`Seller ${index + 1}:`);
      console.log('  userId:', seller.userId);
      console.log('  internalId:', seller.internalId);
      console.log('  email:', seller.email || 'N/A');
      console.log('  accessToken:', seller.accessToken ? '✅ Configurado' : '❌ NO');
      console.log('  createdAt:', seller.createdAt);
      console.log('');
    });
    
    // Buscar el que tiene userId 182716364 (del log)
    console.log('\n🎯 BUSCANDO SELLER CON userId: 182716364\n');
    const sellerVeoVeo = await mongoose.connection.collection('sellers').findOne({ 
      userId: '182716364' 
    });
    
    if (sellerVeoVeo) {
      console.log('✅ ENCONTRADO:');
      console.log('  userId:', sellerVeoVeo.userId);
      console.log('  internalId:', sellerVeoVeo.internalId);
      console.log('  email:', sellerVeoVeo.email);
      console.log('  accessToken:', sellerVeoVeo.accessToken ? 'Configurado' : 'NO');
      
      // Buscar empresa asociada
      console.log('\n🏢 BUSCANDO EMPRESA ASOCIADA...\n');
      
      const empresa = await mongoose.connection.collection('empresas').findOne({
        nombre: sellerVeoVeo.internalId
      });
      
      if (empresa) {
        console.log('✅ Empresa encontrada por nombre:');
        console.log('  ID:', empresa._id);
        console.log('  Nombre:', empresa.nombre);
        console.log('  Teléfono:', empresa.telefono);
        console.log('  PhoneNumberId:', empresa.phoneNumberId || '❌ NO CONFIGURADO');
      } else {
        console.log('⚠️ No se encontró empresa con nombre:', sellerVeoVeo.internalId);
        
        // Buscar por ObjectId
        const empresaPorId = await mongoose.connection.collection('empresas').findOne({
          _id: new mongoose.Types.ObjectId(sellerVeoVeo.internalId)
        });
        
        if (empresaPorId) {
          console.log('✅ Empresa encontrada por ID:');
          console.log('  ID:', empresaPorId._id);
          console.log('  Nombre:', empresaPorId.nombre);
          console.log('  Teléfono:', empresaPorId.telefono);
          console.log('  PhoneNumberId:', empresaPorId.phoneNumberId || '❌ NO CONFIGURADO');
        }
      }
    } else {
      console.log('❌ No se encontró seller con userId: 182716364');
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

buscar();
