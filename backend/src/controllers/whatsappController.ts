import type { Request, Response, NextFunction } from 'express';

import { extraerDatosDePayloadWhatsApp } from '../utils/whatsappUtils.js';
import { buscarEmpresaPorTelefono } from '../utils/empresaUtilsMongo.js';
import { verificarYEnviarResumen } from '../services/metricService.js';
import { enviarMensajeWhatsAppTexto } from '../services/metaService.js';
import { enviarConversacionPorEmail } from '../utils/conversacionReporter.js';
import { wss } from '../app.js';
import { buscarOCrearContacto, limpiarHistorial, incrementarMetricas } from '../services/contactoService.js';
import { flowManager } from '../flows/index.js';
import type { FlowContext } from '../flows/types.js';
import { EmpresaModel } from '../models/Empresa.js';

import type { EmpresaConfig } from '../types/Types.js';

export const recibirMensaje = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('\n🔔 [WEBHOOK] Mensaje recibido en /api/whatsapp/webhook');
    console.log('🔔 [WEBHOOK] Body:', JSON.stringify(req.body, null, 2));
    
    const entrada = req.body;
    const messages = entrada?.entry?.[0]?.changes?.[0]?.value?.messages;
    if (!messages || !Array.isArray(messages)) {
      console.log('⚠️ [WEBHOOK] No hay mensajes en el payload, ignorando');
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

    // 🆕 SISTEMA UNIFICADO: Buscar o crear contacto (reemplaza usuario + cliente)
    console.log('🔍 [DEBUG] Llamando a buscarOCrearContacto con:', {
      telefono: telefonoCliente,
      profileName: profileName ?? undefined,
      empresaId: empresa.nombre,
      empresaTelefono: telefonoEmpresa
    });
    
    let contacto;
    try {
      contacto = await buscarOCrearContacto({
        telefono: telefonoCliente,
        profileName: profileName ?? undefined,
        empresaId: empresa.nombre,
        empresaTelefono: telefonoEmpresa
      });
      
      console.log('✅ [DEBUG] buscarOCrearContacto exitoso');
    } catch (errorContacto) {
      console.error('❌ [DEBUG] Error en buscarOCrearContacto:', errorContacto);
      console.error('❌ [DEBUG] Stack:', (errorContacto as Error).stack);
      throw errorContacto;
    }
    
    console.log('👤 Contacto obtenido/creado:', { 
      id: contacto._id, 
      nombre: contacto.nombre,
      apellido: contacto.apellido,
      empresaId: contacto.empresaId,
      telefono: contacto.telefono,
      interacciones: contacto.metricas.interacciones 
    });

    // 🧹 Comando especial: limpiar historial
    if (/^limpiar$/i.test(mensaje.trim())) {
      await limpiarHistorial(contacto._id.toString());
      await enviarMensajeWhatsAppTexto(telefonoCliente, '✅ Historial de conversación limpiado. Podés empezar de nuevo cuando quieras.', phoneNumberId);
      
      // También limpiar estado de flujos
      await flowManager.cancelFlow(telefonoCliente, empresa.nombre);
      
      res.sendStatus(200);
      return;
    }

    // 🔄 DECISIÓN: ¿Bot de pasos o GPT conversacional?
    console.log('\n🔄 ========== DECIDIENDO TIPO DE BOT ==========');
    
    // Verificar si la empresa tiene bot de pasos activo
    const { ConfiguracionBotModel } = await import('../modules/calendar/models/ConfiguracionBot.js');
    const configBot = await ConfiguracionBotModel.findOne({ empresaId: empresa.nombre });
    const usarBotDePasos = configBot?.activo === true;
    
    console.log(`🤖 Tipo de bot para ${empresa.nombre}: ${usarBotDePasos ? 'BOT DE PASOS' : 'GPT CONVERSACIONAL'}`);
    
    if (!usarBotDePasos) {
      // 🧠 USAR GPT CONVERSACIONAL DIRECTAMENTE
      console.log('🧠 Procesando con GPT conversacional...');
      
      try {
        const { obtenerRespuestaChat } = await import('../services/openaiService.js');
        const { actualizarHistorialConversacion, incrementarMetricas } = await import('../services/contactoService.js');
        
        // Construir historial para GPT
        const historialGPT: any[] = [
          {
            role: 'system',
            content: empresa.prompt || 'Eres un asistente virtual amable y servicial.'
          }
        ];
        
        // Agregar historial reciente (últimos 20 mensajes)
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
        
        // Obtener respuesta de GPT
        const modelo = empresa.modelo || 'gpt-3.5-turbo';
        const respuesta = await obtenerRespuestaChat({
          modelo,
          historial: historialGPT
        });
        
        console.log(`✅ [GPT] Respuesta generada (${respuesta.tokens} tokens, $${respuesta.costo})`);
        
        // Guardar en historial
        await actualizarHistorialConversacion(contacto._id.toString(), mensaje);
        await actualizarHistorialConversacion(contacto._id.toString(), respuesta.texto);
        
        // Actualizar métricas
        await incrementarMetricas(contacto._id.toString(), {
          mensajesRecibidos: 1,
          mensajesEnviados: 1,
          tokensConsumidos: respuesta.tokens,
          interacciones: 1
        });
        
        // Enviar respuesta
        await enviarMensajeWhatsAppTexto(telefonoCliente, respuesta.texto, phoneNumberId);
        
        // Actualizar métricas de la empresa
        try {
          const empresaDoc = await EmpresaModel.findOne({ nombre: empresa.nombre });
          if (empresaDoc && empresaDoc.uso) {
            empresaDoc.uso.mensajesEsteMes = (empresaDoc.uso.mensajesEsteMes || 0) + 1;
            empresaDoc.uso.ultimaActualizacion = new Date();
            await empresaDoc.save();
          }
        } catch (errorEmpresa) {
          console.error('⚠️ Error actualizando métricas de empresa (no crítico):', errorEmpresa);
        }
        
        res.sendStatus(200);
        return;
        
      } catch (errorGPT) {
        console.error('❌ [GPT] Error procesando con GPT:', errorGPT);
        await enviarMensajeWhatsAppTexto(
          telefonoCliente,
          'Disculpá, tuve un problema al procesar tu mensaje. Por favor, intentá de nuevo.',
          phoneNumberId
        );
        res.sendStatus(200);
        return;
      }
    }
    
    // 🤖 USAR BOT DE PASOS (Sistema de flujos)
    console.log('\n🔄 ========== PROCESANDO CON BOT DE PASOS ==========');
    
    const flowContext: FlowContext = {
      telefono: telefonoCliente,
      empresaId: empresa.nombre,  // ✅ SIEMPRE usar nombre, NUNCA _id
      mensaje,
      respuestaInteractiva,
      phoneNumberId,
      profileName
    };
    
    try {
      console.log('🔍 [DEBUG] Llamando a flowManager.handleMessage con:', {
        telefono: flowContext.telefono,
        empresaId: flowContext.empresaId,
        mensaje: flowContext.mensaje
      });
      
      const { handled, result } = await flowManager.handleMessage(flowContext);
      
      console.log('🔍 [DEBUG] Resultado de flowManager.handleMessage:', {
        handled,
        result: {
          success: result?.success,
          error: result?.error,
          end: result?.end,
          nextState: result?.nextState
        }
      });
      
      if (handled && result?.success) {
        console.log('✅ Mensaje procesado por sistema de flujos');
        
        // Actualizar métricas del contacto (no crítico)
        try {
          await incrementarMetricas(contacto._id.toString(), {
            mensajesRecibidos: 1,
            mensajesEnviados: 1,
            interacciones: 1
          });
        } catch (errorMetricas) {
          console.error('⚠️ Error actualizando métricas (no crítico):', errorMetricas);
        }
        
        // Verificar métricas (no crítico)
        try {
          await verificarYEnviarResumen(telefonoEmpresa, empresa);
        } catch (errorResumen) {
          console.error('⚠️ Error en resumen (no crítico):', errorResumen);
        }
        
        // Enviar email si está configurado (no crítico)
        if (empresa.email) {
          try {
            await enviarConversacionPorEmail({
              emailDestino: empresa.email,
              empresa: empresa.nombre,
              cliente: `${contacto.nombre} ${contacto.apellido}`,
              numeroUsuario: telefonoCliente,
              nombreUsuario: contacto.nombre,
              mensajeCliente: mensaje,
              respuestaAsistente: 'Procesado por sistema de flujos',
              historial: contacto.conversaciones.historial,
            });
          } catch (errorEmail) {
            console.error('⚠️ Error enviando email (no crítico):', errorEmail);
          }
        }
        
        // Notificar a clientes WebSocket (no crítico)
        try {
          wss.clients.forEach((client) => {
            if (client.readyState === 1 && (client as any).empresaId === empresa.nombre) {
              client.send(JSON.stringify({
                type: 'nuevo_mensaje',
                empresaId: empresa.nombre,
                contactoId: contacto._id.toString(),
                data: {
                  contacto: {
                    id: contacto._id.toString(),
                    nombre: contacto.nombre,
                    apellido: contacto.apellido,
                    telefono: contacto.telefono,
                    ultimaInteraccion: contacto.metricas.ultimaInteraccion
                  }
                }
              }));
            }
          });
        } catch (errorWS) {
          console.error('⚠️ Error en WebSocket (no crítico):', errorWS);
        }
        
        res.sendStatus(200);
        return;
      }
      
      // Si ningún flujo manejó el mensaje, algo salió mal
      console.error('❌ [DEBUG] Ningún flujo manejó el mensaje');
      console.error('❌ [DEBUG] handled:', handled);
      console.error('❌ [DEBUG] result:', result);
      console.error('❌ [DEBUG] FlowContext usado:', flowContext);
      
      // Mensaje más útil para el usuario
      await enviarMensajeWhatsAppTexto(
        telefonoCliente,
        '❌ No entendí tu mensaje. Escribí "menu" para ver las opciones disponibles.',
        phoneNumberId
      );
      res.sendStatus(200);
      return;
      
    } catch (errorFlujos) {
      console.error('❌ Error en sistema de flujos:', errorFlujos);
      console.error('❌ Stack trace:', (errorFlujos as Error).stack);
      
      // Solo enviar mensaje de error si NO se envió respuesta exitosa
      // (evita mensajes duplicados cuando el error ocurre después del procesamiento)
      if (!res.headersSent) {
        await enviarMensajeWhatsAppTexto(
          telefonoCliente,
          'Disculpá, hubo un error al procesar tu mensaje. Por favor, intentá de nuevo más tarde.',
          phoneNumberId
        );
      } else {
        console.log('⚠️ Error ocurrió después de enviar respuesta exitosa, no se envía mensaje de error');
      }
      
      if (!res.headersSent) {
        res.sendStatus(200);
      }
      return;
    }

  } catch (error) {
    console.error("💥 Error en recibirMensaje:", error);
    next(error);
  }
};
