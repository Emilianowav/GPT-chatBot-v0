// 🏢 Helpers para trabajar con configuración de empresas
import type { IEmpresa } from '../models/Empresa.js';

/**
 * Verifica si una empresa tiene un módulo activo
 */
export function tieneModuloActivo(empresa: IEmpresa, moduloId: string): boolean {
  if (!empresa.modulos || empresa.modulos.length === 0) {
    return false;
  }
  
  const modulo = empresa.modulos.find(m => m.id === moduloId && m.activo === true);
  return !!modulo;
}

/**
 * Obtiene la configuración de un módulo específico
 */
export function obtenerConfigModulo(empresa: IEmpresa, moduloId: string): any {
  if (!empresa.modulos || empresa.modulos.length === 0) {
    return null;
  }
  
  const modulo = empresa.modulos.find(m => m.id === moduloId && m.activo === true);
  return modulo?.configuracion || null;
}

/**
 * Verifica si la empresa tiene Mercado Pago habilitado
 */
export function tieneMercadoPagoActivo(empresa: IEmpresa): boolean {
  return tieneModuloActivo(empresa, 'mercadopago');
}

/**
 * Obtiene el prefijo de slug para payment links según la empresa
 */
export function obtenerSlugPrefix(empresa: IEmpresa): string {
  const configMP = obtenerConfigModulo(empresa, 'mercadopago');
  
  // Si tiene configuración de slug prefix, usarla
  if (configMP?.slugPrefix) {
    return configMP.slugPrefix;
  }
  
  // Fallback: generar desde nombre de empresa
  // "Veo Veo" -> "veo-", "JFC Techno" -> "jfc-"
  const nombreLimpio = empresa.nombre.toLowerCase()
    .split(' ')[0]  // Tomar primera palabra
    .replace(/[^a-z0-9]/g, '');  // Quitar caracteres especiales
  
  return nombreLimpio ? `${nombreLimpio}-` : '';
}

/**
 * Obtiene instrucciones de búsqueda personalizadas para GPT
 */
export function obtenerInstruccionesBusqueda(empresa: IEmpresa): string {
  // Si la empresa tiene instrucciones personalizadas, usarlas
  const gptConfig = (empresa as any).gptConfig;
  if (gptConfig?.searchInstructions) {
    return gptConfig.searchInstructions;
  }
  
  // Instrucciones por defecto
  return `BÚSQUEDA INTELIGENTE:
- Cuando el usuario mencione un producto, busca coincidencias parciales en el catálogo
- Si hay múltiples coincidencias, muestra las opciones
- Si no hay coincidencia exacta, sugiere el producto más similar
- Mantén el contexto de productos mencionados anteriormente`;
}

/**
 * Obtiene instrucciones de pago personalizadas para GPT
 */
export function obtenerInstruccionesPago(empresa: IEmpresa, productosInfo: string): string {
  // Si la empresa tiene instrucciones personalizadas, usarlas
  const gptConfig = (empresa as any).gptConfig;
  if (gptConfig?.paymentInstructions) {
    return gptConfig.paymentInstructions.replace('{{productos}}', productosInfo);
  }
  
  // Instrucciones por defecto
  return `--- INSTRUCCIONES DE PAGO ---
CATÁLOGO DE PRODUCTOS:
${productosInfo}

PROCESO DE COMPRA:
1. Usuario menciona producto → Confirmar producto encontrado y precio
2. Preguntar cantidad (si aplica)
3. Mostrar total
4. Cuando confirme pago, USA generate_payment_link con:
   - title: nombre del producto
   - amount: precio total (precio unitario × cantidad)
   - description: detalle de la compra

TRIGGERS de pago: "quiero pagar", "confirmo", "listo", "comprar", "proceder"

IMPORTANTE:
- NO pidas email ni dirección
- Sé directo al generar el link cuando el cliente confirme
- Mantén el contexto de productos mencionados anteriormente`;
}

/**
 * Obtiene reglas anti-loop para el prompt
 */
export function obtenerReglasAntiLoop(empresa: IEmpresa): string {
  // Si la empresa tiene reglas personalizadas, usarlas
  const gptConfig = (empresa as any).gptConfig;
  if (gptConfig?.antiLoopRules === false) {
    return ''; // Empresa deshabilitó reglas anti-loop
  }
  
  if (gptConfig?.contextRules && gptConfig.contextRules.length > 0) {
    return '\n\n--- REGLAS DE CONVERSACIÓN ---\n' + gptConfig.contextRules.join('\n');
  }
  
  // Reglas por defecto
  return `

--- REGLAS DE CONVERSACIÓN ---
- Si el usuario ya te saludó en esta conversación, NO vuelvas a saludarlo
- Si el usuario dice "hola" repetidamente, pregúntale directamente en qué puedes ayudarlo
- Mantén el contexto de la conversación anterior
- Si el usuario pide "volver al menú" o "flujo principal", pregúntale qué necesita específicamente
- No repitas información que ya diste en mensajes anteriores de esta conversación`;
}

/**
 * Obtiene ejemplos de productos para el prompt (ayuda a GPT a entender el contexto)
 */
export function obtenerEjemplosProductos(empresa: IEmpresa): string[] {
  const gptConfig = (empresa as any).gptConfig;
  if (gptConfig?.productExamples && gptConfig.productExamples.length > 0) {
    return gptConfig.productExamples;
  }
  
  // Por defecto, vacío (se llenará con productos reales del catálogo)
  return [];
}
