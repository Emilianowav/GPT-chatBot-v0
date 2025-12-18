// 🧠 Flujo GPT - Conversación con IA (Fallback)
import type { Flow, FlowContext, FlowResult } from './types.js';
import { enviarMensajeWhatsAppTexto } from '../services/metaService.js';
import { obtenerRespuestaChat } from '../services/openaiService.js';
import { buscarOCrearContacto, actualizarHistorialConversacion, incrementarMetricas } from '../services/contactoService.js';
import { EmpresaModel } from '../models/Empresa.js';
import { generateDynamicPaymentLink } from '../services/paymentLinkService.js';
import type { ChatCompletionMessageParam, ChatCompletionTool } from '../services/openaiService.js';

// Tool para generar link de pago
const paymentLinkTool: ChatCompletionTool = {
  type: "function",
  function: {
    name: "generate_payment_link",
    description: "Genera un link de pago de Mercado Pago cuando el cliente confirma su pedido y quiere pagar. Usar cuando el cliente dice 'quiero pagar', 'confirmo el pedido', 'listo para pagar', etc.",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Título del pedido, ej: 'Pedido Veo Veo - 3 libros'"
        },
        amount: {
          type: "number",
          description: "Monto total a cobrar en pesos argentinos"
        },
        description: {
          type: "string",
          description: "Descripción detallada del pedido con los items"
        }
      },
      required: ["title", "amount"]
    }
  }
};

// Empresas con pagos habilitados (por ID o nombre)
const EMPRESAS_CON_PAGOS = ['6940a9a181b92bfce970fdb5', 'Veo Veo'];

export const gptFlow: Flow = {
  name: 'gpt_conversation',
  priority: 'baja',
  version: '1.0.0',
  
  async shouldActivate(context: FlowContext): Promise<boolean> {
    // Este flujo se activa como FALLBACK cuando ningún otro flujo maneja el mensaje
    // Siempre retorna true para capturar cualquier mensaje no manejado
    console.log(`🧠 [GPT] Activando como fallback para ${context.empresaId}`);
    return true;
  },
  
  async start(context: FlowContext): Promise<FlowResult> {
    const { telefono, empresaId, mensaje, phoneNumberId } = context;
    
    console.log(`🧠 [GPT] Iniciando conversación con IA para ${telefono}`);
    
    try {
      // 1. Obtener empresa y su configuración
      const empresa = await EmpresaModel.findOne({ nombre: empresaId });
      
      if (!empresa) {
        console.error(`❌ [GPT] Empresa no encontrada: ${empresaId}`);
        await enviarMensajeWhatsAppTexto(
          telefono,
          'Lo siento, hay un problema con la configuración. Por favor, intenta más tarde.',
          phoneNumberId
        );
        return {
          success: false,
          error: 'Empresa no encontrada',
          end: true
        };
      }
      
      // 2. Obtener contacto y su historial
      const contacto = await buscarOCrearContacto({
        telefono,
        empresaId,
        empresaTelefono: empresa.telefono
      });
      
      // 3. Verificar si la empresa tiene pagos habilitados
      const empresaIdStr = empresa._id?.toString() || '';
      const tienePageosHabilitados = EMPRESAS_CON_PAGOS.includes(empresaIdStr) || 
                                      EMPRESAS_CON_PAGOS.includes(empresa.nombre);
      
      // 4. Construir historial de mensajes para GPT
      let promptBase = empresa.prompt || 'Eres un asistente virtual amable y servicial.';
      
      // Si tiene pagos habilitados, agregar instrucciones de pago al prompt
      if (tienePageosHabilitados) {
        promptBase += `\n\n--- INSTRUCCIONES DE PAGO ---
IMPORTANTE: Cada libro/producto tiene un precio fijo de $0.20 (veinte centavos).

Cuando el cliente quiera pagar o confirme su pedido, DEBES llamar a la función generate_payment_link con:
- title: descripción del pedido (ej: "Pedido Veo Veo - 2 libros")
- amount: total calculado (cantidad de items × $0.20)
- description: detalle de los productos

TRIGGERS para generar link de pago (cuando el cliente dice alguna de estas frases):
- "quiero pagar"
- "listo para pagar"  
- "confirmo"
- "pagar"
- "proceder al pago"

Ejemplo: 2 libros = $0.40 (2 × $0.20)

IMPORTANTE: Cuando detectes intención de pago, USA LA FUNCIÓN generate_payment_link. No pidas más datos, genera el link directamente.`;
      }
      
      const historialGPT: ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: promptBase
        }
      ];
      
      // Agregar historial reciente (últimos 20 mensajes)
      // El historial es un array de strings alternando usuario/asistente
      const historialReciente = contacto.conversaciones.historial.slice(-20);
      for (let i = 0; i < historialReciente.length; i++) {
        historialGPT.push({
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: historialReciente[i]
        });
      }
      
      // Agregar mensaje actual
      historialGPT.push({
        role: 'user',
        content: mensaje
      });
      
      console.log(`🧠 [GPT] Procesando con ${historialGPT.length} mensajes en el historial`);
      
      // 5. Obtener respuesta de GPT (con tools si tiene pagos habilitados)
      const modelo = empresa.modelo || 'gpt-3.5-turbo';
      const tools = tienePageosHabilitados ? [paymentLinkTool] : undefined;
      
      const respuesta = await obtenerRespuestaChat({
        modelo,
        historial: historialGPT,
        tools
      });
      
      console.log(`✅ [GPT] Respuesta generada (${respuesta.tokens} tokens, $${respuesta.costo})`);
      
      // 6. Guardar en historial (mensaje del usuario)
      await actualizarHistorialConversacion(contacto._id.toString(), mensaje);
      
      // 7. Manejar function call si existe (generar link de pago)
      let textoFinal = respuesta.texto;
      let linkGenerado = false;
      
      if (respuesta.functionCall && respuesta.functionCall.name === 'generate_payment_link') {
        console.log(`💳 [GPT] Function call detectado: generate_payment_link`);
        const args = respuesta.functionCall.arguments;
        
        // Generar el link de pago (incluye teléfono del cliente para notificación)
        const paymentResult = await generateDynamicPaymentLink({
          empresaId: empresaIdStr,
          title: args.title || `Pedido ${empresa.nombre}`,
          amount: args.amount || 0.20,
          description: args.description || '',
          clientePhone: telefono  // Teléfono del cliente para notificación cuando pague
        });
        
        if (paymentResult.success && paymentResult.paymentUrl) {
          console.log(`💳 [GPT] Link de pago generado: ${paymentResult.paymentUrl}`);
          linkGenerado = true;
          
          // Construir mensaje con el link
          textoFinal = `¡Perfecto! Tu pedido está listo. 🛒\n\n` +
            `📦 *${args.title || 'Tu pedido'}*\n` +
            `💰 Total: $${(args.amount || 0).toFixed(2)}\n\n` +
            `Para completar tu compra, hacé clic en el siguiente link:\n` +
            `👉 ${paymentResult.paymentUrl}\n\n` +
            `Una vez que realices el pago, te confirmaremos por este medio. ¡Gracias por tu compra! 🙌`;
        } else {
          console.error(`💳 [GPT] Error generando link:`, paymentResult.error);
          textoFinal = `Tu pedido está confirmado:\n\n` +
            `📦 *${args.title || 'Tu pedido'}*\n` +
            `💰 Total: $${(args.amount || 0).toFixed(2)}\n\n` +
            `En este momento no pudimos generar el link de pago automático. ` +
            `Por favor, contactanos para coordinar el pago. ¡Disculpá las molestias!`;
        }
      }
      
      // 7b. FALLBACK: Si GPT no llamó la función pero el usuario quiere pagar, forzar generación
      if (!linkGenerado && tienePageosHabilitados) {
        const mensajeLower = mensaje.toLowerCase();
        const triggersPago = ['quiero pagar', 'pagar', 'confirmo', 'listo', 'proceder', 'realizar pago', 'hacer el pago'];
        const quierePagar = triggersPago.some(trigger => mensajeLower.includes(trigger));
        
        if (quierePagar) {
          console.log(`💳 [GPT] FALLBACK: Detectada intención de pago por keywords`);
          
          // Extraer cantidad del historial (buscar números)
          const historialCompleto = historialReciente.join(' ') + ' ' + mensaje;
          const numerosEncontrados = historialCompleto.match(/(\d+)\s*(libros?|ejemplares?|unidades?|productos?)/gi);
          let cantidad = 1;
          
          if (numerosEncontrados && numerosEncontrados.length > 0) {
            const ultimoMatch = numerosEncontrados[numerosEncontrados.length - 1];
            const numMatch = ultimoMatch.match(/\d+/);
            if (numMatch) {
              cantidad = parseInt(numMatch[0], 10);
            }
          }
          
          const total = cantidad * 0.20;
          console.log(`💳 [GPT] FALLBACK: Cantidad detectada: ${cantidad}, Total: $${total}`);
          
          const paymentResult = await generateDynamicPaymentLink({
            empresaId: empresaIdStr,
            title: `Pedido ${empresa.nombre} - ${cantidad} libro${cantidad > 1 ? 's' : ''}`,
            amount: total,
            description: `Compra de ${cantidad} libro(s)`,
            clientePhone: telefono  // Teléfono del cliente para notificación cuando pague
          });
          
          if (paymentResult.success && paymentResult.paymentUrl) {
            console.log(`💳 [GPT] FALLBACK: Link generado: ${paymentResult.paymentUrl}`);
            
            textoFinal = `¡Perfecto! Tu pedido está listo. 🛒\n\n` +
              `📦 *Pedido ${empresa.nombre} - ${cantidad} libro${cantidad > 1 ? 's' : ''}*\n` +
              `💰 Total: $${total.toFixed(2)}\n\n` +
              `Para completar tu compra, hacé clic en el siguiente link:\n` +
              `👉 ${paymentResult.paymentUrl}\n\n` +
              `Una vez que realices el pago, te confirmaremos por este medio. ¡Gracias por tu compra! 🙌`;
          }
        }
      }
      
      // 8. Guardar respuesta del asistente
      await actualizarHistorialConversacion(contacto._id.toString(), textoFinal);
      
      // 9. Actualizar métricas del contacto
      await incrementarMetricas(contacto._id.toString(), {
        mensajesRecibidos: 1,
        mensajesEnviados: 1,
        tokensConsumidos: respuesta.tokens,
        interacciones: 1
      });
      
      // 10. Enviar respuesta al usuario
      await enviarMensajeWhatsAppTexto(telefono, textoFinal, phoneNumberId);
      
      // 9. Actualizar métricas de la empresa (opcional)
      if (empresa.uso) {
        empresa.uso.mensajesEsteMes = (empresa.uso.mensajesEsteMes || 0) + 1;
        empresa.uso.ultimaActualizacion = new Date();
        await empresa.save();
      }
      
      return {
        success: true,
        end: true, // Cada mensaje es independiente en GPT
        data: {
          respuesta: respuesta.texto,
          tokens: respuesta.tokens,
          costo: respuesta.costo
        }
      };
      
    } catch (error) {
      console.error('❌ [GPT] Error procesando mensaje:', error);
      console.error('❌ [GPT] Stack trace:', (error as Error).stack);
      console.error('❌ [GPT] Error details:', JSON.stringify(error, null, 2));
      
      await enviarMensajeWhatsAppTexto(
        telefono,
        'Disculpá, tuve un problema al procesar tu mensaje. Por favor, intentá de nuevo.',
        phoneNumberId
      );
      
      // Retornar success: true para que el controller no envíe otro mensaje
      return {
        success: true,
        error: String(error),
        end: true
      };
    }
  },
  
  async onInput(context: FlowContext, state: string, data: Record<string, any>): Promise<FlowResult> {
    // GPT no tiene estados intermedios, cada mensaje es independiente
    // Esto nunca debería llamarse porque end: true en start()
    return {
      success: false,
      error: 'GPT Flow no debería tener estados intermedios',
      end: true
    };
  }
};
