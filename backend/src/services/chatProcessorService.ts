// chatProcessorService.ts
import { obtenerUsuario, agregarAlHistorial, registrarInteraccionUsuario } from '../utils/usuarioStoreMongo.js';
import { procesarMensajeIA } from './mensajeService.js';
import { EmpresaConfig, MensajeProcesado } from '../types/Types.js';

export async function procesarMensajeChat(
  mensaje: string,
  telefono: string,
  empresa: EmpresaConfig
): Promise<MensajeProcesado | null> {
  const usuario = await obtenerUsuario(telefono, empresa.nombre);

  // 🚫 Verificamos si es duplicado. Si lo es, cortamos el flujo silenciosamente.
  const { duplicado } = await agregarAlHistorial(
    usuario.id,
    usuario.empresaId,
    `Cliente: ${mensaje}`,
    'user'
  );

  if (duplicado) return null;

  // 🧠 Procesamos el mensaje normalmente
  const { respuesta, tokens } = await procesarMensajeIA(mensaje, usuario.historial, empresa);

  // 💾 Guardamos la respuesta en el historial
  await agregarAlHistorial(usuario.id, usuario.empresaId, `Asistente: ${respuesta}`, 'assistant');

  // 📊 Registramos la interacción para métricas
  await registrarInteraccionUsuario(usuario.id, usuario.empresaId, tokens, mensaje, respuesta);

  return {
    respuesta,
    intencion: 'otro'
  };
}
