import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function migrarWorkflowANodos() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // 1. Obtener workflow de api_configurations
    const api = await db.collection('api_configurations').findOne({
      nombre: /veo veo/i
    });

    if (!api) {
      console.log('❌ No se encontró API de Veo Veo');
      await mongoose.disconnect();
      return;
    }

    const workflow = api.workflows?.find(w => w.nombre?.includes('Consultar Libros'));

    if (!workflow) {
      console.log('❌ No se encontró workflow "Consultar Libros"');
      await mongoose.disconnect();
      return;
    }

    console.log(`📋 Workflow encontrado: ${workflow.nombre}`);
    console.log(`   Pasos: ${workflow.steps?.length || 0}\n`);

    // 2. Crear nodos basados en los pasos del workflow
    const flowId = 'consultar_libros_v2';
    const empresaId = 'Veo Veo';
    const nodes = [];

    // Mapeo de pasos a nodos
    const stepToNodeMap = {
      1: {
        id: 'solicitar_titulo',
        type: 'input',
        name: 'Solicitar Título',
        message: workflow.steps[0].pregunta,
        next: 'solicitar_editorial',
        activo: true
      },
      2: {
        id: 'solicitar_editorial',
        type: 'input',
        name: 'Solicitar Editorial',
        message: workflow.steps[1].pregunta,
        next: 'solicitar_edicion',
        activo: true
      },
      3: {
        id: 'solicitar_edicion',
        type: 'input',
        name: 'Solicitar Edición',
        message: workflow.steps[2].pregunta,
        next: 'buscar_productos',
        activo: true
      },
      4: {
        id: 'buscar_productos',
        type: 'api_call',
        name: 'Buscar Productos',
        message: workflow.steps[3].pregunta,
        next: 'solicitar_cantidad',
        activo: true,
        action: {
          type: 'api_call',
          config: {
            endpointId: 'buscar-productos',
            arrayPath: 'data',
            idField: 'id',
            displayField: 'name',
            priceField: 'price',
            stockField: 'stock_quantity'
          }
        }
      },
      5: {
        id: 'solicitar_cantidad',
        type: 'input',
        name: 'Solicitar Cantidad',
        message: workflow.steps[4].pregunta,
        next: 'confirmar_continuar',
        activo: true,
        validation: {
          type: 'number',
          min: 1,
          max: 10
        }
      },
      6: {
        id: 'confirmar_continuar',
        type: 'menu',
        name: 'Confirmar o Continuar',
        message: workflow.steps[5].pregunta,
        activo: true,
        options: [
          { text: '1️⃣ Agregar otro libro', value: '1', next: 'solicitar_titulo' },
          { text: '2️⃣ Finalizar compra', value: '2', next: 'generar_pago' }
        ]
      },
      7: {
        id: 'generar_pago',
        type: 'action',
        name: 'Generar Link de Pago',
        message: workflow.steps[6].pregunta,
        activo: true,
        action: {
          type: 'create_payment_link',
          config: {
            endpointId: 'generar-link-pago'
          }
        }
      }
    };

    // Crear nodos
    for (let i = 1; i <= workflow.steps.length; i++) {
      const nodeConfig = stepToNodeMap[i];
      if (nodeConfig) {
        const node = {
          empresaId,
          flowId,
          ...nodeConfig,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        nodes.push(node);
      }
    }

    // 3. Limpiar nodos existentes del flujo
    const deleteResult = await db.collection('flownodes').deleteMany({
      empresaId,
      flowId
    });

    console.log(`🗑️  Nodos eliminados: ${deleteResult.deletedCount}\n`);

    // 4. Insertar nuevos nodos
    if (nodes.length > 0) {
      const insertResult = await db.collection('flownodes').insertMany(nodes);
      console.log(`✅ Nodos creados: ${insertResult.insertedCount}\n`);

      // Mostrar nodos creados
      console.log('📋 NODOS CREADOS:\n');
      nodes.forEach((node, index) => {
        console.log(`${index + 1}. ${node.name}`);
        console.log(`   ID: ${node.id}`);
        console.log(`   Tipo: ${node.type}`);
        console.log(`   Next: ${node.next || 'opciones' || 'fin'}`);
        console.log('');
      });
    }

    // 5. Actualizar startNode del flujo
    await db.collection('flows').updateOne(
      { empresaId, id: flowId },
      { 
        $set: { 
          startNode: 'solicitar_titulo',
          updatedAt: new Date()
        } 
      }
    );

    console.log('✅ Flujo actualizado con startNode: solicitar_titulo\n');

    await mongoose.disconnect();
    console.log('✅ Migración completada');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

migrarWorkflowANodos();
