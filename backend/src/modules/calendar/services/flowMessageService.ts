/**
 * 💬 FlowMessageService
 * 
 * Servicio para gestionar mensajes de flujos conversacionales configurables.
 * 
 * ⚠️ IMPORTANTE: Este servicio es para mensajes DENTRO de conversaciones activas.
 * Para INICIAR conversaciones con plantillas de Meta, usar NotificationService.
 * 
 * Funcionalidades:
 * - Obtener mensajes configurados desde la BD
 * - Reemplazar variables dinámicas ({turno}, {fecha}, {nombre}, etc.)
 * - Enviar mensajes de WhatsApp con botones/opciones
 */

import { ConfiguracionModuloModel } from '../models/ConfiguracionModulo.js';
import { enviarMensajeWhatsAppTexto, enviarMensajeWhatsAppBotones } from '../../../services/notificacionesMetaService.js';
import { EmpresaModel } from '../../../models/Empresa.js';

// ============================================================================
// TIPOS
// ============================================================================

export interface VariablesReemplazo {
  [key: string]: string | number | Date;
}

export interface OpcionBoton {
  id: string;
  texto: string;
  descripcion?: string;
}

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

export class FlowMessageService {
  
  /**
   * Obtiene un mensaje configurado desde la BD
   * @param empresaId ID de la empresa
   * @param flujo Nombre del flujo ('confirmacion_turnos', 'menu_principal', etc.)
   * @param estado Estado del flujo ('esperando_confirmacion', 'confirmado', etc.)
   * @returns Mensaje configurado o null si no existe
   */
  async getMensaje(
    empresaId: string,
    flujo: string,
    estado: string
  ): Promise<{ mensaje: string; botones?: OpcionBoton[]; opciones?: OpcionBoton[] } | null> {
    try {
      const config = await ConfiguracionModuloModel.findOne({ empresaId });
      
      if (!config?.mensajesFlujo) {
        console.warn(`⚠️ [FlowMessageService] No hay mensajesFlujo configurados para empresa: ${empresaId}`);
        return null;
      }
      
      const flujoConfig = config.mensajesFlujo[flujo as keyof typeof config.mensajesFlujo];
      if (!flujoConfig) {
        console.warn(`⚠️ [FlowMessageService] Flujo '${flujo}' no encontrado para empresa: ${empresaId}`);
        return null;
      }
      
      const mensajeConfig = (flujoConfig as any)[estado];
      if (!mensajeConfig) {
        console.warn(`⚠️ [FlowMessageService] Estado '${estado}' no encontrado en flujo '${flujo}' para empresa: ${empresaId}`);
        return null;
      }
      
      return {
        mensaje: mensajeConfig.mensaje,
        botones: mensajeConfig.botones,
        opciones: mensajeConfig.opciones
      };
      
    } catch (error) {
      console.error(`❌ [FlowMessageService] Error obteniendo mensaje:`, error);
      return null;
    }
  }
  
  /**
   * Obtiene las variables dinámicas de una empresa
   * @param empresaId ID de la empresa
   * @returns Variables dinámicas o valores por defecto
   */
  async getVariablesDinamicas(empresaId: string): Promise<Record<string, string>> {
    try {
      const config = await ConfiguracionModuloModel.findOne({ empresaId });
      
      if (!config?.variablesDinamicas) {
        console.warn(`⚠️ [FlowMessageService] No hay variablesDinamicas para empresa: ${empresaId}, usando defaults`);
        return {
          nombre_empresa: empresaId,
          nomenclatura_turno: 'turno',
          nomenclatura_turnos: 'turnos',
          nomenclatura_agente: 'profesional',
          nomenclatura_agentes: 'profesionales',
          zona_horaria: 'America/Argentina/Buenos_Aires',
          moneda: 'ARS',
          idioma: 'es'
        };
      }
      
      return {
        nombre_empresa: config.variablesDinamicas.nombre_empresa,
        nomenclatura_turno: config.variablesDinamicas.nomenclatura_turno,
        nomenclatura_turnos: config.variablesDinamicas.nomenclatura_turnos,
        nomenclatura_agente: config.variablesDinamicas.nomenclatura_agente,
        nomenclatura_agentes: config.variablesDinamicas.nomenclatura_agentes,
        zona_horaria: config.variablesDinamicas.zona_horaria,
        moneda: config.variablesDinamicas.moneda,
        idioma: config.variablesDinamicas.idioma
      };
      
    } catch (error) {
      console.error(`❌ [FlowMessageService] Error obteniendo variables dinámicas:`, error);
      return {
        nombre_empresa: empresaId,
        nomenclatura_turno: 'turno',
        nomenclatura_turnos: 'turnos',
        nomenclatura_agente: 'profesional',
        nomenclatura_agentes: 'profesionales',
        zona_horaria: 'America/Argentina/Buenos_Aires',
        moneda: 'ARS',
        idioma: 'es'
      };
    }
  }
  
  /**
   * Reemplaza variables en un texto
   * @param texto Texto con variables: "Tu {turno} del {fecha}"
   * @param variables Variables a reemplazar: { turno: 'viaje', fecha: '15/11' }
   * @param variablesDinamicas Variables dinámicas de la empresa
   * @returns Texto con variables reemplazadas
   */
  reemplazarVariables(
    texto: string,
    variables: VariablesReemplazo,
    variablesDinamicas: Record<string, string>
  ): string {
    let resultado = texto;
    
    // Primero reemplazar variables dinámicas de la empresa
    for (const [key, value] of Object.entries(variablesDinamicas)) {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      resultado = resultado.replace(regex, String(value));
    }
    
    // Luego reemplazar variables específicas del contexto
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      
      // Formatear según el tipo
      let valorFormateado: string;
      if (value instanceof Date) {
        valorFormateado = this.formatearFecha(value);
      } else {
        valorFormateado = String(value);
      }
      
      resultado = resultado.replace(regex, valorFormateado);
    }
    
    return resultado;
  }
  
  /**
   * Formatea una fecha en formato legible
   * @param fecha Fecha a formatear
   * @returns Fecha formateada: "15/11/2025"
   */
  private formatearFecha(fecha: Date): string {
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
  }
  
  /**
   * Formatea una hora en formato legible
   * @param fecha Fecha con hora
   * @returns Hora formateada: "14:30"
   */
  private formatearHora(fecha: Date): string {
    const horas = fecha.getHours().toString().padStart(2, '0');
    const minutos = fecha.getMinutes().toString().padStart(2, '0');
    return `${horas}:${minutos}`;
  }
  
  /**
   * Envía un mensaje de flujo a un usuario
   * @param telefono Teléfono del destinatario
   * @param empresaId ID de la empresa
   * @param flujo Nombre del flujo
   * @param estado Estado del flujo
   * @param variables Variables para reemplazar en el mensaje
   * @returns true si se envió correctamente
   */
  async enviarMensajeFlujo(
    telefono: string,
    empresaId: string,
    flujo: string,
    estado: string,
    variables: VariablesReemplazo = {}
  ): Promise<boolean> {
    try {
      console.log(`📤 [FlowMessageService] Enviando mensaje de flujo: ${flujo}/${estado} a ${telefono}`);
      
      // 1. Obtener mensaje configurado
      const mensajeConfig = await this.getMensaje(empresaId, flujo, estado);
      if (!mensajeConfig) {
        console.error(`❌ [FlowMessageService] No se encontró configuración de mensaje`);
        return false;
      }
      
      // 2. Obtener variables dinámicas
      const variablesDinamicas = await this.getVariablesDinamicas(empresaId);
      
      // 3. Reemplazar variables en el mensaje
      const mensajeFinal = this.reemplazarVariables(
        mensajeConfig.mensaje,
        variables,
        variablesDinamicas
      );
      
      // 4. Reemplazar variables en botones/opciones si existen
      let botonesFinal = mensajeConfig.botones;
      if (botonesFinal) {
        botonesFinal = botonesFinal.map(boton => ({
          id: boton.id,
          texto: this.reemplazarVariables(boton.texto, variables, variablesDinamicas)
        }));
      }
      
      let opcionesFinal = mensajeConfig.opciones;
      if (opcionesFinal) {
        opcionesFinal = opcionesFinal.map(opcion => ({
          id: opcion.id,
          texto: this.reemplazarVariables(opcion.texto, variables, variablesDinamicas),
          descripcion: opcion.descripcion 
            ? this.reemplazarVariables(opcion.descripcion, variables, variablesDinamicas)
            : undefined
        }));
      }
      
      // 5. Obtener phoneNumberId de la empresa
      const empresa = await EmpresaModel.findOne({ nombre: empresaId });
      if (!empresa?.phoneNumberId) {
        console.error(`❌ [FlowMessageService] No se encontró phoneNumberId para empresa: ${empresaId}`);
        return false;
      }
      
      // 6. Enviar mensaje
      if (botonesFinal && botonesFinal.length > 0) {
        // Enviar con botones
        await enviarMensajeWhatsAppBotones(
          telefono,
          mensajeFinal,
          botonesFinal,
          empresa.phoneNumberId
        );
      } else {
        // Enviar mensaje simple
        await enviarMensajeWhatsAppTexto(
          telefono,
          mensajeFinal,
          empresa.phoneNumberId
        );
      }
      
      console.log(`✅ [FlowMessageService] Mensaje enviado exitosamente`);
      return true;
      
    } catch (error) {
      console.error(`❌ [FlowMessageService] Error enviando mensaje:`, error);
      return false;
    }
  }
  
  /**
   * Envía un mensaje con opciones de menú (lista de opciones)
   * @param telefono Teléfono del destinatario
   * @param empresaId ID de la empresa
   * @param flujo Nombre del flujo
   * @param estado Estado del flujo
   * @param variables Variables para reemplazar
   * @returns true si se envió correctamente
   */
  async enviarMensajeConOpciones(
    telefono: string,
    empresaId: string,
    flujo: string,
    estado: string,
    variables: VariablesReemplazo = {}
  ): Promise<boolean> {
    try {
      console.log(`📋 [FlowMessageService] Enviando mensaje con opciones: ${flujo}/${estado}`);
      
      // Obtener mensaje configurado
      const mensajeConfig = await this.getMensaje(empresaId, flujo, estado);
      if (!mensajeConfig || !mensajeConfig.opciones) {
        console.error(`❌ [FlowMessageService] No se encontraron opciones configuradas`);
        return false;
      }
      
      // Obtener variables dinámicas
      const variablesDinamicas = await this.getVariablesDinamicas(empresaId);
      
      // Reemplazar variables
      const mensajeFinal = this.reemplazarVariables(
        mensajeConfig.mensaje,
        variables,
        variablesDinamicas
      );
      
      // Construir texto con opciones
      let textoCompleto = mensajeFinal + '\n\n';
      mensajeConfig.opciones.forEach((opcion, index) => {
        const textoOpcion = this.reemplazarVariables(opcion.texto, variables, variablesDinamicas);
        const descripcion = opcion.descripcion 
          ? this.reemplazarVariables(opcion.descripcion, variables, variablesDinamicas)
          : '';
        textoCompleto += `${index + 1}. ${textoOpcion}`;
        if (descripcion) {
          textoCompleto += ` - ${descripcion}`;
        }
        textoCompleto += '\n';
      });
      
      // Obtener phoneNumberId
      const empresa = await EmpresaModel.findOne({ nombre: empresaId });
      if (!empresa?.phoneNumberId) {
        console.error(`❌ [FlowMessageService] No se encontró phoneNumberId para empresa: ${empresaId}`);
        return false;
      }
      
      // Enviar mensaje
      await enviarMensajeWhatsAppTexto(
        telefono,
        textoCompleto,
        empresa.phoneNumberId
      );
      
      console.log(`✅ [FlowMessageService] Mensaje con opciones enviado`);
      return true;
      
    } catch (error) {
      console.error(`❌ [FlowMessageService] Error enviando mensaje con opciones:`, error);
      return false;
    }
  }
}

// Exportar instancia singleton
export const flowMessageService = new FlowMessageService();
