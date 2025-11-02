// 📞 Utilidades para normalización de teléfonos

/**
 * Normaliza un número de teléfono eliminando todos los caracteres no numéricos
 * 
 * @param telefono - Número de teléfono en cualquier formato
 * @returns Número de teléfono solo con dígitos (sin +, espacios, guiones, etc.)
 * 
 * @example
 * normalizarTelefono('+54 9 379 494-6066') // '5493794946066'
 * normalizarTelefono('5493794946066')      // '5493794946066'
 */
export function normalizarTelefono(telefono: string): string {
  return telefono.replace(/\D/g, '');
}

/**
 * Compara dos números de teléfono normalizados
 * 
 * @param telefono1 - Primer número de teléfono
 * @param telefono2 - Segundo número de teléfono
 * @returns true si son el mismo número (después de normalizar)
 * 
 * @example
 * sonMismoTelefono('+543794946066', '5493794946066') // true
 */
export function sonMismoTelefono(telefono1: string, telefono2: string): boolean {
  return normalizarTelefono(telefono1) === normalizarTelefono(telefono2);
}
