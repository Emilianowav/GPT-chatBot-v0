import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function listarTodosFlujos() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('chatbot_crm');
    const flowsCollection = db.collection('flows');
    
    // Buscar TODOS los flujos
    const allFlows = await flowsCollection.find({}).toArray();
    
    console.log('═'.repeat(80));
    console.log('📋 TODOS LOS FLUJOS EN LA BD');
    console.log('═'.repeat(80));
    console.log(`\nTotal: ${allFlows.length}\n`);
    
    allFlows.forEach((flow, i) => {
      console.log(`${i + 1}. ${flow.nombre || 'Sin nombre'}`);
      console.log(`   ID: ${flow._id.toString()}`);
      console.log(`   Empresa: ${flow.empresaId?.toString() || flow.empresaId || 'N/A'}`);
      console.log(`   Activo: ${flow.activo ? '✅' : '❌'}`);
      console.log(`   Nodos: ${flow.nodes?.length || 0}`);
      console.log(`   config.variables_globales: ${flow.config?.variables_globales ? '✅ (' + Object.keys(flow.config.variables_globales).length + ')' : '❌'}`);
      console.log('');
    });
    
    console.log('═'.repeat(80));
    console.log('🔍 BUSCAR FLUJO ESPECÍFICO');
    console.log('═'.repeat(80));
    
    const flujoId = '695a156681f6d67f0ae9cf40';
    console.log(`\nBuscando: ${flujoId}`);
    
    const flujoEspecifico = allFlows.find(f => f._id.toString() === flujoId);
    
    if (flujoEspecifico) {
      console.log('✅ Encontrado:', flujoEspecifico.nombre);
    } else {
      console.log('❌ NO encontrado en la BD');
      console.log('\n⚠️  Este flujo NO existe en MongoDB');
      console.log('   Puede ser que:');
      console.log('   1. El flujo fue eliminado');
      console.log('   2. El flowId está guardado en localStorage del navegador');
      console.log('   3. Estás en una BD diferente');
    }
    
    console.log('\n' + '═'.repeat(80));
    console.log('💡 SOLUCIÓN');
    console.log('═'.repeat(80));
    
    if (allFlows.length > 0) {
      const flujoVeoVeo = allFlows.find(f => 
        f.nombre?.toLowerCase().includes('veo') || 
        f.empresaId?.toString() === '6940a9a181b92bfce970fdb5'
      );
      
      if (flujoVeoVeo) {
        console.log('\n✅ Flujo de VeoVeo encontrado:');
        console.log(`   Nombre: ${flujoVeoVeo.nombre}`);
        console.log(`   ID: ${flujoVeoVeo._id.toString()}`);
        console.log(`   Variables: ${flujoVeoVeo.config?.variables_globales ? '✅' : '❌'}`);
        
        console.log('\n📝 Usá esta URL:');
        console.log(`   http://localhost:3000/flow-builder?flowId=${flujoVeoVeo._id.toString()}`);
        
        if (!flujoVeoVeo.config?.variables_globales) {
          console.log('\n⚠️  Este flujo NO tiene variables_globales');
          console.log('   Voy a agregarlas...');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

listarTodosFlujos();
