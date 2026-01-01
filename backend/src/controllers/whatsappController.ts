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
import { startTracking, endTracking } from '../services/conversationTracker.js';
import { EmpresaModel } from '../models/Empresa.js';
import { universalRouter } from '../services/universalRouter.js';
import { apiKeywordHandler } from '../services/apiKeywordHandler.js';
import { generateDynamicPaymentLink } from '../services/paymentLinkService.js';

import type { EmpresaConfig } from '../types/Types.js';

// Empresas con pagos habilitados (por ID o nombre)
const EMPRESAS_CON_PAGOS = ['6940a9a181b92bfce970fdb5', 'Veo Veo'];

// Tool para generar link de pago (para function calling de GPT)
const paymentLinkTool = {
  type: "function" as const,
  function: {
    name: "generate_payment_link",
    description: "Genera un link de pago de Mercado Pago cuando el cliente confirma su pedido y quiere pagar.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Título del pedido" },
        amount: { type: "number", description: "Monto total a cobrar" },
        description: { type: "string", description: "Descripción del pedido" }
      },
      required: ["title", "amount"]
    }
  }
};

export const recibirMensaje = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    
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
    
    // Buscar el documento MongoDB de la empresa para obtener el _id
    const empresaDoc = await EmpresaModel.findOne({ nombre: empresa.nombre });
    const empresaMongoId = empresaDoc?._id?.toString();
    
    console.log('🆔 Empresa MongoDB ID:', empresaMongoId);
    
    // Validación de seguridad: empresaMongoId debe existir
    if (!empresaMongoId) {
      console.error('❌ [SECURITY] No se pudo obtener empresaMongoId para:', empresa.nombre);
      res.status(500).json({ error: 'Error interno: empresa no encontrada en BD' });
      return;
    }

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
      telefonoContacto: contacto.telefono,
      telefonoWebhook: telefonoCliente,
      telefonosCoinciden: contacto.telefono === telefonoCliente,
      interacciones: contacto.metricas.interacciones 
    });

    // Guardar phoneNumberId para intervención manual
    if (phoneNumberId && contacto.ultimoPhoneNumberId !== phoneNumberId) {
      contacto.ultimoPhoneNumberId = phoneNumberId;
      await contacto.save();
      console.log('📱 [WEBHOOK] phoneNumberId actualizado:', phoneNumberId);
    }

    // 🛑 INTERVENCIÓN HUMANA: Si el chatbot está pausado, solo guardar mensaje y notificar
    if (contacto.chatbotPausado) {
      console.log('⏸️ [INTERVENCIÓN] Chatbot pausado para este contacto, no se responde automáticamente');
      
      // Guardar mensaje en historial
      const { actualizarHistorialConversacion, incrementarMetricas } = await import('../services/contactoService.js');
      await actualizarHistorialConversacion(contacto._id.toString(), `Cliente: ${mensaje}`);
      await incrementarMetricas(contacto._id.toString(), {
        mensajesRecibidos: 1,
        interacciones: 1
      });
      
      // Notificar al CRM vía WebSocket
      if (wss) {
        wss.clients.forEach((client: any) => {
          if (client.readyState === 1 && client.empresaId === empresa.nombre) {
            client.send(JSON.stringify({
              type: 'nuevo_mensaje_intervencion',
              contactoId: contacto._id.toString(),
              mensaje: {
                contenido: mensaje,
                rol: 'user',
                fecha: new Date().toISOString()
              },
              contacto: {
                nombre: contacto.nombre,
                apellido: contacto.apellido,
                telefono: contacto.telefono
              }
            }));
          }
        });
      }
      
      res.sendStatus(200);
      return;
    }

    // 🧹 Comando especial: limpiar historial
    if (/^limpiar$/i.test(mensaje.trim())) {
      await limpiarHistorial(contacto._id.toString());
      await enviarMensajeWhatsAppTexto(telefonoCliente, '✅ Historial de conversación limpiado. Podés empezar de nuevo cuando quieras.', phoneNumberId);
      
      // También limpiar estado de flujos
      await flowManager.cancelFlow(telefonoCliente, empresa.nombre);
      
      res.sendStatus(200);
      return;
    }

    // 🎯 ROUTER UNIVERSAL: Evaluar triggers ANTES de decidir flujo
    console.log('\n🎯 ========== ROUTER UNIVERSAL ==========');
    
    const routerDecision = await universalRouter.route({
      mensaje,
      telefonoCliente,
      empresaId: empresaMongoId || empresa.nombre, // ObjectId para buscar workflows
      empresaNombre: empresa.nombre, // Nombre para buscar contactos
      currentFlow: undefined // TODO: obtener flujo actual del contexto
    });
    
    console.log('📍 Decisión del router:', routerDecision.action);
    
    // Si hay un workflow activo, continuar la conversación
    if (routerDecision.action === 'continue_workflow' && routerDecision.metadata) {
      console.log('🔄 Continuando Workflow conversacional...');
      
      const { workflowConversationalHandler } = await import('../services/workflowConversationalHandler.js');
      const workflowResult = await workflowConversationalHandler.continueWorkflow(
        mensaje,
        routerDecision.metadata
      );
      
      // Guardar en historial
      const { actualizarHistorialConversacion, incrementarMetricas } = await import('../services/contactoService.js');
      await actualizarHistorialConversacion(contacto._id.toString(), mensaje);
      await actualizarHistorialConversacion(contacto._id.toString(), workflowResult.response);
      
      // Actualizar métricas
      await incrementarMetricas(contacto._id.toString(), {
        mensajesRecibidos: 1,
        mensajesEnviados: 1,
        interacciones: 1
      });
      
      // Enviar respuesta
      await enviarMensajeWhatsAppTexto(telefonoCliente, workflowResult.response, phoneNumberId);
      
      console.log(`📊 Paso: ${workflowResult.metadata?.pasoActual}/${workflowResult.metadata?.totalPasos}`);
      console.log(`✅ Completado: ${workflowResult.completed}`);
      
      // Si el workflow se completó, reiniciar automáticamente el menú principal
      if (workflowResult.completed) {
        console.log('🔄 Workflow completado - Reiniciando menú principal automáticamente...');
        
        // Buscar el workflow del menú principal
        const { universalRouter } = await import('../services/universalRouter.js');
        const menuDecision = await universalRouter.route({
          mensaje: 'hola',
          telefonoCliente: telefonoCliente,
          empresaId: contacto.empresaId.toString(),
          empresaNombre: contacto.empresaNombre
        });
        
        if (menuDecision.action === 'start_workflow' && menuDecision.metadata) {
          const menuResult = await workflowConversationalHandler.startWorkflow(
            contacto._id.toString(),
            menuDecision.metadata
          );
          
          // Enviar menú principal
          await enviarMensajeWhatsAppTexto(telefonoCliente, menuResult.response, phoneNumberId);
          await actualizarHistorialConversacion(contacto._id.toString(), menuResult.response);
          
          console.log('✅ Menú principal reiniciado automáticamente');
        }
      }
      
      res.sendStatus(200);
      return;
    }
    
    // Si se detectó un nuevo workflow, iniciarlo
    if (routerDecision.action === 'start_workflow' && routerDecision.metadata) {
      console.log('🔄 Iniciando Workflow conversacional...');
      
      const { workflowConversationalHandler } = await import('../services/workflowConversationalHandler.js');
      const workflowResult = await workflowConversationalHandler.startWorkflow(
        contacto._id.toString(),
        routerDecision.metadata
      );
      
      // Guardar en historial
      const { actualizarHistorialConversacion, incrementarMetricas } = await import('../services/contactoService.js');
      await actualizarHistorialConversacion(contacto._id.toString(), mensaje);
      await actualizarHistorialConversacion(contacto._id.toString(), workflowResult.response);
      
      // Actualizar métricas
      await incrementarMetricas(contacto._id.toString(), {
        mensajesRecibidos: 1,
        mensajesEnviados: 1,
        interacciones: 1
      });
      
      // Enviar respuesta
      await enviarMensajeWhatsAppTexto(telefonoCliente, workflowResult.response, phoneNumberId);
      
      console.log(`📊 Workflow iniciado: ${workflowResult.metadata?.workflowName}`);
      
      res.sendStatus(200);
      return;
    }
    
    // Si se detectó una keyword de API, ejecutarla y responder
    if (routerDecision.action === 'execute_api' && routerDecision.metadata) {
      console.log('🚀 Ejecutando API keyword...');
      
      const apiResult = await apiKeywordHandler.execute(routerDecision.metadata);
      
      if (apiResult.success) {
        console.log('✅ API ejecutada exitosamente');
        
        // Guardar en historial
        const { actualizarHistorialConversacion, incrementarMetricas } = await import('../services/contactoService.js');
        await actualizarHistorialConversacion(contacto._id.toString(), mensaje);
        await actualizarHistorialConversacion(contacto._id.toString(), apiResult.response);
        
        // Actualizar métricas
        await incrementarMetricas(contacto._id.toString(), {
          mensajesRecibidos: 1,
          mensajesEnviados: 1,
          interacciones: 1
        });
        
        // Enviar respuesta
        await enviarMensajeWhatsAppTexto(telefonoCliente, apiResult.response, phoneNumberId);
        
        console.log(`⏱️ Tiempo de ejecución: ${apiResult.metadata?.executionTime}ms`);
        
        res.sendStatus(200);
        return;
      } else {
        console.error('❌ Error ejecutando API:', apiResult.error);
        // Continuar con flujo conversacional como fallback
      }
    }
    
    // 🔄 DECISIÓN: ¿Bot de pasos o GPT conversacional?
    console.log('\n🔄 ========== DECIDIENDO TIPO DE BOT ==========');
    
    // Verificar si la empresa tiene bot de pasos activo
    const { ConfiguracionBotModel } = await import('../modules/calendar/models/ConfiguracionBot.js');
    const configBot = await ConfiguracionBotModel.findOne({ empresaId: empresa.nombre });
    const usarBotDePasos = configBot?.activo === true;
    
    console.log(`🤖 Tipo de bot para ${empresa.nombre}: ${usarBotDePasos ? 'BOT DE PASOS' : 'GPT CONVERSACIONAL'}`);
    
    if (!usarBotDePasos) {
      // 🧠 USAR GPT CONVERSACIONAL DIRECTAMENTE (CON SOPORTE DE PAGOS)
      console.log('🧠 Procesando con GPT conversacional...');
      
      // Verificar si la empresa tiene pagos habilitados
      // Buscar el _id de la empresa en MongoDB
      const empresaDoc = await EmpresaModel.findOne({ nombre: empresa.nombre });
      const empresaIdStr = empresaDoc?._id?.toString() || '';
      
      // Verificar si tiene módulo de Mercado Pago habilitado
      const moduloMP = empresaDoc?.modulos?.find((m: any) => m.id === 'mercadopago' && m.activo);
      const tieneMPHabilitado = moduloMP ? true : false;
      
      // Fallback a lista hardcodeada para compatibilidad
      const tienePageosHabilitados = tieneMPHabilitado || 
                                      EMPRESAS_CON_PAGOS.includes(empresaIdStr) || 
                                      EMPRESAS_CON_PAGOS.includes(empresa.nombre);
      
      console.log(`💳 [GPT] Empresa: ${empresa.nombre}, ID: ${empresaIdStr}, MP habilitado: ${tieneMPHabilitado}, Pagos habilitados: ${tienePageosHabilitados}`);
      
      try {
        const { obtenerRespuestaChat } = await import('../services/openaiService.js');
        const { actualizarHistorialConversacion, incrementarMetricas } = await import('../services/contactoService.js');
        
        // Construir prompt base con instrucciones de pago si aplica
        let promptBase = empresa.prompt || 'Eres un asistente virtual amable y servicial.';
        
        if (tienePageosHabilitados) {
          // Obtener payment links de la empresa para incluir en el prompt
          const { PaymentLink } = await import('../modules/mercadopago/models/PaymentLink.js');
          const { Seller } = await import('../modules/mercadopago/models/Seller.js');
          
          const seller = await Seller.findOne({ internalId: empresa.nombre });
          let productosInfo = '';
          
          if (seller) {
            // Determinar el prefijo del slug según la empresa
            let slugPrefix = '';
            if (empresa.nombre === 'JFC Techno') {
              slugPrefix = 'jfc-';
            } else if (empresa.nombre === 'Veo Veo') {
              slugPrefix = 'veo-';
            }
            
            // Filtrar payment links por sellerId Y por prefijo de slug
            const query: any = { 
              sellerId: seller.userId,
              active: true 
            };
            
            // Si hay prefijo, filtrar por slug que empiece con ese prefijo
            if (slugPrefix) {
              query.slug = { $regex: `^${slugPrefix}`, $options: 'i' };
            }
            
            const paymentLinks = await PaymentLink.find(query).limit(20);
            
            if (paymentLinks.length > 0) {
              productosInfo = '\n\n📦 PRODUCTOS DISPONIBLES:\n';
              paymentLinks.forEach(link => {
                productosInfo += `- ${link.title}: $${link.unitPrice} ARS (slug: ${link.slug})\n`;
              });
            }
          }
          
          promptBase += `\n\n--- INSTRUCCIONES DE PAGO ---
IMPORTANTE: Cuando el cliente mencione un producto o quiera pagar, DEBES:

1. Si menciona un producto específico (mouse, teclado, etc.), confirma el producto y pregunta si quiere proceder al pago
2. Cuando confirme que quiere pagar, USA LA FUNCIÓN generate_payment_link con:
   - title: nombre del producto (ej: "Mouse Gamer RGB")
   - amount: precio del producto (todos están a $1 ARS para pruebas)
   - description: descripción breve del producto

${productosInfo}

TRIGGERS para generar link de pago:
- "quiero pagar", "pagar", "sí quiero pagar", "confirmo", "listo", "proceder al pago", "comprar"

IMPORTANTE: 
- Cuando detectes intención de pago clara, USA LA FUNCIÓN generate_payment_link inmediatamente
- NO pidas datos adicionales como email o dirección
- El precio de prueba es $1 ARS para todos los productos
- Sé directo y genera el link cuando el cliente confirme`;
        }
        
        // Construir historial para GPT
        const historialGPT: any[] = [
          { role: 'system', content: promptBase }
        ];
        
        // Agregar historial completo
        const historialCompleto = contacto.conversaciones.historial;
        console.log(`📚 [GPT] Cargando historial: ${historialCompleto.length} mensajes`);
        for (let i = 0; i < historialCompleto.length; i++) {
          historialGPT.push({
            role: i % 2 === 0 ? 'user' : 'assistant',
            content: historialCompleto[i]
          });
        }
        
        // Agregar mensaje actual
        historialGPT.push({ role: 'user', content: mensaje });
        
        // Obtener respuesta de GPT (con tools si tiene pagos habilitados)
        const modelo = empresa.modelo || 'gpt-3.5-turbo';
        const tools = tienePageosHabilitados ? [paymentLinkTool] : undefined;
        
        const respuesta = await obtenerRespuestaChat({
          modelo,
          historial: historialGPT,
          tools
        });
        
        console.log(`✅ [GPT] Respuesta generada (${respuesta.tokens} tokens)`);
        
        // Guardar mensaje del usuario en historial
        await actualizarHistorialConversacion(contacto._id.toString(), mensaje);
        
        // Manejar respuesta (puede ser texto o function call)
        let textoFinal = respuesta.texto;
        let linkGenerado = false;
        
        // Si GPT llamó a la función de pago
        if (respuesta.functionCall && respuesta.functionCall.name === 'generate_payment_link') {
          console.log(`💳 [GPT] Function call detectado: generate_payment_link`);
          const args = respuesta.functionCall.arguments;
          
          const paymentResult = await generateDynamicPaymentLink({
            empresaId: empresaIdStr,
            title: args.title || `Pedido ${empresa.nombre}`,
            amount: args.amount || 0.20,
            description: args.description || '',
            clientePhone: telefonoCliente
          });
          
          if (paymentResult.success && paymentResult.paymentUrl) {
            console.log(`💳 [GPT] Link generado: ${paymentResult.paymentUrl}`);
            linkGenerado = true;
            textoFinal = `¡Perfecto! Tu pedido está listo. 🛒\n\n` +
              `📦 *${args.title || 'Tu pedido'}*\n` +
              `💰 Total: $${(args.amount || 0).toFixed(2)}\n\n` +
              `Para completar tu compra, hacé clic en el siguiente link:\n` +
              `👉 ${paymentResult.paymentUrl}\n\n` +
              `Una vez que realices el pago, te confirmaremos por este medio. ¡Gracias! 🙌`;
          }
        }
        
        // FALLBACK: Si GPT no llamó la función pero el usuario quiere pagar
        if (!linkGenerado && tienePageosHabilitados) {
          const mensajeLower = mensaje.toLowerCase();
          const triggersPago = ['quiero pagar', 'pagar', 'confirmo', 'listo', 'proceder', 'realizar pago'];
          const quierePagar = triggersPago.some(trigger => mensajeLower.includes(trigger));
          
          console.log(`💳 [GPT] FALLBACK check: quierePagar=${quierePagar}`);
          
          if (quierePagar) {
            console.log(`💳 [GPT] FALLBACK: Generando link por keywords...`);
            
            // Extraer cantidad del historial
            const historialTexto = historialCompleto.join(' ') + ' ' + mensaje;
            const numerosEncontrados = historialTexto.match(/(\d+)\s*(libros?|ejemplares?|unidades?|productos?)/gi);
            let cantidad = 1;
            
            if (numerosEncontrados && numerosEncontrados.length > 0) {
              const ultimoMatch = numerosEncontrados[numerosEncontrados.length - 1];
              const numMatch = ultimoMatch.match(/\d+/);
              if (numMatch) cantidad = parseInt(numMatch[0], 10);
            }
            
            const total = cantidad * 0.20;
            console.log(`💳 [GPT] FALLBACK: Cantidad=${cantidad}, Total=$${total}`);
            
            const paymentResult = await generateDynamicPaymentLink({
              empresaId: empresaIdStr,
              title: `Pedido ${empresa.nombre} - ${cantidad} libro${cantidad > 1 ? 's' : ''}`,
              amount: total,
              description: `Compra de ${cantidad} libro(s)`,
              clientePhone: telefonoCliente
            });
            
            if (paymentResult.success && paymentResult.paymentUrl) {
              console.log(`💳 [GPT] FALLBACK: Link generado: ${paymentResult.paymentUrl}`);
              textoFinal = `¡Perfecto! Tu pedido está listo. 🛒\n\n` +
                `📦 *Pedido ${empresa.nombre} - ${cantidad} libro${cantidad > 1 ? 's' : ''}*\n` +
                `💰 Total: $${total.toFixed(2)}\n\n` +
                `Para completar tu compra, hacé clic en el siguiente link:\n` +
                `👉 ${paymentResult.paymentUrl}\n\n` +
                `Una vez que realices el pago, te confirmaremos por este medio. ¡Gracias! 🙌`;
            }
          }
        }
        
        // Guardar respuesta del asistente
        await actualizarHistorialConversacion(contacto._id.toString(), textoFinal);
        
        // Actualizar métricas
        await incrementarMetricas(contacto._id.toString(), {
          mensajesRecibidos: 1,
          mensajesEnviados: 1,
          tokensConsumidos: respuesta.tokens,
          interacciones: 1
        });
        
        // Enviar respuesta
        await enviarMensajeWhatsAppTexto(telefonoCliente, textoFinal, phoneNumberId);
        
        // Actualizar métricas de la empresa
        try {
          const empresaDoc = await EmpresaModel.findOne({ nombre: empresa.nombre });
          if (empresaDoc && empresaDoc.uso) {
            empresaDoc.uso.mensajesEsteMes = (empresaDoc.uso.mensajesEsteMes || 0) + 1;
            empresaDoc.uso.ultimaActualizacion = new Date();
            await empresaDoc.save();
          }
        } catch (errorEmpresa) {
          console.error('⚠️ Error actualizando métricas de empresa:', errorEmpresa);
        }
        
        res.sendStatus(200);
        return;
        
      } catch (errorGPT) {
        console.error('❌ [GPT] Error procesando con GPT:', errorGPT);
        console.error('❌ [GPT] Stack:', (errorGPT as Error).stack);
        
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
    
    // 🔄 Procesar con FlowManager (incluye notificacionViajesFlow)
    const flowContext: FlowContext = {
      telefono: telefonoCliente,
      empresaId: empresa.nombre,  // ✅ SIEMPRE usar nombre, NUNCA _id
      mensaje,
      respuestaInteractiva,
      phoneNumberId,
      profileName
    };
    
    // 📝 Iniciar tracking de mensajes para guardar en historial
    startTracking(telefonoCliente, contacto._id.toString());
    
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
        
        // Guardar en historial de conversaciones
        try {
          const { actualizarHistorialConversacion } = await import('../services/contactoService.js');
          
          // Guardar mensaje del usuario
          await actualizarHistorialConversacion(contacto._id.toString(), mensaje);
          
          // Obtener mensajes trackeados (respuestas del bot)
          const tracked = endTracking(telefonoCliente);
          if (tracked && tracked.mensajes.length > 0) {
            for (const respuesta of tracked.mensajes) {
              await actualizarHistorialConversacion(contacto._id.toString(), respuesta);
            }
            console.log(`📝 Historial actualizado: 1 mensaje usuario + ${tracked.mensajes.length} respuestas bot`);
          } else {
            console.log('📝 Historial actualizado: 1 mensaje usuario (sin respuestas trackeadas)');
          }
        } catch (errorHistorial) {
          console.error('⚠️ Error guardando historial (no crítico):', errorHistorial);
          // Limpiar tracking en caso de error
          endTracking(telefonoCliente);
        }
        
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
      
      // Limpiar tracking
      endTracking(telefonoCliente);
      
      // Mensaje más útil para el usuario
      await enviarMensajeWhatsAppTexto(
        telefonoCliente,
        'Escribí "menu" para ver las opciones disponibles.',
        phoneNumberId
      );
      res.sendStatus(200);
      return;
      
    } catch (errorFlujos) {
      console.error('❌ Error en sistema de flujos:', errorFlujos);
      console.error('❌ Stack trace:', (errorFlujos as Error).stack);
      
      // Limpiar tracking en caso de error
      endTracking(telefonoCliente);
      
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
