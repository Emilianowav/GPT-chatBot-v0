import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function buscarFlujosConVariables() {
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
      console.log(`   Empresa: ${flow.empresaId?.toString() || 'N/A'}`);
      console.log(`   config.variables_globales: ${flow.config?.variables_globales ? '✅' : '❌'}`);
      if (flow.config?.variables_globales) {
        console.log(`   Total variables: ${Object.keys(flow.config.variables_globales).length}`);
      }
      console.log('');
    });
    
    // Filtrar flujos CON variables_globales
    const flujosConVariables = allFlows.filter(f => f.config?.variables_globales);
    
    console.log('═'.repeat(80));
    console.log('✅ FLUJOS CON VARIABLES GLOBALES');
    console.log('═'.repeat(80));
    console.log(`\nTotal: ${flujosConVariables.length}\n`);
    
    if (flujosConVariables.length > 0) {
      flujosConVariables.forEach((flow, i) => {
        console.log(`${i + 1}. ${flow.nombre}`);
        console.log(`   ID: ${flow._id.toString()}`);
        console.log(`   Variables (${Object.keys(flow.config.variables_globales).length}):`);
        Object.keys(flow.config.variables_globales).forEach(key => {
          console.log(`      - ${key}`);
        });
        console.log('');
      });
      
      // Mostrar estructura completa del primero
      const ejemplo = flujosConVariables[0];
      console.log('═'.repeat(80));
      console.log('📄 ESTRUCTURA COMPLETA DEL PRIMER FLUJO CON VARIABLES');
      console.log('═'.repeat(80));
      console.log('\nflow.config:');
      console.log(JSON.stringify(ejemplo.config, null, 2));
    } else {
      console.log('❌ No hay flujos con variables_globales configuradas');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

buscarFlujosConVariables();
