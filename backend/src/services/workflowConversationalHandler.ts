// 🔄 WORKFLOW CONVERSATIONAL HANDLER
// Maneja workflows conversacionales paso a paso

import { workflowConversationManager } from './workflowConversationManager.js';
import { apiExecutor } from '../modules/integrations/services/apiExecutor.js';
import type { IWorkflow, IWorkflowStep } from '../modules/integrations/types/api.types.js';

/**
 * Resultado de procesamiento de workflow conversacional
 */
export interface WorkflowConversationalResult {
  success: boolean;
  response: string;
  completed: boolean;  // Si el workflow se completó
  error?: string;
  metadata?: {
    workflowName: string;
    pasoActual: number;
    totalPasos: number;
    datosRecopilados?: Record<string, any>;
  };
}

/**
 * Metadata del workflow activo
 */
export interface WorkflowActiveMetadata {
  contactoId: string;
  workflowState: any;
  workflow: IWorkflow;
  apiConfig: any;
}

/**
 * Metadata para iniciar workflow
 */
export interface WorkflowStartMetadata {
  workflow: IWorkflow;
  apiConfig: any;
  extractedParams: Record<string, any>;
  confidence: number;
}

/**
 * 🔄 HANDLER DE WORKFLOWS CONVERSACIONALES
 * Gestiona la conversación paso a paso con el usuario
 */
export class WorkflowConversationalHandler {
  
  /**
   * Obtiene datos siguiendo una ruta de propiedades (ej: "data.items" o "results")
   */
  private obtenerDatosPorRuta(objeto: any, ruta: string): any {
    if (!ruta || !objeto) return objeto;
    
    const partes = ruta.split('.');
    let resultado = objeto;
    
    for (const parte of partes) {
      if (resultado && typeof resultado === 'object' && parte in resultado) {
        resultado = resultado[parte];
      } else {
        return null;
      }
    }
    
    return resultado;
  }
  
  /**
   * Extrae opciones dinámicas de los datos de la API
   */
  private extraerOpcionesDinamicas(datos: any[], config: any): string[] {
    if (!Array.isArray(datos) || !config) {
      return [];
    }
    
    try {
      return datos.map(item => {
        const id = item[config.idField] || item.id;
        const display = item[config.displayField] || item.name || item.nombre;
        return `${id}: ${display}`;
      });
    } catch (error) {
      console.error('❌ Error extrayendo opciones dinámicas:', error);
      return [];
    }
  }
  
  /**
   * Inicia un nuevo workflow
   */
  async startWorkflow(
    contactoId: string,
    metadata: WorkflowStartMetadata
  ): Promise<WorkflowConversationalResult> {
    try {
      const { workflow, apiConfig } = metadata;
      
      console.log('\n🔄 ========== INICIANDO WORKFLOW ==========');
      console.log('📋 Workflow:', workflow.nombre);
      console.log('👤 Contacto:', contactoId);
      console.log('📊 Total pasos:', workflow.steps.length);
      
      // Iniciar workflow
      await workflowConversationManager.startWorkflow(
        contactoId,
        workflow.id!,
        apiConfig._id.toString()
      );
      
      // Construir mensaje inicial
      let response = '';
      if (workflow.mensajeInicial) {
        response += workflow.mensajeInicial + '\n\n';
      }
      
      // Ejecutar pasos de tipo "ejecutar" antes del primer paso de recopilación
      const pasosOrdenados = workflow.steps.sort((a, b) => a.orden - b.orden);
      let datosEjecutados: Record<string, any> = {};
      
      console.log('🔍 Ejecutando pasos iniciales...');
      
      for (const paso of pasosOrdenados) {
        if (paso.tipo === 'ejecutar' && paso.orden <= 1) {
          console.log(`⚡ Ejecutando paso ${paso.orden}: ${paso.nombreVariable}`);
          
          try {
            // Ejecutar llamada a la API
            const resultadoAPI = await apiExecutor.ejecutar(
              apiConfig._id.toString(),
              paso.endpointId!,
              {}, // Sin parámetros para el primer paso
              { metadata: { contactoId } }
            );
            
            if (resultadoAPI.success && resultadoAPI.data) {
              datosEjecutados[paso.nombreVariable] = resultadoAPI.data;
              console.log(`✅ Datos obtenidos para ${paso.nombreVariable}:`, resultadoAPI.data);
            }
          } catch (error) {
            console.error(`❌ Error ejecutando paso ${paso.orden}:`, error);
          }
        }
      }
      
      // Obtener primer paso de recopilación
      const primerPasoRecopilar = pasosOrdenados.find(s => s.tipo === 'recopilar');
      if (!primerPasoRecopilar) {
        return {
          success: false,
          response: '❌ Error: El workflow no tiene pasos de recopilación configurados',
          completed: false,
          error: 'No hay pasos de recopilación'
        };
      }
      
      // Agregar pregunta del primer paso de recopilación
      if (primerPasoRecopilar.pregunta) {
        response += primerPasoRecopilar.pregunta;
        
        // Si tiene configuración de endpoint, usar datos dinámicos
        if (primerPasoRecopilar.endpointResponseConfig) {
          const arrayPath = primerPasoRecopilar.endpointResponseConfig.arrayPath;
          
          console.log('🔍 Buscando datos dinámicos con arrayPath:', arrayPath);
          console.log('📦 Datos ejecutados disponibles:', Object.keys(datosEjecutados));
          
          // El arrayPath es el nombre de la variable donde se guardaron los datos
          let datosArray = datosEjecutados[arrayPath];
          
          // Si no es un array directamente, intentar buscar dentro del objeto
          if (datosArray && !Array.isArray(datosArray) && typeof datosArray === 'object') {
            // Buscar arrays dentro del objeto
            for (const key of Object.keys(datosArray)) {
              if (Array.isArray(datosArray[key])) {
                console.log(`📋 Array encontrado en: ${arrayPath}.${key}`);
                datosArray = datosArray[key];
                break;
              }
            }
          }
          
          if (Array.isArray(datosArray) && datosArray.length > 0) {
            console.log(`✅ Datos encontrados: ${datosArray.length} items`);
            const opciones = this.extraerOpcionesDinamicas(datosArray, primerPasoRecopilar.endpointResponseConfig);
            
            if (opciones.length > 0) {
              console.log(`✅ Opciones generadas: ${opciones.length}`);
              response += '\n\n' + workflowConversationManager.formatearOpciones(opciones);
            } else {
              console.log('⚠️ No se pudieron generar opciones');
            }
          } else {
            console.log('⚠️ No se encontraron datos en formato array');
            console.log('📦 Tipo de datos:', typeof datosArray);
            console.log('📦 Datos:', datosArray);
          }
        }
        // Si tiene opciones estáticas, mostrarlas
        else if (primerPasoRecopilar.validacion?.tipo === 'opcion' && primerPasoRecopilar.validacion.opciones) {
          response += '\n\n' + workflowConversationManager.formatearOpciones(
            primerPasoRecopilar.validacion.opciones
          );
        }
      }
      
      return {
        success: true,
        response,
        completed: false,
        metadata: {
          workflowName: workflow.nombre,
          pasoActual: 0,
          totalPasos: workflow.steps.length
        }
      };
      
    } catch (error: any) {
      console.error('❌ Error iniciando workflow:', error);
      return {
        success: false,
        response: '❌ Ocurrió un error al iniciar el flujo. Por favor intentá de nuevo.',
        completed: false,
        error: error.message
      };
    }
  }
  
  /**
   * Continúa un workflow activo procesando la respuesta del usuario
   */
  async continueWorkflow(
    mensaje: string,
    metadata: WorkflowActiveMetadata
  ): Promise<WorkflowConversationalResult> {
    try {
      const { contactoId, workflowState, workflow, apiConfig } = metadata;
      
      console.log('\n🔄 ========== CONTINUANDO WORKFLOW ==========');
      console.log('📋 Workflow:', workflow.nombre);
      console.log('📍 Paso actual:', workflowState.pasoActual);
      console.log('💬 Mensaje usuario:', mensaje);
      
      // Verificar si el usuario quiere cancelar
      const mensajeNormalizado = mensaje.toLowerCase().trim();
      if (workflow.permitirAbandonar && 
          (mensajeNormalizado === 'cancelar' || 
           mensajeNormalizado === 'salir' ||
           mensajeNormalizado === 'stop')) {
        await workflowConversationManager.abandonarWorkflow(contactoId);
        return {
          success: true,
          response: workflow.mensajeAbandonar || '🚫 Flujo cancelado',
          completed: true
        };
      }
      
      // Obtener paso actual
      const pasoActual = workflow.steps.find(s => s.orden === workflowState.pasoActual + 1);
      if (!pasoActual) {
        await workflowConversationManager.abandonarWorkflow(contactoId);
        return {
          success: false,
          response: '❌ Error: Paso no encontrado',
          completed: true,
          error: 'Paso no encontrado'
        };
      }
      
      console.log('📍 Procesando paso:', pasoActual.nombre || `Paso ${pasoActual.orden}`);
      
      // Procesar según tipo de paso
      if (pasoActual.tipo === 'recopilar') {
        return await this.procesarPasoRecopilacion(
          mensaje,
          pasoActual,
          contactoId,
          workflow,
          workflowState,
          apiConfig
        );
      } else if (pasoActual.tipo === 'ejecutar') {
        return await this.procesarPasoEjecucion(
          pasoActual,
          contactoId,
          workflow,
          workflowState,
          apiConfig
        );
      }
      
      return {
        success: false,
        response: '❌ Tipo de paso no soportado',
        completed: false,
        error: 'Tipo de paso inválido'
      };
      
    } catch (error: any) {
      console.error('❌ Error continuando workflow:', error);
      return {
        success: false,
        response: '❌ Ocurrió un error. Por favor intentá de nuevo.',
        completed: false,
        error: error.message
      };
    }
  }
  
  /**
   * Procesa un paso de recopilación de datos
   */
  private async procesarPasoRecopilacion(
    mensaje: string,
    paso: IWorkflowStep,
    contactoId: string,
    workflow: IWorkflow,
    workflowState: any,
    apiConfig: any
  ): Promise<WorkflowConversationalResult> {
    // Validar input
    const validacion = workflowConversationManager.validarInput(mensaje, paso);
    
    if (!validacion.valido) {
      // Registrar intento fallido
      const intentos = await workflowConversationManager.registrarIntentoFallido(contactoId);
      
      const intentosMaximos = paso.intentosMaximos || 3;
      if (intentos >= intentosMaximos) {
        await workflowConversationManager.abandonarWorkflow(contactoId);
        return {
          success: false,
          response: `❌ Demasiados intentos fallidos. ${workflow.mensajeAbandonar || 'Flujo cancelado'}`,
          completed: true,
          error: 'Demasiados intentos'
        };
      }
      
      return {
        success: false,
        response: `${validacion.mensaje}\n\n(Intento ${intentos}/${intentosMaximos})`,
        completed: false,
        error: 'Validación fallida'
      };
    }
    
    console.log('✅ Input válido:', validacion.valor);
    
    // Guardar dato recopilado
    const datosNuevos = {
      [paso.nombreVariable]: validacion.valor
    };
    
    await workflowConversationManager.avanzarPaso(contactoId, datosNuevos);
    
    // Verificar si hay más pasos
    const siguientePaso = workflow.steps.find(s => s.orden === paso.orden + 1);
    
    if (!siguientePaso) {
      // No hay más pasos, finalizar
      const datosRecopilados = await workflowConversationManager.finalizarWorkflow(contactoId);
      
      return {
        success: true,
        response: workflow.mensajeFinal || '✅ Flujo completado',
        completed: true,
        metadata: {
          workflowName: workflow.nombre,
          pasoActual: paso.orden,
          totalPasos: workflow.steps.length,
          datosRecopilados
        }
      };
    }
    
    // Construir respuesta con siguiente pregunta
    let response = '';
    
    if (siguientePaso.tipo === 'recopilar' && siguientePaso.pregunta) {
      response = siguientePaso.pregunta;
      
      // Si tiene configuración de endpoint, usar datos dinámicos
      if (siguientePaso.endpointResponseConfig) {
        // Obtener datos recopilados hasta ahora
        const estadoActual = await workflowConversationManager.getWorkflowState(contactoId);
        const datosRecopilados = estadoActual?.datosRecopilados || {};
        
        const arrayPath = siguientePaso.endpointResponseConfig.arrayPath;
        console.log('🔍 Buscando datos para siguiente paso con arrayPath:', arrayPath);
        console.log('📦 Datos recopilados disponibles:', Object.keys(datosRecopilados));
        
        // El arrayPath es el nombre de la variable
        let datosArray = datosRecopilados[arrayPath];
        
        // Si no es array, buscar dentro del objeto
        if (datosArray && !Array.isArray(datosArray) && typeof datosArray === 'object') {
          for (const key of Object.keys(datosArray)) {
            if (Array.isArray(datosArray[key])) {
              console.log(`📋 Array encontrado en: ${arrayPath}.${key}`);
              datosArray = datosArray[key];
              break;
            }
          }
        }
        
        if (Array.isArray(datosArray) && datosArray.length > 0) {
          console.log(`✅ Datos encontrados: ${datosArray.length} items`);
          const opciones = this.extraerOpcionesDinamicas(datosArray, siguientePaso.endpointResponseConfig);
          
          if (opciones.length > 0) {
            console.log(`✅ Opciones generadas: ${opciones.length}`);
            response += '\n\n' + workflowConversationManager.formatearOpciones(opciones);
          }
        } else {
          console.log('⚠️ No se encontraron datos array para siguiente paso');
        }
      }
      // Si tiene opciones estáticas, mostrarlas
      else if (siguientePaso.validacion?.tipo === 'opcion' && siguientePaso.validacion.opciones) {
        response += '\n\n' + workflowConversationManager.formatearOpciones(
          siguientePaso.validacion.opciones
        );
      }
    } else if (siguientePaso.tipo === 'ejecutar') {
      // El siguiente paso es ejecutar, hacerlo ahora
      return await this.procesarPasoEjecucion(
        siguientePaso,
        contactoId,
        workflow,
        { ...workflowState, pasoActual: paso.orden },
        apiConfig
      );
    }
    
    return {
      success: true,
      response,
      completed: false,
      metadata: {
        workflowName: workflow.nombre,
        pasoActual: paso.orden,
        totalPasos: workflow.steps.length
      }
    };
  }
  
  /**
   * Procesa un paso de ejecución de API
   */
  private async procesarPasoEjecucion(
    paso: IWorkflowStep,
    contactoId: string,
    workflow: IWorkflow,
    workflowState: any,
    apiConfig: any
  ): Promise<WorkflowConversationalResult> {
    try {
      console.log('⚡ Ejecutando endpoint:', paso.endpointId);
      
      if (!paso.endpointId) {
        return {
          success: false,
          response: '❌ Error: Endpoint no configurado',
          completed: false,
          error: 'Endpoint no configurado'
        };
      }
      
      // Obtener datos recopilados
      const state = await workflowConversationManager.getWorkflowState(contactoId);
      if (!state) {
        return {
          success: false,
          response: '❌ Error: Estado no encontrado',
          completed: false,
          error: 'Estado no encontrado'
        };
      }
      
      const datosRecopilados = state.datosRecopilados;
      console.log('📦 Datos recopilados:', datosRecopilados);
      
      // Mapear parámetros
      const params: any = {};
      if (paso.mapeoParametros) {
        for (const [paramName, varName] of Object.entries(paso.mapeoParametros)) {
          if (datosRecopilados[varName] !== undefined) {
            // Determinar dónde va el parámetro
            if (!params.query) params.query = {};
            params.query[paramName] = datosRecopilados[varName];
          }
        }
      }
      
      console.log('📤 Parámetros mapeados:', params);
      
      // Ejecutar endpoint
      const result = await apiExecutor.ejecutar(
        apiConfig._id.toString(),
        paso.endpointId,
        params
      );
      
      if (!result.success) {
        console.error('❌ Error ejecutando endpoint:', result.error);
        await workflowConversationManager.abandonarWorkflow(contactoId);
        return {
          success: false,
          response: '❌ No pude completar la consulta. Por favor intentá de nuevo más tarde.',
          completed: true,
          error: typeof result.error === 'string' ? result.error : (result.error as any)?.mensaje
        };
      }
      
      console.log('✅ Endpoint ejecutado exitosamente');
      
      // Finalizar workflow
      await workflowConversationManager.finalizarWorkflow(contactoId);
      
      // Formatear respuesta
      let response = '';
      if (workflow.mensajeFinal) {
        response += workflow.mensajeFinal + '\n\n';
      }
      
      // Agregar datos de la respuesta
      response += this.formatearRespuesta(result.data);
      
      return {
        success: true,
        response,
        completed: true,
        metadata: {
          workflowName: workflow.nombre,
          pasoActual: paso.orden,
          totalPasos: workflow.steps.length,
          datosRecopilados
        }
      };
      
    } catch (error: any) {
      console.error('❌ Error ejecutando paso:', error);
      await workflowConversationManager.abandonarWorkflow(contactoId);
      return {
        success: false,
        response: '❌ Ocurrió un error ejecutando la consulta.',
        completed: true,
        error: error.message
      };
    }
  }
  
  /**
   * Formatea la respuesta de la API para el usuario
   */
  private formatearRespuesta(data: any): string {
    if (typeof data === 'string') {
      return data;
    }
    
    if (Array.isArray(data)) {
      if (data.length === 0) {
        return 'No se encontraron resultados.';
      }
      
      // Formatear array como lista
      return data.map((item, index) => {
        if (typeof item === 'object') {
          return `${index + 1}. ${JSON.stringify(item, null, 2)}`;
        }
        return `${index + 1}. ${item}`;
      }).join('\n\n');
    }
    
    if (typeof data === 'object') {
      return JSON.stringify(data, null, 2);
    }
    
    return String(data);
  }
}

// Singleton
export const workflowConversationalHandler = new WorkflowConversationalHandler();
