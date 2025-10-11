import { ChatCompletionMessageParam, obtenerRespuestaChat } from './openaiService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
// 👉 Usamos solo la carpeta 'data', no el archivo, para armar rutas dinámicas después
const __dirname = path.resolve('./data');

const MAX_INTERACCIONES = 5;

type Conversacion = {
  mensajes: ChatCompletionMessageParam[];
  interacciones: number;
  resumen?: ChatCompletionMessageParam;
};

const conversaciones = new Map<string, Conversacion>();

function esCierre(mensaje: string): boolean {
  const patrones = [
    /gracias.*(chau|hasta luego|nos vemos)/i,
    /fue un gusto/i,
    /puedo ayudarte en algo más/i,
    /perfecto.*(hacemos el pedido|te llega el link)/i,
    /escribí al/i,
  ];
  return patrones.some(p => p.test(mensaje));
}

export async function actualizarContexto(
  clienteId: string,
  mensajeUsuario: string
): Promise<ChatCompletionMessageParam[]> {
  let conv = conversaciones.get(clienteId);

  const primerMensaje = !conv;

  if (!conv) {
    conv = {
      mensajes: [],
      interacciones: 0,
    };
  }

  conv.mensajes.push({ role: 'user', content: mensajeUsuario });
  conversaciones.set(clienteId, conv);

  // 🚨 Si es la primera vez que aparece este cliente, guardamos ya
  if (primerMensaje) guardarConversacion(clienteId, conv);

  return conv.mensajes;
}

export async function registrarRespuesta(
  clienteId: string,
  respuesta: string
): Promise<boolean> {
  const conv = conversaciones.get(clienteId);
  if (!conv) return false;

  conv.mensajes.push({ role: 'assistant', content: respuesta });
  conv.interacciones = conv.mensajes.filter(m => m.role === 'assistant').length;

  if (conv.interacciones >= MAX_INTERACCIONES && !conv.resumen) {
    const resumen = await generarResumen(conv.mensajes);
    conv.mensajes = [resumen];
    conv.resumen = resumen;
    conv.interacciones = 1;
  }

  if (esCierre(respuesta)) {
    guardarConversacion(clienteId, conv);
    conversaciones.delete(clienteId);
    return true;
  }

  conversaciones.set(clienteId, conv);
  return false;
}

async function generarResumen(mensajes: ChatCompletionMessageParam[]): Promise<ChatCompletionMessageParam> {
  const promptResumen: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: 'Resumí la conversación entre cliente y asistente en 2-3 líneas, enfatizando información importante para la empresa.',
    },
    ...mensajes,
  ];

  const resultado = await obtenerRespuestaChat({
    modelo: 'gpt-3.5-turbo',
    historial: promptResumen,
  });

  return {
    role: 'system',
    content: `Resumen previo: ${resultado.texto}`,
  };
}

function guardarConversacion(clienteId: string, conv: Conversacion) {
  const dir = path.resolve(__dirname);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const ruta = path.join(dir, `${clienteId}_${Date.now()}.json`);
  fs.writeFileSync(ruta, JSON.stringify(conv, null, 2));
}
