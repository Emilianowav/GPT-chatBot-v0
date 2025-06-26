import { openai } from "../config/openai.js";
import type OpenAI from "openai";

export type ChatCompletionMessageParam = Parameters<
  OpenAI["chat"]["completions"]["create"]
>[0]["messages"][number];

type ResultadoChat = {
  texto: string;
  costo: number;
  tokens: number; // total de tokens usados
};

const costosPorModelo: Record<string, { prompt: number; completion: number }> = {
  "gpt-4": { prompt: 0.03 / 1000, completion: 0.06 / 1000 },
  "gpt-3.5-turbo": { prompt: 0.0015 / 1000, completion: 0.0015 / 1000 },
};

export const obtenerRespuestaChat = async ({
  promptBase,
  mensajeUsuario,
  modelo,
  historial,
}: {
  promptBase?: string;
  mensajeUsuario?: string;
  modelo: string;
  historial?: ChatCompletionMessageParam[];
}): Promise<ResultadoChat> => {
  const messages: ChatCompletionMessageParam[] = historial ?? [
    { role: "system", content: promptBase ?? "" },
    { role: "user", content: mensajeUsuario ?? "" },
  ];

  const completion = await openai.chat.completions.create({
    model: modelo,
    messages,
    temperature: 0.7,
  });

  const textoRespuesta = completion.choices[0].message.content ?? "Sin respuesta del modelo.";
  const usage = completion.usage;

  if (!usage) throw new Error("No se recibió información de uso de tokens.");

  const { prompt_tokens, completion_tokens } = usage;
  const tokensTotales = prompt_tokens + completion_tokens;

  const costos = costosPorModelo[modelo];
  if (!costos) throw new Error(`No hay información de costos para el modelo: ${modelo}`);

  const costoTotal = prompt_tokens * costos.prompt + completion_tokens * costos.completion;

  return {
    texto: textoRespuesta,
    costo: Number(costoTotal.toFixed(6)),
    tokens: tokensTotales,
  };
};
