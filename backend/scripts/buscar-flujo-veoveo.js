import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function buscarFlujo() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('chatbot_crm');
    const flowsCollection = db.collection('flows');
    
    // Buscar todos los flujos
    const flows = await flowsCollection.find({}).toArray();
    
    console.log(`📋 Total de flujos: ${flows.length}\n`);
    
    flows.forEach((flow, index) => {
      console.log(`${index + 1}. ${flow.nombre || 'Sin nombre'} (ID: ${flow._id})`);
      console.log(`   Empresa: ${flow.empresaId}`);
      console.log(`   Nodos: ${flow.nodes?.length || 0}`);
      console.log('');
    });
    
    // Buscar flujos de Veo Veo
    const veoVeoFlows = flows.filter(f => 
      f.nombre?.toLowerCase().includes('veo') || 
      f.empresaId?.toString() === '6940a9a181b92bfce970fdb5'
    );
    
    console.log(`\n🔍 Flujos de Veo Veo encontrados: ${veoVeoFlows.length}`);
    veoVeoFlows.forEach(flow => {
      console.log(`\n📝 ${flow.nombre}`);
      console.log(`   ID: ${flow._id}`);
      console.log(`   Empresa: ${flow.empresaId}`);
      
      // Buscar nodo gpt-asistente-ventas
      const gptAsistente = flow.nodes?.find(n => n.id === 'gpt-asistente-ventas');
      if (gptAsistente) {
        console.log(`   ✅ Tiene nodo gpt-asistente-ventas`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

buscarFlujo();
