// 📋 Actualizar por _id específico
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

async function actualizar() {
  try {
    console.log('🔌 Conectando...');
    
    // Conectar especificando la base de datos
    const uri = process.env.MONGODB_URI || '';
    const baseUri = uri.split('?')[0]; // Quitar query params
    const queryParams = uri.includes('?') ? '?' + uri.split('?')[1] : '';
    const uriWithDb = baseUri + '/neural_chatbot' + queryParams;
    
    await mongoose.connect(uriWithDb);
    console.log('✅ Conectado a neural_chatbot');
    
    const db = mongoose.connection.db;
    const collection = db?.collection('configuracion_modulos');

    // ID del documento que me pasaste
    const docId = new ObjectId('68ff85d78e9f378673d09ff7');

    console.log('\n📋 Actualizando documento:', docId.toString());

    // Actualizar notificacionDiariaAgentes
    const result = await collection?.updateOne(
      { _id: docId },
      {
        $set: {
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
          'notificaciones.0.usarPlantillaMeta': true,
          'notificaciones.0.plantillaMeta': {
            nombre: 'recordatorios_sanjose',
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

    console.log('✅ Documentos modificados:', result?.modifiedCount);

    if (result?.modifiedCount === 0) {
      console.log('⚠️ No se modificó nada - verificando si existe...');
      const exists = await collection?.findOne({ _id: docId });
      console.log('¿Existe el documento?', exists ? '✅ Sí' : '❌ No');
    }

    // Verificar
    const doc = await collection?.findOne({ _id: docId });
    
    if (doc) {
      console.log('\n📊 VERIFICACIÓN:');
      console.log('═══════════════════════════════════════');
      console.log('empresaId:', doc.empresaId);
      console.log('notificacionDiariaAgentes.usarPlantillaMeta:', doc.notificacionDiariaAgentes?.usarPlantillaMeta);
      console.log('notificacionDiariaAgentes.plantillaMeta.nombre:', doc.notificacionDiariaAgentes?.plantillaMeta?.nombre);
      console.log('notificaciones[0].usarPlantillaMeta:', doc.notificaciones?.[0]?.usarPlantillaMeta);
      console.log('notificaciones[0].plantillaMeta.nombre:', doc.notificaciones?.[0]?.plantillaMeta?.nombre);
      console.log('═══════════════════════════════════════');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado');
  }
}

actualizar();
