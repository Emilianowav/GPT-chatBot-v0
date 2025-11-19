// 🎯 ROUTER UNIVERSAL - Decide qué flujo tiene prioridad
// Basado en arquitectura generalista: triggers, prioridades y contexto

import { ApiConfigurationModel } from '../modules/integrations/models/ApiConfiguration.js';
import { ChatbotModel } from '../models/Chatbot.js';
import { ContactoEmpresaModel } from '../models/ContactoEmpresa.js';
import type { IApiConfiguracion, IKeywordConfig } from '../modules/integrations/types/api.types.js';

/**
 * Tipos de flujos con sus prioridades
 */
export enum FlowPriority {
  EMERGENCY = 1,        // Notificaciones críticas
  MANDATORY = 2,        // Verificación, pagos, identidad
  API_WORKFLOW = 3,     // Workflows (flujos de múltiples APIs)
  API_KEYWORD = 4,      // Keywords de APIs configurables (endpoint único)
  GUIDED_FLOW = 5,      // Flujos guiados opcionales
  QUICK_QUESTION = 6,   // Preguntas rápidas
  CONVERSATIONAL = 7    // Conversacional general
}

/**
 * Resultado de evaluación del router
 */
export interface RouterDecision {
  action: 'continue_workflow' | 'start_workflow' | 'execute_api' | 'continue_flow' | 'start_flow' | 'conversational';
  priority: FlowPriority;
  handler?: string;
  metadata?: any;
}

/**
 * Contexto del mensaje entrante
 */
export interface MessageContext {
  mensaje: string;
  telefonoCliente: string;
  empresaId: string;
  chatbotId?: string;
  currentFlow?: string;
  currentStep?: number;
}

/**
 * Match de keyword detectada
 */
export interface KeywordMatch {
  keyword: IKeywordConfig;
  apiConfig: IApiConfiguracion;
  extractedParams: Record<string, any>;
  confidence: number;
}

/**
 * Match de workflow detectado
 */
export interface WorkflowMatch {
  workflow: any; // IWorkflow
  apiConfig: any;
  extractedParams: Record<string, any>;
  confidence: number;
}

/**
 * 🎯 ROUTER UNIVERSAL
 * Evalúa contexto, triggers y prioridades para decidir qué hacer con cada mensaje
 */
export class UniversalRouter {
  
  /**
   * Punto de entrada principal: evalúa el mensaje y decide la acción
   */
  async route(context: MessageContext): Promise<RouterDecision> {
    console.log('\n🎯 ========== ROUTER UNIVERSAL ==========');
    console.log('📨 Mensaje:', context.mensaje.substring(0, 100));
    console.log('👤 Cliente:', context.telefonoCliente);
    console.log('🏢 Empresa:', context.empresaId);
    
    // 0. Verificar si hay un workflow activo (máxima prioridad)
    const activeWorkflow = await this.checkActiveWorkflow(context);
    if (activeWorkflow) {
      console.log('🔄 Workflow activo detectado - continuando conversación');
      return {
        action: 'continue_workflow',
        priority: FlowPriority.API_WORKFLOW,
        handler: 'workflowConversationalHandler',
        metadata: activeWorkflow
      };
    }
    
    // 1. Evaluar workflows (prioridad 3 - mayor que keywords simples)
    const workflowMatch = await this.evaluateWorkflowTriggers(context);
    if (workflowMatch) {
      console.log('✅ Match de Workflow detectado');
      return {
        action: 'start_workflow',
        priority: FlowPriority.API_WORKFLOW,
        handler: 'workflowConversationalHandler',
        metadata: workflowMatch
      };
    }
    
    // 2. Evaluar triggers de API (prioridad 4)
    const apiMatch = await this.evaluateApiTriggers(context);
    if (apiMatch) {
      console.log('✅ Match de API keyword detectado');
      return {
        action: 'execute_api',
        priority: FlowPriority.API_KEYWORD,
        handler: 'apiKeywordHandler',
        metadata: apiMatch
      };
    }
    
    // 3. Si hay flujo activo, verificar si debe continuar
    if (context.currentFlow) {
      console.log('🔄 Flujo activo detectado:', context.currentFlow);
      return {
        action: 'continue_flow',
        priority: FlowPriority.GUIDED_FLOW,
        handler: 'flowManager'
      };
    }
    
    // 4. Default: conversacional
    console.log('💬 Redirigiendo a conversacional');
    return {
      action: 'conversational',
      priority: FlowPriority.CONVERSATIONAL,
      handler: 'gptConversational'
    };
  }
  
  /**
   * Verifica si el contacto tiene un workflow activo en progreso
   */
  private async checkActiveWorkflow(context: MessageContext): Promise<any | null> {
    try {
      // Buscar contacto por teléfono y empresa
      const contacto = await ContactoEmpresaModel.findOne({
        empresaId: context.empresaId,
        telefono: context.telefonoCliente
      });
      
      if (!contacto || !contacto.workflowState) {
        return null;
      }
      
      const workflowState = contacto.workflowState;
      
      // Buscar la API y el workflow
      const api = await ApiConfigurationModel.findById(workflowState.apiId);
      if (!api || !api.workflows) {
        return null;
      }
      
      const workflow = api.workflows.find((wf: any) => wf.id === workflowState.workflowId);
      if (!workflow) {
        return null;
      }
      
      console.log('✅ [ROUTER] Workflow activo encontrado:', {
        workflowId: workflowState.workflowId,
        pasoActual: workflowState.pasoActual,
        totalPasos: (workflow as any).steps.length
      });
      
      return {
        contactoId: contacto._id.toString(),
        workflowState,
        workflow,
        apiConfig: api
      };
      
    } catch (error) {
      console.error('❌ Error verificando workflow activo:', error);
      return null;
    }
  }
  
  /**
   * Evalúa si el mensaje coincide con algún workflow activo
   */
  private async evaluateWorkflowTriggers(context: MessageContext): Promise<WorkflowMatch | null> {
    try {
      // 1. Buscar chatbot de la empresa
      const chatbot = await ChatbotModel.findOne({
        empresaId: context.empresaId,
        activo: true
      });
      
      if (!chatbot) {
        return null;
      }
      
      // 2. Buscar APIs con workflows activos
      const apisConWorkflows = await ApiConfigurationModel.find({
        empresaId: context.empresaId,
        'workflows.0': { $exists: true }, // Tiene al menos un workflow
        'workflows.activo': true
      });
      
      console.log(`🔄 APIs con workflows: ${apisConWorkflows.length}`);
      
      if (apisConWorkflows.length === 0) {
        return null;
      }
      
      // 3. Buscar match de workflow por trigger
      const mensajeNormalizado = context.mensaje.toLowerCase().trim();
      
      // Ordenar workflows por prioridad (mayor a menor)
      const allWorkflows: Array<{ workflow: any; api: any }> = [];
      for (const api of apisConWorkflows) {
        if (!api.workflows || api.workflows.length === 0) continue;
        for (const workflow of api.workflows) {
          if ((workflow as any).activo) {
            allWorkflows.push({ workflow, api });
          }
        }
      }
      
      allWorkflows.sort((a, b) => {
        const prioA = (a.workflow as any).prioridad || 0;
        const prioB = (b.workflow as any).prioridad || 0;
        return prioB - prioA;
      });
      
      for (const { workflow, api } of allWorkflows) {
        const wf = workflow as any;
        
        // Verificar trigger
        if (!wf.trigger) continue;
        
        // Trigger tipo "keyword"
        if (wf.trigger.tipo === 'keyword' && wf.trigger.keywords) {
          for (const keyword of wf.trigger.keywords) {
            const keywordNormalizado = keyword.toLowerCase();
            
            if (mensajeNormalizado.includes(keywordNormalizado)) {
              console.log(`🔄 Workflow detectado por keyword: "${keyword}" en "${wf.nombre}"`);
              
              return {
                workflow,
                apiConfig: api,
                extractedParams: {},
                confidence: 1.0
              };
            }
          }
        }
        
        // Trigger tipo "primer_mensaje"
        if (wf.trigger.tipo === 'primer_mensaje' && wf.trigger.primeraRespuesta) {
          // Verificar si es el primer mensaje del contacto
          const contacto = await ContactoEmpresaModel.findOne({
            empresaId: context.empresaId,
            telefono: context.telefonoCliente
          });
          
          if (!contacto) {
            console.log('⚠️ Contacto no encontrado para verificar primer mensaje');
            continue;
          }
          
          // Verificar si es el primer mensaje:
          // 1. interacciones === 0 (aún no se ha procesado ningún mensaje)
          // 2. O el historial está vacío (contacto recién creado)
          const esPrimerMensaje = 
            contacto.metricas.interacciones === 0 || 
            !contacto.conversaciones?.historial || 
            contacto.conversaciones.historial.length === 0;
          
          if (esPrimerMensaje) {
            console.log(`🔄 Workflow detectado por primer mensaje: "${wf.nombre}"`);
            console.log(`   - Interacciones: ${contacto.metricas.interacciones}`);
            console.log(`   - Historial: ${contacto.conversaciones?.historial?.length || 0} mensajes`);
            
            return {
              workflow,
              apiConfig: api,
              extractedParams: {},
              confidence: 1.0
            };
          } else {
            console.log(`⏭️ No es primer mensaje (interacciones: ${contacto.metricas.interacciones}, historial: ${contacto.conversaciones?.historial?.length || 0})`);
          }
        }
      }
      
      return null;
      
    } catch (error) {
      console.error('❌ Error evaluando workflows:', error);
      return null;
    }
  }
  
  /**
   * Evalúa si el mensaje coincide con alguna keyword de API configurada
   */
  private async evaluateApiTriggers(context: MessageContext): Promise<KeywordMatch | null> {
    try {
      // 1. Buscar chatbot de la empresa
      const chatbot = await ChatbotModel.findOne({
        empresaId: context.empresaId,
        activo: true
      });
      
      if (!chatbot) {
        console.log('⚠️ No hay chatbot activo para esta empresa');
        return null;
      }
      
      console.log('🤖 Chatbot encontrado:', chatbot.nombre);
      
      // 2. Buscar APIs con integración habilitada para este chatbot
      const apisConIntegracion = await ApiConfigurationModel.find({
        empresaId: context.empresaId,
        'chatbotIntegration.habilitado': true,
        'chatbotIntegration.chatbotId': chatbot._id.toString()
      });
      
      console.log(`📋 APIs con integración: ${apisConIntegracion.length}`);
      
      if (apisConIntegracion.length === 0) {
        return null;
      }
      
      // 3. Buscar match de keyword
      const mensajeNormalizado = context.mensaje.toLowerCase().trim();
      
      for (const api of apisConIntegracion) {
        if (!api.chatbotIntegration?.keywords) continue;
        
        for (const keyword of api.chatbotIntegration.keywords) {
          const palabraNormalizada = keyword.palabra.toLowerCase();
          
          // Detección simple: palabra exacta o al inicio
          const isExactMatch = mensajeNormalizado === palabraNormalizada;
          const isStartMatch = mensajeNormalizado.startsWith(palabraNormalizada + ' ');
          
          if (isExactMatch || isStartMatch) {
            console.log(`🎯 Keyword detectada: "${keyword.palabra}" en API: ${api.nombre}`);
            
            // Log de auditoría de seguridad
            console.log('🔒 [AUDIT] Keyword match', {
              empresaId: context.empresaId,
              chatbotId: chatbot._id.toString(),
              apiId: (api as any)._id?.toString(),
              apiNombre: api.nombre,
              keyword: keyword.palabra,
              cliente: context.telefonoCliente,
              timestamp: new Date().toISOString()
            });
            
            // Extraer parámetros si está configurado
            const extractedParams = keyword.extraerParametros
              ? await this.extractParameters(context.mensaje, keyword)
              : {};
            
            return {
              keyword,
              apiConfig: api as any,
              extractedParams,
              confidence: isExactMatch ? 1.0 : 0.9
            };
          }
        }
      }
      
      console.log('❌ No se detectó ninguna keyword');
      return null;
      
    } catch (error) {
      console.error('❌ Error evaluando triggers de API:', error);
      return null;
    }
  }
  
  /**
   * Extrae parámetros del mensaje según la configuración de la keyword
   */
  private async extractParameters(
    mensaje: string,
    keyword: IKeywordConfig
  ): Promise<Record<string, any>> {
    const params: Record<string, any> = {};
    
    if (!keyword.parametrosConfig || keyword.parametrosConfig.length === 0) {
      return params;
    }
    
    for (const paramConfig of keyword.parametrosConfig) {
      if (paramConfig.extraerDe === 'fijo') {
        // Valor fijo
        params[paramConfig.nombre] = paramConfig.valorFijo;
        console.log(`  📌 Parámetro fijo: ${paramConfig.nombre} = ${paramConfig.valorFijo}`);
        
      } else if (paramConfig.extraerDe === 'mensaje' && paramConfig.regex) {
        // Extraer con regex
        try {
          const regex = new RegExp(paramConfig.regex, 'i');
          const match = mensaje.match(regex);
          
          if (match && match[1]) {
            params[paramConfig.nombre] = match[1].trim();
            console.log(`  🔍 Parámetro extraído: ${paramConfig.nombre} = ${match[1].trim()}`);
          } else {
            console.log(`  ⚠️ No se pudo extraer: ${paramConfig.nombre} (regex: ${paramConfig.regex})`);
          }
        } catch (error) {
          console.error(`  ❌ Error en regex para ${paramConfig.nombre}:`, error);
        }
      }
    }
    
    return params;
  }
  
  /**
   * Verifica si un trigger nuevo debe interrumpir el flujo actual
   */
  shouldInterrupt(currentPriority: FlowPriority, newPriority: FlowPriority): boolean {
    return newPriority < currentPriority;
  }
}

// Singleton
export const universalRouter = new UniversalRouter();
