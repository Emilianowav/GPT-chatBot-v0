import { openai } from "../config/openai.js";
import type OpenAI from "openai";

export type ChatCompletionMessageParam = Parameters<
  OpenAI["chat"]["completions"]["create"]
>[0]["messages"][number];

export type ChatCompletionTool = OpenAI.Chat.Completions.ChatCompletionTool;

type ResultadoChat = {
  texto: string;
  costo: number;
  tokens: number; // total de tokens usados
  functionCall?: {
    name: string;
    arguments: Record<string, any>;
  };
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
  tools,
}: {
  promptBase?: string;
  mensajeUsuario?: string;
  modelo: string;
  historial?: ChatCompletionMessageParam[];
  tools?: ChatCompletionTool[];
}): Promise<ResultadoChat> => {
  const messages: ChatCompletionMessageParam[] = historial ?? [
    { role: "system", content: promptBase ?? "" },
    { role: "user", content: mensajeUsuario ?? "" },
  ];

  const completionParams: any = {
    model: modelo,
    messages,
    temperature: 0.7,
  };

  // Agregar tools si se proporcionan
  if (tools && tools.length > 0) {
    completionParams.tools = tools;
    completionParams.tool_choice = "auto";
  }

  const completion = await openai.chat.completions.create(completionParams);

  const message = completion.choices[0].message;
  const textoRespuesta = message.content ?? "";
  const usage = completion.usage;

  if (!usage) throw new Error("No se recibió información de uso de tokens.");

  const { prompt_tokens, completion_tokens } = usage;
  const tokensTotales = prompt_tokens + completion_tokens;

  const costos = costosPorModelo[modelo];
  if (!costos) throw new Error(`No hay información de costos para el modelo: ${modelo}`);

  const costoTotal = prompt_tokens * costos.prompt + completion_tokens * costos.completion;

  // Verificar si hay function call
  let functionCall: ResultadoChat['functionCall'] = undefined;
  if (message.tool_calls && message.tool_calls.length > 0) {
    const toolCall = message.tool_calls[0];
    if (toolCall.function) {
      functionCall = {
        name: toolCall.function.name,
        arguments: JSON.parse(toolCall.function.arguments || '{}')
      };
    }
  }

  return {
    texto: textoRespuesta || "Sin respuesta del modelo.",
    costo: Number(costoTotal.toFixed(6)),
    tokens: tokensTotales,
    functionCall,
  };
};
