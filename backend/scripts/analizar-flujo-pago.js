import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function analizarFlujoPago() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_db';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');
    
    const db = mongoose.connection.db;
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new mongoose.Types.ObjectId('695a156681f6d67f0ae9cf40') });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      await mongoose.disconnect();
      return;
    }
    
    console.log('\n🔍 ANÁLISIS DEL FLUJO DE PAGO\n');
    console.log('═'.repeat(80));
    
    // 1. Buscar nodo whatsapp-link-pago
    const whatsappLinkPago = flow.nodes.find(n => n.id === 'whatsapp-link-pago');
    
    if (!whatsappLinkPago) {
      console.log('❌ Nodo whatsapp-link-pago no encontrado');
    } else {
      console.log('\n📍 NODO: whatsapp-link-pago');
      console.log(`   Label: ${whatsappLinkPago.data.label}`);
      console.log(`   Type: ${whatsappLinkPago.type}`);
      
      const config = whatsappLinkPago.data.config || {};
      console.log(`   Mensaje: ${config.message || config.mensaje || 'N/A'}`);
    }
    
    // 2. Buscar qué nodos conectan A whatsapp-link-pago
    console.log('\n\n🔗 CONEXIONES HACIA whatsapp-link-pago:');
    const edgesToLinkPago = flow.edges.filter(e => e.target === 'whatsapp-link-pago');
    
    if (edgesToLinkPago.length === 0) {
      console.log('   ⚠️  No hay conexiones hacia whatsapp-link-pago');
    } else {
      edgesToLinkPago.forEach((edge, index) => {
        console.log(`\n   ${index + 1}. Edge: ${edge.id}`);
        console.log(`      Desde: ${edge.source}`);
        console.log(`      Label: ${edge.label || 'Sin label'}`);
        
        if (edge.data?.condition) {
          console.log(`      Condición: ${edge.data.condition}`);
        }
        
        // Buscar el nodo source
        const sourceNode = flow.nodes.find(n => n.id === edge.source);
        if (sourceNode) {
          console.log(`      Nodo origen: ${sourceNode.data.label} (${sourceNode.type})`);
        }
      });
    }
    
    // 3. Analizar routers que pueden llevar al flujo de pago
    console.log('\n\n🔀 ROUTERS EN EL FLUJO:');
    const routers = flow.nodes.filter(n => n.type === 'router');
    
    routers.forEach((router, index) => {
      console.log(`\n   ${index + 1}. ${router.id}`);
      console.log(`      Label: ${router.data.label}`);
      
      const config = router.data.config || {};
      if (config.routes) {
        console.log(`      Rutas: ${config.routes.length}`);
        config.routes.forEach((route, i) => {
          console.log(`         ${String.fromCharCode(97 + i)}. ${route.label || 'Sin label'}`);
          if (route.condition) {
            console.log(`            Condición: ${route.condition}`);
          }
        });
      }
      
      // Buscar edges desde este router
      const edgesFromRouter = flow.edges.filter(e => e.source === router.id);
      console.log(`      Conexiones salientes: ${edgesFromRouter.length}`);
      edgesFromRouter.forEach(edge => {
        console.log(`         → ${edge.target} (${edge.label || 'sin label'})`);
        if (edge.data?.condition) {
          console.log(`            Condición: ${edge.data.condition}`);
        }
      });
    });
    
    // 4. Buscar nodo gpt-clasificador-inteligente
    console.log('\n\n🤖 NODO CLASIFICADOR:');
    const clasificador = flow.nodes.find(n => n.id === 'gpt-clasificador-inteligente');
    
    if (clasificador) {
      console.log(`   ID: ${clasificador.id}`);
      console.log(`   Label: ${clasificador.data.label}`);
      
      const config = clasificador.data.config || {};
      if (config.systemPrompt) {
        console.log('\n   SystemPrompt (primeras 500 chars):');
        console.log(`   ${config.systemPrompt.substring(0, 500)}...`);
      }
      
      if (config.extractionConfig?.variablesToExtract) {
        console.log('\n   Variables que extrae:');
        config.extractionConfig.variablesToExtract.forEach(v => {
          console.log(`      - ${v.nombre || v}: ${v.descripcion || 'Sin descripción'}`);
        });
      }
    }
    
    // 5. Buscar router-principal
    console.log('\n\n🔀 ROUTER PRINCIPAL:');
    const routerPrincipal = flow.nodes.find(n => n.id === 'router-principal');
    
    if (routerPrincipal) {
      console.log(`   ID: ${routerPrincipal.id}`);
      console.log(`   Label: ${routerPrincipal.data.label}`);
      
      const config = routerPrincipal.data.config || {};
      if (config.routes) {
        console.log(`\n   Rutas configuradas (${config.routes.length}):`);
        config.routes.forEach((route, i) => {
          console.log(`      ${String.fromCharCode(97 + i)}. ${route.label || 'Sin label'}`);
          console.log(`         Condición: ${route.condition || 'Sin condición'}`);
        });
      }
      
      // Buscar edges desde router-principal
      const edgesFromRP = flow.edges.filter(e => e.source === 'router-principal');
      console.log(`\n   Conexiones salientes (${edgesFromRP.length}):`);
      edgesFromRP.forEach(edge => {
        const targetNode = flow.nodes.find(n => n.id === edge.target);
        console.log(`      → ${edge.target}: ${targetNode?.data.label || 'N/A'}`);
        console.log(`         Label: ${edge.label || 'sin label'}`);
        if (edge.data?.condition) {
          console.log(`         Condición: ${edge.data.condition}`);
        }
      });
    }
    
    console.log('\n' + '═'.repeat(80));
    
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

analizarFlujoPago();
