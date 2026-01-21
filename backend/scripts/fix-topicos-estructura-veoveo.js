import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function fixTopicosEstructura() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB Atlas (ClusterMomento → neural_chatbot)\n');
    
    const db = mongoose.connection.db;
    
    console.log('🔍 Buscando flujo de VeoVeo en collection "flows"...\n');
    
    // Buscar el flujo de VeoVeo (puede tener diferentes nombres)
    const flow = await db.collection('flows').findOne({ 
      activo: true,
      $or: [
        { nombre: /veo veo/i },
        { id: /veo-veo/i },
        { empresaId: /veo veo/i }
      ]
    });
    
    if (!flow) {
      console.log('❌ No se encontró el flujo de VeoVeo');
      console.log('   Intentando listar todos los flujos activos...\n');
      
      const allFlows = await db.collection('flows').find({ activo: true }).toArray();
      console.log(`   Flujos activos encontrados: ${allFlows.length}`);
      allFlows.forEach(f => {
        console.log(`   - ${f.nombre || f.id} (${f._id})`);
      });
      return;
    }
    
    console.log(`✅ Flujo encontrado: ${flow.nombre || flow.id}`);
    console.log(`   ID: ${flow._id}`);
    console.log(`   Tiene config: ${!!flow.config}`);
    console.log(`   Tiene topicos: ${!!flow.config?.topicos}\n`);
    
    // Agregar la estructura de empresa a los tópicos existentes
    const topicosActualizados = {
      ...flow.config.topicos,
      empresa: {
        nombre: "Librería Veo Veo",
        ubicacion: "San Juan 1037, Corrientes Capital",
        whatsapp: "5493794732177",
        whatsapp_link: "https://wa.me/5493794732177"
      }
    };
    
    console.log('📝 Actualizando estructura de tópicos...\n');
    console.log('Agregando topicos.empresa:');
    console.log(JSON.stringify(topicosActualizados.empresa, null, 2));
    
    // Actualizar el flujo
    const result = await db.collection('flows').updateOne(
      { _id: flow._id },
      { 
        $set: { 
          'config.topicos': topicosActualizados,
          'config.topicos_habilitados': true,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log(`\n✅ Flujo actualizado (${result.modifiedCount} documento modificado)`);
    
    // Verificar
    const flowActualizado = await db.collection('flows').findOne({ _id: flow._id });
    
    console.log('\n🔍 VERIFICACIÓN:');
    console.log(`   topicos_habilitados: ${flowActualizado.config.topicos_habilitados}`);
    console.log(`   topicos.empresa existe: ${!!flowActualizado.config.topicos.empresa}`);
    console.log(`   topicos.empresa.whatsapp_link: ${flowActualizado.config.topicos.empresa?.whatsapp_link || '❌'}`);
    
    console.log('\n✅ ESTRUCTURA CORREGIDA EXITOSAMENTE\n');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixTopicosEstructura();
