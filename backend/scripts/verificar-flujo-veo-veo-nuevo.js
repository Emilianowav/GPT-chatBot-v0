import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function verificarFlujoVeoVeo() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // 1. Buscar flujo de Veo Veo en la colección flows
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. VERIFICANDO FLUJOS EN COLECCIÓN flows');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const flows = await db.collection('flows').find({
      empresaId: 'Veo Veo'
    }).toArray();

    console.log(`📋 Flujos encontrados: ${flows.length}\n`);

    flows.forEach((flow, index) => {
      console.log(`${index + 1}. ${flow.nombre}`);
      console.log(`   ID: ${flow.id}`);
      console.log(`   Activo: ${flow.activo ? '✅ SÍ' : '❌ NO'}`);
      console.log(`   Categoría: ${flow.categoria}`);
      console.log(`   Start Node: ${flow.startNode}`);
      console.log('');
    });

    // 2. Buscar nodos de Veo Veo
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('2. VERIFICANDO NODOS EN COLECCIÓN flownodes');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const nodes = await db.collection('flownodes').find({
      empresaId: 'Veo Veo'
    }).toArray();

    console.log(`📋 Nodos encontrados: ${nodes.length}\n`);

    // Agrupar por flowId
    const nodesByFlow = {};
    nodes.forEach(node => {
      if (!nodesByFlow[node.flowId]) {
        nodesByFlow[node.flowId] = [];
      }
      nodesByFlow[node.flowId].push(node);
    });

    Object.keys(nodesByFlow).forEach(flowId => {
      console.log(`\n📁 Flow: ${flowId}`);
      console.log(`   Nodos: ${nodesByFlow[flowId].length}`);
      
      nodesByFlow[flowId].forEach((node, index) => {
        console.log(`\n   ${index + 1}. ${node.name}`);
        console.log(`      ID: ${node.id}`);
        console.log(`      Tipo: ${node.type}`);
        console.log(`      Activo: ${node.activo ? '✅' : '❌'}`);
        
        if (node.message) {
          const preview = node.message.substring(0, 80);
          console.log(`      Mensaje: ${preview}${node.message.length > 80 ? '...' : ''}`);
        }
        
        if (node.options && node.options.length > 0) {
          console.log(`      Opciones: ${node.options.length}`);
          node.options.forEach((opt, i) => {
            console.log(`         ${i + 1}. ${opt.text} → ${opt.next || 'sin siguiente'}`);
          });
        }
        
        if (node.next) {
          console.log(`      Next: ${node.next}`);
        }
      });
    });

    // 3. Verificar workflow en api_configurations
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('3. VERIFICANDO WORKFLOW EN api_configurations');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const api = await db.collection('api_configurations').findOne({
      nombre: /veo veo/i
    });

    if (api) {
      const workflow = api.workflows?.find(w => w.nombre?.includes('Consultar Libros'));
      
      if (workflow) {
        console.log(`📋 Workflow: ${workflow.nombre}`);
        console.log(`   Pasos: ${workflow.steps?.length || 0}`);
        console.log(`   Activo: ${workflow.activo !== false ? '✅ SÍ' : '❌ NO'}`);
      } else {
        console.log('❌ No se encontró workflow "Consultar Libros"');
      }
    } else {
      console.log('❌ No se encontró API de Veo Veo');
    }

    await mongoose.disconnect();
    console.log('\n\n✅ Verificación completada');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificarFlujoVeoVeo();
