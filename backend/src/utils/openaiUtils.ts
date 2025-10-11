// src/utils/openaiUtils.ts

import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) throw new Error("Falta la variable OPENAI_API_KEY");

const openai = new OpenAI({ apiKey });

export const chatCompletion = async (
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  model = "gpt-3.5-turbo"
): Promise<string> => {
  const completion = await openai.chat.completions.create({
    model,
    messages,
    temperature: 0.3,
  });

  return completion.choices[0].message.content ?? "Lo siento, no pude generar una respuesta.";
};
