/**
 * Script para obtener la configuración completa de ICenter
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function main() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  
  // Buscar todas las configuraciones de API
  const configs = await db.collection('api_configurations').find({}).toArray();
  
  console.log(`\n📋 Total de configuraciones: ${configs.length}\n`);
  
  for (const config of configs) {
    console.log('='.repeat(80));
    console.log(`Nombre: ${config.nombre}`);
    console.log(`Empresa ID: ${config.empresaId}`);
    console.log(`Base URL: ${config.baseUrl}`);
    console.log(`Estado: ${config.estado}`);
    console.log(`\nEndpoints: ${config.endpoints?.length || 0}`);
    config.endpoints?.forEach((ep, i) => {
      console.log(`  ${i+1}. ${ep.metodo} ${ep.path} - ${ep.nombre} (ID: ${ep.id})`);
    });
    console.log(`\nWorkflows: ${config.workflows?.length || 0}`);
    config.workflows?.forEach((wf, i) => {
      console.log(`  ${i+1}. ${wf.nombre} (ID: ${wf.id})`);
      console.log(`     Trigger: ${wf.trigger?.tipo} - Keywords: ${wf.trigger?.keywords?.join(', ') || 'N/A'}`);
      console.log(`     Steps: ${wf.steps?.length || 0}`);
      wf.steps?.forEach((step, j) => {
        console.log(`       ${j+1}. [${step.tipo}] ${step.nombre || step.nombreVariable} - Endpoint: ${step.endpointId || 'N/A'}`);
      });
    });
    console.log('\n');
  }
  
  // Exportar la config de ICenter completa como JSON
  const icenterConfig = configs.find(c => c.nombre?.toLowerCase().includes('icenter'));
  if (icenterConfig) {
    console.log('\n📄 Configuración completa de ICenter (JSON):');
    console.log(JSON.stringify(icenterConfig, null, 2));
  }
  
  await mongoose.disconnect();
}

main();
