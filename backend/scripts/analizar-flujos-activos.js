import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, '❌ Error de conexión:'));
db.once('open', async () => {
  console.log('✅ Conectado a MongoDB\n');
  
  try {
    // Obtener todos los flujos
    const flows = await db.collection('flows').find({}).toArray();
    
    console.log('📊 ANÁLISIS DE FLUJOS\n');
    console.log(`Total de flujos: ${flows.length}\n`);
    
    // Agrupar por empresa
    const flowsByEmpresa = {};
    flows.forEach(flow => {
      const empresa = flow.empresaId || 'Sin empresa';
      if (!flowsByEmpresa[empresa]) {
        flowsByEmpresa[empresa] = [];
      }
      flowsByEmpresa[empresa].push(flow);
    });
    
    // Mostrar flujos por empresa
    for (const [empresa, empresaFlows] of Object.entries(flowsByEmpresa)) {
      console.log(`\n🏢 EMPRESA: ${empresa}`);
      console.log('='.repeat(80));
      
      empresaFlows.forEach((flow, index) => {
        const activo = flow.activo ? '✅ ACTIVO' : '❌ INACTIVO';
        const nodos = flow.nodes?.length || 0;
        const edges = flow.edges?.length || 0;
        
        console.log(`\n${index + 1}. ${flow.nombre || 'Sin nombre'}`);
        console.log(`   ID: ${flow._id}`);
        console.log(`   Estado: ${activo}`);
        console.log(`   Nodos: ${nodos} | Conexiones: ${edges}`);
        console.log(`   Creado: ${flow.createdAt || 'N/A'}`);
        console.log(`   Actualizado: ${flow.updatedAt || 'N/A'}`);
        
        // Mostrar primer nodo (trigger)
        if (flow.nodes && flow.nodes.length > 0) {
          const primerNodo = flow.nodes[0];
          console.log(`   Primer nodo: ${primerNodo.type} - ${primerNodo.data?.label || 'Sin label'}`);
          
          // Si es WhatsApp, mostrar módulo
          if (primerNodo.type === 'whatsapp' && primerNodo.data?.config?.module) {
            console.log(`   Módulo WhatsApp: ${primerNodo.data.config.module}`);
          }
        }
      });
    }
    
    // Resumen de flujos activos
    console.log('\n\n📈 RESUMEN DE FLUJOS ACTIVOS');
    console.log('='.repeat(80));
    
    const flujosActivos = flows.filter(f => f.activo);
    console.log(`\nTotal de flujos activos: ${flujosActivos.length}`);
    
    flujosActivos.forEach(flow => {
      console.log(`\n✅ ${flow.nombre || 'Sin nombre'}`);
      console.log(`   Empresa: ${flow.empresaId || 'Sin empresa'}`);
      console.log(`   ID: ${flow._id}`);
      console.log(`   Nodos: ${flow.nodes?.length || 0}`);
    });
    
    // Buscar flujo de Intercapital específicamente
    console.log('\n\n🎯 FLUJOS DE INTERCAPITAL');
    console.log('='.repeat(80));
    
    const intercapitalFlows = flows.filter(f => 
      f.empresaId === 'Intercapital' || 
      f.nombre?.toLowerCase().includes('intercapital')
    );
    
    if (intercapitalFlows.length > 0) {
      intercapitalFlows.forEach(flow => {
        const activo = flow.activo ? '✅ ACTIVO' : '❌ INACTIVO';
        console.log(`\n${activo} ${flow.nombre || 'Sin nombre'}`);
        console.log(`   ID: ${flow._id}`);
        console.log(`   Nodos: ${flow.nodes?.length || 0}`);
        
        // Analizar nodos GPT
        const nodosGPT = flow.nodes?.filter(n => n.type === 'gpt') || [];
        if (nodosGPT.length > 0) {
          console.log(`   Nodos GPT: ${nodosGPT.length}`);
          nodosGPT.forEach(nodo => {
            console.log(`      - ${nodo.data?.label || 'Sin label'} (tipo: ${nodo.data?.config?.tipo || 'N/A'})`);
          });
        }
      });
    } else {
      console.log('\n⚠️  No se encontraron flujos de Intercapital');
    }
    
    console.log('\n\n💡 ACCIONES SUGERIDAS:');
    console.log('='.repeat(80));
    console.log('\nPara cambiar el flujo activo de Intercapital:');
    console.log('1. Ejecuta: node scripts/cambiar-flujo-activo.js <ID_FLUJO_NUEVO>');
    console.log('2. O usa: node scripts/cambiar-flujo-activo.js <ID_FLUJO_NUEVO> --desactivar-otros');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Conexión cerrada');
  }
});
