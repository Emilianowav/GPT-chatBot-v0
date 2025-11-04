// 🕐 Utilidades para manejo de fechas y zonas horarias

/**
 * Convierte una fecha UTC a formato local para inputs de tipo datetime-local
 * @param fecha - Fecha en formato ISO string o Date
 * @returns String en formato YYYY-MM-DDTHH:mm para input datetime-local
 */
export function fechaUTCaLocal(fecha: string | Date): string {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
  
  // Obtener componentes en UTC (sin conversión de zona horaria)
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Convierte una fecha UTC a solo la parte de fecha para inputs de tipo date
 * @param fecha - Fecha en formato ISO string o Date
 * @returns String en formato YYYY-MM-DD
 */
export function fechaUTCaLocalDate(fecha: string | Date): string {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
  
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Convierte una fecha UTC a solo la parte de hora para inputs de tipo time
 * @param fecha - Fecha en formato ISO string o Date
 * @returns String en formato HH:mm
 */
export function fechaUTCaLocalTime(fecha: string | Date): string {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
  
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  
  return `${hours}:${minutes}`;
}

/**
 * Formatea una fecha para mostrar en la UI
 * @param fecha - Fecha en formato ISO string o Date
 * @param opciones - Opciones de formato
 * @returns String formateado
 */
export function formatearFecha(
  fecha: string | Date,
  opciones?: Intl.DateTimeFormatOptions
): string {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
  
  const opcionesDefault: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...opciones
  };
  
  return date.toLocaleDateString('es-AR', opcionesDefault);
}

/**
 * Formatea una hora para mostrar en la UI
 * @param fecha - Fecha en formato ISO string o Date
 * @returns String en formato HH:mm
 */
export function formatearHora(fecha: string | Date): string {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
  
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  
  return `${hours}:${minutes}`;
}

/**
 * Formatea fecha y hora juntos
 * @param fecha - Fecha en formato ISO string o Date
 * @returns String en formato "DD/MM/YYYY HH:mm"
 */
export function formatearFechaHora(fecha: string | Date): string {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
  
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}
