import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function fixPasoBusquedaMapeo() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    const api = await db.collection('api_configurations').findOne({
      nombre: /veo veo/i
    });

    console.log('🔧 Corrigiendo paso de búsqueda...\n');

    const workflows = api.workflows;
    const workflowIndex = workflows.findIndex(w => w.id === 'veo-veo-consultar-libros');

    if (workflowIndex === -1) {
      console.log('❌ Workflow no encontrado');
      await mongoose.disconnect();
      return;
    }

    // Encontrar el paso de búsqueda (orden 4)
    const pasoIndex = workflows[workflowIndex].steps.findIndex(s => s.orden === 4);

    if (pasoIndex === -1) {
      console.log('❌ Paso de búsqueda no encontrado');
      await mongoose.disconnect();
      return;
    }

    // Actualizar el paso para usar mapeoParametros
    workflows[workflowIndex].steps[pasoIndex] = {
      orden: 4,
      nombre: 'Buscar productos',
      tipo: 'consulta_filtrada',
      nombreVariable: 'productos_encontrados',
      pregunta: '🔍 Buscando libros...\n\n📚 *Resultados:*\n\n{{opciones}}\n\n¿Cuál libro te interesa?\nEscribí el número',
      endpointId: 'buscar-productos',
      mapeoParametros: {
        search: '{{titulo}}',
        per_page: '100',
        status: 'publish'
      },
      endpointResponseConfig: {
        idField: 'id',
        displayField: 'name',
        priceField: 'price',
        stockField: 'stock_quantity',
        imageField: 'images[0].src'
      },
      validacion: {
        tipo: 'numero',
        min: 1,
        max: 10
      }
    };

    // Actualizar en la base de datos
    const result = await db.collection('api_configurations').updateOne(
      { _id: api._id },
      {
        $set: {
          workflows: workflows,
          updatedAt: new Date()
        }
      }
    );

    console.log('✅ Paso de búsqueda corregido:');
    console.log('   - Cambiado "parametros" a "mapeoParametros"');
    console.log('   - search: {{titulo}}');
    console.log('   - per_page: 100');
    console.log('   - status: publish');
    console.log('');
    console.log('   Documentos actualizados:', result.modifiedCount);

    await mongoose.disconnect();
    console.log('\n✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixPasoBusquedaMapeo();
