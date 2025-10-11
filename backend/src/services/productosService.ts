/**
 * fileUtils.ts
 * 
 * Utilidad para leer archivos planos como catálogos o listas de productos.
 * Recibe una ruta y devuelve el contenido como string.
 */

import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const leerArchivoPlano = async (rutaRelativa: string): Promise<string> => {
  try {
    const rutaAbsoluta = path.resolve(__dirname, "../../", rutaRelativa);
    const contenido = await fs.readFile(rutaAbsoluta, "utf-8");
    return contenido;
  } catch (error) {
    console.error("❌ Error leyendo archivo plano:", error);
    return "";
  }
};
