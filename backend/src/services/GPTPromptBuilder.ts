/**
 * CONSTRUCTOR DE PROMPTS PARA GPT CONVERSACIONAL
 * Genera el systemPrompt a partir de los 3 bloques configurables
 */

import type { IGPTConversacionalConfig, ITopico, IVariableRecopilar } from '../types/gpt-config.types.js';

export class GPTPromptBuilder {
  /**
   * Construye el systemPrompt completo desde la configuración de 3 bloques
   */
  static buildSystemPrompt(config: IGPTConversacionalConfig): string {
    const sections: string[] = [];

    // BLOQUE 1: PERSONALIDAD
    if (config.personalidad) {
      sections.push('# PERSONALIDAD');
      sections.push(config.personalidad);
      sections.push('');
    }

    // BLOQUE 2: INFORMACIÓN ESTÁTICA (Tópicos)
    if (config.topicos && config.topicos.length > 0) {
      sections.push('# INFORMACIÓN DISPONIBLE');
      sections.push('Tienes acceso a la siguiente información para responder consultas del usuario:');
      sections.push('');
      
      config.topicos.forEach((topico, index) => {
        sections.push(`## ${index + 1}. ${topico.titulo}`);
        sections.push(topico.contenido);
        if (topico.keywords && topico.keywords.length > 0) {
          sections.push(`📌 Palabras clave: ${topico.keywords.join(', ')}`);
        }
        sections.push('');
      });

      sections.push('⚠️ IMPORTANTE: Accede a estos tópicos de forma natural cuando el usuario pregunte algo relacionado.');
      sections.push('No es necesario que el usuario mencione exactamente las palabras clave.');
      sections.push('Usa tu comprensión del lenguaje para identificar la intención del usuario.');
      sections.push('');
    }

    // BLOQUE 3: RECOPILACIÓN DE DATOS
    if (config.variablesRecopilar && config.variablesRecopilar.length > 0) {
      sections.push('# RECOPILACIÓN DE DATOS');
      sections.push('Tu tarea principal es recopilar los siguientes datos del cliente:');
      sections.push('');

      const obligatorias = config.variablesRecopilar.filter(v => v.obligatorio);
      const opcionales = config.variablesRecopilar.filter(v => !v.obligatorio);

      if (obligatorias.length > 0) {
        sections.push('## DATOS OBLIGATORIOS:');
        obligatorias.forEach((variable, index) => {
          sections.push(`${index + 1}. **${variable.nombre}** - ${variable.descripcion}`);
          if (variable.tipo) {
            sections.push(`   Tipo: ${variable.tipo}`);
          }
          if (variable.validacion) {
            const validaciones: string[] = [];
            if (variable.validacion.min !== undefined) validaciones.push(`mínimo ${variable.validacion.min}`);
            if (variable.validacion.max !== undefined) validaciones.push(`máximo ${variable.validacion.max}`);
            if (variable.validacion.opciones) validaciones.push(`opciones: ${variable.validacion.opciones.join(', ')}`);
            if (validaciones.length > 0) {
              sections.push(`   Validación: ${validaciones.join(', ')}`);
            }
          }
          if (variable.ejemplos && variable.ejemplos.length > 0) {
            sections.push(`   Ejemplos: ${variable.ejemplos.join(', ')}`);
          }
          sections.push('');
        });
      }

      if (opcionales.length > 0) {
        sections.push('## DATOS OPCIONALES:');
        opcionales.forEach((variable, index) => {
          sections.push(`${index + 1}. **${variable.nombre}** - ${variable.descripcion}`);
          if (variable.tipo) {
            sections.push(`   Tipo: ${variable.tipo}`);
          }
          sections.push('');
        });
      }

      sections.push('## INSTRUCCIONES DE RECOPILACIÓN:');
      sections.push('1. Pregunta de forma natural y conversacional');
      sections.push('2. Si el usuario da información incompleta, pide lo que falta');
      sections.push('3. Valida los datos según las reglas especificadas');
      sections.push('4. Si el usuario comete errores de ortografía, interpreta su intención');
      sections.push('5. Acepta información parcial si es suficiente');
      sections.push('');
    }

    // BLOQUE 4: ACCIONES POST-RECOPILACIÓN
    if (config.accionesCompletado && config.accionesCompletado.length > 0) {
      sections.push('# CUANDO COMPLETES LA RECOPILACIÓN:');
      
      config.accionesCompletado.forEach(accion => {
        switch (accion.tipo) {
          case 'mensaje':
            sections.push(`- Envía este mensaje: "${accion.contenido}"`);
            break;
          case 'marcar_completado':
            sections.push(`- Marca el final con el token: ${accion.token}`);
            break;
          case 'guardar_variables_globales':
            sections.push(`- Las variables se guardarán automáticamente: ${accion.variables?.join(', ')}`);
            break;
        }
      });
      sections.push('');
    }

    return sections.join('\n');
  }

  /**
   * Extrae variables recopiladas de la respuesta del GPT
   */
  static extractVariables(
    respuestaGPT: string,
    variablesConfig: IVariableRecopilar[]
  ): Record<string, any> {
    const variables: Record<string, any> = {};

    // TODO: Implementar extracción inteligente de variables
    // Por ahora, esto es un placeholder
    // En el futuro, podríamos usar otro GPT para extraer las variables

    return variables;
  }

  /**
   * Valida que todas las variables obligatorias estén completas
   */
  static validateVariables(
    variables: Record<string, any>,
    variablesConfig: IVariableRecopilar[]
  ): { valido: boolean; faltantes: string[] } {
    const faltantes: string[] = [];

    variablesConfig
      .filter(v => v.obligatorio)
      .forEach(v => {
        if (!variables[v.nombre] || variables[v.nombre] === '') {
          faltantes.push(v.nombre);
        }
      });

    return {
      valido: faltantes.length === 0,
      faltantes
    };
  }

  /**
   * Detecta si el GPT marcó la recopilación como completa
   */
  static isCompletado(respuestaGPT: string, token: string = '[INFO_COMPLETA]'): boolean {
    return respuestaGPT.includes(token);
  }
}
