const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGODB_URI;

const empresaSchema = new mongoose.Schema({}, { strict: false, collection: 'empresas' });
const flowSchema = new mongoose.Schema({}, { strict: false, collection: 'flows' });

const EmpresaModel = mongoose.model('Empresa', empresaSchema);
const FlowModel = mongoose.model('Flow', flowSchema);

async function activarFlujoNuevo() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');

    // 1. Buscar el flujo más reciente de Veo Veo
    console.log('🔍 Buscando flujos de Veo Veo...\n');
    
    const flows = await FlowModel.find({ empresaId: 'Veo Veo' })
      .sort({ createdAt: -1 })
      .limit(5);

    console.log(`📊 Flujos encontrados: ${flows.length}\n`);
    
    flows.forEach((flow, index) => {
      console.log(`${index + 1}. ${flow.nombre || 'Sin nombre'}`);
      console.log(`   ID: ${flow._id}`);
      console.log(`   Nodos: ${flow.nodes?.length || 0}`);
      console.log(`   Edges: ${flow.edges?.length || 0}`);
      console.log(`   botType: ${flow.botType || 'undefined'}`);
      console.log(`   Creado: ${flow.createdAt || 'N/A'}`);
      
      // Verificar si tiene nodo trigger
      const triggerNode = flow.nodes?.find(n => n.category === 'trigger');
      console.log(`   Trigger: ${triggerNode ? '✅ ' + triggerNode.id : '❌ NO'}`);
      console.log('');
    });

    // 2. Preguntar cuál activar (usaremos el más reciente por defecto)
    const flujoNuevo = flows[0];
    
    if (!flujoNuevo) {
      console.log('❌ No se encontró ningún flujo');
      process.exit(1);
    }

    console.log(`\n🎯 Activando flujo: ${flujoNuevo.nombre}`);
    console.log(`   ID: ${flujoNuevo._id}\n`);

    // 3. Actualizar empresa Veo Veo
    const empresa = await EmpresaModel.findOne({ nombre: 'Veo Veo' });
    
    if (!empresa) {
      console.log('❌ Empresa Veo Veo no encontrada');
      process.exit(1);
    }

    console.log(`📝 Empresa encontrada: ${empresa.nombre}`);
    console.log(`   flujoActivo anterior: ${empresa.flujoActivo || 'ninguno'}`);
    
    empresa.flujoActivo = flujoNuevo._id.toString();
    await empresa.save();
    
    console.log(`   flujoActivo nuevo: ${empresa.flujoActivo}`);
    console.log('\n✅ Flujo activado correctamente');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

activarFlujoNuevo();
