import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const CARRITO_ID = '697218706707514cc5d3b213'; // Del log del webhook

async function verificarCarritoEnBD() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const carritosCollection = db.collection('carritos');
    
    console.log('\n🔍 VERIFICANDO CARRITO EN BD\n');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Buscar por _id
    console.log(`Buscando carrito con _id: ${CARRITO_ID}`);
    const carritoPorId = await carritosCollection.findOne({ 
      _id: new ObjectId(CARRITO_ID) 
    });
    
    if (carritoPorId) {
      console.log('\n✅ CARRITO ENCONTRADO POR _ID:');
      console.log(JSON.stringify(carritoPorId, null, 2));
    } else {
      console.log('\n❌ CARRITO NO ENCONTRADO POR _ID');
    }
    
    // Buscar todos los carritos recientes (últimas 24 horas)
    const hace24Horas = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const carritosRecientes = await carritosCollection.find({
      createdAt: { $gte: hace24Horas }
    }).sort({ createdAt: -1 }).limit(10).toArray();
    
    console.log(`\n📋 CARRITOS RECIENTES (últimas 24 horas): ${carritosRecientes.length}`);
    
    carritosRecientes.forEach((c, i) => {
      console.log(`\n${i + 1}. Carrito ${c._id}`);
      console.log(`   Estado: ${c.estado}`);
      console.log(`   Teléfono: ${c.telefono || 'sin teléfono'}`);
      console.log(`   Items: ${c.items?.length || 0}`);
      console.log(`   Total: $${c.total || 0}`);
      console.log(`   Creado: ${c.createdAt}`);
      console.log(`   EmpresaId: ${c.empresaId || 'sin empresa'}`);
    });
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🔍 DIAGNÓSTICO');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    if (!carritoPorId && carritosRecientes.length === 0) {
      console.log('❌ PROBLEMA: No hay carritos en la BD');
      console.log('   Esto significa que el carrito NO se está guardando cuando se genera el link de pago');
      console.log('\n💡 SOLUCIÓN:');
      console.log('   Verificar que CarritoService.agregarProducto() esté guardando correctamente en MongoDB');
    } else if (!carritoPorId && carritosRecientes.length > 0) {
      console.log('⚠️  PROBLEMA: El carrito específico no existe, pero hay otros carritos');
      console.log('   Esto puede significar:');
      console.log('   1. El carrito se creó con otro _id');
      console.log('   2. El external_reference no coincide con el _id del carrito');
      console.log('   3. El carrito se eliminó antes de que llegara el webhook');
    } else {
      console.log('✅ El carrito existe en la BD');
      console.log('   El problema debe estar en otra parte del flujo');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verificarCarritoEnBD();
