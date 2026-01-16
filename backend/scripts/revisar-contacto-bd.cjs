/**
 * Script para revisar cómo está almacenado el contacto en la BD
 */

const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const TELEFONO = '5493794946066';

async function revisarContacto() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    
    console.log('═'.repeat(80));
    console.log(`🔍 BUSCANDO CONTACTO CON TELÉFONO: ${TELEFONO}`);
    console.log('═'.repeat(80));
    
    // Buscar en contactos_empresas
    const contactos = await db.collection('contactos_empresas').find({
      telefono: TELEFONO
    }).toArray();
    
    console.log(`\n📊 Contactos encontrados: ${contactos.length}\n`);
    
    if (contactos.length === 0) {
      console.log('❌ No se encontró ningún contacto con ese teléfono');
      
      // Buscar variaciones del teléfono
      console.log('\n🔍 Buscando variaciones del teléfono...');
      const variaciones = await db.collection('contactos_empresas').find({
        telefono: { $regex: '946066' }
      }).toArray();
      
      console.log(`📊 Variaciones encontradas: ${variaciones.length}\n`);
      
      variaciones.forEach((contacto, index) => {
        console.log(`\n--- CONTACTO ${index + 1} ---`);
        console.log(`_id: ${contacto._id}`);
        console.log(`telefono: ${contacto.telefono}`);
        console.log(`empresaId: ${contacto.empresaId}`);
        console.log(`empresaId type: ${typeof contacto.empresaId}`);
        console.log(`nombre: ${contacto.nombre || 'N/A'}`);
      });
    } else {
      contactos.forEach((contacto, index) => {
        console.log(`\n--- CONTACTO ${index + 1} ---`);
        console.log(`_id: ${contacto._id}`);
        console.log(`telefono: ${contacto.telefono}`);
        console.log(`empresaId: ${contacto.empresaId}`);
        console.log(`empresaId type: ${typeof contacto.empresaId}`);
        console.log(`empresaId constructor: ${contacto.empresaId?.constructor?.name}`);
        console.log(`nombre: ${contacto.nombre || 'N/A'}`);
        console.log(`email: ${contacto.email || 'N/A'}`);
        console.log(`workflowState exists: ${!!contacto.workflowState}`);
        if (contacto.workflowState) {
          console.log(`workflowState.globalVariables exists: ${!!contacto.workflowState.globalVariables}`);
        }
      });
    }
    
    // Buscar la empresa Veo Veo
    console.log('\n\n═'.repeat(80));
    console.log('🏢 BUSCANDO EMPRESA VEO VEO');
    console.log('═'.repeat(80));
    
    const empresa = await db.collection('empresas').findOne({ nombre: 'Veo Veo' });
    
    if (empresa) {
      console.log(`\n✅ Empresa encontrada:`);
      console.log(`_id: ${empresa._id}`);
      console.log(`_id type: ${typeof empresa._id}`);
      console.log(`_id constructor: ${empresa._id?.constructor?.name}`);
      console.log(`nombre: ${empresa.nombre}`);
      console.log(`phoneNumberId: ${empresa.phoneNumberId}`);
    } else {
      console.log('\n❌ No se encontró la empresa Veo Veo');
    }
    
    // Buscar carrito reciente
    console.log('\n\n═'.repeat(80));
    console.log('🛒 BUSCANDO CARRITOS RECIENTES');
    console.log('═'.repeat(80));
    
    const carritos = await db.collection('carritos').find({
      telefono: TELEFONO
    }).sort({ fechaCreacion: -1 }).limit(3).toArray();
    
    console.log(`\n📊 Carritos encontrados: ${carritos.length}\n`);
    
    carritos.forEach((carrito, index) => {
      console.log(`\n--- CARRITO ${index + 1} ---`);
      console.log(`_id: ${carrito._id}`);
      console.log(`telefono: ${carrito.telefono}`);
      console.log(`empresaId: ${carrito.empresaId}`);
      console.log(`empresaId type: ${typeof carrito.empresaId}`);
      console.log(`estado: ${carrito.estado}`);
      console.log(`total: $${carrito.total}`);
      console.log(`items: ${carrito.items?.length || 0}`);
      console.log(`fechaCreacion: ${carrito.fechaCreacion}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
revisarContacto()
  .then(() => {
    console.log('\n✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
