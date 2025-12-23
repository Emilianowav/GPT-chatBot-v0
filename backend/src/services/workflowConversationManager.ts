// 🔄 WORKFLOW CONVERSATION MANAGER
// Gestiona el estado de conversaciones en workflows paso a paso

import { ContactoEmpresaModel, WorkflowState } from '../models/ContactoEmpresa.js';
import type { IWorkflowStep } from '../modules/integrations/types/api.types.js';

/**
 * Gestor de estado de conversaciones en workflows
 */
export class WorkflowConversationManager {
  
  /**
   * Obtiene el estado actual del workflow para un contacto
   */
  async getWorkflowState(contactoId: string): Promise<WorkflowState | null> {
    try {
      const contacto = await ContactoEmpresaModel.findById(contactoId);
      if (!contacto || !contacto.workflowState) {
        return null;
      }
      
      return contacto.workflowState as WorkflowState;
    } catch (error) {
      console.error('❌ Error obteniendo estado de workflow:', error);
      return null;
    }
  }
  
  /**
   * Inicia un nuevo workflow para un contacto
   */
  async startWorkflow(
    contactoId: string,
    workflowId: string,
    apiId: string
  ): Promise<void> {
    try {
      const estado: WorkflowState = {
        workflowId,
        apiId,
        pasoActual: 0,
        datosRecopilados: {},
        intentosFallidos: 0,
        iniciadoEn: new Date(),
        ultimaActividad: new Date(),
        esperandoRepeticion: false  // Inicializar explícitamente
      };
      
      await ContactoEmpresaModel.findByIdAndUpdate(contactoId, {
        workflowState: estado
      });
      
      console.log('✅ [WORKFLOW] Workflow iniciado:', {
        contactoId,
        workflowId,
        apiId
      });
    } catch (error) {
      console.error('❌ Error iniciando workflow:', error);
      throw error;
    }
  }
  
  /**
   * Avanza al siguiente paso del workflow
   */
  async avanzarPaso(contactoId: string, datosNuevos?: Record<string, any>): Promise<void> {
    try {
      const contacto = await ContactoEmpresaModel.findById(contactoId);
      if (!contacto || !contacto.workflowState) {
        throw new Error('No hay workflow activo');
      }
      
      const estado = contacto.workflowState as WorkflowState;
      estado.pasoActual++;
      estado.ultimaActividad = new Date();
      estado.intentosFallidos = 0;
      
      if (datosNuevos) {
        estado.datosRecopilados = {
          ...estado.datosRecopilados,
          ...datosNuevos
        };
      }
      
      await ContactoEmpresaModel.findByIdAndUpdate(contactoId, {
        workflowState: estado
      });
      
      console.log('➡️ [WORKFLOW] Avanzando al paso:', estado.pasoActual);
    } catch (error) {
      console.error('❌ Error avanzando paso:', error);
      throw error;
    }
  }
  
  /**
   * Retrocede a un paso específico del workflow
   */
  async retrocederAPaso(contactoId: string, numeroPaso: number, limpiarVariable?: string): Promise<void> {
    try {
      const contacto = await ContactoEmpresaModel.findById(contactoId);
      if (!contacto || !contacto.workflowState) {
        throw new Error('No hay workflow activo');
      }
      
      const estado = contacto.workflowState as WorkflowState;
      estado.pasoActual = numeroPaso;
      estado.ultimaActividad = new Date();
      estado.intentosFallidos = 0;
      
      // Limpiar variable si se especifica
      if (limpiarVariable && estado.datosRecopilados) {
        delete estado.datosRecopilados[limpiarVariable];
        console.log(`🗑️ [WORKFLOW] Variable limpiada: ${limpiarVariable}`);
      }
      
      await ContactoEmpresaModel.findByIdAndUpdate(contactoId, {
        workflowState: estado
      });
      
      console.log('⬅️ [WORKFLOW] Retrocediendo al paso:', numeroPaso);
    } catch (error) {
      console.error('❌ Error retrocediendo paso:', error);
      throw error;
    }
  }
  
  /**
   * Actualiza un dato específico sin avanzar de paso
   */
  async actualizarDato(contactoId: string, variable: string, valor: any): Promise<void> {
    try {
      const contacto = await ContactoEmpresaModel.findById(contactoId);
      if (!contacto || !contacto.workflowState) {
        throw new Error('No hay workflow activo');
      }
      
      const estado = contacto.workflowState as WorkflowState;
      estado.datosRecopilados = {
        ...estado.datosRecopilados,
        [variable]: valor
      };
      estado.ultimaActividad = new Date();
      
      await ContactoEmpresaModel.findByIdAndUpdate(contactoId, {
        workflowState: estado
      });
      
      console.log(`✏️ [WORKFLOW] Dato actualizado: ${variable} = ${valor}`);
    } catch (error) {
      console.error('❌ Error actualizando dato:', error);
      throw error;
    }
  }
  
  /**
   * Guarda datos ejecutados de una API
   */
  async guardarDatosEjecutados(contactoId: string, endpointId: string, datos: any): Promise<void> {
    try {
      const contacto = await ContactoEmpresaModel.findById(contactoId);
      if (!contacto || !contacto.workflowState) {
        throw new Error('No hay workflow activo');
      }
      
      const estado = contacto.workflowState as WorkflowState;
      if (!estado.datosEjecutados) {
        estado.datosEjecutados = {};
      }
      
      estado.datosEjecutados[endpointId] = datos;
      estado.ultimaActividad = new Date();
      
      await ContactoEmpresaModel.findByIdAndUpdate(contactoId, {
        workflowState: estado
      });
      
      console.log(`💾 [WORKFLOW] Datos de API guardados: ${endpointId}`);
    } catch (error) {
      console.error('❌ Error guardando datos ejecutados:', error);
      throw error;
    }
  }
  
  /**
   * Registra un intento fallido de validación
   */
  async registrarIntentoFallido(contactoId: string): Promise<number> {
    try {
      const contacto = await ContactoEmpresaModel.findById(contactoId);
      if (!contacto || !contacto.workflowState) {
        throw new Error('No hay workflow activo');
      }
      
      const estado = contacto.workflowState as WorkflowState;
      estado.intentosFallidos++;
      estado.ultimaActividad = new Date();
      
      await ContactoEmpresaModel.findByIdAndUpdate(contactoId, {
        workflowState: estado
      });
      
      console.log('⚠️ [WORKFLOW] Intento fallido:', estado.intentosFallidos);
      return estado.intentosFallidos;
    } catch (error) {
      console.error('❌ Error registrando intento fallido:', error);
      throw error;
    }
  }
  
  /**
   * Finaliza el workflow actual
   */
  async finalizarWorkflow(contactoId: string): Promise<Record<string, any>> {
    try {
      const contacto = await ContactoEmpresaModel.findById(contactoId);
      if (!contacto || !contacto.workflowState) {
        return {};
      }
      
      const estado = contacto.workflowState as WorkflowState;
      const datosRecopilados = estado.datosRecopilados;
      
      await ContactoEmpresaModel.findByIdAndUpdate(contactoId, {
        $unset: { workflowState: 1 }
      });
      
      console.log('✅ [WORKFLOW] Workflow finalizado:', {
        contactoId,
        workflowId: estado.workflowId,
        datosRecopilados
      });
      
      return datosRecopilados;
    } catch (error) {
      console.error('❌ Error finalizando workflow:', error);
      throw error;
    }
  }
  
  /**
   * Abandona el workflow actual
   */
  async abandonarWorkflow(contactoId: string): Promise<void> {
    try {
      await ContactoEmpresaModel.findByIdAndUpdate(contactoId, {
        $unset: { workflowState: 1 }
      });
      
      console.log('🚫 [WORKFLOW] Workflow abandonado:', contactoId);
    } catch (error) {
      console.error('❌ Error abandonando workflow:', error);
      throw error;
    }
  }
  
  /**
   * Verifica si un workflow ha expirado por timeout
   */
  async verificarTimeout(contactoId: string, timeoutMinutos: number): Promise<boolean> {
    try {
      const estado = await this.getWorkflowState(contactoId);
      if (!estado) {
        return false;
      }
      
      const ahora = new Date();
      const tiempoTranscurrido = (ahora.getTime() - estado.ultimaActividad.getTime()) / 1000 / 60;
      
      if (tiempoTranscurrido > timeoutMinutos) {
        console.log('⏰ [WORKFLOW] Workflow expirado por timeout');
        await this.abandonarWorkflow(contactoId);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error verificando timeout:', error);
      return false;
    }
  }
  
  /**
   * Valida el input del usuario según las reglas del paso
   */
  validarInput(input: string, step: IWorkflowStep): { valido: boolean; mensaje?: string; valor?: any } {
    if (!step.validacion) {
      return { valido: true, valor: input };
    }
    
    const { tipo, opciones, regex, mensajeError } = step.validacion;
    
    switch (tipo) {
      case 'texto':
        if (!input || input.trim().length === 0) {
          return {
            valido: false,
            mensaje: mensajeError || 'Por favor ingresa un texto válido'
          };
        }
        return { valido: true, valor: input.trim() };
      
      case 'numero':
        const numero = parseFloat(input);
        if (isNaN(numero)) {
          return {
            valido: false,
            mensaje: mensajeError || 'Por favor ingresa un número válido'
          };
        }
        return { valido: true, valor: numero };
      
      case 'opcion':
        if (!opciones || opciones.length === 0) {
          return { valido: true, valor: input };
        }
        
        // Normalizar input
        const inputNormalizado = this.normalizarTexto(input);
        
        // Buscar coincidencia exacta o parcial
        const opcionEncontrada = opciones.find(opcion => {
          const opcionNormalizada = this.normalizarTexto(opcion);
          return opcionNormalizada === inputNormalizado || 
                 opcionNormalizada.includes(inputNormalizado) ||
                 inputNormalizado.includes(opcionNormalizada);
        });
        
        if (!opcionEncontrada) {
          return {
            valido: false,
            mensaje: mensajeError || `Por favor selecciona una opción válida: ${opciones.join(', ')}`
          };
        }
        
        return { valido: true, valor: opcionEncontrada };
      
      case 'regex':
        if (!regex) {
          return { valido: true, valor: input };
        }
        
        try {
          const regexPattern = new RegExp(regex, 'i');
          if (!regexPattern.test(input)) {
            return {
              valido: false,
              mensaje: mensajeError || 'El formato ingresado no es válido'
            };
          }
          return { valido: true, valor: input };
        } catch (error) {
          console.error('❌ Error en regex:', error);
          return { valido: true, valor: input };
        }
      
      default:
        return { valido: true, valor: input };
    }
  }
  
  /**
   * Normaliza texto para comparaciones (quita acentos, espacios, mayúsculas)
   */
  private normalizarTexto(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  /**
   * Formatea opciones para mostrar al usuario
   */
  formatearOpciones(opciones: string[]): string {
    if (opciones.length === 0) return '';
    if (opciones.length === 1) return opciones[0];
    
    // Si las opciones tienen emojis numéricos (1️⃣, 2️⃣, etc.), mostrar en líneas
    const tieneEmojisNumericos = opciones.some(op => /[1-9]️⃣|🔟/.test(op));
    if (tieneEmojisNumericos) {
      return opciones.join('\n');
    }
    
    // Para opciones simples, usar formato "o"
    if (opciones.length === 2) return opciones.join(' o ');
    
    const ultimaOpcion = opciones[opciones.length - 1];
    const otrasOpciones = opciones.slice(0, -1);
    return `${otrasOpciones.join(', ')} o ${ultimaOpcion}`;
  }
  
  /**
   * Marca el workflow como esperando decisión de repetición
   */
  async marcarEsperandoRepeticion(contactoId: string): Promise<void> {
    try {
      const contacto = await ContactoEmpresaModel.findById(contactoId);
      if (!contacto || !contacto.workflowState) {
        throw new Error('No hay workflow activo');
      }
      
      const estado = contacto.workflowState as WorkflowState;
      (estado as any).esperandoRepeticion = true;
      estado.ultimaActividad = new Date();
      
      await ContactoEmpresaModel.findByIdAndUpdate(contactoId, {
        workflowState: estado
      });
      
      console.log('🔄 [WORKFLOW] Marcado como esperando repetición');
    } catch (error) {
      console.error('❌ Error marcando esperando repetición:', error);
      throw error;
    }
  }
  
  /**
   * Verifica si el workflow está esperando decisión de repetición
   */
  async estaEsperandoRepeticion(contactoId: string): Promise<boolean> {
    try {
      const estado = await this.getWorkflowState(contactoId);
      console.log('🔍 [DEBUG] estaEsperandoRepeticion - estado:', {
        existe: !!estado,
        esperandoRepeticion: (estado as any)?.esperandoRepeticion,
        estadoCompleto: JSON.stringify(estado)
      });
      if (!estado) return false;
      return (estado as any).esperandoRepeticion === true;
    } catch (error) {
      console.error('❌ Error verificando esperando repetición:', error);
      return false;
    }
  }
  
  /**
   * Limpia múltiples variables y retrocede a un paso específico
   */
  async limpiarVariablesYRetroceder(
    contactoId: string, 
    variablesALimpiar: string[], 
    numeroPaso: number
  ): Promise<void> {
    try {
      const contacto = await ContactoEmpresaModel.findById(contactoId);
      if (!contacto || !contacto.workflowState) {
        throw new Error('No hay workflow activo');
      }
      
      const estado = contacto.workflowState as WorkflowState;
      
      // Limpiar variables especificadas
      for (const variable of variablesALimpiar) {
        if (estado.datosRecopilados && estado.datosRecopilados[variable] !== undefined) {
          delete estado.datosRecopilados[variable];
          // También limpiar la variable _nombre asociada
          delete estado.datosRecopilados[`${variable}_nombre`];
          console.log(`🗑️ [WORKFLOW] Variable limpiada: ${variable}`);
        }
      }
      
      // Retroceder al paso indicado
      estado.pasoActual = numeroPaso;
      estado.ultimaActividad = new Date();
      estado.intentosFallidos = 0;
      (estado as any).esperandoRepeticion = false;
      
      await ContactoEmpresaModel.findByIdAndUpdate(contactoId, {
        workflowState: estado
      });
      
      console.log(`🔄 [WORKFLOW] Variables limpiadas y retrocedido al paso ${numeroPaso}`);
    } catch (error) {
      console.error('❌ Error limpiando variables y retrocediendo:', error);
      throw error;
    }
  }
  
  /**
   * Quita el estado de esperando repetición
   */
  async quitarEsperandoRepeticion(contactoId: string): Promise<void> {
    try {
      const contacto = await ContactoEmpresaModel.findById(contactoId);
      if (!contacto || !contacto.workflowState) {
        return;
      }
      
      const estado = contacto.workflowState as WorkflowState;
      (estado as any).esperandoRepeticion = false;
      estado.ultimaActividad = new Date();
      
      await ContactoEmpresaModel.findByIdAndUpdate(contactoId, {
        workflowState: estado
      });
    } catch (error) {
      console.error('❌ Error quitando esperando repetición:', error);
    }
  }
}

// Singleton
export const workflowConversationManager = new WorkflowConversationManager();
