// 📋 Actualizar plantilla clientes_sanjose con 2 parámetros
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

async function actualizar() {
  const client = new MongoClient(process.env.MONGODB_URI || '');
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    
    const db = client.db('neural_chatbot');
    const collection = db.collection('configuraciones_modulo');
    
    const docId = new ObjectId('68ff85d78e9f378673d09ff7');
    
    console.log('\n📋 Actualizando plantilla clientes_sanjose...');
    console.log('   La plantilla requiere 2 parámetros según Meta API');
    console.log('   Parámetros: nombre_cliente, fecha_hora');
    
    const result = await collection.updateOne(
      { _id: docId },
      {
        $set: {
          'notificaciones.0.plantillaMeta': {
            nombre: 'clientes_sanjose',
            idioma: 'es',
            activa: true,
            componentes: {
              body: {
                parametros: [
                  { tipo: 'text', variable: 'nombre_cliente' },
                  { tipo: 'text', variable: 'fecha_hora' }
                ]
              }
            }
          }
        }
      }
    );
    
    console.log('✅ Actualizado:', result.modifiedCount, 'documento(s)');
    
    // Verificar
    const doc = await collection.findOne({ _id: docId });
    console.log('\n📊 VERIFICACIÓN:');
    console.log('clientes_sanjose:', JSON.stringify(doc?.notificaciones?.[0]?.plantillaMeta, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n👋 Desconectado');
  }
}

actualizar();
