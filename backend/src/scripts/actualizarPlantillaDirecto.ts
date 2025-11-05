// 📋 Actualizar plantilla directamente con updateOne
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function actualizar() {
  try {
    console.log('🔌 Conectando...');
    await mongoose.connect(process.env.MONGODB_URI || '');
    
    const db = mongoose.connection.db;
    const collection = db?.collection('configuracion_modulos');

    // Actualizar notificacionDiariaAgentes
    const result1 = await collection?.updateOne(
      { empresaId: 'San Jose' },
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
          }
        }
      }
    );

    console.log('✅ notificacionDiariaAgentes actualizada:', result1?.modifiedCount);

    // Actualizar primera notificación (confirmación)
    const result2 = await collection?.updateOne(
      { empresaId: 'San Jose' },
      {
        $set: {
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

    console.log('✅ notificaciones[0] actualizada:', result2?.modifiedCount);

    // Verificar
    const doc = await collection?.findOne({ empresaId: 'San Jose' });
    
    console.log('\n📊 VERIFICACIÓN:');
    console.log('═══════════════════════════════════════');
    console.log('notificacionDiariaAgentes.usarPlantillaMeta:', doc?.notificacionDiariaAgentes?.usarPlantillaMeta);
    console.log('notificacionDiariaAgentes.plantillaMeta.nombre:', doc?.notificacionDiariaAgentes?.plantillaMeta?.nombre);
    console.log('notificaciones[0].usarPlantillaMeta:', doc?.notificaciones?.[0]?.usarPlantillaMeta);
    console.log('notificaciones[0].plantillaMeta.nombre:', doc?.notificaciones?.[0]?.plantillaMeta?.nombre);
    console.log('═══════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado');
  }
}

actualizar();
