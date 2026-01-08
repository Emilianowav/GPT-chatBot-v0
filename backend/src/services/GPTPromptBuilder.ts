/**
 * CONSTRUCTOR DE PROMPTS PARA GPT CONVERSACIONAL
 * Genera el systemPrompt a partir de los 3 bloques configurables
 */

import type { IGPTConversacionalConfig, ITopico, IVariableRecopilar } from '../types/gpt-config.types.js';
import { obtenerRespuestaChat } from './openaiService.js';

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
   * Extrae datos usando configuración avanzada (para GPT Formateador)
   */
  static async extractWithCustomConfig(
    contexto: string,
    configuracion: any // IConfiguracionExtraccion
  ): Promise<Record<string, any>> {
    const resultado: Record<string, any> = {};

    if (!configuracion || !configuracion.camposEsperados) {
      return resultado;
    }

    try {
      // Construir prompt personalizado
      const extractorPrompt = `${configuracion.instruccionesExtraccion}

CONVERSACIÓN:
${contexto}

${configuracion.formatoSalida?.estructura ? `FORMATO DE SALIDA ESPERADO:\n${configuracion.formatoSalida.estructura}\n\n` : ''}${configuracion.formatoSalida?.ejemplo ? `EJEMPLO:\n${configuracion.formatoSalida.ejemplo}\n\n` : ''}CAMPOS A EXTRAER:
${configuracion.camposEsperados.map((c: any) => `- ${c.nombre}: ${c.descripcion} (tipo: ${c.tipoDato}, ${c.requerido ? 'requerido' : 'opcional'})`).join('\n')}

Responde ÚNICAMENTE con un objeto JSON válido. No incluyas texto adicional.`;

      console.log('   📤 Enviando a GPT-3.5 Turbo con configuración personalizada...');

      // Llamar a GPT-3.5 Turbo
      const respuesta = await obtenerRespuestaChat({
        modelo: 'gpt-3.5-turbo',
        historial: [
          {
            role: 'system',
            content: 'Eres un extractor de datos preciso. Respondes SOLO con JSON válido.'
          },
          {
            role: 'user',
            content: extractorPrompt
          }
        ]
      });

      // Parsear JSON
      try {
        let jsonString = respuesta.texto.trim();
        
        // Remover bloques de código markdown si existen
        if (jsonString.startsWith('```')) {
          jsonString = jsonString.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim();
        }

        const extracted = JSON.parse(jsonString);
        
        // Validar que sea un objeto
        if (typeof extracted === 'object' && extracted !== null && !Array.isArray(extracted)) {
          // Aplicar valores por defecto si faltan campos requeridos
          for (const campo of configuracion.camposEsperados) {
            if (extracted[campo.nombre] === undefined || extracted[campo.nombre] === null) {
              if (campo.requerido && campo.valorPorDefecto !== undefined) {
                extracted[campo.nombre] = campo.valorPorDefecto;
              }
            }
          }
          Object.assign(resultado, extracted);
        }
      } catch (parseError) {
        console.error('   ❌ Error parseando JSON del extractor:', parseError);
        console.error('   Respuesta recibida:', respuesta.texto);
      }

    } catch (error) {
      console.error('   ❌ Error en extractWithCustomConfig:', error);
    }

    return resultado;
  }

  /**
   * Extrae variables recopiladas de la respuesta del GPT usando GPT-3.5 Turbo
   */
  static async extractVariables(
    respuestaGPT: string,
    variablesConfig: IVariableRecopilar[]
  ): Promise<Record<string, any>> {

    const variables: Record<string, any> = {};

    // Si no hay variables configuradas, retornar vacío
    if (!variablesConfig || variablesConfig.length === 0) {
      return variables;
    }

    try {
      // Construir prompt para el extractor
      const extractorPrompt = `Eres un extractor de datos. Tu tarea es extraer información específica de un texto.

VARIABLES A EXTRAER:
${variablesConfig.map(v => `- ${v.nombre}: ${v.descripcion} (tipo: ${v.tipo})`).join('\n')}

TEXTO DEL USUARIO:
${respuestaGPT}

INSTRUCCIONES:
1. Extrae SOLO las variables que estén presentes en el texto
2. Si una variable no está presente, NO la incluyas en el JSON
3. Respeta el tipo de cada variable
4. Si el usuario menciona algo relacionado pero no exacto, usa tu mejor interpretación
5. Tolera errores de ortografía

Responde ÚNICAMENTE con un objeto JSON válido. Ejemplo:
{
  "titulo": "Harry Potter",
  "editorial": "Salamandra"
}

Si NO encuentras ninguna variable, responde con: {}`;

      console.log('   📤 Enviando a GPT-3.5 Turbo para extracción...');

      // Llamar a GPT-3.5 Turbo para extraer
      const resultado = await obtenerRespuestaChat({
        modelo: 'gpt-3.5-turbo',
        historial: [
          {
            role: 'system',
            content: 'Eres un extractor de datos preciso. Respondes SOLO con JSON válido.'
          },
          {
            role: 'user',
            content: extractorPrompt
          }
        ]
      });

      // Parsear JSON
      try {
        // Limpiar respuesta (remover markdown si existe)
        let jsonString = resultado.texto.trim();
        
        // Remover bloques de código markdown si existen
        if (jsonString.startsWith('```')) {
          jsonString = jsonString.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim();
        }

        const extracted = JSON.parse(jsonString);
        
        // Validar que sea un objeto
        if (typeof extracted === 'object' && extracted !== null && !Array.isArray(extracted)) {
          Object.assign(variables, extracted);
        }
      } catch (parseError) {
        console.error('   ❌ Error parseando JSON del extractor:', parseError);
        console.error('   Respuesta recibida:', resultado.texto);
      }

    } catch (error) {
      console.error('   ❌ Error en extractVariables:', error);
    }

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
