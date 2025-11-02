// 💬 Flujo de Conversación General (OpenAI)
import type { Flow, FlowContext, FlowResult } from './types.js';
import { enviarMensajeWhatsAppTexto } from '../services/metaService.js';
import { obtenerRespuestaChat, type ChatCompletionMessageParam } from '../services/openaiService.js';
import { obtenerUsuario, actualizarUsuario } from '../utils/usuarioStoreMongo.js';
import { buscarEmpresaPorTelefono } from '../utils/empresaUtilsMongo.js';
import { encode } from 'gpt-tokenizer';
import fs from 'fs';
import path from 'path';

const leerCatalogoComoTexto = (relativePath: string): string => {
  try {
    const absolutePath = path.resolve(process.cwd(), relativePath);
    return fs.readFileSync(absolutePath, 'utf-8').trim();
  } catch {
    return '';
  }
};

export const conversacionGeneralFlow: Flow = {
  name: 'conversacion_general',
  priority: 'baja',
  version: '1.0.0',
  
  async shouldActivate(context: FlowContext): Promise<boolean> {
    // Este flujo es el fallback, siempre se activa si ningún otro lo hace
    return true;
  },
  
  async start(context: FlowContext): Promise<FlowResult> {
    const { telefono, mensaje, empresaId, profileName } = context;
    
    console.log(`💬 [ConversacionGeneral] Iniciando flujo para ${telefono}`);
    
    try {
      // Obtener empresa y usuario
      const empresa = await buscarEmpresaPorTelefono(empresaId);
      if (!empresa) {
        return {
          success: false,
          error: 'Empresa no encontrada'
        };
      }
      
      const usuario = await obtenerUsuario(telefono, empresa.nombre, profileName, empresaId);
      
      // Verificar si es un saludo
      const mensajeLower = mensaje.toLowerCase().trim();
      const esSaludo = /^(hola|buenas|buen día|buenas tardes|buenas noches|saludos|hey)[!. ]*$/i.test(mensajeLower);
      
      const SALUDO_REPETIR_CADA_MS = 24 * 60 * 60 * 1000;
      const ahoraMs = Date.now();
      const ultimaInteraccionMs = new Date(usuario.ultimaInteraccion).getTime();
      const tiempoDesdeUltima = ahoraMs - ultimaInteraccionMs;
      const puedeSaludar = !usuario.saludado || tiempoDesdeUltima > SALUDO_REPETIR_CADA_MS;
      
      if (puedeSaludar && esSaludo) {
        const saludos = empresa.saludos?.length
          ? empresa.saludos
          : ["¡Hola! ¿En qué puedo ayudarte hoy?"];
        const saludoElegido = saludos[Math.floor(Math.random() * saludos.length)];
        
        await enviarMensajeWhatsAppTexto(telefono, saludoElegido, context.phoneNumberId);
        
        // Guardar en historial
        const ahora = new Date().toISOString();
        usuario.historial.push(JSON.stringify({
          role: 'user',
          content: mensaje,
          timestamp: ahora
        }));
        usuario.historial.push(JSON.stringify({
          role: 'assistant',
          content: saludoElegido,
          timestamp: ahora
        }));
        
        usuario.saludado = true;
        usuario.ultimaInteraccion = ahora;
        usuario.num_mensajes_recibidos += 1;
        usuario.num_mensajes_enviados += 1;
        usuario.interacciones += 1;
        usuario.tokens_consumidos = (usuario.tokens_consumidos ?? 0) + 
          encode(mensaje).length + encode(saludoElegido).length;
        
        await actualizarUsuario(usuario);
        
        return {
          success: true,
          end: true
        };
      }
      
      // Procesar con OpenAI
      const textoCatalogo = empresa.catalogoPath ? leerCatalogoComoTexto(empresa.catalogoPath) : '';
      const promptSistema = `${empresa.prompt ?? 'Sos un asistente simpático y eficiente.'}${textoCatalogo ? '\n\nCatálogo disponible:\n' + textoCatalogo : ''}`;
      
      const historial: ChatCompletionMessageParam[] = [
        { role: 'system', content: promptSistema },
        ...usuario.historial.flatMap((entrada) => {
          try {
            const parsed = JSON.parse(entrada);
            if (parsed.role && parsed.content) {
              return [{ role: parsed.role, content: parsed.content }];
            }
          } catch (e) {
            const match = entrada.match(/^(Cliente|Asistente): (.*)$/);
            if (match) {
              const role: 'user' | 'assistant' = match[1] === 'Cliente' ? 'user' : 'assistant';
              return [{ role, content: match[2] }];
            }
          }
          return [];
        }),
        { role: 'user', content: mensaje }
      ];
      
      const { texto: respuesta } = await obtenerRespuestaChat({
        historial,
        modelo: empresa.modelo ?? 'gpt-3.5-turbo'
      });
      
      // Agregar información de contacto si es relevante
      let respuestaFinal = respuesta;
      const quiereHablarConAlguien = /(hablar con alguien|quiero hablar|asesor|ayuda humana|atención humana)/i.test(mensajeLower);
      
      let numeroDerivacion: string | undefined = undefined;
      if (Array.isArray(empresa.ubicaciones)) {
        const sucursalDetectada = empresa.ubicaciones.find((suc) =>
          mensajeLower.includes((suc.ciudad ?? '').toLowerCase()) ||
          mensajeLower.includes((suc.nombre ?? '').toLowerCase())
        );
        if (sucursalDetectada?.derivarA?.[0]) numeroDerivacion = sucursalDetectada.derivarA[0];
      }
      if (!numeroDerivacion && Array.isArray(empresa.derivarA)) {
        numeroDerivacion = empresa.derivarA[0];
      }
      
      if (quiereHablarConAlguien && numeroDerivacion) {
        respuestaFinal = `Para avanzar con la compra o recibir asesoramiento personalizado, podés contactar a nuestro equipo al siguiente número: ${numeroDerivacion}. Que tengas un excelente día.`;
      } else if (/te gustaría más información|querés saber más|querés conocer más/i.test(respuesta) && numeroDerivacion) {
        respuestaFinal += `\n\n👉🏼 Si querés hablar con un asesor para recibir ayuda personalizada, podés contactarlo al número: ${numeroDerivacion}.`;
      }
      
      await enviarMensajeWhatsAppTexto(telefono, respuestaFinal, context.phoneNumberId);
      
      // Guardar en historial
      const ahora = new Date().toISOString();
      usuario.historial.push(JSON.stringify({
        role: 'user',
        content: mensaje,
        timestamp: ahora
      }));
      usuario.historial.push(JSON.stringify({
        role: 'assistant',
        content: respuestaFinal,
        timestamp: ahora
      }));
      
      usuario.historial = usuario.historial.slice(-40);
      usuario.num_mensajes_recibidos += 1;
      usuario.num_mensajes_enviados += 1;
      usuario.interacciones += 1;
      usuario.tokens_consumidos = (usuario.tokens_consumidos ?? 0) + 
        encode(mensaje).length + encode(respuestaFinal).length;
      usuario.ultimo_status = 'responded';
      usuario.ultimaInteraccion = ahora;
      
      await actualizarUsuario(usuario);
      
      return {
        success: true,
        end: true
      };
    } catch (error) {
      console.error('❌ Error en conversación general:', error);
      return {
        success: false,
        error: String(error)
      };
    }
  },
  
  async onInput(context: FlowContext, state: string, data: Record<string, any>): Promise<FlowResult> {
    // Este flujo no tiene estados intermedios, siempre termina en start
    return {
      success: true,
      end: true
    };
  },
  
  async onEnd(context: FlowContext, data: Record<string, any>): Promise<void> {
    console.log(`✅ [ConversacionGeneral] Flujo finalizado para ${context.telefono}`);
  }
};
