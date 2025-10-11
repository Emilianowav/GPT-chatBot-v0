import fs from "fs/promises";
import path from "path";
import { Usuario } from "../types/Types.js";

const RUTA_CSV = path.resolve("reports", "usuarios.csv");

const ENCABEZADO = [
  "empresaId",
  "id",
  "nombre",
  "interacciones",
  "num_mensajes_enviados",
  "num_mensajes_recibidos",
  "num_media_recibidos",
  "mensaje_ids",
  "ultimo_status",
  "ultima_actualizacion",
  "resumen"
].join(",");

function escapeCSV(valor: string | number | string[] | null | undefined): string {
  if (valor === null || valor === undefined) return "";
  if (Array.isArray(valor)) valor = valor.join(";");
  const str = String(valor).replace(/"/g, '""');
  return `"${str}"`;
}

function usuarioToCSV(usuario: Usuario): string {
  return [
    escapeCSV(usuario.empresaId),
    escapeCSV(usuario.id),
    escapeCSV(usuario.nombre || "Sin nombre"),
    usuario.interacciones,
    usuario.num_mensajes_enviados,
    usuario.num_mensajes_recibidos,
    usuario.num_media_recibidos,
    escapeCSV(usuario.mensaje_ids || []),
    escapeCSV(usuario.ultimo_status),
    new Date(usuario.ultima_actualizacion).toISOString(),
    escapeCSV(usuario.resumen || "")
  ].join(",");
}

export async function actualizarUsuarioCSV(usuario: Usuario): Promise<void> {
  await fs.mkdir(path.dirname(RUTA_CSV), { recursive: true });

  let lineas: string[] = [];

  try {
    const contenido = await fs.readFile(RUTA_CSV, "utf-8");
    lineas = contenido.split("\n").filter(Boolean);
  } catch {
    lineas = [ENCABEZADO];
  }

  const key = `"${usuario.empresaId}","${usuario.id}"`;
  const nuevaFila = usuarioToCSV(usuario);

  const indiceExistente = lineas.findIndex((linea) => linea.startsWith(key));

  if (indiceExistente >= 0) {
    lineas[indiceExistente] = nuevaFila;
  } else {
    lineas.push(nuevaFila);
  }

  await fs.writeFile(RUTA_CSV, lineas.join("\n"), "utf-8");
}
