import type { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

import { extraerDatosDePayloadWhatsApp } from '../utils/whatsappUtils.js';
import { buscarEmpresaPorTelefono } from '../utils/empresaUtils.js';
import { obtenerUsuario, actualizarUsuario } from '../utils/usuarioStore.js';
import { obtenerRespuestaChat, type ChatCompletionMessageParam } from '../services/openaiService.js';
import { verificarYEnviarResumen } from '../services/metricService.js';
import { enviarMensajeWhatsAppTexto } from '../services/metaService.js';
import { enviarConversacionPorEmail } from '../utils/conversacionReporter.js';
import { encode } from 'gpt-tokenizer';

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

    const { telefonoCliente, telefonoEmpresa, mensaje, profileName, error } = extraerDatosDePayloadWhatsApp(entrada);
    if (error || !mensaje || !telefonoCliente || !telefonoEmpresa) {
      res.status(400).json({ error: error ?? "Datos insuficientes" });
      return;
    }

    const empresa: EmpresaConfig | undefined = buscarEmpresaPorTelefono(telefonoEmpresa);
    if (!empresa) {
      res.status(404).json({ error: `Empresa no encontrada: ${telefonoEmpresa}` });
      return;
    }

    const textoCatalogo = empresa.catalogoPath ? leerCatalogoComoTexto(empresa.catalogoPath) : '';
    const usuario = await obtenerUsuario(telefonoCliente, empresa.nombre, profileName ?? undefined, telefonoEmpresa);

    if (!usuario.nombre && profileName) usuario.nombre = profileName;
    if (!usuario.empresaTelefono) usuario.empresaTelefono = telefonoEmpresa;

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
      await enviarMensajeWhatsAppTexto(telefonoCliente, '✅ Historial de conversación limpiado. Podés empezar de nuevo cuando quieras.', empresa.phoneNumberId);
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
      await enviarMensajeWhatsAppTexto(telefonoCliente, saludoElegido, empresa.phoneNumberId);
      usuario.historial.push(`Cliente: ${mensaje}`);
      usuario.historial.push(`Asistente: ${saludoElegido}`);
      usuario.saludado = true;
      usuario.ultimaInteraccion = new Date().toISOString();
      usuario.num_mensajes_recibidos += 1;
      usuario.num_mensajes_enviados += 1;
      usuario.interacciones += 1;
      usuario.tokens_consumidos = (usuario.tokens_consumidos ?? 0) + encode(mensaje).length + encode(saludoElegido).length;
      usuario.ultimo_status = 'responded';
      await actualizarUsuario(usuario);
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
        const match = entrada.match(/^(Cliente|Asistente): (.*)$/);
        if (!match) return [];
        const role: 'user' | 'assistant' = match[1] === 'Cliente' ? 'user' : 'assistant';
        return [{ role, content: match[2] }];
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
      await enviarMensajeWhatsAppTexto(telefonoCliente, msgDerivacion, empresa.phoneNumberId);
      usuario.despedido = true;
      await actualizarUsuario(usuario);
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

    if (!saludoRespondido) usuario.historial.push(`Cliente: ${mensaje}`);
    usuario.historial.push(`Asistente: ${respuesta}`);
    usuario.historial = usuario.historial.slice(-40);
    usuario.num_mensajes_recibidos += 1;
    usuario.num_mensajes_enviados += 1;
    usuario.interacciones += 1;
    usuario.tokens_consumidos = (usuario.tokens_consumidos ?? 0) + encode(mensaje).length + encode(respuesta).length;
    usuario.ultimo_status = 'responded';
    usuario.ultimaInteraccion = new Date().toISOString();

    if (esMensajeDeCierre && numeroDerivacion) {
      const msgCierre = `Gracias por tu consulta. Para avanzar con la compra o recibir asesoramiento personalizado, podés contactar a nuestro equipo al siguiente número: ${numeroDerivacion}. Que tengas un excelente día.`;
      await enviarMensajeWhatsAppTexto(telefonoCliente, msgCierre, empresa.phoneNumberId);
      usuario.despedido = true;
      await actualizarUsuario(usuario);
      res.sendStatus(200);
      return;
    }

    await enviarMensajeWhatsAppTexto(telefonoCliente, respuesta, empresa.phoneNumberId);
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
    res.sendStatus(200);

  } catch (error) {
    console.error("💥 Error en recibirMensaje:", error);
    next(error);
  }
};
