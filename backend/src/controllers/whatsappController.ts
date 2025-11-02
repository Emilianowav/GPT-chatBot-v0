import type { Request, Response, NextFunction } from 'express';

import { extraerDatosDePayloadWhatsApp } from '../utils/whatsappUtils.js';
import { buscarEmpresaPorTelefono } from '../utils/empresaUtilsMongo.js';
import { obtenerUsuario, actualizarUsuario } from '../utils/usuarioStoreMongo.js';
import { verificarYEnviarResumen } from '../services/metricService.js';
import { enviarMensajeWhatsAppTexto } from '../services/metaService.js';
import { enviarConversacionPorEmail } from '../utils/conversacionReporter.js';
import { wss } from '../app.js';
import { buscarOCrearClienteDesdeWhatsApp } from '../services/clienteAutoService.js';
import { flowManager } from '../flows/index.js';
import type { FlowContext } from '../flows/types.js';

import type { EmpresaConfig } from '../types/Types.js';

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
    }

    // 🧹 Comando especial: limpiar historial
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
      
      // También limpiar estado de flujos
      await flowManager.cancelFlow(telefonoCliente, (empresa as any)._id?.toString() || empresa.nombre);
      
      res.sendStatus(200);
      return;
    }

    // 🔄 NUEVO SISTEMA DE FLUJOS DINÁMICOS
    console.log('\n🔄 ========== PROCESANDO CON SISTEMA DE FLUJOS ==========');
    
    const flowContext: FlowContext = {
      telefono: telefonoCliente,
      empresaId: (empresa as any)._id?.toString() || empresa.nombre,
      mensaje,
      respuestaInteractiva,
      phoneNumberId,
      profileName
    };
    
    try {
      const { handled, result } = await flowManager.handleMessage(flowContext);
      
      if (handled && result?.success) {
        console.log('✅ Mensaje procesado por sistema de flujos');
        
        // Actualizar métricas del usuario
        usuario.num_mensajes_recibidos += 1;
        usuario.num_mensajes_enviados += 1;
        usuario.interacciones += 1;
        usuario.ultimaInteraccion = new Date().toISOString();
        usuario.ultimo_status = 'flow_handled';
        await actualizarUsuario(usuario);
        
        // Verificar métricas
        await verificarYEnviarResumen(telefonoEmpresa, empresa);
        
        // Enviar email si está configurado
        if (empresa.email) {
          await enviarConversacionPorEmail({
            emailDestino: empresa.email,
            empresa: empresa.nombre,
            cliente: usuario.nombre ?? telefonoCliente,
            numeroUsuario: telefonoCliente,
            nombreUsuario: usuario.nombre,
            mensajeCliente: mensaje,
            respuestaAsistente: 'Procesado por sistema de flujos',
            historial: usuario.historial,
          });
        }
        
        // Notificar a clientes WebSocket
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
        return;
      }
      
      // Si ningún flujo manejó el mensaje, algo salió mal
      console.warn('⚠️ Ningún flujo manejó el mensaje, esto no debería ocurrir');
      await enviarMensajeWhatsAppTexto(
        telefonoCliente,
        'Disculpá, hubo un problema al procesar tu mensaje. Por favor, intentá de nuevo.',
        phoneNumberId
      );
      res.sendStatus(200);
      return;
      
    } catch (errorFlujos) {
      console.error('❌ Error en sistema de flujos:', errorFlujos);
      
      // Fallback: responder con mensaje genérico
      await enviarMensajeWhatsAppTexto(
        telefonoCliente,
        'Disculpá, hubo un error al procesar tu mensaje. Por favor, intentá de nuevo más tarde.',
        phoneNumberId
      );
      
      res.sendStatus(200);
      return;
    }

  } catch (error) {
    console.error("💥 Error en recibirMensaje:", error);
    next(error);
  }
};
