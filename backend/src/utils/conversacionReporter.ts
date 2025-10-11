import fs from "fs/promises";
import path from "path";
import { enviarCorreo } from './emailUtils.js';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rutaEmpresas = path.join(__dirname, "../../data/empresas.json");

export type EmpresaConfig = {
  nombre: string;
  categoria: string;
  telefono: string;
  email: string;
  derivarA: string[];
  prompt: string;
  catalogoPath: string;
  linkCatalogo: string;
};

let empresasData: Record<string, EmpresaConfig> | undefined;

/**
 * Carga y cachea las empresas desde JSON.
 */
export const obtenerEmpresas = async (): Promise<Record<string, EmpresaConfig>> => {
  
  if (!empresasData) {
    const raw = await fs.readFile(rutaEmpresas, "utf-8");
    empresasData = JSON.parse(raw);
  }
  return empresasData!;
  
};

/**
 * Devuelve la empresa y su clave (id) dado un número de WhatsApp.
 */
export const obtenerEmpresaPorNumero = async (
  numero: string
): Promise<{ key: string; config: EmpresaConfig } | null> => {
  const empresas = await obtenerEmpresas();
  for (const key in empresas) {
    if (empresas[key].telefono === numero) {
      return { key, config: empresas[key] };
    }
  }
  return null;
};

/**
 * Genera HTML con historial de conversación.
 */
const generarHtmlConversacion = (
  empresa: string,
  cliente: string,
  historial: string[]
): string => {
  const mensajesHtml = historial
    .map((linea) => {
      if (linea.startsWith("Cliente:")) {
        return `<p><strong>🗣 Usuario:</strong> ${linea.replace("Cliente:", "").trim()}</p>`;
      } else if (linea.startsWith("Asistente:")) {
        return `<p><strong>🤖 Asistente:</strong> ${linea.replace("Asistente:", "").trim()}</p>`;
      }
      return '';
    })
    .join("\n");

  return `
    <h2>📝 Reporte de Conversación</h2>
    <p><strong>Empresa:</strong> ${empresa}</p>
    <p><strong>Cliente:</strong> ${cliente}</p>
    <hr>
    <div style="font-family: sans-serif;">
      ${mensajesHtml}
    </div>
    <hr>
    <p style="font-size: 0.9em; color: gray;">Enviado automáticamente por tu asistente virtual</p>
  `;
};

/**
 * Envía la conversación por email con HTML y seguimiento.
 */
export const enviarConversacionPorEmail = async ({
  emailDestino,
  empresa,
  cliente,
  numeroUsuario,
  nombreUsuario,
  mensajeCliente,
  respuestaAsistente,
  historial = [],
}: {
  emailDestino: string;
  empresa: string;
  cliente: string;
  numeroUsuario: string;
  nombreUsuario?: string;
  mensajeCliente: string;
  respuestaAsistente: string;
  historial?: string[];
}) => {
  const subject = `Reporte de conversación – ${empresa}`;
  const text = `
Empresa: ${empresa}
Cliente: ${cliente}

🗣 Usuario: ${mensajeCliente}

🤖 Asistente: ${respuestaAsistente}
  `.trim();

  const historialExpandido = [
    ...historial.slice(-8), // últimas 4 rondas
    `Cliente: ${mensajeCliente}`,
    `Asistente: ${respuestaAsistente}`,
  ];

  const html = generarHtmlConversacion(empresa, cliente, historialExpandido);

  await enviarCorreo({
    to: emailDestino,
    subject,
    text,
    html,
    numeroUsuario,
    nombreUsuario,
  });
};
