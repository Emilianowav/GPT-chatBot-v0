// 🕐 SERVICIO DE PRIMER MENSAJE - Maneja workflows de primer mensaje y timeouts de 24hs
// Detecta cuándo un contacto debe recibir un workflow de "primer mensaje"

import { ContactoEmpresaModel } from '../models/ContactoEmpresa.js';
import { ApiConfigurationModel } from '../modules/integrations/models/ApiConfiguration.js';

/**
 * Resultado de evaluación de primer mensaje
 */
export interface PrimerMensajeResult {
  shouldTrigger: boolean;
  reason: 'first_message' | '24h_timeout' | 'none';
  hoursElapsed?: number;
  interactionCount?: number;
  lastInteraction?: Date;
}

/**
 * 🕐 SERVICIO DE PRIMER MENSAJE
 * Evalúa si un contacto debe recibir un workflow de primer mensaje
 */
export class PrimerMensajeService {
  
  /**
   * Evalúa si debe activarse un workflow de primer mensaje para un contacto
   */
  async evaluatePrimerMensaje(
    empresaId: string,
    telefonoCliente: string
  ): Promise<PrimerMensajeResult> {
    try {
      // Buscar contacto
      const contacto = await ContactoEmpresaModel.findOne({
        empresaId,
        telefono: telefonoCliente
      });
      
      if (!contacto) {
        console.log('⚠️ [PrimerMensaje] Contacto no encontrado');
        return {
          shouldTrigger: false,
          reason: 'none'
        };
      }
      
      // Verificar si es el primer mensaje
      const esPrimerMensaje = this.esPrimerMensaje(contacto);
      
      if (esPrimerMensaje) {
        console.log('🔄 [PrimerMensaje] Es primer mensaje del contacto');
        return {
          shouldTrigger: true,
          reason: 'first_message',
          interactionCount: contacto.metricas.interacciones
        };
      }
      
      // Verificar timeout de 24 horas
      const timeoutResult = this.verificarTimeout24Horas(contacto);
      
      if (timeoutResult.shouldTrigger) {
        console.log(`🕐 [PrimerMensaje] Timeout de 24hs cumplido (${timeoutResult.hoursElapsed}h)`);
        return {
          shouldTrigger: true,
          reason: '24h_timeout',
          hoursElapsed: timeoutResult.hoursElapsed,
          interactionCount: contacto.metricas.interacciones,
          lastInteraction: contacto.metricas.ultimaInteraccion
        };
      }
      
      console.log(`⏭️ [PrimerMensaje] No aplica (${timeoutResult.hoursElapsed}h desde última interacción)`);
      return {
        shouldTrigger: false,
        reason: 'none',
        hoursElapsed: timeoutResult.hoursElapsed,
        interactionCount: contacto.metricas.interacciones,
        lastInteraction: contacto.metricas.ultimaInteraccion
      };
      
    } catch (error) {
      console.error('❌ [PrimerMensaje] Error evaluando primer mensaje:', error);
      return {
        shouldTrigger: false,
        reason: 'none'
      };
    }
  }
  
  /**
   * Verifica si es el primer mensaje del contacto
   */
  private esPrimerMensaje(contacto: any): boolean {
    return (
      contacto.metricas.interacciones === 0 || 
      !contacto.conversaciones?.historial || 
      contacto.conversaciones.historial.length === 0
    );
  }
  
  /**
   * Verifica si han pasado 24 horas desde la última interacción
   */
  private verificarTimeout24Horas(contacto: any): { shouldTrigger: boolean; hoursElapsed: number } {
    const ahora = new Date();
    const ultimaInteraccion = contacto.metricas.ultimaInteraccion;
    
    if (!ultimaInteraccion) {
      return { shouldTrigger: true, hoursElapsed: Infinity };
    }
    
    const horasTranscurridas = (ahora.getTime() - ultimaInteraccion.getTime()) / (1000 * 60 * 60);
    
    return {
      shouldTrigger: horasTranscurridas >= 24,
      hoursElapsed: horasTranscurridas
    };
  }
  
  /**
   * Busca workflows activos de tipo "primer_mensaje" para una empresa
   */
  async buscarWorkflowsPrimerMensaje(empresaId: string): Promise<Array<{ workflow: any; api: any }>> {
    try {
      const apisConWorkflows = await ApiConfigurationModel.find({
        empresaId,
        'workflows.0': { $exists: true },
        'workflows.activo': true
      });
      
      const workflowsPrimerMensaje: Array<{ workflow: any; api: any }> = [];
      
      for (const api of apisConWorkflows) {
        if (!api.workflows || api.workflows.length === 0) continue;
        
        for (const workflow of api.workflows) {
          const wf = workflow as any;
          if (wf.activo && wf.trigger?.tipo === 'primer_mensaje') {
            workflowsPrimerMensaje.push({ workflow, api });
          }
        }
      }
      
      // Ordenar por prioridad (mayor a menor)
      workflowsPrimerMensaje.sort((a, b) => {
        const prioA = (a.workflow as any).prioridad || 0;
        const prioB = (b.workflow as any).prioridad || 0;
        return prioB - prioA;
      });
      
      return workflowsPrimerMensaje;
      
    } catch (error) {
      console.error('❌ [PrimerMensaje] Error buscando workflows:', error);
      return [];
    }
  }
  
  /**
   * Registra que se activó un workflow de primer mensaje para evitar duplicados
   */
  async registrarActivacion(
    contactoId: string,
    workflowId: string,
    razon: 'first_message' | '24h_timeout'
  ): Promise<void> {
    try {
      // Actualizar el timestamp de última interacción para resetear el contador de 24hs
      await ContactoEmpresaModel.findByIdAndUpdate(contactoId, {
        $set: {
          'metricas.ultimaInteraccion': new Date()
        }
      });
      
      console.log(`✅ [PrimerMensaje] Activación registrada: ${workflowId} (${razon})`);
      
    } catch (error) {
      console.error('❌ [PrimerMensaje] Error registrando activación:', error);
    }
  }
  
  /**
   * Obtiene estadísticas de primer mensaje para debugging
   */
  async obtenerEstadisticas(empresaId: string): Promise<{
    totalContactos: number;
    contactosPrimerMensaje: number;
    contactosTimeout24h: number;
    workflowsDisponibles: number;
  }> {
    try {
      const ahora = new Date();
      const hace24Horas = new Date(ahora.getTime() - (24 * 60 * 60 * 1000));
      
      const [
        totalContactos,
        contactosPrimerMensaje,
        contactosTimeout24h,
        workflowsDisponibles
      ] = await Promise.all([
        // Total de contactos
        ContactoEmpresaModel.countDocuments({ empresaId }),
        
        // Contactos con primer mensaje (sin interacciones)
        ContactoEmpresaModel.countDocuments({
          empresaId,
          'metricas.interacciones': 0
        }),
        
        // Contactos con timeout de 24hs
        ContactoEmpresaModel.countDocuments({
          empresaId,
          'metricas.ultimaInteraccion': { $lt: hace24Horas },
          'metricas.interacciones': { $gt: 0 }
        }),
        
        // Workflows de primer mensaje disponibles
        this.buscarWorkflowsPrimerMensaje(empresaId).then(wfs => wfs.length)
      ]);
      
      return {
        totalContactos,
        contactosPrimerMensaje,
        contactosTimeout24h,
        workflowsDisponibles
      };
      
    } catch (error) {
      console.error('❌ [PrimerMensaje] Error obteniendo estadísticas:', error);
      return {
        totalContactos: 0,
        contactosPrimerMensaje: 0,
        contactosTimeout24h: 0,
        workflowsDisponibles: 0
      };
    }
  }
}

// Instancia singleton
export const primerMensajeService = new PrimerMensajeService();
