// src/config/openai.ts
import dotenv from "dotenv";
dotenv.config();
import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error("❌ Falta la variable de entorno OPENAI_API_KEY");
}

export const openai = new OpenAI({ apiKey });
