// Script de migración de workflows de Veo Veo al nuevo sistema de Flow Builder
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;
const EMPRESA_ID = '6940a9a181b92bfce970fdb5'; // Veo Veo
const API_CONFIG_ID = '695320fda03785dacc8d950b'; // WooCommerce API

// Mapeo de tipos de steps a tipos de nodos
const STEP_TYPE_TO_NODE_TYPE = {
  'recopilar': 'whatsapp',
  'consulta_filtrada': 'woocommerce',
  'confirmacion': 'router',
  'validar': 'whatsapp'
};

// Mapeo de colores por tipo de nodo
const NODE_COLORS = {
  'whatsapp': '#25D366',
  'woocommerce': '#96588a',
  'router': '#f59e0b',
  'mercadopago': '#009ee3'
};

async function main() {
  try {
    console.log('🚀 Iniciando migración de Veo Veo al Flow Builder...');
    
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    const db = mongoose.connection.db;
    
    // Obtener API configuration de Veo Veo
    const apiConfigsCollection = db.collection('api_configurations');
    const apiConfig = await apiConfigsCollection.findOne({ _id: new mongoose.Types.ObjectId(API_CONFIG_ID) });
    
    if (!apiConfig) {
      throw new Error('API Configuration de Veo Veo no encontrada');
    }
    
    console.log('📦 API Config encontrada:', apiConfig.nombre);
    console.log('📋 Workflows a migrar:', apiConfig.workflows.length);

    // Crear flow principal
    const flowsCollection = db.collection('flows');
    
    // Migrar cada workflow
    for (const workflow of apiConfig.workflows) {
      console.log(`\n🔄 Migrando workflow: ${workflow.nombre}`);
      
      const { nodes, edges } = convertWorkflowToFlow(workflow, apiConfig);
      
      const flow = {
        nombre: workflow.nombre,
        descripcion: workflow.descripcion,
        empresaId: EMPRESA_ID,
        activo: workflow.activo,
        nodes,
        edges,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Insertar flow
      const result = await flowsCollection.insertOne(flow);
      console.log(`✅ Flow creado: ${result.insertedId}`);
      console.log(`   - Nodos: ${nodes.length}`);
      console.log(`   - Edges: ${edges.length}`);
    }

    console.log('\n✅ Migración completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB');
  }
}

function convertWorkflowToFlow(workflow, apiConfig) {
  const nodes = [];
  const edges = [];
  let yPosition = 100;
  const xPosition = 400;
  const ySpacing = 200;

  // Crear nodo trigger si es primer_mensaje
  if (workflow.trigger?.tipo === 'primer_mensaje') {
    const triggerNode = {
      id: 'node_trigger',
      type: 'whatsapp',
      position: { x: xPosition, y: yPosition },
      data: {
        label: 'WhatsApp - Recibir Mensaje',
        subtitle: 'Watch Events',
        executionCount: 1,
        hasConnection: true,
        config: {
          tipo: 'trigger',
          evento: 'primer_mensaje',
          mensajeInicial: workflow.mensajeInicial || 'Hola 👋'
        }
      }
    };
    nodes.push(triggerNode);
    yPosition += ySpacing;
  }

  // Convertir cada step a nodo
  workflow.steps.forEach((step, index) => {
    const nodeId = `node_${index}`;
    const nodeType = STEP_TYPE_TO_NODE_TYPE[step.tipo] || 'whatsapp';
    
    const node = {
      id: nodeId,
      type: nodeType,
      position: { x: xPosition, y: yPosition },
      data: {
        label: step.nombre,
        subtitle: step.tipo,
        executionCount: index + 2,
        hasConnection: index < workflow.steps.length - 1,
        config: convertStepConfig(step, apiConfig)
      }
    };
    
    nodes.push(node);
    
    // Crear edge al nodo anterior
    if (index === 0 && nodes.length > 1) {
      // Edge desde trigger
      edges.push({
        id: `edge_trigger_${nodeId}`,
        source: 'node_trigger',
        target: nodeId,
        type: 'simple',
        data: { color: NODE_COLORS[nodeType] }
      });
    } else if (index > 0) {
      // Edge desde step anterior
      const prevNodeId = `node_${index - 1}`;
      edges.push({
        id: `edge_${prevNodeId}_${nodeId}`,
        source: prevNodeId,
        target: nodeId,
        type: 'simple',
        data: { color: NODE_COLORS[nodeType] }
      });
    }
    
    yPosition += ySpacing;
  });

  // Manejar workflowsSiguientes como Router
  if (workflow.workflowsSiguientes) {
    const routerNode = {
      id: 'node_router',
      type: 'router',
      position: { x: xPosition, y: yPosition },
      data: {
        label: 'Router',
        subtitle: 'Múltiples opciones',
        executionCount: nodes.length + 1,
        hasConnection: true,
        config: {
          opciones: workflow.workflowsSiguientes.workflows.map(w => ({
            valor: w.opcion,
            label: `Opción ${w.opcion}`,
            workflowId: w.workflowId
          }))
        }
      }
    };
    
    nodes.push(routerNode);
    
    // Edge desde último step al router
    if (workflow.steps.length > 0) {
      const lastStepId = `node_${workflow.steps.length - 1}`;
      edges.push({
        id: `edge_${lastStepId}_router`,
        source: lastStepId,
        target: 'node_router',
        type: 'simple',
        data: { color: NODE_COLORS.router }
      });
    }
  }

  return { nodes, edges };
}

function convertStepConfig(step, apiConfig) {
  const config = {
    tipo: step.tipo,
    pregunta: step.pregunta,
    nombreVariable: step.nombreVariable
  };

  // Validación
  if (step.validacion) {
    config.validacion = step.validacion;
  }

  // Configuración de API call
  if (step.tipo === 'consulta_filtrada') {
    config.apiConfigId = API_CONFIG_ID;
    config.endpointId = step.endpointId;
    config.parametros = {};
    
    // Mapear parámetros
    if (step.mapeoParametros) {
      for (const [key, value] of Object.entries(step.mapeoParametros)) {
        if (value.origen === 'variable') {
          config.parametros[key] = `{{${value.nombreVariable}}}`;
        } else {
          config.parametros[key] = value.valor;
        }
      }
    }
    
    // Response config
    if (step.endpointResponseConfig) {
      config.responseConfig = step.endpointResponseConfig;
    }
    
    // Mensaje sin resultados
    if (step.mensajeSinResultados) {
      config.mensajeSinResultados = step.mensajeSinResultados;
    }
  }

  return config;
}

main();
