// Script para convertir flows existentes de Veo Veo a formato visual
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;
const EMPRESA_ID = '6940a9a181b92bfce970fdb5'; // Veo Veo

async function main() {
  try {
    console.log('🚀 Convirtiendo flows de Veo Veo a formato visual...\n');
    
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;
    const flowsCollection = db.collection('flows');
    
    // Buscar flows de Veo Veo que NO sean visuales
    const flows = await flowsCollection.find({
      empresaId: EMPRESA_ID,
      botType: { $ne: 'visual' }
    }).toArray();
    
    console.log(`📋 Flows encontrados para convertir: ${flows.length}\n`);
    
    for (const flow of flows) {
      console.log(`🔄 Convirtiendo: ${flow.nombre}`);
      
      // Crear versión visual del flow
      const nodes = [];
      const edges = [];
      let yPosition = 100;
      
      // Nodo inicial
      nodes.push({
        id: 'start-node',
        type: 'whatsapp',
        position: { x: 400, y: yPosition },
        data: {
          label: flow.nombre,
          config: {
            mensaje: `Inicio del flujo: ${flow.nombre}`,
            triggers: flow.triggers
          }
        }
      });
      
      yPosition += 150;
      
      // Agregar nodo de configuración si tiene apiConfig
      if (flow.apiConfig) {
        nodes.push({
          id: 'api-config-node',
          type: 'woocommerce',
          position: { x: 400, y: yPosition },
          data: {
            label: 'Configuración WooCommerce',
            config: {
              apiConfigId: flow.apiConfig.apiConfigurationId?.toString(),
              baseUrl: flow.apiConfig.baseUrl
            }
          }
        });
        
        edges.push({
          id: 'edge-start-api',
          source: 'start-node',
          target: 'api-config-node',
          type: 'simple'
        });
        
        yPosition += 150;
      }
      
      // Actualizar el flow a visual
      await flowsCollection.updateOne(
        { _id: flow._id },
        {
          $set: {
            botType: 'visual',
            nodes: nodes,
            edges: edges,
            updatedAt: new Date()
          }
        }
      );
      
      console.log(`   ✅ Convertido a visual`);
      console.log(`      - Nodos: ${nodes.length}`);
      console.log(`      - Edges: ${edges.length}\n`);
    }
    
    console.log(`\n✅ Conversión completada`);
    console.log(`   Total convertidos: ${flows.length}`);
    
    // Mostrar flows visuales finales
    const visualFlows = await flowsCollection.find({
      empresaId: EMPRESA_ID,
      botType: 'visual'
    }).toArray();
    
    console.log(`\n📦 Flows visuales de Veo Veo:`);
    visualFlows.forEach((f, i) => {
      console.log(`   ${i + 1}. ${f.nombre} (ID: ${f._id})`);
      console.log(`      - Nodos: ${f.nodes?.length || 0}`);
      console.log(`      - Edges: ${f.edges?.length || 0}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
  }
}

main();
