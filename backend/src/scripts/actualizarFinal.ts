// 📋 Actualizar configuración final con ObjectId correcto
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

async function actualizar() {
  const client = new MongoClient(process.env.MONGODB_URI || '');
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    
    const db = client.db('neural_chatbot');
    const collection = db.collection('configuracion_modulos');
    
    const docId = new ObjectId('68ff85d78e9f378673d09ff7');
    
    console.log('\n📋 Actualizando documento:', docId.toString());
    
    // Actualizar con $set
    const result = await collection.updateOne(
      { _id: docId },
      {
        $set: {
          // Plantilla para notificación diaria de agentes
          'notificacionDiariaAgentes.usarPlantillaMeta': true,
          'notificacionDiariaAgentes.plantillaMeta': {
            nombre: 'choferes_sanjose',
            idioma: 'es',
            activa: true,
            componentes: {
              body: {
                parametros: [
                  { tipo: 'text', variable: 'agente' },
                  { tipo: 'text', variable: 'lista_turnos' }
                ]
              }
            }
          },
          // Plantilla para confirmación de clientes
          'notificaciones.0.usarPlantillaMeta': true,
          'notificaciones.0.plantillaMeta': {
            nombre: 'clientes_sanjose',
            idioma: 'es',
            activa: true,
            componentes: {
              body: {
                parametros: []
              }
            }
          }
        }
      }
    );
    
    console.log('✅ Resultado:', result.modifiedCount, 'documento(s) modificado(s)');
    
    if (result.modifiedCount === 0) {
      console.log('⚠️ No se modificó nada');
      
      // Verificar si existe
      const doc = await collection.findOne({ _id: docId });
      if (!doc) {
        console.log('❌ El documento NO existe');
      } else {
        console.log('✅ El documento existe');
        console.log('   empresaId:', doc.empresaId);
      }
    } else {
      // Verificar cambios
      const doc = await collection.findOne({ _id: docId });
      
      console.log('\n📊 VERIFICACIÓN:');
      console.log('═══════════════════════════════════════');
      console.log('empresaId:', doc?.empresaId);
      console.log('\n1. Notificación Diaria Agentes:');
      console.log('   usarPlantillaMeta:', doc?.notificacionDiariaAgentes?.usarPlantillaMeta);
      console.log('   plantilla:', doc?.notificacionDiariaAgentes?.plantillaMeta?.nombre);
      console.log('\n2. Confirmación Clientes:');
      console.log('   usarPlantillaMeta:', doc?.notificaciones?.[0]?.usarPlantillaMeta);
      console.log('   plantilla:', doc?.notificaciones?.[0]?.plantillaMeta?.nombre);
      console.log('═══════════════════════════════════════');
      
      console.log('\n✅ CONFIGURACIÓN COMPLETADA!');
      console.log('\n📝 Próximos pasos:');
      console.log('   1. Reinicia el servidor: npm start');
      console.log('   2. Prueba el botón "Probar" en el frontend');
      console.log('   3. Aprueba las plantillas en Meta Business Manager:');
      console.log('      - clientes_sanjose');
      console.log('      - choferes_sanjose');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n👋 Desconectado');
  }
}

actualizar();
