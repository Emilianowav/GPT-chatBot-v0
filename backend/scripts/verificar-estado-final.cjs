const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGODB_URI;

const flowSchema = new mongoose.Schema({}, { strict: false, collection: 'flows' });
const empresaSchema = new mongoose.Schema({}, { strict: false, collection: 'empresas' });

const FlowModel = mongoose.model('Flow', flowSchema);
const EmpresaModel = mongoose.model('Empresa', empresaSchema);

async function verificarEstadoFinal() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');

    // 1. Verificar empresa Veo Veo
    console.log('📊 EMPRESA VEO VEO:\n');
    const empresa = await EmpresaModel.findOne({ nombre: 'Veo Veo' });
    
    if (!empresa) {
      console.log('❌ Empresa no encontrada');
      process.exit(1);
    }

    console.log(`   Nombre: ${empresa.nombre}`);
    console.log(`   flujoActivo: ${empresa.flujoActivo || 'NO CONFIGURADO'}`);
    console.log(`   botType: ${empresa.botType || 'undefined'}`);
    console.log('');

    // 2. Verificar flujo activo
    if (!empresa.flujoActivo) {
      console.log('❌ No hay flujo activo configurado');
      process.exit(1);
    }

    const flowId = empresa.flujoActivo.toString();
    console.log(`🔍 FLUJO ACTIVO (${flowId}):\n`);
    
    const flow = await FlowModel.findById(flowId);
    
    if (!flow) {
      console.log('❌ Flujo no encontrado en la BD');
      process.exit(1);
    }

    console.log(`   Nombre: ${flow.nombre}`);
    console.log(`   Nodos: ${flow.nodes?.length || 0}`);
    console.log(`   Edges: ${flow.edges?.length || 0}`);
    console.log(`   botType: ${flow.botType || 'undefined'}`);
    console.log('');

    // 3. Verificar nodos y categories
    console.log('📋 NODOS DEL FLUJO:\n');
    
    let triggerCount = 0;
    let processorCount = 0;
    let actionCount = 0;
    let sinCategory = 0;

    flow.nodes.forEach((node, index) => {
      const category = node.category || 'UNDEFINED';
      const icon = category === 'trigger' ? '⚡' :
                   category === 'processor' ? '⚙️' :
                   category === 'action' ? '📤' : '❓';
      
      console.log(`${icon} ${index + 1}. ${node.data?.label || node.id}`);
      console.log(`   ID: ${node.id}`);
      console.log(`   Type: ${node.type}`);
      console.log(`   Category: ${category}`);
      
      if (category === 'trigger') triggerCount++;
      else if (category === 'processor') processorCount++;
      else if (category === 'action') actionCount++;
      else sinCategory++;
      
      // Mostrar config si existe
      if (node.data?.config) {
        const config = node.data.config;
        if (config.tipo) console.log(`   GPT Tipo: ${config.tipo}`);
        if (config.modelo) console.log(`   Modelo: ${config.modelo}`);
        if (config.variablesRecopilar?.length > 0) {
          console.log(`   Variables: ${config.variablesRecopilar.map(v => v.nombre).join(', ')}`);
        }
      }
      
      console.log('');
    });

    // 4. Resumen
    console.log('📊 RESUMEN:\n');
    console.log(`   ⚡ Triggers: ${triggerCount}`);
    console.log(`   ⚙️  Processors: ${processorCount}`);
    console.log(`   📤 Actions: ${actionCount}`);
    console.log(`   ❓ Sin category: ${sinCategory}`);
    console.log('');

    // 5. Verificación final
    if (triggerCount === 0) {
      console.log('❌ PROBLEMA: No hay nodo trigger');
      console.log('   El FlowExecutor no podrá iniciar el flujo\n');
    } else if (triggerCount > 1) {
      console.log('⚠️  ADVERTENCIA: Hay más de un nodo trigger');
      console.log('   Solo debería haber uno\n');
    } else {
      console.log('✅ FLUJO VÁLIDO: Tiene exactamente 1 nodo trigger\n');
    }

    if (sinCategory > 0) {
      console.log(`⚠️  ADVERTENCIA: ${sinCategory} nodos sin category\n`);
    }

    // 6. Verificar edges
    console.log('🔗 CONEXIONES (EDGES):\n');
    flow.edges?.forEach((edge, index) => {
      const sourceNode = flow.nodes.find(n => n.id === edge.source);
      const targetNode = flow.nodes.find(n => n.id === edge.target);
      
      console.log(`${index + 1}. ${sourceNode?.data?.label || edge.source}`);
      console.log(`   → ${targetNode?.data?.label || edge.target}`);
      if (edge.sourceHandle) console.log(`   Handle: ${edge.sourceHandle}`);
      console.log('');
    });

    console.log('✅ Verificación completa\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

verificarEstadoFinal();
