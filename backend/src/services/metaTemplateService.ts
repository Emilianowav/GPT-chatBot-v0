// 📋 Servicio para enviar mensajes usando Plantillas de Meta (WhatsApp Templates)
// Permite iniciar conversaciones fuera de la ventana de 24 horas

import axios from 'axios';

/**
 * Parámetro de una plantilla
 */
export interface TemplateParameter {
  type: 'text' | 'image' | 'video' | 'document' | 'currency' | 'date_time';
  text?: string;
  image?: { id: string; link?: string };
  video?: { id: string; link?: string };
  document?: { id: string; link?: string; filename?: string };
  currency?: { fallback_value: string; code: string; amount_1000: number };
  date_time?: { fallback_value: string };
}

/**
 * Componente de una plantilla
 */
export interface TemplateComponent {
  type: 'header' | 'body' | 'button';
  sub_type?: 'quick_reply' | 'url';
  index?: number;
  parameters: TemplateParameter[];
}

/**
 * Mensaje de plantilla completo
 */
export interface TemplateMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'template';
  template: {
    name: string;
    language: {
      code: string;
    };
    components: TemplateComponent[];
  };
}

/**
 * Enviar mensaje usando plantilla de Meta
 * 
 * @param telefono - Número de teléfono del destinatario (con código de país)
 * @param nombrePlantilla - Nombre de la plantilla aprobada en Meta
 * @param idioma - Código de idioma (ej: "es", "en", "pt_BR")
 * @param componentes - Componentes de la plantilla con sus parámetros
 * @param phoneNumberId - ID del número de WhatsApp Business
 * @returns true si se envió exitosamente
 */
export async function enviarMensajePlantillaMeta(
  telefono: string,
  nombrePlantilla: string,
  idioma: string,
  componentes: TemplateComponent[],
  phoneNumberId: string
): Promise<boolean> {
  try {
    const token = process.env.META_WHATSAPP_TOKEN || process.env.WHATSAPP_TOKEN;
    if (!token) {
      throw new Error('META_WHATSAPP_TOKEN o WHATSAPP_TOKEN no configurado en .env');
    }

    // Limpiar teléfono (quitar espacios, guiones, paréntesis)
    const telefonoLimpio = telefono.replace(/[^\d+]/g, '');

    // ⚠️ IMPORTANTE: Si no hay componentes, NO enviar el campo "components"
    // Meta rechaza "components": [] pero acepta no enviar el campo
    const template: any = {
      name: nombrePlantilla,
      language: {
        code: idioma
      }
    };
    
    // Solo agregar components si hay al menos uno
    if (componentes && componentes.length > 0) {
      template.components = componentes;
    }

    const payload: TemplateMessage = {
      messaging_product: 'whatsapp',
      to: telefonoLimpio,
      type: 'template',
      template: template as any
    };

    console.log('📤 [MetaTemplate] Enviando plantilla de Meta:');
    console.log('   📞 Teléfono:', telefonoLimpio);
    console.log('   📋 Plantilla:', nombrePlantilla);
    console.log('   🌐 Idioma:', idioma);
    console.log('   🔧 Componentes:', JSON.stringify(componentes, null, 2));

    const response = await axios.post(
      `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ [MetaTemplate] Plantilla enviada exitosamente');
    console.log('   📨 Message ID:', response.data.messages?.[0]?.id);
    console.log('   📊 Response:', JSON.stringify(response.data, null, 2));
    
    return true;

  } catch (error: any) {
    console.error('❌ [MetaTemplate] Error enviando plantilla de Meta:');
    
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
      
      // Errores comunes de Meta
      const errorCode = error.response.data?.error?.code;
      const errorMessage = error.response.data?.error?.message;
      
      if (errorCode === 131026) {
        console.error('   ⚠️ Plantilla no encontrada o no aprobada');
      } else if (errorCode === 131047) {
        console.error('   ⚠️ Parámetros de plantilla incorrectos');
      } else if (errorCode === 131051) {
        console.error('   ⚠️ Plantilla pausada o deshabilitada');
      }
      
      console.error('   💡 Mensaje:', errorMessage);
    } else {
      console.error('   Error:', error.message);
    }
    
    throw error;
  }
}

/**
 * Procesar variables y generar componentes de plantilla
 * 
 * @param configuracionPlantilla - Configuración de la plantilla desde MongoDB
 * @param variables - Variables con valores reales del sistema
 * @returns Array de componentes listos para enviar a Meta
 */
export function generarComponentesPlantilla(
  configuracionPlantilla: any,
  variables: Record<string, any>
): TemplateComponent[] {
  const componentes: TemplateComponent[] = [];

  console.log('🔧 [MetaTemplate] Generando componentes de plantilla');
  console.log('   Variables recibidas:', Object.keys(variables));

  // 1. Header (opcional)
  if (configuracionPlantilla.componentes?.header) {
    const header = configuracionPlantilla.componentes.header;
    const parametros: TemplateParameter[] = [];

    console.log('   📋 Procesando header:', header.tipo);

    if (header.parametros && header.parametros.length > 0) {
      for (const param of header.parametros) {
        const valorVariable = variables[param.variable];
        const valorFinal = valorVariable || param.valor;

        if (param.tipo === 'image') {
          parametros.push({
            type: 'image',
            image: { id: valorFinal }
          });
          console.log('      🖼️ Image ID:', valorFinal);
        } else if (param.tipo === 'video') {
          parametros.push({
            type: 'video',
            video: { id: valorFinal }
          });
          console.log('      🎥 Video ID:', valorFinal);
        } else if (param.tipo === 'document') {
          parametros.push({
            type: 'document',
            document: { id: valorFinal, filename: param.filename }
          });
          console.log('      📄 Document ID:', valorFinal);
        } else if (param.tipo === 'text') {
          parametros.push({
            type: 'text',
            text: valorFinal
          });
          console.log('      📝 Text:', valorFinal);
        }
      }
    }

    if (parametros.length > 0) {
      componentes.push({
        type: 'header',
        parameters: parametros
      });
      console.log('   ✅ Header agregado con', parametros.length, 'parámetros');
    }
  }

  // 2. Body (solo si está configurado en la plantilla)
  if (configuracionPlantilla.componentes?.body) {
    const parametros: TemplateParameter[] = [];

    console.log('   📋 Procesando body');

    // Solo procesar si hay parámetros definidos
    if (configuracionPlantilla.componentes.body.parametros && configuracionPlantilla.componentes.body.parametros.length > 0) {
      for (const param of configuracionPlantilla.componentes.body.parametros) {
        const valorVariable = variables[param.variable];
        const valorFinal = valorVariable !== undefined && valorVariable !== null 
          ? String(valorVariable) 
          : '';

        parametros.push({
          type: 'text',
          text: valorFinal
        });
        
        console.log(`      📝 ${param.variable}: "${valorFinal}"`);
      }

      componentes.push({
        type: 'body',
        parameters: parametros
      });
      console.log('   ✅ Body agregado con', parametros.length, 'parámetros');
    } else {
      console.log('   ℹ️ Body sin parámetros - plantilla tiene texto fijo');
    }
  }

  // 3. Buttons (opcional)
  if (configuracionPlantilla.componentes?.buttons && configuracionPlantilla.componentes.buttons.length > 0) {
    console.log('   📋 Procesando buttons');

    for (const button of configuracionPlantilla.componentes.buttons) {
      const parametros: TemplateParameter[] = [];

      if (button.parametros && button.parametros.length > 0) {
        for (const param of button.parametros) {
          const valorVariable = variables[param.variable];
          const valorFinal = valorVariable !== undefined && valorVariable !== null 
            ? String(valorVariable) 
            : '';

          parametros.push({
            type: 'text',
            text: valorFinal
          });
          
          console.log(`      🔘 Button ${button.index} - ${param.variable}: "${valorFinal}"`);
        }
      }

      componentes.push({
        type: 'button',
        sub_type: button.subTipo as 'quick_reply' | 'url',
        index: button.index,
        parameters: parametros
      });
    }
    
    console.log('   ✅ Buttons agregados:', configuracionPlantilla.componentes.buttons.length);
  }

  console.log('✅ [MetaTemplate] Componentes generados:', componentes.length);
  return componentes;
}

/**
 * Validar que una plantilla tenga la estructura correcta
 */
export function validarConfiguracionPlantilla(config: any): { valida: boolean; errores: string[] } {
  const errores: string[] = [];

  if (!config.nombre) {
    errores.push('Falta el nombre de la plantilla');
  }

  if (!config.idioma) {
    errores.push('Falta el código de idioma');
  }

  if (!config.componentes) {
    errores.push('Faltan los componentes de la plantilla');
  } else {
    if (!config.componentes.body) {
      errores.push('El body es requerido en toda plantilla');
    } else if (!config.componentes.body.parametros || !Array.isArray(config.componentes.body.parametros)) {
      errores.push('El body debe tener un array de parámetros');
    }
  }

  return {
    valida: errores.length === 0,
    errores
  };
}

/**
 * Ejemplo de uso:
 * 
 * const componentes = generarComponentesPlantilla(
 *   {
 *     componentes: {
 *       header: {
 *         tipo: 'image',
 *         parametros: [{ tipo: 'image', variable: 'qr_image', valor: '1234567890' }]
 *       },
 *       body: {
 *         parametros: [
 *           { tipo: 'text', variable: 'cliente' },
 *           { tipo: 'text', variable: 'turno_id' }
 *         ]
 *       },
 *       buttons: [
 *         {
 *           tipo: 'url',
 *           subTipo: 'url',
 *           index: 0,
 *           parametros: [{ tipo: 'text', variable: 'turno_id' }]
 *         }
 *       ]
 *     }
 *   },
 *   {
 *     qr_image: '1234567890',
 *     cliente: 'Juan Pérez',
 *     turno_id: 'ABC123'
 *   }
 * );
 * 
 * await enviarMensajePlantillaMeta(
 *   '+5491112345678',
 *   'qr_sanmartin_2',
 *   'es',
 *   componentes,
 *   phoneNumberId
 * );
 */
