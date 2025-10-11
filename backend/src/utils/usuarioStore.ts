import fs from "fs/promises";
import path from "path";
import { Usuario } from "../types/Types.js";
import { actualizarUsuarioCSV } from "./usuarioCSVStore.js";

const RUTA = path.resolve("data/usuarios.json");

async function leerUsuarios(): Promise<Usuario[]> {
  try {
    const raw = await fs.readFile(RUTA, "utf-8");

    if (!raw.trim()) {
      await fs.writeFile(RUTA, "[]", "utf-8");
      return [];
    }

    return JSON.parse(raw) as Usuario[];
  } catch (err: any) {
    if (err.code === "ENOENT") {
      await fs.mkdir(path.dirname(RUTA), { recursive: true });
      await fs.writeFile(RUTA, "[]", "utf-8");
      return [];
    }

    console.error("Error leyendo usuarios.json:", err);
    return [];
  }
}

async function guardarUsuarios(usuarios: Usuario[]): Promise<void> {
  await fs.mkdir(path.dirname(RUTA), { recursive: true });
  await fs.writeFile(RUTA, JSON.stringify(usuarios, null, 2), "utf-8");
}

/**
 * Obtiene un usuario o lo crea si no existe.
 */
export async function obtenerUsuario(
  id: string,
  empresaId: string,
  nombreOpcional?: string,
  empresaTelefonoOpcional?: string
): Promise<Usuario> {
  const usuarios = await leerUsuarios();
  let user = usuarios.find((u) => u.id === id && u.empresaId === empresaId);

  if (!user) {
    user = {
      id,
      numero: id,
      nombre: nombreOpcional ?? "", // 👈 lo seteamos si viene
      empresaId,
      empresaTelefono: empresaTelefonoOpcional ?? "",

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
      ultimo_status: "",
      tokens_consumidos: 0,
    };

    usuarios.push(user);
    await guardarUsuarios(usuarios);
    await actualizarUsuarioCSV(user);
  }

  return user;
}

export async function actualizarUsuario(user: Usuario): Promise<void> {
  const usuarios = await leerUsuarios();
  const idx = usuarios.findIndex((u) => u.id === user.id && u.empresaId === user.empresaId);

  user.ultima_actualizacion = new Date().toISOString();

  if (idx >= 0) {
    usuarios[idx] = user;
  } else {
    usuarios.push(user);
  }

  await guardarUsuarios(usuarios);
  await actualizarUsuarioCSV(user);
}

export async function actualizarEstadoUsuario(
  id: string,
  empresaId: string,
  cambios: Partial<Usuario>
): Promise<Usuario> {
  const usuarios = await leerUsuarios();
  const idx = usuarios.findIndex(u => u.id === id && u.empresaId === empresaId);

  if (idx === -1) throw new Error("Usuario no encontrado");

  const user = usuarios[idx];
  Object.assign(user, cambios);
  user.ultima_actualizacion = new Date().toISOString();

  usuarios[idx] = user;
  await guardarUsuarios(usuarios);
  await actualizarUsuarioCSV(user);

  return user;
}

export async function registrarInteraccionUsuario(
  id: string,
  empresaId: string,
  tokensUsados: number,
  mensajeEnviado: string,
  mensajeRecibido: string
): Promise<Usuario> {
  const usuarios = await leerUsuarios();
  const idx = usuarios.findIndex(u => u.id === id && u.empresaId === empresaId);

  if (idx === -1) throw new Error("Usuario no encontrado");

  const user = usuarios[idx];

  user.num_mensajes_enviados += 1;
  user.num_mensajes_recibidos += 1;
  user.interacciones += 1;
  user.tokens_consumidos = (user.tokens_consumidos || 0) + tokensUsados;
  user.ultimo_status = 'received';
  user.ultima_actualizacion = new Date().toISOString();

  usuarios[idx] = user;
  await guardarUsuarios(usuarios);
  await actualizarUsuarioCSV(user);

  return user;
}

export async function agregarAlHistorial(
  id: string,
  empresaId: string,
  mensaje: string,
  quien: 'user' | 'assistant'
): Promise<{ actualizado: boolean; duplicado: boolean }> {
  const usuarios = await leerUsuarios();
  const idx = usuarios.findIndex(u => u.id === id && u.empresaId === empresaId);
  if (idx === -1) throw new Error("Usuario no encontrado");

  const user = usuarios[idx];
  const historial = user.historial;
  const ultimoMensaje = historial[historial.length - 1];

  const normalizar = (texto: string) =>
    texto.trim().toLowerCase().replace(/\s+/g, ' ');

  const esDuplicado = ultimoMensaje
    ? normalizar(ultimoMensaje) === normalizar(mensaje)
    : false;

  if (!esDuplicado) {
    user.historial.push(mensaje);
    user.ultima_actualizacion = new Date().toISOString();
    usuarios[idx] = user;
    await guardarUsuarios(usuarios);
    await actualizarUsuarioCSV(user);
    return { actualizado: true, duplicado: false };
  }

  return { actualizado: false, duplicado: true };
}

