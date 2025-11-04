// 🧠 Flujo GPT - Conversación con IA (Fallback)
import type { Flow, FlowContext, FlowResult } from './types.js';
import { enviarMensajeWhatsAppTexto } from '../services/metaService.js';
import { obtenerRespuestaChat } from '../services/openaiService.js';
import { buscarOCrearContacto, actualizarHistorialConversacion, incrementarMetricas } from '../services/contactoService.js';
import { EmpresaModel } from '../models/Empresa.js';
import type { ChatCompletionMessageParam } from '../services/openaiService.js';

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
      
      // 3. Construir historial de mensajes para GPT
      const historialGPT: ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: empresa.prompt || 'Eres un asistente virtual amable y servicial.'
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
      
      // 4. Obtener respuesta de GPT
      const modelo = empresa.modelo || 'gpt-3.5-turbo';
      const respuesta = await obtenerRespuestaChat({
        modelo,
        historial: historialGPT
      });
      
      console.log(`✅ [GPT] Respuesta generada (${respuesta.tokens} tokens, $${respuesta.costo})`);
      
      // 5. Guardar en historial (mensaje del usuario)
      await actualizarHistorialConversacion(contacto._id.toString(), mensaje);
      
      // 6. Guardar respuesta del asistente
      await actualizarHistorialConversacion(contacto._id.toString(), respuesta.texto);
      
      // 7. Actualizar métricas del contacto
      await incrementarMetricas(contacto._id.toString(), {
        mensajesRecibidos: 1,
        mensajesEnviados: 1,
        tokensConsumidos: respuesta.tokens,
        interacciones: 1
      });
      
      // 8. Enviar respuesta al usuario
      await enviarMensajeWhatsAppTexto(telefono, respuesta.texto, phoneNumberId);
      
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
      
      await enviarMensajeWhatsAppTexto(
        telefono,
        'Disculpá, tuve un problema al procesar tu mensaje. Por favor, intentá de nuevo.',
        phoneNumberId
      );
      
      return {
        success: false,
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
