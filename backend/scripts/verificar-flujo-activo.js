import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function verificarFlujoActivo() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('chatbot_crm');
    const flowsCollection = db.collection('flows');
    
    const empresaId = new ObjectId('6940a9a181b92bfce970fdb5');
    const flow = await flowsCollection.findOne({ empresaId });
    
    if (!flow) {
      console.log('❌ Flujo no encontrado');
      return;
    }
    
    console.log('═'.repeat(80));
    console.log('🔍 ESTADO DEL FLUJO VEO VEO');
    console.log('═'.repeat(80));
    
    console.log('\n📋 Información básica:');
    console.log('  Nombre:', flow.nombre);
    console.log('  ID:', flow._id.toString());
    console.log('  Activo:', flow.activo ? '✅ SÍ' : '❌ NO');
    console.log('  Start Node:', flow.startNode);
    
    console.log('\n📊 Variables Globales:', flow.config?.variables_globales ? '✅ Configuradas' : '❌ No configuradas');
    if (flow.config?.variables_globales) {
      console.log('  Total:', Object.keys(flow.config.variables_globales).length);
      console.log('  productos_formateados:', flow.config.variables_globales.productos_formateados !== undefined ? '✅' : '❌');
    }
    
    console.log('\n📚 Tópicos:', flow.config?.topicos ? '✅ Configurados' : '❌ No configurados');
    if (flow.config?.topicos) {
      console.log('  Total:', Object.keys(flow.config.topicos).length);
    }
    
    console.log('\n🔗 Nodos:', flow.nodes?.length || 0);
    
    // Verificar nodo GPT asistente
    const gptNode = flow.nodes?.find(n => n.id === 'gpt-asistente-ventas');
    if (gptNode) {
      const prompt = gptNode.data?.config?.systemPrompt || '';
      console.log('\n🤖 Nodo GPT Asistente:');
      console.log('  Encontrado:', '✅');
      console.log('  Usa {{productos_formateados}}:', prompt.includes('{{productos_formateados}}') ? '✅ SÍ' : '❌ NO');
      console.log('  Model:', gptNode.data?.config?.model || 'No definido');
    }
    
    // Verificar nodo WooCommerce
    const wooNode = flow.nodes?.find(n => n.id === 'woocommerce');
    if (wooNode) {
      console.log('\n🛍️  Nodo WooCommerce:');
      console.log('  Encontrado:', '✅');
      console.log('  Tipo:', wooNode.data?.config?.tipo || 'No definido');
    }
    
    // Verificar webhook/watch-events
    const webhookNode = flow.nodes?.find(n => 
      n.type === 'whatsapp' && n.data?.config?.module === 'watch-events'
    );
    if (webhookNode) {
      console.log('\n📱 Nodo Webhook:');
      console.log('  Encontrado:', '✅');
      console.log('  Tipo:', webhookNode.type);
      console.log('  Module:', webhookNode.data?.config?.module);
    } else {
      console.log('\n⚠️  Nodo Webhook NO encontrado o mal configurado');
    }
    
    console.log('\n' + '═'.repeat(80));
    console.log('📝 RESUMEN');
    console.log('═'.repeat(80));
    
    const checks = [
      { name: 'Flujo activo', ok: flow.activo },
      { name: 'Variables globales', ok: !!flow.config?.variables_globales },
      { name: 'productos_formateados', ok: flow.config?.variables_globales?.productos_formateados !== undefined },
      { name: 'Tópicos', ok: !!flow.config?.topicos },
      { name: 'Nodo GPT usa variable', ok: gptNode?.data?.config?.systemPrompt?.includes('{{productos_formateados}}') },
      { name: 'Nodo WooCommerce', ok: !!wooNode },
      { name: 'Nodo Webhook', ok: !!webhookNode }
    ];
    
    console.log('\n✅ Checks:');
    checks.forEach(check => {
      console.log(`  ${check.ok ? '✅' : '❌'} ${check.name}`);
    });
    
    const todosOk = checks.every(c => c.ok);
    
    if (todosOk) {
      console.log('\n🎉 TODO ESTÁ CONFIGURADO CORRECTAMENTE');
      console.log('   El flujo está listo para probar');
      console.log('\n📱 Prueba enviando: "Busco García Márquez"');
    } else {
      console.log('\n⚠️  HAY PROBLEMAS DE CONFIGURACIÓN');
      console.log('   Revisa los checks marcados con ❌');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verificarFlujoActivo();
