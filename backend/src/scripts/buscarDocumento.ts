// 📋 Buscar documento en todas las bases de datos
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

async function buscar() {
  const client = new MongoClient(process.env.MONGODB_URI || '');
  
  try {
    await client.connect();
    console.log('✅ Conectado');
    
    const docId = new ObjectId('68ff85d78e9f378673d09ff7');
    console.log('🔍 Buscando documento:', docId.toString());
    
    // Listar todas las bases de datos
    const adminDb = client.db().admin();
    const { databases } = await adminDb.listDatabases();
    
    console.log('\n📊 Bases de datos disponibles:');
    databases.forEach(db => console.log(`  - ${db.name}`));
    
    // Buscar en cada base de datos
    for (const dbInfo of databases) {
      const db = client.db(dbInfo.name);
      const collections = await db.listCollections().toArray();
      
      for (const collInfo of collections) {
        if (collInfo.name === 'configuracion_modulos') {
          console.log(`\n✅ Encontrada colección en: ${dbInfo.name}`);
          
          const collection = db.collection('configuracion_modulos');
          const doc = await collection.findOne({ _id: docId });
          
          if (doc) {
            console.log('🎯 DOCUMENTO ENCONTRADO!');
            console.log('   Base de datos:', dbInfo.name);
            console.log('   empresaId:', doc.empresaId);
            console.log('   _id:', doc._id);
            
            // Actualizar aquí mismo
            console.log('\n📋 Actualizando...');
            const result = await collection.updateOne(
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
            console.log('   notificacionDiariaAgentes.usarPlantillaMeta:', updated?.notificacionDiariaAgentes?.usarPlantillaMeta);
            console.log('   notificacionDiariaAgentes.plantillaMeta.nombre:', updated?.notificacionDiariaAgentes?.plantillaMeta?.nombre);
            console.log('   notificaciones[0].usarPlantillaMeta:', updated?.notificaciones?.[0]?.usarPlantillaMeta);
            console.log('   notificaciones[0].plantillaMeta.nombre:', updated?.notificaciones?.[0]?.plantillaMeta?.nombre);
            
            return;
          }
        }
      }
    }
    
    console.log('\n❌ Documento no encontrado en ninguna base de datos');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n👋 Desconectado');
  }
}

buscar();
