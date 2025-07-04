import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { EmpresaConfig } from "../types/Types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const empresasPath = path.resolve(__dirname, '../data/empresas.json');

function normalizarTelefono(tel: string): string {
  return tel.replace(/\D/g, ''); // Elimina todo excepto dígitos
}

// Cache en memoria
let empresasCache: EmpresaConfig[] | null = null;
let mapaEmpresasPorTelefono: Map<string, EmpresaConfig> | null = null;

export const cargarEmpresas = (): EmpresaConfig[] => {
  
  if (empresasCache) return empresasCache;

  const raw = fs.readFileSync(empresasPath, 'utf-8');
  const data = JSON.parse(raw);

  if (!Array.isArray(data)) {
    console.error('❌ Error: empresas.json no es un array:', data);
    throw new Error('empresas.json debe ser un array');
  }

  // Validación básica
  for (const empresa of data) {
    if (!empresa.telefono || !empresa.nombre || !empresa.phoneNumberId) {
      throw new Error(`Empresa mal configurada: ${JSON.stringify(empresa)}`);
    }
  }

  empresasCache = data;
  mapaEmpresasPorTelefono = new Map(
    data.map((e: EmpresaConfig) => [normalizarTelefono(e.telefono), e])
  );

  return empresasCache;
};

export const buscarEmpresaPorTelefono = (telefono: string): EmpresaConfig | undefined => {
  if (!mapaEmpresasPorTelefono) cargarEmpresas();

  const telNormalizado = normalizarTelefono(telefono);
  const empresa = mapaEmpresasPorTelefono!.get(telNormalizado);

  if (!empresa) {
    console.warn(`⚠️ Empresa no encontrada para el teléfono ${telefono} (${telNormalizado})`);
  }

  return empresa;
};

export const obtenerPromptEmpresa = (telefono: string): string => {
  const empresa = buscarEmpresaPorTelefono(telefono);
  return empresa?.prompt || '¡Hola! ¿En qué puedo ayudarte?';
};

export const obtenerCatalogoPath = (telefono: string): string | null => {
  const empresa = buscarEmpresaPorTelefono(telefono);
  return empresa?.catalogoPath || null;
};
