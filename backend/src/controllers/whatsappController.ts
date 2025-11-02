import type { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

import { extraerDatosDePayloadWhatsApp } from '../utils/whatsappUtils.js';
import { buscarEmpresaPorTelefono } from '../utils/empresaUtilsMongo.js';
import { obtenerUsuario, actualizarUsuario } from '../utils/usuarioStoreMongo.js';
import { obtenerRespuestaChat, type ChatCompletionMessageParam } from '../services/openaiService.js';
import { verificarYEnviarResumen } from '../services/metricService.js';
import { enviarMensajeWhatsAppTexto } from '../services/metaService.js';
import { enviarConversacionPorEmail } from '../utils/conversacionReporter.js';
import { encode } from 'gpt-tokenizer';
import { wss } from '../app.js';
import * as botTurnosService from '../modules/calendar/services/botTurnosService.js';
import { buscarOCrearClienteDesdeWhatsApp } from '../services/clienteAutoService.js';
import { procesarMensajeFlujoNotificaciones } from '../services/flujoNotificacionesService.js';
import * as gestorFlujos from '../services/gestorFlujos.js';

import type { EmpresaConfig } from '../types/Types.js';

const leerCatalogoComoTexto = (relativePath: string): string => {
  try {
    const absolutePath = path.resolve(process.cwd(), relativePath);
    return fs.readFileSync(absolutePath, 'utf-8').trim();
  } catch {
    return '';
  }
};

const SALUDO_REPETIR_CADA_MS = 24 * 60 * 60 * 1000;

export const recibirMensaje = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const entrada = req.body;
    const messages = entrada?.entry?.[0]?.changes?.[0]?.value?.messages;
    if (!messages || !Array.isArray(messages)) {
      res.sendStatus(200);
      return;
    }

    const { telefonoCliente, telefonoEmpresa, mensaje, profileName, phoneNumberId, tipoMensaje, respuestaInteractiva, error } = extraerDatosDePayloadWhatsApp(entrada);
    
    console.log('📋 Datos extraídos del webhook:', {
      telefonoCliente,
      telefonoEmpresa,
      phoneNumberId,
      tipoMensaje,
      respuestaInteractiva,
      mensaje: mensaje?.substring(0, 50)
    });
    
    if (error || !mensaje || !telefonoCliente || !telefonoEmpresa || !phoneNumberId) {
      res.status(400).json({ error: error ?? "Datos insuficientes" });
      return;
    }

    const empresa: EmpresaConfig | undefined = await buscarEmpresaPorTelefono(telefonoEmpresa);
    if (!empresa) {
      console.error(`❌ Empresa no encontrada para teléfono: ${telefonoEmpresa}`);
      res.status(404).json({ error: `Empresa no encontrada: ${telefonoEmpresa}` });
      return;
    }

    console.log('🏢 Empresa encontrada:', { nombre: empresa.nombre, telefono: empresa.telefono });

    const textoCatalogo = empresa.catalogoPath ? leerCatalogoComoTexto(empresa.catalogoPath) : '';
    const usuario = await obtenerUsuario(telefonoCliente, empresa.nombre, profileName ?? undefined, telefonoEmpresa);
    
    console.log('👤 Usuario obtenido/creado:', { 
      id: usuario.id, 
      nombre: usuario.nombre, 
      empresaId: usuario.empresaId,
      interacciones: usuario.interacciones 
    });

    if (!usuario.nombre && profileName) usuario.nombre = profileName;
    if (!usuario.empresaTelefono) usuario.empresaTelefono = telefonoEmpresa;

    // 🆕 Crear o actualizar cliente en la base de datos
    try {
      await buscarOCrearClienteDesdeWhatsApp({
        telefono: telefonoCliente,
        profileName: profileName ?? undefined,
        empresaId: (empresa as any)._id?.toString() || empresa.nombre,
        chatbotUserId: usuario.id
      });
    } catch (errorCliente) {
      console.error('⚠️ Error al crear/actualizar cliente:', errorCliente);
      // No interrumpir el flujo si falla la creación del cliente
    }

    // 🎯 GESTOR DE FLUJOS DINÁMICOS - Sistema unificado de procesamiento
    try {
      const empresaId = (empresa as any)._id?.toString() || empresa.nombre;
      
      const resultadoFlujo = await gestorFlujos.procesarMensaje(
        telefonoCliente,
        mensaje,
        empresaId
      );

      if (resultadoFlujo.procesado) {
        console.log(`✅ Mensaje procesado por flujo: ${resultadoFlujo.flujoEjecutado}`);
        
        // Enviar respuesta si el flujo lo requiere
        if (resultadoFlujo.debeEnviarRespuesta && resultadoFlujo.respuesta) {
          await enviarMensajeWhatsAppTexto(telefonoCliente, resultadoFlujo.respuesta, phoneNumberId);
        }
        
        // Actualizar usuario
        usuario.num_mensajes_recibidos += 1;
        usuario.num_mensajes_enviados += 1;
        usuario.interacciones += 1;
        usuario.ultimaInteraccion = new Date().toISOString();
        usuario.ultimo_status = resultadoFlujo.flujoEjecutado || 'flujo_dinamico';
        await actualizarUsuario(usuario);

        res.sendStatus(200);
        return;
      }
      
      console.log('⚠️ Ningún flujo procesó el mensaje, continuando con OpenAI');
    } catch (errorFlujos) {
      console.error('⚠️ Error en gestor de flujos, continuando con OpenAI:', errorFlujos);
      // Si el gestor de flujos falla, continuar con OpenAI
    }

    // 🧹 Borrado del historial al recibir "limpiar"
    if (/^limpiar$/i.test(mensaje.trim())) {
      usuario.historial = [];
      usuario.saludado = false;
      usuario.despedido = false;
      usuario.num_mensajes_recibidos = 0;
      usuario.num_mensajes_enviados = 0;
      usuario.interacciones = 0;
      usuario.tokens_consumidos = 0;
      usuario.ultimo_status = 'reset';
      await actualizarUsuario(usuario);
      await enviarMensajeWhatsAppTexto(telefonoCliente, '✅ Historial de conversación limpiado. Podés empezar de nuevo cuando quieras.', phoneNumberId);
      res.sendStatus(200);
      return;
    }

    const mensajeMinuscula = mensaje.toLowerCase();
    const esMensajeDeCierre = /gracias|perfecto|ok|entendido/i.test(mensajeMinuscula);
    const esSaludoCliente = /^(hola|buenas|buen día|buenas tardes|buenas noches|saludos|hey)[!. ]*$/i.test(mensajeMinuscula);

    const ahoraMs = Date.now();
    const ultimaInteraccionMs = new Date(usuario.ultimaInteraccion).getTime();
    const tiempoDesdeUltima = ahoraMs - ultimaInteraccionMs;
    const puedeSaludar = !usuario.saludado || tiempoDesdeUltima > SALUDO_REPETIR_CADA_MS;

    let saludoRespondido = false;
    if (puedeSaludar) {
      const saludos = empresa.saludos?.length
        ? empresa.saludos
        : ["¡Hola! Bienvenido a la concesionaria de motos ASZI. ¿En qué puedo ayudarte hoy?"];
      const saludoElegido = saludos[Math.floor(Math.random() * saludos.length)];
      await enviarMensajeWhatsAppTexto(telefonoCliente, saludoElegido, phoneNumberId);
      
      // Guardar mensajes con timestamp individual
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
      usuario.tokens_consumidos = (usuario.tokens_consumidos ?? 0) + encode(mensaje).length + encode(saludoElegido).length;
      usuario.ultimo_status = 'responded';
      
      // 🔧 CORRECCIÓN: Siempre guardar el usuario después de actualizar sus datos
      await actualizarUsuario(usuario);
      console.log('✅ Usuario guardado después del saludo:', { id: usuario.id, empresaId: usuario.empresaId });
      
      if (esSaludoCliente) {
        res.sendStatus(200);
        return;
      }
      saludoRespondido = true;
    }

    const promptSistema = `${empresa.prompt ?? 'Sos un asistente simpático y eficiente.'}${textoCatalogo ? '\n\nCatálogo disponible:\n' + textoCatalogo : ''}`;
    const historial: ChatCompletionMessageParam[] = [
      { role: 'system', content: promptSistema },
      ...usuario.historial.flatMap((entrada) => {
        try {
          // Intentar parsear como JSON (nuevo formato)
          const parsed = JSON.parse(entrada);
          if (parsed.role && parsed.content) {
            return [{ role: parsed.role, content: parsed.content }];
          }
        } catch (e) {
          // Si falla, intentar formato antiguo "Cliente: mensaje"
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

    const quiereHablarConAlguien = /(hablar con alguien|quiero hablar|asesor|ayuda humana|atención humana)/i.test(mensajeMinuscula);
    let numeroDerivacion: string | undefined = undefined;

    if (Array.isArray(empresa.ubicaciones)) {
      const sucursalDetectada = empresa.ubicaciones.find((suc) =>
        mensajeMinuscula.includes((suc.ciudad ?? '').toLowerCase()) ||
        mensajeMinuscula.includes((suc.nombre ?? '').toLowerCase())
      );
      if (sucursalDetectada?.derivarA?.[0]) numeroDerivacion = sucursalDetectada.derivarA[0];
    }
    if (!numeroDerivacion && Array.isArray(empresa.derivarA)) {
      numeroDerivacion = empresa.derivarA[0];
    }

    if (quiereHablarConAlguien && numeroDerivacion) {
      const msgDerivacion = `Para avanzar con la compra o recibir asesoramiento personalizado, podés contactar a nuestro equipo al siguiente número: ${numeroDerivacion}. Que tengas un excelente día.`;
      await enviarMensajeWhatsAppTexto(telefonoCliente, msgDerivacion, phoneNumberId);
      usuario.despedido = true;
      usuario.ultimaInteraccion = new Date().toISOString();
      await actualizarUsuario(usuario);
      console.log('✅ Usuario guardado después de derivación:', { id: usuario.id, empresaId: usuario.empresaId });
      res.sendStatus(200);
      return;
    }

    const { texto: respuestaOriginal } = await obtenerRespuestaChat({
      historial,
      modelo: empresa.modelo ?? 'gpt-3.5-turbo'
    });

    let respuesta = respuestaOriginal;
    if (/te gustaría más información|querés saber más|querés conocer más/i.test(respuestaOriginal) && numeroDerivacion) {
      respuesta += `\n\n👉🏼 Si querés hablar con un asesor para recibir ayuda personalizada, podés contactarlo al número: ${numeroDerivacion}.`;
    }

    // Guardar mensajes con timestamp individual
    const ahoraRespuesta = new Date().toISOString();
    
    // SIEMPRE guardar el mensaje del usuario (excepto si ya se guardó en el saludo)
    if (!saludoRespondido) {
      usuario.historial.push(JSON.stringify({
        role: 'user',
        content: mensaje,
        timestamp: ahoraRespuesta
      }));
      console.log('💾 Mensaje del usuario guardado:', { mensaje: mensaje.substring(0, 50), timestamp: ahoraRespuesta });
    }
    
    // SIEMPRE guardar la respuesta del asistente
    usuario.historial.push(JSON.stringify({
      role: 'assistant',
      content: respuesta,
      timestamp: ahoraRespuesta
    }));
    console.log('💾 Respuesta del asistente guardada:', { respuesta: respuesta.substring(0, 50), timestamp: ahoraRespuesta });
    
    usuario.historial = usuario.historial.slice(-40);
    usuario.num_mensajes_recibidos += 1;
    usuario.num_mensajes_enviados += 1;
    usuario.interacciones += 1;
    usuario.tokens_consumidos = (usuario.tokens_consumidos ?? 0) + encode(mensaje).length + encode(respuesta).length;
    usuario.ultimo_status = 'responded';
    usuario.ultimaInteraccion = new Date().toISOString();

    if (esMensajeDeCierre && numeroDerivacion) {
      const msgCierre = `Gracias por tu consulta. Para avanzar con la compra o recibir asesoramiento personalizado, podés contactar a nuestro equipo al siguiente número: ${numeroDerivacion}. Que tengas un excelente día.`;
      await enviarMensajeWhatsAppTexto(telefonoCliente, msgCierre, phoneNumberId);
      usuario.despedido = true;
      usuario.ultimaInteraccion = new Date().toISOString();
      await actualizarUsuario(usuario);
      console.log('✅ Usuario guardado después de mensaje de cierre:', { id: usuario.id, empresaId: usuario.empresaId });
      res.sendStatus(200);
      return;
    }

    await enviarMensajeWhatsAppTexto(telefonoCliente, respuesta, phoneNumberId);
    await verificarYEnviarResumen(telefonoEmpresa, empresa);

    if (empresa.email) {
      await enviarConversacionPorEmail({
        emailDestino: empresa.email,
        empresa: empresa.nombre,
        cliente: usuario.nombre ?? telefonoCliente,
        numeroUsuario: telefonoCliente,
        nombreUsuario: usuario.nombre,
        mensajeCliente: mensaje,
        respuestaAsistente: respuesta,
        historial: usuario.historial,
      });
    }

    await actualizarUsuario(usuario);
    console.log('✅ Usuario guardado al final del flujo:', { 
      id: usuario.id, 
      empresaId: usuario.empresaId, 
      interacciones: usuario.interacciones,
      totalMensajesEnHistorial: usuario.historial.length 
    });
    
    // Notificar a clientes WebSocket conectados
    wss.clients.forEach((client) => {
      if (client.readyState === 1 && (client as any).empresaId === empresa.nombre) {
        client.send(JSON.stringify({
          type: 'nuevo_mensaje',
          empresaId: empresa.nombre,
          usuarioId: usuario.id,
          data: {
            usuario: {
              id: usuario.id,
              nombre: usuario.nombre,
              numero: usuario.numero,
              ultimaInteraccion: usuario.ultimaInteraccion
            }
          }
        }));
      }
    });
    
    res.sendStatus(200);

  } catch (error) {
    console.error("💥 Error en recibirMensaje:", error);
    next(error);
  }
};
