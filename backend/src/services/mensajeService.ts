import { obtenerRespuestaChat, ChatCompletionMessageParam } from '../services/openaiService.js';
import fs from 'fs/promises';
import path from 'path';
import { EmpresaConfig } from '../types/Types.js';

/**
 * Servicio que se encarga de construir el prompt,
 * enviar el historial + mensaje a OpenAI y devolver la respuesta.
 * NO maneja lógica de flujo o almacenamiento.
 */
export const procesarMensajeIA = async (
  mensaje: string,
  historialPrevio: string[],
  empresa: EmpresaConfig
): Promise<{ respuesta: string; tokens: number }> => {
  let catalogo = '';
  if (empresa.catalogoPath) {
    try {
      const raw = await fs.readFile(path.join('data', empresa.catalogoPath), 'utf-8');
      catalogo = `\nCatálogo de productos:\n${raw}`;
    } catch (err) {
      console.warn(`No se pudo cargar catálogo para ${empresa.nombre}`);
    }
  }

  const historialIA: ChatCompletionMessageParam[] = [
    { role: 'system', content: `${empresa.prompt}${catalogo}` },
    ...historialPrevio.map((h, i) => ({
      role: i % 2 === 0 ? 'user' as const : 'assistant' as const,
      content: h
    })),
    { role: 'user', content: mensaje }
  ];

  const { texto, tokens } = await obtenerRespuestaChat({
    historial: historialIA,
    modelo: empresa.modelo ?? 'gpt-3.5-turbo'
  });

  return { respuesta: texto, tokens };
};
