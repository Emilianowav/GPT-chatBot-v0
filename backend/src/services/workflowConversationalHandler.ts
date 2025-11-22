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
      
      // Obtener primer paso (debe ser RECOPILAR)
      const pasosOrdenados = workflow.steps.sort((a, b) => a.orden - b.orden);
      const primerPaso = pasosOrdenados[0];
      
      if (!primerPaso || primerPaso.tipo !== 'recopilar') {
        return {
          success: false,
          response: '❌ Error: El primer paso debe ser de tipo "recopilar"',
          completed: false,
          error: 'Primer paso inválido'
        };
      }
      
      console.log('📋 Primer paso:', primerPaso.nombre);
      
      // RECOPILAR hace TODO: llamar API + mostrar opciones
      if (primerPaso.pregunta) {
        response += primerPaso.pregunta;
        
        // Si tiene endpoint configurado, llamar a la API
        if (primerPaso.endpointId) {
          console.log('🌐 Llamando a API para obtener opciones...');
          
          try {
            // Llamar al endpoint (sin filtros en el primer paso)
            const resultadoAPI = await apiExecutor.ejecutar(
              apiConfig._id.toString(),
              primerPaso.endpointId,
              {}, // Sin parámetros en el primer paso
              { metadata: { contactoId } }
            );
            
            if (resultadoAPI.success && resultadoAPI.data) {
              console.log('✅ Datos obtenidos de la API');
              
              // Extraer opciones dinámicas
              let datosArray = resultadoAPI.data;
              
              // Si la respuesta tiene una propiedad "data", usarla
              if (datosArray.data && Array.isArray(datosArray.data)) {
                datosArray = datosArray.data;
              }
              
              if (Array.isArray(datosArray) && datosArray.length > 0) {
                console.log(`✅ ${datosArray.length} opciones encontradas`);
                
                // Usar endpointResponseConfig si está configurado
                if (primerPaso.endpointResponseConfig) {
                  const opciones = this.extraerOpcionesDinamicas(
                    datosArray, 
                    primerPaso.endpointResponseConfig
                  );
                  
                  if (opciones.length > 0) {
                    response += '\n\n' + workflowConversationManager.formatearOpciones(opciones);
                  }
                } else {
                  // Formato por defecto si no hay config
                  const opciones = datosArray.map((item: any) => {
                    const id = item.id || item.code;
                    const nombre = item.name || item.nombre || item.title;
                    return `${id}: ${nombre}`;
                  });
                  response += '\n\n' + workflowConversationManager.formatearOpciones(opciones);
                }
              }
            } else {
              console.log('⚠️ No se obtuvieron datos de la API');
            }
          } catch (error) {
            console.error('❌ Error llamando a la API:', error);
          }
        }
        // Si tiene opciones estáticas, mostrarlas
        else if (primerPaso.validacion?.tipo === 'opcion' && primerPaso.validacion.opciones) {
          response += '\n\n' + workflowConversationManager.formatearOpciones(
            primerPaso.validacion.opciones
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
      
      // RECOPILAR llama a la API si tiene endpoint configurado
      if (siguientePaso.endpointId) {
        console.log('🌐 Llamando a API para siguiente paso...');
        
        try {
          // Obtener datos recopilados para usar como filtros
          const estadoActual = await workflowConversationManager.getWorkflowState(contactoId);
          const datosRecopilados = estadoActual?.datosRecopilados || {};
          
          // Mapear parámetros desde variables recopiladas
          const params: any = {};
          if (siguientePaso.mapeoParametros) {
            for (const [paramName, varName] of Object.entries(siguientePaso.mapeoParametros)) {
              if (datosRecopilados[varName] !== undefined) {
                if (!params.query) params.query = {};
                params.query[paramName] = datosRecopilados[varName];
                console.log(`📋 Filtro: ${paramName} = ${datosRecopilados[varName]}`);
              }
            }
          }
          
          // Llamar al endpoint con filtros
          const resultadoAPI = await apiExecutor.ejecutar(
            apiConfig._id.toString(),
            siguientePaso.endpointId,
            params,
            { metadata: { contactoId } }
          );
          
          if (resultadoAPI.success && resultadoAPI.data) {
            console.log('✅ Datos obtenidos de la API');
            
            let datosArray = resultadoAPI.data;
            
            // Si la respuesta tiene una propiedad "data", usarla
            if (datosArray.data && Array.isArray(datosArray.data)) {
              datosArray = datosArray.data;
            }
            
            if (Array.isArray(datosArray) && datosArray.length > 0) {
              console.log(`✅ ${datosArray.length} opciones encontradas`);
              
              // Usar endpointResponseConfig si está configurado
              if (siguientePaso.endpointResponseConfig) {
                const opciones = this.extraerOpcionesDinamicas(
                  datosArray,
                  siguientePaso.endpointResponseConfig
                );
                
                if (opciones.length > 0) {
                  response += '\n\n' + workflowConversationManager.formatearOpciones(opciones);
                }
              } else {
                // Formato por defecto
                const opciones = datosArray.map((item: any) => {
                  const id = item.id || item.code;
                  const nombre = item.name || item.nombre || item.title;
                  return `${id}: ${nombre}`;
                });
                response += '\n\n' + workflowConversationManager.formatearOpciones(opciones);
              }
            }
          }
        } catch (error) {
          console.error('❌ Error llamando a la API:', error);
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
      
      // Formatear respuesta usando template o formato por defecto
      let response = '';
      
      if (workflow.respuestaTemplate) {
        // Usar template del workflow
        response = this.aplicarTemplate(workflow.respuestaTemplate, datosRecopilados, result.data);
      } else {
        // Formato por defecto
        if (workflow.mensajeFinal) {
          response += workflow.mensajeFinal + '\n\n';
        }
        response += this.formatearRespuestaProductos(result.data);
      }
      
      // Limitar a 4000 caracteres para WhatsApp
      if (response.length > 4000) {
        response = response.substring(0, 3950) + '\n\n... (resultados truncados)';
      }
      
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
   * Aplica un template reemplazando variables
   */
  private aplicarTemplate(template: string, datosRecopilados: any, resultadoAPI: any): string {
    let resultado = template;
    
    // Reemplazar variables recopiladas
    for (const [key, value] of Object.entries(datosRecopilados)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      resultado = resultado.replace(regex, String(value));
    }
    
    // Reemplazar resultado de API
    if (resultadoAPI) {
      const formatoProductos = this.formatearRespuestaProductos(resultadoAPI);
      resultado = resultado.replace(/{{resultados}}/g, formatoProductos);
      resultado = resultado.replace(/{{resultado}}/g, formatoProductos);
    }
    
    return resultado;
  }
  
  /**
   * Formatea productos de manera concisa
   */
  private formatearRespuestaProductos(data: any): string {
    // Extraer array de productos
    let productos = data;
    
    if (data && typeof data === 'object') {
      if (data.data && Array.isArray(data.data)) {
        productos = data.data;
      } else if (data.products && Array.isArray(data.products)) {
        productos = data.products;
      }
    }
    
    if (!Array.isArray(productos)) {
      return 'No se encontraron productos.';
    }
    
    if (productos.length === 0) {
      return '❌ No se encontraron productos con esos criterios.';
    }
    
    // Limitar a 5 productos
    const productosLimitados = productos.slice(0, 5);
    
    // Formatear de manera concisa
    const lista = productosLimitados.map((producto: any, index: number) => {
      const nombre = producto.name || producto.nombre || producto.title || 'Sin nombre';
      const precio = producto.price || producto.precio || '';
      const stock = producto.stock || producto.stock_quantity || '';
      
      let linea = `${index + 1}. *${nombre}*`;
      if (precio) linea += `\n   💰 $${precio}`;
      if (stock) linea += `\n   📦 Stock: ${stock}`;
      
      return linea;
    }).join('\n\n');
    
    let resultado = lista;
    
    // Agregar nota si hay más productos
    if (productos.length > 5) {
      resultado += `\n\n_... y ${productos.length - 5} productos más_`;
    }
    
    return resultado;
  }
  
  /**
   * Formatea la respuesta de la API para el usuario (método legacy)
   */
  private formatearRespuesta(data: any): string {
    return this.formatearRespuestaProductos(data);
  }
}

// Singleton
export const workflowConversationalHandler = new WorkflowConversationalHandler();
