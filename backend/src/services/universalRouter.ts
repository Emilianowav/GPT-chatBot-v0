// 🎯 ROUTER UNIVERSAL - Decide qué flujo tiene prioridad
// Basado en arquitectura generalista: triggers, prioridades y contexto

import { ApiConfigurationModel } from '../modules/integrations/models/ApiConfiguration.js';
import { ChatbotModel } from '../models/Chatbot.js';
import type { IApiConfiguracion, IKeywordConfig } from '../modules/integrations/types/api.types.js';

/**
 * Tipos de flujos con sus prioridades
 */
export enum FlowPriority {
  EMERGENCY = 1,        // Notificaciones críticas
  MANDATORY = 2,        // Verificación, pagos, identidad
  API_KEYWORD = 3,      // Keywords de APIs configurables
  GUIDED_FLOW = 4,      // Flujos guiados opcionales
  QUICK_QUESTION = 5,   // Preguntas rápidas
  CONVERSATIONAL = 6    // Conversacional general
}

/**
 * Resultado de evaluación del router
 */
export interface RouterDecision {
  action: 'execute_api' | 'continue_flow' | 'start_flow' | 'conversational';
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
    
    // 1. Evaluar triggers de API (prioridad 3)
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
    
    // 2. Si hay flujo activo, verificar si debe continuar
    if (context.currentFlow) {
      console.log('🔄 Flujo activo detectado:', context.currentFlow);
      return {
        action: 'continue_flow',
        priority: FlowPriority.GUIDED_FLOW,
        handler: 'flowManager'
      };
    }
    
    // 3. Default: conversacional
    console.log('💬 Redirigiendo a conversacional');
    return {
      action: 'conversational',
      priority: FlowPriority.CONVERSATIONAL,
      handler: 'gptConversational'
    };
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
