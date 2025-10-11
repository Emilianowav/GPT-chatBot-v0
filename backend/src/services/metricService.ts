// src/services/registroService.ts

import fs from 'fs/promises';
import path from 'path';
import { enviarCorreo } from '../utils/emailUtils.js';
import { EmpresaConfig } from "../types/Types.js";

const rutaConversaciones = path.resolve('data/conversaciones.json');
const UMBRAL = 5;

type MensajeHistorial = {
  entrada: string;
  salida: string;
  timestamp: string;
};

type RegistroConversacion = {
  empresa: string;
  historial: MensajeHistorial[];
};

/**
 * Registra una nueva interacción para un cliente.
 */
export const registrarInteraccion = async (
  telefono: string,
  entrada: string,
  salida: string,
  empresa: string
): Promise<void> => {
  const data: Record<string, RegistroConversacion> = await leerConversaciones();

  if (!data[telefono]) {
    data[telefono] = { empresa, historial: [] };
  }

  data[telefono].historial.push({
    entrada,
    salida,
    timestamp: new Date().toISOString(),
  });

  await guardarConversaciones(data);
};

/**
 * Verifica si se alcanzó el umbral de interacciones y envía resumen por email si corresponde.
 */
export const verificarYEnviarResumen = async (
  telefono: string,
  empresaConfig: EmpresaConfig
): Promise<void> => {
  const data: Record<string, RegistroConversacion> = await leerConversaciones();
  const historial = data[telefono]?.historial || [];

  if (!empresaConfig.email) {
    console.error(`[registroService] No se puede enviar resumen: empresa ${empresaConfig.nombre} no tiene email configurado.`);
    return;
  }

  if (historial.length >= UMBRAL) {
    const html = generarResumenHTML(telefono, historial);
    const subject = `📝 Resumen de conversación - ${empresaConfig.nombre}`;

    await enviarCorreo({
      to: empresaConfig.email,
      subject,
      html,
      numeroUsuario: telefono,
      nombreUsuario: `Cliente ${telefono.slice(-4)}`, // 👈 o lo que prefieras mostrar
    });

    // Reset del historial
    data[telefono].historial = [];
    await guardarConversaciones(data);
  }
};

/**
 * Genera un resumen HTML simple para enviar por email.
 */
const generarResumenHTML = (telefono: string, historial: MensajeHistorial[]): string => {
  const rows = historial
    .map(
      (msg, i) => `
      <tr>
        <td style="text-align:center;">${i + 1}</td>
        <td>${new Date(msg.timestamp).toLocaleString()}</td>
        <td>${msg.entrada}</td>
        <td>${msg.salida}</td>
      </tr>`
    )
    .join('');

  return `
    <div style="font-family: sans-serif;">
      <h2>Resumen de conversación con ${telefono}</h2>
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
        <thead style="background-color: #f0f0f0;">
          <tr>
            <th>#</th>
            <th>Hora</th>
            <th>Usuario</th>
            <th>Asistente</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <p style="color: gray; font-size: 0.9em; margin-top: 1em;">Reporte generado automáticamente por tu bot 🤖</p>
    </div>
  `;
};

/**
 * Lee el archivo de conversaciones.
 */
const leerConversaciones = async (): Promise<Record<string, RegistroConversacion>> => {
  try {
    const contenido = await fs.readFile(rutaConversaciones, 'utf8');
    return JSON.parse(contenido);
  } catch {
    return {};
  }
};

/**
 * Guarda el archivo de conversaciones.
 */
const guardarConversaciones = async (data: Record<string, RegistroConversacion>): Promise<void> => {
  await fs.writeFile(rutaConversaciones, JSON.stringify(data, null, 2), 'utf8');
};
