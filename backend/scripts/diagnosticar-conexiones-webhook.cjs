/**
 * Script para Diagnosticar Conexiones del Webhook
 * 
 * PROBLEMA: El mensaje no pasa por el clasificador
 * 
 * FECHA: 2026-01-15
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function diagnosticarConexiones() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    
    const db = client.db('neural_chatbot');
    const flow = await db.collection('flows').findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      throw new Error(`Flujo ${FLOW_ID} no encontrado`);
    }
    
    console.log('\n📊 Flujo:', flow.nombre);
    console.log(`   Nodos: ${flow.nodes.length}`);
    console.log(`   Edges: ${flow.edges.length}`);
    
    // Encontrar el webhook/trigger
    const trigger = flow.nodes.find(n => n.type === 'trigger' || n.id.includes('webhook'));
    
    if (!trigger) {
      console.log('\n❌ No se encontró el trigger/webhook');
      return;
    }
    
    console.log(`\n🔍 Trigger encontrado: ${trigger.id}`);
    
    // Encontrar TODAS las conexiones que salen del trigger
    const conexionesTrigger = flow.edges.filter(e => e.source === trigger.id);
    
    console.log(`\n📋 Conexiones que salen del trigger (${conexionesTrigger.length}):`);
    conexionesTrigger.forEach((edge, index) => {
      const targetNode = flow.nodes.find(n => n.id === edge.target);
      console.log(`   ${index + 1}. ${trigger.id} → ${edge.target}`);
      console.log(`      Target tipo: ${targetNode?.type || 'NO ENCONTRADO'}`);
      console.log(`      Target label: ${targetNode?.data?.label || 'N/A'}`);
      console.log(`      Edge ID: ${edge.id}`);
      console.log(`      Condition: ${edge.data?.condition || 'ninguna'}`);
      console.log('');
    });
    
    // Verificar si hay conexión directa a formateador
    const conexionDirectaFormateador = conexionesTrigger.find(e => {
      const target = flow.nodes.find(n => n.id === e.target);
      return target?.type === 'gpt' && target?.data?.config?.tipo === 'formateador';
    });
    
    if (conexionDirectaFormateador) {
      console.log('⚠️  PROBLEMA ENCONTRADO:');
      console.log('   Hay una conexión DIRECTA del trigger al formateador');
      console.log('   Esto hace que el clasificador sea ignorado');
      console.log('');
      console.log('   Conexión problemática:');
      console.log(`   ${conexionDirectaFormateador.source} → ${conexionDirectaFormateador.target}`);
      console.log(`   ID: ${conexionDirectaFormateador.id}`);
    }
    
    // Verificar si hay conexión al clasificador
    const conexionClasificador = conexionesTrigger.find(e => 
      e.target === 'gpt-clasificador-inteligente'
    );
    
    if (conexionClasificador) {
      console.log('✅ Hay conexión al clasificador');
    } else {
      console.log('❌ NO hay conexión al clasificador');
    }
    
    // SOLUCIÓN
    console.log('\n' + '='.repeat(60));
    console.log('💡 SOLUCIÓN');
    console.log('='.repeat(60));
    
    if (conexionDirectaFormateador && !conexionClasificador) {
      console.log('\nDebe eliminarse la conexión directa al formateador');
      console.log('y asegurarse de que SOLO exista:');
      console.log('   Trigger → Clasificador');
      console.log('');
      console.log('Luego el clasificador decide:');
      console.log('   Clasificador → Router Principal → Formateador (buscar)');
      console.log('   Clasificador → Router Principal → Armar Carrito (comprar)');
    } else if (conexionDirectaFormateador && conexionClasificador) {
      console.log('\nHay DOS conexiones saliendo del trigger:');
      console.log('   1. Trigger → Clasificador ✅');
      console.log('   2. Trigger → Formateador ❌ (debe eliminarse)');
      console.log('');
      console.log('El trigger solo debe tener UNA salida hacia el clasificador');
    } else if (!conexionClasificador) {
      console.log('\nFalta la conexión: Trigger → Clasificador');
      console.log('Debe agregarse esta conexión');
    } else {
      console.log('\n✅ Las conexiones están correctas');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
diagnosticarConexiones()
  .then(() => {
    console.log('\n✅ Diagnóstico completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Diagnóstico falló:', error);
    process.exit(1);
  });
