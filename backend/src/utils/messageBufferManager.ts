// 📁 utils/messageBufferManager.ts
import type { Usuario, EmpresaConfig } from '../types/Types.js';

type OnFlushCallback = (mensajes: string[], usuario: Usuario, empresa: EmpresaConfig) => Promise<void>;

type BufferEntry = {
  mensajes: string[];
  timer: NodeJS.Timeout;
  usuario: Usuario;
  empresa: EmpresaConfig;
};

const buffers: Record<string, BufferEntry> = {};
const TIEMPO_BUFFER_MS = 3500; // ⏱️ ajustable (3.5 segundos)

export function agregarMensajeABuffer(
  mensaje: string,
  usuario: Usuario,
  empresa: EmpresaConfig,
  onFlush: OnFlushCallback
) {
  const clave = `${usuario.id}|${usuario.empresaId}`;
  const existente = buffers[clave];

  if (existente) {
    clearTimeout(existente.timer);
    existente.mensajes.push(mensaje);
    existente.timer = setTimeout(() => flushBuffer(clave, onFlush), TIEMPO_BUFFER_MS);
  } else {
    buffers[clave] = {
      mensajes: [mensaje],
      usuario,
      empresa,
      timer: setTimeout(() => flushBuffer(clave, onFlush), TIEMPO_BUFFER_MS)
    };
  }
}

async function flushBuffer(clave: string, onFlush: OnFlushCallback) {
  const buffer = buffers[clave];
  if (!buffer) return;

  delete buffers[clave];

  try {
    await onFlush(buffer.mensajes, buffer.usuario, buffer.empresa);
  } catch (err) {
    console.error(`Error al procesar buffer de ${clave}:`, err);
  }
}
