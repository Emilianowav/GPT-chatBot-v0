// 📋 Actualizar en la colección correcta: configuraciones_modulo
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

async function actualizar() {
  const client = new MongoClient(process.env.MONGODB_URI || '');
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    
    const db = client.db('neural_chatbot');
    const collection = db.collection('configuraciones_modulo');  // ← CORREGIDO: plural
    
    const docId = new ObjectId('68ff85d78e9f378673d09ff7');
    
    console.log('\n📋 Buscando en: neural_chatbot.configuraciones_modulo');
    console.log('   _id:', docId.toString());
    
    // Verificar que existe
    const existe = await collection.findOne({ _id: docId });
    
    if (!existe) {
      console.log('❌ Documento no encontrado');
      
      // Listar todos los documentos
      const all = await collection.find({}).project({ _id: 1, empresaId: 1 }).toArray();
      console.log('\n📊 Documentos en la colección:', all.length);
      all.forEach(doc => console.log(`   - ${doc.empresaId} (${doc._id})`));
      
      process.exit(1);
    }
    
    console.log('✅ Documento encontrado:', existe.empresaId);
    
    // Actualizar
    console.log('\n📋 Actualizando plantillas...');
    
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
    
    console.log('✅ Actualizado:', result.modifiedCount, 'documento(s)');
    
    // Verificar
    const updated = await collection.findOne({ _id: docId });
    
    console.log('\n📊 VERIFICACIÓN:');
    console.log('═══════════════════════════════════════');
    console.log('empresaId:', updated?.empresaId);
    console.log('\n1. Notificación Diaria Agentes:');
    console.log('   usarPlantillaMeta:', updated?.notificacionDiariaAgentes?.usarPlantillaMeta);
    console.log('   plantilla:', updated?.notificacionDiariaAgentes?.plantillaMeta?.nombre);
    console.log('   parámetros:', updated?.notificacionDiariaAgentes?.plantillaMeta?.componentes?.body?.parametros?.map((p: any) => p.variable).join(', '));
    
    console.log('\n2. Confirmación Clientes:');
    console.log('   usarPlantillaMeta:', updated?.notificaciones?.[0]?.usarPlantillaMeta);
    console.log('   plantilla:', updated?.notificaciones?.[0]?.plantillaMeta?.nombre);
    console.log('   parámetros:', updated?.notificaciones?.[0]?.plantillaMeta?.componentes?.body?.parametros?.length || 0);
    console.log('═══════════════════════════════════════');
    
    console.log('\n✅ CONFIGURACIÓN COMPLETADA!');
    console.log('\n📝 Próximos pasos:');
    console.log('   1. Reinicia el servidor backend: npm start');
    console.log('   2. Prueba el botón "Probar" en el frontend');
    console.log('   3. Aprueba las plantillas en Meta Business Manager:');
    console.log('      - clientes_sanjose (sin parámetros)');
    console.log('      - choferes_sanjose (2 parámetros: agente, lista_turnos)');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n👋 Desconectado');
  }
}

actualizar();
