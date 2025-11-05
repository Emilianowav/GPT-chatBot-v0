// 📋 Limpiar configuración de plantilla clientes_sanjose
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

async function limpiar() {
  const client = new MongoClient(process.env.MONGODB_URI || '');
  
  try {
    await client.connect();
    console.log('✅ Conectado');
    
    const db = client.db('neural_chatbot');
    const collection = db.collection('configuraciones_modulo');
    
    const docId = new ObjectId('68ff85d78e9f378673d09ff7');
    
    console.log('\n📋 Limpiando configuración de clientes_sanjose...');
    
    const result = await collection.updateOne(
      { _id: docId },
      {
        $set: {
          'notificaciones.0.plantillaMeta': {
            nombre: 'clientes_sanjose',
            idioma: 'es',
            activa: true,
            componentes: {}  // Sin componentes - plantilla con texto fijo y botones
          }
        }
      }
    );
    
    console.log('✅ Actualizado:', result.modifiedCount, 'documento(s)');
    
    // Verificar
    const doc = await collection.findOne({ _id: docId });
    console.log('\n📊 VERIFICACIÓN:');
    console.log('clientes_sanjose componentes:', JSON.stringify(doc?.notificaciones?.[0]?.plantillaMeta?.componentes, null, 2));
    console.log('choferes_sanjose componentes:', JSON.stringify(doc?.notificacionDiariaAgentes?.plantillaMeta?.componentes, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n👋 Desconectado');
  }
}

limpiar();
