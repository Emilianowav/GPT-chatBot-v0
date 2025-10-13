// 🗄️ Store de Usuarios usando MongoDB
import { UsuarioModel } from '../models/Usuario.js';
import type { Usuario } from '../types/Types.js';
import { actualizarUsuarioCSV } from './usuarioCSVStore.js';

/**
 * Obtiene un usuario o lo crea si no existe.
 */
export async function obtenerUsuario(
  id: string,
  empresaId: string,
  nombreOpcional?: string,
  empresaTelefonoOpcional?: string
): Promise<Usuario> {
  try {
    console.log('🔍 Buscando usuario en MongoDB:', { id, empresaId });
    
    // Buscar usuario existente
    let usuarioDoc = await UsuarioModel.findOne({ 
      numero: id, 
      empresaId: empresaId 
    });

    if (!usuarioDoc) {
      console.log('➕ Usuario no encontrado, creando nuevo...');
      
      // Crear nuevo usuario
      usuarioDoc = new UsuarioModel({
        numero: id,
        nombre: nombreOpcional ?? '',
        empresaId,
        empresaTelefono: empresaTelefonoOpcional ?? '',
        historial: [],
        interacciones: 0,
        ultimaInteraccion: new Date().toISOString(),
        ultima_actualizacion: new Date().toISOString(),
        saludado: false,
        despedido: false,
        resumen: undefined,
        num_mensajes_enviados: 0,
        num_mensajes_recibidos: 0,
        num_media_recibidos: 0,
        mensaje_ids: [],
        ultimo_status: '',
        tokens_consumidos: 0,
      });

      await usuarioDoc.save();
      console.log('✅ Usuario creado en MongoDB:', { id, empresaId });
    } else {
      console.log('✅ Usuario encontrado en MongoDB:', { id, empresaId });
    }

    const usuario = usuarioDoc.toUsuarioType();
    
    // Mantener sincronización con CSV para reportes
    await actualizarUsuarioCSV(usuario);
    
    return usuario;
  } catch (error) {
    console.error('❌ Error al obtener usuario de MongoDB:', error);
    throw error;
  }
}

/**
 * Actualiza un usuario existente
 */
export async function actualizarUsuario(user: Usuario): Promise<void> {
  try {
    console.log('🔄 Actualizando usuario en MongoDB:', { 
      id: user.id, 
      empresaId: user.empresaId, 
      interacciones: user.interacciones 
    });

    user.ultima_actualizacion = new Date().toISOString();

    const resultado = await UsuarioModel.findOneAndUpdate(
      { numero: user.id, empresaId: user.empresaId },
      {
        $set: {
          nombre: user.nombre,
          empresaTelefono: user.empresaTelefono,
          historial: user.historial,
          interacciones: user.interacciones,
          ultimaInteraccion: user.ultimaInteraccion,
          ultima_actualizacion: user.ultima_actualizacion,
          saludado: user.saludado,
          despedido: user.despedido,
          ultima_saludo: user.ultima_saludo,
          resumen: user.resumen,
          num_mensajes_enviados: user.num_mensajes_enviados,
          num_mensajes_recibidos: user.num_mensajes_recibidos,
          num_media_recibidos: user.num_media_recibidos,
          mensaje_ids: user.mensaje_ids,
          ultimo_status: user.ultimo_status,
          tokens_consumidos: user.tokens_consumidos,
          contactoInformado: user.contactoInformado
        }
      },
      { 
        new: true, 
        upsert: true // Crear si no existe
      }
    );

    if (resultado) {
      console.log('✅ Usuario actualizado en MongoDB exitosamente');
      await actualizarUsuarioCSV(user);
    } else {
      console.warn('⚠️ No se pudo actualizar el usuario en MongoDB');
    }
  } catch (error) {
    console.error('❌ Error al actualizar usuario en MongoDB:', error);
    throw error;
  }
}

/**
 * Actualiza campos específicos de un usuario
 */
export async function actualizarEstadoUsuario(
  id: string,
  empresaId: string,
  cambios: Partial<Usuario>
): Promise<Usuario> {
  try {
    console.log('🔄 Actualizando estado de usuario:', { id, empresaId, cambios: Object.keys(cambios) });

    const usuarioDoc = await UsuarioModel.findOneAndUpdate(
      { numero: id, empresaId: empresaId },
      {
        $set: {
          ...cambios,
          ultima_actualizacion: new Date().toISOString()
        }
      },
      { new: true }
    );

    if (!usuarioDoc) {
      throw new Error('Usuario no encontrado');
    }

    const usuario = usuarioDoc.toUsuarioType();
    await actualizarUsuarioCSV(usuario);
    
    console.log('✅ Estado de usuario actualizado');
    return usuario;
  } catch (error) {
    console.error('❌ Error al actualizar estado de usuario:', error);
    throw error;
  }
}

/**
 * Registra una interacción de usuario
 */
export async function registrarInteraccionUsuario(
  id: string,
  empresaId: string,
  tokensUsados: number,
  mensajeEnviado: string,
  mensajeRecibido: string
): Promise<Usuario> {
  try {
    const usuarioDoc = await UsuarioModel.findOneAndUpdate(
      { numero: id, empresaId: empresaId },
      {
        $inc: {
          num_mensajes_enviados: 1,
          num_mensajes_recibidos: 1,
          interacciones: 1,
          tokens_consumidos: tokensUsados
        },
        $set: {
          ultimo_status: 'received',
          ultima_actualizacion: new Date().toISOString()
        }
      },
      { new: true }
    );

    if (!usuarioDoc) {
      throw new Error('Usuario no encontrado');
    }

    const usuario = usuarioDoc.toUsuarioType();
    await actualizarUsuarioCSV(usuario);
    
    return usuario;
  } catch (error) {
    console.error('❌ Error al registrar interacción:', error);
    throw error;
  }
}

/**
 * Agrega un mensaje al historial
 */
export async function agregarAlHistorial(
  id: string,
  empresaId: string,
  mensaje: string,
  quien: 'user' | 'assistant'
): Promise<{ actualizado: boolean; duplicado: boolean }> {
  try {
    const usuarioDoc = await UsuarioModel.findOne({ 
      numero: id, 
      empresaId: empresaId 
    });

    if (!usuarioDoc) {
      throw new Error('Usuario no encontrado');
    }

    const historial = usuarioDoc.historial;
    const ultimoMensaje = historial[historial.length - 1];

    const normalizar = (texto: string) =>
      texto.trim().toLowerCase().replace(/\s+/g, ' ');

    const esDuplicado = ultimoMensaje
      ? normalizar(ultimoMensaje) === normalizar(mensaje)
      : false;

    if (!esDuplicado) {
      usuarioDoc.historial.push(mensaje);
      usuarioDoc.ultima_actualizacion = new Date().toISOString();
      await usuarioDoc.save();
      
      const usuario = usuarioDoc.toUsuarioType();
      await actualizarUsuarioCSV(usuario);
      
      return { actualizado: true, duplicado: false };
    }

    return { actualizado: false, duplicado: true };
  } catch (error) {
    console.error('❌ Error al agregar al historial:', error);
    throw error;
  }
}

/**
 * Obtiene todos los usuarios (para reportes)
 */
export async function obtenerTodosLosUsuarios(): Promise<Usuario[]> {
  try {
    const usuarios = await UsuarioModel.find({});
    return usuarios.map(u => u.toUsuarioType());
  } catch (error) {
    console.error('❌ Error al obtener todos los usuarios:', error);
    throw error;
  }
}

/**
 * Obtiene usuarios por empresa
 */
export async function obtenerUsuariosPorEmpresa(empresaId: string): Promise<Usuario[]> {
  try {
    const usuarios = await UsuarioModel.find({ empresaId });
    return usuarios.map(u => u.toUsuarioType());
  } catch (error) {
    console.error('❌ Error al obtener usuarios por empresa:', error);
    throw error;
  }
}
