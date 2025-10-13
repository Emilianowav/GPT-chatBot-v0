// 🏢 Utilidades de Empresa usando MongoDB
import { EmpresaModel } from '../models/Empresa.js';
import type { EmpresaConfig } from '../types/Types.js';

// Cache en memoria para optimizar consultas frecuentes
let empresasCache: Map<string, EmpresaConfig> | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

function normalizarTelefono(tel: string): string {
  return tel.replace(/\D/g, ''); // Elimina todo excepto dígitos
}

/**
 * Carga todas las empresas desde MongoDB
 */
export const cargarEmpresas = async (): Promise<EmpresaConfig[]> => {
  try {
    // Verificar si el cache es válido
    const ahora = Date.now();
    if (empresasCache && (ahora - cacheTimestamp) < CACHE_TTL) {
      console.log('📦 Usando cache de empresas');
      return Array.from(empresasCache.values());
    }

    console.log('🔄 Cargando empresas desde MongoDB...');
    const empresasDoc = await EmpresaModel.find({});
    
    if (empresasDoc.length === 0) {
      console.warn('⚠️ No hay empresas en la base de datos');
      return [];
    }

    const empresas = empresasDoc.map(e => e.toEmpresaConfig());
    
    // Actualizar cache
    empresasCache = new Map(
      empresas.map(e => [normalizarTelefono(e.telefono), e])
    );
    cacheTimestamp = ahora;
    
    console.log(`✅ ${empresas.length} empresas cargadas desde MongoDB`);
    return empresas;
  } catch (error) {
    console.error('❌ Error al cargar empresas desde MongoDB:', error);
    throw error;
  }
};

/**
 * Busca una empresa por su número de teléfono
 */
export const buscarEmpresaPorTelefono = async (telefono: string): Promise<EmpresaConfig | undefined> => {
  try {
    const telNormalizado = normalizarTelefono(telefono);
    
    // Intentar desde cache primero
    const ahora = Date.now();
    if (empresasCache && (ahora - cacheTimestamp) < CACHE_TTL) {
      const empresaCache = empresasCache.get(telNormalizado);
      if (empresaCache) {
        console.log('📦 Empresa encontrada en cache:', empresaCache.nombre);
        return empresaCache;
      }
    }

    // Buscar en MongoDB
    console.log('🔍 Buscando empresa en MongoDB por teléfono:', telNormalizado);
    const empresaDoc = await EmpresaModel.findOne({ 
      telefono: new RegExp(telNormalizado) 
    });

    if (!empresaDoc) {
      console.warn(`⚠️ Empresa no encontrada para el teléfono ${telefono} (${telNormalizado})`);
      return undefined;
    }

    const empresa = empresaDoc.toEmpresaConfig();
    
    // Actualizar cache
    if (!empresasCache) {
      empresasCache = new Map();
      cacheTimestamp = ahora;
    }
    empresasCache.set(telNormalizado, empresa);
    
    console.log('✅ Empresa encontrada:', empresa.nombre);
    return empresa;
  } catch (error) {
    console.error('❌ Error al buscar empresa por teléfono:', error);
    throw error;
  }
};

/**
 * Busca una empresa por su nombre
 */
export const buscarEmpresaPorNombre = async (nombre: string): Promise<EmpresaConfig | undefined> => {
  try {
    const empresaDoc = await EmpresaModel.findOne({ nombre });
    
    if (!empresaDoc) {
      console.warn(`⚠️ Empresa no encontrada: ${nombre}`);
      return undefined;
    }

    return empresaDoc.toEmpresaConfig();
  } catch (error) {
    console.error('❌ Error al buscar empresa por nombre:', error);
    throw error;
  }
};

/**
 * Obtiene el prompt de una empresa
 */
export const obtenerPromptEmpresa = async (telefono: string): Promise<string> => {
  const empresa = await buscarEmpresaPorTelefono(telefono);
  return empresa?.prompt || '¡Hola! ¿En qué puedo ayudarte?';
};

/**
 * Obtiene el path del catálogo de una empresa
 */
export const obtenerCatalogoPath = async (telefono: string): Promise<string | null> => {
  const empresa = await buscarEmpresaPorTelefono(telefono);
  return empresa?.catalogoPath || null;
};

/**
 * Invalida el cache de empresas (útil después de actualizaciones)
 */
export const invalidarCacheEmpresas = (): void => {
  empresasCache = null;
  cacheTimestamp = 0;
  console.log('🗑️ Cache de empresas invalidado');
};

/**
 * Crea o actualiza una empresa
 */
export const guardarEmpresa = async (empresa: EmpresaConfig): Promise<void> => {
  try {
    await EmpresaModel.findOneAndUpdate(
      { nombre: empresa.nombre },
      empresa,
      { upsert: true, new: true }
    );
    
    invalidarCacheEmpresas();
    console.log('✅ Empresa guardada:', empresa.nombre);
  } catch (error) {
    console.error('❌ Error al guardar empresa:', error);
    throw error;
  }
};
