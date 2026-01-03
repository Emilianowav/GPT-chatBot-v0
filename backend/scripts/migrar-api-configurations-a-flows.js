import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

/**
 * 🔄 MIGRACIÓN DE api_configurations A FLOWS UNIFICADO
 * 
 * Convierte workflows de api_configurations al nuevo sistema de flows
 * manteniendo compatibilidad con el sistema antiguo.
 */

// Mapeo de tipos de paso a tipos de nodo
const STEP_TYPE_TO_NODE_TYPE = {
  'recopilar': 'recopilar',
  'input': 'input',
  'confirmacion': 'menu',
  'consulta_filtrada': 'consulta_filtrada',
  'validar': 'input'
};

// Mapeo de tipos de validación
const VALIDATION_TYPE_MAP = {
  'texto': 'text',
  'numero': 'number',
  'opcion': 'opcion',
  'email': 'email',
  'phone': 'phone',
  'regex': 'regex'
};

async function migrarWorkflowAFlow(api, workflow, empresaId) {
  const db = mongoose.connection.db;
  
  console.log(`\n🔄 Migrando workflow: ${workflow.nombre}`);
  
  // 1. Crear Flow
  const flowId = workflow.id || workflow.nombre.toLowerCase().replace(/\s+/g, '_');
  
  const flow = {
    empresaId,
    id: flowId,
    nombre: workflow.nombre,
    descripcion: workflow.descripcion || `Workflow migrado desde ${api.nombre}`,
    categoria: determinarCategoria(workflow.nombre),
    
    // Tipo de bot
    botType: 'pasos',
    pasosSubType: 'api',
    
    // Configuración de API
    apiConfig: {
      apiConfigurationId: api._id,
      workflowId: workflow.id,
      baseUrl: api.baseUrl,
      endpoints: api.endpoints.map(ep => ({
        id: ep.id,
        nombre: ep.nombre,
        metodo: ep.metodo,
        path: ep.path
      }))
    },
    
    startNode: '', // Se asignará después de crear nodos
    
    triggers: {
      keywords: workflow.trigger?.keywords || [],
      patterns: [],
      priority: workflow.prioridad || 0,
      primeraRespuesta: workflow.trigger?.primeraRespuesta || false
    },
    
    settings: {
      timeout: 300,
      maxRetries: 3,
      enableGPT: false,
      saveHistory: true,
      permitirAbandonar: workflow.permitirAbandonar !== false,
      timeoutMinutos: workflow.timeoutMinutos || 30
    },
    
    activo: workflow.activo !== false,
    version: 1,
    createdBy: 'migration_script',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // 2. Crear FlowNodes desde steps
  const nodes = [];
  const steps = workflow.steps || [];
  
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const nextStep = steps[i + 1];
    
    const nodeId = `step_${step.orden || i + 1}`;
    const nextNodeId = nextStep ? `step_${nextStep.orden || i + 2}` : null;
    
    const node = {
      empresaId,
      flowId,
      id: nodeId,
      type: STEP_TYPE_TO_NODE_TYPE[step.tipo] || 'input',
      name: step.nombre || `Paso ${step.orden || i + 1}`,
      message: step.pregunta || '',
      
      // Variable de recopilación
      nombreVariable: step.nombreVariable,
      
      // Validación
      validation: step.validacion ? {
        type: VALIDATION_TYPE_MAP[step.validacion.tipo] || step.validacion.tipo,
        opciones: step.validacion.opciones,
        min: step.validacion.min,
        max: step.validacion.max,
        pattern: step.validacion.regex,
        mensajeError: step.validacion.mensajeError || step.mensajeError
      } : undefined,
      
      // Configuración de endpoint
      endpointId: step.endpointId,
      endpointResponseConfig: step.endpointResponseConfig,
      plantillaOpciones: step.plantillaOpciones,
      mensajeSinResultados: step.mensajeSinResultados,
      permitirVolverAlMenu: step.permitirVolverAlMenu,
      mensajeVolverAlMenu: step.mensajeVolverAlMenu,
      
      // Siguiente nodo
      next: nextNodeId,
      
      // Metadata
      metadata: {
        orden: step.orden || i + 1,
        description: step.descripcion,
        position: {
          x: 100 + (i % 3) * 300,
          y: 100 + Math.floor(i / 3) * 200
        }
      },
      
      activo: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Manejar opciones para nodos tipo menu/confirmacion
    if (step.tipo === 'confirmacion' && step.validacion?.opciones) {
      node.options = step.validacion.opciones.map((opt, idx) => ({
        text: opt,
        value: opt,
        next: idx === 0 ? nextNodeId : null // Primera opción continúa, otras pueden terminar
      }));
    }
    
    nodes.push(node);
  }
  
  // Asignar startNode
  if (nodes.length > 0) {
    flow.startNode = nodes[0].id;
  }
  
  // 3. Insertar en base de datos
  try {
    // Verificar si ya existe
    const existingFlow = await db.collection('flows').findOne({
      empresaId,
      id: flowId
    });
    
    if (existingFlow) {
      console.log(`   ⚠️  Flow ya existe: ${flowId}`);
      return { flow: existingFlow, nodes: [], skipped: true };
    }
    
    // Insertar flow
    const flowResult = await db.collection('flows').insertOne(flow);
    console.log(`   ✅ Flow creado: ${flowId}`);
    
    // Insertar nodos
    if (nodes.length > 0) {
      await db.collection('flownodes').insertMany(nodes);
      console.log(`   ✅ ${nodes.length} nodos creados`);
    }
    
    return { flow, nodes, skipped: false };
    
  } catch (error) {
    console.error(`   ❌ Error migrando workflow:`, error.message);
    return { flow: null, nodes: [], error };
  }
}

function determinarCategoria(nombre) {
  const nombreLower = nombre.toLowerCase();
  
  if (nombreLower.includes('venta') || nombreLower.includes('compra') || nombreLower.includes('libro')) {
    return 'ventas';
  }
  if (nombreLower.includes('soporte') || nombreLower.includes('ayuda')) {
    return 'soporte';
  }
  if (nombreLower.includes('reserva') || nombreLower.includes('cancha') || nombreLower.includes('turno')) {
    return 'reservas';
  }
  if (nombreLower.includes('información') || nombreLower.includes('info') || nombreLower.includes('consulta')) {
    return 'informacion';
  }
  
  return 'otro';
}

async function migrarTodosLosWorkflows() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    const db = mongoose.connection.db;
    
    // Obtener todas las API configurations
    const apis = await db.collection('api_configurations').find({}).toArray();
    
    console.log(`📋 APIs encontradas: ${apis.length}\n`);
    
    let totalFlows = 0;
    let totalNodes = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const api of apis) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📦 API: ${api.nombre}`);
      console.log(`   Empresa: ${api.empresaId}`);
      console.log(`   Workflows: ${api.workflows?.length || 0}`);
      
      if (!api.workflows || api.workflows.length === 0) {
        console.log('   ⚠️  Sin workflows para migrar');
        continue;
      }
      
      // Obtener empresa
      const empresa = await db.collection('empresas').findOne({ _id: api.empresaId });
      const empresaId = empresa?.nombre || api.empresaId.toString();
      
      for (const workflow of api.workflows) {
        const result = await migrarWorkflowAFlow(api, workflow, empresaId);
        
        if (result.skipped) {
          skipped++;
        } else if (result.error) {
          errors++;
        } else {
          totalFlows++;
          totalNodes += result.nodes.length;
        }
      }
    }
    
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RESUMEN DE MIGRACIÓN');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Flows creados: ${totalFlows}`);
    console.log(`✅ Nodos creados: ${totalNodes}`);
    console.log(`⚠️  Flows omitidos (ya existían): ${skipped}`);
    console.log(`❌ Errores: ${errors}`);
    
    await mongoose.disconnect();
    console.log('\n✅ Migración completada');
    
  } catch (error) {
    console.error('❌ Error en migración:', error);
    process.exit(1);
  }
}

// Ejecutar migración
migrarTodosLosWorkflows();
