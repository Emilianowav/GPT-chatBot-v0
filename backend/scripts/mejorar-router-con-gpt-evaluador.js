import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const FLOW_ID = '695a156681f6d67f0ae9cf39';

async function mejorarRouterConGPTEvaluador() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;
    
    console.log('📋 NUEVA ESTRATEGIA:\n');
    console.log('En lugar de palabra clave [INFO_COMPLETA], el Router usará:');
    console.log('- Evaluar si el mensaje del usuario contiene suficiente información');
    console.log('- Criterio: tipo de producto + al menos 1 detalle específico\n');

    // Actualizar Router con nueva estrategia
    const resultado = await db.collection('flows').updateOne(
      { _id: new mongoose.Types.ObjectId(FLOW_ID) },
      { 
        $set: {
          'nodes.$[router].data.config': {
            routes: [
              {
                id: 'info-completa',
                label: 'Información Completa',
                condition: {
                  field: '1.message',
                  operator: 'regex',
                  value: '(libro|cuaderno|útil|material).*(grado|año|nivel|primaria|secundaria|materia|matemática|inglés|ciencia)'
                }
              },
              {
                id: 'info-incompleta',
                label: 'Falta Información',
                condition: {
                  field: '1.message',
                  operator: 'not_empty',
                  value: ''
                }
              }
            ]
          },
          updatedAt: new Date()
        }
      },
      {
        arrayFilters: [{ 'router.id': 'router-decision' }]
      }
    );

    console.log('✅ Router actualizado con nueva estrategia');
    console.log('   Documentos modificados:', resultado.modifiedCount);
    
    // Verificar
    const flujo = await db.collection('flows').findOne({ 
      _id: new mongoose.Types.ObjectId(FLOW_ID)
    });
    
    const routerNode = flujo.nodes.find(n => n.id === 'router-decision');
    console.log('\n📊 ROUTER ACTUALIZADO:');
    console.log('   Rutas:', routerNode.data.config.routes.length);
    routerNode.data.config.routes.forEach((route, i) => {
      console.log(`\n   Ruta ${i + 1}: ${route.label}`);
      console.log(`      Campo: ${route.condition.field}`);
      console.log(`      Operador: ${route.condition.operator}`);
      console.log(`      Valor: ${route.condition.value}`);
    });

    console.log('\n💡 CÓMO FUNCIONA AHORA:');
    console.log('   Mensaje: "libro de inglés primer año"');
    console.log('   → Contiene: "libro" + "primer año" → Info Completa ✅');
    console.log('');
    console.log('   Mensaje: "libros de escuela"');
    console.log('   → Solo tiene "libro", falta detalle → Info Incompleta ❌');

    await mongoose.disconnect();
    console.log('\n✅ Desconectado');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

mejorarRouterConGPTEvaluador();
