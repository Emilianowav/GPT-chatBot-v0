// Script para migrar workflows de Veo Veo a flows visuales
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;
const EMPRESA_ID = '6940a9a181b92bfce970fdb5'; // Veo Veo
const API_CONFIG_ID = '695320fda03785dacc8d950b'; // WooCommerce API

async function main() {
  try {
    console.log('🚀 Migrando workflows de Veo Veo a flows visuales...\n');
    
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;
    const workflowsCollection = db.collection('workflows');
    const flowsCollection = db.collection('flows');
    
    // Obtener workflows de Veo Veo
    const workflows = await workflowsCollection.find({ empresaId: EMPRESA_ID }).toArray();
    console.log(`📋 Workflows encontrados: ${workflows.length}\n`);
    
    let migrados = 0;
    
    for (const workflow of workflows) {
      console.log(`🔄 Migrando: ${workflow.nombre}`);
      
      // Verificar si ya existe como flow visual
      const existingFlow = await flowsCollection.findOne({
        empresaId: EMPRESA_ID,
        id: workflow.id,
        botType: 'visual'
      });
      
      if (existingFlow) {
        console.log(`   ⏭️  Ya existe como flow visual, saltando...\n`);
        continue;
      }
      
      // Crear nodos visuales basados en los pasos del workflow
      const nodes = [];
      const edges = [];
      let yPosition = 100;
      
      workflow.pasos.forEach((paso, index) => {
        const nodeId = `node-${index}`;
        
        // Determinar tipo de nodo
        let nodeType = 'whatsapp';
        if (paso.endpointId) {
          nodeType = 'woocommerce';
        } else if (paso.workflowsSiguientes && paso.workflowsSiguientes.length > 1) {
          nodeType = 'router';
        }
        
        nodes.push({
          id: nodeId,
          type: nodeType,
          position: { x: 400, y: yPosition },
          data: {
            label: paso.mensaje || paso.nombre || `Paso ${index + 1}`,
            config: {
              mensaje: paso.mensaje,
              tipo: paso.tipo,
              endpointId: paso.endpointId,
              variable: paso.variable,
              validacion: paso.validacion,
              workflowsSiguientes: paso.workflowsSiguientes
            }
          }
        });
        
        // Crear edge al nodo siguiente
        if (index < workflow.pasos.length - 1) {
          edges.push({
            id: `edge-${index}`,
            source: nodeId,
            target: `node-${index + 1}`,
            type: 'simple'
          });
        }
        
        yPosition += 150;
      });
      
      // Crear flow visual
      const flowVisual = {
        empresaId: EMPRESA_ID,
        id: workflow.id,
        nombre: workflow.nombre,
        descripcion: workflow.descripcion || `Flow visual migrado de workflow ${workflow.nombre}`,
        categoria: workflow.categoria || 'otro',
        botType: 'visual',
        startNode: nodes.length > 0 ? nodes[0].id : '',
        variables: workflow.variables || {},
        triggers: {
          keywords: workflow.triggers?.keywords || [],
          patterns: workflow.triggers?.patterns || [],
          priority: workflow.triggers?.priority || 0,
          primeraRespuesta: workflow.triggers?.primeraRespuesta || false
        },
        nodes: nodes,
        edges: edges,
        settings: {
          timeout: 300,
          maxRetries: 3,
          enableGPT: false,
          saveHistory: true
        },
        activo: workflow.activo !== false,
        version: 1,
        createdBy: 'migration-script',
        createdAt: workflow.createdAt || new Date(),
        updatedAt: new Date()
      };
      
      await flowsCollection.insertOne(flowVisual);
      migrados++;
      
      console.log(`   ✅ Flow visual creado`);
      console.log(`      - Nodos: ${nodes.length}`);
      console.log(`      - Edges: ${edges.length}\n`);
    }
    
    console.log(`\n✅ Migración completada`);
    console.log(`   Total migrados: ${migrados}/${workflows.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
  }
}

main();
